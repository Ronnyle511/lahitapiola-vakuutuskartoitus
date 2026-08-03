import { baseQuestions, coverageModels, detailFlows, getAnswerLabels, getOptionLabel, insuranceTypes, profiles, quickQuestions } from "./data.js";
import { buildDetailResult } from "./detailResults.js";
import { calculateScores, recommendedKeys, toArray } from "./scoring.js";
import { indicativePriceSymbol, priceImpactDisclaimer } from "./solutionData.js";
import { buildAssessmentResult, relevantNeedOptions } from "./solutionEngine.js";
import { track } from "./analytics.js";

const $ = (id) => document.getElementById(id);
const views = ["introView", "baseInfoView", "questionView", "resultsView", "detailView", "detailResultView", "contactView", "summaryView"];
const steps = ["step1", "step2", "step3", "step4"];
const STORAGE_KEY = "lahitapiola-vakuutuskartoitus-v6";
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
    pricingPayload: null,
    contactSummary: "",
    aiContext: null,
    selectedContact: {},
    selectedPrice: {},
    activeDetail: null,
    detailIndex: 0,
    detailAnswers: {},
    detailResults: {},
    selectedCoverage: {},
    priceEstimateInterest: false,
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
    Object.entries(answers).filter(([key]) => visibleIds.has(key) || defaultIds.has(key))
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
  renderCalculatorPanel();
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
  renderCalculatorPanel();
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
  renderCalculatorPanel();
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
  renderCalculatorPanel();
  renderChatPanel();
  renderSummaryList();
}

function refreshAssessmentResult() {
  st().assessmentResult = buildAssessmentResult(mode, st(), st().recommendation);
  st().pricingPayload = st().assessmentResult.pricingPayload;
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
  $("recommendationInsights").innerHTML = renderAssessmentOverview(assessment);
  renderResultsPrimaryAction(recommendation);
  $("contactFromResults")?.classList.remove("hidden");

  const buckets = assessmentBuckets(assessment);
  $("recommendationBuckets").innerHTML = `${buckets.map(renderBucket).join("")}${renderNextStepPrompt(assessment)}`;
  $("recommendationBuckets").querySelector("[data-refine-recommendations]")?.addEventListener("click", () => refineTopRecommendation());
  $("recommendationBuckets").querySelector("[data-summary-next]")?.addEventListener("click", () => openCustomerSummary());
  $("recommendationBuckets").querySelector("[data-expert-contact]")?.addEventListener("click", () => openContact());
  $("recommendationBuckets").querySelectorAll("[data-card-refine]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.cardRefine || ""));
  });
}

function resultsTitleFor(assessment) {
  if (assessment.flowType === "direct_expert_contact") return "Asiantuntijan arvio yrityksellenne";
  if (assessment.flowType === "risk_area_discussion") return "Yrityksenne keskeiset riskialueet";
  return st().recommendationRefined ? "Tarkennettu vakuutuskokonaisuus" : "Alustava vakuutuskokonaisuus";
}

function resultsIntroFor(assessment) {
  if (assessment.flowType === "solution_package") {
    return "Yritysprofiilin perusteella muodostimme alustavan vakuutuskokonaisuuden. Tässä vaiheessa tunnistetaan vakuutusalueet. Sopiva turvataso arvioidaan vasta vakuutuskohtaisten tarkentavien kysymysten jälkeen.";
  }
  if (assessment.flowType === "risk_area_discussion") {
    return "Alla olevat alueet eivät ole valmis vakuutuspaketti, vaan keskustelun pohja nykyisen vakuutusohjelman ja riskien tarkistamiseen.";
  }
  if (assessment.flowType === "direct_expert_contact") {
    return "Tämän kokoinen yritys tarvitsee räätälöidyn vakuutusohjelman ja suoran yritysasiantuntijan arvion.";
  }
  return `${assessment.summary} Tässä vaiheessa näet olennaiset vakuutusalueet. Turvatasoa ehdotetaan vasta tarkentavien kysymysten jälkeen.`;
}

function renderAssessmentOverview(assessment) {
  if (assessment.flowType === "direct_expert_contact") {
    return `
      <section class="solution-overview expert-overview">
        <p class="eyebrow compact">Räätälöity kokonaisuus</p>
        <h4>Yrityksenne kokoluokka vaatii räätälöidyn vakuutuskokonaisuuden.</h4>
        <p>Tämän kokoisissa yrityksissä vakuutusturvaan voivat vaikuttaa esimerkiksi useat toimipisteet, suuret omaisuusarvot, sopimusvastuut, kansainvälinen toiminta, henkilöstöriskit, toimitusketjut, nykyinen vakuutusohjelma ja mahdollinen vakuutusmeklari.</p>
        ${renderDiscussionPoints(assessment.sellerDiscussionPoints)}
      </section>
    `;
  }

  if (assessment.flowType === "risk_area_discussion") {
    return `
      <section class="solution-overview">
        <p class="eyebrow compact">Riskialuekartoitus</p>
        <h4>Yrityksenne kokoluokassa vakuutustarvetta kannattaa tarkastella riskialueittain yhdessä yritysasiantuntijan kanssa.</h4>
        <div class="risk-area-grid">
          ${assessment.riskAreas.map((item) => `
            <article class="risk-area-card">
              <h5>${escapeHtml(item.title)}</h5>
              <p>${escapeHtml(item.description)}</p>
            </article>
          `).join("")}
        </div>
      </section>
      ${renderMandatoryChecks(assessment.mandatoryChecks)}
    `;
  }

  return `
    <section class="solution-overview">
      <p class="eyebrow compact">${mode === "business" ? "Yritysprofiiliin perustuva ratkaisu" : "Elämäntilanteeseen perustuva ratkaisu"}</p>
      <h4>${escapeHtml(assessment.title)}</h4>
      <p>${escapeHtml(assessment.summary)}</p>
    </section>
    ${mode === "business" ? renderMandatoryChecks(assessment.mandatoryChecks) : ""}
  `;
}

