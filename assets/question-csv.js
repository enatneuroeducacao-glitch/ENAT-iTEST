(() => {
"use strict";
const KEY = "enat-itest-demo-questions-v1";
const $ = (id) => document.getElementById(id);
const columns = ["id","prompt","category","type","options","answer","pairs","expectedAnswer","updated"];
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
function downloadCSV(filename, lines) {
  const blob = new Blob(["\uFEFF" + lines.join("\r\n") + "\r\n"], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportCSV() {
  try {
    const questions = readQuestions();
    if (!questions.length) { notify("Não há questões próprias salvas neste navegador para exportar."); return; }
    const lines = [columns.join(",")];
    questions.forEach((q) => lines.push([
      q.id, q.prompt, q.kind || q.category || "", q.type || "multiple_choice",
      (q.options || []).join("|"), Number.isInteger(q.answer) ? q.answer + 1 : "",
      (q.pairs || []).map((p) => String(p.left || "") + "=>" + String(p.right || "")).join("|"),
      q.expectedAnswer || "", q.updated || ""
    ].map(csvCell).join(",")));
    downloadCSV("enat-itest-banco-questoes-backup.csv", lines);
    notify("Exportação CSV iniciada.");
  } catch (error) { notify("Falha na exportação: " + error.message); }
}
function makeQuestion(record, rowNumber) {
  const type = (record.type || "multiple_choice").trim();
  const options = record.options ? record.options.split("|").map((v) => v.trim()) : [];
  const rawAnswer = (record.answer || "").trim();
  let answer = rawAnswer === "" ? NaN : (/^[A-J]$/i.test(rawAnswer) ? rawAnswer.toUpperCase().charCodeAt(0) - 64 : Number(rawAnswer));
  if (Number.isInteger(answer) && answer >= 1 && answer <= options.length) answer -= 1;
  const pairs = record.pairs ? record.pairs.split("|").map((item) => {
    const i = item.indexOf("=>");
    return i < 0 ? {left:"",right:""} : {left:item.slice(0,i).trim(),right:item.slice(i+2).trim()};
  }) : [];
  const q = {prompt:(record.prompt || "").trim(),kind:(record.category || record.kind || "Educação para o trânsito").trim(),type,options,answer,pairs,expectedAnswer:record.expectedAnswer || "",updated:record.updated || "Importada via CSV"};
  if (!q.prompt) throw new Error("linha " + rowNumber + ": enunciado vazio.");
  if (!allowed.includes(type)) throw new Error("linha " + rowNumber + ": tipo de resposta desconhecido.");
  if (type === "multiple_choice" || type === "true_false") {
    if (options.length < 2 || options.some((v) => !v)) throw new Error("linha " + rowNumber + ": informe pelo menos duas alternativas separadas por |.");
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) throw new Error("linha " + rowNumber + ": gabarito inválido; use 1 para a primeira alternativa, 2 para a segunda, etc.");
    if (type === "true_false" && options.length !== 2) throw new Error("linha " + rowNumber + ": verdadeiro/falso exige exatamente duas alternativas.");
  }
  if (type === "matching" && (pairs.length < 2 || pairs.some((p) => !p.left || !p.right))) throw new Error("linha " + rowNumber + ": associação exige pares no formato esquerda=>direita separados por |.");
  if (type === "short_text" && !q.expectedAnswer.trim()) throw new Error("linha " + rowNumber + ": informe expectedAnswer para resposta curta.");
  return q;
}
function signature(q) {
  return [q.prompt, q.kind || q.category || "", q.type || "multiple_choice", (q.options || []).join("|")].map(v => String(v).trim().toLocaleLowerCase("pt-BR")).join("::");
}
async function importCSV(file) {
  if (!file) return;
  try {
    if (!/\.csv$/i.test(file.name)) throw new Error("selecione um arquivo .csv.");
    if (file.size > 25 * 1024 * 1024) throw new Error("limite de 25 MB por arquivo.");
    const rows = parseCSV((await file.text()).replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new Error("CSV precisa de cabeçalho e ao menos uma questão.");
    const header = rows[0].map((v) => v.trim().toLocaleLowerCase("pt-BR"));
    const missing = ["prompt","type"].filter((v) => !header.includes(v));
    if (missing.length) throw new Error("faltam colunas obrigatórias: " + missing.join(", "));
    const incoming = rows.slice(1).map((row, index) => {
      const record = {}; header.forEach((name, i) => { record[name] = row[i] || ""; });
      return makeQuestion(record, index + 2);
    });
    if (!incoming.length) throw new Error("nenhuma questão válida encontrada.");
    const incomingSignatures = new Set();
    const duplicateRows = [];
    incoming.forEach((q, i) => { const sig = signature(q); if (incomingSignatures.has(sig)) duplicateRows.push(i + 2); incomingSignatures.add(sig); });
    if (duplicateRows.length) throw new Error("há questões duplicadas dentro do CSV, nas linhas: " + duplicateRows.slice(0, 20).join(", ") + (duplicateRows.length > 20 ? "…" : "") + ". Nada foi gravado.");
    const existing = readQuestions();
    const choice = window.prompt(
      "Importação validada: " + incoming.length + " questões.\n\n" +
      "Digite 1 para SUBSTITUIR todo o banco local (um backup CSV será baixado antes).\n" +
      "Digite 2 para ADICIONAR às questões existentes, ignorando duplicadas.\n" +
      "Digite 0 ou cancele para não alterar nada.",
      "1"
    );
    if (choice !== "1" && choice !== "2") { notify("Importação cancelada; banco mantido sem alterações."); return; }
    let target = incoming;
    let skipped = 0;
    if (choice === "2") {
      const signatures = new Set(existing.map(signature));
      target = incoming.filter(q => { const sig = signature(q); if (signatures.has(sig)) { skipped++; return false; } signatures.add(sig); return true; });
      if (!target.length) { notify("Nenhuma questão nova para adicionar; banco mantido."); return; }
    } else if (existing.length) {
      const backupLines = [columns.join(",")];
      existing.forEach((q) => backupLines.push([q.id,q.prompt,q.kind || q.category || "",q.type || "multiple_choice",(q.options || []).join("|"),Number.isInteger(q.answer) ? q.answer + 1 : "",(q.pairs || []).map(p => String(p.left || "") + "=>" + String(p.right || "")).join("|"),q.expectedAnswer || "",q.updated || ""].map(csvCell).join(",")));
      downloadCSV("enat-itest-backup-antes-substituicao-" + new Date().toISOString().slice(0,10) + ".csv", backupLines);
    }
    const maxExistingId = choice === "1" ? 0 : Math.max(0, ...existing.map(q => Number(q.id) || 0));
    const stamp = new Date().toLocaleDateString("pt-BR");
    const imported = target.map((q, i) => {
      const requestedId = choice === "1" ? Number(rows[i + 1] && rows[i + 1][header.indexOf("id")]) : NaN;
      return {...q,id:Number.isSafeInteger(requestedId) && requestedId > 0 && !existing.some(old => old.id === requestedId) ? requestedId : maxExistingId + i + 1,updated:"Importada em " + stamp};
    });
    const finalQuestions = choice === "1" ? imported : existing.concat(imported);
    window.localStorage.setItem(KEY, JSON.stringify(finalQuestions));
    notify(choice === "1" ? "Banco substituído: " + imported.length + " questões. Recarregando." : "Adicionadas " + imported.length + " questões; " + skipped + " duplicadas ignoradas. Recarregando.");
    window.setTimeout(() => window.location.reload(), 900);
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