import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { baseQuestions, detailFlows, insuranceTypes, quickQuestions } from "../src/data.js";
import { buildDetailResult } from "../src/detailResults.js";
import { calculateScores } from "../src/scoring.js";

const personal = calculateScores("personal", {
  vehicle: "yes",
  travel: "yes",
  personalInsurance: "yes",
  pets: "yes",
  children: "yes",
  valuables: "yes"
}, {
  ageGroup: "36_45",
  livingType: "house",
  lifeSituation: "employed"
});

assert.ok(personal.primary.some((item) => item.key === "home"));
assert.ok(personal.primary.some((item) => item.key === "vehicle"));
assert.ok(personal.primary.some((item) => item.key === "travel"));
assert.ok(personal.primary.some((item) => item.key === "health"));
assert.equal(personal.existingCoverage.length, 0);

const homeResult = buildDetailResult("personal", "home", {
  role: "house_owner",
  insuredObject: "building_and_contents",
  coverLevel: "laaja",
  plusNeed: "yes",
  travelAddon: "yes",
  deductibleContents: "300",
  deductibleBuilding: "500"
});

assert.match(homeResult.title, /Laaja/);
assert.ok(homeResult.rows.some((row) => row.value.includes("Rakennus ja irtaimisto")));
assert.ok(homeResult.comparison.recommended.some((option) => option.title === "LaajaPlus"));

const business = calculateScores("business", {
  premises: "yes",
  assets: "yes",
  customerSites: "yes",
  data: "yes",
  vehicles: "yes",
  keyPeople: "yes",
  interruption: "yes"
}, {
  industry: "professional",
  employeeCount: "1_10"
});

assert.ok(business.primary.some((item) => item.key === "bizPeople"));
assert.ok(business.primary.some((item) => item.key === "bizLiability"));
assert.ok(business.primary.some((item) => item.key === "bizVehicle"));
assert.ok(business.primary.some((item) => item.key === "bizInterruption"));
assert.equal(business.existingCoverage.length, 0);

const cyberResult = buildDetailResult("business", "bizCyber", {
  cyberExposure: ["personal_data", "critical_systems"],
  cyberConcerns: ["ransomware", "response"],
  cyberMaturity: "partial",
  cyberLevel: "needs_assessment"
});

assert.match(cyberResult.title, /Pro/);
assert.ok(cyberResult.comparison.recommended.some((option) => option.title === "Kybervakuutus Pro"));

for (const profileId of ["personal", "business"]) {
  assert.ok(Object.keys(insuranceTypes[profileId]).length >= 6);
  assert.ok(baseQuestions[profileId].length >= 2);
  assert.ok(quickQuestions[profileId].length >= 7);
  assert.ok(Object.keys(detailFlows[profileId]).length >= 6);
  Object.values(insuranceTypes[profileId]).forEach((item) => assert.ok(item.purpose, `${item.title} tarvitsee tiiviin tarkoituskuvauksen`));
}

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const templateSource = readFileSync(new URL("../src/page-template.html", import.meta.url), "utf8");
assert.match(appSource, /lahitapiola-vakuutuskartoitus-v5/);
assert.match(appSource, /function openCustomerSummary/);
assert.match(appSource, /localStorage\.setItem/);
assert.match(templateSource, /Oma vakuutusyhteenveto/);
assert.match(templateSource, /Tulosta tai tallenna PDF/);
assert.doesNotMatch(templateSource, /id="laskuri"/);
assert.doesNotMatch(templateSource, /250 henkilöä/);
assert.doesNotMatch(templateSource, /51–249/);
assert.match(appSource, /Aloita turvatasojen vertailu/);
assert.match(appSource, /Mitä vakuutus tekee\?/);
assert.match(appSource, /Näytä myös vakuutukset, joita ei suositeltu/);
assert.match(appSource, /Nämä tiedot välitetään asiantuntijalle/);
assert.match(appSource, /Näytä vain erot/);
assert.match(appSource, /Näytä kaikki erot/);
assert.match(templateSource, /id="contactGoal"/);
assert.match(templateSource, /id="editAnswers"/);
assert.match(templateSource, /id="heroImage"/);
assert.match(templateSource, /id="introImage"/);
assert.doesNotMatch(templateSource, /<img[^>]+src="https?:\/\//);
assert.doesNotMatch(appSource, /direct_expert_contact|risk_area_discussion|priceImpact|calculatorAction/);

for (const image of [
  "kartoitus-henkilo-640.webp",
  "kartoitus-henkilo-1200.webp",
  "kartoitus-yritys-640.webp",
  "kartoitus-yritys-1200.webp",
  "kartoitus-perhe-800.webp",
  "kartoitus-yrittaja-800.webp",
  "kartoitus-yhteydenotto-800.webp"
]) {
  const imageUrl = new URL(`../assets/images/${image}`, import.meta.url);
  assert.ok(existsSync(imageUrl), `${image} puuttuu`);
  assert.ok(statSync(imageUrl).size < 200_000, `${image} on liian suuri verkkokäyttöön`);
}

const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.doesNotMatch(stylesSource, /calculator-|contact-price|#laskuri/);
assert.match(stylesSource, /@media \(max-width: 760px\)/);
assert.match(stylesSource, /coverage-mobile-comparison/);

console.log("Smoke tests passed");
