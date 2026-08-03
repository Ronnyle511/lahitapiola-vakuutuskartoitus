import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import axe from "axe-core";
import { JSDOM, VirtualConsole } from "jsdom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const runtimeErrors = [];

await testPersonalAndFamilyFlow();
await testOtherAnswerAndEditing();
await testBusinessFlowsAndTwoLevelComparison();
await testDetailOtherAnswer();
assert.deepEqual(runtimeErrors, [], `Käyttöliittymässä havaittiin ajonaikaisia virheitä:\n${runtimeErrors.join("\n")}`);

assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.coverage-details\s*{\s*display: none/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.coverage-mobile-comparison\s*{\s*display: grid/);
assert.match(css, /\.mobile-compare-selects[\s\S]*grid-template-columns: repeat\(2/);
assert.doesNotMatch(css, /calculator-|contact-price|#laskuri/);

console.log("UI tests passed: personal, family, sole trader, small business, comparison, editing and other answers");

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

function click(document, selector) {
  const element = document.querySelector(selector);
  assert.ok(element, `Elementti puuttuu: ${selector}`);
  element.click();
}

function setValue(window, selector, value) {
  const element = window.document.querySelector(selector);
  assert.ok(element, `Kenttä puuttuu: ${selector}`);
  element.value = value;
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
  element.dispatchEvent(new window.Event("change", { bubbles: true }));
}

function isVisible(document, selector) {
  const element = document.querySelector(selector);
  return Boolean(element && !element.classList.contains("hidden") && !element.closest(".hidden"));
}

function findByText(document, selector, text) {
  return [...document.querySelectorAll(selector)].find((element) => element.textContent.includes(text));
}

function openBase(dom, mode = "personal") {
  const { document } = dom.window;
  if (mode === "business") click(document, "#modeBusiness");
  click(document, "#startAssessment");
  click(document, "#startQuick");
  assert.equal(isVisible(document, "#baseInfoView"), true);
}

function completePersonalBase(dom, values = {}) {
  openBase(dom, "personal");
  const { window } = dom;
  setValue(window, "#base_ageGroup", values.ageGroup || "36_45");
  setValue(window, "#base_livingType", values.livingType || "house");
  if (values.livingType === "other") setValue(window, "#base_livingType_other", values.livingTypeOther || "Yhteisöllinen asuminen");
  setValue(window, "#base_lifeSituation", values.lifeSituation || "employed");
  click(window.document, "#baseNext");
  assert.equal(isVisible(window.document, "#resultsView"), true);
}

function completeBusinessBase(dom, industry, employeeCount) {
  openBase(dom, "business");
  const { window } = dom;
  setValue(window, "#base_industry", industry);
  setValue(window, "#base_employeeCount", employeeCount);
  click(window.document, "#baseNext");
  assert.equal(isVisible(window.document, "#resultsView"), true);
}

function completeActiveDetail(dom) {
  const { document } = dom.window;
  for (let index = 0; index < 18; index += 1) {
    if (isVisible(document, "#detailResultView")) return;
    if (!document.querySelector("#detailAnswers .answer-option.selected")) {
      click(document, "#detailAnswers .answer-option");
    }
    click(document, "#detailNext");
  }
  assert.fail("Vakuutuskohtainen tarkennus ei valmistunut");
}

function openFirstComparison(dom) {
  const { document } = dom.window;
  const button = findByText(document, "button", "Aloita turvatasojen vertailu");
  assert.ok(button);
  button.click();
  assert.equal(isVisible(document, "#detailView"), true);
  completeActiveDetail(dom);
  assert.ok(document.querySelector(".coverage-compare"));
}

async function testPersonalAndFamilyFlow() {
  const dom = await createApp();
  const { document } = dom.window;
  completePersonalBase(dom, { livingType: "house", lifeSituation: "parentalLeave" });

  const resultText = document.querySelector("#resultsView").textContent;
  assert.match(resultText, /Kartoituksesi on valmis/);
  assert.match(resultText, /Ei tunnistettuja lakisääteisiä vakuutuksia/);
  assert.match(resultText, /Tilanteeseesi suositellut vakuutukset/);
  assert.match(resultText, /Harkittavat lisäturvat/);
  assert.match(resultText, /Näytä myös vakuutukset, joita ei suositeltu/);
  assert.equal(isVisible(document, "#contactView"), false);
  assert.equal(document.querySelectorAll("img[src^='http']").length, 0);

  openFirstComparison(dom);
  assert.ok(document.querySelector(".coverage-table"));
  assert.match(document.querySelector(".best-fit").textContent, /Suosituksemme:/);
  click(document, "[data-comparison-differences]");
  click(document, "[data-comparison-expand]");
  assert.match(document.querySelector("[data-comparison-expand]").textContent, /Näytä vain tärkeimmät erot/);
  assert.equal(document.querySelectorAll("[data-mobile-comparison]").length, 2);
  click(document, "[data-close-comparison]");

  click(document, "#contactFromResults");
  assert.equal(isVisible(document, "#summaryView"), true);
  assert.match(document.querySelector("#customerSummaryContent").textContent, /Mitä vakuutus tekee\?/);
  click(document, "#summaryContact");
  assert.match(document.querySelector("#contactHandoffSummary").textContent, /Nämä tiedot välitetään asiantuntijalle/);
  setValue(dom.window, "#contactName", "Demo Asiakas");
  setValue(dom.window, "#contactEmail", "demo@example.com");
  setValue(dom.window, "#contactGoal", "Haluan vertailla sopivia turvatasoja");
  document.querySelector("#privacyConsent").click();
  click(document, "#createSummary");
  assert.equal(isVisible(document, "#crmSummaryDetails"), true);
  const crmText = document.querySelector("#crmSummary").value;
  assert.match(crmText, /Asiakkaan tavoite: Haluan vertailla sopivia turvatasoja/);
  assert.match(crmText, /Valitut turvatasot/);

  await assertAccessible(dom.window);
  dom.window.close();
}

async function testOtherAnswerAndEditing() {
  const dom = await createApp();
  const { document } = dom.window;
  completePersonalBase(dom, { livingType: "other", livingTypeOther: "Asun osan vuodesta ulkomailla" });
  click(document, "#contactFromResults");
  assert.match(document.querySelector("#customerSummaryContent").textContent, /Asun osan vuodesta ulkomailla/);
  click(document, "#editAnswers");
  assert.equal(document.querySelector("#base_livingType").value, "other");
  assert.equal(document.querySelector("#base_livingType_other").value, "Asun osan vuodesta ulkomailla");
  dom.window.close();
}

async function testBusinessFlowsAndTwoLevelComparison() {
  const sole = await createApp();
  completeBusinessBase(sole, "professional", "solo");
  const soleText = sole.window.document.querySelector("#resultsView").textContent;
  assert.match(soleText, /YEL-vakuutus/);
  assert.doesNotMatch(soleText, /TyEL-vakuutus/);
  sole.window.close();

  const small = await createApp();
  completeBusinessBase(small, "restaurant", "1_10");
  const smallText = small.window.document.querySelector("#resultsView").textContent;
  assert.match(smallText, /TyEL-vakuutus/);
  assert.match(smallText, /Työtapaturma- ja ammattitautivakuutus/);
  assert.match(smallText, /Omaisuus ja toimitilat/);
  assert.match(smallText, /Vastuu ja oikeusturva/);
  assert.equal([...small.window.document.querySelectorAll("#base_employeeCount option")].some((item) => /51|250/.test(item.textContent)), false);
  small.window.close();

  const twoLevel = await createApp();
  completeBusinessBase(twoLevel, "professional", "1_10");
  const cyberCard = findByText(twoLevel.window.document, ".rec-card", "Kyber ja tietoriskit");
  assert.ok(cyberCard);
  cyberCard.querySelector("[data-card-refine]").click();
  completeActiveDetail(twoLevel);
  assert.equal(twoLevel.window.document.querySelectorAll(".coverage-choice").length, 2);
  twoLevel.window.close();
}

async function testDetailOtherAnswer() {
  const dom = await createApp();
  const { document } = dom.window;
  completePersonalBase(dom, { livingType: "house" });
  click(document, "[data-refine-recommendations]");
  const vehicleNeed = findByText(document, "#answerList .answer-option", "Auto, moottoripyörä");
  assert.ok(vehicleNeed);
  vehicleNeed.click();
  click(document, "#questionNext");
  const vehicleCard = findByText(document, ".rec-card", "Ajoneuvot");
  assert.ok(vehicleCard);
  vehicleCard.querySelector("[data-card-refine]").click();
  const otherVehicle = findByText(document, "#detailAnswers .answer-option", "Muu ajoneuvo");
  assert.ok(otherVehicle);
  otherVehicle.click();
  setValue(dom.window, "#detailAnswers .answer-other-field input", "Kevyt sähköajoneuvo");
  click(document, "#detailNext");
  completeActiveDetail(dom);
  click(document, "#contactFromDetail");
  assert.match(document.querySelector("#customerSummaryContent").textContent, /Kevyt sähköajoneuvo/);
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
