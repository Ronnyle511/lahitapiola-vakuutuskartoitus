import { baseQuestions, coverageModels, detailFlows, getAnswerLabels, getOptionLabel, insuranceTypes, profiles, quickQuestions } from "./data.js";
import { buildDetailResult } from "./detailResults.js";
import { calculateScores, recommendedKeys, toArray } from "./scoring.js";
import { buildAssessmentResult, relevantNeedOptions } from "./solutionEngine.js";
import { track } from "./analytics.js";

const $ = (id) => document.getElementById(id);
const views = ["introView", "baseInfoView", "questionView", "resultsView", "detailView", "detailResultView", "contactView", "summaryView"];
const steps = ["step1", "step2", "step3", "step4"];
const STORAGE_KEY = "lahitapiola-vakuutuskartoitus-v4";
const STORAGE_VERSION = 1;
const recommendationAreaOrder = {
  personal: ["home", "health", "life", "vehicle", "travel", "pet", "horse", "apartment", "liability", "boat", "forest", "pregnancy", "childSerious", "investment"],
  business: ["bizProperty", "bizLiability", "bizPeople", "bizVehicle", "bizCyber", "bizInterruption", "bizCargo", "bizLegal", "bizRealEstate", "bizPatient", "bizConstruction", "bizTravel"]
};

let mode = "personal";
let savedView = "results";
let appReady = false;
let restoredFromStorage = false;
let persistedAt = "";
let autoAdvanceTimer = 0;
const states = {
  personal: freshState(),
  business: freshState()
};

function freshState() {
  return {
    baseAnswers: {},
    quickPhase: "intake",
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
  return detailFlows[mode]?.[key] || (coverageModels[mode]?.[key] ? {
    title: types()[key]?.title || key,
    sourceNote: "Perustuu LähiTapiolan julkaistuihin tuote- ja vakuutustietoihin.",
    questions: []
  } : null);
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
      "11_50": "small",
      "50_plus": "medium",
      "51_249": "medium",
      "250_plus": "medium"
    };
    if (base.hasEmployees === "yes") return { peopleSize: "micro" };
    if (base.hasEmployees === "no" || base.hasEmployees === "unsure") return { peopleSize: "solo" };
    return byEmployeeCount[base.employeeCount] ? { peopleSize: byEmployeeCount[base.employeeCount] } : {};
  }

  if (mode === "business" && detailKey === "bizLiability") {
    const byIndustry = {
      consulting: "professional",
      it: "it",
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
  renderChatPanel();
  renderSummaryList();
  updateResumeNotice();
  appReady = true;
}

function bindEvents() {
  $("modePersonal").addEventListener("click", () => setMode("personal"));
  $("modeBusiness").addEventListener("click", () => setMode("business"));
  $("homeButton").addEventListener("click", () => returnToLanding());
  $("startAssessment").addEventListener("click", () => openAssessment());
  $("resumeAssessment").addEventListener("click", () => resumeAssessment());
  $("discardSavedAssessment").addEventListener("click", () => discardSavedAssessment());
  $("introBack").addEventListener("click", () => returnToLanding());
  $("startQuick").addEventListener("click", () => startBaseInfo());
  $("showRecommendations").addEventListener("click", () => openRecommendations());
  $("showCustomerSummary").addEventListener("click", () => openCustomerSummary());
  $("openContact").addEventListener("click", () => openContact());
  $("clearAllTop").addEventListener("click", () => resetAssessment("intro"));
  $("baseBack").addEventListener("click", () => showView("intro"));
  $("baseNext").addEventListener("click", () => baseNext());
  $("questionBack").addEventListener("click", () => questionBack());
  $("questionNext").addEventListener("click", () => questionNext());
  $("questionSkip").addEventListener("click", () => skipQuestion());
  $("resultsBack").addEventListener("click", () => returnToPreviousQuestion());
  $("restartAssessment")?.addEventListener("click", () => resetAssessment("base"));
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
  $("editAnswersFromContact").addEventListener("click", () => startBaseInfo());
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
  $("modeLabel").textContent = p.label;
  $("headerModeLabel").textContent = p.label;
  $("appTitle").textContent = `${p.label}: vakuutuskartoitus`;
}

function resumeAssessment() {
  $("appShell").classList.remove("hidden");
  if (!hasCompleteBaseInfo()) {
    startQuick("base");
  } else if (!hasCompletedIntake()) {
    startQuick("intake");
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
      if (currentQuickFlowQuestions().length) {
        st().quickIndex = Math.min(st().quickIndex, currentQuickFlowQuestions().length - 1);
        renderQuestion();
        showView("quick");
      } else {
        showView("results");
      }
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
    if (!toArray(answer).length) return false;
    return answer !== "other" || Boolean(st().baseAnswers[`${question.id}Other`]);
  });
}

function hasCompletedIntake() {
  return true;
}

function openAssessment() {
  $("appShell").classList.remove("hidden");
  startQuick(hasCompleteBaseInfo() ? "intake" : "base");
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
  startQuick("base");
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
  const missing = questions.find((question) => !toArray(st().baseAnswers[question.id]).length);
  const missingOther = questions.find((question) => st().baseAnswers[question.id] === "other" && !st().baseAnswers[`${question.id}Other`]);
  const error = missing
    ? `Valitse: ${missing.title}.`
    : missingOther
      ? `Täydennä: ${missingOther.otherLabel || missingOther.title}.`
      : "";

  $("baseError").classList.toggle("hidden", !error);
  $("baseError").textContent = error;
  if (error) return;
  st().recommendation = null;
  st().assessmentResult = null;
  st().contactSelectionInitialized = false;
  startQuick("intake");
  track("initial_context_started", { mode });
}

function startQuick(phase = "needs") {
  st().quickPhase = phase;
  st().quickIndex = 0;
  if (!currentQuickFlowQuestions().length) {
    finishQuickFlow();
    return;
  }
  renderQuestion();
  showView("quick");
  track("quick_started", { mode, phase });
}

function renderQuestion() {
  const questions = currentQuickFlowQuestions();
  const question = questions[st().quickIndex] || questions[0];
  if (!question) {
    finishQuickFlow();
    return;
  }
  $("questionError").classList.add("hidden");
  $("questionError").textContent = "";
  const isIntake = st().quickPhase === "intake";
  const isBase = st().quickPhase === "base";
  const meta = questionProgressMeta(questions);
  const hasPromptCard = question.layout === "icon-question" && question.icon;
  $("questionCount").textContent = meta.label;
  $("questionTitle").textContent = hasPromptCard
    ? mode === "business" ? "Muutama kysymys yritystoiminnastasi" : "Muutama kysymys arjestasi"
    : question.title;
  $("questionDesc").textContent = question.desc || "";
  $("questionPromptCard")?.classList.toggle("hidden", !hasPromptCard);
  $("questionPromptCard")?.setAttribute("aria-hidden", hasPromptCard ? "false" : "true");
  if (hasPromptCard) {
    $("questionPromptIcon").innerHTML = renderOptionIcon(question.icon);
    $("questionPromptText").textContent = question.title;
  }
  $("multiNote").classList.toggle("hidden", !question.multi);
  $("multiNote").textContent = "Voit valita useamman";
  $("questionProgress").style.width = `${meta.percent}%`;
  $("questionBack").disabled = false;
  $("questionBack").classList.remove("hidden");
  $("questionBack").textContent = isBase && st().quickIndex === 0
    ? "Takaisin alkuun"
    : st().quickPhase === "needs" && st().quickIndex === 0
      ? "Takaisin suosituksiin"
      : "Takaisin";
  $("questionSkip").classList.add("hidden");
  $("questionNext").textContent = st().quickIndex === questions.length - 1
    ? isBase ? "Jatka" : isIntake ? "Näytä vakuutusalueet" : "Päivitä suositus"
    : "Seuraava";
  $("questionNext").classList.toggle("hidden", !question.multi);
  const answerBag = questionAnswerBag(question);
  renderAnswerOptions("answerList", question, answerBag, (value) => {
    setFlowAnswer(question, answerBag, value);
    if (question.answerSource === "relevantNeeds") {
      st().selectedRelevantNeeds = toArray(answerBag.relevantNeeds);
    }
    renderQuestion();
    if (!question.multi) scheduleAutoAdvance(questionNext);
  });
}

function scheduleAutoAdvance(callback) {
  window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = window.setTimeout(() => {
    autoAdvanceTimer = 0;
    callback();
    window.requestAnimationFrame(() => $("questionTitle")?.focus({ preventScroll: true }));
  }, 180);
}

function cancelAutoAdvance() {
  window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = 0;
}

function currentQuickFlowQuestions() {
  if (st().quickPhase === "base") return baseFlowQuestions();
  return st().quickPhase === "intake" ? activeIntakeQuestions() : [relevantNeedsQuestion()];
}

function activeIntakeQuestions() {
  // Nykyisiä vakuutuksia tai kartoituksen tavoitetta ei kysytä.
  return [];
}

function baseFlowQuestions() {
  return (baseQuestions[mode] || []).map((question) => ({
    ...question,
    answerSource: "base",
    desc: baseQuestionDescription(question),
    multi: Boolean(question.multi)
  }));
}

function baseQuestionDescription(question) {
  if (mode === "business" && question.id === "industry") {
    return "Valitse lähin vaihtoehto. Tämän perusteella emme tee lopullista päätöstä, vaan suuntaamme ensimmäisiä vakuutusalueita.";
  }
  if (mode === "business" && question.id === "entrepreneurWorks") {
    return "Vastauksen avulla tarkistetaan erikseen yrittäjän oma YEL-tilanne. Se ei tee muista henkilöstövakuutuksista lakisääteisiä.";
  }
  if (mode === "business" && question.layout === "icon-question") {
    return question.desc || "Vastaa lyhyesti, niin kartoitin osaa avata oikeita vakuutusalueita ymmärrettävästi.";
  }
  if (mode === "personal" && question.layout === "icon-question") {
    return question.desc || "Vastaa lyhyesti, niin kartoitin osaa avata sinulle olennaisia vakuutusalueita ymmärrettävästi.";
  }
  if (mode === "personal" && question.id === "ageGroup") {
    return "Ikäryhmä auttaa suuntaamaan henkilövakuutusten ja elämäntilanteen tarkistuksia.";
  }
  if (mode === "personal" && question.id === "livingType") {
    return "Asumismuoto vaikuttaa siihen, painottuuko koti, irtaimisto, rakennus vai vastuut.";
  }
  if (mode === "personal" && question.id === "lifeSituation") {
    return "Elämäntilanne auttaa arvioimaan, mitä vakuutuksia kannattaa katsoa ensin.";
  }
  return "Valitse lähin vaihtoehto.";
}

