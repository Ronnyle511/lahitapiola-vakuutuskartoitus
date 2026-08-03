import assert from "node:assert/strict";
import { buildAssessmentResult, getBusinessFlow, getCompanySizeClass, normalizeEmployeeBand, normalizeIndustry } from "../src/solutionEngine.js";

const state = (baseAnswers, selectedRelevantNeeds = [], selectedCoverage = {}, detailResults = {}, quickAnswers = {}) => ({
  baseAnswers,
  quickAnswers,
  selectedRelevantNeeds,
  selectedCoverage,
  detailResults
});

assert.equal(getCompanySizeClass("solo"), "solo");
assert.equal(getCompanySizeClass("1_10"), "micro");
assert.equal(getCompanySizeClass("11_50"), "small");
assert.equal(getCompanySizeClass("51_249"), "mid");
assert.equal(getCompanySizeClass("250_plus"), "large");
assert.equal(normalizeEmployeeBand("1_4"), "micro");
assert.equal(normalizeEmployeeBand("20_49"), "small");
assert.equal(normalizeEmployeeBand("50_plus"), "mid");
assert.equal(normalizeIndustry("it"), "professional");
assert.equal(normalizeIndustry("consulting"), "professional");

assert.equal(getBusinessFlow({ sizeClass: "solo" }), "solution_package");
assert.equal(getBusinessFlow({ sizeClass: "micro" }), "solution_package");
assert.equal(getBusinessFlow({ sizeClass: "small" }), "solution_package");
assert.equal(getBusinessFlow({ sizeClass: "mid" }), "risk_area_discussion");
assert.equal(getBusinessFlow({ sizeClass: "large" }), "direct_expert_contact");

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

const professional = buildAssessmentResult("business", state({
  industry: "professional",
  employeeCount: "11_50"
}, ["system_dependency"]));
assert.equal(professional.flowType, "solution_package");
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizLiability"));
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizCyber"));
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizPeople"));
assert.ok(professional.recommendedCovers.some((item) => item.key === "bizInterruption"));

const manufacturingMid = buildAssessmentResult("business", state({
  industry: "manufacturing",
  employeeCount: "51_249"
}));
assert.equal(manufacturingMid.flowType, "risk_area_discussion");
assert.equal(manufacturingMid.recommendedCovers.length, 0);
assert.ok(manufacturingMid.riskAreas.some((item) => item.id === "property"));
assert.ok(manufacturingMid.riskAreas.some((item) => item.id === "program"));
assert.match(manufacturingMid.contactSummary, /Riskialueet/);

const largeBusiness = buildAssessmentResult("business", state({
  industry: "manufacturing",
  employeeCount: "250_plus"
}));
assert.equal(largeBusiness.flowType, "direct_expert_contact");
assert.equal(largeBusiness.recommendedCovers.length, 0);
assert.ok(largeBusiness.sellerDiscussionPoints.length >= 3);

const healthcare = buildAssessmentResult("business", state({
  industry: "healthcare",
  employeeCount: "1_10"
}));
const restaurantMandatoryIds = restaurant.mandatoryChecks.map((item) => item.id);
assert.ok(healthcare.mandatoryChecks.some((item) => item.id === "patient"));
assert.ok(!restaurantMandatoryIds.includes("patient"));

const businessBaseNeeds = buildAssessmentResult("business", state({
  industry: "grocery",
  hasEmployees: "yes",
  hasVehicles: "yes",
  digitalDependency: "yes",
  businessTravelNeed: "yes"
}));
assert.ok(businessBaseNeeds.recommendedCovers.some((item) => item.key === "bizVehicle"));
assert.ok(businessBaseNeeds.recommendedCovers.some((item) => item.key === "bizCyber"));
assert.ok(businessBaseNeeds.recommendedCovers.some((item) => item.key === "bizTravel"));
assert.ok(businessBaseNeeds.pricingPayload.selectedRelevantNeeds.includes("vehicles_or_transport"));
assert.equal(businessBaseNeeds.profile.employeeBand, "Työntekijöitä");
assert.equal(businessBaseNeeds.mandatoryChecks.find((item) => item.id === "traffic")?.badgeLabel, "Lakisääteinen liikennekäytössä");
assert.equal(businessBaseNeeds.mandatoryChecks.find((item) => item.id === "group_life")?.obligationKind, "collective_agreement");
assert.equal(businessBaseNeeds.mandatoryChecks.find((item) => item.id === "group_life")?.badgeLabel, "Työehtosopimuksen perusteella");

