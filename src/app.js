import { detailFlows, getAnswerLabels, getOptionLabel, insuranceTypes, profiles, quickQuestions } from "./data.js";
import { buildDetailResult } from "./detailResults.js";
import { calculateScores, recommendedKeys, toArray } from "./scoring.js";
import { track } from "./analytics.js";

const $ = (id) => document.getElementById(id);
const views = ["introView", "questionView", "resultsView", "detailView", "detailResultView", "contactView", "summaryView"];
const steps = ["step1", "step2", "step3", "step4"];

let mode = "personal";
const states = {
  personal: freshState(),
  business: freshState()
};

function freshState() {
  return {
    quickIndex: 0,
    quickAnswers: {},
    recommendation: null,
    selectedContact: {},
    activeDetail: null,
    detailIndex: 0,
    detailAnswers: {},
    detailResults: {},
    contact: {}
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

function init() {
  bindEvents();
  renderShellTexts();
  renderIntro();
  renderLibrary();
  renderSummaryList();
}

function bindEvents() {
  $("modePersonal").addEventListener("click", () => setMode("personal"));
  $("modeBusiness").addEventListener("click", () => setMode("business"));
  $("startAssessment").addEventListener("click", () => openAssessment());
  $("startQuick").addEventListener("click", () => startQuick());
  $("showRecommendations").addEventListener("click", () => openRecommendations());
  $("openContact").addEventListener("click", () => openContact());
  $("questionBack").addEventListener("click", () => questionBack());
  $("questionNext").addEventListener("click", () => questionNext());
  $("restartAssessment").addEventListener("click", () => restartAssessment());
  $("refineTop").addEventListener("click", () => refineTopRecommendation());
  $("contactFromResults").addEventListener("click", () => openContact());
  $("detailBack").addEventListener("click", () => detailBack());
  $("detailNext").addEventListener("click", () => detailNext());
  $("detailAgain").addEventListener("click", () => restartDetail());
  $("backToResults").addEventListener("click", () => openRecommendations());
  $("contactFromDetail").addEventListener("click", () => {
    if (st().activeDetail) st().selectedContact[st().activeDetail] = true;
    openContact();
  });
  $("contactBack").addEventListener("click", () => openRecommendations());
  $("createSummary").addEventListener("click", () => createCrmSummary());
  $("backToContact").addEventListener("click", () => openContact());
  $("copySummary").addEventListener("click", () => copySummary());
}

function setMode(nextMode) {
  mode = nextMode;
  $("modePersonal").classList.toggle("active", mode === "personal");
  $("modeBusiness").classList.toggle("active", mode === "business");
  renderShellTexts();
  renderIntro();
  renderLibrary();
  renderSummaryList();
  showView("intro");
  track("assessment_mode_changed", { mode });
}

function renderShellTexts() {
  const p = profile();
  $("heroTitle").textContent = p.heroTitle;
  $("heroLead").textContent = p.heroLead;
  $("modeLabel").textContent = p.label;
  $("appTitle").textContent = `${p.label}: vakuutuskartoitus`;
  $("libraryIntro").textContent = p.materialsIntro;
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

function startQuick() {
  st().quickIndex = 0;
  renderQuestion();
  showView("quick");
  track("quick_started", { mode });
}

function renderQuestion() {
  const questions = quickQuestions[mode];
  const question = questions[st().quickIndex];
  $("questionTitle").textContent = question.title;
  $("questionDesc").textContent = question.desc;
  $("multiNote").classList.toggle("hidden", !question.multi);
  $("questionProgress").style.width = `${Math.round(((st().quickIndex + 1) / questions.length) * 100)}%`;
  $("questionBack").disabled = st().quickIndex === 0;
  $("questionNext").textContent = st().quickIndex === questions.length - 1 ? "Näytä suositukset" : "Seuraava";
  renderAnswerOptions("answerList", question, st().quickAnswers, (value) => {
    setAnswer(question, st().quickAnswers, value);
    renderQuestion();
  });
}

function setAnswer(question, targetAnswers, value) {
  if (!question.multi) {
    targetAnswers[question.id] = value;
    return;
  }

  const current = toArray(targetAnswers[question.id]);
  let next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  if (value === "none") {
    next = ["none"];
  } else {
    next = next.filter((item) => item !== "none");
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
    button.addEventListener("click", () => onSelect(option.value));
    container.appendChild(button);
  });
}

function questionBack() {
  if (st().quickIndex > 0) {
    st().quickIndex -= 1;
    renderQuestion();
  }
}

function questionNext() {
  const question = quickQuestions[mode][st().quickIndex];
  const answer = st().quickAnswers[question.id];
  if (!toArray(answer).length) return;

  if (st().quickIndex < quickQuestions[mode].length - 1) {
    st().quickIndex += 1;
    renderQuestion();
    return;
  }

  calculateAndRenderRecommendations();
  showView("results");
  track("quick_completed", { mode });
}

function calculateAndRenderRecommendations() {
  st().recommendation = calculateScores(mode, st().quickAnswers);
  primeContactSelection();
  renderRecommendations();
  renderSummaryList();
}

function openRecommendations() {
  if (!st().recommendation) {
    if (Object.keys(st().quickAnswers).length) calculateAndRenderRecommendations();
    else {
      startQuick();
      return;
    }
  } else {
    renderRecommendations();
  }
  showView("results");
}

function renderRecommendations() {
  const recommendation = st().recommendation || calculateScores(mode, st().quickAnswers);
  st().recommendation = recommendation;
  const buckets = [
    {
      key: "primary",
      title: "Ensisijaisesti tarkasteltavat",
      desc: "Näissä vastauksesi muodostivat selkeän tarpeen tai riskin.",
      items: recommendation.primary
    },
    {
      key: "possible",
      title: "Mahdollisesti hyödylliset",
      desc: "Nämä voivat olla hyödyllisiä, mutta vaativat kevyen jatkotarkistuksen.",
      items: recommendation.possible
    },
    {
      key: "notNow",
      title: "Ei juuri nyt tärkeimmät",
      desc: "Nämä eivät nousseet nykytilanteessa vahvasti esiin.",
      items: recommendation.notNow
    }
  ];

  $("recommendationBuckets").innerHTML = buckets.map(renderBucket).join("");
  $("recommendationBuckets").querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.detail));
  });
  $("recommendationBuckets").querySelectorAll("[data-contact]").forEach((button) => {
    const key = button.dataset.contact;
    button.addEventListener("click", () => {
      st().selectedContact[key] = true;
      openContact();
    });
  });
}

