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
assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.results-snapshot-stats\s*{[\s\S]*grid-template-columns: 1fr/);
assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.handoff-facts,[\s\S]*grid-template-columns: 1fr/);
assert.doesNotMatch(css, /calculator-|contact-price|#laskuri/);

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
}

async function testPersonalResultsAndContact() {
  const dom = await createApp();
  const { document } = dom.window;
  await completeAssessment(dom, "personal");

  const snapshot = document.querySelector(".results-snapshot");
  assert.ok(snapshot, "Tulossivun yläkooste puuttuu");
  assert.match(snapshot.textContent, /Kartoituksesi tulos/);
  assert.equal(snapshot.querySelectorAll(".results-snapshot-stats button").length, 3);
  assert.equal(snapshot.querySelectorAll(".results-section-nav button").length >= 4, true);

  const cards = [...document.querySelectorAll(".product-rec-card")];
  assert.equal(cards.length > 0, true, "Tuloksissa pitää olla vakuutuskortteja");
  assert.equal(cards.every((card) => card.querySelector(".product-card-body > p")?.textContent.trim().length > 35), true);
  assert.doesNotMatch(document.querySelector("#resultsView").textContent, /Miksi tämä nousi esiin|Mitä vakuutus yleisesti tekee/);
  assert.ok(document.querySelector(".product-card-actions [data-card-refine]"));

  document.querySelector("[data-result-target='contact']").click();
  assert.equal(isHidden(document, "#contactView"), false);
  assert.match(document.querySelector("#contactHandoffSummary").textContent, /Nämä tiedot välitetään asiantuntijalle/);
  assert.match(document.querySelector("#contactHandoffSummary").textContent, /Suositellut vakuutukset/);
  assert.ok(document.querySelector("#contactTime"));

  await assertAccessible(dom.window);
  dom.window.close();
}

async function testBusinessResults() {
  const dom = await createApp();
  const { document } = dom.window;
  await completeAssessment(dom, "business");

  assert.ok(document.querySelector("#results-mandatory"));
  assert.ok(document.querySelector("#results-recommended"));
  assert.ok(document.querySelector("#results-optional") || document.querySelector(".results-snapshot-stats"));
  assert.match(document.querySelector("#resultsView").textContent, /Pakolliset ja sopimusperusteiset|Lakisääteiset vakuutukset/);
  assert.match(document.querySelector("#resultsView").textContent, /Suositellut vakuutukset/);

  const contactButton = document.querySelector(".results-primary-actions [data-result-target='contact']");
  assert.ok(contactButton);
  contactButton.click();
  assert.match(document.querySelector("#contactHandoffSummary").textContent, /Asiakastyyppi ja tilanne/);
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
