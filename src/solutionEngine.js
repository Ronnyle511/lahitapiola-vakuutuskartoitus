import { coverageModels, insuranceTypes } from "./data.js";
import { businessIndustries, businessPlaybooks, businessRelevantNeedOptions, companySizeClasses, employeeBandAliases, industryAliases, mandatoryInsuranceRules, privatePlaybooks, privateRelevantNeedOptions } from "./solutionData.js";

export function normalizeEmployeeBand(value) {
  return employeeBandAliases[value] || "solo";
}

export function normalizeIndustry(value) {
  return industryAliases[value] || "other";
}

export function getCompanySizeClass(employeeBand) {
  return normalizeEmployeeBand(employeeBand);
}

export function relevantNeedOptions(mode, state = {}) {
  if (mode === "personal") return privateRelevantNeedOptions;
  const industryKey = normalizeIndustry(state.baseAnswers?.industry);
  const playbook = businessPlaybooks[industryKey] || businessPlaybooks.other;
  const group = playbook.relevantGroup || "generic";
  const options = businessRelevantNeedOptions[group] || businessRelevantNeedOptions.generic;
  return [...options, { id: "current_cover_unclear", label: "Nykyinen vakuutusturva on epäselvä tai haluan tarkistaa riittävyyden", affects: ["all"] }, { id: "unsure", label: "En osaa sanoa", affects: [] }];
}

export function buildAssessmentResult(mode, state = {}, legacyRecommendation = null) {
  const result = mode === "business"
    ? buildBusinessAssessmentResult(state, legacyRecommendation)
    : buildPrivateAssessmentResult(state, legacyRecommendation);
  return refreshDerivedAssessmentData(result, state);
}

export function buildBusinessAssessmentResult(state = {}, legacyRecommendation = null) {
  const industryKey = normalizeIndustry(state.baseAnswers?.industry);
  const sizeClass = getCompanySizeClass(state.baseAnswers?.employeeCount);
  const industry = businessIndustries.find((item) => item.value === industryKey)?.label || businessIndustries.at(-1).label;
  const profile = {
    industryKey,
    industry,
    sizeClass,
    employeeBand: companySizeClasses[sizeClass],
    hasEmployees: sizeClass !== "solo",
    entrepreneurWorks: sizeClass === "solo",
    hasVehicles: state.quickAnswers?.vehicles === "yes"
      || state.selectedRelevantNeeds?.includes("vehicles_or_transport")
      || ["logistics", "automotive"].includes(industryKey)
  };
  const flowType = "solution_package";
  const playbook = businessPlaybooks[industryKey] || businessPlaybooks.other;
  const selectedRelevantNeeds = [...(state.selectedRelevantNeeds || [])];
  const needOptions = relevantNeedOptions("business", state);
  const selectedNeedOptions = needOptions.filter((item) => selectedRelevantNeeds.includes(item.id));
  const affectedKeys = new Set(selectedNeedOptions.flatMap((item) => item.affects || []));
  const optionalCovers = (playbook.optionalCovers || []).map((item) => ({
    ...item,
    active: affectedKeys.has("all") || affectedKeys.has(item.key) || item.relevantNeedIds?.some((id) => selectedRelevantNeeds.includes(id))
  }));
  const activatedOptional = optionalCovers.filter((item) => item.active).map((item) => ({
    key: item.key,
    reason: item.condition,
    defaultCoverageKey: item.defaultCoverageKey
  }));
  const recommendedCovers = uniqueCovers([...(playbook.recommendedCovers || []), ...activatedOptional]);
  const riskAreas = [];

  return {
    mode: "business",
    profile,
    flowType,
    title: playbook.title,
    summary: playbook.summary,
    legacyRecommendation,
    mandatoryChecks: applyMandatoryRules(profile),
    recommendedCovers,
    optionalCovers,
    riskAreas,
    selectedRelevantNeeds,
    selectedCoverageLevels: {},
    sellerDiscussionPoints: []
  };
}