function renderBucket(bucket) {
  const visibleItems = bucket.key === "notNow" ? bucket.items.slice(0, 8) : bucket.items;
  return `
    <section class="bucket">
      <div class="bucket-head">
        <div>
          <h4>${escapeHtml(bucket.title)}</h4>
          <p>${escapeHtml(bucket.desc)}</p>
        </div>
        <span class="status-pill ${bucket.key === "primary" ? "primary" : bucket.key === "possible" ? "possible" : ""}">${visibleItems.length}</span>
      </div>
      <div class="recommendation-list">
        ${visibleItems.length ? visibleItems.map((item) => renderRecommendationCard(item, bucket.key)).join("") : `<p class="muted">Ei osumia tähän koriin.</p>`}
      </div>
    </section>
  `;
}

function renderRecommendationCard(item, bucketKey) {
  const meta = types()[item.key];
  const reasons = item.reasons.length ? item.reasons : ["tämä vakuutus ei noussut vastauksissa vahvasti esiin"];
  const canDetail = Boolean(meta.detailFlow && flow(meta.detailFlow));
  const existing = item.existing ? `<span class="status-pill possible">Nykyinen turva: tarkista riittävyys</span>` : "";

  return `
    <article class="rec-card">
      <div class="rec-main">
        <div class="rec-area">${escapeHtml(meta.area)}</div>
        <h4>${escapeHtml(meta.title)}</h4>
        <p class="muted">${escapeHtml(meta.desc)}</p>
        <div class="chip-row">
          <span class="status-pill ${bucketKey === "primary" ? "primary" : bucketKey === "possible" ? "possible" : ""}">${item.score} pistettä</span>
          ${existing}
        </div>
        <div class="reason-list">${reasons.slice(0, 3).map((reason) => `<div class="reason">${escapeHtml(capitalize(reason))}.</div>`).join("")}</div>
        <details class="source-details">
          <summary>Perustuu näihin vastauksiin</summary>
          <p>${escapeHtml(reasons.join("; "))}</p>
        </details>
        ${renderMaterialLinks(meta.materials)}
      </div>
      <div class="rec-actions">
        ${canDetail ? `<button class="btn btn-primary btn-small" type="button" data-detail="${escapeHtml(meta.detailFlow)}">Tarkenna tätä vakuutusta</button>` : ""}
        <button class="btn btn-secondary btn-small" type="button" data-contact="${escapeHtml(item.key)}">Valitse yhteydenottoon</button>
      </div>
    </article>
  `;
}

