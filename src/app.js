import { baseQuestions, coverageModels, detailFlows, getOptionLabel, insuranceTypes, profiles, quickQuestions } from "./data.js";
import { buildDetailResult } from "./detailResults.js";
import { calculateScores, recommendedKeys, toArray } from "./scoring.js";
import { buildAssessmentResult, relevantNeedOptions } from "./solutionEngine.js";
import { track } from "./analytics.js";

const $ = (id) => document.getElementById(id);
const views = ["introView", "baseInfoView", "questionView", "resultsView", "detailView", "detailResultView", "contactView", "summaryView"];
const steps = ["step1", "step2", "step3", "step4"];
const STORAGE_KEY = "lahitapiola-vakuutuskartoitus-v5";
const STORAGE_VERSION = 1;
const recommendationAreaOrder = {
  personal: ["home", "health", "life", "vehicle", "travel", "pet", "apartment", "liability", "boat", "forest"],
  business: ["bizProperty", "bizLiability", "bizPeople", "bizVehicle", "bizCyber", "bizInterruption", "bizCargo", "bizLegal", "bizRealEstate", "bizPatient", "bizConstruction", "bizTravel"]
};

let mode = "personal";
let savedView = "results";
let appReady = false;
let restoredFromStorage = false;
let persistedAt = "";
const states = {
  personal: freshState(),
  business: freshState()
};

function freshState() {
  return {
    baseAnswers: {},
    quickIndex: 0,
    quickAnswers: {},
    recommendation: null,
    recommendationRefined: false,
    assessmentResult: null,
    selectedRelevantNeeds: [],
    contactSummary: "",
    aiContext: null,
    selectedContact: {},
    activeDetail: null,
    detailIndex: 0,
    detailAnswers: {},
    detailResults: {},
    selectedCoverage: {},
    comparisonPairs: {},
    comparisonOnlyDifferences: {},
    comparisonExpanded: {},
    contactSelectionInitialized: false,
    contact: {},
    crmSummaryCreated: false,
    chatMessages: [],
    chatEscalated: false,
    chatExpanded: false
  };
}

function st() {
  return states[mode];
}

function profile() {
  return profiles[mode];
}

function types() {
  return insuranceTypes[mode];
}

function flow(key) {
  return detailFlows[mode]?.[key];
}

function activeQuickQuestions() {
  return activeQuestions(quickQuestions[mode] || []);
}

function activeDetailQuestions(detailKey) {
  return activeQuestions(flow(detailKey)?.questions || [], detailKey);
}

function activeQuestions(questions = [], detailKey = "") {
  return questions.filter((question) => shouldShowQuestion(question, detailKey));
}

function shouldShowQuestion(question, detailKey = "") {
  const condition = question.showIf;
  if (condition === undefined) return true;
  if (condition === false || condition?.never) return false;
  if (typeof condition === "function") {
    return Boolean(condition(questionContext(detailKey)));
  }

  return matchesAnswerRequirements(condition.base, st().baseAnswers)
    && matchesAnswerRequirements(condition.quick, st().quickAnswers)
    && matchesAnswerRequirements(condition.detail, detailKey ? st().detailAnswers[detailKey] || {} : {});
}

function matchesAnswerRequirements(requirements, answers) {
  if (!requirements) return true;
  return Object.entries(requirements).every(([questionId, expected]) => {
    const values = toArray(answers[questionId]);
    if (expected === "*") return values.length > 0;
    if (expected?.not) {
      const blocked = toArray(expected.not);
      return values.length ? values.every((value) => !blocked.includes(value)) : false;
    }
    const allowed = toArray(expected);
    return values.some((value) => allowed.includes(value));
  });
}

function questionContext(detailKey = "") {
  return {
    mode,
    baseAnswers: st().baseAnswers,
    quickAnswers: st().quickAnswers,
    detailAnswers: detailKey ? st().detailAnswers[detailKey] || {} : {},
    recommendation: st().recommendation
  };
}

function seedDetailDefaults(detailKey) {
  const defaults = detailDefaultAnswers(detailKey);
  if (!Object.keys(defaults).length) return;
  const answers = st().detailAnswers[detailKey] || {};
  Object.entries(defaults).forEach(([key, value]) => {
    if (!answers[key]) answers[key] = value;
  });
  st().detailAnswers[detailKey] = answers;
}

function detailDefaultAnswers(detailKey) {
  const base = st().baseAnswers;

  if (mode === "personal" && detailKey === "home") {
    const byLivingType = {
      rent: { role: "tenant", insuredObject: "contents" },
      ownerApartment: { role: "owner_occupier", insuredObject: "contents" },
      house: { role: "house_owner", insuredObject: "building_and_contents" },
      semiDetached: { role: "house_owner", insuredObject: "building_and_contents" },
      holiday: { role: "holiday_owner", insuredObject: "building_and_contents" }
    };
    return byLivingType[base.livingType] || {};
  }

  if (mode === "business" && detailKey === "bizPeople") {
    const byEmployeeCount = {
      solo: "solo",
      "1_4": "micro",
      "5_9": "micro",
      "1_10": "micro",
      "10_19": "small",
      "20_49": "small",
      "11_50": "small"
    };
    return byEmployeeCount[base.employeeCount] ? { peopleSize: byEmployeeCount[base.employeeCount] } : {};
  }

  if (mode === "business" && detailKey === "bizLiability") {
    const byIndustry = {
      consulting: "professional",
      it: "it",
      professional: "it",
      healthcare: "healthcare",
      food: "products",
      restaurant: "products",
      retail: "products",
      grocery: "products",
      commerce: "products",
      manufacturing: "products",
      construction: "operations",
      beauty: "operations",
      automotive: "operations",
      events: "operations"
    };
    return byIndustry[base.industry] ? { liabilityActivity: byIndustry[base.industry] } : {};
  }

  return {};
}

function effectiveDetailAnswers(detailKey) {
  seedDetailDefaults(detailKey);
  const answers = st().detailAnswers[detailKey] || {};
  const visibleIds = new Set(activeDetailQuestions(detailKey).map((question) => question.id));
  const defaultIds = new Set(Object.keys(detailDefaultAnswers(detailKey)));
  const effective = Object.fromEntries(
    Object.entries(answers).filter(([key]) => visibleIds.has(key) || defaultIds.has(key) || (key.endsWith("Other") && visibleIds.has(key.slice(0, -5))))
  );
  st().detailAnswers[detailKey] = effective;
  return effective;
}

function init() {
  restoreSavedAssessment();
  bindEvents();
  $("modePersonal").classList.toggle("active", mode === "personal");
  $("modeBusiness").classList.toggle("active", mode === "business");
  renderShellTexts();
  renderIntro();
  renderBaseInfo();
  renderChatPanel();
  renderSummaryList();
  updateResumeNotice();
  appReady = true;
}

function bindEvents() {
  $("modePersonal").addEventListener("click", () => setMode("personal"));
  $("modeBusiness").addEventListener("click", () => setMode("business"));
  $("startAssessment").addEventListener("click", () => openAssessment());
  $("resumeAssessment").addEventListener("click", () => resumeAssessment());
  $("discardSavedAssessment").addEventListener("click", () => discardSavedAssessment());
  $("startQuick").addEventListener("click", () => startBaseInfo());
  $("showRecommendations").addEventListener("click", () => openRecommendations());
  $("showCustomerSummary").addEventListener("click", () => openCustomerSummary());
  $("openContact").addEventListener("click", () => openContact());
  $("clearAllTop").addEventListener("click", () => resetAssessment("intro"));
  $("baseBack").addEventListener("click", () => showView("intro"));
  $("baseNext").addEventListener("click", () => baseNext());
  $("questionBack").addEventListener("click", () => questionBack());
  $("questionNext").addEventListener("click", () => questionNext());
  $("restartAssessment").addEventListener("click", () => resetAssessment("base"));
  $("contactFromResults").addEventListener("click", () => resultsPrimaryAction());
  $("detailBack").addEventListener("click", () => detailBack());
  $("detailNext").addEventListener("click", () => detailNext());
  $("detailAgain").addEventListener("click", () => restartDetail());
  $("backToResults").addEventListener("click", () => openRecommendations());
  $("contactFromDetail").addEventListener("click", () => {
    const typeKey = st().activeDetail ? typeKeyFromDetail(st().activeDetail) : "";
    if (typeKey) st().selectedContact[typeKey] = true;
    openCustomerSummary();
  });
  $("contactBack").addEventListener("click", () => openRecommendations());
  $("createSummary").addEventListener("click", () => createCrmSummary());
  $("backToContact").addEventListener("click", () => openContact());
  $("summaryBackToResults").addEventListener("click", () => openRecommendations());
  $("editAnswers").addEventListener("click", () => startBaseInfo());
  $("summaryRefine").addEventListener("click", () => refineTopRecommendation());
  $("summaryContact").addEventListener("click", () => openContact());
  $("printCustomerSummary").addEventListener("click", () => window.print());
  $("restartFromSummary").addEventListener("click", () => resetAssessment("intro"));
  $("chatClose").addEventListener("click", () => closeChatPopup());
  $("chatMinimize").addEventListener("click", () => closeChatPopup());
  $("chatExpand").addEventListener("click", () => toggleChatSize());
  $("chatLauncher").addEventListener("click", () => openChatPopup());
}

function setMode(nextMode) {
  if (nextMode === mode) return;
  if (hasProgress() && !window.confirm("Asiakastyypin vaihtaminen tyhjentää nykyiset vastaukset. Haluatko jatkaa?")) return;
  states[mode] = freshState();
  restoredFromStorage = false;
  persistedAt = "";
  mode = nextMode;
  states[mode] = freshState();
  $("modePersonal").classList.toggle("active", mode === "personal");
  $("modeBusiness").classList.toggle("active", mode === "business");
  renderShellTexts();
  renderIntro();
  renderBaseInfo();
  renderChatPanel();
  renderSummaryList();
  showView("intro");
  updateResumeNotice();
  track("assessment_mode_changed", { mode });
}

function renderShellTexts() {
  const p = profile();
  $("heroTitle").textContent = p.heroTitle;
  $("heroLead").textContent = p.heroLead;
  const heroImage = $("heroImage");
  const introImage = $("introImage");
  if (mode === "business") {
    heroImage.src = "./assets/images/kartoitus-yritys-1200.webp";
    heroImage.srcset = "./assets/images/kartoitus-yritys-640.webp 640w, ./assets/images/kartoitus-yritys-1200.webp 1200w";
    heroImage.alt = "Pienen yrityksen työntekijät suunnittelevat työtä yhdessä.";
    introImage.src = "./assets/images/kartoitus-yrittaja-800.webp";
    introImage.alt = "Sähköalan pienyrittäjä työskentelee asiakkaan kodissa.";
  } else {
    heroImage.src = "./assets/images/kartoitus-henkilo-1200.webp";
    heroImage.srcset = "./assets/images/kartoitus-henkilo-640.webp 640w, ./assets/images/kartoitus-henkilo-1200.webp 1200w";
    heroImage.alt = "Pariskunta kotinsa pihalla.";
    introImage.src = "./assets/images/kartoitus-perhe-800.webp";
    introImage.alt = "Kaksi lasta leikkii kotona.";
  }
  $("modeLabel").textContent = p.label;
  $("appTitle").textContent = `${p.label}: vakuutuskartoitus`;
}

function resumeAssessment() {
  $("appShell").classList.remove("hidden");
  if (!hasCompleteBaseInfo()) {
    renderBaseInfo();
    showView("base");
  } else {
    calculateAndRenderRecommendations();
    if (savedView === "summary") {
      openCustomerSummary();
    } else if (savedView === "detailResult" && st().activeDetail && st().detailResults[st().activeDetail]) {
      renderDetailResult(st().activeDetail, st().detailResults[st().activeDetail]);
      showView("detailResult");
    } else if (savedView === "detail" && st().activeDetail) {
      renderDetailQuestion();
      showView("detail");
    } else if (savedView === "quick") {
      renderQuestion();
      showView("quick");
    } else {
      showView("results");
    }
  }
  $("resumeNotice").classList.add("hidden");
  $("appShell").scrollIntoView({ behavior: "smooth", block: "start" });
  track("assessment_resumed", { mode });
}

function discardSavedAssessment() {
  removePersistedAssessment();
  states.personal = freshState();
  states.business = freshState();
  savedView = "intro";
  restoredFromStorage = false;
  persistedAt = "";
  renderShellTexts();
  renderIntro();
  renderBaseInfo();
  renderChatPanel();
  renderSummaryList();
  $("resumeNotice").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  showView("intro");
  $("appShell").scrollIntoView({ behavior: "smooth", block: "start" });
}

