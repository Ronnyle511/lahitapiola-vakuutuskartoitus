import { insuranceTypes, quickQuestions } from "./data.js";

const PRIMARY_LIMIT = 7;
const POSSIBLE_LIMIT = 3;

export function calculateScores(profileId, answers = {}) {
  const types = insuranceTypes[profileId];
  const scores = Object.fromEntries(
    Object.keys(types).map((key) => [key, { key, score: 0, reasons: [], existing: false }])
  );

  for (const question of quickQuestions[profileId]) {
    const selected = toArray(answers[question.id]);
    for (const value of selected) {
      const option = question.options.find((item) => item.value === value);
      if (!option) continue;

      for (const key of option.existing || []) {
        if (scores[key]) scores[key].existing = true;
      }

      for (const [key, entry] of Object.entries(option.scores || {})) {
        if (!scores[key]) continue;
        scores[key].score += entry.points || 0;
        if (entry.reason && !scores[key].reasons.includes(entry.reason)) {
          scores[key].reasons.push(entry.reason);
        }
      }
    }
  }

  const items = Object.values(scores)
    .map((item) => ({
      ...item,
      bucket: bucketFor(item.score)
    }))
    .sort((a, b) => b.score - a.score || types[a.key].title.localeCompare(types[b.key].title, "fi"));

  return {
    items,
    primary: items.filter((item) => item.bucket === "primary"),
    possible: items.filter((item) => item.bucket === "possible"),
    notNow: items.filter((item) => item.bucket === "notNow"),
    existingCoverage: items.filter((item) => item.existing).map((item) => item.key)
  };
}

export function bucketFor(score) {
  if (score >= PRIMARY_LIMIT) return "primary";
  if (score >= POSSIBLE_LIMIT) return "possible";
  return "notNow";
}

export function recommendedKeys(recommendation) {
  return recommendation.items
    .filter((item) => item.score >= POSSIBLE_LIMIT)
    .map((item) => item.key);
}

export function toArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}
