(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const demoStorageKey = "enat-itest-assessments-v2";
  const questionStorageKey = "enat-itest-demo-questions-v1";
  // Catálogo inicia vazio: não exibir questões fictícias como conteúdo real.
  const demoQuestions = [];
  try {
    const savedQuestions = JSON.parse(window.localStorage.getItem(questionStorageKey) || "[]");
    if (Array.isArray(savedQuestions)) savedQuestions.filter((q) => q && typeof q.prompt === "string" && Number.isInteger(q.id)).forEach((q) => demoQuestions.push(q));
  } catch (_) {}
  let nextQuestionId = Math.max(0, ...demoQuestions.map((q) => Number(q.id) || 0)) + 1;
  // Não criar avaliações fictícias nem atribuir questões inexistentes a categorias.
  const records = [];
  // Persist only records explicitly created in this browser demo; never store student or sensitive data.
  try {
    const saved = JSON.parse(window.localStorage.getItem(demoStorageKey) || "[]");
    if (Array.isArray(saved)) {
      saved.filter((item) => item && typeof item.name === "string" && Number.isInteger(item.id)).forEach((item) => records.push(item));
    }
  } catch (_) {
    // Storage may be disabled or contain invalid data; the demo remains usable in memory.
  }
  let nextId = Math.max(0, ...records.map((record) => Number(record.id) || 0)) + 1;
  function saveDemoQuestions() {
    try {
      window.localStorage.setItem(questionStorageKey, JSON.stringify(demoQuestions));
      return true;
    } catch (_) {
      notify("Não foi possível salvar a questão neste navegador.");
      return false;
    }
  }
  function saveDemoRecords() {
    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify(records));
      return true;
    } catch (_) {
      notify("Não foi possível salvar a avaliação neste navegador.");
      return false;
    }
  }
  let activeView = "overview";
  let questionSearch = "";
  let questionCategory = "";
  let toastTimer;
  const views = {
    overview: { title: "Visão geral", headline: "Bom dia. Vamos aprender melhor.", subtitle: "Acompanhe suas avaliações e organize o próximo passo do aprendizado.", section: "Avaliações recentes", description: "Organize, revise e prepare atividades de aprendizagem." },
    questions: { title: "Banco de questões", headline: "Banco de questões", subtitle: "Organize questões, categorias e conteúdos para futuras avaliações.", section: "Banco de questões", description: "Cadastre questões ou importe um arquivo CSV validado." },
    exams: { title: "Avaliações", headline: "Avaliações", subtitle: "Crie e organize avaliações para diferentes objetivos de aprendizagem.", section: "Avaliações cadastradas", description: "Avaliações criadas neste navegador." },
    classes: { title: "Turmas e alunos", headline: "Turmas e alunos", subtitle: "Prepare a organização de grupos para futuras avaliações.", section: "Turmas e alunos", description: "A gestão de turmas e alunos ainda não está disponível." },
    results: { title: "Resultados", headline: "Resultados de aprendizagem", subtitle: "Acompanhe indicadores ilustrativos sem expor dados pessoais.", section: "Resultados", description: "Os resultados serão exibidos quando houver tentativas reais registradas." },
    reports: { title: "Relatórios", headline: "Relatórios", subtitle: "Planeje análises de desempenho e acompanhamento educacional.", section: "Relatórios", description: "Relatórios disponíveis após a implementação dos registros de avaliação." }
  };
  function notify(message) {
    const toast = byId("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 5000);

    // Native dialogs render in the browser's top layer, above ordinary fixed toasts.
    // Mirror notifications inside the open dialog so validation errors stay visible.
    const openDialog = document.querySelector("dialog[open]");
    if (openDialog) {
      let feedback = openDialog.querySelector(".dialog-feedback");
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "dialog-feedback";
        feedback.setAttribute("role", "alert");
        feedback.setAttribute("aria-live", "assertive");
        const form = openDialog.querySelector("form");
        if (form) form.insertBefore(feedback, form.firstChild);
        else openDialog.insertBefore(feedback, openDialog.firstChild);
      }
      feedback.textContent = message;
      feedback.classList.add("visible");
      feedback.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
  function safeText(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function renderRecords() {
    const body = byId("records-body");
    body.replaceChildren();
    if (activeView === "questions") {
      const filteredQuestions = demoQuestions.filter((question) => {
        const query = questionSearch.trim().toLocaleLowerCase("pt-BR");
        const matchesQuery = !query || question.prompt.toLocaleLowerCase("pt-BR").includes(query) || question.kind.toLocaleLowerCase("pt-BR").includes(query);
        return matchesQuery && (!questionCategory || question.kind === questionCategory);
      });
      filteredQuestions.forEach((question) => {
        const tr = document.createElement("tr");
        const answer = question.type === "matching" ? "Relação de pares" : question.type === "short_text" ? (question.expectedAnswer || "Resposta curta") : question.type === "essay" ? "Correção manual" : (question.options || [])[question.answer] || "";
        const typeLabel = ({multiple_choice:"Múltipla escolha",true_false:"Verdadeiro/Falso",matching:"Relação",short_text:"Resposta curta",essay:"Discursiva"})[question.type || "multiple_choice"];
        const countLabel = question.type === "true_false" ? "2 opções" : question.type === "matching" ? ((question.pairs||[]).length+" pares") : question.type === "short_text" || question.type === "essay" ? "Texto livre" : ((question.options||[]).length+" alternativas");
        const answerLabel = question.type === "true_false" ? (question.answer===0?"Verdadeiro":"Falso") : question.type === "multiple_choice" || !question.type ? ("Gabarito "+String.fromCharCode(65+(question.answer||0))) : question.type === "matching" ? "Pares cadastrados" : question.type === "short_text" ? "Resposta esperada" : "Correção manual";
        tr.innerHTML = '<td><div class="exam-name"><span class="exam-type">▤</span><span><strong>' + safeText(question.prompt) + '</strong><small>' + safeText(question.kind) + ' · ' + typeLabel + '</small></span></div></td><td><span class="option-summary">' + countLabel + '</span></td><td><span class="status ready">' + safeText(answerLabel) + '</span><small class="answer-preview">' + safeText(answer) + '</small></td><td>' + safeText(question.updated || "Exemplo") + '</td><td class="question-row-actions"><button class="row-menu" aria-label="Editar questão" data-question-edit="' + question.id + '">Editar</button><button class="row-menu danger-action" aria-label="Excluir questão" data-question-delete="' + question.id + '">Excluir</button></td>';
        body.appendChild(tr);
      });
      body.querySelectorAll("[data-question-edit]").forEach((button) => button.addEventListener("click", () => editQuestion(Number(button.dataset.questionEdit))));
      body.querySelectorAll("[data-question-delete]").forEach((button) => button.addEventListener("click", () => deleteQuestion(Number(button.dataset.questionDelete))));
    } else {
      let list = records;
      if (activeView === "classes") {
        list = [];
      } else if (activeView === "results") {
        list = [];
      } else if (activeView === "reports") {
        list = [];
      }
      list.forEach((record) => {
        const tr = document.createElement("tr");
        const questionCount = Array.isArray(record.questionIds) ? record.questionIds.length : record.questions;
        const isEditableAssessment = activeView === "exams" && record.id < 100;
        tr.innerHTML = '<td><div class="exam-name"><span class="exam-type">▣</span><span><strong>' + safeText(record.name) + '</strong><small>' + safeText(record.kind) + '</small></span></div></td><td>' + safeText(questionCount) + '</td><td><span class="status ' + safeText(record.status) + '">' + safeText(record.statusLabel) + '</span></td><td>' + safeText(record.updated || "—") + '</td><td class="assessment-actions">' + (activeView === "exams" ? '<button class="row-menu" data-manage-assessment="' + record.id + '">Questões</button><button class="row-menu" data-print-exam="' + record.id + '">Imprimir prova</button><button class="row-menu" data-print-sheet="' + record.id + '">Folha respostas</button><button class="row-menu" data-print-key="' + record.id + '">Gabarito</button><button class="row-menu" data-export-assessment="' + record.id + '">Exportar CSV</button><label class="qr-option"><input type="checkbox" data-qr-toggle="' + record.id + '"> QR</label>' : '<button class="row-menu" data-record="' + record.id + '">•••</button>') + '</td>';
        body.appendChild(tr);
      });
      body.querySelectorAll("[data-record]").forEach((button) => button.addEventListener("click", () => notify("Não há ações disponíveis para este registro.")));
      body.querySelectorAll("[data-manage-assessment]").forEach((button) => button.addEventListener("click", () => manageAssessmentQuestions(Number(button.dataset.manageAssessment))));
      body.querySelectorAll("[data-print-exam]").forEach(b=>b.addEventListener("click",()=>printAssessment(Number(b.dataset.printExam),"exam",!!body.querySelector('[data-qr-toggle="'+b.dataset.printExam+'"]')?.checked)));
      body.querySelectorAll("[data-print-sheet]").forEach(b=>b.addEventListener("click",()=>printAssessment(Number(b.dataset.printSheet),"sheet",!!body.querySelector('[data-qr-toggle="'+b.dataset.printSheet+'"]')?.checked)));
      body.querySelectorAll("[data-print-key]").forEach(b=>b.addEventListener("click",()=>printAssessment(Number(b.dataset.printKey),"key",!!body.querySelector('[data-qr-toggle="'+b.dataset.printKey+'"]')?.checked)));
      body.querySelectorAll("[data-export-assessment]").forEach(b=>b.addEventListener("click",()=>exportAssessmentCSV(Number(b.dataset.exportAssessment))));
    }
    byId("empty-state").classList.toggle("hidden", body.children.length > 0);
    if (activeView === "questions" && body.children.length === 0) {
      byId("empty-state").querySelector("strong").textContent = "Nenhuma questão encontrada";
      byId("empty-state").querySelector("span").textContent = "Ajuste a pesquisa ou o filtro, ou cadastre uma nova questão.";
    } else {
      byId("empty-state").querySelector("strong").textContent = "Nenhum registro nesta visualização";
      byId("empty-state").querySelector("span").textContent = activeView === "classes" ? "O módulo de turmas e alunos ainda não foi implementado." : activeView === "results" ? "Nenhuma tentativa ou resultado real foi registrado." : activeView === "reports" ? "Não há dados suficientes para gerar relatórios." : "Crie uma avaliação para que ela apareça nesta lista.";
    }
    byId("question-tools").classList.toggle("hidden", activeView !== "questions");
    byId("view-all").classList.toggle("hidden", activeView === "questions");
    byId("new-exam").textContent = activeView === "questions" ? "＋ Nova questão" : activeView === "classes" ? "♧ Gerenciar turma" : activeView === "results" ? "⌁ Ver resultados" : activeView === "reports" ? "▥ Abrir relatórios" : "＋ Criar avaliação";
    byId("metric-exams").textContent = String(records.length);
    byId("metric-questions").textContent = String(demoQuestions.length);
    byId("question-nav-count").textContent = String(demoQuestions.length);
    byId("exam-nav-count").textContent = String(records.length);
  }


  function assessmentQuestions(record){return (Array.isArray(record.questionIds)?record.questionIds:[]).map(id=>demoQuestions.find(q=>q.id===id)).filter(Boolean);}
  function shuffled(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function questionSetSignature(ids) {
    return ids.map(Number).sort((a, b) => a - b).join(",");
  }
  function normalizeCategory(value) {
    return String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }
  function categoryGroup(value) {
    const category = normalizeCategory(value);
    const groups = [
      ["legislacao de transito", "legislacao", "codigo de transito", "ctb", "normas gerais de circulacao e conduta"],
      ["infracoes de transito", "infracao de transito", "infracoes", "infracao", "penalidades e medidas administrativas", "crime de transito"],
      ["direcao defensiva", "conducao defensiva"],
      ["primeiros socorros", "atendimento pre hospitalar"],
      ["meio ambiente e cidadania", "meio ambiente", "cidadania", "convivencia social"],
      ["sinalizacao viaria", "sinalizacao", "placas de transito"],
      ["mecanica basica e manutencao", "mecanica basica", "manutencao veicular"],
      ["equipamentos obrigatorios e seguranca", "equipamentos obrigatorios", "seguranca veicular"],
      ["conduta em situacoes de risco", "situacoes de risco", "prevencao de acidentes"],
      ["mobilidade urbana e vulneraveis", "mobilidade urbana", "usuarios vulneraveis"],
      ["formacao de condutores", "pratica de direcao", "habilitacao"],
      ["conhecimentos gerais", "educacao para o transito", "educacao no transito", "seguranca no transito"]
    ];
    for (const group of groups) {
      if (group.some((item) => category === item || category.includes(item) || item.includes(category))) return group[0];
    }
    return category;
  }
  function questionMatchesSelectedCategories(question, subjects) {
    const selected = new Set(subjects.map(categoryGroup));
    const values = [question.kind, question.category, question.subject, question.subcategory, question.topic, question.discipline, question.area, question.assunto];
    return values.some((value) => typeof value === "string" && value.trim() && selected.has(categoryGroup(value)));
  }
  function drawUniqueQuestions(subjects, count, editingId = 0, reservedSignatures = []) {
    const pool = demoQuestions.filter((question) => Number.isInteger(question.id) && questionMatchesSelectedCategories(question, subjects));
    if (pool.length < count) {
      const total = demoQuestions.length;
      const availableCategories = [...new Set(demoQuestions.flatMap((question) =>
        [question.kind, question.category, question.subject, question.subcategory, question.topic]
          .filter((value) => typeof value === "string" && value.trim())
      ))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      const categorySummary = availableCategories.length
        ? " Categorias existentes no banco: " + availableCategories.slice(0, 12).join(", ") + (availableCategories.length > 12 ? "…" : "") + "."
        : " As questões não possuem campos de categoria reconhecidos.";
      const reason = total === 0
        ? "Este navegador não tem questões carregadas. O banco central ainda não está conectado a esta versão do ENAT iTEST; importe o arquivo CSV do banco em Banco de questões ou conecte a fonte de dados antes de montar a prova."
        : "Há " + total + " questão(ões) carregadas neste navegador, mas somente " + pool.length + " correspondem às categorias selecionadas. Confira a classificação importada.";
      return { error: reason + categorySummary + " Encontradas nas categorias selecionadas: " + pool.length + "; necessárias: " + count + "." };
    }
    const usedSets = new Set(records.filter((record) => record.id !== editingId).map((record) => questionSetSignature(record.questionIds || [])));
    reservedSignatures.forEach((signature) => usedSets.add(signature));
    const availableSignatures = new Set();
    for (let attempt = 0; attempt < 300; attempt++) {
      const selection = shuffled(pool).slice(0, count);
      const ids = selection.map((question) => question.id);
      const signature = questionSetSignature(ids);
      if (!usedSets.has(signature) && !availableSignatures.has(signature)) return { questions: selection, ids };
      availableSignatures.add(signature);
    }
    return { error: "Não foi possível montar uma combinação inédita com as questões disponíveis. Adicione mais questões ou altere as matérias/quantidade." };
  }
  // Recupera avaliações antigas que guardavam apenas a quantidade, sem vínculos reais às questões.
  // Como a composição original não foi persistida, a recuperação sorteia e salva uma nova composição.
  function repairLegacyAssessments() {
    let changed = false;
    for (const record of records) {
      const linkedQuestions = assessmentQuestions(record);
      const expectedCount = Number(record.questions) || (Array.isArray(record.questionIds) ? record.questionIds.length : 0);
      if (expectedCount < 1 || linkedQuestions.length >= expectedCount) continue;
      const subjects = Array.isArray(record.subjects) && record.subjects.length ? record.subjects : [record.kind].filter(Boolean);
      if (!subjects.length) continue;
      const draw = drawUniqueQuestions(subjects, expectedCount, record.id);
      if (draw.error) continue;
      record.questionIds = draw.ids;
      record.questions = draw.ids.length;
      record.updated = "Recuperada automaticamente";
      changed = true;
    }
    if (changed) saveDemoRecords();
  }
  function answerText(q){if(q.type==="true_false")return q.answer===0?"Verdadeiro":"Falso";if(q.type==="multiple_choice"||!q.type)return String.fromCharCode(65+(Number(q.answer)||0));if(q.type==="matching")return(q.pairs||[]).map(p=>p.left+" → "+p.right).join("; ");return q.expectedAnswer||(q.type==="essay"?"Correção manual":"Resposta não informada");}
  function exportAssessmentCSV(id){const r=records.find(x=>x.id===id);if(!r)return notify("Avaliação não encontrada.");const rows=[["avaliacao","categoria","numero","tipo","enunciado","opcoes_ou_pares","gabarito"]];assessmentQuestions(r).forEach((q,i)=>rows.push([r.name,r.kind,i+1,q.type||"multiple_choice",q.prompt,q.type==="matching"?(q.pairs||[]).map(p=>p.left+" = "+p.right).join(" | "):(q.options||[]).join(" | "),answerText(q)]));const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="enat-itest-avaliacao-"+id+".csv";a.click();URL.revokeObjectURL(url);notify("Exportação CSV iniciada.");}
  function printAssessment(id,mode,withQr){const r=records.find(x=>x.id===id);if(!r)return notify("Avaliação não encontrada.");const qs=assessmentQuestions(r);if(!qs.length)return notify("Vincule questões à avaliação antes de imprimir.");const esc=safeText;const payload=JSON.stringify({app:"ENAT-iTEST",type:"answer-sheet",v:2,assessmentId:r.id,name:r.name,category:r.kind,questionIds:qs.map(q=>q.id)});const showQr=withQr||mode==="sheet";const qr=showQr?'<aside><img alt="QR de identificação para correção da avaliação" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='+encodeURIComponent(payload)+'"><small>QR para identificar a avaliação e a sequência das questões.</small></aside>':"";const title=mode==="exam"?"Prova":mode==="sheet"?"Cartão-resposta":"Gabarito pronto";const body=qs.map((q,i)=>{if(mode==="key")return'<section><b>'+(i+1)+'. '+esc(q.prompt)+'</b><p class="key">Gabarito: '+esc(answerText(q))+'</p></section>';if(mode==="sheet")return'<div class="omr-row" data-question="'+(i+1)+'"><b>'+(i+1)+'.</b>'+["A","B","C","D","E"].map((letter,n)=>'<span class="omr-choice"><i></i>'+letter+'</span>').join("")+'</div>';const opts=q.type==="matching"?(q.pairs||[]).map((p,n)=>'<li>'+esc(p.left+" — "+p.right)+'</li>').join(""):(q.options||[]).map(o=>'<li>'+esc(o)+'</li>').join("");return'<section><b>'+(i+1)+'. '+esc(q.prompt)+'</b>'+((q.type==="multiple_choice"||q.type==="true_false"||!q.type||q.type==="matching")?'<ol>'+opts+'</ol>':q.type==="essay"?'<div class="essay"></div>':'<div class="writing"></div>')+'</section>';}).join("");const w=window.open("","_blank");if(!w)return notify("Permita pop-ups no navegador para imprimir.");w.document.write('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font:12pt Arial;margin:18mm;color:#111}header{border-bottom:2px solid;padding:0 0 12px;margin-bottom:20px}h1{font-size:20pt}aside{float:right;width:140px;text-align:center}aside img{width:120px}small{font-size:8pt}body:has(.omr-start) header{padding-left:0;min-height:0;display:grid;grid-template-columns:32mm minmax(0,1fr);column-gap:8mm;align-items:start}body:has(.omr-start) header aside{grid-column:1;grid-row:1 / span 5;float:none;position:static;width:32mm;margin:0}body:has(.omr-start) header aside img{display:block;width:28mm;height:28mm;margin:0 auto 2mm}body:has(.omr-start) header aside small{display:block;font-size:7pt;line-height:1.25}body:has(.omr-start) .omr-start{position:static;margin:5mm 0 0}body:has(.omr-start) .omr-row{height:8mm;gap:4mm}body:has(.omr-start) .omr-note{margin:5mm 0 2mm}body:has(.omr-start)>p:last-child{margin-top:8mm;position:static;clear:both}section{margin:20px 0;break-inside:avoid}.writing{height:45px;border-bottom:1px solid #aaa}.essay{height:130px;background:repeating-linear-gradient(transparent 0,transparent 25px,#aaa 26px)}.key{background:#eee;padding:8px;font-weight:bold}.omr-row{height:6mm;display:flex;align-items:center;gap:6mm;margin:0;padding:0;break-inside:avoid;font-size:10pt}.omr-row b{display:inline-block;width:10mm}.omr-choice{display:inline-flex;align-items:center;gap:1.5mm;width:12mm}.omr-choice i{display:inline-block;width:4mm;height:4mm;border:1px solid #111;border-radius:50%}.omr-note{font-size:8pt;margin:4mm 0}.omr-start{margin-top:24mm}@media print{body{margin:12mm}}</style><body><header>'+qr+'<h1>ENAT iTEST — '+title+'</h1><h2>'+esc(r.name)+'</h2><p>Matérias: '+esc((r.subjects||[r.kind]).join(", "))+' · Questões: '+esc(r.questions||qs.length)+'</p>'+(mode==="key"?"":'<p>Nome: _____________________________________ Data: ____/____/______</p>')+'</header>'+(mode==="sheet"?'<p class="omr-note">Preencha completamente um único círculo por questão. Não dobre a folha. Cartão OMR ENAT iTEST v1.</p><div class="omr-start">'+body+'</div>':body)+'<p><small>Gerado pelo ENAT iTEST. O QR identifica a avaliação e a sequência das questões. A leitura óptica deve ser conferida quando houver baixa confiança.</small></p></body></html>');w.document.close();setTimeout(()=>w.print(),400);}
  function renderQuestionTypeFields(question) {
    const host=byId("question-type-fields"), type=byId("question-type").value;
    host.replaceChildren();
    const label=(text)=>{const el=document.createElement("label");el.textContent=text;host.appendChild(el);};
    if(type==="multiple_choice"||type==="true_false"){
      const options=question&&Array.isArray(question.options)&&question.options.length?question.options:(type==="true_false"?["Verdadeiro","Falso"]:["","","",""]);
      const list=document.createElement("div");list.id="dynamic-options";host.appendChild(list);
      options.forEach((value,i)=>{const input=document.createElement("input");input.dataset.option="1";input.required=true;input.maxLength=300;input.placeholder="Alternativa "+String.fromCharCode(65+i);input.value=value;input.style.marginBottom="8px";list.appendChild(input);});
      if(type==="multiple_choice"){const add=document.createElement("button");add.type="button";add.className="secondary-button";add.textContent="＋ Adicionar alternativa";add.addEventListener("click",()=>{const n=list.querySelectorAll("input").length;if(n>=10)return notify("Máximo de 10 alternativas.");const input=document.createElement("input");input.dataset.option="1";input.required=true;input.maxLength=300;input.placeholder="Alternativa "+String.fromCharCode(65+n);input.style.marginBottom="8px";list.appendChild(input);refreshQuestionAnswer();});host.appendChild(add);}
      label("Gabarito");const answer=document.createElement("select");answer.id="dynamic-answer";answer.required=true;host.appendChild(answer);refreshQuestionAnswer(question?question.answer:0);
    } else if(type==="matching"){
      const rows=document.createElement("div");rows.id="matching-rows";host.appendChild(rows);
      (question&&question.pairs&&question.pairs.length?question.pairs:[{left:"",right:""},{left:"",right:""}]).forEach(pair=>addMatchingPair(rows,pair));
      const add=document.createElement("button");add.type="button";add.className="secondary-button";add.textContent="＋ Adicionar par";add.addEventListener("click",()=>{if(rows.children.length>=10)return notify("Máximo de 10 pares.");addMatchingPair(rows,{left:"",right:""});});host.appendChild(add);
    } else {
      label(type==="short_text"?"Resposta esperada":"Critérios para correção");
      const input=document.createElement("textarea");input.id="question-expected-answer";input.rows=3;input.maxLength=1200;input.placeholder=type==="short_text"?"Informe a resposta correta":"Descreva os critérios de correção manual";input.value=question?(question.expectedAnswer||""):"";if(type==="short_text")input.required=true;host.appendChild(input);
      if(type==="essay"){const note=document.createElement("p");note.className="dialog-description";note.textContent="Respostas discursivas precisam ser avaliadas por um responsável.";host.appendChild(note);}
    }
  }
  function refreshQuestionAnswer(selected=0){const list=byId("dynamic-options"),answer=byId("dynamic-answer");if(!list||!answer)return;const options=Array.from(list.querySelectorAll("input"));answer.replaceChildren();options.forEach((input,i)=>{const opt=document.createElement("option");opt.value=String(i);opt.textContent="Alternativa "+String.fromCharCode(65+i);answer.appendChild(opt);});answer.value=String(Math.min(Number(selected)||0,options.length-1));}
  function addMatchingPair(host,pair){const row=document.createElement("div");row.className="matching-pair";row.style.display="grid";row.style.gridTemplateColumns="1fr 1fr";row.style.gap="8px";row.style.marginBottom="8px";const left=document.createElement("input");left.dataset.matchLeft="1";left.required=true;left.placeholder="Item";left.value=pair.left||"";const right=document.createElement("input");right.dataset.matchRight="1";right.required=true;right.placeholder="Correspondência";right.value=pair.right||"";row.append(left,right);host.appendChild(row);}
  function readQuestionTypeFields(type){
    if(type==="multiple_choice"||type==="true_false"){const options=Array.from(byId("dynamic-options").querySelectorAll("input")).map(input=>input.value.trim());if(options.length<2||options.some(value=>!value))return{valid:false,error:"Preencha todas as alternativas."};return{valid:true,data:{options,answer:Number(byId("dynamic-answer").value)}};}
    if(type==="matching"){const pairs=Array.from(byId("matching-rows").querySelectorAll(".matching-pair")).map(row=>({left:row.querySelector("[data-match-left]").value.trim(),right:row.querySelector("[data-match-right]").value.trim()}));if(pairs.length<2||pairs.some(pair=>!pair.left||!pair.right))return{valid:false,error:"Preencha pelo menos dois pares."};return{valid:true,data:{pairs,options:[],answer:null}};}
    const expectedAnswer=byId("question-expected-answer").value.trim();if(type==="short_text"&&!expectedAnswer)return{valid:false,error:"Informe a resposta esperada."};return{valid:true,data:{expectedAnswer,options:[],answer:null}};
  }
  function editQuestion(id) {
    const question = demoQuestions.find((item) => item.id === id);
    if (!question) return;
    byId("question-prompt").value = question.prompt;
    byId("question-category").value = question.kind;
    byId("question-type").value = question.type || "multiple_choice";
    renderQuestionTypeFields(question);
    byId("question-form").dataset.editingId = String(id);
    byId("question-dialog-title").textContent = "Editar questão";
    if (typeof byId("question-dialog").showModal === "function") byId("question-dialog").showModal();
  }
  function reviewDuplicateQuestions() {
    const groups = new Map();
    demoQuestions.forEach((q) => {
      const signature = [q.prompt, q.kind || q.category || "", q.type || "multiple_choice", (q.options || []).join("|")]
        .map(v => String(v).trim().toLocaleLowerCase("pt-BR")).join("::");
      if (!groups.has(signature)) groups.set(signature, []);
      groups.get(signature).push(q);
    });
    const duplicates = [...groups.values()].filter(group => group.length > 1);
    if (!duplicates.length) {
      notify("Nenhuma duplicidade exata encontrada no banco local. Questões parecidas não foram consideradas duplicadas.");
      return;
    }
    const lines = duplicates.map(group => "IDs " + group.map(q => q.id).join(", ") + ": " + group[0].prompt);
    downloadDuplicateReport(duplicates);
    const action = window.confirm(
      "Foram encontradas " + duplicates.length + " combinações de possíveis duplicatas (" +
      duplicates.reduce((sum, group) => sum + group.length - 1, 0) + " registros excedentes).\\n\\n" +
      lines.slice(0, 12).join("\\n") + (lines.length > 12 ? "\\n… e mais grupos. Consulte o CSV de revisão baixado." : "") +
      "\\n\\nO relatório foi baixado. Deseja abrir a lista de questões para editar ou excluir individualmente?"
    );
    if (action) {
      questionSearch = "";
      questionCategory = "";
      byId("question-search").value = "";
      byId("question-filter").value = "";
      navigate("questions");
      notify("Use os botões Editar e Excluir nas linhas identificadas no relatório CSV. Nenhuma questão foi alterada.");
    }
  }
  function downloadDuplicateReport(groups) {
    const rows = [["grupo","id","enunciado","categoria","tipo","alternativas","gabarito","ação_recomendada"]];
    groups.forEach((group, index) => group.forEach((q, position) => rows.push([
      index + 1, q.id, q.prompt, q.kind || q.category || "", q.type || "multiple_choice",
      (q.options || []).join(" | "), Number.isInteger(q.answer) ? q.answer + 1 : "",
      position === 0 ? "Revisar e manter como referência" : "Verificar: editar, excluir ou manter"
    ])));
    const csv = "\uFEFF" + rows.map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";")).join("\\r\\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "ENAT-iTEST-relatorio-duplicidades.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function deleteQuestion(id) {
    const question = demoQuestions.find((item) => item.id === id);
    if (!question) return;
    if (!window.confirm("Excluir esta questão demonstrativa deste navegador?")) return;
    demoQuestions.splice(demoQuestions.findIndex((item) => item.id === id), 1);
    saveDemoQuestions();
    renderRecords();
    notify("Questão excluída deste navegador.");
  }
  function navigate(view) {
    if (!views[view]) return;
    activeView = view;
    const data = views[view];
    byId("breadcrumb-title").textContent = data.title;
    byId("page-title").textContent = data.headline;
    byId("page-subtitle").textContent = data.subtitle;
    byId("list-title").textContent = data.section;
    byId("list-description").textContent = data.description;
    document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    byId("sidebar").classList.remove("open");
    byId("mobile-menu").setAttribute("aria-expanded", "false");
    renderRecords();
  }
  function renderQuestionSelection(selectedIds = [], category = "") {
    const container = byId("exam-question-selection");
    container.replaceChildren();
    if (!demoQuestions.length) {
      container.textContent = "Cadastre questões antes de vinculá-las.";
      return;
    }
    const eligibleQuestions = demoQuestions.filter((question) => !category || question.kind === category);
    if (!eligibleQuestions.length) { container.textContent = "Nenhuma questão cadastrada nesta categoria. Cadastre ou importe questões no Banco de questões."; return; }
    eligibleQuestions.forEach((question) => {
      const label = document.createElement("label");
      label.className = "question-choice";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "exam-question-id";
      input.value = String(question.id);
      input.checked = selectedIds.includes(question.id);
      const text = document.createElement("span");
      text.textContent = question.prompt;
      label.append(input, text);
      container.appendChild(label);
    });
  }
  function manageAssessmentQuestions(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    byId("dialog-title").textContent = "Gerenciar questões da avaliação";
    byId("dialog-description").textContent = "Avaliação: " + record.name + ". Marque as questões que devem compor esta avaliação. Para criar novas, use o Banco de questões e volte aqui.";
    byId("exam-name").value = record.name;
    byId("exam-subjects").querySelectorAll('input[name="exam-subjects"]').forEach((input) => { input.checked = (record.subjects || [record.kind]).includes(input.value); });
    byId("exam-answer-mode").value = record.answerMode || "system";
    byId("exam-questions").value = Math.max(Number(record.questions) || 1, (record.questionIds || []).length, 1);
    byId("create-form").dataset.editingAssessmentId = String(id);
    if (typeof byId("create-dialog").showModal === "function") byId("create-dialog").showModal();
  }
  function openDialog(mode) {
    if (mode === "question") {
      byId("question-form").reset();
      delete byId("question-form").dataset.editingId;
      byId("question-type").value = "multiple_choice";
      renderQuestionTypeFields();
      byId("question-dialog-title").textContent = "Adicionar questão";
      if (typeof byId("question-dialog").showModal === "function") byId("question-dialog").showModal();
      else notify("Seu navegador não suporta a janela de cadastro. Use um navegador atualizado.");
      return;
    }
    const dialog = byId("create-dialog");
    delete byId("create-form").dataset.editingAssessmentId;
    byId("create-form").reset();
    byId("exam-questions").value = "10";
    byId("exam-subjects").querySelectorAll('input[name="exam-subjects"]').forEach((input) => { input.checked = input.value === "Educação para o trânsito"; });
    byId("exam-answer-mode").value = "system";
    byId("dialog-title").textContent = "Criar avaliação";
    byId("dialog-description").textContent = "Crie uma avaliação. Ela será salva somente neste navegador até a conexão com o banco de dados ser implementada.";
    byId("exam-name").placeholder = "Ex.: Fundamentos de segurança viária";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else notify("Seu navegador não suporta a janela de cadastro. Use um navegador atualizado.");
  }
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  if (byId("review-duplicates")) byId("review-duplicates").addEventListener("click", reviewDuplicateQuestions);
  byId("new-exam").addEventListener("click", () => { if (activeView === "questions") openDialog("question"); else if (activeView === "classes") notify("O cadastro de turmas e alunos ainda não está implementado; este atalho não abrirá o formulário de avaliação."); else if (activeView === "results") navigate("results"); else if (activeView === "reports") navigate("reports"); else openDialog("exam"); });
  byId("add-question").addEventListener("click", () => openDialog("question"));
  byId("question-type").addEventListener("change", () => renderQuestionTypeFields());
  byId("question-search").addEventListener("input", (event) => { questionSearch = event.target.value; renderRecords(); });
  byId("question-filter").addEventListener("change", (event) => { questionCategory = event.target.value; renderRecords(); });
  byId("close-question-dialog").addEventListener("click", () => byId("question-dialog").close());
  byId("cancel-question-dialog").addEventListener("click", () => byId("question-dialog").close());
  byId("question-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = byId("question-prompt").value.trim();
    const type = byId("question-type").value;
    const result = readQuestionTypeFields(type);
    if (!prompt || !result.valid) { notify(result.error || "Preencha os campos obrigatórios."); return; }
    const editingId = Number(byId("question-form").dataset.editingId);
    const data = {prompt, kind:byId("question-category").value, type, ...result.data, updated:"Agora"};
    if (editingId) {
      const existing = demoQuestions.find((question) => question.id === editingId);
      if (existing) Object.assign(existing, data);
      delete byId("question-form").dataset.editingId;
    } else demoQuestions.unshift({id:nextQuestionId++, ...data});
    saveDemoQuestions();
    byId("question-form").reset();
    byId("question-dialog").close();
    navigate("questions");
    notify(editingId ? "Questão atualizada neste navegador." : "Questão salva neste navegador. A sincronização com servidor ainda não está disponível.");
  });
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "exam" || action === "question") openDialog(action);
    else if (action === "class") { navigate("classes"); notify("O módulo de turmas e alunos ainda não está disponível."); }
    else if (action === "report") { navigate("results"); notify("A área de resultados está vazia até existirem tentativas reais registradas."); }
  }));
  byId("view-all").addEventListener("click", () => navigate("exams"));
  byId("mobile-menu").addEventListener("click", () => {
    const sidebar = byId("sidebar");
    const open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    byId("mobile-menu").setAttribute("aria-expanded", String(open));
  });
  byId("dismiss-notice").addEventListener("click", () => byId("demo-notice").classList.add("hidden"));
  byId("help-button").addEventListener("click", () => notify("ENAT iTEST está em fase inicial. Nenhum dado real é armazenado ou enviado."));
  byId("close-dialog").addEventListener("click", () => byId("create-dialog").close());
  byId("cancel-dialog").addEventListener("click", () => byId("create-dialog").close());
  byId("create-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = byId("exam-name").value.trim();
    const questions = Number(byId("exam-questions").value);
    const quantityInput = byId("exam-quantity");
    const quantityRequested = quantityInput ? Number(quantityInput.value) : 1;
    const subjects = Array.from(byId("exam-subjects").querySelectorAll('input[name="exam-subjects"]:checked')).map((input) => input.value);
    const category = subjects[0] || "";
    const answerMode = byId("exam-answer-mode").value;
    const editingAssessmentId = Number(byId("create-form").dataset.editingAssessmentId) || 0;
    const quantity = editingAssessmentId ? 1 : quantityRequested;
    if (!subjects.length) { notify("Selecione pelo menos uma categoria para a prova."); return; }
    if (!name || !Number.isInteger(questions) || questions < 1 || questions > 100) {
      notify("Informe um nome e uma quantidade de questões entre 1 e 100.");
      return;
    }
    if (!Number.isInteger(quantityRequested) || quantityRequested < 1 || quantityRequested > 100) {
      notify("Informe uma quantidade de provas entre 1 e 100.");
      return;
    }
    const batch = [];
    const reservedSignatures = [];
    for (let index = 0; index < quantity; index++) {
      const draw = drawUniqueQuestions(subjects, questions, editingAssessmentId, reservedSignatures);
      if (draw.error) {
        notify(quantity > 1
          ? "Não foi possível gerar todas as provas solicitadas. Foram preparadas " + batch.length + " de " + quantity + ". " + draw.error
          : draw.error);
        return;
      }
      batch.push(draw.ids);
      reservedSignatures.push(questionSetSignature(draw.ids));
    }
    if (editingAssessmentId) {
      const record = records.find((item) => item.id === editingAssessmentId);
      if (!record) { notify("Não foi possível localizar a avaliação."); return; }
      record.name = name;
      record.kind = category;
      record.subjects = subjects;
      record.answerMode = answerMode;
      record.questions = batch[0].length;
      record.questionIds = batch[0];
      record.status = "draft";
      record.statusLabel = "Rascunho";
      record.updated = "Agora";
      delete byId("create-form").dataset.editingAssessmentId;
      notify("Avaliação remontada com uma combinação inédita de questões.");
    } else {
      batch.forEach((ids, index) => {
        const label = quantity === 1 ? name : name + " — Prova " + String(index + 1).padStart(2, "0");
        records.unshift({id:nextId++,name:label,kind:category,subjects,answerMode,questions:ids.length,questionIds:ids,status:"draft",statusLabel:"Rascunho",updated:"Agora"});
      });
      notify(quantity === 1
        ? "Prova montada com " + batch[0].length + " questões sorteadas."
        : "Foram montadas " + quantity + " provas diferentes, com " + questions + " questões cada.");
    }
    saveDemoRecords();
    byId("create-form").reset();
    byId("exam-questions").value = "10";
    if (quantityInput) quantityInput.value = "1";
    byId("create-dialog").close();
    navigate("exams");
  });
  repairLegacyAssessments();
  navigate("overview");
})();