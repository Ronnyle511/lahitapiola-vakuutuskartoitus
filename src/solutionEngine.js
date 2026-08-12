import { coverageModels, insuranceTypes } from "./data.js";
import { businessIndustries, businessPlaybooks, businessRelevantNeedOptions, businessRiskAreaPlaybooks, companySizeClasses, employeeBandAliases, industryAliases, mandatoryInsuranceRules, privatePlaybooks, privateRelevantNeedOptions } from "./solutionData.js";

const businessBaseNeedOptions = [
  { id: "people_risk", baseQuestionId: "hasEmployees", affects: ["bizPeople"] },
  { id: "business_travel", baseQuestionId: "businessTravelNeed", affects: ["bizTravel", "bizPeople"] },
  { id: "property_or_assets", baseQuestionId: "hasPremises", affects: ["bizProperty", "bizInterruption"] },
  { id: "property_or_assets", baseQuestionId: "hasBusinessAssets", affects: ["bizProperty"] },
  { id: "owns_business_property", baseQuestionId: "ownsBusinessProperty", affects: ["bizRealEstate", "bizProperty", "bizInterruption"] },
  { id: "vehicles_or_transport", baseQuestionId: "hasVehicles", affects: ["bizVehicle"] },
  { id: "system_dependency", baseQuestionId: "digitalDependency", affects: ["bizCyber", "bizInterruption"] }
];

const personalBaseNeedOptions = [
  { id: "children_health", baseQuestionId: "hasChildren", affects: ["health", "life"] },
  { id: "vehicle", baseQuestionId: "hasPersonalVehicle", affects: ["vehicle"] },
  { id: "travel", baseQuestionId: "travelsRegularly", affects: ["travel"] },
  { id: "health", baseQuestionId: "healthCoverInterest", affects: ["health"] },
  { id: "family_financial_security", baseQuestionId: "financialDependents", affects: ["life"] },
  { id: "pet", baseQuestionId: "hasPets", affects: ["pet"] },
  { id: "valuable_hobbies", baseQuestionId: "valuableOrLeisureProperty", affects: ["home"] },
  { id: "cottage_forest_boat", baseQuestionId: "valuableOrLeisureProperty", affects: ["apartment", "forest", "boat"] }
];

export function normalizeEmployeeBand(value) {
  return employeeBandAliases[value] || "solo";
}

export function normalizeIndustry(value) {
  return industryAliases[value] || "other";
}

export function getCompanySizeClass(employeeBand) {
  return normalizeEmployeeBand(employeeBand);
}

export function getBusinessFlow(profile) {
  if (profile.sizeClass === "large") return "direct_expert_contact";
  if (profile.sizeClass === "mid") return "risk_area_discussion";
  return "solution_package";
}

export function relevantNeedOptions(mode, state = {}) {
  if (mode === "personal") return privateRelevantNeedOptions;
  const industryKey = normalizeIndustry(state.baseAnswers?.industry);
  const playbook = businessPlaybooks[industryKey] || businessPlaybooks.other;
  const group = playbook.relevantGroup || "generic";
  const options = businessRelevantNeedOptions[group] || businessRelevantNeedOptions.generic;
  return [...options, { id: "unsure", label: "En osaa sanoa", affects: [] }];
}

export function buildAssessmentResult(mode, state = {}, legacyRecommendation = null) {
  const result = mode === "business"
    ? buildBusinessAssessmentResult(state, legacyRecommendation)
    : buildPrivateAssessmentResult(state, legacyRecommendation);
  return refreshDerivedAssessmentData(result, state);
}

