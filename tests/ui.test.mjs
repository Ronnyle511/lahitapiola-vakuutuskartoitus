import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import axe from "axe-core";
import { JSDOM, VirtualConsole } from "jsdom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const runtimeErrors = [];

await testPersonalResultsAndContact();
await testBusinessResults();

assert.deepEqual(runtimeErrors, [], `Käyttöliittymässä havaittiin ajonaikaisia virheitä:\n${runtimeErrors.join("\n")}`);
assert.doesNotMatch(css, /results-snapshot|results-section-nav|results-primary-actions/);
assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.handoff-overview,[\s\S]*grid-template-columns: 1fr/);
assert.doesNotMatch(css, /calculator-|contact-price|#laskuri/);
assert.match(css, /\.site-brand\.demo-brand small\s*{[\s\S]*color:\s*#d00000/);
assert.match(css, /\.app-shell\[data-view="results"\][\s\S]*max-width:\s*1224px/);
assert.match(css, /@media \(min-width: 1180px\)[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/);
assert.match(css, /\.answers\.dense-grid\s*{[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /\.hero\s*{[\s\S]*background:\s*#ffffff/);
assert.match(css, /\.results-sticky-actions\s*{[\s\S]*position:\s*fixed/);
assert.match(css, /\.coverage-secondary-row\s*{[\s\S]*display:\s*none/);

console.log("UI tests passed: personal and business results, navigation, contact handoff and accessibility");

async function createApp() {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => {
    if (!/Not implemented: window\.print/.test(error.message)) runtimeErrors.push(`jsdom: ${error.message}`);
  });
  virtualConsole.on("error", (message) => runtimeErrors.push(`console: ${message}`));

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://127.0.0.1:4173/",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.HTMLElement.prototype.scrollIntoView = () => {};
      window.confirm = () => true;
      window.print = () => {};
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    }
  });

  if (dom.window.document.readyState !== "complete") {
    await new Promise((resolve) => dom.window.addEventListener("load", resolve, { once: true }));
  }
  return dom;
}

async function completeAssessment(dom, mode = "personal") {
  const { document } = dom.window;
  if (mode === "business") document.querySelector("#modeBusiness").click();
  document.querySelector("#startAssessment").click();

  for (let index = 0; index < 24 && isHidden(document, "#resultsView"); index += 1) {
    const options = [...document.querySelectorAll("#answerList .answer-option")];
    const preferred = options.find((item) => /Kyllä|Omistan|Työssä|1–10|1-10|Asiantuntija/i.test(item.textContent));
    const option = preferred || options[0];
    assert.ok(option, `Kartoituksen kysymyksestä ${index + 1} puuttuu vastausvaihtoehto`);
    option.click();
    await wait(230);
    const next = document.querySelector("#questionNext");
    if (next && !next.classList.contains("hidden")) next.click();
    await wait(230);
  }

  assert.equal(isHidden(document, "#resultsView"), false, `${mode}-kartoituksen pitää päättyä tuloksiin`);
  assert.equal(document.querySelector("#appShell").dataset.view, "results");
}

async function testPersonalResultsAndContact() {
  const dom = await createApp();
  const { document } = dom.window;
  await completeAssessment(dom, "personal");

  assert.equal(document.querySelector(".results-snapshot"), null);
  assert.match(document.querySelector("#resultsTitle").textContent, /Sinulle ehdotetut vakuutukset/);
  assert.match(document.querySelector("#resultsIntro").textContent, /Tutustu ehdotuksiin/);

  const cards = [...document.querySelectorAll(".product-rec-card")];
  assert.equal(cards.length > 0, true, "Tuloksissa pitää olla vakuutuskortteja");
  assert.equal(cards.every((card) => card.querySelector(".product-card-body > p")?.textContent.trim().length > 35), true);
  assert.doesNotMatch(document.querySelector("#resultsView").textContent, /Miksi tämä nousi esiin|Mitä vakuutus yleisesti tekee/);
  assert.ok(document.querySelector(".product-card-actions [data-card-refine]"));
  assert.ok(document.querySelector(".results-sticky-actions"), "Yhteenvedon jatkotoimintojen pitää näkyä koko tulosnäkymän ajan");
  assert.equal(document.querySelectorAll("[data-summary-next]").length >= 2, true);

  document.querySelector(".results-sticky-actions [data-expert-contact]").click();
  assert.equal(isHidden(document, "#contactView"), false);
  assert.match(document.querySelector("#contactHandoffSummary").textContent, /Nämä tiedot välitetään asiantuntijalle/);
  assert.equal(document.querySelectorAll("#contactHandoffSummary .handoff-overview > div").length, 3);
  assert.equal(document.querySelector("#contactHandoffSummary .handoff-details").open, false);
  assert.equal(document.querySelector(".contact-choice-editor").open, false);
  assert.ok(document.querySelector("#contactTime"));

  await assertAccessible(dom.window);
  dom.window.close();
}

async function testBusinessResults() {
  const dom = await createApp();
  const { document } = dom.window;
  await completeAssessment(dom, "business");

  assert.ok(document.querySelector("#results-mandatory"));
  assert.ok(document.querySelector("#results-mandatory .mandatory-product-card"));
  assert.equal(document.querySelector("#results-mandatory details"), null);
  assert.ok(document.querySelector("#results-recommended"));
  assert.ok(document.querySelector("#results-optional"));
  const optionalDisclosure = document.querySelector("#results-optional .optional-product-disclosure");
  if (!document.querySelector("#results-optional").classList.contains("empty")) {
    assert.ok(optionalDisclosure);
    assert.equal(optionalDisclosure.open, false, "Harkittavien lisäturvien pitää olla aluksi tiiviinä");
  }
  assert.equal(
    document.querySelector("#results-recommended").compareDocumentPosition(document.querySelector("#results-mandatory")) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
    dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
    "Lakisääteisten osion pitää tulla suositeltujen vakuutusten jälkeen"
  );
  assert.equal(
    document.querySelector("#results-mandatory").compareDocumentPosition(document.querySelector("#results-optional")) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
    dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
    "Lakisääteisten osion pitää tulla ennen harkittavia vakuutuksia"
  );
  assert.match(document.querySelector("#resultsView").textContent, /Lakisääteiset ja sopimusperusteiset vakuutukset/);
  assert.match(document.querySelector("#resultsView").textContent, /Suositellut vakuutukset/);

  const compareButton = document.querySelector('[data-card-refine="bizLiability"]');
  assert.ok(compareButton, "Vastuuvakuutusten vertailun pitää löytyä yritystuloksista");
  compareButton.click();
  assert.equal(isHidden(document, "#detailResultView"), false);
  assert.match(document.querySelector(".coverage-current-selection").textContent, /Voit valita useamman vakuutuksen/);

  const initialButtons = [...document.querySelectorAll(".coverage-desktop-table .coverage-select-button")];
  assert.equal(initialButtons.length >= 2, true);
  const selectedKeys = initialButtons.slice(0, 2).map((button) => button.dataset.coverageChoice);
  const selectedTitles = initialButtons.slice(0, 2).map((button) => button.closest("th").querySelector("strong").textContent.trim());
  document.querySelector(`[data-coverage-choice="${selectedKeys[0]}"]`).click();
  document.querySelector(`.coverage-desktop-table [data-coverage-choice="${selectedKeys[1]}"]`).click();
  assert.equal(document.querySelectorAll(".coverage-desktop-table .coverage-select-button[aria-pressed='true']").length, 2);
  selectedTitles.forEach((title) => assert.match(document.querySelector(".coverage-current-selection").textContent, new RegExp(title)));

  const rowToggle = document.querySelector("[data-toggle-comparison-rows]");
  if (rowToggle) {
    assert.equal(document.querySelectorAll(".coverage-secondary-row").length > 0, true);
    rowToggle.click();
    assert.equal(document.querySelector(".coverage-compare").classList.contains("show-all-rows"), true);
    assert.equal(rowToggle.getAttribute("aria-expanded"), "true");
  }

  document.querySelector("#contactFromDetail").click();
  selectedTitles.forEach((title) => assert.match(document.querySelector("#customerSummaryContent").textContent, new RegExp(title)));
  document.querySelector("#summaryContact").click();
  assert.match(document.querySelector("#contactHandoffSummary").textContent, /Asiakastyyppi/);
  selectedTitles.forEach((title) => assert.match(document.querySelector("#contactHandoffSummary").textContent, new RegExp(title)));
  assert.ok(document.querySelector("#editAnswersFromContact"));

  dom.window.close();
}

async function assertAccessible(window) {
  window.eval(axe.source);
  const results = await window.axe.run(window.document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    rules: { "color-contrast": { enabled: false } }
  });
  const severe = results.violations.filter((item) => ["serious", "critical"].includes(item.impact));
  const messages = severe.map((item) => `${item.id}: ${item.help} (${item.nodes.map((node) => node.target.join(" ")).join(", ")})`);
  assert.equal(messages.length, 0, messages.join("\n"));
}

function isHidden(document, selector) {
  const element = document.querySelector(selector);
  return !element || element.classList.contains("hidden") || Boolean(element.closest(".hidden"));
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
