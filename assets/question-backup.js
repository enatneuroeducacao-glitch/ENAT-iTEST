(() => {
  "use strict";
  const STORAGE_KEY = "enat-itest-demo-questions-v1";
  const allowedTypes = new Set(["multiple_choice", "true_false", "matching", "short_text", "essay"]);
  const byId = (id) => document.getElementById(id);

  function notify(message) {
    const toast = byId("toast");
    if (!toast) { window.alert(message); return; }
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 4500);
  }

  function readStoredQuestions() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("O arquivo local de questões não contém uma lista válida.");
    return data;
  }

  function exportQuestions() {
    try {
      const questions = readStoredQuestions();
      if (!questions.length) {
        notify("Ainda não há questões próprias salvas neste navegador para exportar.");
        return;
      }
      const payload = {
        format: "enat-itest-question-bank",
        version: 1,
        exportedAt: new Date().toISOString(),
        note: "Backup de questões próprias salvas localmente. Não inclui dados de alunos.",
        questions
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "enat-itest-banco-questoes-backup.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Backup JSON do banco de questões gerado.");
    } catch (error) {
      notify("Não foi possível exportar: " + error.message);
    }
  }

  function validateQuestion(question) {
    if (!question || typeof question !== "object") return false;
    if (typeof question.prompt !== "string" || !question.prompt.trim()) return false;
    if (typeof question.kind !== "string" || !question.kind.trim()) return false;
    const type = question.type || "multiple_choice";
    if (!allowedTypes.has(type)) return false;
    if (type === "multiple_choice" || type === "true_false") {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => typeof option !== "string" || !option.trim())) return false;
      if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) return false;
      if (type === "true_false" && question.options.length !== 2) return false;
    }
    if (type === "matching" && (!Array.isArray(question.pairs) || question.pairs.length < 2 || question.pairs.some((pair) => !pair || !String(pair.left || "").trim() || !String(pair.right || "").trim()))) return false;
    if (type === "short_text" && (typeof question.expectedAnswer !== "string" || !question.expectedAnswer.trim())) return false;
    return true;
  }

  async function importQuestions(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify("O arquivo ultrapassa 2 MB. Divida o backup antes de importar.");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed && parsed.format === "enat-itest-question-bank" && Array.isArray(parsed.questions) ? parsed.questions : null;
      if (!incoming) throw new Error("Formato inválido. Selecione um backup JSON do ENAT iTEST.");
      if (!incoming.length) throw new Error("O arquivo não contém questões.");
      if (incoming.length > 1000) throw new Error("Limite de importação: 1.000 questões por arquivo.");
      const invalid = incoming.findIndex((question) => !validateQuestion(question));
      if (invalid !== -1) throw new Error("A questão " + (invalid + 1) + " não passou na validação. Nenhum dado foi importado.");
      const existing = readStoredQuestions();
      const nextId = Math.max(3, ...existing.map((question) => Number(question.id) || 0)) + 1;
      const imported = incoming.map((question, index) => ({
        ...question,
        id: nextId + index,
        type: question.type || "multiple_choice",
        updated: "Importada em " + new Date().toLocaleDateString("pt-BR")
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.concat(imported)));
      notify(imported.length + " questão(ões) importada(s). A página será atualizada.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      notify("Importação cancelada: " + error.message);
    } finally {
      const input = byId("import-questions-file");
      if (input) input.value = "";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const exportButton = byId("export-questions");
    const importButton = byId("import-questions-button");
    const fileInput = byId("import-questions-file");
    if (exportButton) exportButton.addEventListener("click", exportQuestions);
    if (importButton && fileInput) importButton.addEventListener("click", () => fileInput.click());
    if (fileInput) fileInput.addEventListener("change", (event) => importQuestions(event.target.files && event.target.files[0]));
  });
})();