(() => {
  "use strict";
  const KEY = "enat-itest-demo-questions-v1";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function notify(message) {
    const toast = $("toast");
    if (toast) { toast.textContent = message; toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 4500); }
    else window.alert(message);
  }
  function answerLabel(q) {
    if (q.type === "true_false") return Number(q.answer) === 0 ? "Verdadeiro" : "Falso";
    if (q.type === "multiple_choice" || !q.type) return "Alternativa " + String.fromCharCode(65 + (Number(q.answer) || 0));
    if (q.type === "matching") return (q.pairs || []).map(p => p.left + " → " + p.right).join("; ");
    return q.expectedAnswer || (q.type === "essay" ? "Correção manual" : "Resposta não cadastrada");
  }
  function optionsHtml(q) {
    if (q.type === "matching") return '<ol>' + (q.pairs || []).map(p => '<li>' + esc(p.left) + ' — ' + esc(p.right) + '</li>').join("") + '</ol>';
    if (q.type === "multiple_choice" || q.type === "true_false" || !q.type) return '<ol type="A">' + (q.options || []).map(o => '<li>' + esc(o) + '</li>').join("") + '</ol>';
    return q.type === "essay" ? '<div class="essay-lines"></div>' : '<div class="short-lines"></div>';
  }
  function printBank() {
    let questions;
    try { questions = JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch (_) { questions = []; }
    if (!Array.isArray(questions) || !questions.length) return notify("Não há questões cadastradas para exportar em PDF.");
    const now = new Date().toLocaleDateString("pt-BR");
    const questionPages = questions.map((q, i) => '<section class="question"><div class="question-meta"><span>QUESTÃO ' + (i + 1) + '</span><span>' + esc(q.kind || q.category || "Sem categoria") + '</span></div><h2>' + esc(q.prompt) + '</h2>' + optionsHtml(q) + '</section>').join("");
    const keyRows = questions.map((q, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(q.prompt) + '</td><td>' + esc(q.kind || q.category || "") + '</td><td>' + esc(answerLabel(q)) + '</td></tr>').join("");
    const payload = JSON.stringify({app:"ENAT-iTEST",format:"question-bank",version:1,count:questions.length});
    const qr = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(payload);
    const win = window.open("", "_blank");
    if (!win) return notify("Permita pop-ups para gerar o documento de impressão.");
    win.document.open();
    win.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>ENAT iTEST — Banco de questões</title><style>' +
      '@page{size:A4;margin:16mm}body{font:11pt Arial,sans-serif;color:#172536;margin:0}header{border-bottom:2px solid #173c5a;padding-bottom:12px;margin-bottom:18px}header h1{font-size:21pt;margin:0 0 8px}header p{margin:4px 0;color:#45576a}.qr{float:right;text-align:center;font-size:8pt}.qr img{width:82px;height:82px}.question{break-inside:avoid;margin:0 0 24px;padding-bottom:12px;border-bottom:1px solid #d6dde5}.question-meta{display:flex;justify-content:space-between;color:#526d84;font-size:8pt;font-weight:bold;letter-spacing:.06em}.question h2{font-size:12pt;line-height:1.45;margin:8px 0}li{margin:6px 0;line-height:1.35}.short-lines{height:55px;border-bottom:1px solid #999}.essay-lines{height:120px;background:repeating-linear-gradient(transparent 0,transparent 23px,#bbb 24px)}.answer-key{break-before:page}table{width:100%;border-collapse:collapse;font-size:9pt}th,td{border:1px solid #cbd5df;padding:7px;text-align:left;vertical-align:top}th{background:#edf2f7}.footer{margin-top:18px;color:#657789;font-size:8pt}@media print{.no-print{display:none}}' +
      '</style></head><body><header><div class="qr"><img alt="QR de identificação do arquivo" src="' + qr + '"><div>Identificação do banco</div></div><h1>ENAT iTEST</h1><h2>Banco de questões</h2><p>Questões cadastradas: ' + questions.length + ' · Gerado em ' + now + '</p><p>Documento para revisão, aplicação e arquivo. Confira o conteúdo antes de utilizar em avaliações oficiais.</p><div style="clear:both"></div></header>' + questionPages +
      '<section class="answer-key"><h1>Gabarito de respostas — uso do aplicador</h1><p>Documento reservado para correção. Não entregar junto à prova do participante.</p><table><thead><tr><th>Nº</th><th>Enunciado</th><th>Categoria</th><th>Resposta / critério</th></tr></thead><tbody>' + keyRows + '</tbody></table></section><p class="footer">O QR identifica este banco e a versão do documento; ele não contém respostas marcadas nem realiza correção automática.</p><script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script></body></html>');
    win.document.close();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const button = $("export-questions-pdf");
    if (button) button.addEventListener("click", printBank);
  });
})();