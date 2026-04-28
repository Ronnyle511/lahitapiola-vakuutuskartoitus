import { coverageModels, detailFlows, getAnswerLabels, getOptionLabel, insuranceTypes, profiles, quickQuestions } from "./data.js";
import { buildDetailResult } from "./detailResults.js";
import { calculateScores, recommendedKeys, toArray } from "./scoring.js";
import { track } from "./analytics.js";

const $ = (id) => document.getElementById(id);
const views = ["introView", "questionView", "resultsView", "detailView", "detailResultView", "contactView", "summaryView"];
const steps = ["step1", "step2", "step3", "step4"];
const businessMandatoryKeys = new Set(["bizPeople", "bizVehicle", "bizPatient"]);

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
    selectedPrice: {},
    activeDetail: null,
    detailIndex: 0,
    detailAnswers: {},
    detailResults: {},
    selectedCoverage: {},
    priceEstimateInterest: false,
    contact: {},
    chatMessages: []
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
  renderCalculatorPanel();
  renderChatPanel();
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
    const typeKey = st().activeDetail ? typeKeyFromDetail(st().activeDetail) : "";
    if (typeKey) st().selectedContact[typeKey] = true;
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
  renderCalculatorPanel();
  renderChatPanel();
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
  $("resultsTitle").textContent = mode === "business" ? "Yrityksesi vakuutustarpeet" : "Suositellut vakuutuslajit";
  $("resultsIntro").textContent = mode === "business"
    ? "Yrityksen tulokset on jaettu lakisääteisiin tarkistuksiin, toiminnan kannalta kriittisiin tarpeisiin ja tilannekohtaisesti hyödyllisiin vakuutuksiin."
    : "Vakuutukset on jaettu sen mukaan, kuinka vahvasti ne nousivat esiin vastauksistasi.";
  $("recommendationInsights").innerHTML = renderRecommendationInsights(recommendation);

  const buckets = recommendationBuckets(recommendation);
  $("recommendationBuckets").innerHTML = buckets.map(renderBucket).join("");
  $("recommendationBuckets").querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.detail));
  });
  $("recommendationBuckets").querySelectorAll("[data-price]").forEach((button) => {
    button.addEventListener("click", () => selectForPriceEstimate(button.dataset.price));
  });
  $("recommendationBuckets").querySelectorAll("[data-contact]").forEach((button) => {
    const key = button.dataset.contact;
    button.addEventListener("click", () => {
      st().selectedContact[key] = true;
      openContact();
    });
  });
}