function questionProgressMeta(questions) {
  if (st().quickPhase === "base" || st().quickPhase === "intake") {
    const baseCount = baseFlowQuestions().length;
    const intakeCount = activeIntakeQuestions().length;
    const total = Math.max(baseCount + intakeCount, 1);
    const offset = st().quickPhase === "intake" ? baseCount : 0;
    const position = Math.min(offset + st().quickIndex + 1, total);
    return {
      label: `Kysymys ${position} / ${total}`,
      percent: Math.round((position / total) * 100)
    };
  }

  return {
    label: `Tarkentava kysymys ${st().quickIndex + 1} / ${Math.max(questions.length, 1)}`,
    percent: Math.round(((st().quickIndex + 1) / Math.max(questions.length, 1)) * 100)
  };
}

function questionAnswerBag(question) {
  if (question.answerSource === "relevantNeeds") return { relevantNeeds: st().selectedRelevantNeeds };
  if (question.answerSource === "base") return st().baseAnswers;
  return st().quickAnswers;
}

function setFlowAnswer(question, answerBag, value) {
  setAnswer(question, answerBag, value);
  if (question.answerSource === "base") {
    const otherKey = `${question.id}Other`;
    if (value === "other" && question.otherLabel && !answerBag[otherKey]) {
      answerBag[otherKey] = "Muu";
    }
    if (value !== "other") delete answerBag[otherKey];
  }
}