export function buildPrivateAssessmentResult(state = {}, legacyRecommendation = null) {
  const profile = {
    ageGroup: state.baseAnswers?.ageGroup || "",
    livingType: state.baseAnswers?.livingType || "",
    lifeSituation: state.baseAnswers?.lifeSituation || ""
  };
  const priorityKey = profile.lifeSituation === "entrepreneur"
    ? "private_entrepreneur"
    : profile.ageGroup === "over65" || profile.lifeSituation === "retired"
      ? "senior"
      : "";
  const playbook = (priorityKey ? privatePlaybooks.find((item) => item.key === priorityKey) : null)
    || privatePlaybooks.find((item) => item.matches(profile))
    || privatePlaybooks.at(-1);
  const selectedRelevantNeeds = [...(state.selectedRelevantNeeds || [])];
  const affectedKeys = new Set(
    privateRelevantNeedOptions
      .filter((item) => selectedRelevantNeeds.includes(item.id))
      .flatMap((item) => item.affects || [])
  );
  const inferred = [];
  if (affectedKeys.has("all")) {
    inferred.push(...["vehicle", "travel", "pet", "apartment", "life"].map((key) => ({ key, reason: "Halusit tarkistaa nykyisen vakuutusturvan riittävyyden.", defaultCoverageKey: "" })));
  } else {
    affectedKeys.forEach((key) => {
      if (insuranceTypes.personal[key]) {
        inferred.push({
          key,
          reason: selectedRelevantNeeds.length ? "Valitsit tämän tilanteen vapaaehtoisessa tarkennuksessa." : "",
          defaultCoverageKey: defaultPersonalCoverageKey(key)
        });
      }
    });
  }

  const recommendedCovers = uniqueCovers([...(playbook.recommendedCovers || []), ...inferred]);
  const recommendedKeys = new Set(recommendedCovers.map((item) => item.key));
  const optionalCovers = privateRelevantNeedOptions
    .flatMap((item) => item.affects || [])
    .filter((key) => key !== "all" && insuranceTypes.personal[key] && !recommendedKeys.has(key))
    .filter((key, index, all) => all.indexOf(key) === index)
    .map((key) => ({
      key,
      condition: optionalPersonalCondition(key),
      active: affectedKeys.has(key),
      defaultCoverageKey: defaultPersonalCoverageKey(key)
    }));

  return {
    mode: "personal",
    profile,
    flowType: "personal_solution_package",
    title: playbook.title,
    summary: playbook.summary,
    legacyRecommendation,
    mandatoryChecks: [],
    recommendedCovers,
    optionalCovers,
    riskAreas: [],
    selectedRelevantNeeds,
    selectedCoverageLevels: {},
    sellerDiscussionPoints: []
  };
}

export function applyMandatoryRules(profile) {
  return mandatoryInsuranceRules
    .filter((rule) => rule.appliesIf(profile))
    .map(({ id, name, purpose, text }) => ({ id, name, purpose, text }));
}

export function refreshDerivedAssessmentData(result, state = {}) {
  const next = {
    ...result,
    selectedRelevantNeeds: [...(state.selectedRelevantNeeds || result.selectedRelevantNeeds || [])]
  };
  next.selectedCoverageLevels = buildCoverageLevelRecommendations(next, state.detailResults || {}, state.selectedCoverage || {});
  next.nonRelevantCovers = buildNonRelevantCovers(next);
  next.contactSummary = buildContactSummary(next);
  next.aiContext = buildAiContext(next);
  return next;
}

export function buildNonRelevantCovers(result) {
  const shownKeys = new Set([
    ...(result.recommendedCovers || []).map((item) => item.key),
    ...(result.optionalCovers || []).map((item) => item.key)
  ]);
  return Object.keys(insuranceTypes[result.mode] || {})
    .filter((key) => !shownKeys.has(key))
    .map((key) => ({
      key,
      reason: "Tämä vakuutusalue ei noussut antamiesi tietojen perusteella ajankohtaiseksi. Voit silti avata sen tarkistettavaksi."
    }));
}

export function buildCoverageLevelRecommendations(result, detailResults = {}, selectedCoverage = {}) {
  const levels = {};
  const covers = uniqueCovers([
    ...(result.recommendedCovers || []),
    ...(result.optionalCovers || []).filter((item) => item.active)
  ]);

  covers.forEach((coverItem) => {
    const meta = insuranceTypes[result.mode]?.[coverItem.key];
    const detailKey = meta?.detailFlow;
    const model = detailKey ? coverageModels[result.mode]?.[detailKey] : null;
    if (!model?.options?.length) return;
    const detailComparison = detailResults[detailKey]?.comparison;
    const refined = Boolean(detailComparison);
    const machineKey = detailComparison?.recommendedKeys?.[0]
      || findCoverageKey(model.options, coverItem.defaultCoverageKey)
      || model.options[0].key;
    const selectedKey = selectedCoverage[detailKey] && model.options.some((option) => option.key === selectedCoverage[detailKey])
      ? selectedCoverage[detailKey]
      : machineKey;
    const selectedOption = model.options.find((option) => option.key === selectedKey) || model.options[0];
    const machineOption = model.options.find((option) => option.key === machineKey) || model.options[0];
    levels[coverItem.key] = {
      detailKey,
      machineKey,
      machineTitle: machineOption.title,
      selectedKey,
      selectedTitle: selectedOption.title,
      basis: detailComparison?.basis || coverItem.reason || "Ehdotus perustuu asiakasprofiiliin ja valittuihin tilanteisiin.",
      refined
    };
  });
  return levels;
}