function recommendationBuckets(recommendation) {
  if (mode !== "business") {
    return [
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
  }

  const relevant = recommendation.items.filter((item) => item.score >= 3);
  const mandatory = relevant.filter((item) => businessMandatoryKeys.has(item.key));
  const mandatoryKeys = new Set(mandatory.map((item) => item.key));
  const critical = recommendation.primary.filter((item) => !mandatoryKeys.has(item.key));
  const useful = recommendation.possible.filter((item) => !mandatoryKeys.has(item.key));

  return [
    {
      key: "mandatory",
      title: "Lakisääteiset tai pakollisesti tarkistettavat",
      desc: "Nämä voivat liittyä työntekijöihin, ajoneuvoihin, toimialaan tai muuhun velvoittavaan tarkistukseen.",
      items: mandatory
    },
    {
      key: "primary",
      title: "Toiminnan kannalta kriittiset",
      desc: "Näissä vahinko voisi vaikuttaa suoraan toimintaan, kassaan, asiakkaisiin tai jatkuvuuteen.",
      items: critical
    },
    {
      key: "possible",
      title: "Tilannekohtaisesti hyödylliset",
      desc: "Nämä eivät nousseet aivan kärkeen, mutta voivat täydentää yrityksen vakuutuskokonaisuutta.",
      items: useful
    },
    {
      key: "notNow",
      title: "Ei juuri nyt tärkeimmät",
      desc: "Nämä eivät nousseet nykytilanteessa vahvasti esiin.",
      items: recommendation.notNow
    }
  ];
}

function renderRecommendationInsights(recommendation) {
  const relevant = recommendation.items.filter((item) => item.score >= 3);
  if (!relevant.length) {
    return `
      <section class="needs-summary">
        <div>
          <p class="eyebrow compact">Tunnistetut tarpeet</p>
          <h4>Vahvoja osumia ei vielä noussut</h4>
          <p class="muted">Voit silti tarkistaa yksittäisiä vakuutuksia tai pyytää asiantuntijaa arvioimaan tilanteen.</p>
        </div>
      </section>
    `;
  }

  const top = relevant.slice(0, 5);
  const reasonText = [...new Set(top.flatMap((item) => item.reasons.slice(0, 2)))].slice(0, 4);
  const summaryTitle = mode === "business"
    ? "Yrityksesi kriittiset vakuutustarpeet"
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
        ${reasonText.length ? `<div class="need-reasons">${reasonText.map((reason) => `<span>${escapeHtml(capitalize(reason))}</span>`).join("")}</div>` : ""}
      </div>
      <div class="needs-next">
        <strong>Seuraavaksi</strong>
        <span>Tarkenna vain olennaiset vakuutukset, valitse haluamasi turvarakenne ja kokoa hinta-arvion aiheet yhteydenottoon.</span>
      </div>
    </section>
  `;
}

function selectForPriceEstimate(typeKey) {
  if (!typeKey || !types()[typeKey]) return;
  st().selectedContact[typeKey] = true;
  st().selectedPrice[typeKey] = true;
  st().priceEstimateInterest = true;
  renderRecommendations();
  renderCalculatorPanel();
  track("price_estimate_selected", { mode, typeKey });
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
        <span class="status-pill ${bucket.key === "primary" || bucket.key === "mandatory" ? "primary" : bucket.key === "possible" ? "possible" : ""}">${visibleItems.length}</span>
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
  const comparisonLabel = meta.detailFlow && coverageModels[mode]?.[meta.detailFlow]?.label;
  const selectedForPrice = Boolean(st().selectedPrice[item.key]);
  const impact = riskImpactForScore(item.score);
  const mandatory = mode === "business" && businessMandatoryKeys.has(item.key) && item.score >= 3;

  return `
    <article class="rec-card">
      <div class="rec-main">
        <div class="rec-area">${escapeHtml(meta.area)}</div>
        <h4>${escapeHtml(meta.title)}</h4>
        <p class="muted">${escapeHtml(meta.desc)}</p>
        <div class="chip-row">
          <span class="status-pill ${bucketKey === "primary" || bucketKey === "mandatory" ? "primary" : bucketKey === "possible" ? "possible" : ""}">${escapeHtml(impact)}</span>
          ${mandatory ? `<span class="status-pill primary">Pakollinen tarkistus</span>` : ""}
          ${existing}
          ${comparisonLabel ? `<span class="status-pill possible">${escapeHtml(comparisonLabel)}</span>` : ""}
        </div>
        <div class="reason-list">${reasons.slice(0, 3).map((reason) => `<div class="reason">${escapeHtml(capitalize(reason))}.</div>`).join("")}</div>
        <details class="source-details">
          <summary>Perustuu näihin vastauksiin</summary>
          <p>${escapeHtml(reasons.join("; "))}</p>
        </details>
        ${renderRecommendationLearn(meta, item)}
      </div>
      <div class="rec-actions">
        ${canDetail ? `<button class="btn btn-primary btn-small" type="button" data-detail="${escapeHtml(meta.detailFlow)}">Tarkenna tätä vakuutusta</button>` : ""}
        <button class="btn ${selectedForPrice ? "btn-soft" : "btn-secondary"} btn-small" type="button" data-price="${escapeHtml(item.key)}">${selectedForPrice ? "Valittu hinta-arvioon" : "Valitse hinta-arvioon"}</button>
        <button class="btn btn-secondary btn-small" type="button" data-contact="${escapeHtml(item.key)}">Pyydä asiantuntijan arvio</button>
      </div>
    </article>
  `;
}

function renderRecommendationLearn(meta, item) {
  const reasons = item.reasons.length ? item.reasons : ["aihe ei noussut vastauksissa vahvasti esiin"];
  return `
    <details class="learn-panel">
      <summary>Tutustu vakuutukseen</summary>
      <div class="learn-grid">
        <div>
          <strong>Tiiviste</strong>
          <p>${escapeHtml(productSummary(meta))}</p>
        </div>
        <div>
          <strong>Miksi tämä voi olla tärkeä?</strong>
          <p>${escapeHtml(capitalize(reasons[0]))}.</p>
        </div>
        <div>
          <strong>Mitä vakuutus voi yleisesti kattaa?</strong>
          <p>${escapeHtml(productCovers(meta))}</p>
        </div>
        <div>
          <strong>Mitä pitää tarkistaa?</strong>
          <p>${escapeHtml(productLimits(meta))}</p>
        </div>
      </div>
      ${renderMaterialLinks(meta.materials)}
      <p class="legal-note">Tämä on lyhyt yhteenveto. Tarkka sisältö, rajoitukset, omavastuut ja korvattavuus tarkistetaan vakuutusehdoista.</p>
    </details>
  `;
}

function productSummary(meta) {
  return meta.desc || "Vakuutuksen tarkka sisältö varmistetaan tuotemateriaaleista ja asiantuntijan kanssa.";
}

function productCovers(meta) {
  const title = meta.title.toLocaleLowerCase("fi-FI");
  if (title.includes("koti")) return "Kodin irtaimistoa, rakennusta, vastuuta, oikeusturvaa ja valittuja lisäturvia vakuutuksen rakenteen mukaan.";
  if (title.includes("ajoneuvo")) return "Liikenteessä käytettävän ajoneuvon lakisääteistä turvaa ja valittua vapaaehtoista kaskoa.";
  if (title.includes("matka")) return "Matkustajaan, matkatavaroihin, matkan peruuntumiseen, keskeytymiseen ja myöhästymiseen liittyviä tilanteita valintojen mukaan.";
  if (title.includes("terveys") || title.includes("tapaturma")) return "Sairauden tai tapaturman hoitokuluja, urheiluun liittyviä tarkistuksia sekä mahdollisia haitta- ja päivärahaturvia.";
  if (title.includes("henki")) return "Läheisille tai omaan talouteen sovittua kertakorvausta kuoleman tai vakavan sairauden varalle valitun rakenteen mukaan.";
  if (title.includes("lemmikki") || title.includes("koira") || title.includes("kissa")) return "Eläinlääkärikuluja ja valittuja lisäturvia, kuten henki-, käyttöominaisuus- tai vastuuvakuutusta.";
  if (title.includes("omaisuus") || title.includes("esine") || title.includes("kiinteistö")) return "Yrityksen omaisuutta, toimitiloja, koneita, laitteita, varastoa tai kiinteistöjä sovitun rakenteen mukaan.";
  if (title.includes("vastuu")) return "Yrityksen toiminnasta, tuotteista, asiantuntijatyöstä tai hallinnosta aiheutuvia vastuutarkistuksia vakuutuslajin mukaan.";
  if (title.includes("keskeytys")) return "Toiminnan keskeytymisestä aiheutuvia taloudellisia vaikutuksia sovitun keskeytysturvan mukaan.";
  if (title.includes("kyber")) return "Tietoturvapoikkeamiin, järjestelmäkatkoihin ja asiantuntija-apuun liittyviä tilanteita valitun kyberturvan mukaan.";
  return meta.desc || "Vakuutus voi kattaa tuotekohtaisissa ehdoissa määriteltyjä vahinkoja ja kustannuksia.";
}

function productLimits(meta) {
  const title = meta.title.toLocaleLowerCase("fi-FI");
  if (title.includes("ajoneuvo")) return "Oman ajoneuvon vahingot, lisäturvat, bonukset, omavastuut ja ajoneuvokohtaiset rajaukset pitää varmistaa laskurissa.";
  if (title.includes("matka")) return "Matkan kesto, kohdemaa, matkustajat, matkatavarat, peruuntumisen syy ja voimassaolo pitää tarkistaa.";
  if (title.includes("terveys") || title.includes("tapaturma")) return "Terveysselvitys, rajoitusehdot, ikärajat, urheilulajit, omavastuu ja hoitokulujen enimmäismäärät pitää tarkistaa.";
  if (title.includes("henki")) return "Vakuutusmäärä, edunsaaja, terveystiedot, voimassaolo ja mahdolliset rajoitukset pitää varmistaa.";
  if (title.includes("vastuu")) return "Sopimusvastuut, toimialarajaukset, enimmäiskorvaukset ja puhtaat varallisuusvahingot pitää tarkistaa erikseen.";
  if (title.includes("keskeytys")) return "Keskeytyksen syy, vastuuaika, katteen laskenta, omavastuu ja riippuvuudet pitää määrittää tarkasti.";
  return "Lopullinen sisältö, rajoitukset, omavastuut, vakuutusmäärät ja soveltuvuus pitää varmistaa tuotemateriaaleista, laskurista tai asiantuntijalta.";
}

function riskImpactForScore(score) {
  if (score >= 10) return "Vaikutus: merkittävä";
  if (score >= 7) return "Vaikutus: korkea";
  if (score >= 3) return "Vaikutus: keskitaso";
  return "Vaikutus: matala";
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
  st().selectedCoverage[detailKey] = result.comparison?.recommendedKeys?.[0] || result.comparison?.options?.[0]?.key || "";
  const typeKey = typeKeyFromDetail(detailKey);
  if (typeKey) st().selectedContact[typeKey] = true;
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
      ${renderCoverageComparison(result.comparison, detailKey)}
      ${renderProductMaterials(meta)}
      <p class="legal-note">Kartoitus ei ole lopullinen tarjous tai vakuutuspäätös. Lopullinen sisältö, hinta ja soveltuvuus varmistetaan LähiTapiolan laskurissa tai asiantuntijan kanssa.</p>
    </div>
  `;
  bindCalculatorActions($("detailResult"));
  renderCalculatorPanel();
  renderSummaryList();
}

function renderCoverageComparison(comparison, detailKey = "") {
  if (!comparison) return "";
  const recommendedLabels = comparison.recommended.map((option) => option.title).join(", ");
  const alternatives = comparison.alternatives.map((option) => option.title).join(", ");
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
    ["Sopivuus vastausten perusteella", (option) => option.key === selectedKey ? "Valitsemasi vaihtoehto" : comparison.recommendedKeys.includes(option.key) ? "Koneen ehdotus" : "Vertailtava vaihtoehto"],
    ["Hinta-arvio", (option) => option.priceNote]
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
        <strong>Sopivin vaihtoehto vastaustesi perusteella: ${escapeHtml(recommendedLabels)}</strong>
        <span>${escapeHtml(comparison.basis)}</span>
        ${alternatives ? `<span>Voit vertailla myös: ${escapeHtml(alternatives)}.</span>` : ""}
        <span>Voit valita alta itse sen vaihtoehdon, jonka haluat ottaa hinta-arvion pohjaksi.</span>
      </div>
      <div class="selected-fit">
        <strong>Valitsemasi vaihtoehto: ${escapeHtml(selectedLabel)}</strong>
        <span>${selectionMatchesRecommendation ? "Valinta vastaa koneen ehdotusta." : "Valitsit eri vaihtoehdon kuin koneen ensisijainen ehdotus. Tämä huomioidaan hinta-arviossa ja yhteydenoton yhteenvedossa."}</span>
      </div>
      <div class="calculator-summary-card">
        <h5>Yhteenveto</h5>
        <div class="calculator-product">
          <strong>${escapeHtml(selectedLabel)}</strong>
          <span>${escapeHtml(comparison.title)}</span>
        </div>
        <div class="calculator-highlight">
          <span>Hinta-arvio muodostetaan LähiTapiolan laskurissa</span>
          <strong>Ei vielä lopullinen tarjous</strong>
        </div>
        <div class="calculator-total">
          <span>Arvioitava kokonaisuus</span>
          <strong>${escapeHtml(selectedLabel)}</strong>
        </div>
        <div class="calculator-actions">
          <button class="btn btn-primary" type="button" data-calculator-contact="${escapeHtml(detailKey)}">Pyydä tarkempi hinta-arvio</button>
          <button class="btn btn-secondary" type="button" data-calculator-more>Lisää toinen vakuutus</button>
        </div>
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
                    <span class="${option.key === selectedKey ? "selected-badge" : "choose-badge"}">${option.key === selectedKey ? "Valittu hinta-arvioon" : "Valitse tämä"}</span>
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
      <div class="calculator-slot">
        <strong>Seuraava vaihe</strong>
        <span>${escapeHtml(comparison.calculatorAction)}</span>
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
        ${option.key === selectedKey ? `<em>Valittu hinta-arvioon</em>` : ""}
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
    button.addEventListener("click", () => startQuick());
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
  openContact();
}

function removePriceEstimate(typeKey = "") {
  if (!typeKey || !types()[typeKey]) return;
  st().selectedPrice[typeKey] = false;
  st().priceEstimateInterest = Object.keys(st().selectedPrice).some((key) => st().selectedPrice[key]);
  renderRecommendations();
  renderCalculatorPanel();
  renderSummaryList();
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
  renderDetailResult(detailKey, result);
  track("coverage_option_selected", { mode, detailKey, coverageKey });
}

function renderProductMaterials(meta = {}) {
  const materials = meta.materials || [];
  if (!materials.length) return "";
  return `
    <section class="materials-panel" aria-label="Tutustu vakuutukseen">
      <details open>
        <summary>
          <span>Tutustu vakuutukseen</span>
          <small>Tiivistelmä ja PDF-materiaalit ennen lopullista valintaa</small>
        </summary>
        <div class="learn-grid detail-learn">
          <div>
            <strong>Tiiviste</strong>
            <p>${escapeHtml(productSummary(meta))}</p>
          </div>
          <div>
            <strong>Mitä tämä voi yleisesti kattaa?</strong>
            <p>${escapeHtml(productCovers(meta))}</p>
          </div>
          <div>
            <strong>Mitä pitää tarkistaa?</strong>
            <p>${escapeHtml(productLimits(meta))}</p>
          </div>
        </div>
        ${renderMaterialLinks(materials)}
        <p class="legal-note">Tämä on lyhyt yhteenveto. Tarkka sisältö, rajoitukset, omavastuut ja korvattavuus tarkistetaan vakuutusehdoista.</p>
      </details>
    </section>
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
  $("contactOrgField")?.classList.toggle("hidden", mode !== "business");
  if (mode !== "business" && $("contactOrg")) $("contactOrg").value = "";
  $("contactChoices").innerHTML = keys.map((key) => {
    const meta = types()[key];
    const checked = st().selectedContact[key] ? "checked" : "";
    const detailBadge = st().detailResults[meta.detailFlow] ? "Tarkennettu" : "";
    const priceBadge = st().selectedPrice[key] ? "Hinta-arvio" : "";
    const badges = [meta.area, detailBadge, priceBadge].filter(Boolean).join(" · ");
    return `
      <label class="check-card">
        <input type="checkbox" data-contact-choice="${escapeHtml(key)}" ${checked}>
        <span><strong>${escapeHtml(meta.title)}</strong><br><span class="muted small">${escapeHtml(badges)}</span></span>
      </label>
    `;
  }).join("");
  $("contactChoices").querySelectorAll("[data-contact-choice]").forEach((input) => {
    input.addEventListener("change", () => {
      st().selectedContact[input.dataset.contactChoice] = input.checked;
      if (!input.checked) st().selectedPrice[input.dataset.contactChoice] = false;
      st().priceEstimateInterest = Object.keys(st().selectedPrice).some((key) => st().selectedPrice[key]);
      renderCalculatorPanel();
    });
  });
  restoreContactFields();
  if (mode !== "business" && $("contactOrg")) $("contactOrg").value = "";
}

function restoreContactFields() {
  const contact = st().contact;
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactNextStep", "freeText"]) {
    if ($(id) && Object.prototype.hasOwnProperty.call(contact, id)) $(id).value = contact[id] || "";
  }
  $("privacyConsent").checked = Boolean(contact.privacyConsent);
}

function readContactFields() {
  const contact = {};
  for (const id of ["contactName", "contactOrg", "contactEmail", "contactPhone", "contactChannel", "contactNextStep", "freeText"]) {
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
  if (contact.contactOrg) lines.push(`- Yritys: ${contact.contactOrg}`);
  lines.push(`- Sähköposti: ${contact.contactEmail}`);
  if (contact.contactPhone) lines.push(`- Puhelin: ${contact.contactPhone}`);
  lines.push(`- Toivottu yhteydenottotapa: ${contact.contactChannel || "Ei valittu"}`);
  lines.push(`- Asiakkaan seuraava toive: ${contact.contactNextStep || "Ei valittu"}`);
  lines.push("");
  lines.push("Asiakkaan valitsemat aiheet hinta-arvioon tai yhteydenottoon");
  if (selected.length) selected.forEach((key) => lines.push(`- ${types()[key].title}`));
  else lines.push("- Ei valittuja vakuutuksia");
  lines.push("");
  lines.push("Lyhyen kartoituksen vastaukset");
  getAnswerLabels(quickQuestions[mode], st().quickAnswers).forEach((item) => {
    lines.push(`- ${item.question}: ${item.answer}`);
  });
  lines.push("");
  lines.push(mode === "business" ? "Yrityksen tärkeimmät tunnistetut tarpeet" : "Tärkeimmät tunnistetut tarpeet");
  recommendation.items.filter((item) => item.score >= 3).slice(0, 8).forEach((item) => {
    lines.push(`- ${types()[item.key].title}: ${riskImpactForScore(item.score)}. ${item.reasons.join("; ") || "Ei erillistä perustelua."}${item.existing ? " Nykyinen turva merkitty, tarkista riittävyys." : ""}`);
  });
  lines.push("");
  lines.push("Syventävät tarkennukset");
  const detailEntries = Object.entries(st().detailResults);
  if (detailEntries.length) {
    detailEntries.forEach(([detailKey, result]) => {
      const typeKey = Object.keys(types()).find((key) => types()[key].detailFlow === detailKey);
      lines.push(`${typeKey ? types()[typeKey].title : detailKey}: ${result.title}`);
      result.rows.forEach((row) => lines.push(`  - ${row.label}: ${row.value}`));
      if (result.comparison) {
        const selectedOption = selectedCoverageOption(detailKey, result.comparison);
        const recommendedTitles = result.comparison.recommended.map((option) => option.title).join(", ");
        lines.push(`  - Koneen ehdottama turvataso/rakenne: ${recommendedTitles}`);
        lines.push(`  - Asiakkaan valitsema turvataso/rakenne: ${selectedOption?.title || recommendedTitles}`);
        lines.push(`  - Tarkastellut vaihtoehdot: ${result.comparison.options.map((option) => option.title).join(", ")}`);
        lines.push(`  - Perustelu: ${result.comparison.basis}`);
        lines.push("  - Hinta-arvio: edellyttää laskuri-integraatiota tai asiantuntijan arviota.");
      }
      if (result.notes.length) result.notes.forEach((note) => lines.push(`  - Huomio: ${note}`));
      lines.push(`  - Seuraava tarkistus: ${result.nextStep}`);
    });
  } else {
    lines.push("- Syventävää tarkennusta ei tehty.");
  }
  if (st().priceEstimateInterest) {
    lines.push("");
    lines.push("Hinta-arvio");
    lines.push("- Asiakas kiinnostunut hinta-arviosta.");
    selectedPriceItems().forEach((item) => lines.push(`- Hinta-arvioon valittu: ${item.title} / ${item.detail}`));
    lines.push(`- Asiakkaan ilmoittama jatkotoive: ${contact.contactNextStep || "Ei valittu"}.`);
    lines.push("- Hinta-arvio edellyttää laskuri-integraatiota tai asiantuntijan arviota.");
  }
  if (st().chatMessages.length) {
    lines.push("");
    lines.push("Chat-avustajan käyttö");
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

function renderCalculatorPanel() {
  const panel = $("calculatorPanel");
  if (!panel) return;

  const context = calculatorContext();
  const priceItems = selectedPriceItems();
  if (!context.title && !priceItems.length) {
    panel.innerHTML = `
      <p class="eyebrow compact">Hinta-arvion laskuri</p>
      <h3>Yhteenveto</h3>
      <p class="muted small">Kun vastaat kartoitukseen, tähän muodostuu vakuutuskohtainen hinta-arvion esinäkymä.</p>
      <button class="btn btn-primary full-width" type="button" data-calculator-start>Aloita kartoitus</button>
      <ul class="calculator-benefits">
        <li>Selkeä turvan laajuus ennen hinta-arviota</li>
        <li>Valitut vakuutukset mukaan yhteydenottoon</li>
        <li>CRM-yhteenveto asiantuntijalle</li>
      </ul>
    `;
    bindCalculatorActions(panel);
    return;
  }

  panel.innerHTML = `
    <p class="eyebrow compact">Hinta-arvion laskuri</p>
    <h3>Yhteenveto</h3>
    ${context.title ? `
      <div class="calculator-side-card">
        <div class="calculator-product">
          <strong>${escapeHtml(context.title)}</strong>
          <span>${escapeHtml(context.subtitle)}</span>
        </div>
        <div class="calculator-highlight">
          <span>Hinta-arvio muodostetaan LähiTapiolan laskurissa</span>
          <strong>${escapeHtml(context.recommended)}</strong>
        </div>
        <div class="calculator-total">
          <span>Seuraava vaihe</span>
          <strong>${escapeHtml(context.nextStep)}</strong>
        </div>
        <div class="calculator-actions stacked">
          <button class="btn btn-primary" type="button" data-calculator-contact="${escapeHtml(context.detailKey)}">Pyydä tarkempi hinta-arvio</button>
          <button class="btn btn-secondary" type="button" data-calculator-more>Lisää toinen vakuutus</button>
        </div>
      </div>
    ` : ""}
    ${priceItems.length ? `
      <div class="calculator-basket">
        <strong>Valittu hinta-arvioon</strong>
        ${priceItems.map((item) => `
          <div class="basket-line">
            <span>${escapeHtml(item.title)}</span>
            <small>${escapeHtml(item.detail)}</small>
            <button class="link-button" type="button" data-remove-price="${escapeHtml(item.key)}">Poista hinta-arviosta</button>
          </div>
        `).join("")}
        <div class="calculator-slot compact">
          <strong>Laskuri-demo</strong>
          <span>Valitut aiheet siirtyisivät LähiTapiolan varsinaiseen laskuriin hinta-arvion muodostamista varten.</span>
        </div>
      </div>
    ` : ""}
    <ul class="calculator-benefits">
      <li>Suositus perustuu antamiisi vastauksiin</li>
      <li>Lopullinen hinta ja soveltuvuus varmistetaan laskurissa tai asiantuntijan kanssa</li>
    </ul>
  `;
  bindCalculatorActions(panel);
}

function renderChatPanel() {
  const panel = $("chatPanel");
  if (!panel) return;

  const context = chatContext();
  const messages = st().chatMessages;
  const chatOpen = messages.length ? "open" : "";
  panel.innerHTML = `
    <p class="eyebrow compact">Kysymysapu</p>
    <h3>Chat-avustaja</h3>
    <p class="muted small">Demo: avustaja käyttää kartoituksen vastauksia taustana, mutta ei anna lopullista vakuutuspäätöstä, korvauslupausta tai hintaa.</p>
    <details class="chat-drawer" ${chatOpen}>
      <summary>Kysy suosituksista</summary>
    <div class="chat-suggestions">
      ${context.suggestions.map((item) => `<button class="btn btn-secondary btn-small" type="button" data-chat-prompt="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}
    </div>
    <div class="chat-thread" aria-live="polite">
      ${messages.length ? messages.map((message) => `
        <div class="chat-message ${message.role === "user" ? "user" : "assistant"}">
          <strong>${message.role === "user" ? "Sinä" : "Avustaja"}</strong>
          <span>${escapeHtml(message.text)}</span>
        </div>
      `).join("") : `<div class="chat-empty">Kysy esimerkiksi, miksi jokin vakuutus nousi esiin tai mitä turvatasojen ero tarkoittaa.</div>`}
    </div>
    <div class="chat-input-row">
      <input id="chatInput" type="text" placeholder="Kirjoita kysymys vakuutuksista">
      <button class="btn btn-primary btn-small" type="button" data-chat-send>Lähetä</button>
    </div>
    </details>
    <p class="legal-note">Varsinaisessa toteutuksessa LähiTapiolan chatille välitettäisiin vain kartoituksen taustatiedot ja suostumuksella tarvittavat yhteystiedot.</p>
  `;
  bindChatActions(panel);
}

function bindChatActions(panel) {
  panel.querySelectorAll("[data-chat-prompt]").forEach((button) => {
    button.addEventListener("click", () => addChatQuestion(button.dataset.chatPrompt || button.textContent || ""));
  });
  panel.querySelector("[data-chat-send]")?.addEventListener("click", () => {
    const input = $("chatInput");
    addChatQuestion(input?.value || "");
  });
  panel.querySelector("#chatInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addChatQuestion(event.currentTarget.value || "");
    }
  });
}

function addChatQuestion(text) {
  const question = String(text || "").trim();
  if (!question) return;
  st().chatMessages.push({ role: "user", text: question });
  st().chatMessages.push({ role: "assistant", text: buildChatAnswer(question) });
  renderChatPanel();
  track("chat_question_added", { mode });
}

function chatContext() {
  const recommendation = st().recommendation;
  const topItems = recommendation?.items.filter((item) => item.score >= 3).slice(0, 3) || [];
  const activeDetail = st().activeDetail && st().detailResults[st().activeDetail] ? st().activeDetail : "";
  const activeType = activeDetail ? typeKeyFromDetail(activeDetail) : "";
  const topTitle = topItems[0] ? types()[topItems[0].key].title : "";
  const suggestions = [
    topTitle ? `Miksi minulle suositellaan: ${topTitle}?` : "Miten tämä kartoitus auttaa minua?",
    activeType ? "Mitä eroa näillä turvavaihtoehdoilla on?" : "Mitä minun kannattaa tehdä seuraavaksi?",
    "Miten hinta-arvio muodostuisi?"
  ];
  return { topItems, activeDetail, activeType, suggestions };
}

function buildChatAnswer(question) {
  const context = chatContext();
  const lowered = question.toLocaleLowerCase("fi-FI");
  const answered = getAnswerLabels(quickQuestions[mode], st().quickAnswers);
  const topItems = context.topItems;

  if (!answered.length) {
    return "Aloita vastaamalla lyhyeen kyllä/ei-kyselyyn. Sen jälkeen voin selittää, miksi tietyt vakuutukset nousivat esiin ja mitä niissä kannattaa tarkistaa.";
  }

  if (lowered.includes("hinta") || lowered.includes("laskuri")) {
    return "Tässä demossa ei lasketa oikeaa hintaa. Valitut vakuutukset ja turvatasot kootaan hinta-arvion koriin, josta ne siirtyisivät LähiTapiolan varsinaiseen laskuriin tai asiantuntijan arvioon.";
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
    if (!topItems.length) return "Vastaustesi perusteella mikään vakuutus ei noussut vielä vahvasti esiin. Voit silti valita aiheen tarkempaan tarkasteluun tai pyytää asiantuntijan arviota.";
    const lines = topItems.map((item) => `${types()[item.key].title}: ${item.reasons.slice(0, 2).join("; ") || types()[item.key].desc}`);
    return `Vastaustesi perusteella tärkeimmät tarkistettavat aiheet ovat ${topItems.map((item) => types()[item.key].title).join(", ")}. Perustelut: ${lines.join(" | ")}.`;
  }

  const topText = topItems.length ? topItems.map((item) => types()[item.key].title).join(", ") : "ei vielä vahvoja osumia";
  return `Vastaustesi perusteella keskeiset aiheet ovat: ${topText}. Voit avata vakuutuskortista tiivistelmän ja PDF-materiaalit, tarkentaa vakuutusta tai lisätä sen hinta-arvion koriin.`;
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
      subtitle: result.title,
      recommended,
      nextStep: "Hinta-arvio",
      detailKey,
      typeKey
    };
  }

  const recommendation = st().recommendation;
  if (recommendation) {
    const item = recommendation.primary[0] || recommendation.possible[0] || recommendation.items[0];
    if (!item) return {};
    const meta = types()[item.key];
    const comparisonLabel = meta.detailFlow && coverageModels[mode]?.[meta.detailFlow]?.label;
    return {
      title: meta.title,
      subtitle: item.reasons.slice(0, 2).join("; ") || meta.desc,
      recommended: comparisonLabel || "Tarkenna vakuutus ennen lopullista hinta-arviota",
      nextStep: meta.detailFlow ? "Tarkennus tai hinta-arvio" : "Asiantuntijan hinta-arvio",
      detailKey: meta.detailFlow || "",
      typeKey: item.key
    };
  }

  return {};
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
  renderCalculatorPanel();
  renderChatPanel();
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
