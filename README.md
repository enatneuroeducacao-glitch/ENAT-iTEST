# ENAT iTEST — Plataforma Web de Avaliações

Plataforma web do ENAT para administrar bancos de questões, organizar avaliações e turmas, aplicar provas e acompanhar resultados.

> **Estado:** scaffold inicial de produto. Não é ainda uma aplicação pronta para produção; autenticação real, persistência centralizada e migração dos arquivos legados serão etapas próprias.

## Objetivos da primeira versão

- Interface adaptável para administração e avaliações.
- Catálogo de questões e categorias.
- Organização de turmas e avaliações.
- Experiência de prova simples e clara para estudantes.
- Relatórios e resultados com regras de correção testáveis.
- Importação futura de formatos legados com validação prévia e cópias de segurança.

## Segurança e integridade de dados

- Nenhum dado de produção deve ser carregado nesta versão inicial.
- Nunca incluir credenciais, tokens, senhas, chaves privadas ou dados pessoais reais nos commits.
- Todo importador legado deve operar primeiro em modo somente leitura e gerar relatório de pré-visualização.
- Não executar migração real até que testes de equivalência e procedimento de rollback sejam aprovados.
- Os dados de demonstração são sintéticos.

## Executar localmente

Esta versão inicial é estática, sem backend:

1. Abra `index.html` em um navegador moderno.
2. Para desenvolvimento, pode servir a pasta com qualquer servidor HTTP estático.

## Estrutura

- `index.html` — interface da aplicação.
- `assets/styles.css` — estilos responsivos.
- `assets/app.js` — navegação e interações locais com dados demonstrativos.
- `docs/ROADMAP.md` — arquitetura-alvo e etapas.
- `docs/LEGACY-IMPORT.md` — estratégia de importação segura.
- `tests/smoke-test.js` — testes estáticos básicos sem dependências externas.

## Publicação da demonstração

O workflow de validação roda a cada alteração em `main`. A publicação por GitHub Pages está preparada em `.github/workflows/pages.yml`, mas o site precisa ser habilitado uma única vez nas configurações do repositório porque a integração de automação não tem permissão para criar o site Pages:

1. Abra **Settings → Pages** neste repositório.
2. Selecione a publicação por **GitHub Actions**, se solicitado.
3. Depois de habilitado, abra **Actions → Deploy ENAT iTEST to GitHub Pages → Run workflow**.

A publicação só hospeda a interface estática demonstrativa. Não ativa backend, login real, banco de dados ou migração.

## Limitações conhecidas

A demonstração mantém o estado no navegador e usa dados de exemplo; não é multiusuário e não oferece autenticação, banco de dados, sincronização ou segurança de prova em servidor. Esses recursos precisam de backend e testes próprios antes de qualquer uso real.

## Direção técnica

Começar com uma interface simples e auditável; depois escolher e documentar stack de backend, banco de dados, autenticação, autorização por perfil, logs e estratégia de backup antes de integrar dados reais.
