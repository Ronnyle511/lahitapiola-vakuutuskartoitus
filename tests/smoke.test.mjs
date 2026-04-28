import assert from "node:assert/strict";
import { detailFlows, insuranceTypes, quickQuestions } from "../src/data.js";
import { buildDetailResult } from "../src/detailResults.js";
import { calculateScores } from "../src/scoring.js";

const personal = calculateScores("personal", {
  housing: "yes",
  vehicle: "yes",
  travel: "yes",
  health: "yes",
  family: "yes",
  pets: "yes",
  property: "no",
  children: "no",
  shock: "yes",
  currentCovers: "yes"
});

assert.equal(personal.items[0].key, "home");
assert.ok(personal.primary.some((item) => item.key === "vehicle"));
assert.ok(personal.primary.some((item) => item.key === "travel"));
assert.ok(personal.primary.some((item) => item.key === "life"));
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
  companySize: "yes",
  industry: "yes",
  assets: "yes",
  people: "yes",
  mobility: "yes",
  riskConcerns: "yes",
  digital: "yes",
  businessTravel: "yes",
  cargo: "yes",
  construction: "no",
  realEstate: "no",
  patient: "no",
  shock: "yes",
  currentCovers: "yes"
});

assert.ok(business.primary.some((item) => item.key === "bizPeople"));
assert.ok(business.primary.some((item) => item.key === "bizCargo"));
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
  assert.ok(quickQuestions[profileId].length >= 8);
  assert.ok(Object.keys(detailFlows[profileId]).length >= 6);
}

console.log("Smoke tests passed");
