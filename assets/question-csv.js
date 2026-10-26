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
function showImportDialog({fileName,incomingCount,existingCount,duplicateRows,incoming,categoryCounts}) {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.className = "dialog csv-import-dialog";
    dialog.style.maxWidth = "760px";
    dialog.style.width = "min(760px, calc(100vw - 32px))";
    const duplicateList = duplicateRows.length
      ? '<div class="csv-duplicate-list"><strong>Linhas duplicadas no arquivo ('+duplicateRows.length+')</strong><p>'+duplicateRows.slice(0,30).map(n=>'Linha '+n).join(' · ')+(duplicateRows.length>30?' · …':'')+'</p><small>Na substituição, apenas uma ocorrência de cada questão idêntica será mantida.</small></div>'
      : '<p class="csv-good">Nenhuma duplicidade exata interna detectada.</p>';
    const categoryRows = Object.entries(categoryCounts).sort((a,b)=>a[0].localeCompare(b[0],"pt-BR")).map(([name,count])=>'<li><span>'+escapeHtml(name)+'</span><b>'+count+'</b></li>').join("");
    const errors = [];
    incoming.forEach((q,i)=>{ if(!q.prompt.trim()) errors.push("Linha "+(i+2)+": enunciado vazio"); });
    dialog.innerHTML = '<form method="dialog" class="csv-import-form"><div class="dialog-head"><div><h2>Importar banco de questões</h2><p class="dialog-description">'+escapeHtml(fileName)+'</p></div><button class="icon-button" value="cancel" aria-label="Fechar">×</button></div>'+
      '<div class="csv-summary-grid"><div><small>Questões válidas</small><strong>'+incomingCount+'</strong></div><div><small>Banco local atual</small><strong>'+existingCount+'</strong></div><div><small>Duplicidades no CSV</small><strong>'+duplicateRows.length+'</strong></div></div>'+
      '<h3>Categorias identificadas</h3><ul class="csv-category-list">'+categoryRows+'</ul>'+duplicateList+
      (errors.length?'<div class="csv-error-list"><strong>Erros de validação</strong><p>'+errors.map(escapeHtml).join("<br>")+'</p></div>':'')+
      '<fieldset class="csv-import-options"><legend>Como deseja importar?</legend><label><input type="radio" name="csv-mode" value="replace" checked><span><b>Substituir banco local</b><small>Troca as questões locais pelas validadas neste CSV. Será baixado um backup antes da alteração.</small></span></label><label><input type="radio" name="csv-mode" value="append"><span><b>Adicionar às questões existentes</b><small>Preserva as questões atuais e inclui apenas questões novas. Duplicidades bloqueiam a operação.</small></span></label></fieldset>'+
      '<label class="csv-confirm"><input type="checkbox" id="csv-confirm-check"><span>Confirmo que revisei o resumo e autorizo a gravação <b>somente neste navegador</b>.</span></label>'+
      '<p class="dialog-description">Nenhum banco de produção ou servidor será alterado. Se a validação falhar, nada será gravado.</p>'+
      '<div class="dialog-actions"><button class="secondary-button" value="cancel">Cancelar</button><button class="primary-button" id="csv-confirm-import" value="confirm" disabled>Confirmar importação</button></div></form>';
    document.body.appendChild(dialog);
    const check=dialog.querySelector("#csv-confirm-check"), confirm=dialog.querySelector("#csv-confirm-import");
    check.addEventListener("change",()=>confirm.disabled=!check.checked);
    dialog.addEventListener("close",()=>{const result=dialog.returnValue==="confirm"&&check.checked?dialog.querySelector('input[name="csv-mode"]:checked').value:null;dialog.remove();resolve(result);});
    if(typeof dialog.showModal==="function") dialog.showModal(); else { dialog.remove(); resolve(null); }
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
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
    const existing = readQuestions();
    const prefixCategories = {
      DD:"Direção Defensiva", LT:"Legislação de Trânsito", CRT:"Crime de Trânsito",
      INF:"Infração", NGCC:"Normas Gerais de Circulação e Conduta", SIN:"Sinalização",
      PS:"Primeiros Socorros", CID:"Cidadania", MEI:"Meio Ambiente", MEC:"Mecânica Básica",
      RI:"Relacionamento Interpessoal", PST:"Psicologia de Trânsito", PRA:"Prática de Direção",
      ENGT:"Engenharia de Tráfego", DID:"Didática"
    };
    const categoryCounts = {};
    incoming.forEach((q, index) => {
      const sourceId = (rows[index + 1] || [])[header.indexOf("id")] || "";
      const prefix = Object.keys(prefixCategories).sort((a,b)=>b.length-a.length).find(code => new RegExp("^"+code+"\\d","i").test(sourceId.trim()));
      const category = prefix ? prefixCategories[prefix] : (q.kind || "Sem categoria identificada");
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      if (prefix) q.kind = category;
    });
    const choice = await showImportDialog({
      fileName:file.name, incomingCount:incoming.length, existingCount:existing.length,
      duplicateRows, incoming, categoryCounts
    });
    if (choice !== "replace" && choice !== "append") { notify("Importação cancelada; banco mantido sem alterações."); return; }
    let target = incoming;
    let skipped = 0;
    if (choice === "replace") {
      const signatures = new Set();
      target = incoming.filter(q => { const sig = signature(q); if (signatures.has(sig)) { skipped++; return false; } signatures.add(sig); return true; });
    }
    if (choice === "append" && duplicateRows.length) throw new Error("há questões duplicadas dentro do CSV, nas linhas: " + duplicateRows.slice(0, 20).join(", ") + (duplicateRows.length > 20 ? "…" : "") + ". Use SUBSTITUIR para importar sem duplicadas ou corrija o arquivo.");
    if (choice === "append") {
      const signatures = new Set(existing.map(signature));
      target = incoming.filter(q => { const sig = signature(q); if (signatures.has(sig)) { skipped++; return false; } signatures.add(sig); return true; });
      if (!target.length) { notify("Nenhuma questão nova para adicionar; banco mantido."); return; }
    } else if (existing.length) {
      const backupLines = [columns.join(",")];
      existing.forEach((q) => backupLines.push([q.id,q.prompt,q.kind || q.category || "",q.type || "multiple_choice",(q.options || []).join("|"),Number.isInteger(q.answer) ? q.answer + 1 : "",(q.pairs || []).map(p => String(p.left || "") + "=>" + String(p.right || "")).join("|"),q.expectedAnswer || "",q.updated || ""].map(csvCell).join(",")));
      downloadCSV("enat-itest-backup-antes-substituicao-" + new Date().toISOString().slice(0,10) + ".csv", backupLines);
    }
    const maxExistingId = choice === "replace" ? 0 : Math.max(0, ...existing.map(q => Number(q.id) || 0));
    const stamp = new Date().toLocaleDateString("pt-BR");
    const imported = target.map((q, i) => {
      const requestedId = NaN;
      return {...q,id:Number.isSafeInteger(requestedId) && requestedId > 0 && !existing.some(old => old.id === requestedId) ? requestedId : maxExistingId + i + 1,updated:"Importada em " + stamp};
    });
    const finalQuestions = choice === "replace" ? imported : existing.concat(imported);
    window.localStorage.setItem(KEY, JSON.stringify(finalQuestions));
    notify(choice === "replace" ? "Banco substituído: " + imported.length + " questões; " + skipped + " duplicadas do CSV ignoradas. Recarregando." : "Adicionadas " + imported.length + " questões; " + skipped + " duplicadas ignoradas. Recarregando.");
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