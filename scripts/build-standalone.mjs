import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const src = (file) => readFileSync(join(root, file), "utf8");

const html = src("index.html");
const css = src("src/styles.css");
const jsFiles = [
  "src/data.js",
  "src/scoring.js",
  "src/detailResults.js",
  "src/analytics.js",
  "src/app.js"
];

const bundledJs = jsFiles.map((file) => {
  const content = src(file)
    .replace(/^import .*?;\r?\n/gm, "")
    .replace(/^export /gm, "");
  return `\n/* ${file} */\n${content}`;
}).join("\n");

const standalone = html
  .replace('<link rel="stylesheet" href="./src/styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/app.js"></script>', `<script>\n${bundledJs}\n</script>`);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "preview.html"), standalone, "utf8");
console.log("dist/preview.html created");
