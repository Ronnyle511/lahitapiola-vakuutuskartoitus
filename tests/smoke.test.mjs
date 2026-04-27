import assert from "node:assert/strict";
import { detailFlows, insuranceTypes, quickQuestions } from "../src/data.js";
import { buildDetailResult } from "../src/detailResults.js";
import { calculateScores } from "../src/scoring.js";

const personal = calculateScores("personal", {
  housing: ["house"],
  vehicle: "daily",
  travel: ["abroad_often"],
  health: ["fast_care"],
  family: "yes",
  pets: ["dog_cat"],
  property: ["none"],
  children: "no",
  shock: "yes",
  currentCovers: ["home"]
});

assert.equal(personal.items[0].key, "home");
assert.ok(personal.primary.some((item) => item.key === "vehicle"));
assert.ok(personal.primary.some((item) => item.key === "travel"));
assert.ok(personal.primary.some((item) => item.key === "life"));
assert.ok(personal.existingCoverage.includes("home"));

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

const business = calculateScores("business", {
  companySize: "small",
  industry: "logistics",
  assets: ["equipment", "inventory"],
  people: ["employees", "key_people"],
  mobility: ["fleet", "customer_goods"],
  riskConcerns: ["interruption", "liability_claim"],
  digital: "medium",
  shock: "yes",
  currentCovers: ["bizVehicle"]
});

assert.equal(business.items[0].key, "bizPeople");
assert.ok(business.primary.some((item) => item.key === "bizCargo"));
assert.ok(business.primary.some((item) => item.key === "bizVehicle"));
assert.ok(business.primary.some((item) => item.key === "bizInterruption"));
assert.ok(business.existingCoverage.includes("bizVehicle"));

const cyberResult = buildDetailResult("business", "bizCyber", {
  cyberExposure: ["personal_data", "critical_systems"],
  cyberConcerns: ["ransomware", "response"],
  cyberMaturity: "partial",
  cyberLevel: "needs_assessment"
});

assert.match(cyberResult.title, /Pro/);

for (const profileId of ["personal", "business"]) {
  assert.ok(Object.keys(insuranceTypes[profileId]).length >= 6);
  assert.ok(quickQuestions[profileId].length >= 8);
  assert.ok(Object.keys(detailFlows[profileId]).length >= 6);
}

console.log("Smoke tests passed");
