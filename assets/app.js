(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const records = [
    { id: 1, name: "Fundamentos de segurança viária", kind: "Conhecimentos gerais", questions: 10, status: "ready", statusLabel: "Preparada", updated: "Hoje" },
    { id: 2, name: "Atenção e percepção de risco", kind: "Neurotrânsito", questions: 15, status: "draft", statusLabel: "Rascunho", updated: "Ontem" },
    { id: 3, name: "Comportamento no trânsito", kind: "Educação para o trânsito", questions: 20, status: "review", statusLabel: "Em revisão", updated: "22 out. 2026" }
  ];
  let nextId = 4;
  let activeView = "overview";
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
    let list = records;
    if (activeView === "questions") {
      list = records.map((r) => ({...r, name: "Questões — " + r.kind, kind: "Categoria de demonstração"}));
    } else if (activeView === "classes") {
      list = [
        {id:101,name:"Turma piloto — Segurança viária",kind:"Grupo demonstrativo",questions:24,status:"ready",statusLabel:"Organizada",updated:"Esta semana"},
        {id:102,name:"Turma piloto — Neurotrânsito",kind:"Grupo demonstrativo",questions:18,status:"review",statusLabel:"Em organização",updated:"Esta semana"}
      ];
    } else if (activeView === "results") {
      list = [
        {id:201,name:"Conclusão média demonstrativa",kind:"Indicador ilustrativo",questions:"84%",status:"ready",statusLabel:"Exemplo",updated:"Esta semana"},
        {id:202,name:"Participação nas avaliações",kind:"Indicador ilustrativo",questions:"76%",status:"review",statusLabel:"Exemplo",updated:"Esta semana"}
      ];
    } else if (activeView === "reports") {
      list = [
        {id:301,name:"Resumo de avaliações",kind:"Relatório ilustrativo",questions:"12",status:"ready",statusLabel:"Demonstração",updated:"Este mês"},
        {id:302,name:"Visão de participação",kind:"Relatório ilustrativo",questions:"246",status:"review",statusLabel:"Demonstração",updated:"Este mês"}
      ];
    }
    list.forEach((record) => {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td><div class="exam-name"><span class="exam-type">▣</span><span><strong>' + safeText(record.name) + '</strong><small>' + safeText(record.kind) + '</small></span></div></td><td>' + safeText(record.questions) + '</td><td><span class="status ' + safeText(record.status) + '">' + safeText(record.statusLabel) + '</span></td><td>' + safeText(record.updated) + '</td><td><button class="row-menu" aria-label="Opções para ' + safeText(record.name) + '" data-record="' + record.id + '">•••</button></td>';
      body.appendChild(tr);
    });
    byId("empty-state").classList.toggle("hidden", list.length > 0);
    byId("metric-exams").textContent = String(12 + records.length - 3);
    byId("exam-nav-count").textContent = String(records.length);
    body.querySelectorAll("[data-record]").forEach((button) => button.addEventListener("click", () => notify("Ações de registro serão habilitadas após a implementação do backend.")));
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
  function openDialog(mode) {
    const dialog = byId("create-dialog");
    if (mode === "question") {
      byId("dialog-title").textContent = "Adicionar questão";
      byId("dialog-description").textContent = "O cadastro completo de questões será desenvolvido em uma próxima etapa. Por enquanto, você pode criar uma avaliação demonstrativa.";
      byId("exam-name").placeholder = "Nome da avaliação de referência";
    } else {
      byId("dialog-title").textContent = "Criar avaliação";
      byId("dialog-description").textContent = "Crie um registro de demonstração. Ele não será enviado para um servidor.";
      byId("exam-name").placeholder = "Ex.: Fundamentos de segurança viária";
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else notify("Seu navegador não suporta a janela de cadastro. Use um navegador atualizado.");
  }
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  byId("new-exam").addEventListener("click", () => openDialog("exam"));
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "exam" || action === "question") openDialog(action);
    else if (action === "class") { navigate("classes"); notify("Área demonstrativa de turmas aberta."); }
    else if (action === "report") navigate("results");
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
    records.unshift({id:nextId++,name,kind:category,questions,status:"draft",statusLabel:"Rascunho",updated:"Agora"});
    byId("create-form").reset();
    byId("exam-questions").value = "10";
    byId("create-dialog").close();
    navigate("exams");
    notify("Avaliação demonstrativa criada nesta sessão do navegador.");
  });
  navigate("overview");
})();