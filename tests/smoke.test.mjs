import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  travelAddon: "yes"
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
  hasEmployees: "yes"
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
}

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const templateSource = readFileSync(new URL("../src/page-template.html", import.meta.url), "utf8");
assert.match(appSource, /lahitapiola-vakuutuskartoitus-v4/);
assert.match(appSource, /function openCustomerSummary/);
assert.match(appSource, /localStorage\.setItem/);
assert.doesNotMatch(appSource, /id: "coveragePreference"/);
assert.match(
  appSource,
  /function activeIntakeQuestions\(\) \{\s*\/\/ Nykyisiä vakuutuksia tai kartoituksen tavoitetta ei kysytä\.\s*return \[\];\s*\}/,
);
assert.match(appSource, /if \(!activeIntakeQuestions\(\)\.length\) return true;/);
assert.doesNotMatch(appSource, /Mitä vakuutuksia sinulla on jo/);
assert.doesNotMatch(appSource, /Mikä on kartoituksen tavoite/);
assert.doesNotMatch(appSource, /Mitä vakuutusalueita yrityksellä on jo/);
assert.doesNotMatch(appSource, /Mitä haluat tehdä yrityksen vakuutuksille/);
assert.match(
  appSource,
  /function currentInsuranceLabels\(\) \{\s*if \(!activeIntakeQuestions\(\)\.length\) return \[\];/,
);
assert.match(appSource, /traffic: businessImages\.traffic/);
assert.match(appSource, /vehicle: businessImages\.vehicle/);
assert.match(appSource, /home: .*LT_kotivakuutus_nuoretsohvalla_3/);
assert.match(appSource, /travel: businessImages\.travel/);
assert.match(appSource, /health: businessImages\.people/);
assert.match(appSource, /life: businessImages\.groupLife/);
assert.match(appSource, /cottage: businessImages\.realEstate/);
assert.match(appSource, /liability: businessImages\.liability/);
assert.match(appSource, /boat: .*HA_vakuutukset_vene/);
assert.match(templateSource, /id="questionTitle" tabindex="-1"/);
assert.doesNotMatch(appSource, /function isMandatoryRelatedType/);
assert.doesNotMatch(appSource, /const isLegal = isMandatoryRelatedType/);
assert.match(templateSource, /Oma vakuutusyhteenveto/);
assert.match(templateSource, /Tulosta tai tallenna PDF/);
assert.equal(insuranceTypes.business.bizPeople.title, "Henkilöstö");
assert.equal(insuranceTypes.business.bizVehicle.title, "Ajoneuvot");
assert.equal(insuranceTypes.business.bizProperty.title, "Irtaimisto ja toimitila");
assert.equal(insuranceTypes.business.bizCyber.title, "Kyber");

console.log("Smoke tests passed");
