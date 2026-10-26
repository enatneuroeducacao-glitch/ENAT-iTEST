(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const demoStorageKey = "enat-itest-demo-assessments-v1";
  const questionStorageKey = "enat-itest-demo-questions-v1";
  const demoQuestions = [
    { id: 1, prompt: "Qual atitude contribui para reduzir o risco de sinistros no trânsito?", kind: "Educação para o trânsito", options: ["Respeitar os limites de velocidade", "Usar o celular ao dirigir", "Manter distância insuficiente", "Ignorar a sinalização"], answer: 0, updated: "Exemplo" },
    { id: 2, prompt: "O que significa perceber riscos antes de agir no trânsito?", kind: "Neurotrânsito", options: ["Antecipar perigos e ajustar a conduta", "Confiar apenas na sorte", "Aumentar a velocidade sempre", "Desconsiderar outros usuários"], answer: 0, updated: "Exemplo" },
    { id: 3, prompt: "Ao se aproximar de uma faixa de pedestres, o condutor deve:", kind: "Conhecimentos gerais", options: ["Acelerar para passar primeiro", "Observar e dar preferência conforme as regras", "Buzinar continuamente", "Desviar sem reduzir a atenção"], answer: 1, updated: "Exemplo" }
  ];
  try {
    const savedQuestions = JSON.parse(window.localStorage.getItem(questionStorageKey) || "[]");
    if (Array.isArray(savedQuestions)) savedQuestions.filter((q) => q && typeof q.prompt === "string" && Number.isInteger(q.id)).forEach((q) => demoQuestions.push(q));
  } catch (_) {}
  let nextQuestionId = Math.max(3, ...demoQuestions.map((q) => Number(q.id) || 0)) + 1;
  const records = [
    { id: 1, name: "Fundamentos de segurança viária", kind: "Conhecimentos gerais", questions: 10, status: "ready", statusLabel: "Preparada", updated: "Hoje" },
    { id: 2, name: "Atenção e percepção de risco", kind: "Neurotrânsito", questions: 15, status: "draft", statusLabel: "Rascunho", updated: "Ontem" },
    { id: 3, name: "Comportamento no trânsito", kind: "Educação para o trânsito", questions: 20, status: "review", statusLabel: "Em revisão", updated: "22 out. 2026" }
  ];
  // Persist only records explicitly created in this browser demo; never store student or sensitive data.
  try {
    const saved = JSON.parse(window.localStorage.getItem(demoStorageKey) || "[]");
    if (Array.isArray(saved)) {
      saved.filter((item) => item && typeof item.name === "string" && Number.isInteger(item.id)).forEach((item) => records.push(item));
    }
  } catch (_) {
    // Storage may be disabled or contain invalid data; the demo remains usable in memory.
  }
  let nextId = Math.max(3, ...records.map((record) => Number(record.id) || 0)) + 1;
  function saveDemoQuestions() {
    try {
      window.localStorage.setItem(questionStorageKey, JSON.stringify(demoQuestions.filter((q) => q.id > 3)));
      return true;
    } catch (_) {
      notify("Questão disponível apenas nesta sessão: o navegador não permitiu salvar os dados locais.");
      return false;
    }
  }
  function saveDemoRecords() {
    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify(records.filter((record) => record.id > 3)));
      return true;
    } catch (_) {
      notify("Registro criado apenas nesta sessão: o navegador não permitiu salvar os dados locais.");
      return false;
    }
  }
  let activeView = "overview";
  let questionSearch = "";
  let questionCategory = "";
  let toastTimer;
  const views = {
    overview: { title: "Visão geral", headline: "Bom dia. Vamos aprender melhor.", subtitle: "Acompanhe suas avaliações e organize o próximo passo do aprendizado.", section: "Avaliações recentes", description: "Organize, revise e prepare atividades de aprendizagem." },
    questions: { title: "Banco de questões", headline: "Banco de questões", subtitle: "Organize questões, categorias e conteúdos para futuras avaliações.", section: "Questões de demonstração", description: "Catálogo ilustrativo — nenhum conteúdo real foi importado." },
    exams: { title: "Avaliações", headline: "Avaliações", subtitle: "Crie e organize avaliações para diferentes objetivos de aprendizagem.", section: "Avaliações cadastradas", description: "Registros de exemplo criados nesta demonstração." },
    classes: { title: "Turmas e alunos", headline: "Turmas e alunos", subtitle: "Prepare a organização de grupos para futuras avaliações.", section: "Visão de turmas", description: "Os registros abaixo são apenas demonstrativos." },
    results: { title: "Resultados", headline: "Resultados de aprendizagem", subtitle: "Acompanhe indicadores ilustrativos sem expor dados pessoais.", section: "Atividade recente", description: "Os dados reais serão conectados após a implementação do backend." },
    reports: { title: "Relatórios", headline: "Relatórios", subtitle: "Planeje análises de desempenho e acompanhamento educacional.", section: "Resumo demonstrativo", description: "Nenhum relatório real foi calculado nesta versão." }
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
        const answer = question.options[question.answer] || "";
        tr.innerHTML = '<td><div class="exam-name"><span class="exam-type">▤</span><span><strong>' + safeText(question.prompt) + '</strong><small>' + safeText(question.kind) + '</small></span></div></td><td><span class="option-summary">' + question.options.length + ' alternativas</span></td><td><span class="status ready">Gabarito ' + safeText(String.fromCharCode(65 + question.answer)) + '</span><small class="answer-preview">' + safeText(answer) + '</small></td><td>' + safeText(question.updated || "Exemplo") + '</td><td class="question-row-actions"><button class="row-menu" aria-label="Editar questão" data-question-edit="' + question.id + '">Editar</button><button class="row-menu danger-action" aria-label="Excluir questão" data-question-delete="' + question.id + '">Excluir</button></td>';
        body.appendChild(tr);
      });
      body.querySelectorAll("[data-question-edit]").forEach((button) => button.addEventListener("click", () => editQuestion(Number(button.dataset.questionEdit))));
      body.querySelectorAll("[data-question-delete]").forEach((button) => button.addEventListener("click", () => deleteQuestion(Number(button.dataset.questionDelete))));
    } else {
      let list = records;
      if (activeView === "classes") {
        list = [{id:101,name:"Turma piloto — Segurança viária",kind:"Grupo demonstrativo",questions:24,status:"ready",statusLabel:"Organizada",updated:"Esta semana"},{id:102,name:"Turma piloto — Neurotrânsito",kind:"Grupo demonstrativo",questions:18,status:"review",statusLabel:"Em organização",updated:"Esta semana"}];
      } else if (activeView === "results") {
        list = [{id:201,name:"Conclusão média demonstrativa",kind:"Indicador ilustrativo",questions:"84%",status:"ready",statusLabel:"Exemplo",updated:"Esta semana"},{id:202,name:"Participação nas avaliações",kind:"Indicador ilustrativo",questions:"76%",status:"review",statusLabel:"Exemplo",updated:"Esta semana"}];
      } else if (activeView === "reports") {
        list = [{id:301,name:"Resumo de avaliações",kind:"Relatório ilustrativo",questions:"12",status:"ready",statusLabel:"Demonstração",updated:"Este mês"},{id:302,name:"Visão de participação",kind:"Relatório ilustrativo",questions:"246",status:"review",statusLabel:"Demonstração",updated:"Este mês"}];
      }
      list.forEach((record) => {
        const tr = document.createElement("tr");
        const questionCount = Array.isArray(record.questionIds) && record.questionIds.length ? record.questionIds.length : record.questions;
        tr.innerHTML = '<td><div class="exam-name"><span class="exam-type">▣</span><span><strong>' + safeText(record.name) + '</strong><small>' + safeText(record.kind) + '</small></span></div></td><td>' + safeText(questionCount) + '</td><td><span class="status ' + safeText(record.status) + '">' + safeText(record.statusLabel) + '</span></td><td>' + safeText(record.updated) + '</td><td><button class="row-menu" aria-label="Opções para ' + safeText(record.name) + '" data-record="' + record.id + '">•••</button></td>';
        body.appendChild(tr);
      });
      body.querySelectorAll("[data-record]").forEach((button) => button.addEventListener("click", () => notify("Ações de avaliação serão habilitadas na próxima etapa.")));
    }
    byId("empty-state").classList.toggle("hidden", body.children.length > 0);
    if (activeView === "questions" && body.children.length === 0) {
      byId("empty-state").querySelector("strong").textContent = "Nenhuma questão encontrada";
      byId("empty-state").querySelector("span").textContent = "Ajuste a pesquisa ou o filtro, ou cadastre uma nova questão.";
    } else {
      byId("empty-state").querySelector("strong").textContent = "Nenhum registro nesta visualização";
      byId("empty-state").querySelector("span").textContent = "Crie uma avaliação demonstrativa para começar.";
    }
    byId("question-tools").classList.toggle("hidden", activeView !== "questions");
    byId("view-all").classList.toggle("hidden", activeView === "questions");
    byId("new-exam").textContent = activeView === "questions" ? "＋ Nova questão" : activeView === "classes" ? "♧ Gerenciar turma" : activeView === "results" ? "⌁ Ver resultados" : activeView === "reports" ? "▥ Abrir relatórios" : "＋ Criar avaliação";
    byId("metric-exams").textContent = String(12 + records.length - 3);
    byId("metric-questions").textContent = String(125 + demoQuestions.length);
    byId("question-nav-count").textContent = String(demoQuestions.length);
    byId("exam-nav-count").textContent = String(records.length);
  }
  function editQuestion(id) {
    const question = demoQuestions.find((item) => item.id === id);
    if (!question) return;
    if (id <= 3) { notify("Questões de exemplo do catálogo base são somente leitura. Crie uma questão própria para editar."); return; }
    byId("question-prompt").value = question.prompt;
    byId("question-category").value = question.kind;
    ["option-a", "option-b", "option-c", "option-d"].forEach((field, index) => { byId(field).value = question.options[index] || ""; });
    byId("question-answer").value = String(question.answer);
    byId("question-form").dataset.editingId = String(id);
    byId("question-dialog-title").textContent = "Editar questão";
    if (typeof byId("question-dialog").showModal === "function") byId("question-dialog").showModal();
  }
  function deleteQuestion(id) {
    const question = demoQuestions.find((item) => item.id === id);
    if (!question) return;
    if (id <= 3) { notify("Questões de exemplo do catálogo base não podem ser excluídas."); return; }
    if (!window.confirm("Excluir esta questão demonstrativa deste navegador?")) return;
    demoQuestions.splice(demoQuestions.findIndex((item) => item.id === id), 1);
    saveDemoQuestions();
    renderRecords();
    notify("Questão demonstrativa excluída deste navegador.");
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
  function renderQuestionSelection(selectedIds = []) {
    const container = byId("exam-question-selection");
    container.replaceChildren();
    if (!demoQuestions.length) {
      container.textContent = "Cadastre questões antes de vinculá-las.";
      return;
    }
    demoQuestions.forEach((question) => {
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
  function openDialog(mode) {
    if (mode === "question") {
      byId("question-form").reset();
      delete byId("question-form").dataset.editingId;
      byId("question-dialog-title").textContent = "Adicionar questão";
      if (typeof byId("question-dialog").showModal === "function") byId("question-dialog").showModal();
      else notify("Seu navegador não suporta a janela de cadastro. Use um navegador atualizado.");
      return;
    }
    const dialog = byId("create-dialog");
    byId("dialog-title").textContent = "Criar avaliação";
    byId("dialog-description").textContent = "Crie um registro de demonstração. Ele não será enviado para um servidor.";
    byId("exam-name").placeholder = "Ex.: Fundamentos de segurança viária";
    renderQuestionSelection();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else notify("Seu navegador não suporta a janela de cadastro. Use um navegador atualizado.");
  }
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  byId("new-exam").addEventListener("click", () => { if (activeView === "questions") openDialog("question"); else if (activeView === "classes") notify("O cadastro de turmas e alunos ainda não está implementado; este atalho não abrirá o formulário de avaliação."); else if (activeView === "results") navigate("results"); else if (activeView === "reports") navigate("reports"); else openDialog("exam"); });
  byId("add-question").addEventListener("click", () => openDialog("question"));
  byId("question-search").addEventListener("input", (event) => { questionSearch = event.target.value; renderRecords(); });
  byId("question-filter").addEventListener("change", (event) => { questionCategory = event.target.value; renderRecords(); });
  byId("close-question-dialog").addEventListener("click", () => byId("question-dialog").close());
  byId("cancel-question-dialog").addEventListener("click", () => byId("question-dialog").close());
  byId("question-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = byId("question-prompt").value.trim();
    const options = ["option-a", "option-b", "option-c", "option-d"].map((id) => byId(id).value.trim());
    if (!prompt || options.some((option) => !option)) { notify("Preencha o enunciado e as quatro alternativas."); return; }
    const editingId = Number(byId("question-form").dataset.editingId);
    if (editingId) {
      const existing = demoQuestions.find((question) => question.id === editingId);
      if (existing) Object.assign(existing, { prompt, kind: byId("question-category").value, options, answer: Number(byId("question-answer").value), updated: "Agora" });
      delete byId("question-form").dataset.editingId;
    } else {
      demoQuestions.unshift({ id: nextQuestionId++, prompt, kind: byId("question-category").value, options, answer: Number(byId("question-answer").value), updated: "Agora" });
    }
    saveDemoQuestions();
    byId("question-form").reset();
    byId("question-dialog").close();
    navigate("questions");
    notify(editingId ? "Questão demonstrativa atualizada neste navegador." : "Questão demonstrativa salva neste navegador. Ainda não há servidor.");
  });
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "exam" || action === "question") openDialog(action);
    else if (action === "class") { navigate("classes"); notify("Turmas e alunos: área demonstrativa aberta. O cadastro próprio será implementado em etapa separada."); }
    else if (action === "report") { navigate("results"); notify("Área de resultados demonstrativos aberta; nenhum dado real foi calculado."); }
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
    if (questionIds.length > questions) {
      notify("A quantidade de questões vinculadas não pode superar a quantidade definida para a avaliação.");
      return;
    }
    records.unshift({id:nextId++,name,kind:category,questions:questionIds.length || questions,questionIds,status:"draft",statusLabel:"Rascunho",updated:"Agora"});
    saveDemoRecords();
    byId("create-form").reset();
    byId("exam-questions").value = "10";
    byId("create-dialog").close();
    navigate("exams");
    notify("Avaliação demonstrativa criada. Neste protótipo, ela fica salva apenas neste navegador; não use dados pessoais ou reais.");
  });
  navigate("overview");
})();