function hasCompleteBaseInfo() {
  return (baseQuestions[mode] || []).every((question) => {
    const answer = st().baseAnswers[question.id];
    if (!answer) return false;
    return answer !== "other" || Boolean(st().baseAnswers[`${question.id}Other`]);
  });
}

function openAssessment() {
  $("appShell").classList.remove("hidden");
  renderIntro();
  showView("intro");
  $("appShell").scrollIntoView({ behavior: "smooth", block: "start" });
  track("assessment_opened", { mode });
}

function renderIntro() {
  const p = profile();
  $("introTitle").textContent = p.introTitle;
  $("introText").textContent = p.introText;
  $("shortText").textContent = p.shortText;
  $("detailText").textContent = p.detailText;
  $("shortChips").innerHTML = p.layer1Chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("");
  $("detailChips").innerHTML = p.layer2Chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("");
}

function startBaseInfo() {
  renderBaseInfo();
  showView("base");
  track("base_info_started", { mode });
}

function renderBaseInfo() {
  const questions = baseQuestions[mode] || [];
  $("baseInfoIntro").textContent = mode === "business"
    ? "Täydennä ensin yrityksen perustiedot. Näitä ei kysytä uudestaan tarkentavissa vaiheissa."
    : "Täydennä ensin perustiedot. Näitä ei kysytä uudestaan vakuutuskohtaisissa tarkennuksissa.";
  $("baseInfoFields").innerHTML = questions.map((question) => renderBaseField(question)).join("");
  questions.forEach((question) => {
    const select = $(`base_${question.id}`);
    const other = $(`base_${question.id}_other`);
    if (select) {
      select.addEventListener("change", () => {
        st().baseAnswers[question.id] = select.value;
        if (other) other.closest(".field").classList.toggle("hidden", select.value !== "other");
        persistAssessment();
      });
    }
    if (other) {
      other.addEventListener("input", () => {
        st().baseAnswers[`${question.id}Other`] = other.value.trim();
        persistAssessment();
      });
      other.closest(".field").classList.toggle("hidden", st().baseAnswers[question.id] !== "other");
    }
  });
}

function renderBaseField(question) {
  const value = st().baseAnswers[question.id] || "";
  const otherValue = st().baseAnswers[`${question.id}Other`] || "";
  const otherOption = question.options.some((option) => option.value === "other");
  return `
    <label class="field">
      ${escapeHtml(question.title)}
      <select id="base_${escapeHtml(question.id)}">
        <option value="">Valitse</option>
        ${question.options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
      </select>
    </label>
    ${otherOption ? `
      <label class="field ${value === "other" ? "" : "hidden"}">
        ${escapeHtml(question.otherLabel || "Kuvaile lyhyesti")}
        <input id="base_${escapeHtml(question.id)}_other" value="${escapeHtml(otherValue)}">
      </label>
    ` : ""}
  `;
}

function baseNext() {
  const questions = baseQuestions[mode] || [];
  const missing = questions.find((question) => !st().baseAnswers[question.id]);
  const missingOther = questions.find((question) => st().baseAnswers[question.id] === "other" && !st().baseAnswers[`${question.id}Other`]);
  const error = missing
    ? `Valitse: ${missing.title}.`
    : missingOther
      ? `Täydennä: ${missingOther.otherLabel || missingOther.title}.`
      : "";

  $("baseError").classList.toggle("hidden", !error);
  $("baseError").textContent = error;
  if (error) return;
  calculateAndRenderRecommendations();
  showView("results");
  track("immediate_recommendation_shown", { mode, flowType: st().assessmentResult?.flowType || "" });
}

function startQuick() {
  st().quickIndex = 0;
  renderQuestion();
  showView("quick");
  track("quick_started", { mode });
}

function renderQuestion() {
  const question = relevantNeedsQuestion();
  $("questionError").classList.add("hidden");
  $("questionError").textContent = "";
  $("questionCount").textContent = "Vapaaehtoinen tarkennus";
  $("questionTitle").textContent = question.title;
  $("questionDesc").textContent = question.desc;
  $("multiNote").classList.remove("hidden");
  $("multiNote").textContent = "Voit valita yhden tai useamman vaihtoehdon.";
  $("questionProgress").style.width = "100%";
  $("questionBack").disabled = false;
  $("questionNext").textContent = "Päivitä suositus";
  const answerBag = { relevantNeeds: st().selectedRelevantNeeds };
  renderAnswerOptions("answerList", question, answerBag, (value) => {
    setAnswer(question, answerBag, value);
    st().selectedRelevantNeeds = toArray(answerBag.relevantNeeds);
    renderQuestion();
  });
}

function relevantNeedsQuestion() {
  return {
    id: "relevantNeeds",
    title: mode === "business"
      ? "Valitse kaikki tilanteet, jotka ovat olennaisia yrityksellesi."
      : "Valitse kaikki asiat, jotka haluat huomioida vakuutusturvassasi.",
    desc: "Valintasi täydentävät jo muodostettua alustavaa ratkaisua. Voit myös valita En osaa sanoa.",
    multi: true,
    options: relevantNeedOptions(mode, st()).map((item) => ({
      value: item.id,
      label: item.label
    }))
  };
}

function setAnswer(question, targetAnswers, value) {
  if (!question.multi) {
    targetAnswers[question.id] = value;
    return;
  }

  const current = toArray(targetAnswers[question.id]);
  let next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  if (value === "none" || value === "unsure") {
    next = [value];
  } else {
    next = next.filter((item) => item !== "none" && item !== "unsure");
  }

  targetAnswers[question.id] = next;
}

function renderAnswerOptions(containerId, question, answerBag, onSelect) {
  const selected = toArray(answerBag[question.id]);
  const container = $(containerId);
  container.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `answer-option${question.multi ? " multi" : ""}${selected.includes(option.value) ? " selected" : ""}`;
    button.innerHTML = `
      <span class="answer-mark" aria-hidden="true"></span>
      <span class="answer-text"><strong>${escapeHtml(option.label)}</strong>${option.hint ? `<span>${escapeHtml(option.hint)}</span>` : ""}</span>
    `;
    button.setAttribute("aria-pressed", selected.includes(option.value) ? "true" : "false");
    button.addEventListener("click", () => {
      onSelect(option.value);
      persistAssessment();
    });
    container.appendChild(button);
  });

  if (selected.includes("other")) {
    const field = document.createElement("label");
    field.className = "field answer-other-field";
    field.textContent = question.otherLabel || "Kuvaile lyhyesti";
    const input = document.createElement("input");
    input.type = "text";
    input.value = answerBag[`${question.id}Other`] || "";
    input.placeholder = "Kirjoita tarkennus";
    input.addEventListener("input", () => {
      answerBag[`${question.id}Other`] = input.value.trim();
      persistAssessment();
    });
    field.appendChild(input);
    container.appendChild(field);
  }
}

function questionBack() {
  openRecommendations();
}

function questionNext() {
  const error = st().selectedRelevantNeeds.length ? "" : "Valitse vähintään yksi olennainen asia tai vaihtoehto “En osaa sanoa”.";
  $("questionError").classList.toggle("hidden", !error);
  $("questionError").textContent = error;
  if (error) return;
  syncQuickAnswersFromRelevantNeeds();
  st().recommendationRefined = true;
  calculateAndRenderRecommendations();
  showView("results");
  track("solution_refinement_completed", { mode, selectedRelevantNeeds: st().selectedRelevantNeeds.length });
}

function calculateAndRenderRecommendations() {
  st().recommendation = calculateScores(mode, st().quickAnswers, st().baseAnswers);
  refreshAssessmentResult();
  primeContactSelection();
  renderRecommendations();
  renderChatPanel();
  renderSummaryList();
}

function refreshAssessmentResult() {
  st().assessmentResult = buildAssessmentResult(mode, st(), st().recommendation);
  st().contactSummary = st().assessmentResult.contactSummary;
  st().aiContext = st().assessmentResult.aiContext;
  persistAssessment();
}

function syncQuickAnswersFromRelevantNeeds() {
  const selected = new Set(st().selectedRelevantNeeds);
  if (mode === "personal") {
    if (selected.has("vehicle")) st().quickAnswers.vehicle = "yes";
    if (selected.has("travel")) st().quickAnswers.travel = "yes";
    if (selected.has("pet")) st().quickAnswers.pets = "yes";
    if (selected.has("building_or_cottage") || selected.has("cottage_forest_boat")) st().quickAnswers.holidayHome = "yes";
    if (selected.has("children_health")) st().quickAnswers.children = "yes";
    if (selected.has("health") || selected.has("children_health") || selected.has("fast_care") || selected.has("family_financial_security") || selected.has("loan")) {
      st().quickAnswers.personalInsurance = "yes";
    }
    if (selected.has("valuable_hobbies")) st().quickAnswers.valuables = "yes";
    return;
  }

  if (selected.has("vehicles_or_transport")) st().quickAnswers.vehicles = "yes";
  if (selected.has("property_or_assets")) {
    st().quickAnswers.premises = "yes";
    st().quickAnswers.assets = "yes";
  }
  if (selected.has("customer_liability") || selected.has("financial_error") || selected.has("contract_requirements")) st().quickAnswers.customerSites = "yes";
  if (selected.has("system_dependency")) st().quickAnswers.data = "yes";
  if (selected.has("people_risk") || selected.has("owner_key_person")) st().quickAnswers.keyPeople = "yes";
  if (selected.has("business_interruption")) st().quickAnswers.interruption = "yes";
}

function openRecommendations() {
  if (!st().recommendation) {
    if (Object.keys(st().baseAnswers).length) calculateAndRenderRecommendations();
    else {
      startBaseInfo();
      return;
    }
  } else {
    renderRecommendations();
  }
  showView("results");
}

function renderRecommendations() {
  const recommendation = st().recommendation || calculateScores(mode, st().quickAnswers, st().baseAnswers);
  st().recommendation = recommendation;
  if (!st().assessmentResult) refreshAssessmentResult();
  const assessment = st().assessmentResult;
  $("resultsTitle").textContent = resultsTitleFor(assessment);
  $("resultsIntro").textContent = resultsIntroFor(assessment);
  $("recommendationInsights").innerHTML = `${renderResultsSnapshot(assessment)}${renderAssessmentOverview(assessment)}`;
  renderResultsPrimaryAction();
  $("contactFromResults")?.classList.remove("hidden");

  const buckets = assessmentBuckets(assessment);
  $("recommendationBuckets").innerHTML = `${buckets.map(renderBucket).join("")}${renderNextStepPrompt(assessment)}`;
  $("recommendationBuckets").querySelector("[data-refine-recommendations]")?.addEventListener("click", () => refineTopRecommendation());
  $("recommendationBuckets").querySelector("[data-summary-next]")?.addEventListener("click", () => openCustomerSummary());
  $("recommendationBuckets").querySelector("[data-expert-contact]")?.addEventListener("click", () => openContact());
  $("recommendationBuckets").querySelectorAll("[data-card-refine]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.cardRefine || ""));
  });
  $("recommendationInsights").querySelector("[data-start-comparison]")?.addEventListener("click", () => {
    const first = firstRelevantDetailFlow(assessment);
    if (first) openDetail(first);
  });
  $("recommendationInsights").querySelectorAll("[data-result-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.resultTarget || "";
      if (target === "contact") return openContact();
      if (target === "comparison") {
        const first = firstRelevantDetailFlow(assessment);
        if (first) openDetail(first);
        return;
      }
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  $("recommendationInsights").querySelectorAll("[data-mandatory-contact]").forEach((button) => button.addEventListener("click", () => openContact()));
}