function refineTopRecommendation() {
  if (!st().recommendation) calculateAndRenderRecommendations();
  const detailKey = st().recommendation.items
    .filter((item) => item.score >= 3)
    .map((item) => types()[item.key]?.detailFlow)
    .find(Boolean);
  openDetail(detailKey || firstDetailFlow());
}

function firstDetailFlow() {
  return Object.values(types()).find((item) => item.detailFlow)?.detailFlow;
}

function openDetail(detailKey) {
  if (!detailKey || !flow(detailKey)) return;
  st().activeDetail = detailKey;
  st().detailIndex = 0;
  st().detailAnswers[detailKey] = st().detailAnswers[detailKey] || {};
  renderDetailQuestion();
  showView("detail");
  track("detail_started", { mode, detailKey });
}

function renderDetailQuestion() {
  const detailKey = st().activeDetail;
  const currentFlow = flow(detailKey);
  const question = currentFlow.questions[st().detailIndex];
  $("detailSource").textContent = currentFlow.sourceNote;
  $("detailTitle").textContent = question.title;
  $("detailDesc").textContent = question.desc;
  $("detailMultiNote").classList.toggle("hidden", !question.multi);
  $("detailProgress").style.width = `${Math.round(((st().detailIndex + 1) / currentFlow.questions.length) * 100)}%`;
  $("detailBack").textContent = st().detailIndex === 0 ? "Takaisin suosituksiin" : "Takaisin";
  $("detailNext").textContent = st().detailIndex === currentFlow.questions.length - 1 ? "Näytä ehdotus" : "Seuraava";
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
  const currentFlow = flow(detailKey);
  const question = currentFlow.questions[st().detailIndex];
  const answers = st().detailAnswers[detailKey];
  if (!toArray(answers[question.id]).length) return;

  if (st().detailIndex < currentFlow.questions.length - 1) {
    st().detailIndex += 1;
    renderDetailQuestion();
    return;
  }

  const result = buildDetailResult(mode, detailKey, answers);
  st().detailResults[detailKey] = result;
  st().selectedContact[detailKey] = true;
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
      <div class="result-grid">
        ${result.rows.map((row) => `<div class="result-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></div>`).join("")}
      </div>
      <div class="reason-list">
        ${result.reasons.map((reason) => `<div class="reason">${escapeHtml(capitalize(reason))}.</div>`).join("")}
      </div>
      ${result.notes.length ? `<div class="notice"><strong>Huomioi jatkossa:</strong><br>${result.notes.map(escapeHtml).join("<br>")}</div>` : ""}
      <div class="notice"><strong>Seuraava tarkistus:</strong><br>${escapeHtml(result.nextStep)}</div>
      ${renderMaterialLinks(meta.materials)}
    </div>
  `;
  renderSummaryList();
}

function primeContactSelection() {
  if (!st().recommendation) return;
  const hasAny = Object.keys(st().selectedContact).some((key) => st().selectedContact[key]);
  if (hasAny) return;
  recommendedKeys(st().recommendation).forEach((key) => {
    st().selectedContact[key] = true;
  });
}

function openContact() {
  if (!st().recommendation && Object.keys(st().quickAnswers).length) calculateAndRenderRecommendations();
  if (!st().recommendation) {
    startQuick();
    return;
  }
  primeContactSelection();
  renderContact();
  showView("contact");
  track("contact_opened", { mode });
}

function renderContact() {
  const keys = Object.keys(types());
  $("contactChoices").innerHTML = keys.map((key) => {
    const meta = types()[key];
    const checked = st().selectedContact[key] ? "checked" : "";
    const detailBadge = st().detailResults[meta.detailFlow] ? "Tarkennettu" : "";
    return `
      <label class="check-card">
        <input type="checkbox" data-contact-choice="${escapeHtml(key)}" ${checked}>
        <span><strong>${escapeHtml(meta.title)}</strong><br><span class="muted small">${escapeHtml(meta.area)}${detailBadge ? ` · ${detailBadge}` : ""}</span></span>
      </label>
    `;
  }).join("");
  $("contactChoices").querySelectorAll("[data-contact-choice]").forEach((input) => {
    input.addEventListener("change", () => {
      st().selectedContact[input.dataset.contactChoice] = input.checked;
    });
  });
  restoreContactFields();
}

function restoreContactFields() {
  const contact = st().contact;
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "freeText"]) {
    if ($(id)) $(id).value = contact[id] || "";
  }
  $("privacyConsent").checked = Boolean(contact.privacyConsent);
}

function readContactFields() {
  const contact = {};
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactTime", "freeText"]) {
    contact[id] = $(id).value.trim();
  }
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
  showView("summary");
  track("crm_summary_created", { mode });
}

function validateContact(contact) {
  if (!contact.contactName) return "Täytä nimi.";
  if (!contact.contactEmail || !contact.contactEmail.includes("@")) return "Täytä toimiva sähköpostiosoite.";
  if (!contact.privacyConsent) return "Hyväksy tietojen käyttö yhteydenottopyynnön käsittelyyn.";
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key]);
  if (!selected.length && !contact.freeText) return "Valitse vähintään yksi vakuutus tai kuvaa tilanne vapaasti.";
  return "";
}

function buildCrmSummary(contact) {
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key]);
  const recommendation = st().recommendation || calculateScores(mode, st().quickAnswers);
  const now = new Date();
  const lines = [];

  lines.push("VAKUUTUSKARTOITUKSEN YHTEENVETO");
  lines.push(`Luotu: ${now.toLocaleString("fi-FI")}`);
  lines.push(`Asiakastyyppi: ${profile().label}`);
  lines.push("");
  lines.push("Yhteystiedot");
  lines.push(`- Nimi: ${contact.contactName}`);
  if (contact.contactOrg) lines.push(`- Yritys/talous: ${contact.contactOrg}`);
  lines.push(`- Sähköposti: ${contact.contactEmail}`);
  if (contact.contactPhone) lines.push(`- Puhelin: ${contact.contactPhone}`);
  lines.push(`- Toivottu yhteydenottotapa: ${contact.contactChannel || "Ei valittu"}`);
  if (contact.contactTime) lines.push(`- Paras aika: ${contact.contactTime}`);
  lines.push("");
  lines.push("Asiakkaan valitsemat keskusteluaiheet");
  if (selected.length) selected.forEach((key) => lines.push(`- ${types()[key].title}`));
  else lines.push("- Ei valittuja vakuutuksia");
  lines.push("");
  lines.push("Lyhyen kartoituksen vastaukset");
  getAnswerLabels(quickQuestions[mode], st().quickAnswers).forEach((item) => {
    lines.push(`- ${item.question}: ${item.answer}`);
  });
  lines.push("");
  lines.push("Suositukset");
  recommendation.items.filter((item) => item.score >= 3).forEach((item) => {
    lines.push(`- ${types()[item.key].title}: ${item.score} p. ${item.reasons.join("; ") || "Ei erillistä perustelua."}${item.existing ? " Nykyinen turva merkitty, tarkista riittävyys." : ""}`);
  });
  lines.push("");
  lines.push("Syventävät tarkennukset");
  const detailEntries = Object.entries(st().detailResults);
  if (detailEntries.length) {
    detailEntries.forEach(([detailKey, result]) => {
      const typeKey = Object.keys(types()).find((key) => types()[key].detailFlow === detailKey);
      lines.push(`${typeKey ? types()[typeKey].title : detailKey}: ${result.title}`);
      result.rows.forEach((row) => lines.push(`  - ${row.label}: ${row.value}`));
      if (result.notes.length) result.notes.forEach((note) => lines.push(`  - Huomio: ${note}`));
      lines.push(`  - Seuraava tarkistus: ${result.nextStep}`);
    });
  } else {
    lines.push("- Syventävää tarkennusta ei tehty.");
  }
  if (contact.freeText) {
    lines.push("");
    lines.push("Vapaateksti");
    lines.push(contact.freeText);
  }

  return lines.join("\n");
}

async function copySummary() {
  const text = $("crmSummary").value;
  try {
    await navigator.clipboard.writeText(text);
    $("copySummary").textContent = "Kopioitu";
    $("copySummary").classList.add("copy-state");
  } catch {
    $("crmSummary").select();
    document.execCommand("copy");
    $("copySummary").textContent = "Kopioitu";
    $("copySummary").classList.add("copy-state");
  }
  setTimeout(() => {
    $("copySummary").textContent = "Kopioi yhteenveto";
    $("copySummary").classList.remove("copy-state");
  }, 1800);
}

function renderSummaryList() {
  if (!$("summaryList")) return;
  const recommendation = st().recommendation;
  const answered = Object.keys(st().quickAnswers).length;
  const detailEntries = Object.entries(st().detailResults);
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key]);
  const parts = [];

  parts.push(`<div class="summary-item"><strong>Asiakastyyppi</strong><span class="muted small">${escapeHtml(profile().label)}</span></div>`);
  parts.push(`<div class="summary-item"><strong>Lyhyt kysely</strong><span class="muted small">${answered ? `${answered}/${quickQuestions[mode].length} vastausta` : "Ei aloitettu"}</span></div>`);

  if (recommendation) {
    const top = recommendation.items.filter((item) => item.score >= 3).slice(0, 5).map((item) => types()[item.key].title).join(", ");
    parts.push(`<div class="summary-item"><strong>Suositukset</strong><span class="muted small">${escapeHtml(top || "Ei vahvoja osumia")}</span></div>`);
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

function renderLibrary() {
  $("pdfLibrary").innerHTML = Object.values(types()).map((item) => `
    <div class="library-item">
      <div class="library-title">${escapeHtml(item.title)}</div>
      <div class="muted small">${escapeHtml(item.desc)}</div>
      ${renderMaterialLinks(item.materials, "library-links")}
    </div>
  `).join("");
}

function renderMaterialLinks(materials = [], className = "pdf-links") {
  if (!materials.length) return "";
  return `<div class="${className}">${materials.map((item) => `<a class="pdf-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a>`).join("")}</div>`;
}

function showView(next) {
  const activeView = {
    intro: "introView",
    quick: "questionView",
    results: "resultsView",
    detail: "detailView",
    detailResult: "detailResultView",
    contact: "contactView",
    summary: "summaryView"
  }[next];

  views.forEach((id) => $(id).classList.toggle("hidden", id !== activeView));
  updateSteps(next);
  renderSummaryList();
}

function updateSteps(viewName) {
  const activeIndex = viewName === "intro" || viewName === "quick" ? 0
    : viewName === "results" ? 1
      : viewName === "detail" || viewName === "detailResult" ? 2
        : 3;

  steps.forEach((id, index) => {
    $(id).classList.toggle("active", index === activeIndex);
    $(id).classList.toggle("done", index < activeIndex);
  });
}

function restartAssessment() {
  states[mode] = freshState();
  renderQuestion();
  showView("quick");
  renderSummaryList();
  track("assessment_restarted", { mode });
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

init();
