import { insuranceTypes } from "../src/data.js";

const timeoutMs = Number(process.env.LINK_TIMEOUT_MS || 12000);
const links = [];

for (const [profileId, types] of Object.entries(insuranceTypes)) {
  for (const [key, item] of Object.entries(types)) {
    for (const material of item.materials || []) {
      links.push({
        profileId,
        key,
        title: item.title,
        label: material.label,
        url: material.url
      });
    }
  }
}

const uniqueLinks = [...new Map(links.map((item) => [item.url, item])).values()];
const failures = [];

for (const link of uniqueLinks) {
  const result = await checkLink(link.url);
  if (!result.ok) failures.push({ ...link, ...result });
  console.log(`${result.ok ? "OK  " : "FAIL"} ${result.status || "-"} ${link.label} ${link.url}`);
}

if (failures.length) {
  console.error("\nBroken or unreachable links:");
  failures.forEach((item) => {
    console.error(`- ${item.title} / ${item.label}: ${item.status || item.error} ${item.url}`);
  });
  process.exitCode = 1;
} else {
  console.log(`\nAll ${uniqueLinks.length} material links responded successfully.`);
}

async function checkLink(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: error.name || error.message };
  } finally {
    clearTimeout(timer);
  }
}