function renderResultsSnapshot(assessment) {
  const statutory = assessment.mandatoryChecks?.length || 0;
  const recommended = assessment.recommendedCovers?.length || 0;
  const recommendedKeys = new Set((assessment.recommendedCovers || []).map((item) => item.key));
  const optionalCount = assessment.optionalCovers?.filter((item) => !recommendedKeys.has(item.key)).length || 0;
  const nonRelevantCount = assessment.nonRelevantCovers?.length || 0;
  const comparable = Boolean(firstRelevantDetailFlow(assessment));
  const statutoryText = statutory === 1 ? "1 lakisääteinen tarkistus" : `${statutory} lakisääteistä tarkistusta`;
  const recommendedText = recommended === 1 ? "1 suositeltu vakuutus" : `${recommended} suositeltua vakuutusta`;
  const optionalText = optionalCount === 1 ? "1 harkittava lisäturva" : `${optionalCount} harkittavaa lisäturvaa`;
  return `
    <section class="results-snapshot" aria-labelledby="resultsSnapshotTitle">
      <div>
        <p class="eyebrow compact">Kartoituksesi on valmis</p>
        <h4 id="resultsSnapshotTitle">Näet nyt tilanteeseesi liittyvät vakuutukset</h4>
        <p>${escapeHtml([statutoryText, recommendedText, optionalText].join(", "))}.</p>
      </div>
      <nav class="results-section-nav" aria-label="Tulossivun osiot">
        <button type="button" data-result-target="mandatoryResults">Lakisääteiset</button>
        <button type="button" data-result-target="recommendedResults">Suositellut</button>
        <button type="button" data-result-target="optionalResults">Harkittavat</button>
        ${comparable ? `<button type="button" data-result-target="comparison">Turvatasojen vertailu</button>` : ""}
        <button type="button" data-result-target="contact">Yhteydenotto</button>
      </nav>
      <div class="results-snapshot-stats" aria-label="Tulosten lukumäärät">
        <button type="button" data-result-target="mandatoryResults"><strong>${statutory}</strong><span>Lakisääteiset</span></button>
        <button type="button" data-result-target="recommendedResults"><strong>${recommended}</strong><span>Suositellut</span></button>
        <button type="button" data-result-target="optionalResults"><strong>${optionalCount}</strong><span>Harkittavat</span></button>
        <button type="button" data-result-target="otherResults"><strong>${nonRelevantCount}</strong><span>Ei relevantit</span></button>
      </div>
      ${comparable ? `
        <div class="comparison-callout">
          <div><strong>Haluatko tarkentaa vakuutusturvaa?</strong><span>Vertaile turvatasoja käytännön erojen kautta.</span></div>
          <button class="btn btn-primary" type="button" data-start-comparison>Aloita turvatasojen vertailu</button>
        </div>
      ` : ""}
    </section>
  `;
}

function firstRelevantDetailFlow(assessment = st().assessmentResult) {
  const covers = [
    ...(assessment?.recommendedCovers || []),
    ...(assessment?.optionalCovers || []).filter((item) => item.active)
  ];
  return covers.map((item) => types()[item.key]?.detailFlow).find((detailKey) => detailKey && flow(detailKey) && coverageModels[mode]?.[detailKey]?.options?.length > 1) || "";
}

function resultsTitleFor(assessment) {
  return st().recommendationRefined ? "Tarkennettu vakuutuskokonaisuus" : "Alustava vakuutuskokonaisuus";
}

function resultsIntroFor(assessment) {
  if (assessment.flowType === "solution_package") {
    return "Yritysprofiilin perusteella muodostimme alustavan vakuutuskokonaisuuden. Tässä vaiheessa tunnistetaan vakuutusalueet. Sopiva turvataso arvioidaan vasta vakuutuskohtaisten tarkentavien kysymysten jälkeen.";
  }
  return `${assessment.summary} Tässä vaiheessa näet olennaiset vakuutusalueet. Turvatasoa ehdotetaan vasta tarkentavien kysymysten jälkeen.`;
}

function renderAssessmentOverview(assessment) {
  return `
    <section class="solution-overview">
      <p class="eyebrow compact">${mode === "business" ? "Yritysprofiiliin perustuva ratkaisu" : "Elämäntilanteeseen perustuva ratkaisu"}</p>
      <h4>${escapeHtml(assessment.title)}</h4>
      <p>${escapeHtml(assessment.summary)}</p>
    </section>
    ${renderMandatoryChecks(assessment.mandatoryChecks)}
  `;
}

function renderMandatoryChecks(checks = []) {
  if (!checks.length) return `
    <section class="mandatory-section no-mandatory" id="mandatoryResults">
      <div class="mandatory-intro">
        <span class="mandatory-icon" aria-hidden="true">✓</span>
        <div><p class="eyebrow compact">Lakisääteiset vakuutukset</p><h4>Ei tunnistettuja lakisääteisiä vakuutuksia</h4><p>Antamiesi tietojen perusteella kartoitus ei nostanut tähän ryhmään vakuutuksia. Tilanne varmistetaan tarvittaessa asiantuntijan kanssa.</p></div>
      </div>
    </section>`;
  const countLabel = checks.length === 1 ? "1 tarkistettava vakuutus" : `${checks.length} tarkistettavaa vakuutusta`;
  return `
    <section class="mandatory-section" id="mandatoryResults">
      <div class="mandatory-intro">
        <span class="mandatory-icon" aria-hidden="true">!</span>
        <div>
          <p class="eyebrow compact">Lakisääteiset vakuutukset</p>
          <h4>Tarkista nämä ensin</h4>
          <p>Vastaustesi perusteella tunnistimme ${escapeHtml(countLabel)}. Tarkka vakuuttamisvelvollisuus varmistetaan aina yrityksen tilanteen perusteella.</p>
        </div>
      </div>
      <div class="mandatory-content">
        <div class="mandatory-list">
          ${checks.map((item) => `
            <article>
              <span class="mandatory-item-icon" aria-hidden="true">✓</span>
              <div>
                <div class="mandatory-item-heading"><strong>${escapeHtml(item.name)}</strong><span class="status-pill statutory">Lakisääteinen tarkistus</span></div>
                <p><b>Mitä vakuutus tekee?</b> ${escapeHtml(mandatoryInsuranceSummary(item))}</p>
                <p><b>Miksi sinulle?</b> ${escapeHtml(item.text)}</p>
                <button class="btn btn-secondary btn-small" type="button" data-mandatory-contact>Tarkista velvollisuus asiantuntijan kanssa</button>
              </div>
            </article>
          `).join("")}
        </div>
        <p class="mandatory-note">Asiantuntija auttaa varmistamaan, mitkä vakuuttamisvelvollisuudet koskevat juuri yritystäsi.</p>
      </div>
    </section>
  `;
}

function mandatoryInsuranceSummary(item) {
  return item?.purpose || "Täyttää tilanteeseen mahdollisesti liittyvän lakisääteisen vakuuttamisvelvollisuuden.";
}

function assessmentBuckets(assessment) {
  if (!["solution_package", "personal_solution_package"].includes(assessment.flowType)) return [];
  const recommendedKeysSet = new Set(assessment.recommendedCovers.map((item) => item.key));
  const primary = assessment.recommendedCovers
    .filter((item) => types()[item.key])
    .map((item) => solutionCoverToRecommendation(item, 8));
  const possible = assessment.optionalCovers
    .filter((item) => !recommendedKeysSet.has(item.key) && types()[item.key])
    .map((item) => solutionCoverToRecommendation({
      ...item,
      reason: item.condition
    }, item.active ? 7 : 3));
  const notNow = (assessment.nonRelevantCovers || [])
    .filter((item) => types()[item.key])
    .map((item) => solutionCoverToRecommendation(item, 0));

  return [
    {
      key: "primary",
      title: "Tilanteeseesi suositellut vakuutukset",
      desc: mode === "business"
        ? "Nämä vakuutusalueet ovat profiilisi perusteella yleensä olennaisia tämän tyyppisessä toiminnassa."
        : "Nämä vakuutusalueet muodostavat elämäntilanteesi perusteella alustavan kokonaisuuden.",
      items: primary
    },
    {
      key: "possible",
      title: "Harkittavat lisäturvat",
      desc: mode === "business"
        ? "Nämä voivat olla tärkeitä, jos ne liittyvät yrityksenne arkeen, järjestelmiin, ajoneuvoihin, kuljetuksiin tai erityisiin riskeihin."
        : "Nämä voivat täydentää kokonaisuutta omien valintojesi ja elämäntilanteesi mukaan.",
      items: possible
    },
    {
      key: "notNow",
      title: "Ei tällä hetkellä relevantit vakuutukset",
      desc: "Nämä vakuutusalueet eivät nousseet antamiesi tietojen perusteella ajankohtaisiksi.",
      items: notNow
    }
  ];
}

function solutionCoverToRecommendation(coverItem, score) {
  const legacyItem = st().recommendation?.items?.find((item) => item.key === coverItem.key);
  return {
    key: coverItem.key,
    score: Math.max(score, legacyItem?.score || 0),
    reasons: [coverItem.reason || coverItem.condition || legacyItem?.reasons?.[0] || types()[coverItem.key]?.desc].filter(Boolean),
    existing: Boolean(legacyItem?.existing)
  };
}

function renderResultsPrimaryAction() {
  const button = $("contactFromResults");
  if (!button) return;
  button.textContent = "Näytä oma yhteenveto";
}

function resultsPrimaryAction() {
  openCustomerSummary();
}