function renderMandatoryChecks(checks = []) {
  if (!checks.length) return "";
  const countLabel = checks.length === 1 ? "1 tarkistettava vakuutus" : `${checks.length} tarkistettavaa vakuutusta`;
  return `
    <section class="mandatory-section">
      <div class="mandatory-intro">
        <span class="mandatory-icon" aria-hidden="true">!</span>
        <div>
          <p class="eyebrow compact">Tärkeä tarkistus</p>
          <h4>Yritykselläsi voi olla lakisääteisiä vakuutusvelvollisuuksia</h4>
          <p>Vastaustesi perusteella tunnistimme ${escapeHtml(countLabel)}. Tarkka vakuuttamisvelvollisuus varmistetaan aina yrityksen tilanteen perusteella.</p>
        </div>
      </div>
      <details class="mandatory-disclosure">
        <summary>
          <span>Avaa lakisääteisesti tarkistettavat vakuutukset</span>
          <span class="mandatory-count">${escapeHtml(countLabel)}</span>
        </summary>
        <div class="mandatory-content">
          <p class="mandatory-guidance">Tarkista nämä ennen vapaaehtoisen vakuutusturvan valintaa.</p>
          <div class="mandatory-list">
            ${checks.map((item) => `
              <article>
                <span class="mandatory-item-icon" aria-hidden="true">✓</span>
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <span>${escapeHtml(item.text)}</span>
                </div>
              </article>
            `).join("")}
          </div>
          <p class="mandatory-note">Asiantuntija auttaa varmistamaan, mitkä vakuutukset ovat yrityksellesi lakisääteisiä.</p>
        </div>
      </details>
    </section>
  `;
}

