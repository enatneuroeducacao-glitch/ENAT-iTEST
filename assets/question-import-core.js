(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.ENATQuestionImportCore = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this), function () {
  "use strict";

  const MAX_FILE_BYTES = 2 * 1024 * 1024;
  const MAX_QUESTIONS = 1000;
  const DISCIPLINES = Object.freeze({
    DD: "Direção Defensiva",
    LT: "Legislação de Trânsito",
    CRT: "Crimes de Trânsito",
    INF: "Infrações",
    NGCC: "Normas Gerais de Circulação e Conduta",
    SIN: "Sinalização",
    PS: "Primeiros Socorros",
    CID: "Cidadania",
    MEI: "Meio Ambiente",
    MEC: "Mecânica Básica",
    RI: "Relacionamento Interpessoal",
    PST: "Psicologia de Trânsito",
    PRA: "Prática de Direção",
    ENGT: "Engenharia de Tráfego",
    DID: "Didática",
    NAT: "Neuroeducação Aplicada ao Trânsito",
    FAP: "Formação e Atuação Profissional"
  });

  function normalizeId(value, rowNumber) {
    const id = String(value == null ? "" : value).trim();
    if (!id) throw new Error("linha " + rowNumber + ": ID obrigatório; o identificador original não pode ser gerado ou substituído.");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id)) {
      throw new Error("linha " + rowNumber + ": ID inválido. Use até 64 caracteres alfanuméricos, ponto, hífen ou sublinhado.");
    }
    return id;
  }

  function normalizeCategory(value) {
    return String(value == null ? "" : value)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  }

  const CATEGORY_ALIASES = Object.freeze({
    "crime de transito": "Crimes de Trânsito",
    "infracao": "Infrações",
    "infracao de transito": "Infrações",
    "direcao defensiva": "Direção Defensiva",
    "legislacao de transito": "Legislação de Trânsito",
    "normas gerais de circulacao e conduta": "Normas Gerais de Circulação e Conduta",
    "sinalizacao": "Sinalização",
    "primeiros socorros": "Primeiros Socorros",
    "cidadania": "Cidadania",
    "meio ambiente": "Meio Ambiente",
    "mecanica basica": "Mecânica Básica",
    "relacionamento interpessoal": "Relacionamento Interpessoal",
    "psicologia de transito": "Psicologia de Trânsito",
    "pratica de direcao": "Prática de Direção",
    "engenharia de trafego": "Engenharia de Tráfego",
    "didatica": "Didática",
    "neuroeducacao aplicada ao transito": "Neuroeducação Aplicada ao Trânsito",
    "formacao e atuacao profissional": "Formação e Atuação Profissional"
  });

  const LEGACY_PREFIXES = Object.freeze({ NEU: "NAT", PRO: "FAP" });

  function resolveDiscipline(idValue, categoryValue, rowNumber) {
    const id = normalizeId(idValue, rowNumber || 1);
    const prefixMatch = id.match(/^([A-Z]{2,4})\d/i);
    const rawPrefix = prefixMatch ? prefixMatch[1].toUpperCase() : null;
    const prefix = rawPrefix ? (LEGACY_PREFIXES[rawPrefix] || rawPrefix) : null;
    const categoryKey = normalizeCategory(categoryValue);
    const suppliedCategory = CATEGORY_ALIASES[categoryKey] || null;
    if (prefix && DISCIPLINES[prefix]) {
      return { code: prefix, name: DISCIPLINES[prefix], source: "id-prefix", categoryConflict: Boolean(suppliedCategory && suppliedCategory !== DISCIPLINES[prefix]) };
    }
    if (suppliedCategory) {
      const entry = Object.entries(DISCIPLINES).find(([, name]) => name === suppliedCategory);
      return { code: entry ? entry[0] : null, name: suppliedCategory, source: "category", categoryConflict: false };
    }
    throw new Error("linha " + (rowNumber || 1) + ": não foi possível classificar a questão. O ID '" + id + "' não contém um dos 17 prefixos oficiais e a categoria '" + String(categoryValue || "vazia") + "' não é oficial. Não será atribuída uma disciplina por suposição.");
  }

  function assertLimits(fileSize, questionCount) {
    if (!Number.isFinite(fileSize) || fileSize < 0 || fileSize > MAX_FILE_BYTES) {
      throw new Error("limite de arquivo: 2 MB.");
    }
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > MAX_QUESTIONS) {
      throw new Error("limite de importação: até 1.000 questões por arquivo.");
    }
    return true;
  }

  function validateBatch(incoming, existing, mode) {
    const seen = new Set();
    incoming.forEach((question, index) => {
      const id = normalizeId(question && question.id, index + 2);
      const key = id.toLocaleUpperCase("pt-BR");
      if (seen.has(key)) throw new Error("ID duplicado no arquivo: " + id + ". Nenhum registro foi gravado.");
      seen.add(key);
    });
    if (mode === "append") {
      const existingIds = new Set((existing || []).map(q => String(q.id).trim().toLocaleUpperCase("pt-BR")));
      const collisions = incoming.map(q => String(q.id).trim()).filter(id => existingIds.has(id.toLocaleUpperCase("pt-BR")));
      if (collisions.length) throw new Error("IDs já existentes no banco: " + [...new Set(collisions)].slice(0, 20).join(", ") + ". Use substituição ou corrija o lote; os IDs não serão renumerados.");
    }
    return true;
  }

  return Object.freeze({ MAX_FILE_BYTES, MAX_QUESTIONS, DISCIPLINES, LEGACY_PREFIXES, normalizeId, normalizeCategory, resolveDiscipline, assertLimits, validateBatch });
});