export function buildBusinessAssessmentResult(state = {}, legacyRecommendation = null) {
  const industryKey = normalizeIndustry(state.baseAnswers?.industry);
  const inferredEmployeeBand = state.baseAnswers?.employeeCount || (state.baseAnswers?.hasEmployees === "yes" ? "1_10" : "solo");
  const sizeClass = getCompanySizeClass(inferredEmployeeBand);
  const industry = businessIndustries.find((item) => item.value === industryKey)?.label || businessIndustries.at(-1).label;
  const baseRelevantNeeds = businessBaseRelevantNeeds(state.baseAnswers);
  const employeeStatus = state.baseAnswers?.hasEmployees || (sizeClass === "solo" ? "no" : "yes");
  const hasEmployees = employeeStatus === "yes";
  const entrepreneurWorks = state.baseAnswers?.entrepreneurWorks === "yes"
    ? true
    : state.baseAnswers?.entrepreneurWorks === "no"
      ? false
      : undefined;
  const vehicleAnswer = state.baseAnswers?.hasVehicles;
  const hasVehicles = vehicleAnswer === "yes"
    ? true
    : vehicleAnswer === "no"
      ? false
      : state.quickAnswers?.vehicles === "yes"
        || state.selectedRelevantNeeds?.includes("vehicles_or_transport")
        || baseRelevantNeeds.includes("vehicles_or_transport")
        || ["logistics", "automotive"].includes(industryKey);
  const profile = {
    customerType: "business",
    industryKey,
    industry,
    sizeClass,
    employeeBand: state.baseAnswers?.employeeCount
      ? companySizeClasses[sizeClass]
      : hasEmployees
        ? "Työntekijöitä"
        : state.baseAnswers?.hasEmployees === "unsure"
          ? "Työntekijätilanne epäselvä"
          : "Ei työntekijöitä",
    hasEmployees,
    employeeStatus,
    entrepreneurWorks,
    hasVehicles
  };
  const flowType = getBusinessFlow(profile);
  const playbook = businessPlaybooks[industryKey] || businessPlaybooks.other;
  const selectedRelevantNeeds = uniqueStrings([...baseRelevantNeeds, ...(state.selectedRelevantNeeds || [])]);
  const needOptions = [...relevantNeedOptions("business", state), ...businessBaseNeedOptions];
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
  const selectedNeedCovers = [...affectedKeys]
    .filter((key) => key !== "all" && insuranceTypes.business[key])
    .map((key) => ({
      key,
      reason: "Vastaustesi perusteella tämä vakuutusalue kannattaa avata ymmärrettävästi.",
      defaultCoverageKey: ""
    }));
  const recommendedCovers = uniqueCovers([...(playbook.recommendedCovers || []), ...activatedOptional, ...selectedNeedCovers])
    .filter((item) => !businessCoverExplicitlyExcluded(item.key, state, selectedRelevantNeeds));
  const riskAreas = flowType === "risk_area_discussion"
    ? businessRiskAreaPlaybooks.generic.riskAreas
    : [];

  return {
    mode: "business",
    profile,
    flowType,
    title: flowType === "solution_package" ? playbook.title : flowType === "risk_area_discussion" ? businessRiskAreaPlaybooks.generic.title : "Räätälöity yritysvakuutusten kokonaisuus",
    summary: playbook.summary,
    legacyRecommendation,
    mandatoryChecks: applyMandatoryRules(profile),
    recommendedCovers: flowType === "solution_package" ? recommendedCovers : [],
    optionalCovers: flowType === "solution_package" ? optionalCovers : [],
    riskAreas,
    selectedRelevantNeeds,
    selectedCoverageLevels: {},
    sellerDiscussionPoints: flowType === "direct_expert_contact"
      ? ["Nykyinen vakuutusohjelma ja uusimisajankohta", "Toimipaikat ja omaisuusarvot", "Sopimus- ja kansainväliset vastuut", "Henkilöstö, toimitusketjut ja mahdollinen vakuutusmeklari"]
      : riskAreas.map((item) => item.title)
  };
}

export function buildPrivateAssessmentResult(state = {}, legacyRecommendation = null) {
  const vehicleAnswer = state.baseAnswers?.hasPersonalVehicle;
  const profile = {
    customerType: "personal",
    ageGroup: state.baseAnswers?.ageGroup || "",
    livingType: state.baseAnswers?.livingType || "",
    lifeSituation: state.baseAnswers?.lifeSituation || "",
    hasVehicles: vehicleAnswer === "yes"
      || (!vehicleAnswer && (state.selectedRelevantNeeds || []).includes("vehicle"))
  };
  const priorityKey = profile.lifeSituation === "entrepreneur"
    ? "private_entrepreneur"
    : profile.ageGroup === "over65" || profile.lifeSituation === "retired"
      ? "senior"
      : "";
  const playbook = (priorityKey ? privatePlaybooks.find((item) => item.key === priorityKey) : null)
    || privatePlaybooks.find((item) => item.matches(profile))
    || privatePlaybooks.at(-1);
  const baseRelevantNeeds = personalBaseRelevantNeeds(state.baseAnswers);
  const selectedRelevantNeeds = uniqueStrings([...baseRelevantNeeds, ...(state.selectedRelevantNeeds || [])]);
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
    mandatoryChecks: applyMandatoryRules(profile),
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
    .map(({ id, name, text, obligationKind, badgeLabel }) => ({ id, name, text, obligationKind, badgeLabel }));
}