function renderDiscussionPoints(points = []) {
  if (!points.length) return "";
  return `
    <div class="discussion-points">
      <strong>Asiantuntijakeskustelussa tarkistetaan</strong>
      <ul>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
    </div>
  `;
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

  return [
    {
      key: "primary",
      title: mode === "business" ? "Toimialalle yleensä tärkeät" : "Tilanteeseesi yleensä tärkeät",
      desc: mode === "business"
        ? "Nämä vakuutusalueet ovat profiilisi perusteella yleensä olennaisia tämän tyyppisessä toiminnassa."
        : "Nämä vakuutusalueet muodostavat elämäntilanteesi perusteella alustavan kokonaisuuden.",
      items: primary
    },
    {
      key: "possible",
      title: "Tilanteesta riippuvat",
      desc: mode === "business"
        ? "Nämä voivat olla tärkeitä, jos ne liittyvät yrityksenne arkeen, järjestelmiin, ajoneuvoihin, kuljetuksiin tai erityisiin riskeihin."
        : "Nämä voivat täydentää kokonaisuutta omien valintojesi ja elämäntilanteesi mukaan.",
      items: possible
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

function renderResultsPrimaryAction(recommendation) {
  const button = $("contactFromResults");
  if (!button) return;
  if (st().assessmentResult?.flowType === "direct_expert_contact") {
    button.textContent = "Näytä arvio ja keskustelukohdat";
    return;
  }
  button.textContent = "Näytä oma yhteenveto";
}

function resultsPrimaryAction() {
  openCustomerSummary();
}

function recommendationBuckets(recommendation) {
  const visibleItems = recommendation.items.filter((item) => recommendationAreaOrder[mode].includes(item.key));
  const relevant = visibleItems.filter((item) => item.score >= 3);
  const primary = relevant.slice(0, 3);
  const possible = relevant.slice(3);
  const notNow = visibleItems.filter((item) => item.score < 3);

  return [
    {
      key: "primary",
      title: "Tärkeimmät vakuutettavat kohteet",
      desc: "Aloita näistä. Näissä vastauksesi muodostivat selkeimmän tarpeen tai riskin.",
      items: primary
    },
    {
      key: "possible",
      title: "Muut mahdolliset kohteet",
      desc: "Nämä voivat täydentää kokonaisuutta. Voit avata ne tarvittaessa myöhemmin.",
      items: possible
    },
    {
      key: "notNow",
      title: "Muut vakuutusalueet",
      desc: "Nämä eivät nousseet nykytilanteessa vahvasti esiin, mutta voit tutustua niihin.",
      items: notNow
    }
  ];
}

function hasRefinableRecommendations(recommendation = st().recommendation) {
  if (!recommendation) return false;
  return recommendation.items
    .filter((item) => recommendationAreaOrder[mode].includes(item.key) && item.score >= 3)
    .some((item) => types()[item.key]?.detailFlow && flow(types()[item.key].detailFlow));
}

function renderNextStepPrompt(assessment) {
  if (assessment.flowType === "direct_expert_contact") {
    return `
      <section class="refine-card next-step-card">
        <div>
          <p class="eyebrow compact">Seuraava askel</p>
          <h4>Katso arvio ja valmistaudu asiantuntijakeskusteluun</h4>
          <p>Yhteenveto kokoaa yritysprofiilin, keskeiset riskialueet ja keskustelussa tarkistettavat asiat.</p>
        </div>
        <div class="refine-actions">
          <button class="btn btn-primary" type="button" data-summary-next>Näytä oma yhteenveto</button>
          <button class="btn btn-soft" type="button" data-expert-contact>Pyydä asiantuntijan yhteydenottoa</button>
        </div>
      </section>
    `;
  }

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

function renderRecommendationInsights(recommendation) {
  const relevant = recommendation.items.filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key));
  if (!relevant.length) {
    return `
      <section class="needs-summary">
        <div>
          <p class="eyebrow compact">Tunnistetut tarpeet</p>
        <h4>Vahvoja osumia ei vielä noussut</h4>
        <p class="muted">Voit silti tarkistaa yksittäisiä vakuutuksia tai pyytää asiantuntijaa arvioimaan tilanteen.</p>
      </div>
      ${renderRiskProfileDetails(recommendation)}
      </section>
    `;
  }

  const top = relevant.slice(0, 3);
  const summaryTitle = mode === "business"
    ? "Yrityksesi tärkeimmät vakuutustarpeet"
    : "Tärkeimmät tunnistetut tarpeet";
  const summaryText = mode === "business"
    ? `Vastaustesi perusteella yrityksen vakuutustarpeet painottuvat erityisesti: ${top.map((item) => types()[item.key].title).join(", ")}.`
    : `Vastaustesi perusteella kannattaa tarkastella erityisesti: ${top.map((item) => types()[item.key].title).join(", ")}.`;

  return `
    <section class="needs-summary">
      <div>
        <p class="eyebrow compact">Tunnistetut tarpeet</p>
        <h4>${escapeHtml(summaryTitle)}</h4>
        <p>${escapeHtml(summaryText)}</p>
      </div>
      ${renderRiskProfileDetails(recommendation)}
    </section>
  `;
}

function renderRiskProfileDetails(recommendation) {
  return `
    <details class="risk-profile-details">
      <summary>Näytä riskiprofiili</summary>
      ${renderRiskProfile(recommendation)}
    </details>
  `;
}

function renderRiskProfile(recommendation) {
  const profiles = mode === "business"
    ? [
        { title: "Omaisuusriski", keys: ["bizProperty"], hint: "Toimitilat, koneet ja varasto" },
        { title: "Vastuuriski", keys: ["bizLiability"], hint: "Asiakastyö ja vahingonkorvausvastuut" },
        { title: "Henkilöriski", keys: ["bizPeople"], hint: "Työntekijät ja avainhenkilöt" },
        { title: "Jatkuvuusriski", keys: ["bizInterruption", "bizCyber"], hint: "Keskeytys ja tietoriskit" }
      ]
    : [
        { title: "Koti ja omaisuus", keys: ["home", "apartment"], hint: "Asuminen, irtaimisto ja vapaa-ajan asunto" },
        { title: "Liikkuminen", keys: ["vehicle", "travel"], hint: "Ajoneuvot ja matkustaminen" },
        { title: "Henkilöturva", keys: ["health"], hint: "Terveys, tapaturmat ja läheiset" },
        { title: "Arjen vastuut", keys: ["liability", "pet"], hint: "Vastuu, oikeusturva ja lemmikit" }
      ];

  const byKey = Object.fromEntries(recommendation.items.map((item) => [item.key, item]));
  return `
    <div class="risk-profile" aria-label="Riskiprofiili">
      <p class="eyebrow compact">Riskiprofiili</p>
      <div class="risk-grid">
        ${profiles.map((profileItem) => {
          const score = Math.max(0, ...profileItem.keys.map((key) => byKey[key]?.score || 0));
          const level = riskLevel(score);
          return `
            <div class="risk-item ${level.className}">
              <strong>${escapeHtml(profileItem.title)}</strong>
              <span>${escapeHtml(level.label)}</span>
              <small>${escapeHtml(profileItem.hint)}</small>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function riskLevel(score) {
  if (score >= 8) return { label: "Korkea", className: "high" };
  if (score >= 4) return { label: "Keskitaso", className: "medium" };
  if (score > 0) return { label: "Tarkista", className: "check" };
  return { label: "Matala", className: "low" };
}

function selectForPriceEstimate(typeKey) {
  if (!typeKey || !types()[typeKey]) return;
  st().selectedContact[typeKey] = true;
  st().selectedPrice[typeKey] = true;
  st().priceEstimateInterest = true;
  renderRecommendations();
  renderCalculatorPanel();
  persistAssessment();
  track("price_estimate_selected", { mode, typeKey });
}

function renderBucket(bucket) {
  const visibleItems = bucket.key === "notNow" ? bucket.items.slice(0, 8) : bucket.items;
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
  if (bucket.key === "possible" || bucket.key === "notNow") {
    return `
      <details class="bucket bucket-collapsed">
        <summary>
          <span>${escapeHtml(bucket.title)}</span>
          <small>${visibleItems.length} vakuutusaluetta</small>
        </summary>
        ${content}
      </details>
    `;
  }

  return `<section class="bucket">${content}</section>`;
}

function renderRecommendationCard(item, bucketKey) {
  const meta = types()[item.key];
  const reasons = item.reasons.length ? item.reasons : ["tämä vakuutusalue ei noussut vastauksissa vahvasti esiin"];
  const existing = item.existing ? `<span class="status-pill possible">Nykyinen turva: tarkista riittävyys</span>` : "";
  const strength = recommendationStrength(item.score);
  const detailKey = meta.detailFlow || "";
  const detailResult = detailKey ? st().detailResults[detailKey] : null;
  const selectedOption = detailResult?.comparison ? selectedCoverageOption(detailKey, detailResult.comparison) : null;
  const coverageLevel = st().assessmentResult?.selectedCoverageLevels?.[item.key];
  const description = shortenText(productSummary(meta), 125);

  return `
    <article class="rec-card target-card ${bucketKey === "primary" ? "priority" : bucketKey === "possible" ? "supporting" : ""} ${detailResult ? "refined" : ""} compact">
      <div class="rec-main">
        <div class="target-card-head">
          <div>
            <h4>${escapeHtml(meta.title)}</h4>
            <p class="muted rec-desc">${escapeHtml(description)}</p>
          </div>
          <span class="status-pill ${detailResult ? "done" : bucketKey === "primary" ? "primary" : bucketKey === "possible" ? "possible" : ""}">${escapeHtml(detailResult ? "Tarkennettu" : strength)}</span>
        </div>
        <div class="card-why">
          <strong>Miksi tämä nousi?</strong>
          <span>${escapeHtml(capitalize(shortenText(reasons[0], 145)))}.</span>
        </div>
        ${detailResult && coverageLevel ? `
          <div class="refined-summary compact">
            <strong>Valittu turvataso</strong>
            <span>${escapeHtml(selectedOption?.title || coverageLevel.selectedTitle)}</span>
          </div>
        ` : detailKey ? `
          <div class="coverage-pending">
            <strong>Turvatasoa ei ole vielä arvioitu</strong>
            <span>Vastaa ensin tämän vakuutuksen tarkentaviin kysymyksiin.</span>
          </div>
        ` : ""}
        ${existing ? `<div class="chip-row target-meta-row">${existing}</div>` : ""}
        ${renderRecommendationLearn(meta)}
      </div>
    </article>
  `;
}

function renderRecommendationLearn(meta) {
  return `
    <details class="learn-panel">
      <summary>Tutustu vakuutukseen</summary>
      <div class="insurance-plain-summary">
        <strong>Mitä vakuutus yleisesti tekee?</strong>
        <p>${escapeHtml(productCovers(meta))}</p>
      </div>
      ${renderMaterialDisclosure(meta.materials)}
      ${meta.detailFlow && flow(meta.detailFlow) ? `
        <div class="learn-next-step">
          <strong>Selvitä tilanteeseesi sopiva turvataso</strong>
          <button class="btn btn-secondary btn-small" type="button" data-card-refine="${escapeHtml(meta.detailFlow)}">Vastaa tarkentaviin kysymyksiin</button>
        </div>
      ` : ""}
    </details>
  `;
}

function productSummary(meta) {
  return meta.desc || "Vakuutuksen tarkka sisältö varmistetaan tuotemateriaaleista ja asiantuntijan kanssa.";
}

function productCovers(meta) {
  const title = meta.title.toLocaleLowerCase("fi-FI");
  const text = `${meta.title} ${meta.area || ""} ${meta.desc || ""}`.toLocaleLowerCase("fi-FI");
  if (title.includes("koti")) return "Kodin irtaimistoa, rakennusta, vastuuta, oikeusturvaa ja valittuja lisäturvia vakuutuksen rakenteen mukaan.";
  if (text.includes("ajoneuvo")) return "Liikenteessä käytettävän ajoneuvon lakisääteistä turvaa ja valittua vapaaehtoista kaskoa.";
  if (text.includes("matka")) return "Matkustajaan, matkatavaroihin, matkan peruuntumiseen, keskeytymiseen ja myöhästymiseen liittyviä tilanteita valintojen mukaan.";
  if (text.includes("terveys") || text.includes("tapaturma") || text.includes("toimeentulo")) return "Sairaus- ja tapaturmatilanteisiin, hoitokuluihin sekä toimeentulon tai läheisten turvaan liittyviä ratkaisuja.";
  if (text.includes("henkivakuutus") || text.includes("henkiturva") || text.includes("kuolemanvaraturva")) return "Läheisille tai omaan talouteen sovittua kertakorvausta kuoleman tai vakavan sairauden varalle valitun rakenteen mukaan.";
  if (text.includes("lemmikki") || text.includes("koira") || text.includes("kissa")) return "Eläinlääkärikuluja ja valittuja lisäturvia, kuten henki-, käyttöominaisuus- tai vastuuvakuutusta.";
  if (text.includes("omaisuus") || text.includes("esine") || text.includes("kiinteistö")) return "Yrityksen omaisuutta, toimitiloja, koneita, laitteita, varastoa tai kiinteistöjä sovitun rakenteen mukaan.";
  if (text.includes("vastuu")) return "Yrityksen toiminnasta, tuotteista, asiantuntijatyöstä tai hallinnosta aiheutuvia vastuutarkistuksia vakuutuslajin mukaan.";
  if (text.includes("keskeytys")) return "Toiminnan keskeytymisestä aiheutuvia taloudellisia vaikutuksia sovitun keskeytysturvan mukaan.";
  if (text.includes("kyber")) return "Tietoturvapoikkeamiin, järjestelmäkatkoihin ja asiantuntija-apuun liittyviä tilanteita valitun kyberturvan mukaan.";
  return meta.desc || "Vakuutus voi kattaa tuotekohtaisissa ehdoissa määriteltyjä vahinkoja ja kustannuksia.";
}

function productLimits(meta) {
  const title = meta.title.toLocaleLowerCase("fi-FI");
  if (title.includes("ajoneuvo")) return "Oman ajoneuvon vahingot, lisäturvat, bonukset, omavastuut ja ajoneuvokohtaiset rajaukset pitää varmistaa asiantuntijan kanssa.";
  if (title.includes("matka")) return "Matkan kesto, kohdemaa, matkustajat, matkatavarat, peruuntumisen syy ja voimassaolo pitää tarkistaa.";
  if (title.includes("terveys") || title.includes("tapaturma")) return "Terveysselvitys, rajoitusehdot, ikärajat, urheilulajit, omavastuu ja hoitokulujen enimmäismäärät pitää tarkistaa.";
  if (title.includes("henki")) return "Vakuutusmäärä, edunsaaja, terveystiedot, voimassaolo ja mahdolliset rajoitukset pitää varmistaa.";
  if (title.includes("vastuu")) return "Sopimusvastuut, toimialarajaukset, enimmäiskorvaukset ja puhtaat varallisuusvahingot pitää tarkistaa erikseen.";
  if (title.includes("keskeytys")) return "Keskeytyksen syy, vastuuaika, katteen laskenta, omavastuu ja riippuvuudet pitää määrittää tarkasti.";
  return "Lopullinen sisältö, rajoitukset, omavastuut, vakuutusmäärät ja soveltuvuus pitää varmistaa tuotemateriaaleista tai asiantuntijalta.";
}

function recommendationStrength(score) {
  if (score >= 10) return "Olennainen";
  if (score >= 7) return "Suositeltava";
  if (score >= 3) return "Mahdollinen";
  if (score > 0) return "Tarkista asiantuntijan kanssa";
  return "Ei juuri nyt tärkein";
}

function riskImpactForScore(score) {
  return recommendationStrength(score);
}

function refineTopRecommendation() {
  if (!st().assessmentResult) calculateAndRenderRecommendations();
  startQuick();
}

function firstDetailFlow() {
  return recommendationAreaOrder[mode].map((key) => types()[key]).find((item) => item?.detailFlow && flow(item.detailFlow))?.detailFlow;
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
    st().selectedPrice[typeKey] = true;
    st().priceEstimateInterest = true;
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
  bindCalculatorActions($("detailResult"));
  renderCalculatorPanel();
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
    ["Kattavuuden yleistaso", (option) => option.level],
    ["Mitä taso tarkoittaa", (option) => option.means],
    ["Kenelle sopii", (option) => option.fit],
    ["Tärkeimmät hyödyt", (option) => option.covers],
    ["Mahdolliset rajoitukset", (option) => option.limits],
    ["Sopivuus vastausten perusteella", (option) => option.key === selectedKey ? "Valitsemasi vaihtoehto" : comparison.recommendedKeys.includes(option.key) ? "Koneen ehdotus" : "Vertailtava vaihtoehto"]
  ];

  return `
    <section class="coverage-compare" aria-label="${escapeHtml(comparison.title)}">
      <div class="coverage-head">
        <div>
          <p class="eyebrow compact">Turvan vertailu</p>
          <h4>${escapeHtml(comparison.title)}</h4>
          <p class="muted">${escapeHtml(comparison.notice)}</p>
        </div>
      </div>
      <div class="best-fit">
        <strong>Suositus: ${escapeHtml(recommendedLabels)}</strong>
        <span><b>Koneen ehdotuksen peruste:</b> ${escapeHtml(shortenText(comparison.basis, 210))}</span>
      </div>
      <div class="selected-fit">
        <strong>Valitsemasi vaihtoehto: ${escapeHtml(selectedLabel)}</strong>
        <span>${selectionMatchesRecommendation ? "Valinta vastaa koneen ehdotusta." : "Valintasi huomioidaan yhteenvedossa ja mahdollisessa yhteydenottopyynnössä."}</span>
      </div>
      <details class="coverage-details">
        <summary>Näytä tarkempi vertailu</summary>
        <p>${escapeHtml(comparison.notice)}</p>
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
                    ${comparison.recommendedKeys.includes(option.key) ? `<span class="recommend-badge">Koneen ehdotus</span>` : ""}
                    <span class="${option.key === selectedKey ? "selected-badge" : "choose-badge"}">${option.key === selectedKey ? "Valittu turvataso" : "Valitse tämä"}</span>
                  </button>
                </th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows.map(([label, getValue]) => `
              <tr>
                <th scope="row">${escapeHtml(label)}</th>
                ${comparison.options.map((option) => `<td class="${option.key === selectedKey ? "selected" : ""}" data-detail-key="${escapeHtml(detailKey)}" data-coverage-cell="${escapeHtml(option.key)}">${escapeHtml(getValue(option))}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        </div>
      </details>
      <div class="coverage-mobile-list" aria-label="Turvan vaihtoehdot">
        ${comparison.options.map((option) => renderMobileCoverageOption(option, detailKey, selectedKey, comparison.recommendedKeys.includes(option.key))).join("")}
      </div>
    </section>
  `;
}

function renderMobileCoverageOption(option, detailKey, selectedKey, recommended) {
  return `
    <button class="coverage-mobile-card ${option.key === selectedKey ? "selected" : ""}" type="button" data-detail-key="${escapeHtml(detailKey)}" data-coverage-choice="${escapeHtml(option.key)}" aria-pressed="${option.key === selectedKey ? "true" : "false"}">
      <span class="radio-dot" aria-hidden="true"></span>
      <strong>${escapeHtml(option.title)}</strong>
      <span>${escapeHtml(option.level)}</span>
      <small>${escapeHtml(option.fit)}</small>
      <span class="coverage-card-badges">
        ${option.key === selectedKey ? `<em>Valittu turvataso</em>` : ""}
        ${recommended ? `<em>Koneen ehdotus</em>` : ""}
      </span>
    </button>
  `;
}

function bindCalculatorActions(root) {
  root.querySelectorAll("[data-coverage-choice]").forEach((button) => {
    button.addEventListener("click", () => selectCoverageOption(button.dataset.detailKey || "", button.dataset.coverageChoice || ""));
  });
  root.querySelectorAll("[data-coverage-cell]").forEach((cell) => {
    cell.addEventListener("click", () => selectCoverageOption(cell.dataset.detailKey || "", cell.dataset.coverageCell || ""));
  });
  root.querySelectorAll("[data-calculator-contact]").forEach((button) => {
    button.addEventListener("click", () => requestPriceEstimate(button.dataset.calculatorContact || ""));
  });
  root.querySelectorAll("[data-remove-price]").forEach((button) => {
    button.addEventListener("click", () => removePriceEstimate(button.dataset.removePrice || ""));
  });
  root.querySelectorAll("[data-calculator-more]").forEach((button) => {
    button.addEventListener("click", () => {
      if (st().recommendation) openRecommendations();
      else startQuick();
    });
  });
  root.querySelectorAll("[data-calculator-start]").forEach((button) => {
    button.addEventListener("click", () => startBaseInfo());
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

function requestPriceEstimate(detailKey = "") {
  const context = calculatorContext();
  const typeKey = detailKey ? typeKeyFromDetail(detailKey) : context.typeKey;
  st().priceEstimateInterest = true;
  if (typeKey) {
    st().selectedContact[typeKey] = true;
    st().selectedPrice[typeKey] = true;
  }
  persistAssessment();
  openCustomerSummary();
}

function removePriceEstimate(typeKey = "") {
  if (!typeKey || !types()[typeKey]) return;
  st().selectedPrice[typeKey] = false;
  st().priceEstimateInterest = Object.keys(st().selectedPrice).some((key) => st().selectedPrice[key]);
  renderRecommendations();
  renderCalculatorPanel();
  renderSummaryList();
  persistAssessment();
  track("price_estimate_removed", { mode, typeKey });
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
    st().selectedPrice[typeKey] = true;
    st().priceEstimateInterest = true;
  }
  refreshAssessmentResult();
  renderDetailResult(detailKey, result);
  renderCalculatorPanel();
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
  $("contactPriceSummary").innerHTML = renderContactPriceSummary();
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
      if (!input.checked) st().selectedPrice[input.dataset.contactChoice] = false;
      st().priceEstimateInterest = Object.keys(st().selectedPrice).some((key) => st().selectedPrice[key]);
      renderCalculatorPanel();
      renderSummaryList();
      persistAssessment();
    });
  });
  restoreContactFields();
  if (mode !== "business" && $("contactOrg")) $("contactOrg").value = "";
}

function renderContactPriceSummary() {
  const priceItems = selectedPriceItems();
  const selectedAreas = recommendedContactKeys();
  const missingDetails = selectedAreas
    .filter((key) => types()[key]?.detailFlow && !st().detailResults[types()[key].detailFlow])
    .slice(0, 5);
  const shownItems = priceItems.length
    ? priceItems
    : selectedAreas.map((key) => ({ key, title: types()[key].title, detail: types()[key].area }));

  return `
    <section class="contact-price-summary">
      <div>
        <p class="eyebrow compact">Hinta-arvion pohja</p>
        <h4>${priceItems.length ? "Valitut vakuutukset ja laajuudet" : "Suositellut vakuutusalueet"}</h4>
        <p class="muted small">Suuntaa antava hintavaikutus: <strong>${escapeHtml(st().pricingPayload?.priceImpactSymbol || "ei vielä arvioitu")}</strong>. ${escapeHtml(st().pricingPayload?.disclaimer || priceImpactDisclaimer)}</p>
      </div>
      ${shownItems.length ? `
        <div class="contact-price-list">
          ${shownItems.map((item) => `
            <div class="contact-price-line">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="contact-price-empty">Voit valita vakuutusalueet alla tai kuvata tilanteesi vapaatekstissä.</div>
      `}
      ${missingDetails.length ? `
        <details class="contact-pending-details">
          <summary>Tarkennettavaa ennen lopullista hintaa (${missingDetails.length})</summary>
          <div class="contact-price-list compact">
            ${missingDetails.map((key) => `
              <div class="contact-price-line">
                <strong>${escapeHtml(types()[key].title)}</strong>
                <span>Turvan rakenne tai laajuus voidaan tarkentaa ennen tarjousta.</span>
              </div>
            `).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
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
  const crmDetails = $("crmSummaryDetails");
  const showContactSummary = showCrm || st().crmSummaryCreated;
  crmDetails.classList.toggle("hidden", !showContactSummary);
  crmDetails.open = Boolean(showCrm);
  $("summaryRefine").classList.toggle("hidden", ["risk_area_discussion", "direct_expert_contact"].includes(st().assessmentResult.flowType));
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
  const priceSymbol = assessment.pricingPayload?.priceImpactSymbol || "Ei vielä arvioitu";
  const hasRefinedCoverage = Object.keys(assessment.pricingPayload?.selectedCoverageLevels || {}).length > 0;

  $("customerSummaryContent").innerHTML = `
    <section class="customer-summary-hero">
      <div>
        <span class="summary-status">${escapeHtml(flowTypeLabel(assessment.flowType))}</span>
        <h4>${escapeHtml(assessment.title)}</h4>
        <p>${escapeHtml(assessment.summary)}</p>
      </div>
    </section>

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
              <div><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.text)}</p></div>
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
        <div><strong>3</strong><span><b>Jatka halutessasi.</b> Tarkka vakuutusturva ja hinta varmistetaan asiantuntijan kanssa.</span></div>
      </div>
    </section>
  `;
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
      <p>${escapeHtml(shortenText(item.reason || item.condition || productSummary(meta), 170))}</p>
      ${refined && level ? `
        <div class="summary-coverage-level">
          <span>Valittu turvataso</span>
          <strong>${escapeHtml(level.selectedTitle)}</strong>
        </div>
      ` : detailKey ? `
        <div class="summary-coverage-level pending">
          <span>Turvataso arvioidaan tarkennuksen jälkeen</span>
          <button class="btn btn-secondary btn-small" type="button" data-card-refine="${escapeHtml(detailKey)}">Vastaa tarkentaviin kysymyksiin</button>
        </div>
      ` : ""}
    </article>
  `;
}

function restoreContactFields() {
  const contact = st().contact;
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "freeText"]) {
    if ($(id) && Object.prototype.hasOwnProperty.call(contact, id)) $(id).value = contact[id] || "";
  }
  $("privacyConsent").checked = Boolean(contact.privacyConsent);
}

