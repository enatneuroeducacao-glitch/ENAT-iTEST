(() => {
  "use strict";
  const QUESTIONS_KEY = "enat-itest-demo-questions-v1";
  const SESSION_KEY = "enat-itest-online-simulator-v1";
  const ROUND_SIZE = 30;
  const $ = (id) => document.getElementById(id);
  const state = { bank: [], session: null };
  const escapeText = (value) => String(value ?? "");
  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function loadBank() {
    try {
      const value = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || "[]");
      state.bank = Array.isArray(value) ? value.filter(q => q && Number.isInteger(Number(q.id)) && typeof q.prompt === "string" && q.prompt.trim()) : [];
    } catch (_) { state.bank = []; }
  }
  function saveSession() {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(state.session)); return true; }
    catch (_) { setStatus("O navegador não conseguiu guardar o progresso. Libere espaço ou exporte seus dados antes de continuar.", true); return false; }
  }
  function loadSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (value && Array.isArray(value.poolIds) && Number.isInteger(value.cursor) && Array.isArray(value.completed)) {
        const available = new Set(state.bank.map(q => Number(q.id)));
        value.poolIds = value.poolIds.filter(id => available.has(Number(id)));
        value.cursor = Math.min(value.cursor, value.poolIds.length);
        value.currentIds = Array.isArray(value.currentIds) ? value.currentIds.filter(id => value.poolIds.includes(id)) : [];
        state.session = value;
        return;
      }
    } catch (_) {}
    state.session = null;
  }
  function setStatus(message, error = false) {
    const el = $("simulator-status");
    el.textContent = message;
    el.classList.toggle("error", error);
  }
  function updateStats() {
    const total = state.session ? state.session.poolIds.length : state.bank.length;
    const used = state.session ? state.session.cursor : 0;
    $("sim-total").textContent = String(state.bank.length);
    $("sim-used").textContent = String(used);
    $("sim-remaining").textContent = String(Math.max(0, total - used));
    $("sim-round").textContent = state.session ? String(state.session.round || 0) : "—";
  }
  function questionById(id) { return state.bank.find(q => Number(q.id) === Number(id)); }
  function normalized(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
  }
  function correctAnswer(question, answer) {
    const type = question.type || "multiple_choice";
    if (type === "multiple_choice" || type === "true_false" || !question.type) {
      if (answer === "" || answer == null) return false;
      const raw = question.answer;
      const idx = Number.isInteger(raw) ? raw : (/^[A-E]$/i.test(String(raw)) ? String(raw).toUpperCase().charCodeAt(0) - 65 : Number(raw));
      return Number(answer) === idx;
    }
    if (type === "short_text") return Boolean(question.expectedAnswer) && normalized(answer) === normalized(question.expectedAnswer);
    return null;
  }
  function renderQuestion(question, index) {
    const article = document.createElement("article");
    article.className = "sim-question";
    const heading = document.createElement("div");
    heading.className = "sim-question-heading";
    const number = document.createElement("span");
    number.className = "sim-question-number";
    number.textContent = String(index + 1);
    const text = document.createElement("div");
    const prompt = document.createElement("h3");
    prompt.textContent = escapeText(question.prompt);
    const category = document.createElement("small");
    category.textContent = escapeText(question.kind || question.category || "Sem categoria");
    text.append(prompt, category);
    heading.append(number, text);
    article.appendChild(heading);
    const type = question.type || "multiple_choice";
    if (type === "multiple_choice" || type === "true_false" || !question.type) {
      const options = Array.isArray(question.options) ? question.options : [];
      const list = document.createElement("div");
      list.className = "sim-options";
      options.forEach((option, optionIndex) => {
        const label = document.createElement("label");
        label.className = "sim-option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "sim-answer-" + question.id;
        input.value = String(optionIndex);
        input.required = false;
        const span = document.createElement("span");
        span.textContent = String.fromCharCode(65 + optionIndex) + ". " + escapeText(option);
        label.append(input, span);
        list.appendChild(label);
      });
      article.appendChild(list);
    } else {
      const label = document.createElement("label");
      label.className = "sim-free-label";
      label.textContent = type === "essay" ? "Sua resposta (discursiva; requer correção manual)" : type === "matching" ? "Informe as associações solicitadas" : "Sua resposta";
      const area = document.createElement("textarea");
      area.name = "sim-answer-" + question.id;
      area.rows = type === "essay" || type === "matching" ? 4 : 2;
      area.maxLength = 3000;
      area.placeholder = "Digite sua resposta…";
      label.appendChild(area);
      article.appendChild(label);
    }
    return article;
  }
  function beginRound() {
    if (!state.session) return;
    const remaining = state.session.poolIds.length - state.session.cursor;
    if (remaining <= 0) { showCycleComplete(); return; }
    state.session.round = (state.session.round || 0) + 1;
    state.session.currentIds = state.session.poolIds.slice(state.session.cursor, state.session.cursor + ROUND_SIZE);
    state.session.responses = {};
    state.session.roundSubmitted = false;
    saveSession();
    renderRound();
  }
  function renderRound() {
    const session = state.session;
    if (!session || !session.currentIds.length) return;
    const host = $("simulator-quiz");
    host.replaceChildren();
    const form = document.createElement("form");
    form.id = "sim-round-form";
    const intro = document.createElement("div");
    intro.className = "sim-round-intro";
    intro.textContent = "Rodada " + session.round + " · " + session.currentIds.length + " questão(ões) · Questões sorteadas sem repetição neste ciclo.";
    form.appendChild(intro);
    session.currentIds.forEach((id, index) => {
      const q = questionById(id);
      if (q) form.appendChild(renderQuestion(q, index));
    });
    const actions = document.createElement("div");
    actions.className = "simulator-actions";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "primary-button";
    submit.textContent = "Finalizar rodada e corrigir";
    actions.appendChild(submit);
    form.appendChild(actions);
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (state.session.roundSubmitted) return;
      const answers = {};
      session.currentIds.forEach(id => {
        const q = questionById(id);
        if (!q) return;
        const type = q.type || "multiple_choice";
        const checked = form.querySelector('input[name="sim-answer-' + CSS.escape(String(id)) + '"]:checked');
        const area = form.querySelector('textarea[name="sim-answer-' + CSS.escape(String(id)) + '"]');
        answers[id] = checked ? checked.value : area ? area.value.trim() : "";
      });
      let correct = 0, autoGraded = 0, manual = 0, blank = 0;
      session.currentIds.forEach(id => {
        const q = questionById(id);
        const answer = answers[id];
        if (answer === "" || answer == null) blank++;
        const result = correctAnswer(q, answer);
        if (result === null) manual++;
        else { autoGraded++; if (result) correct++; }
      });
      session.responses = answers;
      session.roundSubmitted = true;
      session.lastResult = { correct, autoGraded, manual, blank, total: session.currentIds.length, at: new Date().toISOString() };
      session.completed.push({ round: session.round, ids: session.currentIds.slice(), result: session.lastResult });
      session.cursor += session.currentIds.length;
      session.currentIds = [];
      saveSession();
      showRoundResult(session.lastResult);
    });
    host.appendChild(form);
    host.classList.remove("hidden");
    $("simulator-summary").classList.add("hidden");
    $("sim-start").classList.add("hidden");
    $("sim-next").classList.add("hidden");
    $("sim-reset").classList.remove("hidden");
    setStatus("Responda às questões e finalize para ver o resultado. O progresso fica salvo neste navegador.");
    updateStats();
  }
  function showRoundResult(result) {
    $("simulator-quiz").classList.add("hidden");
    const summary = $("simulator-summary");
    summary.replaceChildren();
    summary.classList.remove("hidden");
    const title = document.createElement("h3");
    title.textContent = "Resultado da rodada " + state.session.round;
    const score = document.createElement("p");
    score.className = "sim-score";
    score.textContent = result.correct + " acerto(s) em " + result.autoGraded + " questão(ões) corrigidas automaticamente";
    const details = document.createElement("p");
    details.textContent = (result.manual ? result.manual + " questão(ões) exigem avaliação manual. " : "") + (result.blank ? result.blank + " resposta(s) em branco." : "Nenhuma resposta em branco.");
    summary.append(title, score, details);
    const remaining = state.session.poolIds.length - state.session.cursor;
    if (remaining > 0) {
      $("sim-next").classList.remove("hidden");
      $("sim-start").classList.add("hidden");
      setStatus("Rodada concluída. Ainda há " + remaining + " questão(ões) inéditas neste ciclo.");
    } else {
      $("sim-next").classList.add("hidden");
      showCycleComplete();
    }
    updateStats();
  }
  function showCycleComplete() {
    $("simulator-quiz").classList.add("hidden");
    $("sim-next").classList.add("hidden");
    $("sim-start").classList.remove("hidden");
    $("sim-start").textContent = "Iniciar novo ciclo";
    const summary = $("simulator-summary");
    summary.classList.remove("hidden");
    summary.replaceChildren();
    const title = document.createElement("h3");
    title.textContent = "Ciclo completo!";
    const details = document.createElement("p");
    const totalCorrect = state.session ? state.session.completed.reduce((sum, item) => sum + (item.result?.correct || 0), 0) : 0;
    const autoTotal = state.session ? state.session.completed.reduce((sum, item) => sum + (item.result?.autoGraded || 0), 0) : 0;
    details.textContent = "Você percorreu todas as " + (state.session?.poolIds.length || 0) + " questões deste ciclo, sem repetir nenhuma. Resultado automático: " + totalCorrect + "/" + autoTotal + ".";
    summary.append(title, details);
    setStatus("Todas as questões deste ciclo foram utilizadas. Inicie um novo ciclo para sortear outra ordem.");
    updateStats();
  }
  function startCycle(force = false) {
    if (!state.bank.length) {
      setStatus("O banco local não contém questões. Importe o CSV no Banco de questões e volte ao simulado.", true);
      return;
    }
    if (state.session && state.session.cursor < state.session.poolIds.length && !force) {
      setStatus("O simulado anterior ainda está em andamento. Use Próxima rodada para continuar ou Reiniciar ciclo para recomeçar.", true);
      return;
    }
    state.session = { poolIds: shuffle(state.bank.map(q => Number(q.id))), cursor: 0, round: 0, currentIds: [], responses: {}, completed: [], roundSubmitted: false };
    saveSession();
    $("sim-start").classList.add("hidden");
    $("simulator-summary").classList.add("hidden");
    beginRound();
  }
  function resetCycle() {
    if (!window.confirm("Reiniciar o ciclo? O progresso atual deste simulado será apagado, e as questões serão sorteadas novamente.")) return;
    state.session = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    $("simulator-quiz").classList.add("hidden");
    $("simulator-summary").classList.add("hidden");
    $("sim-next").classList.add("hidden");
    $("sim-start").classList.remove("hidden");
    $("sim-start").textContent = "Iniciar simulado";
    setStatus("Ciclo reiniciado. Nenhuma questão foi alterada no banco.");
    updateStats();
  }
  function init() {
    loadBank();
    loadSession();
    updateStats();
    $("sim-start").addEventListener("click", () => {
      if (state.session && state.session.cursor >= state.session.poolIds.length) startCycle(true);
      else if (state.session && state.session.currentIds.length) renderRound();
      else if (state.session && state.session.cursor > 0) beginRound();
      else startCycle();
    });
    $("sim-next").addEventListener("click", beginRound);
    $("sim-reset").addEventListener("click", resetCycle);
    if (!state.bank.length) {
      setStatus("Nenhuma questão encontrada no banco deste navegador. Importe o arquivo CSV na seção Banco de questões; o simulado utilizará esse banco, sem criar questões fictícias.", true);
      $("sim-start").disabled = true;
      $("sim-next").classList.add("hidden");
    } else if (state.session && state.session.currentIds.length) {
      renderRound();
    } else if (state.session && state.session.cursor < state.session.poolIds.length) {
      setStatus("Progresso recuperado: " + state.session.cursor + " questão(ões) já concluídas. Continue para a próxima rodada.");
      $("sim-start").textContent = "Continuar simulado";
    } else if (state.session) showCycleComplete();
    else setStatus("Banco carregado com " + state.bank.length + " questão(ões). Inicie para sortear a primeira rodada.");
  }
  init();
})();