export function refreshDerivedAssessmentData(result, state = {}) {
  const next = {
    ...result,
    selectedRelevantNeeds: uniqueStrings([
      ...(result.selectedRelevantNeeds || []),
      ...(state.selectedRelevantNeeds || []),
      ...(result.mode === "business"
        ? businessBaseRelevantNeeds(state.baseAnswers)
        : personalBaseRelevantNeeds(state.baseAnswers))
    ])
  };
  next.selectedCoverageLevels = buildCoverageLevelRecommendations(next, state.detailResults || {}, state.selectedCoverage || {});
  next.contactSummary = buildContactSummary(next);
  next.aiContext = buildAiContext(next);
  return next;
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
    const rawSelectedKeys = Array.isArray(selectedCoverage[detailKey])
      ? selectedCoverage[detailKey]
      : selectedCoverage[detailKey]
        ? [selectedCoverage[detailKey]]
        : [];
    const validSelectedKeys = [...new Set(rawSelectedKeys)]
      .filter((key) => model.options.some((option) => option.key === key));
    const chosenKeys = model.selectionMode === "multiple" ? validSelectedKeys : validSelectedKeys.slice(0, 1);
    const chosen = chosenKeys.length > 0;
    const machineKey = detailComparison?.recommendedKeys?.[0]
      || findCoverageKey(model.options, coverItem.defaultCoverageKey)
      || model.options[0].key;
    const selectedKey = chosenKeys[0] || machineKey;
    const selectedOption = model.options.find((option) => option.key === selectedKey) || model.options[0];
    const selectedOptions = chosenKeys
      .map((key) => model.options.find((option) => option.key === key))
      .filter(Boolean);
    const machineOption = model.options.find((option) => option.key === machineKey) || model.options[0];
    levels[coverItem.key] = {
      detailKey,
      machineKey,
      machineTitle: machineOption.title,
      selectedKey,
      selectedKeys: chosen ? chosenKeys : [selectedKey],
      selectedTitle: chosen ? selectedOptions.map((option) => option.title).join(", ") : selectedOption.title,
      selectedTitles: chosen ? selectedOptions.map((option) => option.title) : [selectedOption.title],
      basis: detailComparison?.basis || coverItem.reason || "Ehdotus perustuu asiakasprofiiliin ja valittuihin tilanteisiin.",
      refined,
      chosen
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
    result.riskAreas?.length ? `Riskialueet: ${result.riskAreas.map((item) => item.title).join(", ")}` : "",
    "Lopullinen sisältö ja soveltuvuus varmistetaan vakuutusehdoista, LähiTapiolan palvelussa tai asiantuntijan kanssa."
  ].filter(Boolean).join("\n");
}

function uniqueCovers(covers) {
  const byKey = new Map();
  covers.filter((item) => item?.key).forEach((item) => {
    if (!byKey.has(item.key)) byKey.set(item.key, item);
  });
  return [...byKey.values()];
}

function businessCoverExplicitlyExcluded(key, state = {}, selectedRelevantNeeds = []) {
  const base = state.baseAnswers || {};
  const selected = new Set(selectedRelevantNeeds);
  if (key === "bizVehicle") return base.hasVehicles === "no" && !selected.has("vehicles_or_transport");
  if (key === "bizTravel") return base.businessTravelNeed === "no" && !selected.has("business_travel");
  if (key === "bizCyber") return base.digitalDependency === "no" && !selected.has("system_dependency");
  if (key === "bizProperty") {
    return [base.ownsBusinessProperty, base.hasPremises, base.hasBusinessAssets].every((answer) => answer === "no")
      && !selected.has("property_or_assets");
  }
  if (key === "bizPeople") {
    return base.hasEmployees === "no" && base.entrepreneurWorks === "no"
      && !selected.has("people_risk") && !selected.has("owner_key_person");
  }
  return false;
}

function businessBaseRelevantNeeds(baseAnswers = {}) {
  return uniqueStrings(
    businessBaseNeedOptions
      .filter((item) => baseAnswers?.[item.baseQuestionId] === "yes")
      .map((item) => item.id)
  );
}

function personalBaseRelevantNeeds(baseAnswers = {}) {
  return uniqueStrings(
    personalBaseNeedOptions
      .filter((item) => baseAnswers?.[item.baseQuestionId] === "yes")
      .map((item) => item.id)
  );
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
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
    risk_area_discussion: "Riskialuekartoitus",
    direct_expert_contact: "Suora asiantuntijaohjaus",
    personal_solution_package: "Elämäntilannepaketti"
  }[flowType] || flowType;
}