const family = buildAssessmentResult("personal", state({
  ageGroup: "36_45",
  livingType: "house",
  lifeSituation: "employed",
  hasPersonalVehicle: "yes",
  travelsRegularly: "yes",
  hasPets: "yes",
  financialDependents: "yes"
}, ["children_health", "family_financial_security", "vehicle"]));
assert.equal(family.flowType, "personal_solution_package");
assert.ok(family.recommendedCovers.some((item) => item.key === "home"));
assert.ok(family.recommendedCovers.some((item) => item.key === "health"));
assert.ok(family.recommendedCovers.some((item) => item.key === "life"));
assert.ok(family.recommendedCovers.some((item) => item.key === "vehicle"));
assert.ok(family.recommendedCovers.some((item) => item.key === "travel"));
assert.ok(family.recommendedCovers.some((item) => item.key === "pet"));
assert.ok(family.mandatoryChecks.some((item) => item.id === "traffic"));
assert.ok(!family.mandatoryChecks.some((item) => item.id === "yel"));
assert.equal(family.selectedCoverageLevels.home.refined, false);
assert.equal(family.pricingPayload.selectedCoverageLevels.home, undefined);
assert.equal(family.pricingPayload.priceImpactSymbol, "");

const currentCoverReview = buildAssessmentResult("personal", state({
  ageGroup: "26_35",
  livingType: "rent",
  lifeSituation: "employed"
}, [], {}, {}, {
  currentInsuranceAreas: ["home", "vehicle", "travel", "health"],
  reviewGoal: ["check", "compare"]
}));
const currentReviewKeys = currentCoverReview.recommendedCovers.map((item) => item.key);
assert.ok(currentReviewKeys.includes("vehicle"));
assert.ok(currentReviewKeys.includes("travel"));
assert.match(currentCoverReview.recommendedCovers.find((item) => item.key === "vehicle").reason, /voimassa/i);
assert.ok(currentCoverReview.pricingPayload.selectedCovers.includes("vehicle"));
assert.ok(currentCoverReview.pricingPayload.selectedCovers.includes("travel"));

const entrepreneurNotWorking = buildAssessmentResult("business", state({
  industry: "professional",
  hasEmployees: "no",
  entrepreneurWorks: "no",
  hasVehicles: "no"
}));
assert.ok(!entrepreneurNotWorking.mandatoryChecks.some((item) => item.id === "yel"));

const entrepreneurWorking = buildAssessmentResult("business", state({
  industry: "professional",
  hasEmployees: "no",
  entrepreneurWorks: "yes",
  hasVehicles: "no"
}));
assert.ok(entrepreneurWorking.mandatoryChecks.some((item) => item.id === "yel"));

const logisticsWithoutVehicles = buildAssessmentResult("business", state({
  industry: "logistics",
  hasEmployees: "no",
  entrepreneurWorks: "yes",
  hasVehicles: "no"
}));
assert.ok(!logisticsWithoutVehicles.mandatoryChecks.some((item) => item.id === "traffic"));
assert.ok(!logisticsWithoutVehicles.recommendedCovers.some((item) => item.key === "bizVehicle"));

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
assert.equal(familyPerus.pricingPayload.selectedCoverageLevels.home.selectedKey, "perus");
assert.equal(familyPerus.aiContext.selectedCoverageLevels.home.selectedKey, "perus");
assert.match(familyPerus.contactSummary, /Valittujen laajuuksien suunta/);
assert.match(familyPerus.pricingPayload.disclaimer, /ei ole lopullinen hinta/i);

console.log("Solution engine tests passed");
