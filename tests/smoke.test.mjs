import assert from "node:assert/strict";
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
  digital: "yes",
  vehicles: "yes",
  keyPeople: "yes",
  interruption: "yes"
}, {
  industry: "it",
  employeeCount: "1_4"
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

console.log("Smoke tests passed");
