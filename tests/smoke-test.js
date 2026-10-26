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
assert.match(html, /id="question-form"/, "Question creation form should exist");
assert.match(html, /id="question-dialog"/, "Question editor must use its own dialog");
assert.match(html, /id="create-dialog"/, "Assessment creation must use a separate dialog");
assert.match(html, /assets\/app\.js\?v=20261026-4/, "Published app script should use a cache-busting version");
assert.match(html, /assets\/styles\.css\?v=20261026-4/, "Published stylesheet should use a cache-busting version");
assert.match(html, /Salvar questão/, "Question form should have a question-specific save action");
assert.match(html, /id="question-type"/, "Question response type selector should exist");
assert.match(html, /id="question-type-fields"/, "Dynamic question fields should exist");
assert.match(js, /function renderQuestionTypeFields\(/, "Dynamic question type fields should render");
assert.match(js, /function readQuestionTypeFields\(/, "Question types should validate their own fields");
assert.match(js, /Adicionar alternativa/, "Multiple choice questions should allow more alternatives");
assert.match(js, /true_false/, "True/false questions should be supported");
assert.match(js, /matching/, "Matching questions should be supported");
assert.match(js, /function navigate\(/, "View navigation should be implemented");
assert.match(js, /function renderRecords\(/, "Demo records should render");
assert.match(js, /activeView === "classes" \? "♧ Gerenciar turma"/, "Primary action should reflect the selected section");
assert.match(js, /O cadastro de turmas e alunos ainda não está implementado/, "Class action should not open the assessment form");
assert.match(js, /addEventListener\("submit"/, "Assessment form should handle submit");
assert.match(js, /questionStorageKey/, "Demo questions should use a separate local storage key");
assert.match(js, /saveDemoQuestions\(/, "Question form should persist demo questions locally");
assert.match(js, /replace\(\/\[&<>"/, "Dynamic content should be escaped before insertion");
assert.match(css, /@media\(max-width:720px\)/, "Mobile layout should be defined");
assert.match(css, /:focus-visible/, "Keyboard focus styles should exist");
assert.match(readme, /[Dd]ados de demonstração são sintéticos/, "Readme should clarify demo data");
assert.match(readme, /[Nn]ão é ainda uma aplicação pronta para produção/, "Readme should describe current limitations");

console.log("ENAT iTEST smoke checks passed.");

const backup = fs.readFileSync("assets/question-backup.js", "utf8");
assert.match(backup, /function exportQuestions\\(/, "Question bank should support JSON export");
assert.match(backup, /async function importQuestions\\(/, "Question bank should support JSON import");
assert.match(backup, /validateQuestion\\(/, "Imported questions should be validated before storage");