function renderNextStepPrompt(assessment) {
  if (st().recommendationRefined) {
    return `
      <section class="refine-card next-step-card">
        <div>
          <p class="eyebrow compact">Seuraava askel</p>
          <h4>Katso valmis vakuutusyhteenvetosi</h4>
          <p>Yhteenveto kokoaa suositukset, valitsemasi turvatasot ja mahdolliset lisätarkistukset samaan näkymään.</p>
        </div>
        <div class="refine-actions">
          <button class="btn btn-primary" type="button" data-summary-next>Näytä oma yhteenveto</button>
          <button class="btn btn-soft" type="button" data-expert-contact>Pyydä halutessasi yhteydenottoa</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="refine-card next-step-card">
      <div>
        <p class="eyebrow compact">Seuraava askel</p>
        <h4>Yhteenveto on jo valmis, mutta voit halutessasi tarkentaa sitä</h4>
        <p>Tarkennus on vapaaehtoinen. Voit ensin katsoa yhteenvedon tai valita lisää olennaisia tilanteita.</p>
      </div>
      <div class="refine-actions">
        <button class="btn btn-primary" type="button" data-summary-next>Näytä oma yhteenveto</button>
        <button class="btn btn-secondary" type="button" data-refine-recommendations>Tarkenna suositusta</button>
        <button class="btn btn-soft" type="button" data-expert-contact>Pyydä halutessasi yhteydenottoa</button>
      </div>
    </section>
  `;
}

function renderBucket(bucket) {
  const visibleItems = bucket.items;
  if (!visibleItems.length) return "";
  const content = `
      <div class="bucket-head">
        <div>
          <h4>${escapeHtml(bucket.title)}</h4>
          <p>${escapeHtml(bucket.desc)}</p>
        </div>
      </div>
      <div class="recommendation-list">
        ${visibleItems.map((item, index) => renderRecommendationCard(item, bucket.key, index)).join("")}
      </div>
  `;
  const sectionId = bucket.key === "primary" ? "recommendedResults" : bucket.key === "possible" ? "optionalResults" : "otherResults";
  if (bucket.key === "notNow") {
    return `
      <details class="bucket bucket-collapsed" id="${sectionId}">
        <summary>
          <span>Näytä myös vakuutukset, joita ei suositeltu</span>
          <small>${visibleItems.length} vakuutusaluetta</small>
        </summary>
        ${content}
      </details>
    `;
  }

  return `<section class="bucket" id="${sectionId}">${content}</section>`;
}

function renderRecommendationCard(item, bucketKey) {
  const meta = types()[item.key];
  const reasons = item.reasons.length ? item.reasons : ["tämä vakuutusalue ei noussut vastauksissa vahvasti esiin"];
  const existing = item.existing ? `<span class="status-pill possible">Nykyinen turva: tarkista riittävyys</span>` : "";
  const strength = recommendationStrength(item.score);
  const detailKey = meta.detailFlow || "";
  const isComparable = Boolean(detailKey && flow(detailKey) && coverageModels[mode]?.[detailKey]?.options?.length > 1);
  const detailResult = detailKey ? st().detailResults[detailKey] : null;
  const coverageLevel = st().assessmentResult?.selectedCoverageLevels?.[item.key];
  const description = shortenText(productCovers(meta), 190);

  return `
    <article class="rec-card target-card ${bucketKey === "primary" ? "priority" : bucketKey === "possible" ? "supporting" : ""} ${detailResult ? "refined" : ""} compact">
      <div class="rec-main">
        <div class="target-card-head">
          <div>
            <h4>${escapeHtml(meta.title)}</h4>
            <p class="rec-purpose"><strong>Mitä vakuutus tekee?</strong><span>${escapeHtml(description)}</span></p>
          </div>
          <span class="status-pill ${detailResult ? "done" : bucketKey === "primary" ? "primary" : bucketKey === "possible" ? "possible" : ""}">${escapeHtml(detailResult ? "Tarkennettu" : bucketKey === "notNow" ? "Ei tällä hetkellä relevantti" : bucketKey === "possible" ? "Harkittava lisäturva" : strength)}</span>
        </div>
        <div class="card-why">
          <strong>Miksi sinulle?</strong>
          <span>${escapeHtml(capitalize(shortenText(reasons[0], 145)))}.</span>
        </div>
        ${detailResult && coverageLevel ? `
          <div class="refined-summary compact">
            <strong>Valitsemasi turvataso</strong>
            <span>${escapeHtml(coverageLevel.selectedTitle)}</span>
          </div>
        ` : detailKey ? `
          <div class="coverage-pending">
            <strong>Turvatasoa ei ole vielä arvioitu</strong>
            <span>Vastaa ensin tämän vakuutuksen tarkentaviin kysymyksiin.</span>
          </div>
        ` : ""}
        ${existing ? `<div class="chip-row target-meta-row">${existing}</div>` : ""}
        ${detailKey && flow(detailKey) ? `
          <div class="rec-primary-action">
            <button class="btn ${bucketKey === "notNow" ? "btn-secondary" : "btn-primary"}" type="button" data-card-refine="${escapeHtml(detailKey)}">${isComparable ? (detailResult ? "Avaa turvatasojen vertailu" : "Vertaile turvatasoja") : "Tarkenna vakuutusta"}</button>
          </div>
        ` : ""}
        ${renderRecommendationLearn(meta)}
      </div>
    </article>
  `;
}

function renderRecommendationLearn(meta) {
  return `
    <details class="learn-panel">
      <summary>Lue lisää</summary>
      <div class="insurance-plain-summary">
        <strong>Mitä vakuutus yleisesti tekee?</strong>
        <p>${escapeHtml(productCovers(meta))}</p>
      </div>
      ${renderMaterialDisclosure(meta.materials)}
    </details>
  `;
}

function productSummary(meta) {
  return meta.desc || "Vakuutuksen tarkka sisältö varmistetaan tuotemateriaaleista ja asiantuntijan kanssa.";
}

function productCovers(meta) {
  return meta.purpose || meta.desc || "Vakuutus voi kattaa tuotekohtaisissa ehdoissa määriteltyjä vahinkoja ja kustannuksia.";
}

function productLimits(meta) {
  const title = meta.title.toLocaleLowerCase("fi-FI");
  if (title.includes("ajoneuvo")) return "Oman ajoneuvon vahingot, lisäturvat, bonukset, omavastuut ja ajoneuvokohtaiset rajaukset pitää varmistaa ennen vakuutuksen valintaa.";
  if (title.includes("matka")) return "Matkan kesto, kohdemaa, matkustajat, matkatavarat, peruuntumisen syy ja voimassaolo pitää tarkistaa.";
  if (title.includes("terveys") || title.includes("tapaturma")) return "Terveysselvitys, rajoitusehdot, ikärajat, urheilulajit, omavastuu ja hoitokulujen enimmäismäärät pitää tarkistaa.";
  if (title.includes("henki")) return "Vakuutusmäärä, edunsaaja, terveystiedot, voimassaolo ja mahdolliset rajoitukset pitää varmistaa.";
  if (title.includes("vastuu")) return "Sopimusvastuut, toimialarajaukset, enimmäiskorvaukset ja puhtaat varallisuusvahingot pitää tarkistaa erikseen.";
  if (title.includes("keskeytys")) return "Keskeytyksen syy, vastuuaika, katteen laskenta, omavastuu ja riippuvuudet pitää määrittää tarkasti.";
  return "Lopullinen sisältö, rajoitukset, omavastuut, vakuutusmäärät ja soveltuvuus pitää varmistaa tuotemateriaaleista tai asiantuntijalta.";
}

function recommendationStrength(score) {
  if (score >= 10) return "Erittäin olennainen";
  if (score >= 7) return "Suositeltava";
  if (score >= 3) return "Mahdollinen";
  if (score > 0) return "Tarkista asiantuntijan kanssa";
  return "Ei juuri nyt tärkein";
}

function refineTopRecommendation() {
  if (!st().assessmentResult) calculateAndRenderRecommendations();
  startQuick();
}

function openDetail(detailKey) {
  if (!detailKey || !flow(detailKey)) return;
  st().activeDetail = detailKey;
  st().detailIndex = 0;
  st().detailAnswers[detailKey] = st().detailAnswers[detailKey] || {};
  seedDetailDefaults(detailKey);
  renderDetailQuestion();
  showView("detail");
  track("detail_started", { mode, detailKey });
}

function renderDetailQuestion() {
  const detailKey = st().activeDetail;
  const currentFlow = flow(detailKey);
  seedDetailDefaults(detailKey);
  const questions = activeDetailQuestions(detailKey);
  if (!questions.length) {
    finishDetail(detailKey);
    return;
  }
  st().detailIndex = Math.min(st().detailIndex, questions.length - 1);
  const question = questions[st().detailIndex];
  $("detailSource").textContent = currentFlow.sourceNote;
  $("detailCount").textContent = `Tarkentava kartoitus ${st().detailIndex + 1}/${questions.length}`;
  $("detailTitle").textContent = question.title;
  $("detailDesc").textContent = question.desc;
  $("detailMultiNote").classList.toggle("hidden", !question.multi);
  $("detailProgress").style.width = `${Math.round(((st().detailIndex + 1) / questions.length) * 100)}%`;
  $("detailBack").textContent = st().detailIndex === 0 ? "Takaisin suosituksiin" : "Takaisin";
  $("detailNext").textContent = st().detailIndex === questions.length - 1 ? "Näytä ehdotus" : "Seuraava";
  $("detailError").classList.add("hidden");
  $("detailError").textContent = "";
  renderAnswerOptions("detailAnswers", question, st().detailAnswers[detailKey], (value) => {
    setAnswer(question, st().detailAnswers[detailKey], value);
    renderDetailQuestion();
  });
}

function detailBack() {
  if (st().detailIndex > 0) {
    st().detailIndex -= 1;
    renderDetailQuestion();
    return;
  }
  openRecommendations();
}

function detailNext() {
  const detailKey = st().activeDetail;
  const questions = activeDetailQuestions(detailKey);
  const question = questions[st().detailIndex];
  if (!question) {
    finishDetail(detailKey);
    return;
  }
  const answers = st().detailAnswers[detailKey];
  if (!toArray(answers[question.id]).length) {
    $("detailError").textContent = "Valitse vaihtoehto ennen jatkamista.";
    $("detailError").classList.remove("hidden");
    return;
  }
  if (toArray(answers[question.id]).includes("other") && !answers[`${question.id}Other`]) {
    $("detailError").textContent = "Kuvaile valitsemasi muu vaihtoehto ennen jatkamista.";
    $("detailError").classList.remove("hidden");
    return;
  }

  if (st().detailIndex < questions.length - 1) {
    st().detailIndex += 1;
    renderDetailQuestion();
    return;
  }

  finishDetail(detailKey);
}

function finishDetail(detailKey) {
  const answers = effectiveDetailAnswers(detailKey);
  const result = buildDetailResult(mode, detailKey, answers);
  st().detailResults[detailKey] = result;
  st().recommendationRefined = true;
  st().selectedCoverage[detailKey] = result.comparison?.recommendedKeys?.[0] || result.comparison?.options?.[0]?.key || "";
  const typeKey = typeKeyFromDetail(detailKey);
  if (typeKey) {
    st().selectedContact[typeKey] = true;
  }
  refreshAssessmentResult();
  renderDetailResult(detailKey, result);
  showView("detailResult");
  track("detail_completed", { mode, detailKey });
}

function restartDetail() {
  const detailKey = st().activeDetail;
  if (!detailKey) return;
  st().detailIndex = 0;
  renderDetailQuestion();
  showView("detail");
}

function renderDetailResult(detailKey, result) {
  const typeKey = Object.keys(types()).find((key) => types()[key].detailFlow === detailKey) || detailKey;
  const meta = types()[typeKey];
  $("detailResultTitle").textContent = `${meta.title}: tarkennettu suositus`;
  $("detailResult").innerHTML = `
    <div class="result-hero">
      <span class="eyebrow compact">${escapeHtml(result.primaryTag)}</span>
      <span class="big">${escapeHtml(result.title)}</span>
      ${renderCoverageComparison(result.comparison, detailKey)}
      <details class="result-details">
        <summary>Miksi tämä ehdotus syntyi?</summary>
        <div class="result-grid">
          ${result.rows.map((row) => `<div class="result-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></div>`).join("")}
        </div>
        <div class="reason-list">
          ${result.reasons.map((reason) => `<div class="reason">${escapeHtml(capitalize(reason))}.</div>`).join("")}
        </div>
        ${result.notes.length ? `<div class="notice"><strong>Huomioi jatkossa:</strong><br>${result.notes.map(escapeHtml).join("<br>")}</div>` : ""}
      </details>
      ${renderNextDetailPrompt(detailKey)}
      ${renderProductMaterials(meta)}
    </div>
  `;
  bindDetailActions($("detailResult"));
  renderSummaryList();
}

function renderNextDetailPrompt(currentDetailKey = "") {
  const nextItem = nextDetailCandidate(currentDetailKey);
  if (!nextItem) {
    return `
      <section class="next-detail-card complete">
        <div>
          <p class="eyebrow compact">Seuraava vaihe</p>
          <h4>Tärkeimmät tarkennukset on tehty</h4>
          <p>Voit palata suosituksiin muokkaamaan yksittäistä kohdetta tai katsoa valmiin vakuutusyhteenvetosi.</p>
        </div>
        <button class="btn btn-primary" type="button" data-open-summary>Näytä oma yhteenveto</button>
      </section>
    `;
  }

  const meta = types()[nextItem.key];
  return `
    <section class="next-detail-card">
      <div>
        <p class="eyebrow compact">Jatka kartoitusta</p>
        <h4>Seuraavaksi: ${escapeHtml(meta.title)}</h4>
        <p>${escapeHtml(meta.desc)}</p>
      </div>
      <button class="btn btn-primary" type="button" data-next-detail="${escapeHtml(meta.detailFlow)}">Tarkenna seuraava vakuutus</button>
    </section>
  `;
}

function nextDetailCandidate(currentDetailKey = "") {
  const covers = [
    ...(st().assessmentResult?.recommendedCovers || []),
    ...(st().assessmentResult?.optionalCovers || []).filter((item) => item.active)
  ];
  return covers
    .find((item) => {
      const detailKey = types()[item.key]?.detailFlow;
      return detailKey && flow(detailKey) && detailKey !== currentDetailKey && !st().detailResults[detailKey];
    }) || null;
}

function renderCoverageComparison(comparison, detailKey = "") {
  if (!comparison) return "";
  const recommendedLabels = comparison.recommended.map((option) => option.title).join(", ");
  const selectedKey = selectedCoverageKey(detailKey, comparison);
  const selectedOption = selectedCoverageOption(detailKey, comparison);
  const selectedLabel = selectedOption?.title || recommendedLabels;
  const selectionMatchesRecommendation = comparison.recommendedKeys.includes(selectedKey);
  const tableRows = [
    ["Turvan laajuus", (option) => option.level],
    ["Mitä turva käytännössä tarkoittaa?", (option) => option.means],
    ["Kenelle taso sopii?", (option) => option.fit],
    ["Mitä taso voi sisältää?", (option) => option.covers],
    ["Mitä pitää vielä tarkistaa?", (option) => option.limits],
    ["Sopivuus vastaustesi perusteella", (option) => option.key === selectedKey ? "Valitsemasi taso" : comparison.recommendedKeys.includes(option.key) ? "Suositeltu taso" : "Muu vertailtava taso"]
  ];
  const onlyDifferences = Boolean(st().comparisonOnlyDifferences[detailKey]);
  const expanded = Boolean(st().comparisonExpanded[detailKey]);
  const visibleRows = expanded ? tableRows : tableRows.slice(0, 4);
  const pair = mobileComparisonPair(detailKey, comparison, selectedKey);

  return `
    <section class="coverage-compare" aria-label="${escapeHtml(comparison.title)}">
      <div class="coverage-head">
        <div>
          <p class="eyebrow compact">Vertaile turvatasoja</p>
          <h4>${escapeHtml(comparison.title)}</h4>
          <p class="muted">${escapeHtml(comparison.notice)}</p>
        </div>
        <button class="btn btn-secondary btn-small" type="button" data-close-comparison>Palaa vakuutuslistaan</button>
      </div>
      <div class="best-fit">
        <strong>Suosituksemme: ${escapeHtml(recommendedLabels)}</strong>
        <span><b>Miksi tätä suositellaan?</b> ${escapeHtml(shortenText(comparison.basis, 240))}</span>
      </div>
      <div class="selected-fit">
        <strong>Valitsemasi vaihtoehto: ${escapeHtml(selectedLabel)}</strong>
        <span>${selectionMatchesRecommendation ? "Valinta vastaa suositusta." : "Valintasi tallentuu yhteenvetoon ja näkyy asiantuntijalle välitettävissä tiedoissa."}</span>
      </div>
      <div class="comparison-tools">
        <label><input type="checkbox" data-comparison-differences="${escapeHtml(detailKey)}" ${onlyDifferences ? "checked" : ""}> Näytä vain erot</label>
        <button class="link-button" type="button" data-comparison-expand="${escapeHtml(detailKey)}">${expanded ? "Näytä vain tärkeimmät erot" : "Näytä kaikki erot"}</button>
      </div>
      <div class="coverage-details">
        <div class="coverage-table-wrap">
        <table class="coverage-table">
          <thead>
            <tr>
              <th>Mitä vakuutus korvaa tai painottaa?</th>
              ${comparison.options.map((option) => `
                <th class="${option.key === selectedKey ? "selected" : ""} ${comparison.recommendedKeys.includes(option.key) ? "recommended-column" : ""}">
                  <button class="coverage-choice" type="button" data-detail-key="${escapeHtml(detailKey)}" data-coverage-choice="${escapeHtml(option.key)}" aria-pressed="${option.key === selectedKey ? "true" : "false"}">
                    <span class="radio-dot" aria-hidden="true"></span>
                    <strong>${escapeHtml(option.title)}</strong>
                    ${comparison.recommendedKeys.includes(option.key) ? `<span class="recommend-badge">Suositeltu</span>` : ""}
                    <span class="${option.key === selectedKey ? "selected-badge" : "choose-badge"}">${option.key === selectedKey ? "Valittu" : "Valitse tämä"}</span>
                  </button>
                </th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${visibleRows.map(([label, getValue]) => {
              const values = comparison.options.map((option) => getValue(option));
              const different = new Set(values).size > 1;
              return `
              <tr class="${onlyDifferences && !different ? "hidden" : ""}">
                <th scope="row">${escapeHtml(label)}</th>
                ${comparison.options.map((option) => `<td class="${option.key === selectedKey ? "selected" : ""}" data-detail-key="${escapeHtml(detailKey)}" data-coverage-cell="${escapeHtml(option.key)}">${escapeHtml(getValue(option))}</td>`).join("")}
              </tr>
            `;}).join("")}
          </tbody>
        </table>
        </div>
      </div>
      ${renderMobileCoverageComparison(comparison, detailKey, selectedKey, pair, visibleRows, onlyDifferences)}
    </section>
  `;
}

function mobileComparisonPair(detailKey, comparison, selectedKey) {
  const saved = st().comparisonPairs[detailKey] || [];
  const valid = saved.filter((key) => comparison.options.some((option) => option.key === key));
  const left = valid[0] || selectedKey || comparison.options[0]?.key;
  const right = valid.find((key) => key !== left) || comparison.options.find((option) => option.key !== left)?.key || left;
  return [left, right];
}

function renderMobileCoverageComparison(comparison, detailKey, selectedKey, pair, rows, onlyDifferences) {
  const options = pair.map((key) => comparison.options.find((option) => option.key === key)).filter(Boolean);
  return `
    <div class="coverage-mobile-comparison" aria-label="Turvatasojen mobiilivertailu">
      <p><strong>Valitse kaksi tasoa vertailuun</strong></p>
      <div class="mobile-compare-selects">
        ${[0, 1].map((side) => `
          <label>${side === 0 ? "Ensimmäinen taso" : "Toinen taso"}
            <select data-mobile-comparison="${escapeHtml(detailKey)}" data-mobile-side="${side}">
              ${comparison.options.map((option) => `<option value="${escapeHtml(option.key)}" ${option.key === pair[side] ? "selected" : ""}>${escapeHtml(option.title)}</option>`).join("")}
            </select>
          </label>
        `).join("")}
      </div>
      <div class="mobile-compare-headings">
        ${options.map((option) => `
          <div class="${option.key === selectedKey ? "selected" : ""}">
            <strong>${escapeHtml(option.title)}</strong>
            ${comparison.recommendedKeys.includes(option.key) ? `<span class="recommend-badge">Suositeltu</span>` : ""}
            <button class="btn btn-secondary btn-small" type="button" data-detail-key="${escapeHtml(detailKey)}" data-coverage-choice="${escapeHtml(option.key)}">${option.key === selectedKey ? "Valittu" : "Valitse tämä"}</button>
          </div>
        `).join("")}
      </div>
      <div class="mobile-compare-rows">
        ${rows.map(([label, getValue]) => {
          const values = options.map((option) => getValue(option));
          if (onlyDifferences && new Set(values).size < 2) return "";
          return `<section><h5>${escapeHtml(label)}</h5><div>${options.map((option) => `<p><strong>${escapeHtml(option.title)}</strong><span>${escapeHtml(getValue(option))}</span></p>`).join("")}</div></section>`;
        }).join("")}
      </div>
    </div>
  `;
}

function bindDetailActions(root) {
  root.querySelectorAll("[data-close-comparison]").forEach((button) => button.addEventListener("click", () => openRecommendations()));
  root.querySelectorAll("[data-coverage-choice]").forEach((button) => {
    button.addEventListener("click", () => selectCoverageOption(button.dataset.detailKey || "", button.dataset.coverageChoice || ""));
  });
  root.querySelectorAll("[data-coverage-cell]").forEach((cell) => {
    cell.addEventListener("click", () => selectCoverageOption(cell.dataset.detailKey || "", cell.dataset.coverageCell || ""));
  });
  root.querySelectorAll("[data-comparison-differences]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.comparisonDifferences || "";
      st().comparisonOnlyDifferences[key] = input.checked;
      renderDetailResult(key, st().detailResults[key]);
    });
  });
  root.querySelectorAll("[data-comparison-expand]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.comparisonExpand || "";
      st().comparisonExpanded[key] = !st().comparisonExpanded[key];
      renderDetailResult(key, st().detailResults[key]);
    });
  });
  root.querySelectorAll("[data-mobile-comparison]").forEach((select) => {
    select.addEventListener("change", () => {
      const key = select.dataset.mobileComparison || "";
      const comparison = st().detailResults[key]?.comparison;
      if (!comparison) return;
      const pair = mobileComparisonPair(key, comparison, selectedCoverageKey(key, comparison));
      const side = Number(select.dataset.mobileSide);
      pair[side] = select.value;
      if (pair[0] === pair[1]) {
        pair[side === 0 ? 1 : 0] = comparison.options.find((option) => option.key !== select.value)?.key || select.value;
      }
      st().comparisonPairs[key] = pair;
      renderDetailResult(key, st().detailResults[key]);
    });
  });
  root.querySelectorAll("[data-open-contact]").forEach((button) => {
    button.addEventListener("click", () => openContact());
  });
  root.querySelectorAll("[data-open-summary]").forEach((button) => {
    button.addEventListener("click", () => openCustomerSummary());
  });
  root.querySelectorAll("[data-open-chat]").forEach((button) => {
    button.addEventListener("click", () => openChatPopup());
  });
  root.querySelectorAll("[data-next-detail]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.nextDetail || ""));
  });
}