function relevantNeedsQuestion() {
  return {
    id: "relevantNeeds",
    answerSource: "relevantNeeds",
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

function renderOptionIcon(name) {
  const icons = {
    vehicle: iconSvg('<path d="M4 15h16l-2-5H6l-2 5Z"></path><path d="M7 18h.01M17 18h.01"></path><path d="M6 15v3M18 15v3"></path>'),
    property: iconSvg('<path d="M4 11 12 5l8 6"></path><path d="M6 10v9h12v-9"></path><path d="M10 19v-5h4v5"></path>'),
    premises: iconSvg('<path d="M5 20V8l7-4 7 4v12"></path><path d="M9 20v-6h6v6"></path><path d="M8 10h.01M12 10h.01M16 10h.01"></path>'),
    assets: iconSvg('<path d="M5 9h14v10H5z"></path><path d="M8 9V6h8v3"></path><path d="M9 14h6"></path><path d="M9 17h3"></path>'),
    people: iconSvg('<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M16 12a3 3 0 1 0 0-6"></path><path d="M3.5 19c.6-3 2.5-5 4.5-5s3.9 2 4.5 5"></path><path d="M13.5 15c1.7.5 3 1.9 3.5 4"></path>'),
    children: iconSvg('<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path><path d="M4 19c.5-3 2.1-5 4-5s3.5 2 4 5"></path><path d="M13 18c.4-2.2 1.6-3.6 3-3.6s2.6 1.4 3 3.6"></path>'),
    travel: iconSvg('<path d="M5 9h14v10H5z"></path><path d="M9 9V7a3 3 0 0 1 6 0v2"></path><path d="M8 14h8"></path>'),
    health: iconSvg('<path d="M12 21s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.8-7 10-7 10Z"></path><path d="M12 9v6"></path><path d="M9 12h6"></path>'),
    life: iconSvg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"></path><path d="M8 16h8"></path>'),
    pet: iconSvg('<path d="M8 11c1.2 0 2 .9 2 2s-.8 2-2 2-2-.9-2-2 .8-2 2-2Z"></path><path d="M16 11c1.2 0 2 .9 2 2s-.8 2-2 2-2-.9-2-2 .8-2 2-2Z"></path><path d="M12 13c2.4 0 4.5 2.2 4.5 4.3 0 1.4-1 2.2-2.3 1.6a5.6 5.6 0 0 0-4.4 0c-1.3.6-2.3-.2-2.3-1.6C7.5 15.2 9.6 13 12 13Z"></path><path d="M7 7h.01M17 7h.01M10 5h.01M14 5h.01"></path>'),
    liability: iconSvg('<path d="M12 4 5 7v5c0 4 2.8 6.8 7 8 4.2-1.2 7-4 7-8V7l-7-3Z"></path><path d="m9 12 2 2 4-4"></path>'),
    cyber: iconSvg('<path d="M7 10V8a5 5 0 0 1 10 0v2"></path><path d="M6 10h12v9H6z"></path><path d="M12 14v2"></path>'),
    interruption: iconSvg('<path d="M12 6v6l4 2"></path><path d="M4 12a8 8 0 1 0 3-6"></path><path d="M4 5v5h5"></path>'),
    benefits: iconSvg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"></path><path d="M9 12h6"></path>')
  };
  return icons[name] || icons.property;
}

function iconSvg(paths) {
  return `<svg viewBox="0 0 24 24" focusable="false">${paths}</svg>`;
}

function renderAnswerOptions(containerId, question, answerBag, onSelect) {
  const selected = toArray(answerBag[question.id]);
  const container = $(containerId);
  container.innerHTML = "";
  container.classList.toggle("icon-grid", question.layout === "icon-grid");
  container.classList.toggle("compact-choice", question.layout === "icon-question");

  question.options.forEach((option) => {
    const button = document.createElement("button");
    const hasIcon = Boolean(option.icon);
    button.type = "button";
    button.className = `answer-option${question.multi ? " multi" : ""}${hasIcon ? " with-icon" : ""}${selected.includes(option.value) ? " selected" : ""}`;
    button.innerHTML = `
      ${hasIcon ? `<span class="answer-icon" aria-hidden="true">${renderOptionIcon(option.icon)}</span>` : ""}
      <span class="answer-text"><strong>${escapeHtml(option.label)}</strong>${option.hint ? `<span>${escapeHtml(option.hint)}</span>` : ""}</span>
      <span class="answer-mark" aria-hidden="true"></span>
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
  cancelAutoAdvance();
  if (st().quickPhase === "base") {
    if (st().quickIndex > 0) {
      st().quickIndex -= 1;
      renderQuestion();
      return;
    }
    returnToLanding();
    return;
  }

  if (st().quickPhase === "intake") {
    if (st().quickIndex > 0) {
      st().quickIndex -= 1;
      renderQuestion();
      return;
    }
    const baseQuestions = baseFlowQuestions();
    if (baseQuestions.length) {
      st().quickPhase = "base";
      st().quickIndex = baseQuestions.length - 1;
      renderQuestion();
      return;
    }
    return;
  }
  openRecommendations();
}

function returnToLanding() {
  cancelAutoAdvance();
  document.body.classList.remove("assessment-active");
  $("appShell").classList.add("hidden");
  savedView = "intro";
  persistAssessment();
  updateResumeNotice();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function questionNext() {
  cancelAutoAdvance();
  const questions = currentQuickFlowQuestions();
  const question = questions[st().quickIndex];
  const selected = question?.answerSource === "relevantNeeds"
    ? st().selectedRelevantNeeds
    : toArray(questionAnswerBag(question || {})[question?.id]);
  const error = selected.length ? "" : question?.multi
    ? "Valitse vähintään yksi vaihtoehto."
    : "Valitse vaihtoehto ennen jatkamista.";
  $("questionError").classList.toggle("hidden", !error);
  $("questionError").textContent = error;
  if (error) return;
  if (st().quickIndex < questions.length - 1) {
    st().quickIndex += 1;
    renderQuestion();
    return;
  }

  if (st().quickPhase === "base") {
    if (activeIntakeQuestions().length) {
      startQuick("intake");
      track("initial_context_started", { mode });
      return;
    }
    finishInitialAssessment();
    return;
  }

  finishQuickFlow();
}

function returnToPreviousQuestion() {
  cancelAutoAdvance();
  if (st().recommendationRefined) {
    startQuick("needs");
    return;
  }

  const intake = activeIntakeQuestions();
  if (intake.length) {
    st().quickPhase = "intake";
    st().quickIndex = intake.length - 1;
  } else {
    const base = baseFlowQuestions();
    st().quickPhase = "base";
    st().quickIndex = Math.max(base.length - 1, 0);
  }
  renderQuestion();
  showView("quick");
}

function skipQuestion() {
  return;
}

function finishQuickFlow() {
  if (st().quickPhase === "base") {
    if (activeIntakeQuestions().length) startQuick("intake");
    else finishInitialAssessment();
    return;
  }

  if (st().quickPhase === "intake") {
    finishInitialAssessment();
    return;
  }

  syncQuickAnswersFromRelevantNeeds();
  st().recommendationRefined = true;
  calculateAndRenderRecommendations();
  showView("results");
  track("solution_refinement_completed", { mode, selectedRelevantNeeds: st().selectedRelevantNeeds.length });
}

function finishInitialAssessment() {
  calculateAndRenderRecommendations();
  showView("results");
  track("initial_context_completed", {
    mode
  });
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
    if (Object.keys(st().baseAnswers).length && activeIntakeQuestions().length && !hasCompletedIntake()) {
      startQuick("intake");
      return;
    }
    if (Object.keys(st().baseAnswers).length) calculateAndRenderRecommendations();
    else {
      startQuick("base");
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
  const buckets = assessmentBuckets(assessment);
  $("resultsTitle").textContent = resultsTitleFor(assessment);
  $("resultsIntro").textContent = resultsIntroFor(assessment);
  $("resultsTitle").classList.remove("hidden");
  $("resultsIntro").classList.remove("hidden");
  $("recommendationInsights").innerHTML = renderRecommendationContext(assessment);
  $("contactFromResults")?.classList.add("hidden");

  const primaryBuckets = buckets.filter((bucket) => bucket.key === "primary");
  const remainingBuckets = buckets.filter((bucket) => bucket.key !== "primary");
  $("recommendationBuckets").innerHTML = `${primaryBuckets.map(renderBucket).join("")}${renderMandatoryChecks(assessment.mandatoryChecks)}${remainingBuckets.map(renderBucket).join("")}${renderNextStepPrompt(assessment)}`;
  $("recommendationBuckets").querySelector("[data-refine-recommendations]")?.addEventListener("click", () => refineTopRecommendation());
  $("recommendationBuckets").querySelector("[data-summary-next]")?.addEventListener("click", () => openCustomerSummary());
  $("recommendationBuckets").querySelector("[data-expert-contact]")?.addEventListener("click", () => openContact());
  $("recommendationBuckets").querySelector("[data-restart-results]")?.addEventListener("click", () => resetAssessment("base"));
  $("recommendationBuckets").querySelectorAll("[data-card-refine]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.cardRefine || ""));
  });
}

function resultsTitleFor(assessment) {
  if (assessment.flowType === "direct_expert_contact") return "Asiantuntijan arvio yrityksellenne";
  if (assessment.flowType === "risk_area_discussion") return "Yrityksenne keskeiset riskialueet";
  return mode === "business" ? "Yrityksellesi ehdotetut vakuutukset" : "Sinulle ehdotetut vakuutukset";
}

function resultsIntroFor(assessment) {
  if (assessment.flowType === "solution_package") {
    return "Tutustu ehdotuksiin ja vertaa halutessasi vakuutusten turvavaihtoehtoja.";
  }
  if (assessment.flowType === "risk_area_discussion") {
    return "Alla olevat alueet eivät ole valmis vakuutuspaketti, vaan keskustelun pohja nykyisen vakuutusohjelman ja riskien tarkistamiseen.";
  }
  if (assessment.flowType === "direct_expert_contact") {
    return "Tämän kokoinen yritys tarvitsee räätälöidyn vakuutusohjelman ja suoran yritysasiantuntijan arvion.";
  }
  return "Tutustu ehdotuksiin ja vertaa halutessasi vakuutusten turvavaihtoehtoja.";
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
  `;
}

function renderRecommendationContext(assessment) {
  if (["risk_area_discussion", "direct_expert_contact"].includes(assessment.flowType)) {
    return renderAssessmentOverview(assessment);
  }

  return `
    <section class="recommendation-context">
      <div>
        <p class="eyebrow compact">Suosituksen lähtökohta</p>
        <h4>${escapeHtml(assessment.title)}</h4>
        <p>${escapeHtml(assessment.summary)}</p>
      </div>
    </section>
  `;
}

function renderMandatoryChecks(checks = []) {
  if (!checks.length) return `
    <section class="mandatory-section product-section no-mandatory" id="results-mandatory">
      <div class="product-section-head mandatory-intro">
        <span class="mandatory-icon" aria-hidden="true">✓</span>
        <div>
          <p class="eyebrow compact">Lakisääteiset vakuutukset</p>
          <h4>Ei tunnistettuja lakisääteisiä vakuutuksia</h4>
          <p>Antamiesi tietojen perusteella kartoitus ei nostanut tähän ryhmään vakuutuksia. Tilanne varmistetaan tarvittaessa asiantuntijan kanssa.</p>
        </div>
      </div>
    </section>
  `;
  return `
    <section class="mandatory-section product-section" id="results-mandatory">
      <div class="product-section-head mandatory-intro">
        <span class="mandatory-icon" aria-hidden="true">!</span>
        <div>
          <p class="eyebrow compact">Lakisääteiset ja sopimusperusteiset vakuutukset</p>
          <h4>Tarkista nämä ensin</h4>
          <p>Nämä on erotettu vapaaehtoisista vakuutuksista. Velvoitteen peruste ja soveltuminen varmistetaan aina yrityksen tilanteen mukaan.</p>
        </div>
      </div>
      <div class="mandatory-content">
        <div class="product-card-grid mandatory-product-grid">
          ${checks.map((item) => renderMandatoryProductCard(item)).join("")}
        </div>
        <p class="mandatory-note">Lakisääteinen velvoite koskee yksittäistä vakuutusta, ei koko henkilöstö- tai ajoneuvovakuutusten aluetta.</p>
      </div>
    </section>
  `;
}

function renderMandatoryProductCard(item) {
  const card = mandatoryCardMeta(item);
  const badgeLabel = item.badgeLabel || "Lakisääteisesti tarkistettava";
  return `
    <article class="product-rec-card mandatory-product-card obligation-${escapeHtml(item.obligationKind || "statutory")}">
      ${renderProductMedia(card.visual, card.title, card.imageUrl, card.imagePosition)}
      <div class="product-card-body">
        <h4>${escapeHtml(card.title)}</h4>
        <p>${escapeHtml(card.lead)}</p>
        <div class="product-card-tags">
          <span>${escapeHtml(badgeLabel)}</span>
        </div>
        <p class="mandatory-card-note">${escapeHtml(item.text)}</p>
        <div class="product-card-actions">
          <a class="product-page-link" href="${escapeHtml(card.url)}" target="_blank" rel="noopener noreferrer">Lue lisää <span aria-hidden="true">›</span></a>
        </div>
      </div>
    </article>
  `;
}

function mandatoryCardMeta(item) {
  const businessImages = officialBusinessImages();
  const personalImages = officialPersonalImages();
  const catalog = {
    yel: {
      title: "YEL-vakuutus",
      visual: "people",
      url: "https://www.lahitapiola.fi/yritys/vakuutukset/elakevakuutukset/yel-vakuutus/",
      imageUrl: businessImages.yel,
      imagePosition: "center 45%",
      coverText: "YEL-vakuutus muodostaa yrittajan elake- ja sosiaaliturvan perustan.",
      lead: "Yrittäjän eläke- ja sosiaaliturvan pohja, kun YEL-ehdot täyttyvät."
    },
    tyel: {
      title: "TyEL-vakuutus",
      visual: "people",
      url: "https://www.lahitapiola.fi/yritys/vakuutukset/elakevakuutukset/tyel-vakuutus/",
      imageUrl: businessImages.tyel,
      imagePosition: "center 58%",
      coverText: "TyEL-vakuutuksella huolehditaan yrityksen tyontekijoiden lakisaateisesta elaketurvasta.",
      lead: "Turvaa työntekijän vanhuuden, työkyvyttömyyden ja perheenhuoltajan kuoleman varalta sekä mahdollistaa ammatillisen kuntoutuksen."
    },
    workers_comp: {
      title: "Työtapaturmavakuutus",
      visual: "health",
      url: "https://www.lahitapiola.fi/yritys/vakuutukset/henkilovakuutukset/",
      imageUrl: businessImages.workAccident,
      imagePosition: "center 58%",
      coverText: "Tyotapaturmavakuutus turvaa tyontekijoita tyossa sattuvien tapaturmien ja ammattitautien varalta.",
      lead: "Korvaa työntekijälle työssä sattuneita tapaturmia ja ammattitauteja lakisääteisen turvan mukaisesti."
    },
    traffic: {
      title: "Liikennevakuutus",
      visual: "vehicle",
      url: mode === "personal"
        ? "https://www.lahitapiola.fi/henkilo/vakuutukset/ajoneuvovakuutukset/liikennevakuutus/"
        : "https://www.lahitapiola.fi/yritys/vakuutukset/ajoneuvovakuutukset/yrityksen-ajoneuvovakuutukset/",
      imageUrl: mode === "personal" ? personalImages.traffic : businessImages.traffic,
      imagePosition: "center 55%",
      coverText: "Liikennevakuutus on liikenteessa kaytettavan ajoneuvon lakisaateinen perusturva.",
      lead: "Korvaa liikenteessä sattuneita henkilövahinkoja ja syyttömän osapuolen omaisuusvahinkoja. Oman ajoneuvon vahingot kuuluvat kaskoon."
    },
    patient: {
      title: "Potilasvakuutus",
      visual: "health",
      url: "https://www.lahitapiola.fi/yritys/vakuutukset/",
      imageUrl: businessImages.patient,
      imagePosition: "center 58%",
      lead: "Korvaa potilaalle terveyden- tai sairaanhoidon yhteydessä aiheutuneita henkilövahinkoja potilasvakuutuslain mukaisesti."
    },
    group_life: {
      title: "Ryhmähenkivakuutus",
      visual: "life",
      url: "https://www.lahitapiola.fi/yritys/vakuutukset/henkilovakuutukset/",
      imageUrl: businessImages.groupLife,
      imagePosition: "center 52%",
      lead: "Maksaa työntekijän kuoleman jälkeen kertakorvauksen vakuutuksen ehtoihin kuuluville edunsaajille."
    }
  };
  return {
    title: item.name,
    visual: "liability",
    url: "https://www.lahitapiola.fi/yritys/vakuutukset/",
    lead: "Vakuuttamisvelvollisuus varmistetaan yrityksen tilanteen perusteella.",
    ...(catalog[item.id] || {})
  };
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
      title: mode === "business" ? "Sinulle ehdotetut yritysvakuutukset" : "Sinulle ehdotetut vakuutukset",
      desc: mode === "business"
        ? "Nämä vakuutusalueet ovat yritysprofiilin perusteella ensimmäisenä tarkistettavia."
        : "Nämä vakuutusalueet sopivat vastauksiesi perusteella ensimmäiseksi tarkistettaviksi.",
      items: primary
    },
    {
      key: "possible",
      title: "Harkitse myös",
      desc: mode === "business"
        ? "Näitä kannattaa katsoa, jos ne liittyvät yrityksen arkeen tai nykyiseen vakuutusturvaan."
        : "Näitä voi katsoa, jos ne liittyvät omaan arkeesi tai nykyiseen vakuutusturvaasi.",
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

function resultsPrimaryAction() {
  openCustomerSummary();
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
          <button class="btn btn-secondary" type="button" data-expert-contact>Pyydä yhteydenottoa</button>
          <button class="link-button" type="button" data-restart-results>Aloita alusta</button>
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
          <button class="btn btn-secondary" type="button" data-expert-contact>Pyydä yhteydenottoa</button>
          <button class="link-button" type="button" data-restart-results>Aloita alusta</button>
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
        <button class="btn btn-secondary" type="button" data-expert-contact>Pyydä yhteydenottoa</button>
        <button class="link-button" type="button" data-restart-results>Aloita alusta</button>
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
        { title: "Irtaimisto ja toimitila", keys: ["bizProperty"], hint: "Toimitilat, koneet, laitteet ja varasto" },
        { title: "Vastuu", keys: ["bizLiability"], hint: "Asiakastyö ja vahingonkorvausvastuut" },
        { title: "Henkilöstö", keys: ["bizPeople"], hint: "Työntekijät, yrittäjä ja avainhenkilöt" },
        { title: "Kyber ja jatkuvuus", keys: ["bizInterruption", "bizCyber"], hint: "Keskeytys, järjestelmät ja tietoriskit" }
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

function renderBucket(bucket) {
  const sortedItems = sortBucketItems(bucket.items);
  const visibleItems = bucket.key === "notNow" ? sortedItems.slice(0, 8) : sortedItems;
  const title = bucket.key === "primary" ? "Suositellut vakuutukset" : bucket.title;
  const eyebrow = bucket.key === "primary" ? "Suositukset" : "Harkitse myös";
  const description = bucket.desc || (bucket.key === "primary"
    ? "Nämä vakuutusalueet nousivat vastauksiesi perusteella ensin tarkistettaviksi."
    : "Nämä voivat olla hyödyllisiä, jos ne liittyvät arkeesi tai nykyiseen vakuutusturvaasi.");

  const sectionId = bucket.key === "primary" ? "results-recommended" : "results-optional";
  if (!visibleItems.length) {
    return `
      <section class="bucket product-section product-bucket empty ${escapeHtml(bucket.key)}" id="${sectionId}">
        <div class="product-section-head">
          <p class="eyebrow compact">${escapeHtml(eyebrow)}</p>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(bucket.key === "primary"
            ? "Vastauksistasi ei noussut tähän ryhmään vakuutuksia. Voit tarkentaa vastauksia tai keskustella asiantuntijan kanssa."
            : "Vastauksistasi ei noussut tällä hetkellä erillisiä harkittavia lisäturvia.")}</p>
        </div>
      </section>
    `;
  }
  return `
    <section class="bucket product-section product-bucket ${escapeHtml(bucket.key)}" id="${sectionId}">
      <div class="product-section-head">
        <p class="eyebrow compact">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="product-card-grid">
        ${visibleItems.map((item) => item.mandatoryOnly ? renderMandatoryInlineCard(item) : renderRecommendationCard(item, bucket.key)).join("")}
      </div>
    </section>
  `;
}

function sortBucketItems(items = []) {
  const areaOrder = recommendationAreaOrder[mode] || [];
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const legalDiff = legalSortRank(a.item) - legalSortRank(b.item);
      if (legalDiff !== 0) return legalDiff;
      const areaDiff = areaSortRank(a.item, areaOrder) - areaSortRank(b.item, areaOrder);
      if (areaDiff !== 0) return areaDiff;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function legalSortRank(item) {
  if (item.mandatoryOnly) return 0;
  return 1;
}

function areaSortRank(item, areaOrder) {
  if (item.mandatoryOnly) return -1;
  const index = areaOrder.indexOf(item.key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function renderMandatoryInlineCard(item) {
  const card = mandatoryCardMeta(item.mandatory);
  const badgeLabel = item.mandatory.badgeLabel || "Lakisääteisesti tarkistettava";
  return `
    <article class="product-rec-card priority mandatory-inline-card obligation-${escapeHtml(item.mandatory.obligationKind || "statutory")}">
      <details class="product-disclosure">
        <summary class="product-card-summary">
          ${renderProductMedia(card.visual, card.title, card.imageUrl, card.imagePosition)}
          <div class="product-card-body">
            <h4>${escapeHtml(card.title)} <span aria-hidden="true">›</span></h4>
            <p>${escapeHtml(card.lead)}</p>
            <div class="product-card-tags">
              <span>Tarkista ensin</span>
              <span>${escapeHtml(badgeLabel)}</span>
            </div>
          </div>
        </summary>
        <div class="product-expanded">
          <a class="product-page-link" href="${escapeHtml(card.url)}" target="_blank" rel="noopener noreferrer">
            Lue lisää LähiTapiolan sivuilla <span aria-hidden="true">›</span>
          </a>
        </div>
      </details>
    </article>
  `;
}

function renderRecommendationCard(item, bucketKey) {
  const meta = types()[item.key];
  const card = productCardMeta(item.key, meta);
  const strength = recommendationStrength(item.score);
  const detailKey = meta.detailFlow || "";
  const selectedTitle = detailKey ? assessmentSelectedTitle(item.key) : "";
  const learnMoreUrl = card.sourceUrl || meta.materials?.[0]?.url || "";
  const articleClass = [
    "product-rec-card",
    bucketKey === "primary" ? "priority" : "supporting",
  ].filter(Boolean).join(" ");

  return `
    <article class="${articleClass}">
      ${renderProductMedia(card.visual, meta.title, card.imageUrl, card.imagePosition)}
      <div class="product-card-body">
        <h4>${escapeHtml(meta.title)}</h4>
        <p>${escapeHtml(card.lead)}</p>
        <div class="product-card-tags">
          ${renderProductTags(item, bucketKey, strength)}
          ${productScopeTag(item.key) ? `<span>${escapeHtml(productScopeTag(item.key))}</span>` : ""}
        </div>
        ${selectedTitle ? `
          <div class="product-card-selection" aria-live="polite">
            <span>Valitsemasi vaihtoehto</span>
            <strong>${escapeHtml(selectedTitle)}</strong>
          </div>
        ` : ""}
        <div class="product-card-actions">
          ${detailKey ? `<button class="btn btn-primary btn-small" type="button" data-card-refine="${escapeHtml(detailKey)}">${selectedTitle ? "Muuta turvavalintaa" : "Vertaile ja valitse turva"}</button>` : ""}
          ${learnMoreUrl ? `<a class="product-page-link" href="${escapeHtml(learnMoreUrl)}" target="_blank" rel="noopener noreferrer">Lue lisää <span aria-hidden="true">›</span></a>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderProductTags(item, bucketKey, strength) {
  const tags = [];
  if (bucketKey === "primary") tags.push("Suositeltu");
  else tags.push("Harkitse myös");
  if (strength && !tags.includes(strength)) tags.push(strength);
  if (item.existing) tags.push("Nykyinen: tarkista");
  return tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

function productScopeTag(typeKey) {
  if (["vehicle", "bizVehicle"].includes(typeKey)) return "Vapaaehtoinen kasko ja lisäturvat";
  if (typeKey === "bizPeople") return "Täydentävät henkilöturvat";
  return "";
}

function renderProductMedia(visual, title, imageUrl = "", imagePosition = "") {
  const styleParts = [];
  if (imageUrl) styleParts.push(`background-image: url('${escapeHtml(imageUrl)}')`);
  if (imagePosition) styleParts.push(`background-position: ${escapeHtml(imagePosition)}`);
  const imageStyle = styleParts.length ? ` style="${styleParts.join("; ")}"` : "";
  return `
    <div class="product-card-media product-visual-${escapeHtml(visual || "property")}${imageUrl ? " has-image" : ""}"${imageStyle} aria-hidden="true">
      ${imageUrl ? "" : `<span>${renderOptionIcon(visual || "property")}</span>`}
    </div>
  `;
}

function productCardMeta(typeKey, meta) {
  const catalog = productCardCatalog();
  const item = catalog[typeKey] || {};
  return {
    visual: visualForProduct(typeKey, meta),
    lead: productSummary(meta),
    sourceUrl: "",
    imageUrl: "",
    ...item
  };
}

function productCardCatalog() {
  const personalImages = officialPersonalImages();
  const businessImages = officialBusinessImages();
  return {
    home: {
      visual: "property",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/kotivakuutus/",
      imageUrl: personalImages.home,
      imagePosition: "center 52%",
      lead: "Korvaa valitun laajuuden mukaan esimerkiksi kodin rikkoutumis-, vuoto-, palo-, myrsky- ja varkausvahinkoja sekä vastuu- ja oikeusturvatilanteita."
    },
    vehicle: {
      visual: "vehicle",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/ajoneuvovakuutukset/",
      imageUrl: personalImages.vehicle,
      imagePosition: "center 55%",
      lead: "Korvaa oman ajoneuvon vahinkoja, kuten kolarointi-, pysäköinti-, lasi-, varkaus- ja luonnonilmiövahinkoja valitun kaskon mukaan."
    },
    travel: {
      visual: "travel",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/terveysvakuutukset/matkavakuutus/",
      imageUrl: personalImages.travel,
      imagePosition: "center 50%",
      lead: "Korvaa matkalla sattuvia sairauksia ja tapaturmia sekä valintojen mukaan matkan peruuntumista, keskeytymistä ja matkatavaravahinkoja."
    },
    health: {
      visual: "health",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/terveysvakuutukset/",
      imageUrl: personalImages.health,
      imagePosition: "center 48%",
      lead: "Korvaa valitun turvan mukaan sairauden tai tapaturman tutkimus- ja hoitokuluja ja auttaa pääsemään hoitoon nopeasti."
    },
    life: {
      visual: "life",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/henkivakuutus/",
      imageUrl: personalImages.life,
      imagePosition: "center 52%",
      lead: "Maksaa sovitun kertakorvauksen edunsaajille vakuutetun kuollessa ja auttaa turvaamaan läheisten taloutta."
    },
    pet: {
      visual: "pet",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/lemmikkivakuutus/",
      imageUrl: personalImages.pet,
      imagePosition: "center 52%",
      lead: "Korvaa koiran tai kissan sairauden ja tapaturman tutkimus- ja hoitokuluja valitun turvan mukaan."
    },
    horse: {
      visual: "pet",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/lemmikkivakuutus/",
      imageUrl: personalImages.horse,
      imagePosition: "center 52%",
      lead: "Korvaa hevosen sairauden tai tapaturman eläinlääkärikuluja sekä valintojen mukaan eläimen menetykseen liittyviä riskejä."
    },
    boat: {
      visual: "vehicle",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/ajoneuvovakuutukset/venevakuutus/",
      imageUrl: personalImages.boat,
      imagePosition: "center 52%",
      lead: "Korvaa veneelle ja varusteille esimerkiksi karilleajosta, törmäyksestä, varkaudesta, palosta tai luonnonilmiöstä aiheutuvia vahinkoja valitun turvan mukaan."
    },
    apartment: {
      visual: "property",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/kotivakuutus/",
      imageUrl: personalImages.cottage,
      imagePosition: "center 52%",
      lead: "Korvaa vapaa-ajan asunnon rakennukselle ja irtaimistolle esimerkiksi palosta, vuodosta, varkaudesta tai luonnonilmiöstä aiheutuvia vahinkoja valitun turvan mukaan."
    },
    liability: {
      visual: "liability",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/kotivakuutus/",
      imageUrl: personalImages.liability,
      imagePosition: "center 52%",
      lead: "Vastuuvakuutus korvaa toiselle aiheutettuja henkilö- ja esinevahinkoja. Oikeusturva auttaa yksityiselämän riita- ja rikosasioiden lakimieskuluissa."
    },
    forest: {
      visual: "property",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/metsavakuutus/",
      imageUrl: personalImages.forest,
      imagePosition: "center 50%",
      lead: "Korvaa metsälle esimerkiksi myrskystä, lumesta, palosta tai hyönteisistä aiheutuvia vahinkoja valitun turvan mukaan."
    },
    pregnancy: {
      visual: "health",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/terveysvakuutukset/vauvavakuutus/",
      imageUrl: personalImages.baby,
      imagePosition: "center 48%",
      lead: "Korvaa syntyvän lapsen sairauden tai tapaturman tutkimus- ja hoitokuluja vakuutuksen ehtojen ja valitun turvan mukaan."
    },
    childSerious: {
      visual: "health",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/vakuutukset/terveysvakuutukset/lapsivakuutus/",
      imageUrl: personalImages.child,
      imagePosition: "center 48%",
      lead: "Maksaa kertakorvauksen, jos lapsi sairastuu vakuutusehdoissa määriteltyyn vakavaan sairauteen."
    },
    investment: {
      visual: "life",
      sourceUrl: "https://www.lahitapiola.fi/henkilo/sijoittaminen/",
      imageUrl: personalImages.advice,
      imagePosition: "center 50%",
      lead: "Yhdistää vakuutussopimuksen ja valittavat sijoituskohteet pitkäaikaiseen säästämiseen ja varallisuuden suunnitteluun."
    },
    bizProperty: {
      visual: "assets",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/omaisuusvakuutukset/yritysvakuutus/",
      imageUrl: businessImages.property,
      imagePosition: "center 45%",
      lead: "Korvaa yrityksen koneille, laitteille, kalusteille, varastolle tai toimitilalle esimerkiksi palosta, vuodosta, rikkoutumisesta tai varkaudesta aiheutuvia vahinkoja."
    },
    bizLiability: {
      visual: "liability",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/omaisuusvakuutukset/vastuuvakuutus/",
      imageUrl: businessImages.liability,
      imagePosition: "center 50%",
      lead: "Korvaa yrityksen toiminnasta ulkopuoliselle aiheutettuja henkilö- ja esinevahinkoja sekä valitun vastuuturvan mukaan varallisuusvahinkoja."
    },
    bizInterruption: {
      visual: "interruption",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/omaisuusvakuutukset/keskeytysvakuutus/",
      imageUrl: businessImages.interruption,
      imagePosition: "center 45%",
      lead: "Korvaa liiketoiminnan keskeytymisestä syntyvää katemenetystä ja ylimääräisiä kuluja, kun keskeytys johtuu vakuutuksesta korvattavasta vahingosta."
    },
    bizCyber: {
      visual: "cyber",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/omaisuusvakuutukset/kybervakuutus/",
      imageUrl: businessImages.cyber,
      imagePosition: "center 58%",
      lead: "Korvaa tietoturvaloukkauksen selvitys- ja palautumiskuluja sekä sisältää keskeytys- ja vastuuvakuutuksen kybervahinkoihin."
    },
    bizVehicle: {
      visual: "vehicle",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/ajoneuvovakuutukset/yrityksen-ajoneuvovakuutukset/",
      imageUrl: businessImages.vehicle,
      imagePosition: "center 55%",
      lead: "Korvaa yrityksen oman ajoneuvon vahinkoja, kuten kolarointi-, lasi-, varkaus-, palo- ja luonnonilmiövahinkoja valitun kaskon mukaan."
    },
    bizPeople: {
      visual: "people",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/henkilovakuutukset/",
      imageUrl: businessImages.people,
      imagePosition: "center 58%",
      lead: "Täydentää yrittäjän ja työntekijöiden turvaa sairauden, tapaturman, työkyvyttömyyden tai kuoleman varalta valittujen vakuutusten mukaan."
    },
    bizTravel: {
      visual: "travel",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/",
      imageUrl: businessImages.travel,
      imagePosition: "center 50%",
      lead: "Korvaa työmatkalla sattuvia sairauksia ja tapaturmia sekä valintojen mukaan matkatavaroita, peruuntumisia ja matkan keskeytymisiä."
    },
    bizCargo: {
      visual: "vehicle",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/",
      imageUrl: businessImages.cargo,
      imagePosition: "center 55%",
      lead: "Korvaa kuljetettavalle tavaralle kuljetuksen aikana aiheutuvia vahinkoja tai rahdinkuljettajan vastuuta asiakkaan tavarasta valitun turvan mukaan."
    },
    bizLegal: {
      visual: "liability",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/omaisuusvakuutukset/yrityksen-oikeusturvavakuutus/",
      imageUrl: businessImages.legal,
      imagePosition: "center 50%",
      lead: "Korvaa yrityksen asianajo- ja oikeudenkäyntikuluja vakuutusehtojen mukaisissa riita- ja rikosasioissa."
    },
    bizRealEstate: {
      visual: "premises",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/omaisuusvakuutukset/kiinteistovakuutus/",
      imageUrl: businessImages.realEstate,
      imagePosition: "center 45%",
      lead: "Korvaa rakennukselle palosta, luonnonilmiöstä, vuodosta, murrosta, ilkivallasta tai talotekniikan rikkoutumisesta aiheutuvia vahinkoja valitun turvan mukaan."
    },
    bizPatient: {
      visual: "health",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/",
      imageUrl: businessImages.patientCare,
      imagePosition: "center 58%",
      lead: "Korvaa potilaalle terveyden- tai sairaanhoidon yhteydessä aiheutuneita henkilövahinkoja potilasvakuutuslain mukaisesti."
    },
    bizConstruction: {
      visual: "premises",
      sourceUrl: "https://www.lahitapiola.fi/yritys/vakuutukset/",
      imageUrl: businessImages.construction,
      imagePosition: "center 50%",
      lead: "Korvaa rakennus- tai asennustyön kohteelle, materiaaleille ja työmaalla käytettävälle omaisuudelle äkillisiä vahinkoja valitun turvan mukaan."
    }
  };
}

function officialBusinessImages() {
  return {
    yel: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/31tyRJ72fzH6zQd44hpDHk/5f040f7d6fb5aaf9a354043948f11eca/btb_yrittajanvakuutukset.jpg?w=692&h=389&q=50&fm=webp",
    tyel: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/35dz0nUY8xLvj8Kf4GxDdV/effeb304e69ac634ce4adc2567b1817a/tyontekija_toimistossa_1920x1080.jpg?w=692&h=389&q=50&fm=webp",
    workAccident: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/79XctuQ9PuHCfS3hIuktCt/c9ea6dae6ffb6502d0206aa90f1c13a2/mp25707999-businessman-in-helmet-with-clipboard-at-warehouse.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    traffic: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/5ei3G8tH3We69tcOtgkO0A/b47d005a980336c4577ee87237436846/LT_auto_keltainen_5.jpg?w=692&h=389&q=50&fm=webp",
    patient: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/3O8hsNBgJ73sCzsCE1FY5L/2089c02091401eee3870ecb40a2f8fbd/HA_asiaksedut_sryhmatyontekija.jpg?w=692&h=389&q=50&fm=webp",
    groupLife: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/4W2QbuSXgjYq2HUjJS7bPj/b491db62605885d942f36bf487d16a31/Pariturva_hero_Q1-2025.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    people: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/7iRwmZmT3cBnjUKlyrMA9g/05e826639c0d4097091212e8ed15d331/mp27360278-multicultural-colleagues-working-on-startup-project-in-office-and-looking-at-documents__2_.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    interruption: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/3K89yu6hbYfrwe1Dh1s4cJ/c3aebd7436ecb4ea1cee209e47df89d2/YA_vakuutukset_keskeytysvakuutus.jpg?w=692&h=389&q=50&fm=webp",
    vehicle: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/5K7WwjjfYH4TDzyw23wvPQ/83eb37796b8e3be9cd8bd969844e801b/LT_auto-parkkihallikolhu_12.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    property: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/Ghhy4EMcISBHGnVPKq7V8/a3c772786f2a253738d945265eb40efd/YA_vakuutukset_yritysvakuutus.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    travel: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/xtQ2vphEgBbNP5q71cgKd/3f10ef3d9cc5304f848d71dfc1440398/HA_vakuutukset_matkavakuutus.jpg?w=692&h=389&q=50&fm=webp",
    liability: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/1ZXsIwRgJ72mRzkgTyqI9H/7e273fb53b7d1a6b3b5d20d599ddb119/mp65341606-business-meeting-and-handshake-in-office-with-people.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    cyber: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/3ALgAznIlzouE39TmLjupd/1edc44fc987f66ec8508dbfee874267b/LT_asiakastapaaminen_neukkari_1195.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    construction: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/3HZdgA1RkH4ojD588pfhee/9e20fd322ef82515806156729f3ae0c7/mp52278538-architects-in-helmets-with-blueprint-at-office.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    cargo: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/6bwaXNbLz3RXsVXVX37Mc3/1e4c7ed226ea87e34a090dc9ca5c04fb/14540334-businesswoman-and-businessman-working-in-office__1_.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    legal: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/35OddDDo2YZ32Nvt6uIowS/09ff6b1e86a5d84a11736b81b895b5aa/LT_onnellinen_pariskunta_1078.jpg?w=692&h=389&q=50&fm=webp",
    realEstate: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/6G8UlXFP7QiN5SE5esu82r/29700fa3a139a86f4b7eae5732b23057/omakotitalo.jpg?w=1200&h=630&q=90&fit=fill&f=bottom&fm=jpg",
    patientCare: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/4L3F4OlSb6QF7RaJ3kZlyh/465111aa4acbf95d4d92459c60853c35/LT_palkitseminen_henkilosto_kakkuhetki_17.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg"
  };
}

function officialPersonalImages() {
  const businessImages = officialBusinessImages();
  return {
    traffic: businessImages.traffic,
    vehicle: businessImages.vehicle,
    home: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/70uQF12ttwhzYxJvBIyA7g/bb30236689691084dc568d090cc442ea/LT_kotivakuutus_nuoretsohvalla_3.jpg?w=692&h=389&q=50&fm=webp",
    travel: businessImages.travel,
    health: businessImages.people,
    pet: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/YlEQVbrzeP2rtwyBZoXe8/3c3661691858811c0e0607f24db2e098/kissavakuutus_1920x1080.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    horse: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/4fiteFRyhGzYAfuHYWywny/57e735979904e26a91dd568eb1fc077e/LT_asiointi_aiti_isovanhempi_kotipihalla_1038.jpg?w=692&h=389&q=50&fm=webp",
    forest: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/33Pq44KkUXDfQc40jzNNKv/98af3b7ebad268f69207e746615dbb0c/HA_vakuutukset_metsa.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    boat: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/E9Ai6PkVO91AHJP0dqiFP/cdc77b9bcf0ea8423245c9205075336a/HA_vakuutukset_vene.jpg?w=692&h=389&q=50&fm=webp",
    advice: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/35lX4KDaZg33cKqmdlCUKN/c4ff5f1cd8a83d77c87a36e24d6b10f1/yritta__ja__na__.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    life: businessImages.groupLife,
    cottage: businessImages.realEstate,
    liability: businessImages.liability,
    baby: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/3Y4viBDqiUlppPAoAMSyfT/3d21b9f19c4f5ed2d2955f7ddc83b485/17906902-close-up-of-young-father-holding-his-newborn-baby-son.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg",
    child: "https://www.lahitapiola.fi/assets/images/uvkjjs8ajvb6/69qpGfP00csr00HHWcTZhZ/aa7dc86c93b3b3ee555b5b7bf7f1aad6/vauva_2.jpg?w=692&h=389&fl=progressive&q=50&fm=jpg"
  };
}

function visualForProduct(typeKey, meta) {
  if (typeKey?.includes("Vehicle") || typeKey === "vehicle" || meta.title.toLocaleLowerCase("fi-FI").includes("ajoneuvo")) return "vehicle";
  if (typeKey?.includes("Travel") || typeKey === "travel" || meta.title.toLocaleLowerCase("fi-FI").includes("matka")) return "travel";
  if (typeKey?.includes("Cyber") || meta.title.toLocaleLowerCase("fi-FI").includes("kyber")) return "cyber";
  if (typeKey?.includes("People") || meta.title.toLocaleLowerCase("fi-FI").includes("henkil")) return "people";
  if (typeKey?.includes("Liability") || meta.title.toLocaleLowerCase("fi-FI").includes("vastuu")) return "liability";
  if (typeKey?.includes("Interruption") || meta.title.toLocaleLowerCase("fi-FI").includes("keskeytys")) return "interruption";
  if (typeKey === "health" || meta.title.toLocaleLowerCase("fi-FI").includes("terveys")) return "health";
  if (typeKey === "life" || meta.title.toLocaleLowerCase("fi-FI").includes("henki")) return "life";
  if (typeKey === "pet" || meta.title.toLocaleLowerCase("fi-FI").includes("lemmikki")) return "pet";
  return "property";
}

function productSummary(meta) {
  return meta.desc || "Vakuutuksen tarkka sisältö varmistetaan tuotemateriaaleista ja asiantuntijan kanssa.";
}

function recommendationStrength(score) {
  return score >= 7 ? "Suositeltu" : "";
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
  finishDetail(detailKey);
  track("coverage_comparison_opened", { mode, detailKey });
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
  $("detailNext").classList.toggle("hidden", !question.multi);
  $("detailError").classList.add("hidden");
  $("detailError").textContent = "";
  renderAnswerOptions("detailAnswers", question, st().detailAnswers[detailKey], (value) => {
    setAnswer(question, st().detailAnswers[detailKey], value);
    renderDetailQuestion();
    if (!question.multi) scheduleAutoAdvance(detailNext);
  });
}

function detailBack() {
  cancelAutoAdvance();
  if (st().detailIndex > 0) {
    st().detailIndex -= 1;
    renderDetailQuestion();
    return;
  }
  openRecommendations();
}

function detailNext() {
  cancelAutoAdvance();
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
  refreshAssessmentResult();
  renderDetailResult(detailKey, result);
  showView("detailResult");
  track("detail_completed", { mode, detailKey });
}

function restartDetail() {
  const detailKey = st().activeDetail;
  if (!detailKey) return;
  finishDetail(detailKey);
}

function renderDetailResult(detailKey, result) {
  const typeKey = Object.keys(types()).find((key) => types()[key].detailFlow === detailKey) || detailKey;
  const meta = types()[typeKey];
  const card = productCardMeta(typeKey, meta);
  const comparison = result.comparison ? {
    ...result.comparison,
    sourceUrl: result.comparison.sourceUrl || card.sourceUrl || meta.materials?.[0]?.url || "",
    sourceLabel: result.comparison.sourceLabel || `LähiTapiolan ${meta.title.toLocaleLowerCase("fi-FI")} -tiedot`
  } : null;
  $("detailResultTitle").textContent = `${meta.title}: turvien vertailu`;
  $("detailResult").innerHTML = `
    <div class="result-hero">
      ${renderCoverageComparison(comparison, detailKey)}
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
      <button class="btn btn-primary" type="button" data-next-detail="${escapeHtml(meta.detailFlow)}">Vertaa seuraavan vakuutuksen turvia</button>
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
  const explicitlySelectedKey = st().selectedCoverage[detailKey] || "";
  const explicitlySelectedOption = comparison.options.find((option) => option.key === explicitlySelectedKey);
  const featureRows = comparison.featureRows || [];
  const tableRows = featureRows.length
    ? featureRows.map((row) => [row.label, (option) => row.values?.[option.key] || "Ei sisälly", row.description])
    : [
        ["Kenelle sopii", (option) => option.fit, "Avaa nähdäksesi, millaiseen tilanteeseen vaihtoehto on tarkoitettu."],
        ["Mitä turva painottaa", (option) => option.covers, "Avaa nähdäksesi, mitä vahinkoja tai tarpeita vaihtoehto painottaa."],
        ["Mitä kannattaa tarkistaa", (option) => option.limits, "Avaa nähdäksesi rajaukset ja asiat, jotka varmistetaan ehdoista tai asiantuntijalta."]
      ];
  const renderComparisonValue = (value) => {
    const text = String(value || "");
    if (!featureRows.length) return escapeHtml(text);
    const statusClass = text === "Sisältyy" ? "included" : text === "Valinnainen" ? "optional" : "excluded";
    const symbol = statusClass === "included" ? "✓" : statusClass === "optional" ? "○" : "–";
    return `<span class="coverage-status ${statusClass}"><span aria-hidden="true">${symbol}</span>${escapeHtml(text)}</span>`;
  };

  return `
    <section class="coverage-compare" aria-label="${escapeHtml(comparison.title)}">
      <div class="coverage-recommendation">
        <p class="eyebrow compact">Kartoituksen lähtökohta</p>
        <h4>${escapeHtml(recommendedLabels)}</h4>
        <p>${escapeHtml(shortenText(comparison.basis, 220))}</p>
        <div class="coverage-current-selection ${explicitlySelectedOption ? "has-selection" : ""}" aria-live="polite">
          <strong>${explicitlySelectedOption ? "Valitsemasi vaihtoehto" : "Valitse vertailun jälkeen sopiva vaihtoehto"}</strong>
          <span>${explicitlySelectedOption ? escapeHtml(explicitlySelectedOption.title) : "Valinta tallentuu yhteenvetoon ja välitetään yhteydenottopyynnön mukana asiantuntijalle."}</span>
        </div>
      </div>
      <details class="coverage-details" open>
        <summary>${featureRows.length ? "Vertaa turvatasojen sisältöjä" : "Vertaa vaihtoehtojen sisältöjä"}</summary>
        <p>${escapeHtml(comparison.notice)}</p>
        ${comparison.sourceUrl ? `<p class="coverage-source">Lähde: <a href="${escapeHtml(comparison.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(comparison.sourceLabel || "LähiTapiolan vakuutussivu")}</a></p>` : ""}
        <div class="coverage-table-wrap coverage-desktop-table">
          <table class="coverage-table">
            <thead>
              <tr>
                <th>Vertailukohta</th>
                ${comparison.options.map((option) => `
                  <th class="${option.key === explicitlySelectedKey ? "selected" : ""}">
                    <strong>${escapeHtml(option.title)}</strong>
                    ${comparison.recommendedKeys.includes(option.key) ? `<span class="recommend-badge">Suositus</span>` : ""}
                    <button class="coverage-select-button" type="button" data-detail-key="${escapeHtml(detailKey)}" data-coverage-choice="${escapeHtml(option.key)}" aria-pressed="${option.key === explicitlySelectedKey ? "true" : "false"}">
                      ${option.key === explicitlySelectedKey ? "✓ Valittu" : "Valitse tämä"}
                    </button>
                  </th>
                `).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableRows.map(([label, getValue, description]) => `
                <tr>
                  <th scope="row">${description ? `<details class="coverage-feature-detail"><summary>${escapeHtml(label)}</summary><p>${escapeHtml(description)}</p></details>` : escapeHtml(label)}</th>
                  ${comparison.options.map((option) => `<td class="${option.key === explicitlySelectedKey ? "selected" : ""}">${renderComparisonValue(getValue(option))}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <div class="coverage-detail-list">
          ${comparison.options.map((option) => `
            <article class="coverage-detail-item ${option.key === explicitlySelectedKey ? "selected" : ""}">
              <div>
                <strong>${escapeHtml(option.title)}</strong>
                ${comparison.recommendedKeys.includes(option.key) ? `<span>Suositus</span>` : ""}
                ${option.key === explicitlySelectedKey ? `<span>Valittu</span>` : ""}
              </div>
              <dl>
                ${tableRows.map(([label, getValue, description]) => `<div><dt>${description ? `<details class="coverage-feature-detail"><summary>${escapeHtml(label)}</summary><p>${escapeHtml(description)}</p></details>` : escapeHtml(label)}</dt><dd>${renderComparisonValue(getValue(option))}</dd></div>`).join("")}
              </dl>
              <button class="coverage-select-button mobile" type="button" data-detail-key="${escapeHtml(detailKey)}" data-coverage-choice="${escapeHtml(option.key)}" aria-pressed="${option.key === explicitlySelectedKey ? "true" : "false"}">
                ${option.key === explicitlySelectedKey ? "✓ Valittu vaihtoehto" : "Valitse tämä vaihtoehto"}
              </button>
            </article>
          `).join("")}
        </div>
      </details>
      <p class="coverage-disclaimer">Vertailu on yleiskuva. Lopullinen sisältö, korvattavuus ja soveltuvuus varmistetaan vakuutusehdoista tai asiantuntijan kanssa.</p>
    </section>
  `;
}

function bindDetailActions(root) {
  root.querySelectorAll("[data-coverage-choice]").forEach((button) => {
    button.addEventListener("click", () => selectCoverageOption(button.dataset.detailKey || "", button.dataset.coverageChoice || ""));
  });
  root.querySelectorAll("[data-coverage-cell]").forEach((cell) => {
    cell.addEventListener("click", () => selectCoverageOption(cell.dataset.detailKey || "", cell.dataset.coverageCell || ""));
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
  persistAssessment();
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
          <small>Vakuutusselosteet ja ehdot</small>
        </summary>
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
    startQuick("base");
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
    const selectedOption = st().selectedCoverage[meta.detailFlow]
      ? coverageModels[mode]?.[meta.detailFlow]?.options?.find((option) => option.key === st().selectedCoverage[meta.detailFlow])
      : null;
    const detailBadge = selectedOption ? `Valittu: ${selectedOption.title}` : st().detailResults[meta.detailFlow] ? "Vertailtu · ei valintaa" : "";
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
      updateContactHandoffSummary();
      renderSummaryList();
      persistAssessment();
    });
  });
  restoreContactFields();
  readContactFields();
  updateContactHandoffSummary();
  ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "freeText"].forEach((id) => {
    if (!$(id)) return;
    $(id).oninput = () => { readContactFields(); updateContactHandoffSummary(); persistAssessment(); };
    $(id).onchange = () => { readContactFields(); updateContactHandoffSummary(); persistAssessment(); };
  });
  if (mode !== "business" && $("contactOrg")) $("contactOrg").value = "";
}

function updateContactHandoffSummary() {
  const root = $("contactHandoffSummary");
  if (!root) return;
  root.innerHTML = renderContactHandoffSummary();
  root.querySelector("[data-edit-contact-answers]")?.addEventListener("click", () => startBaseInfo());
}

function renderContactHandoffSummary() {
  const assessment = st().assessmentResult;
  if (!assessment) return "";
  const selectedAreas = recommendedContactKeys();
  const selectedLevels = selectedAreas
    .map((key) => ({ key, title: types()[key].title, selectedTitle: assessmentSelectedTitle(key) }))
    .filter((item) => item.selectedTitle);
  const openLevels = selectedAreas
    .filter((key) => types()[key]?.detailFlow && !assessmentSelectedTitle(key))
    .map((key) => types()[key].title);
  const recommendedTitles = (assessment.recommendedCovers || [])
    .map((item) => types()[item.key]?.title)
    .filter(Boolean);
  const optionalTitles = (assessment.optionalCovers || [])
    .filter((item) => item.active)
    .map((item) => types()[item.key]?.title)
    .filter(Boolean);
  const baseSummary = baseAnswerTags().join(" · ") || "Ei kirjattuja lähtötietoja";
  const selectedAreaLabel = selectedAreas.length === 1 ? "1 vakuutus" : `${selectedAreas.length} vakuutusta`;
  const coverageChoiceLabel = selectedAreas.length
    ? `${selectedLevels.length} valittu · ${openLevels.length} avoinna`
    : "Ei vielä valintoja";
  const contactPreference = [st().contact.contactChannel, st().contact.contactTime].filter(Boolean).join(" · ") || "Ei vielä valittu";

  return `
    <section class="contact-handoff-summary" aria-labelledby="handoffTitle">
      <div class="contact-handoff-head">
        <div>
          <h4 id="handoffTitle">Nämä tiedot välitetään asiantuntijalle</h4>
          <p>Välitämme kartoituksen vastaukset, alla valitsemasi keskusteluaiheet ja tekemäsi turvavalinnat.</p>
        </div>
      </div>
      <div class="handoff-overview" aria-label="Yhteydenoton tiivistelmä">
        <div><span>Asiakastyyppi</span><strong>${escapeHtml(profile().label)}</strong></div>
        <div><span>Keskusteluun valittu</span><strong>${escapeHtml(selectedAreaLabel)}</strong></div>
        <div><span>Turvavaihtoehdot</span><strong>${escapeHtml(coverageChoiceLabel)}</strong></div>
      </div>
      <details class="handoff-details">
        <summary>Näytä kaikki välitettävät tiedot</summary>
        <div class="handoff-details-content">
          <div>
            <span>Kartoituksen vastaukset</span>
            <strong>${escapeHtml(baseSummary)}</strong>
          </div>
          <div>
            <span>Lakisääteiset tarkistukset</span>
            <strong>${escapeHtml(assessment.mandatoryChecks?.map((item) => item.name).join(", ") || "Ei tunnistettuja")}</strong>
          </div>
          <div>
            <span>Suositellut ja harkittavat vakuutukset</span>
            <strong>${escapeHtml([...recommendedTitles, ...optionalTitles].join(", ") || "Ei tunnistettuja")}</strong>
          </div>
          <div>
            <span>Yhteydenottotoive</span>
            <strong>${escapeHtml(contactPreference)}</strong>
          </div>
          <div class="handoff-coverage-details">
            <span>Keskusteluun valitut vakuutukset ja turvavaihtoehdot</span>
            <ul>
              ${selectedAreas.map((key) => `
                <li><strong>${escapeHtml(types()[key].title)}</strong><span>${escapeHtml(assessmentSelectedTitle(key) || "Turvavaihtoehto avoinna")}</span></li>
              `).join("") || `<li>Ei vielä valittuja vakuutuksia.</li>`}
            </ul>
          </div>
        </div>
      </details>
    </section>
  `;
}

function assessmentSelectedTitle(typeKey) {
  const detailKey = types()[typeKey]?.detailFlow;
  const selectedKey = detailKey ? st().selectedCoverage[detailKey] : "";
  return coverageModels[mode]?.[detailKey]?.options?.find((option) => option.key === selectedKey)?.title || "";
}

function openCustomerSummary(showCrm = false) {
  if (!st().recommendation && Object.keys(st().baseAnswers).length) calculateAndRenderRecommendations();
  if (!st().assessmentResult) {
    startQuick("base");
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
  const covers = sortBucketItems(customerSummaryCovers(assessment));
  const refinedCount = covers.filter((item) => st().detailResults[types()[item.key]?.detailFlow]).length;
  const profileTags = summaryProfileTags(assessment, covers, refinedCount);
  const baseTags = baseAnswerTags();
  const riskCards = customerSummaryRiskCards(assessment);
  const summaryProductCards = [
    ...(assessment.mandatoryChecks || []).map((item) => renderCustomerSummaryMandatoryCard(item)),
    ...covers.map((item) => renderCustomerSummaryCover(item, assessment))
  ].join("");
  const summaryProductCount = (assessment.mandatoryChecks?.length || 0) + covers.length;
  const introTitle = mode === "business" ? "Yrityksellesi muodostettu vakuutusnäkymä" : "Sinulle muodostettu vakuutusnäkymä";
  const introText = assessment.flowType === "direct_expert_contact"
    ? "Yrityksesi koko tai tilanne ohjaa suoraan asiantuntijakeskusteluun. Yhteenveto auttaa aloittamaan keskustelun oikeista riskialueista."
    : "Yhteenveto näyttää vakuutukset siinä järjestyksessä, jossa ne kannattaa tarkistaa. Pakolliset ja sopimusperusteiset tarkistukset näkyvät ensimmäisinä.";

  $("customerSummaryContent").innerHTML = `
    <section class="customer-summary-hero">
      <div>
        <div class="summary-profile-header">
          ${profileTags.map((tag) => `<span class="profile-tag ${tag.refined ? "refined" : ""}">${escapeHtml(tag.label)}</span>`).join("")}
        </div>
        <h4>${escapeHtml(introTitle)}</h4>
        <p>${escapeHtml(assessment.summary || introText)}</p>
      </div>
    </section>

    ${baseTags.length ? `
      <details class="summary-context-disclosure">
        <summary>Näytä kartoituksen lähtötiedot</summary>
        <div class="summary-context-content">
          ${baseTags.length ? `
            <div>
              <strong>Tilanteesi</strong>
              <div class="profile-tag-row">${baseTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
            </div>
          ` : ""}
        </div>
      </details>
    ` : ""}

    ${riskCards.length ? `
      <section class="customer-summary-section summary-product-section">
        <div class="customer-summary-title">
          <div>
            <p class="eyebrow compact">Asiantuntijakeskustelun pohja</p>
            <h4>Keskeiset riskialueet</h4>
          </div>
        </div>
        <div class="summary-product-grid">
          ${riskCards.map((item) => renderCustomerSummaryRiskCard(item)).join("")}
        </div>
      </section>
    ` : ""}

    ${summaryProductCards ? `
      <section class="customer-summary-section summary-product-section">
        <div class="customer-summary-title">
          <div>
            <p class="eyebrow compact">Suositukset</p>
            <h4>${escapeHtml(mode === "business" ? "Suositellut yritysvakuutukset" : "Suositellut vakuutusalueet")}</h4>
          </div>
          <span>${escapeHtml(`${summaryProductCount} kohtaa · ${refinedCount} tarkennettu`)}</span>
        </div>
        <div class="summary-product-grid">
          ${summaryProductCards}
        </div>
      </section>
    ` : ""}

    <p class="summary-next-note">Voit tarkentaa haluamiasi vakuutuksia, palata suosituksiin tai pyytää yhteydenottoa. Yhteystietoja ei tarvita tämän yhteenvedon tarkasteluun.</p>
  `;
}

function summaryProfileTags(assessment, covers, refinedCount) {
  return [
    { label: profile().label },
    { label: assessment.title },
    { label: `${covers.length} vakuutusaluetta` },
    refinedCount ? { label: `${refinedCount} tarkennettu`, refined: true } : null
  ].filter(Boolean);
}

function renderCustomerSummaryMandatoryCard(item) {
  const card = mandatoryCardMeta(item);
  const badgeLabel = item.badgeLabel || "Lakisääteisesti tarkistettava";
  return `
    <article class="summary-product-card summary-legal-card obligation-${escapeHtml(item.obligationKind || "statutory")}">
      ${renderProductMedia(card.visual, card.title, card.imageUrl, card.imagePosition)}
      <div class="summary-product-body">
        <div class="summary-product-tags">
          <span>${escapeHtml(badgeLabel)}</span>
        </div>
        <h5>${escapeHtml(card.title)}</h5>
        <p>${escapeHtml(card.lead)}</p>
        <small>${escapeHtml(item.text)}</small>
        <a class="summary-card-link" href="${escapeHtml(card.url)}" target="_blank" rel="noopener noreferrer">Lue lisää <span aria-hidden="true">›</span></a>
      </div>
    </article>
  `;
}

function customerSummaryRiskCards(assessment) {
  return (assessment.riskAreas || []).map((item) => {
    const typeKey = (item.relatedCovers || []).find((key) => types()[key]) || "";
    const meta = typeKey ? types()[typeKey] : { title: item.title, desc: item.description };
    const card = typeKey ? productCardMeta(typeKey, meta) : { visual: "liability", imageUrl: "", lead: item.description };
    return { ...item, typeKey, meta, card };
  });
}

function renderCustomerSummaryRiskCard(item) {
  const title = item.typeKey ? item.meta.title : item.title;
  return `
    <article class="summary-product-card">
      ${renderProductMedia(item.card.visual, title, item.card.imageUrl, item.card.imagePosition)}
      <div class="summary-product-body">
        <div class="summary-product-tags">
          <span>Keskusteluun</span>
        </div>
        <h5>${escapeHtml(title)}</h5>
        <p>${escapeHtml(shortenText(item.description || item.card.lead, 150))}</p>
        ${item.typeKey && item.meta.detailFlow ? `
          <button class="summary-card-link as-button" type="button" data-card-refine="${escapeHtml(item.meta.detailFlow)}">Vertaa turvia <span aria-hidden="true">›</span></button>
        ` : ""}
      </div>
    </article>
  `;
}

function baseAnswerTags() {
  return (baseQuestions[mode] || [])
    .map((question) => {
      const answer = getOptionLabel(question, st().baseAnswers[question.id]);
      const other = st().baseAnswers[question.id] === "other" ? st().baseAnswers[`${question.id}Other`] : "";
      return `${answer}${other ? `: ${other}` : ""}`;
    })
    .filter(Boolean);
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
  const card = productCardMeta(item.key, meta);
  const level = assessment.selectedCoverageLevels?.[item.key];
  const detailKey = meta.detailFlow || "";
  const refined = Boolean(detailKey && st().detailResults[detailKey]);
  return `
    <article class="summary-product-card ${refined ? "refined" : ""}">
      ${renderProductMedia(card.visual, meta.title, card.imageUrl, card.imagePosition)}
      <div class="summary-product-body">
        <div class="summary-product-tags">
          <span>${escapeHtml(item.active === false ? "Mahdollinen" : "Suositeltu")}</span>
          ${productScopeTag(item.key) ? `<span>${escapeHtml(productScopeTag(item.key))}</span>` : ""}
          ${refined ? `<span>Vertailtu</span>` : ""}
        </div>
        <h5>${escapeHtml(meta.title)}</h5>
        <p>${escapeHtml(shortenText(card.lead || productSummary(meta), 150))}</p>
        ${level?.chosen ? `
          <div class="summary-coverage-level">
            <span>Asiakkaan valitsema vaihtoehto</span>
            <strong>${escapeHtml(level.selectedTitle)}</strong>
          </div>
        ` : detailKey && refined ? `
          <div class="summary-coverage-level pending">
            <span>Vertailtu – vaihtoehtoa ei ole vielä valittu</span>
          </div>
        ` : detailKey ? `
          <div class="summary-coverage-level pending">
            <span>Turvien vertailua ei ole vielä avattu</span>
          </div>
        ` : ""}
        ${detailKey ? `
          <button class="summary-card-link as-button" type="button" data-card-refine="${escapeHtml(detailKey)}">Vertaa turvia <span aria-hidden="true">›</span></button>
        ` : ""}
      </div>
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

  const selectedContactKeys = recommendedContactKeys();
  if (selectedContactKeys.length) {
    lines.push("");
    lines.push("Asiakkaan valitsemat keskusteluaiheet");
    selectedContactKeys.forEach((key) => {
      const selectedTitle = assessmentSelectedTitle(key);
      lines.push(`- ${types()[key]?.title || key}${selectedTitle ? `: ${selectedTitle}` : ": turvavaihtoehto avoin"}`);
    });
  }

  if (assessment.mandatoryChecks.length) {
    lines.push("");
    lines.push("Pakolliset ja sopimusperusteiset tarkistukset");
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

  const coverageLevels = Object.entries(assessment.selectedCoverageLevels || {}).filter(([, level]) => level.chosen);
  if (coverageLevels.length) {
    lines.push("");
    lines.push("Asiakkaan valitsemat vakuutusvaihtoehdot");
    coverageLevels.forEach(([key, level]) => {
      lines.push(`- ${types()[key]?.title || key}: ${level.selectedTitle}`);
      lines.push(`  - Kartoituksen lähtökohta: ${level.machineTitle}`);
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
    "Mitä tietoja asiantuntija saa kartoituksesta?"
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
    return "Asiantuntija voi jatkaa tästä samasta keskustelusta. Kartoituksesta siirtyisivät asiakastyyppi, vastaukset, suositellut vakuutusalueet ja asiakkaan valitsemat turvavaihtoehdot.";
  }

  if (lowered.includes("hinta") || lowered.includes("laskuri")) {
    return "Tämä kartoitin ei laske hintoja. Tarkka vakuutusturva ja hinta varmistetaan asiantuntijan kanssa.";
  }

  if (lowered.includes("ero") || lowered.includes("turva") || lowered.includes("laaja") || lowered.includes("suppea")) {
    const detail = context.activeDetail ? st().detailResults[context.activeDetail] : null;
    if (detail?.comparison) {
      const recommended = detail.comparison.recommended.map((option) => option.title).join(", ");
      return `Kartoituksen lähtökohta on ${recommended}. Erot kannattaa lukea vertailutaulukosta: siellä näkyy, mitä taso tarkoittaa, kenelle se sopii, mitä se voi kattaa ja mitä rajoituksia pitää tarkistaa.`;
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
  return `Kartoituksesi nykyiset keskeiset aiheet ovat: ${topText}. Voin selittää tämän kartoitustuloksen suosituksia, valittuja turvatasoja ja asiantuntijalle välitettäviä tietoja.`;
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
  document.body.classList.toggle("assessment-active", !$("appShell").classList.contains("hidden"));
  const focusOnly = ["intro", "base", "quick", "results", "detail", "detailResult", "contact", "summary"].includes(next);
  $("appShell")?.classList.toggle("flow-only", focusOnly);
  updateSteps(next);
  renderSummaryList();
  renderChatPanel();
  savedView = next;
  persistAssessment();
}

function updateSteps(viewName) {
  const activeIndex = viewName === "intro" || viewName === "base" || (viewName === "quick" && ["base", "intake"].includes(st().quickPhase)) ? 0
    : viewName === "results" ? 1
      : viewName === "quick" || viewName === "detail" || viewName === "detailResult" ? 2
        : 3;

  const progressSteps = [
    { title: "Kerro tilanteestasi", percent: 25 },
    { title: "Katso vakuutusehdotukset", percent: 50 },
    { title: "Tarkenna haluamasi vakuutukset", percent: 75 },
    { title: "Tarkista yhteenveto", percent: 100 }
  ];
  const current = progressSteps[activeIndex];
  $("flowProgressLabel").textContent = `Vaihe ${activeIndex + 1} / ${progressSteps.length}`;
  $("flowProgressTitle").textContent = current.title;
  $("flowProgressBar").style.width = `${current.percent}%`;

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
  if (next === "base") startQuick("base");
  else {
    document.body.classList.remove("assessment-active");
    $("appShell").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
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
      quickPhase: current.quickPhase,
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

function withoutTrailingPunctuation(value) {
  return String(value || "").trim().replace(/[.!?]+$/u, "");
}

function shortenText(value, maxLength = 160) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${shortened}.`;
}

init();
