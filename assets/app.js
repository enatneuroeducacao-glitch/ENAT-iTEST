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
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
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
        tr.innerHTML = '<td><div class="exam-name"><span class="exam-type">▣</span><span><strong>' + safeText(record.name) + '</strong><small>' + safeText(record.kind) + '</small></span></div></td><td>' + safeText(questionCount) + '</td><td><span class="status ' + safeText(record.status) + '">' + safeText(record.statusLabel) + '</span></td><td>' + safeText(record.updated) + '</td><td>' + (isEditableAssessment ? '<button class="row-menu" aria-label="Gerenciar questões de ' + safeText(record.name) + '" data-manage-assessment="' + record.id + '">Gerenciar questões</button>' : '<button class="row-menu" aria-label="Opções para ' + safeText(record.name) + '" data-record="' + record.id + '">•••</button>') + '</td>';
        body.appendChild(tr);
      });
      body.querySelectorAll("[data-record]").forEach((button) => button.addEventListener("click", () => notify("Não há ações disponíveis para este registro.")));
      body.querySelectorAll("[data-manage-assessment]").forEach((button) => button.addEventListener("click", () => manageAssessmentQuestions(Number(button.dataset.manageAssessment))));
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
    byId("exam-category").value = record.kind;
    byId("exam-questions").value = Math.max(Number(record.questions) || 1, (record.questionIds || []).length, 1);
    renderQuestionSelection(record.questionIds || [], record.kind);
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
    byId("dialog-title").textContent = "Criar avaliação";
    byId("dialog-description").textContent = "Crie uma avaliação. Ela será salva somente neste navegador até a conexão com o banco de dados ser implementada.";
    byId("exam-name").placeholder = "Ex.: Fundamentos de segurança viária";
    renderQuestionSelection();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else notify("Seu navegador não suporta a janela de cadastro. Use um navegador atualizado.");
  }
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  byId("new-exam").addEventListener("click", () => { if (activeView === "questions") openDialog("question"); else if (activeView === "classes") notify("O cadastro de turmas e alunos ainda não está implementado; este atalho não abrirá o formulário de avaliação."); else if (activeView === "results") navigate("results"); else if (activeView === "reports") navigate("reports"); else openDialog("exam"); });
  byId("add-question").addEventListener("click", () => openDialog("question"));
  byId("question-type").addEventListener("change", () => renderQuestionTypeFields());
  byId("exam-category").addEventListener("change", () => renderQuestionSelection([], byId("exam-category").value));
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
    const category = byId("exam-category").value;
    if (!name || !Number.isInteger(questions) || questions < 1 || questions > 100) {
      notify("Informe um nome e uma quantidade de questões entre 1 e 100.");
      return;
    }
    const questionIds = Array.from(document.querySelectorAll('input[name="exam-question-id"]:checked')).map((input) => Number(input.value));
    const invalidCategoryQuestion = questionIds.some((id) => { const q = demoQuestions.find((item) => item.id === id); return !q || q.kind !== category; });
    if (invalidCategoryQuestion) { notify("A avaliação só pode vincular questões da mesma categoria."); return; }
    if (questionIds.length > questions) {
      notify("A quantidade de questões vinculadas não pode superar a quantidade definida para a avaliação.");
      return;
    }
    const editingAssessmentId = Number(byId("create-form").dataset.editingAssessmentId);
    if (editingAssessmentId) {
      const record = records.find((item) => item.id === editingAssessmentId);
      if (!record) { notify("Não foi possível localizar a avaliação."); return; }
      record.name = name;
      record.kind = category;
      record.questions = questionIds.length || questions;
      record.questionIds = questionIds;
      record.updated = "Agora";
      delete byId("create-form").dataset.editingAssessmentId;
      notify("Questões vinculadas à avaliação atualizadas neste navegador.");
    } else {
      records.unshift({id:nextId++,name,kind:category,questions:questionIds.length || questions,questionIds,status:"draft",statusLabel:"Rascunho",updated:"Agora"});
      notify("Avaliação salva neste navegador. A sincronização com servidor ainda não está disponível.");
    }
    saveDemoRecords();
    byId("create-form").reset();
    byId("exam-questions").value = "10";
    byId("create-dialog").close();
    navigate("exams");
  });
  navigate("overview");
})();