import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const runtimeErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => runtimeErrors.push(error.message));
virtualConsole.on("error", (message) => runtimeErrors.push(String(message)));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://127.0.0.1:4173/",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  }
});

if (dom.window.document.readyState !== "complete") {
  await new Promise((resolve) => dom.window.addEventListener("load", resolve, { once: true }));
}

const { document } = dom.window;
document.querySelector("#startAssessment").click();

for (let index = 0; index < 20 && document.querySelector("#resultsView").classList.contains("hidden"); index += 1) {
  const option = [...document.querySelectorAll("#answerList .answer-option")]
    .find((item) => !item.disabled && !item.classList.contains("hidden"));
  assert.ok(option, `Kartoituksen kysymyksestä ${index + 1} puuttuu vastausvaihtoehto`);
  option.click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  const next = document.querySelector("#questionNext");
  if (next && !next.classList.contains("hidden")) next.click();
  await new Promise((resolve) => setTimeout(resolve, 520));
}

assert.equal(document.querySelector("#resultsView").classList.contains("hidden"), false, "Kartoituksen pitää päättyä tuloksiin");
const compareButton = document.querySelector(".product-rec-card [data-card-refine]");
assert.ok(compareButton, "Tuloksissa pitää olla vakuutuskohtainen Vertaa turvia -painike");
compareButton.click();

assert.equal(document.querySelector("#detailView").classList.contains("hidden"), true, "Vertailu ei saa avata lisäkysymyksiä");
assert.equal(document.querySelector("#detailResultView").classList.contains("hidden"), false, "Vertailun pitää avautua suoraan");
assert.ok(document.querySelector(".coverage-compare"));
assert.ok(document.querySelector(".coverage-feature-detail"));
assert.equal(document.querySelector(".coverage-choice-grid"), null);
assert.equal(document.querySelector(".coverage-selection-note"), null);
assert.doesNotMatch(document.querySelector("#detailResultView").textContent, /Miksi tämä ehdotus syntyi|Mitä vakuutus yleisesti tekee/);
assert.deepEqual(runtimeErrors, []);

dom.window.close();
console.log("Direct comparison UI test passed");
