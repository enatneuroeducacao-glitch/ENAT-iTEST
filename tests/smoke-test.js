// Execute with: node tests/smoke-test.js
// These static checks do not require dependencies or access to real data.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("assets/app.js", "utf8");
const css = fs.readFileSync("assets/styles.css", "utf8");
const readme = fs.readFileSync("README.md", "utf8");

assert.match(html, /<html lang="pt-BR">/, "Document language should be Brazilian Portuguese");
assert.match(html, /assets\/styles\.css/, "Stylesheet should be linked");
assert.match(html, /assets\/app\.js/, "Application script should be linked");
assert.match(html, /id="records-body"/, "Assessment table should exist");
assert.match(html, /id="create-form"/, "Create assessment form should exist");
assert.match(js, /function navigate\(/, "View navigation should be implemented");
assert.match(js, /function renderRecords\(/, "Demo records should render");
assert.match(js, /addEventListener\("submit"/, "Assessment form should handle submit");
assert.match(js, /replace\(\/\[&<>"/, "Dynamic content should be escaped before insertion");
assert.match(css, /@media\(max-width:720px\)/, "Mobile layout should be defined");
assert.match(css, /:focus-visible/, "Keyboard focus styles should exist");
assert.match(readme, /Dados de demonstração são sintéticos/, "Readme should clarify demo data");
assert.match(readme, /não é ainda uma aplicação pronta para produção/, "Readme should describe current limitations");

console.log("ENAT iTEST smoke checks passed.");