function typeKeyFromDetail(detailKey) {
  return Object.keys(types()).find((key) => types()[key].detailFlow === detailKey) || "";
}

function selectedCoverageKey(detailKey, comparison) {
  const saved = st().selectedCoverage[detailKey];
  if (saved && comparison.options.some((option) => option.key === saved)) return saved;
  return comparison.recommendedKeys[0] || comparison.options[0]?.key || "";
}

function selectedCoverageOption(detailKey, comparison) {
  const key = selectedCoverageKey(detailKey, comparison);
  return comparison.options.find((option) => option.key === key) || comparison.options[0];
}

function selectCoverageOption(detailKey, coverageKey) {
  if (!detailKey || !coverageKey) return;
  const result = st().detailResults[detailKey];
  if (!result?.comparison?.options?.some((option) => option.key === coverageKey)) return;
  st().selectedCoverage[detailKey] = coverageKey;
  const typeKey = typeKeyFromDetail(detailKey);
  if (typeKey) {
    st().selectedContact[typeKey] = true;
  }
  refreshAssessmentResult();
  renderDetailResult(detailKey, result);
  renderChatPanel();
  renderSummaryList();
  track("coverage_option_selected", { mode, detailKey, coverageKey });
}

function renderProductMaterials(meta = {}) {
  const materials = meta.materials || [];
  if (!materials.length) return "";
  return `
    <section class="materials-panel" aria-label="Tutustu vakuutukseen">
      <details>
        <summary>
          <span>Tutustu vakuutukseen</span>
          <small>Lyhyt selitys ja vakuutusselosteet</small>
        </summary>
        <div class="insurance-plain-summary">
          <strong>Mitä vakuutus yleisesti tekee?</strong>
          <p>${escapeHtml(productCovers(meta))}</p>
        </div>
        ${renderMaterialDisclosure(materials)}
      </details>
    </section>
  `;
}

function renderMaterialDisclosure(materials = []) {
  return `
    <details class="material-disclosure">
      <summary>Vakuutusselosteet</summary>
      ${materials.length ? renderMaterialLinks(materials) : `<p class="material-empty">Tarkempi materiaali lisätään myöhemmin.</p>`}
    </details>
  `;
}

function renderMaterialLinks(materials = []) {
  if (!materials.length) return "";
  return `
    <div class="material-links">
      ${materials.map((item) => `
        <a class="material-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
          <small>${escapeHtml(materialTypeLabel(item.label))}</small>
          ${escapeHtml(item.label)}
        </a>
      `).join("")}
    </div>
  `;
}

function materialTypeLabel(label = "") {
  const text = label.toLocaleLowerCase("fi-FI");
  if (text.includes("avaintieto")) return "Avaintieto";
  if (text.includes("tuoteseloste")) return "Tuoteseloste";
  if (text.includes("ehto")) return "Ehdot";
  if (text.includes("materiaalilista")) return "Materiaalit";
  return "Tarkenne";
}

function primeContactSelection() {
  if (!st().recommendation) return;
  if (st().contactSelectionInitialized) return;
  recommendationKeysForContact().forEach((key) => {
    st().selectedContact[key] = true;
  });
  st().contactSelectionInitialized = true;
}

function recommendationKeysForContact() {
  const assessment = st().assessmentResult;
  if (assessment) {
    const keys = [
      ...(assessment.recommendedCovers || []).map((item) => item.key),
      ...(assessment.optionalCovers || []).filter((item) => item.active).map((item) => item.key),
      ...(assessment.riskAreas || []).flatMap((item) => item.relatedCovers || [])
    ].filter((key) => types()[key]);
    return [...new Set(keys)];
  }
  if (!st().recommendation) return [];
  return st().recommendation.items
    .filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key))
    .map((item) => item.key);
}

function recommendedContactKeys() {
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key] && types()[key]);
  return selected.filter((key) => recommendationAreaOrder[mode].includes(key));
}

function openContact() {
  if (!st().recommendation && Object.keys(st().baseAnswers).length) calculateAndRenderRecommendations();
  if (!st().recommendation) {
    startBaseInfo();
    return;
  }
  primeContactSelection();
  renderContact();
  showView("contact");
  track("contact_opened", { mode });
}

function renderContact() {
  $("contactOrgField")?.classList.toggle("hidden", mode !== "business");
  if (mode !== "business" && $("contactOrg")) $("contactOrg").value = "";
  const candidateKeys = recommendationKeysForContact();
  $("contactChoices").innerHTML = candidateKeys.length ? candidateKeys.map((key) => {
    const meta = types()[key];
    const checked = st().selectedContact[key] ? "checked" : "";
    const detailBadge = st().detailResults[meta.detailFlow] ? "Tarkennettu" : "";
    const badges = [meta.area, detailBadge].filter(Boolean).join(" · ");
    return `
      <label class="check-card">
        <input type="checkbox" data-contact-choice="${escapeHtml(key)}" ${checked}>
        <span><strong>${escapeHtml(meta.title)}</strong><br><span class="muted small">${escapeHtml(badges)}</span></span>
      </label>
    `;
  }).join("") : `<div class="check-card contact-readonly"><span><strong>Ei vielä valittuja vakuutusalueita</strong><br><span class="muted small">Voit kertoa tilanteesi lisätiedoissa.</span></span></div>`;
  $("contactChoices").querySelectorAll("[data-contact-choice]").forEach((input) => {
    input.addEventListener("change", () => {
      st().selectedContact[input.dataset.contactChoice] = input.checked;
      renderSummaryList();
      updateContactHandoffSummary();
      persistAssessment();
    });
  });
  restoreContactFields();
  readContactFields();
  updateContactHandoffSummary();
  ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "contactTimeline", "contactGoal", "currentInsuranceStatus", "freeText"].forEach((id) => {
    if (!$(id)) return;
    $(id).oninput = () => { readContactFields(); updateContactHandoffSummary(); persistAssessment(); };
    $(id).onchange = () => { readContactFields(); updateContactHandoffSummary(); persistAssessment(); };
  });
  if (mode !== "business" && $("contactOrg")) $("contactOrg").value = "";
}