function readContactFields() {
  const contact = {};
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "freeText"]) {
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
  if (!selected.length && !contact.freeText && st().assessmentResult?.flowType !== "direct_expert_contact") return "Valitse vähintään yksi vakuutus tai kuvaa tilanne vapaasti.";
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

  const coverageLevels = Object.entries(assessment.selectedCoverageLevels || {}).filter(([, level]) => level.refined);
  if (coverageLevels.length) {
    lines.push("");
    lines.push("Valitut turvatasot");
    coverageLevels.forEach(([key, level]) => {
      lines.push(`- ${types()[key]?.title || key}: ${level.selectedTitle}`);
      lines.push(`  - Koneen ehdotus: ${level.machineTitle}`);
      lines.push(`  - Koneen ehdotuksen peruste: ${level.basis}`);
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
    risk_area_discussion: "Riskialueet yritysasiantuntijan keskusteluun",
    direct_expert_contact: "Suora yritysasiantuntijan arvio",
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
    const top = assessment.recommendedCovers.map((item) => types()[item.key]?.title).filter(Boolean).slice(0, 5).join(", ");
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

function renderCalculatorPanel() {
  const panel = $("calculatorPanel");
  if (!panel) return;

  const assessment = st().assessmentResult;
  const pricing = assessment?.pricingPayload;
  const context = calculatorContext();
  const priceItems = selectedPriceItems();
  const selectedAreas = (pricing?.selectedCovers || recommendationKeysForContact()).filter((key) => types()[key]);
  const coverageEntries = Object.entries(pricing?.selectedCoverageLevels || {});
  const missingDetails = selectedAreas
    .filter((key) => types()[key]?.detailFlow && !st().detailResults[types()[key].detailFlow])
    .slice(0, 4);
  if (!context.title && !priceItems.length) {
    panel.innerHTML = `
      <p class="eyebrow compact">Hinta-arvio</p>
      <h3>Hinta-arvion pohja</h3>
      <p class="muted small">Kun vastaat kartoitukseen, tähän kootaan aiheet ja puuttuvat tarkennukset LähiTapiolan laskuria tai asiantuntijaa varten.</p>
      <div class="calculator-actions stacked">
        <button class="btn btn-primary" type="button" data-calculator-start>Aloita kartoitus</button>
      </div>
      <ul class="calculator-benefits">
        <li>Suositellut vakuutusalueet</li>
        <li>Valitut tarkennukset</li>
        <li>Yhteydenoton taustatiedot</li>
      </ul>
    `;
    bindCalculatorActions(panel);
    return;
  }

  if (assessment?.flowType === "direct_expert_contact") {
    panel.innerHTML = `
      <p class="eyebrow compact">Yritysasiantuntija</p>
      <h3>Räätälöity vakuutusohjelma</h3>
      <p class="muted small">Tässä kokoluokassa hinta-arvio muodostetaan yrityksen riskien, vakuutusmäärien ja nykyisen vakuutusohjelman perusteella asiantuntijan kanssa.</p>
      <div class="calculator-actions stacked">
        <button class="btn btn-primary" type="button" data-open-contact>Pyydä asiantuntijan yhteydenottoa</button>
      </div>
    `;
    bindCalculatorActions(panel);
    return;
  }

  panel.innerHTML = `
    <p class="eyebrow compact">Hinta-arvio</p>
    <h3>Hinta-arvion pohja</h3>
    ${context.title ? `
      <div class="calculator-side-card">
        <div class="calculator-product">
          <strong>${escapeHtml(context.title)}</strong>
          <span>${escapeHtml(context.subtitle)}</span>
        </div>
        <div class="calculator-highlight">
          <span>Suuntaa antava hintavaikutus</span>
          <strong>${escapeHtml(pricing?.priceImpactSymbol || "Ei vielä arvioitu")}</strong>
        </div>
      </div>
    ` : ""}
    ${selectedAreas.length ? `
      <div class="calculator-basket">
        <strong>Mukana hinta-arvion pohjassa</strong>
        ${selectedAreas.map((key) => `
          <div class="basket-line">
            <span>${escapeHtml(types()[key].title)}</span>
            <small>${escapeHtml(types()[key].area)}</small>
          </div>
        `).join("")}
      </div>
    ` : ""}
    ${missingDetails.length ? `
      <div class="calculator-basket pending">
        <strong>Tarkennettavaa ennen hintaa</strong>
        ${missingDetails.map((key) => `
          <div class="basket-line">
            <span>${escapeHtml(types()[key].title)}</span>
            <small>Turvan rakenne tai laajuus kannattaa tarkentaa.</small>
          </div>
        `).join("")}
      </div>
    ` : ""}
    ${coverageEntries.length ? `
      <div class="calculator-basket">
        <strong>Vakuutuskohtaiset turvatasot</strong>
        ${coverageEntries.map(([key, level]) => `
          <div class="basket-line">
            <span>${escapeHtml(types()[key]?.title || key)}</span>
            <small>${escapeHtml(level.selectedTitle)} · ${escapeHtml(level.priceImpactSymbol)}</small>
          </div>
        `).join("")}
      </div>
    ` : ""}
    ${priceItems.length ? `
      <div class="calculator-basket">
        <strong>Tarkennetut valinnat</strong>
        ${priceItems.map((item) => `
          <div class="basket-line">
            <span>${escapeHtml(item.title)}</span>
            <small>${escapeHtml(item.detail)}</small>
            <button class="link-button" type="button" data-remove-price="${escapeHtml(item.key)}">Poista hinta-arviosta</button>
          </div>
        `).join("")}
        <div class="calculator-slot compact">
          <strong>Laskuri-integraation paikka</strong>
          <span>Valitut aiheet siirtyisivät LähiTapiolan varsinaiseen laskuriin hinta-arvion muodostamista varten.</span>
        </div>
      </div>
    ` : ""}
    <div class="calculator-actions stacked">
      <button class="btn btn-primary" type="button" data-calculator-contact="${escapeHtml(context.detailKey || "")}">Näytä hinta-arvion pohja</button>
      <button class="btn btn-secondary" type="button" data-open-contact>Pyydä asiantuntijan arvio</button>
    </div>
    <ul class="calculator-benefits">
      <li>Suositus perustuu antamiisi vastauksiin</li>
      <li>${escapeHtml(pricing?.disclaimer || priceImpactDisclaimer)}</li>
    </ul>
  `;
  bindCalculatorActions(panel);
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
  const topItems = (aiContext?.recommendedCovers || []).slice(0, 3).map((item) => ({
    key: item.key,
    reasons: [item.reason].filter(Boolean)
  }));
  const activeDetail = st().activeDetail && st().detailResults[st().activeDetail] ? st().activeDetail : "";
  const activeType = activeDetail ? typeKeyFromDetail(activeDetail) : "";
  const topTitle = topItems[0] ? types()[topItems[0].key].title : "";
  const suggestions = [
    topTitle ? `Miksi minulle suositellaan: ${topTitle}?` : "Miten tämä kartoitus auttaa minua?",
    activeType ? "Mitä eroa näillä turvavaihtoehdoilla on?" : "Mitä minun kannattaa tehdä seuraavaksi?",
    "Mitä minun kannattaa tarkistaa asiantuntijan kanssa?"
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
    return "Asiantuntija voi jatkaa tästä samasta keskustelusta. Tässä demossa näytän samalla, mitä tietoja asiantuntijalle siirtyisi: asiakastyyppi, kartoituksen vastaukset, suositellut vakuutusalueet ja valitut turvatasot.";
  }

  if (lowered.includes("hinta") || lowered.includes("laskuri")) {
    return "Tämä konseptidemo ei laske hintaa. Tarkka vakuutusturva ja hinta varmistetaan asiantuntijan kanssa.";
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
    if (context.aiContext.flowType === "direct_expert_contact") {
      return "Yrityksen kokoluokka vaatii räätälöidyn vakuutusohjelman. Siksi valmis paketti korvataan suoralla yritysasiantuntijan arviolla.";
    }
    if (context.aiContext.flowType === "risk_area_discussion") {
      return `Yrityksen kokoluokan vuoksi kokonaisuutta tarkastellaan valmiin paketin sijasta riskialueina: ${context.aiContext.riskAreas.map((item) => item.title).join(", ")}.`;
    }
    if (!topItems.length) return "Profiilisi perusteella valmis vakuutuspaketti ei ole oikea etenemistapa. Asiantuntija voi arvioida kokonaisuuden nykyisten tietojen pohjalta.";
    const lines = topItems.map((item) => `${types()[item.key].title}: ${item.reasons.slice(0, 2).join("; ") || types()[item.key].desc}`);
    return `Nykyisen kartoitustuloksen perusteella tärkeimmät tarkistettavat aiheet ovat ${topItems.map((item) => types()[item.key].title).join(", ")}. Perustelut: ${lines.join(" | ")}.`;
  }

  const topText = topItems.length ? topItems.map((item) => types()[item.key].title).join(", ") : context.aiContext.riskAreas.map((item) => item.title).join(", ") || "asiantuntijan arvio";
  return `Kartoituksesi nykyiset keskeiset aiheet ovat: ${topText}. Voin selittää tämän kartoitustuloksen suosituksia, valittuja turvatasoja ja seuraavia vaiheita.`;
}

function selectedPriceItems() {
  return Object.keys(st().selectedPrice)
    .filter((key) => st().selectedPrice[key] && types()[key])
    .map((key) => {
      const meta = types()[key];
      const result = meta.detailFlow ? st().detailResults[meta.detailFlow] : null;
      const selectedOption = result?.comparison ? selectedCoverageOption(meta.detailFlow, result.comparison) : null;
      return {
        key,
        title: meta.title,
        detail: selectedOption ? selectedOption.title : meta.area
      };
    });
}

function calculatorContext() {
  const detailEntries = Object.entries(st().detailResults);
  const activeDetail = st().activeDetail && st().detailResults[st().activeDetail] ? st().activeDetail : "";
  const detailKey = activeDetail || (detailEntries.length ? detailEntries[detailEntries.length - 1][0] : "");

  if (detailKey) {
    const result = st().detailResults[detailKey];
    const typeKey = typeKeyFromDetail(detailKey);
    const meta = typeKey ? types()[typeKey] : null;
    const selectedOption = result.comparison ? selectedCoverageOption(detailKey, result.comparison) : null;
    const recommended = selectedOption?.title || result.comparison?.recommended?.map((option) => option.title).join(", ") || result.primaryTag;
    return {
      title: meta?.title || result.title,
      subtitle: selectedOption ? `${result.primaryTag}: valittu ${selectedOption.title}` : result.title,
      recommended,
      nextStep: "Hinta-arvio",
      detailKey,
      typeKey
    };
  }

  const assessment = st().assessmentResult;
  if (assessment) {
    const item = assessment.recommendedCovers[0];
    if (!item) {
      return {
        title: assessment.title,
        subtitle: assessment.summary || flowTypeLabel(assessment.flowType),
        recommended: assessment.pricingPayload?.priceImpactSymbol || "Asiantuntijan arvio",
        nextStep: "Asiantuntijan arvio",
        detailKey: "",
        typeKey: ""
      };
    }
    const meta = types()[item.key];
    const level = assessment.selectedCoverageLevels?.[item.key];
    return {
      title: meta.title,
      subtitle: item.reason || meta.desc,
      recommended: level?.refined ? level.selectedTitle : "Turvatasoa ei ole vielä arvioitu",
      nextStep: meta.detailFlow ? "Vastaa ensin tarkentaviin kysymyksiin" : "Asiantuntijan arvio",
      detailKey: meta.detailFlow || "",
      typeKey: item.key
    };
  }

  return {};
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
  renderCalculatorPanel();
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
  renderCalculatorPanel();
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
    Object.keys(current.selectedPrice).length ||
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
      selectedPrice: current.selectedPrice,
      activeDetail: current.activeDetail,
      detailIndex: current.detailIndex,
      detailAnswers: current.detailAnswers,
      detailResults: current.detailResults,
      selectedCoverage: current.selectedCoverage,
      priceEstimateInterest: current.priceEstimateInterest,
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
