import { baseQuestions, coverageModels, detailFlows, getAnswerLabels, getOptionLabel, insuranceTypes, profiles, quickQuestions } from "./data.js";
import { buildDetailResult } from "./detailResults.js";
import { calculateScores, recommendedKeys, toArray } from "./scoring.js";
import { track } from "./analytics.js";

const $ = (id) => document.getElementById(id);
const views = ["introView", "baseInfoView", "questionView", "resultsView", "detailView", "detailResultView", "contactView", "summaryView"];
const steps = ["step1", "step2", "step3", "step4"];
const recommendationAreaOrder = {
  personal: ["home", "vehicle", "travel", "health", "pet", "apartment", "liability"],
  business: ["bizProperty", "bizLiability", "bizPeople", "bizVehicle", "bizCyber", "bizInterruption"]
};

let mode = "personal";
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
  $("startQuick").addEventListener("click", () => startBaseInfo());
  $("showRecommendations").addEventListener("click", () => openRecommendations());
  $("openContact").addEventListener("click", () => openContact());
  $("clearAllTop").addEventListener("click", () => resetAssessment("intro"));
  $("baseBack").addEventListener("click", () => showView("intro"));
  $("baseNext").addEventListener("click", () => baseNext());
  $("questionBack").addEventListener("click", () => questionBack());
  $("questionNext").addEventListener("click", () => questionNext());
  $("restartAssessment").addEventListener("click", () => resetAssessment("base"));
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
      });
    }
    if (other) {
      other.addEventListener("input", () => {
        st().baseAnswers[`${question.id}Other`] = other.value.trim();
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
  startQuick();
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
  $("questionCount").textContent = `Lyhyt kartoitus ${st().quickIndex + 1}/${questions.length}`;
  $("questionTitle").textContent = question.title;
  $("questionDesc").textContent = question.desc;
  $("multiNote").classList.toggle("hidden", !question.multi);
  $("questionProgress").style.width = `${Math.round(((st().quickIndex + 1) / questions.length) * 100)}%`;
  $("questionBack").disabled = false;
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
    return;
  }
  renderBaseInfo();
  showView("base");
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
  st().recommendation = calculateScores(mode, st().quickAnswers, st().baseAnswers);
  primeContactSelection();
  renderRecommendations();
  renderSummaryList();
}

function openRecommendations() {
  if (!st().recommendation) {
    if (Object.keys(st().quickAnswers).length) calculateAndRenderRecommendations();
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
  $("resultsTitle").textContent = st().recommendationRefined ? "Tarkennetut suositukset" : "Alustavat suositukset";
  $("resultsIntro").textContent = "Aloita tärkeimmistä kohteista. Voit tutustua vakuutukseen tai tarkentaa sen laajuuden.";
  $("recommendationInsights").innerHTML = "";

  const buckets = recommendationBuckets(recommendation);
  $("recommendationBuckets").innerHTML = `${buckets.map(renderBucket).join("")}${renderRefinePrompt(recommendation)}`;
  $("recommendationBuckets").querySelector("[data-refine-recommendations]")?.addEventListener("click", () => refineTopRecommendation());
  $("recommendationBuckets").querySelector("[data-contact-next]")?.addEventListener("click", () => openContact());
  $("recommendationBuckets").querySelectorAll("[data-card-refine]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.cardRefine || ""));
  });
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

function renderRefinePrompt(recommendation) {
  const hasDetail = recommendation.items
    .filter((item) => recommendationAreaOrder[mode].includes(item.key) && item.score >= 3)
    .some((item) => types()[item.key]?.detailFlow && flow(types()[item.key].detailFlow));
  if (!hasDetail || st().recommendationRefined) return "";

  return `
    <section class="refine-card">
      <div>
        <p class="eyebrow compact">Vapaaehtoinen vaihe</p>
        <h4>Haluatko tarkentaa suosituksia?</h4>
        <p>Vastaa muutamaan lisäkysymykseen vain niistä vakuutusalueista, jotka nousivat jo alustavissa suosituksissa.</p>
      </div>
      <div class="refine-actions">
        <button class="btn btn-primary" type="button" data-refine-recommendations>Tarkenna suosituksia</button>
        <button class="btn btn-secondary" type="button" data-contact-next>Jatka hinta-arvioon / yhteydenottoon</button>
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
  const canRefine = Boolean(meta.detailFlow && flow(meta.detailFlow));
  const detailKey = meta.detailFlow || "";
  const detailResult = detailKey ? st().detailResults[detailKey] : null;
  const selectedOption = detailResult?.comparison ? selectedCoverageOption(detailKey, detailResult.comparison) : null;

  return `
    <article class="rec-card target-card ${bucketKey === "primary" ? "priority" : bucketKey === "possible" ? "supporting" : ""} ${detailResult ? "refined" : ""} compact">
      <div class="rec-main">
        <div class="target-card-head">
          <div>
            <div class="rec-area">${bucketKey === "primary" ? "Suositeltu kohde" : "Mahdollinen kohde"}</div>
            <h4>${escapeHtml(meta.title)}</h4>
            <p class="muted rec-desc">${escapeHtml(meta.area)}</p>
          </div>
          <span class="status-pill ${detailResult ? "done" : bucketKey === "primary" ? "primary" : bucketKey === "possible" ? "possible" : ""}">${escapeHtml(detailResult ? "Tarkennettu" : strength)}</span>
        </div>
        ${detailResult ? `
          <div class="refined-summary">
            <strong>Valittu hinta-arvion pohjaksi</strong>
            <span>${escapeHtml(selectedOption?.title || detailResult.title)}</span>
          </div>
        ` : ""}
        <div class="reason-list concise">
          <strong>Miksi tämä nousi?</strong>
          <div class="reason">${escapeHtml(capitalize(reasons[0]))}.</div>
        </div>
        ${existing ? `<div class="chip-row target-meta-row">${existing}</div>` : ""}
        ${canRefine ? `
          <div class="card-refine-cta">
            <button class="btn btn-primary btn-small" type="button" data-card-refine="${escapeHtml(meta.detailFlow)}">${detailResult ? "Muokkaa valintaa" : "Tarkenna laajuus"}</button>
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
      <summary>Tutustu vakuutukseen</summary>
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
  if (title.includes("ajoneuvo")) return "Oman ajoneuvon vahingot, lisäturvat, bonukset, omavastuut ja ajoneuvokohtaiset rajaukset pitää varmistaa laskurissa.";
  if (title.includes("matka")) return "Matkan kesto, kohdemaa, matkustajat, matkatavarat, peruuntumisen syy ja voimassaolo pitää tarkistaa.";
  if (title.includes("terveys") || title.includes("tapaturma")) return "Terveysselvitys, rajoitusehdot, ikärajat, urheilulajit, omavastuu ja hoitokulujen enimmäismäärät pitää tarkistaa.";
  if (title.includes("henki")) return "Vakuutusmäärä, edunsaaja, terveystiedot, voimassaolo ja mahdolliset rajoitukset pitää varmistaa.";
  if (title.includes("vastuu")) return "Sopimusvastuut, toimialarajaukset, enimmäiskorvaukset ja puhtaat varallisuusvahingot pitää tarkistaa erikseen.";
  if (title.includes("keskeytys")) return "Keskeytyksen syy, vastuuaika, katteen laskenta, omavastuu ja riippuvuudet pitää määrittää tarkasti.";
  return "Lopullinen sisältö, rajoitukset, omavastuut, vakuutusmäärät ja soveltuvuus pitää varmistaa tuotemateriaaleista, laskurista tai asiantuntijalta.";
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
  if (!st().recommendation) calculateAndRenderRecommendations();
  const detailKey = st().recommendation.items
    .filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key))
    .map((item) => types()[item.key]?.detailFlow)
    .find((key) => key && flow(key) && !st().detailResults[key]);
  openDetail(detailKey || firstDetailFlow());
}

function firstDetailFlow() {
  return recommendationAreaOrder[mode].map((key) => types()[key]).find((item) => item?.detailFlow && flow(item.detailFlow))?.detailFlow;
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
  $("detailCount").textContent = `Tarkentava kartoitus ${st().detailIndex + 1}/${currentFlow.questions.length}`;
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
  st().recommendationRefined = true;
  st().selectedCoverage[detailKey] = result.comparison?.recommendedKeys?.[0] || result.comparison?.options?.[0]?.key || "";
  const typeKey = typeKeyFromDetail(detailKey);
  if (typeKey) {
    st().selectedContact[typeKey] = true;
    st().selectedPrice[typeKey] = true;
    st().priceEstimateInterest = true;
  }
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
          <p>Voit palata suosituksiin muokkaamaan yksittäistä kohdetta tai jatkaa hinta-arvioon ja yhteydenottoon.</p>
        </div>
        <button class="btn btn-primary" type="button" data-calculator-contact="${escapeHtml(currentDetailKey)}">Jatka hinta-arvioon</button>
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
  const recommendation = st().recommendation;
  if (!recommendation) return null;
  return recommendation.items
    .filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key))
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
        <strong>Suositus: ${escapeHtml(recommendedLabels)}</strong>
        <span>${escapeHtml(shortenText(comparison.basis, 170))}</span>
      </div>
      <div class="selected-fit">
        <strong>Valitsemasi vaihtoehto: ${escapeHtml(selectedLabel)}</strong>
        <span>${selectionMatchesRecommendation ? "Valinta vastaa suositusta." : "Valintasi huomioidaan hinta-arviossa ja yhteydenotossa."}</span>
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
    button.addEventListener("click", () => startBaseInfo());
  });
  root.querySelectorAll("[data-open-contact]").forEach((button) => {
    button.addEventListener("click", () => openContact());
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
  const typeKey = typeKeyFromDetail(detailKey);
  if (typeKey) {
    st().selectedContact[typeKey] = true;
    st().selectedPrice[typeKey] = true;
    st().priceEstimateInterest = true;
  }
  renderDetailResult(detailKey, result);
  renderCalculatorPanel();
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
  if (!st().recommendation) return [];
  const keys = st().recommendation.items
    .filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key))
    .map((item) => item.key);
  return keys.length ? keys : recommendationAreaOrder[mode].filter((key) => types()[key]);
}

function recommendedContactKeys() {
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key] && types()[key]);
  return selected.filter((key) => recommendationAreaOrder[mode].includes(key));
}

function openContact() {
  if (!st().recommendation && Object.keys(st().quickAnswers).length) calculateAndRenderRecommendations();
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
    const priceBadge = st().selectedPrice[key] ? "Hinta-arvio" : "";
    const badges = [meta.area, detailBadge, priceBadge].filter(Boolean).join(" · ");
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
        <p class="muted small">Tässä demossa hinta muodostuisi LähiTapiolan varsinaisessa laskurissa tai asiantuntijan jatkokäsittelyssä.</p>
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
  showView("summary");
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
  const selected = recommendedContactKeys();
  const recommendation = st().recommendation || calculateScores(mode, st().quickAnswers, st().baseAnswers);
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
  lines.push(`- Paras aika ottaa yhteyttä: ${contact.contactTime || "Ei valittu"}`);
  lines.push("");
  lines.push("Asiakkaan mukana kulkevat vakuutusalueet");
  if (selected.length) selected.forEach((key) => lines.push(`- ${types()[key].title}`));
  else lines.push("- Ei valittuja vakuutusalueita");
  lines.push("");
  lines.push("Perustiedot");
  (baseQuestions[mode] || []).forEach((question) => {
    const answer = getOptionLabel(question, st().baseAnswers[question.id]);
    const other = st().baseAnswers[question.id] === "other" ? st().baseAnswers[`${question.id}Other`] : "";
    lines.push(`- ${question.title}: ${answer}${other ? ` (${other})` : ""}`);
  });
  lines.push("");
  lines.push("Lyhyen kartoituksen vastaukset");
  getAnswerLabels(quickQuestions[mode], st().quickAnswers).forEach((item) => {
    lines.push(`- ${item.question}: ${item.answer}`);
  });
  lines.push("");
  lines.push(mode === "business" ? "Yrityksen tärkeimmät tunnistetut tarpeet" : "Tärkeimmät tunnistetut tarpeet");
  recommendation.items.filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key)).slice(0, 8).forEach((item) => {
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
    lines.push("- Hinta-arvio edellyttää laskuri-integraatiota tai asiantuntijan arviota.");
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

function renderSummaryList() {
  if (!$("summaryList")) return;
  const recommendation = st().recommendation;
  const answered = Object.keys(st().quickAnswers).length;
  const detailEntries = Object.entries(st().detailResults);
  const selected = Object.keys(st().selectedContact).filter((key) => st().selectedContact[key]);
  const parts = [];

  parts.push(`<div class="summary-item"><strong>Asiakastyyppi</strong><span class="muted small">${escapeHtml(profile().label)}</span></div>`);
  parts.push(`<div class="summary-item"><strong>Lyhyt kartoitus</strong><span class="muted small">${answered ? `${answered}/${quickQuestions[mode].length} vastausta` : "Ei aloitettu"}</span></div>`);

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
  const selectedAreas = recommendationKeysForContact();
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
          <span>Siirtyisi LähiTapiolan laskuriin</span>
          <strong>${escapeHtml(context.recommended)}</strong>
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
      <button class="btn btn-primary" type="button" data-calculator-contact="${escapeHtml(context.detailKey || "")}">Siirry hinta-arvioon</button>
      <button class="btn btn-secondary" type="button" data-open-contact>Pyydä asiantuntijan arvio</button>
    </div>
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
      <p class="chat-save-note">Tallennamme käydyt chat-keskustelut. <a href="https://www.lahitapiola.fi/henkilo/tietosuoja/" target="_blank" rel="noopener noreferrer">Lue lisää</a></p>
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
  const recommendation = st().recommendation;
  const topItems = recommendation?.items.filter((item) => item.score >= 3 && recommendationAreaOrder[mode].includes(item.key)).slice(0, 3) || [];
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
  const answered = [
    ...getAnswerLabels(baseQuestions[mode] || [], st().baseAnswers),
    ...getAnswerLabels(quickQuestions[mode], st().quickAnswers)
  ].filter((item) => item.answer !== "Ei valittu");
  const topItems = context.topItems;

  if (!answered.length) {
    return "Aloita täyttämällä perustiedot ja lyhyt kartoitus. Sen jälkeen voin selittää, miksi tietyt vakuutusalueet nousivat esiin ja mitä niissä kannattaa tarkistaa.";
  }

  if (st().chatEscalated) {
    return "Asiantuntija voi jatkaa tästä samasta keskustelusta. Tässä demossa näytän samalla, mitä tietoja asiantuntijalle siirtyisi: asiakastyyppi, kartoituksen vastaukset, suositellut vakuutusalueet ja valitut hinta-arvion aiheet.";
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
  return `Vastaustesi perusteella keskeiset aiheet ovat: ${topText}. Voit avata vakuutuskortista tiivistelmän ja PDF-materiaalit, tarkentaa suosituksia vapaaehtoisessa vaiheessa tai jatkaa hinta-arvioon sivupalkista.`;
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

  const recommendation = st().recommendation;
  if (recommendation) {
    const visibleItems = recommendation.items.filter((item) => recommendationAreaOrder[mode].includes(item.key));
    const item = visibleItems.find((entry) => entry.score >= 7) || visibleItems.find((entry) => entry.score >= 3) || visibleItems[0];
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
}

function updateSteps(viewName) {
  const activeIndex = viewName === "intro" || viewName === "base" || viewName === "quick" ? 0
    : viewName === "results" ? 1
      : viewName === "detail" || viewName === "detailResult" ? 2
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
  renderIntro();
  renderBaseInfo();
  renderCalculatorPanel();
  renderChatPanel();
  renderSummaryList();
  closeChatPopup();
  showView(next === "base" ? "base" : "intro");
  track("assessment_restarted", { mode });
}

function hasProgress() {
  const current = st();
  return Boolean(
    Object.keys(current.baseAnswers).length ||
    Object.keys(current.quickAnswers).length ||
    current.recommendation ||
    Object.keys(current.detailAnswers).length ||
    Object.keys(current.detailResults).length ||
    Object.keys(current.selectedContact).length ||
    Object.keys(current.selectedPrice).length ||
    Object.keys(current.contact).length ||
    current.chatMessages.length
  );
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