function updateContactHandoffSummary() {
  if ($("contactHandoffSummary")) $("contactHandoffSummary").innerHTML = renderContactHandoffSummary();
}

function renderContactHandoffSummary() {
  const assessment = st().assessmentResult;
  const selectedAreas = recommendedContactKeys();
  const missingDetails = selectedAreas
    .filter((key) => types()[key]?.detailFlow && !st().detailResults[types()[key].detailFlow])
    .slice(0, 5);
  const shownItems = selectedAreas.map((key) => ({ key, title: types()[key].title, detail: productCovers(types()[key]) }));

  return `
    <section class="contact-handoff-summary" aria-labelledby="handoffTitle">
      <div>
        <p class="eyebrow compact">Ennen vahvistamista</p>
        <h4 id="handoffTitle">Nämä tiedot välitetään asiantuntijalle</h4>
        <p class="muted small">Kooste päivittyy, kun täydennät yhteydenoton tietoja. Voit palata muokkaamaan kartoituksen vastauksia.</p>
      </div>
      <div class="handoff-facts">
        <div><span>Asiakastyyppi ja tilanne</span><strong>${escapeHtml(expertProfileSummary(assessment))}</strong></div>
        ${expertRiskFacts(assessment).map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join("")}
        <div><span>Lakisääteiset tarkistukset</span><strong>${escapeHtml(assessment.mandatoryChecks?.map((item) => item.name).join(", ") || "Ei tunnistettuja")}</strong></div>
        <div><span>Nykyinen vakuutustilanne</span><strong>${escapeHtml(st().contact.currentInsuranceStatus || "Ei vielä valittu")}</strong></div>
        <div><span>Tavoite ja aikataulu</span><strong>${escapeHtml([st().contact.contactGoal, st().contact.contactTimeline].filter(Boolean).join(" · ") || "Ei vielä valittu")}</strong></div>
        <div><span>Yhteydenottotapa</span><strong>${escapeHtml([st().contact.contactChannel, st().contact.contactTime].filter(Boolean).join(" · ") || "Ei vielä valittu")}</strong></div>
        <div><span>Epävarmat tai avoimet tiedot</span><strong>${escapeHtml(missingDetails.length ? missingDetails.map((key) => types()[key].title).join(", ") : "Ei tunnistettuja avoimia turvatasoja")}</strong></div>
      </div>
      ${shownItems.length ? `
        <div class="contact-handoff-list">
          ${shownItems.map((item) => `
            <div class="contact-handoff-line">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="contact-handoff-empty">Voit valita vakuutusalueet alla tai kuvata tilanteesi vapaatekstissä.</div>
      `}
      ${missingDetails.length ? `
        <details class="contact-pending-details">
          <summary>Tarkennettavaa asiantuntijan kanssa (${missingDetails.length})</summary>
          <div class="contact-handoff-list compact">
            ${missingDetails.map((key) => `
              <div class="contact-handoff-line">
                <strong>${escapeHtml(types()[key].title)}</strong>
                <span>Turvan rakenne tai laajuus on vielä avoin.</span>
              </div>
            `).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function expertProfileSummary(assessment) {
  if (mode === "business") return `${assessment.profile.industry} · ${assessment.profile.employeeBand}`;
  return (baseQuestions.personal || []).map((question) => {
    const label = getOptionLabel(question, st().baseAnswers[question.id]);
    const other = st().baseAnswers[`${question.id}Other`];
    return other ? `${label}: ${other}` : label;
  }).filter(Boolean).join(" · ");
}

function expertRiskFacts(assessment) {
  if (mode !== "business") {
    return [
      { label: "Omaisuus ja ajoneuvot", value: [st().selectedRelevantNeeds.includes("vehicle") ? "Ajoneuvo" : "", st().selectedRelevantNeeds.some((id) => ["home", "building_or_cottage", "cottage_forest_boat"].includes(id)) ? "Koti tai muu omaisuus" : ""].filter(Boolean).join(", ") || "Ei erillisiä valintoja" }
    ];
  }
  return [
    { label: "Henkilöstö", value: assessment.profile.hasEmployees ? assessment.profile.employeeBand : "Vain yrittäjä" },
    { label: "Ajoneuvot", value: assessment.profile.hasVehicles ? "Ajoneuvoja tai kuljetuksia tunnistettu" : "Ei tunnistettu" },
    { label: "Omaisuus ja toimitilat", value: st().selectedRelevantNeeds.includes("property_or_assets") ? "Omaisuutta tai toimitiloja tunnistettu" : "Ei erillistä valintaa" }
  ];
}

function openCustomerSummary(showCrm = false) {
  if (!st().recommendation && Object.keys(st().baseAnswers).length) calculateAndRenderRecommendations();
  if (!st().assessmentResult) {
    startBaseInfo();
    return;
  }
  renderCustomerSummary();
  $("customerSummaryContent").querySelectorAll("[data-card-refine]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.cardRefine || ""));
  });
  $("customerSummaryContent").querySelectorAll("[data-summary-comparison]").forEach((button) => {
    button.addEventListener("click", () => {
      const first = firstRelevantDetailFlow(st().assessmentResult);
      if (first) openDetail(first);
    });
  });
  const crmDetails = $("crmSummaryDetails");
  const showContactSummary = showCrm || st().crmSummaryCreated;
  crmDetails.classList.toggle("hidden", !showContactSummary);
  crmDetails.open = Boolean(showCrm);
  $("summaryRefine").classList.remove("hidden");
  showView("summary");
  track("customer_summary_opened", { mode, flowType: st().assessmentResult.flowType });
}

function renderCustomerSummary() {
  const assessment = st().assessmentResult;
  const covers = customerSummaryCovers(assessment);
  const baseRows = (baseQuestions[mode] || []).map((question) => {
    const answer = getOptionLabel(question, st().baseAnswers[question.id]);
    const other = st().baseAnswers[question.id] === "other" ? st().baseAnswers[`${question.id}Other`] : "";
    return `<div><span>${escapeHtml(question.title)}</span><strong>${escapeHtml(`${answer}${other ? `: ${other}` : ""}`)}</strong></div>`;
  }).join("");
  const refinedCount = covers.filter((item) => st().detailResults[types()[item.key]?.detailFlow]).length;
  const mandatoryCount = assessment.mandatoryChecks?.length || 0;
  const firstComparison = firstRelevantDetailFlow(assessment);

  $("customerSummaryContent").innerHTML = `
    <section class="customer-summary-hero">
      <div>
        <span class="summary-status">${escapeHtml(flowTypeLabel(assessment.flowType))}</span>
        <h4>${escapeHtml(assessment.title)}</h4>
        <p>${escapeHtml(assessment.summary)}</p>
      </div>
      <div class="summary-score">
        <span>Tilanteeseesi liittyvät vakuutukset</span>
        <strong>${escapeHtml(String(covers.length))}</strong>
        <small>${escapeHtml(`${mandatoryCount} lakisääteistä tarkistusta · ${refinedCount} turvatasoa tarkennettu`)}</small>
      </div>
    </section>

    <nav class="summary-section-nav" aria-label="Yhteenvedon jatkotoimet">
      <button type="button" data-summary-comparison ${firstComparison ? "" : "disabled"}>Vertaile turvatasoja</button>
      <button type="button" data-card-refine="${escapeHtml(firstComparison)}" ${firstComparison ? "" : "disabled"}>Tarkenna ensimmäistä vakuutusta</button>
    </nav>

    <section class="customer-summary-section">
      <div class="customer-summary-title">
        <div>
          <p class="eyebrow compact">Tilanteesi</p>
          <h4>Kartoituksen lähtötiedot</h4>
        </div>
        <span>Tallennettu vain tähän selaimeen</span>
      </div>
      <div class="summary-profile-grid">${baseRows}</div>
    </section>

    ${assessment.mandatoryChecks?.length ? `
      <section class="customer-summary-section important-summary">
        <div class="customer-summary-title">
          <div>
            <p class="eyebrow compact">Tarkista ensin</p>
            <h4>Lakisääteisesti tarkistettavat vakuutukset</h4>
          </div>
          <span>${escapeHtml(`${assessment.mandatoryChecks.length} kohtaa`)}</span>
        </div>
        <div class="summary-mandatory-list">
          ${assessment.mandatoryChecks.map((item) => `
            <article>
              <span aria-hidden="true">!</span>
              <div><strong>${escapeHtml(item.name)}</strong><p><b>Mitä vakuutus tekee?</b> ${escapeHtml(mandatoryInsuranceSummary(item))}</p><p><b>Miksi sinulle?</b> ${escapeHtml(item.text)}</p></div>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${assessment.riskAreas?.length ? `
      <section class="customer-summary-section">
        <div class="customer-summary-title">
          <div>
            <p class="eyebrow compact">Asiantuntijakeskustelun pohja</p>
            <h4>Keskeiset riskialueet</h4>
          </div>
        </div>
        <div class="summary-cover-grid">
          ${assessment.riskAreas.map((item) => `
            <article class="summary-cover-card">
              <h5>${escapeHtml(item.title)}</h5>
              <p>${escapeHtml(item.description)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${covers.length ? `
      <section class="customer-summary-section">
        <div class="customer-summary-title">
          <div>
            <p class="eyebrow compact">Vakuutuskokonaisuus</p>
            <h4>Sinulle nousseet vakuutusalueet</h4>
          </div>
          <span>${escapeHtml(`${covers.length} aluetta · ${refinedCount} tarkennettu`)}</span>
        </div>
        <div class="summary-cover-grid">
          ${covers.map((item) => renderCustomerSummaryCover(item, assessment)).join("")}
        </div>
      </section>
    ` : ""}

    ${renderDetailAnswersSummary()}

    <section class="customer-summary-section summary-next-steps">
      <div class="customer-summary-title">
        <div>
          <p class="eyebrow compact">Seuraavat askeleet</p>
          <h4>Voit jatkaa omaan tahtiisi</h4>
        </div>
      </div>
      <div class="summary-step-list">
        <div><strong>1</strong><span><b>Tarkenna tarvittaessa.</b> Voit vertailla vakuutuskohtaisia turvatasoja ja muuttaa valintojasi.</span></div>
        <div><strong>2</strong><span><b>Tutustu vakuutusselosteisiin.</b> Tarkat sisällöt, rajoitukset ja omavastuut löytyvät vakuutusten materiaaleista.</span></div>
        <div><strong>3</strong><span><b>Jatka halutessasi.</b> Tarkka sisältö, soveltuvuus ja hinta varmistetaan asiantuntijan kanssa.</span></div>
      </div>
    </section>
  `;
}

function renderDetailAnswersSummary() {
  const groups = Object.entries(st().detailAnswers).map(([detailKey, answers]) => {
    const currentFlow = flow(detailKey);
    if (!currentFlow) return "";
    const rows = (currentFlow.questions || []).flatMap((question) => {
      const values = toArray(answers[question.id]);
      if (!values.length) return [];
      const labels = values.map((value) => getOptionLabel(question, value));
      const other = answers[`${question.id}Other`];
      return [`<div><span>${escapeHtml(question.title)}</span><strong>${escapeHtml(`${labels.join(", ")}${other ? `: ${other}` : ""}`)}</strong></div>`];
    }).join("");
    return rows ? `<article><h5>${escapeHtml(currentFlow.title)}</h5><div class="summary-profile-grid">${rows}</div></article>` : "";
  }).filter(Boolean);
  if (!groups.length) return "";
  return `<section class="customer-summary-section"><div class="customer-summary-title"><div><p class="eyebrow compact">Tarkentavat vastaukset</p><h4>Vakuutuskohtaiset tiedot</h4></div></div><div class="detail-answer-groups">${groups.join("")}</div></section>`;
}

function customerSummaryCovers(assessment) {
  const byKey = new Map();
  [
    ...(assessment.recommendedCovers || []),
    ...(assessment.optionalCovers || []).filter((item) => item.active)
  ].forEach((item) => {
    if (types()[item.key] && !byKey.has(item.key)) byKey.set(item.key, item);
  });
  return [...byKey.values()];
}

function renderCustomerSummaryCover(item, assessment) {
  const meta = types()[item.key];
  const level = assessment.selectedCoverageLevels?.[item.key];
  const detailKey = meta.detailFlow || "";
  const refined = Boolean(detailKey && st().detailResults[detailKey]);
  return `
    <article class="summary-cover-card ${refined ? "refined" : ""}">
      <div class="summary-cover-head">
        <h5>${escapeHtml(meta.title)}</h5>
        <span>${escapeHtml(refined ? "Tarkennettu" : "Alustava")}</span>
      </div>
      <p class="summary-cover-purpose"><b>Mitä vakuutus tekee?</b> ${escapeHtml(shortenText(productCovers(meta), 210))}</p>
      <p><b>Miksi sinulle?</b> ${escapeHtml(shortenText(item.reason || item.condition || productSummary(meta), 190))}</p>
      ${refined && level ? `
        <div class="summary-coverage-level">
          <span>Valittu turvataso</span>
          <strong>${escapeHtml(level.selectedTitle)}</strong>
        </div>
      ` : detailKey ? `
        <div class="summary-coverage-level pending">
          <span>Turvatasoa ei ole vielä verrattu</span>
          <button class="btn btn-secondary btn-small" type="button" data-card-refine="${escapeHtml(detailKey)}">Vertaile turvatasoja</button>
        </div>
      ` : ""}
    </article>
  `;
}

function restoreContactFields() {
  const contact = st().contact;
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "contactTimeline", "contactGoal", "currentInsuranceStatus", "freeText"]) {
    if ($(id) && Object.prototype.hasOwnProperty.call(contact, id)) $(id).value = contact[id] || "";
  }
  $("privacyConsent").checked = Boolean(contact.privacyConsent);
}

function readContactFields() {
  const contact = {};
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "contactTimeline", "contactGoal", "currentInsuranceStatus", "freeText"]) {
    contact[id] = $(id).value.trim();
  }
  if (mode !== "business") contact.contactOrg = "";
  contact.privacyConsent = $("privacyConsent").checked;
  st().contact = contact;
  return contact;
}

function createCrmSummary() {
  const contact = readContactFields();
  const error = validateContact(contact);
  $("formError").classList.toggle("hidden", !error);
  $("formError").textContent = error || "";
  if (error) return;

  $("crmSummary").value = buildCrmSummary(contact);
  st().crmSummaryCreated = true;
  openCustomerSummary(true);
  track("crm_summary_created", { mode });
}

function validateContact(contact) {
  if (!contact.contactName) return "Täytä nimi.";
  if (!contact.contactEmail || !contact.contactEmail.includes("@")) return "Täytä toimiva sähköpostiosoite.";
  if (!contact.privacyConsent) return "Hyväksy tietojen käyttö yhteydenottopyynnön käsittelyyn.";
  const selected = recommendedContactKeys();
  if (!selected.length && !contact.freeText) return "Valitse vähintään yksi vakuutus tai kuvaa tilanne vapaasti.";
  return "";
}

function buildCrmSummary(contact) {
  if (!st().assessmentResult) refreshAssessmentResult();
  const assessment = st().assessmentResult;
  const now = new Date();
  const lines = [];

  lines.push("VAKUUTUSKARTOITUKSEN YHTEENVETO");
  lines.push(`Luotu: ${now.toLocaleString("fi-FI")}`);
  lines.push("");
  lines.push("Yhteystiedot");
  lines.push(`- Nimi: ${contact.contactName}`);
  if (contact.contactOrg) lines.push(`- Yritys: ${contact.contactOrg}`);
  lines.push(`- Sähköposti: ${contact.contactEmail}`);
  if (contact.contactPhone) lines.push(`- Puhelin: ${contact.contactPhone}`);
  lines.push(`- Toivottu yhteydenottotapa: ${contact.contactChannel || "Ei valittu"}`);
  lines.push(`- Paras aika ottaa yhteyttä: ${contact.contactTime || "Ei valittu"}`);
  lines.push(`- Asian ajankohtaisuus: ${contact.contactTimeline || "Ei valittu"}`);
  lines.push(`- Asiakkaan tavoite: ${contact.contactGoal || "Ei valittu"}`);
  lines.push(`- Nykyinen vakuutustilanne: ${contact.currentInsuranceStatus || "Ei valittu"}`);
  lines.push("");
  lines.push("Asiakkaan profiili");
  lines.push(`- Asiakastyyppi: ${profile().label}`);
  (baseQuestions[mode] || []).forEach((question) => {
    const answer = getOptionLabel(question, st().baseAnswers[question.id]);
    const other = st().baseAnswers[question.id] === "other" ? st().baseAnswers[`${question.id}Other`] : "";
    lines.push(`- ${question.title}: ${answer}${other ? ` (${other})` : ""}`);
  });
  lines.push("");
  lines.push("Kartoituksen tyyppi");
  lines.push(`- ${flowTypeLabel(assessment.flowType)}`);

  if (assessment.mandatoryChecks.length) {
    lines.push("");
    lines.push("Pakolliset / lakisääteisesti tarkistettavat");
    assessment.mandatoryChecks.forEach((item) => lines.push(`- ${item.name}: ${item.text}`));
  }

  if (assessment.recommendedCovers.length) {
    lines.push("");
    lines.push("Suositellut vakuutusalueet");
    assessment.recommendedCovers.forEach((item) => {
      lines.push(`- ${types()[item.key]?.title || item.key}: ${item.reason}`);
    });
  }

  const activeOptional = assessment.optionalCovers.filter((item) => item.active);
  if (activeOptional.length) {
    lines.push("");
    lines.push("Tilanteesta riippuvat lisäturvat");
    activeOptional.forEach((item) => lines.push(`- ${types()[item.key]?.title || item.key}: ${item.condition}`));
  }

  if (assessment.riskAreas.length) {
    lines.push("");
    lines.push("Keskeiset riskialueet keskusteluun");
    assessment.riskAreas.forEach((item) => lines.push(`- ${item.title}: ${item.description}`));
  }

  if (assessment.selectedRelevantNeeds.length) {
    const options = relevantNeedOptions(mode, st());
    lines.push("");
    lines.push("Asiakkaan valitsemat olennaiset tilanteet");
    assessment.selectedRelevantNeeds.forEach((id) => {
      lines.push(`- ${options.find((item) => item.id === id)?.label || id}`);
    });
  }

  const detailedAnswers = Object.entries(st().detailAnswers).flatMap(([detailKey, answers]) => {
    const currentFlow = flow(detailKey);
    if (!currentFlow) return [];
    const rows = (currentFlow.questions || []).flatMap((question) => {
      const values = toArray(answers[question.id]);
      if (!values.length) return [];
      const labels = values.map((value) => getOptionLabel(question, value));
      const other = answers[`${question.id}Other`];
      return [`  - ${question.title}: ${labels.join(", ")}${other ? ` (${other})` : ""}`];
    });
    return rows.length ? [`- ${currentFlow.title}`, ...rows] : [];
  });
  if (detailedAnswers.length) {
    lines.push("");
    lines.push("Vakuutuskohtaiset tarkentavat vastaukset");
    lines.push(...detailedAnswers);
  }

  const coverageLevels = Object.entries(assessment.selectedCoverageLevels || {}).filter(([, level]) => level.refined);
  if (coverageLevels.length) {
    lines.push("");
    lines.push("Valitut turvatasot");
    coverageLevels.forEach(([key, level]) => {
      lines.push(`- ${types()[key]?.title || key}: ${level.selectedTitle}`);
      lines.push(`  - Suositeltu taso: ${level.machineTitle}`);
      lines.push(`  - Suosituksen peruste: ${level.basis}`);
    });
  }

  if (assessment.sellerDiscussionPoints.length) {
    lines.push("");
    lines.push("Asiantuntijan keskustelupisteet");
    assessment.sellerDiscussionPoints.forEach((item) => lines.push(`- ${item}`));
  }

  if (st().chatMessages.length) {
    lines.push("");
    lines.push("Chat-avustajan käyttö");
    if (st().chatEscalated) lines.push("- Asiakas pyysi asiantuntijan mukaan samaan chat-keskusteluun.");
    st().chatMessages
      .filter((message) => message.role === "user")
      .slice(-3)
      .forEach((message) => lines.push(`- Asiakas kysyi: ${message.text}`));
    lines.push("- Chat käytti kartoituksen vastauksia taustakontekstina ilman yhteystietoja.");
  }
  if (contact.freeText) {
    lines.push("");
    lines.push("Vapaateksti");
    lines.push(contact.freeText);
  }

  return lines.join("\n");
}

function flowTypeLabel(flowType) {
  return {
    solution_package: "Yrityksen ratkaisupaketti",
    personal_solution_package: "Henkilöasiakkaan elämäntilannepaketti"
  }[flowType] || flowType;
}

function renderSummaryList() {
  if (!$("summaryList")) return;
  const assessment = st().assessmentResult;
  const detailEntries = Object.entries(st().detailResults);
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key]);
  const parts = [];

  parts.push(`<div class="summary-item"><strong>Asiakastyyppi</strong><span class="muted small">${escapeHtml(profile().label)}</span></div>`);
  if (assessment) {
    parts.push(`<div class="summary-item"><strong>Kartoituksen tyyppi</strong><span class="muted small">${escapeHtml(flowTypeLabel(assessment.flowType))}</span></div>`);
    const top = assessment.recommendedCovers.map((item) => types()[item.key]?.title).filter(Boolean).join(", ");
    const riskText = assessment.riskAreas.map((item) => item.title).slice(0, 3).join(", ");
    parts.push(`<div class="summary-item"><strong>${assessment.riskAreas.length ? "Riskialueet" : "Suositukset"}</strong><span class="muted small">${escapeHtml(top || riskText || "Asiantuntijan arvio")}</span></div>`);
    parts.push(`<div class="summary-item"><strong>Vapaaehtoinen tarkennus</strong><span class="muted small">${assessment.selectedRelevantNeeds.length ? `${assessment.selectedRelevantNeeds.length} valintaa` : "Ei valintoja"}</span></div>`);
  }

  if (detailEntries.length) {
    detailEntries.forEach(([detailKey, result]) => {
      const typeKey = Object.keys(types()).find((key) => types()[key].detailFlow === detailKey);
      parts.push(`<div class="summary-item"><strong>${escapeHtml(typeKey ? types()[typeKey].title : detailKey)}</strong><span class="muted small">${escapeHtml(result.title)}</span></div>`);
    });
  }

  parts.push(`<div class="summary-item"><strong>Yhteydenotto</strong><span class="muted small">${selected.length ? `${selected.length} aihetta valittuna` : "Ei valintoja"}</span></div>`);
  $("summaryList").innerHTML = parts.join("");
}

function renderChatPanel() {
  const panel = $("chatPanel");
  if (!panel) return;

  const messages = st().chatMessages;
  const startedAt = new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  panel.innerHTML = `
    <div class="chat-body" aria-live="polite">
      <p class="chat-started">Chat-keskustelu aloitettu</p>
      <div class="chat-line assistant">
        <span class="chat-name">ChatJenni (AI-avustaja)</span>
        <div class="chat-bubble">Tervetuloa chat-palveluun! Miten voisimme olla avuksi?</div>
        <span class="chat-time">${escapeHtml(startedAt)}</span>
      </div>
      ${messages.map((message) => `
        <div class="chat-line ${message.role === "user" ? "user" : "assistant"} ${message.role === "human" ? "human" : ""}">
          <span class="chat-name">${message.role === "user" ? "Sinä" : message.role === "human" ? "LähiTapiolan asiantuntija" : "ChatJenni (AI-avustaja)"}</span>
          <div class="chat-bubble">${escapeHtml(message.text)}</div>
        </div>
      `).join("")}
    </div>
    <div class="chat-compose">
      <div class="chat-handoff ${st().chatEscalated ? "connected" : ""}">
        ${st().chatEscalated ? `
          <strong>Asiantuntija voi jatkaa keskustelua</strong>
          <span>Kartoituksen vastaukset ja chat-keskustelu kulkevat mukana asiantuntijalle.</span>
        ` : `
          <span>AI auttaa ensin. Tarvittaessa voit pyytää asiantuntijan jatkamaan samaa keskustelua.</span>
          <button type="button" data-chat-handoff>Yhdistä asiantuntijalle</button>
        `}
      </div>
      <div class="chat-input-row">
        <textarea id="chatInput" maxlength="110" rows="3" placeholder="Kirjoita viesti..."></textarea>
        <button class="chat-send-button" type="button" data-chat-send aria-label="Lähetä viesti">➤</button>
      </div>
      <div class="chat-compose-meta"><span id="chatCounter">0</span>/110</div>
      <p class="chat-save-note">Chat käyttää kartoituksen tietoja vain tämän käyttökerran tukena. Älä kirjoita viestiin henkilötunnusta tai muita arkaluonteisia tietoja.</p>
    </div>
  `;
  bindChatActions(panel);
}

function openChatPopup() {
  $("chatPopup").classList.remove("hidden");
  $("chatLauncher").classList.add("hidden");
  $("chatPopup").classList.toggle("expanded", Boolean(st().chatExpanded));
  $("chatPopup").querySelector(".chat-window")?.classList.toggle("expanded", Boolean(st().chatExpanded));
  updateChatExpandButton();
  renderChatPanel();
  setTimeout(() => $("chatInput")?.focus(), 0);
  track("chat_opened", { mode });
}

function closeChatPopup() {
  $("chatPopup").classList.add("hidden");
  $("chatLauncher").classList.remove("hidden");
}

function toggleChatSize() {
  st().chatExpanded = !st().chatExpanded;
  $("chatPopup").classList.toggle("expanded", st().chatExpanded);
  $("chatPopup").querySelector(".chat-window")?.classList.toggle("expanded", st().chatExpanded);
  updateChatExpandButton();
}

function updateChatExpandButton() {
  const button = $("chatExpand");
  if (!button) return;
  button.setAttribute("aria-label", st().chatExpanded ? "Pienennä chat" : "Suurenna chat");
  button.setAttribute("title", st().chatExpanded ? "Pienennä" : "Suurenna");
  button.innerHTML = `<span aria-hidden="true">${st().chatExpanded ? "↙" : "⛶"}</span>`;
}

function bindChatActions(panel) {
  panel.querySelector("[data-chat-send]")?.addEventListener("click", () => {
    const input = $("chatInput");
    addChatQuestion(input?.value || "");
  });
  panel.querySelector("#chatInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      addChatQuestion(event.currentTarget.value || "");
    }
  });
  panel.querySelector("#chatInput")?.addEventListener("input", (event) => {
    $("chatCounter").textContent = String(event.currentTarget.value.length);
  });
  panel.querySelector("[data-chat-handoff]")?.addEventListener("click", () => requestChatHandoff());
}

function addChatQuestion(text) {
  const question = String(text || "").trim();
  if (!question) return;
  st().chatMessages.push({ role: "user", text: question });
  st().chatMessages.push({ role: "assistant", text: buildChatAnswer(question) });
  renderChatPanel();
  track("chat_question_added", { mode });
}

function requestChatHandoff() {
  if (st().chatEscalated) return;
  st().chatEscalated = true;
  st().chatMessages.push({
    role: "assistant",
    text: "Selvä. Kokoan kartoituksen vastaukset ja keskustelun asiantuntijalle, jotta sinun ei tarvitse aloittaa alusta."
  });
  st().chatMessages.push({
    role: "human",
    text: "Hei, sain kartoituksesi taustatiedot. Voin jatkaa tästä ja tarkistaa sopivan vakuutuskokonaisuuden kanssasi."
  });
  renderChatPanel();
  track("chat_handoff_requested", { mode });
}

function chatContext() {
  const aiContext = st().assessmentResult?.aiContext || st().aiContext;
  const topItems = (aiContext?.recommendedCovers || []).map((item) => ({
    key: item.key,
    reasons: [item.reason].filter(Boolean)
  }));
  const activeDetail = st().activeDetail && st().detailResults[st().activeDetail] ? st().activeDetail : "";
  const activeType = activeDetail ? typeKeyFromDetail(activeDetail) : "";
  const topTitle = topItems[0] ? types()[topItems[0].key].title : "";
  const suggestions = [
    topTitle ? `Miksi minulle suositellaan: ${topTitle}?` : "Miten tämä kartoitus auttaa minua?",
    activeType ? "Mitä eroa näillä turvavaihtoehdoilla on?" : "Mitä minun kannattaa tehdä seuraavaksi?",
    "Mitä tietoja asiantuntijalle välitetään?"
  ];
  return { aiContext, topItems, activeDetail, activeType, suggestions };
}

function buildChatAnswer(question) {
  const context = chatContext();
  const lowered = question.toLocaleLowerCase("fi-FI");
  const topItems = context.topItems;

  if (!context.aiContext) {
    return "Aloita täyttämällä perustiedot. Sen jälkeen voin selittää muodostettua vakuutuskokonaisuutta, turvatasoja ja seuraavia vaiheita.";
  }

  if (st().chatEscalated) {
    return "Asiantuntija voi jatkaa tästä samasta keskustelusta. Näet ennen yhteydenottoa, mitä tietoja hänelle välitetään: asiakastyyppi, kartoituksen vastaukset, suositellut vakuutusalueet, avoimet kysymykset ja valitsemasi turvatasot.";
  }

  if (lowered.includes("hinta") || lowered.includes("laskuri")) {
    return "Tämä kartoitus ei laske hintaa. Sen tarkoitus on tunnistaa tilanteeseesi liittyvät vakuutukset ja auttaa vertailemaan turvatasoja. Tarkka sisältö ja hinta varmistetaan asiantuntijan kanssa.";
  }

  if (lowered.includes("ero") || lowered.includes("turva") || lowered.includes("laaja") || lowered.includes("suppea")) {
    const detail = context.activeDetail ? st().detailResults[context.activeDetail] : null;
    if (detail?.comparison) {
      const selected = selectedCoverageOption(context.activeDetail, detail.comparison);
      const recommended = detail.comparison.recommended.map((option) => option.title).join(", ");
      return `Koneen ehdotus on ${recommended}. Valitsemasi vaihtoehto on ${selected?.title || recommended}. Erot kannattaa lukea vertailutaulukosta: siellä näkyy, mitä taso tarkoittaa, kenelle se sopii, mitä se voi kattaa ja mitä rajoituksia pitää tarkistaa.`;
    }
    return "Turvatasojen erot näkyvät tarkennusvaiheessa vakuutuskohtaisesti. En pakota samaa mallia kaikkiin vakuutuksiin, vaan esimerkiksi matkavakuutuksessa vertaillaan jatkuvaa ja matkakohtaista ratkaisua.";
  }

  if (lowered.includes("miksi") || lowered.includes("suosit")) {
    if (!topItems.length) return "Profiilisi perusteella valmis vakuutuspaketti ei ole oikea etenemistapa. Asiantuntija voi arvioida kokonaisuuden nykyisten tietojen pohjalta.";
    const lines = topItems.map((item) => `${types()[item.key].title}: ${item.reasons.slice(0, 2).join("; ") || types()[item.key].desc}`);
    return `Nykyisen kartoitustuloksen perusteella tärkeimmät tarkistettavat aiheet ovat ${topItems.map((item) => types()[item.key].title).join(", ")}. Perustelut: ${lines.join(" | ")}.`;
  }

  const topText = topItems.length ? topItems.map((item) => types()[item.key].title).join(", ") : context.aiContext.riskAreas.map((item) => item.title).join(", ") || "asiantuntijan arvio";
  return `Kartoituksesi nykyiset keskeiset aiheet ovat: ${topText}. Voin selittää tämän kartoitustuloksen suosituksia, lakisääteisiä tarkistuksia, valittuja turvatasoja ja seuraavia vaiheita.`;
}

function showView(next) {
  const activeView = {
    intro: "introView",
    base: "baseInfoView",
    quick: "questionView",
    results: "resultsView",
    detail: "detailView",
    detailResult: "detailResultView",
    contact: "contactView",
    summary: "summaryView"
  }[next];

  views.forEach((id) => $(id).classList.toggle("hidden", id !== activeView));
  const focusOnly = ["intro", "base", "quick", "results", "detail", "detailResult", "contact", "summary"].includes(next);
  $("appShell")?.classList.toggle("flow-only", focusOnly);
  updateSteps(next);
  renderSummaryList();
  renderChatPanel();
  savedView = next;
  persistAssessment();
}

function updateSteps(viewName) {
  const activeIndex = viewName === "intro" || viewName === "base" ? 0
    : viewName === "results" ? 1
      : viewName === "quick" || viewName === "detail" || viewName === "detailResult" ? 2
        : 3;

  steps.forEach((id, index) => {
    $(id).classList.toggle("active", index === activeIndex);
    $(id).classList.toggle("done", index < activeIndex);
  });
}

function restartAssessment() {
  resetAssessment("base");
}

function resetAssessment(next = "intro") {
  if (hasProgress() && !window.confirm("Haluatko varmasti tyhjentää kaikki vastaukset ja aloittaa alusta?")) return;
  states[mode] = freshState();
  removePersistedAssessment();
  restoredFromStorage = false;
  persistedAt = "";
  renderIntro();
  renderBaseInfo();
  renderChatPanel();
  renderSummaryList();
  closeChatPopup();
  showView(next === "base" ? "base" : "intro");
  updateResumeNotice();
  track("assessment_restarted", { mode });
}

function hasProgress() {
  const current = st();
  return Boolean(
    Object.keys(current.baseAnswers).length ||
    Object.keys(current.quickAnswers).length ||
    current.selectedRelevantNeeds.length ||
    current.recommendation ||
    Object.keys(current.detailAnswers).length ||
    Object.keys(current.detailResults).length ||
    Object.keys(current.selectedContact).length ||
    Object.keys(current.contact).length ||
    current.chatMessages.length
  );
}

function hasAssessmentProgress() {
  const current = st();
  return Boolean(
    Object.keys(current.baseAnswers).length ||
    current.selectedRelevantNeeds.length ||
    Object.keys(current.detailAnswers).length ||
    Object.keys(current.detailResults).length ||
    Object.keys(current.selectedCoverage).length
  );
}

function persistAssessment() {
  if (!appReady) return;
  try {
    if (!hasAssessmentProgress()) {
      removePersistedAssessment();
      return;
    }
    const current = st();
    const state = {
      baseAnswers: current.baseAnswers,
      quickIndex: current.quickIndex,
      quickAnswers: current.quickAnswers,
      recommendationRefined: current.recommendationRefined,
      selectedRelevantNeeds: current.selectedRelevantNeeds,
      selectedContact: current.selectedContact,
      activeDetail: current.activeDetail,
      detailIndex: current.detailIndex,
      detailAnswers: current.detailAnswers,
      detailResults: current.detailResults,
      selectedCoverage: current.selectedCoverage,
      comparisonPairs: current.comparisonPairs,
      comparisonOnlyDifferences: current.comparisonOnlyDifferences,
      comparisonExpanded: current.comparisonExpanded,
      contactSelectionInitialized: current.contactSelectionInitialized
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      mode,
      view: savedView,
      savedAt: new Date().toISOString(),
      state
    }));
  } catch {
    // Kartoitus toimii myös silloin, kun selain estää paikallisen tallennuksen.
  }
}

function restoreSavedAssessment() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    if (payload.version !== STORAGE_VERSION || !["personal", "business"].includes(payload.mode) || !payload.state) {
      removePersistedAssessment();
      return;
    }
    mode = payload.mode;
    states[mode] = {
      ...freshState(),
      ...payload.state,
      contact: {},
      chatMessages: [],
      chatEscalated: false,
      chatExpanded: false,
      crmSummaryCreated: false
    };
    savedView = ["base", "quick", "results", "detail", "detailResult", "summary"].includes(payload.view) ? payload.view : "results";
    persistedAt = payload.savedAt || "";
    restoredFromStorage = hasAssessmentProgress();
    if (hasCompleteBaseInfo()) {
      st().recommendation = calculateScores(mode, st().quickAnswers, st().baseAnswers);
      refreshAssessmentResult();
    }
  } catch {
    removePersistedAssessment();
  }
}

function removePersistedAssessment() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Tallennuksen puuttuminen ei estä kartoituksen käyttöä.
  }
}

function updateResumeNotice() {
  const notice = $("resumeNotice");
  if (!notice) return;
  notice.classList.toggle("hidden", !restoredFromStorage);
  if (!restoredFromStorage) return;
  const savedTime = persistedAt ? new Date(persistedAt).toLocaleString("fi-FI", { dateStyle: "short", timeStyle: "short" }) : "";
  $("resumeDescription").textContent = `${profile().label} · ${savedTime ? `tallennettu ${savedTime}` : "voit jatkaa siitä, mihin jäit"}.`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toLocaleUpperCase("fi-FI") + text.slice(1);
}

function shortenText(value, maxLength = 160) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${shortened}.`;
}

init();
