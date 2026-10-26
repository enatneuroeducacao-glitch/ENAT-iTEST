(() => {
"use strict";
const KEY = "enat-itest-demo-questions-v1";
const $ = (id) => document.getElementById(id);
const columns = ["prompt","category","type","options","answer","pairs","expectedAnswer","updated"];
const allowed = ["multiple_choice","true_false","matching","short_text","essay"];
function notify(message) {
  const toast = $("toast");
  if (!toast) { window.alert(message); return; }
  toast.textContent = message; toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 4500);
}
function readQuestions() {
  const value = window.localStorage.getItem(KEY);
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Banco local inválido.");
  return parsed;
}
function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
function parseCSV(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (quoted) throw new Error("CSV contém aspas não fechadas.");
  if (field.length || row.length) { row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row); }
  return rows;
}
function exportCSV() {
  try {
    const questions = readQuestions();
    if (!questions.length) { notify("Não há questões próprias salvas neste navegador para exportar."); return; }
    const lines = [columns.join(",")];
    questions.forEach((q) => lines.push([
      q.prompt, q.kind, q.type || "multiple_choice", (q.options || []).join("|"),
      Number.isInteger(q.answer) ? q.answer + 1 : "",
      (q.pairs || []).map((p) => String(p.left || "") + "=>" + String(p.right || "")).join("|"),
      q.expectedAnswer || "", q.updated || ""
    ].map(csvCell).join(",")));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n") + "\r\n"], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "enat-itest-banco-questoes.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    notify("Banco de questões exportado em CSV.");
  } catch (error) { notify("Falha na exportação: " + error.message); }
}
function makeQuestion(record, rowNumber) {
  const type = record.type || "multiple_choice";
  const options = record.options ? record.options.split("|").map((v) => v.trim()) : [];
  let answer = record.answer === "" ? NaN : (/^[A-D]$/i.test(record.answer.trim()) ? record.answer.trim().toUpperCase().charCodeAt(0) - 64 : Number(record.answer.trim()));
  if (Number.isInteger(answer) && answer >= 1 && answer <= options.length) answer -= 1;
  const pairs = record.pairs ? record.pairs.split("|").map((item) => {
    const i = item.indexOf("=>");
    return i < 0 ? {left:"",right:""} : {left:item.slice(0,i).trim(),right:item.slice(i+2).trim()};
  }) : [];
  const q = {prompt:record.prompt || "",kind:record.category || "Educação para o trânsito",type,options,answer,pairs,expectedAnswer:record.expectedAnswer || "",updated:record.updated || "Importada via CSV"};
  if (!q.prompt.trim()) throw new Error("linha " + rowNumber + ": enunciado vazio.");
  if (!allowed.includes(type)) throw new Error("linha " + rowNumber + ": tipo de resposta desconhecido.");
  if (type === "multiple_choice" || type === "true_false") {
    if (options.length < 2 || options.some((v) => !v)) throw new Error("linha " + rowNumber + ": informe pelo menos duas alternativas separadas por |.");
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) throw new Error("linha " + rowNumber + ": gabarito inválido: use 1 para a primeira alternativa, 2 para a segunda, etc.");
    if (type === "true_false" && options.length !== 2) throw new Error("linha " + rowNumber + ": verdadeiro/falso exige exatamente duas alternativas.");
  }
  if (type === "matching" && (pairs.length < 2 || pairs.some((p) => !p.left || !p.right))) throw new Error("linha " + rowNumber + ": associação exige pares no formato esquerda=>direita separados por |.");
  if (type === "short_text" && !q.expectedAnswer.trim()) throw new Error("linha " + rowNumber + ": informe expectedAnswer para resposta curta.");
  return q;
}
async function importCSV(file) {
  if (!file) return;
  try {
    if (!/\.csv$/i.test(file.name)) throw new Error("selecione um arquivo .csv.");
    if (file.size > 2 * 1024 * 1024) throw new Error("limite de 2 MB por arquivo.");
    const rows = parseCSV((await file.text()).replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new Error("CSV precisa de cabeçalho e ao menos uma questão.");
    const header = rows[0].map((v) => v.trim());
    const missing = ["prompt","category","type"].filter((v) => !header.includes(v));
    if (missing.length) throw new Error("faltam colunas obrigatórias: " + missing.join(", "));
    const incoming = rows.slice(1).map((row, index) => {
      const record = {}; header.forEach((name, i) => { record[name] = row[i] || ""; });
      return makeQuestion(record, index + 2);
    });
    if (incoming.length > 2000) throw new Error("limite de 2.000 questões por arquivo.");
    const existing = readQuestions();
    const nextId = Math.max(3, ...existing.map((q) => Number(q.id) || 0)) + 1;
    const stamp = new Date().toLocaleDateString("pt-BR");
    const imported = incoming.map((q, i) => ({...q,id:nextId+i,updated:"Importada em " + stamp}));
    window.localStorage.setItem(KEY, JSON.stringify(existing.concat(imported)));
    notify(imported.length + " questão(ões) importada(s) do CSV. Atualizando a página.");
    window.setTimeout(() => window.location.reload(), 800);
  } catch (error) { notify("Importação cancelada; nada foi gravado. " + error.message); }
  finally { const input = $("import-questions-file"); if (input) input.value = ""; }
}
document.addEventListener("DOMContentLoaded", () => {
  const exportButton = $("export-questions"), importButton = $("import-questions-button"), input = $("import-questions-file");
  if (exportButton) exportButton.addEventListener("click", exportCSV);
  if (importButton && input) importButton.addEventListener("click", () => input.click());
  if (input) input.addEventListener("change", (event) => importCSV(event.target.files && event.target.files[0]));
});
})();