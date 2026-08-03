import assert from "node:assert/strict";
import { buildAssessmentResult, getCompanySizeClass, normalizeEmployeeBand, normalizeIndustry } from "../src/solutionEngine.js";

const state = (baseAnswers, selectedRelevantNeeds = [], selectedCoverage = {}, detailResults = {}) => ({
  baseAnswers,
  quickAnswers: {},
  selectedRelevantNeeds,
  selectedCoverage,
  detailResults
});

assert.equal(getCompanySizeClass("solo"), "solo");
assert.equal(getCompanySizeClass("1_10"), "micro");
assert.equal(getCompanySizeClass("11_50"), "small");
assert.equal(normalizeEmployeeBand("unknown"), "solo");
assert.equal(normalizeIndustry("it"), "professional");
assert.equal(normalizeIndustry("consulting"), "professional");

const restaurant = buildAssessmentResult("business", state({
  industry: "restaurant",
  employeeCount: "1_10"
}));
assert.equal(restaurant.flowType, "solution_package");
assert.deepEqual(
  restaurant.recommendedCovers.map((item) => item.key),
  ["bizProperty", "bizInterruption", "bizLiability", "bizPeople"]
);
assert.ok(restaurant.mandatoryChecks.some((item) => item.id === "tyel"));
assert.ok(restaurant.mandatoryChecks.some((item) => item.id === "workers_comp"));
assert.ok(restaurant.mandatoryChecks.every((item) => item.purpose));
assert.ok(restaurant.nonRelevantCovers.length > 0);
assert.ok(restaurant.nonRelevantCovers.every((item) => !restaurant.recommendedCovers.some((recommended) => recommended.key === item.key)));

const professional = buildAssessmentResult("business", state({
  industry: "professional",
  employeeCount: "11_50"
}, ["system_dependency"]));
assert.equal(professional.flowType, "solution_package");
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizLiability"));
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizCyber"));
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizPeople"));
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizInterruption"));

const healthcare = buildAssessmentResult("business", state({
  industry: "healthcare",
  employeeCount: "1_10"
}));
const restaurantMandatoryIds = restaurant.mandatoryChecks.map((item) => item.id);
assert.ok(healthcare.mandatoryChecks.some((item) => item.id === "patient"));
assert.ok(!restaurantMandatoryIds.includes("patient"));

const family = buildAssessmentResult("personal", state({
  ageGroup: "36_45",
  livingType: "house",
  lifeSituation: "employed"
}, ["children_health", "family_financial_security", "vehicle"]));
assert.equal(family.flowType, "personal_solution_package");
assert.ok(family.recommendedCovers.some((item) => item.key === "home"));
assert.ok(family.recommendedCovers.some((item) => item.key === "health"));
assert.ok(family.recommendedCovers.some((item) => item.key === "life"));
assert.ok(family.recommendedCovers.some((item) => item.key === "vehicle"));
assert.equal(family.selectedCoverageLevels.home.refined, false);
assert.ok(Array.isArray(family.nonRelevantCovers));

const familyPerus = buildAssessmentResult("personal", state({
  ageGroup: "36_45",
  livingType: "house",
  lifeSituation: "employed"
}, ["vehicle"], { home: "perus" }, {
  home: {
    comparison: {
      recommendedKeys: ["laaja"],
      basis: "Tarkentavissa vastauksissa korostui kodin ja irtaimiston suoja."
    }
  }
}));
assert.equal(familyPerus.selectedCoverageLevels.home.selectedKey, "perus");
assert.equal(familyPerus.selectedCoverageLevels.home.refined, true);
assert.equal(familyPerus.aiContext.selectedCoverageLevels.home.selectedKey, "perus");
assert.doesNotMatch(familyPerus.contactSummary, /Hinta-arvio/i);

console.log("Solution engine tests passed");