export function buildAiContext(result) {
  return {
    mode: result.mode,
    flowType: result.flowType,
    profile: result.profile,
    packageTitle: result.title,
    packageSummary: result.summary,
    mandatoryChecks: result.mandatoryChecks || [],
    recommendedCovers: result.recommendedCovers || [],
    activeOptionalCovers: (result.optionalCovers || []).filter((item) => item.active),
    nonRelevantCovers: result.nonRelevantCovers || [],
    riskAreas: result.riskAreas || [],
    selectedRelevantNeeds: result.selectedRelevantNeeds || [],
    selectedCoverageLevels: result.selectedCoverageLevels || {},
    sellerDiscussionPoints: result.sellerDiscussionPoints || []
  };
}

export function buildContactSummary(result) {
  const coverTitles = (result.recommendedCovers || [])
    .map((item) => insuranceTypes[result.mode]?.[item.key]?.title || item.key);
  const activeOptionalTitles = (result.optionalCovers || [])
    .filter((item) => item.active)
    .map((item) => insuranceTypes[result.mode]?.[item.key]?.title || item.key);
  return [
    `Kartoituksen tyyppi: ${flowLabel(result.flowType)}`,
    result.mode === "business"
      ? `Profiili: ${result.profile.industry}, ${result.profile.employeeBand}`
      : `Profiili: ${result.profile.ageGroup || "ikäryhmä ei tiedossa"}, ${result.profile.livingType || "asumismuoto ei tiedossa"}, ${result.profile.lifeSituation || "elämäntilanne ei tiedossa"}`,
    coverTitles.length ? `Suositellut vakuutusalueet: ${coverTitles.join(", ")}` : "",
    activeOptionalTitles.length ? `Tilanteesta riippuvat valinnat: ${activeOptionalTitles.join(", ")}` : "",
    result.riskAreas?.length ? `Riskialueet: ${result.riskAreas.map((item) => item.title).join(", ")}` : ""
  ].filter(Boolean).join("\n");
}

function uniqueCovers(covers) {
  const byKey = new Map();
  covers.filter((item) => item?.key).forEach((item) => {
    if (!byKey.has(item.key)) byKey.set(item.key, item);
  });
  return [...byKey.values()];
}

function findCoverageKey(options, preferredKey) {
  if (!preferredKey) return "";
  if (options.some((option) => option.key === preferredKey)) return preferredKey;
  const text = String(preferredKey).toLocaleLowerCase("fi-FI");
  if (text === "broad") return options.find((option) => /laaja|pro/i.test(option.key))?.key || "";
  if (text === "basic") return options.find((option) => /perus|standard|sairauslaaja/i.test(option.key))?.key || "";
  return "";
}

function defaultPersonalCoverageKey(key) {
  return {
    home: "laaja",
    vehicle: "laaja",
    travel: "jatkuva",
    health: "sairausLaaja",
    life: "kuolemanvara",
    pet: "elainlaakari",
    apartment: "laaja",
    liability: "home_bundle"
  }[key] || "";
}

function optionalPersonalCondition(key) {
  return {
    vehicle: "Jos käytössäsi on auto tai muu ajoneuvo.",
    travel: "Jos matkustat kotimaassa tai ulkomailla.",
    life: "Jos läheisten talous tai velat riippuvat tuloistasi.",
    pet: "Jos taloudessa on koira tai kissa.",
    apartment: "Jos omistat mökin tai vapaa-ajan asunnon.",
    liability: "Jos haluat tarkistaa arjen vastuu- ja oikeusturvat."
  }[key] || "Jos tämä vakuutusalue liittyy tilanteeseesi.";
}

function flowLabel(flowType) {
  return {
    solution_package: "Ratkaisupaketti",
    personal_solution_package: "Elämäntilannepaketti"
  }[flowType] || flowType;
}
