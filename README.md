# ENAT iTEST — Plataforma Nacional de Avaliação

Portal do Ensino Neuroeducacional Aplicado ao Trânsito para cadastro de participantes, avaliações objetivas e indicadores nacionais/estaduais.

## Funcionalidades
- Cadastro com nome, e-mail, senha e estado (UF).
- Painel nacional com participantes, avaliações, média e aprovação.
- Comparativo agregado das 27 unidades federativas.
- Rodadas de 30 questões aleatórias, sem repetição na mesma rodada.
- Nota de 0 a 10, aprovação a partir de 7,0 (21 acertos).
- Feedback de acertos, erros, gabarito e explicações.
- Histórico individual.
- Importação administrativa CSV com preservação de IDs.

## Stack
- Frontend estático: HTML, CSS e JavaScript.
- Autenticação, PostgreSQL, RLS e Edge Functions: Supabase.
- Projeto Supabase: ngevhyzltbotmrpnfiyf, região sa-east-1.
- API: Edge Function enat-itest-api.

## Desenvolvimento local
Sirva a raiz do repositório por HTTP/HTTPS (não abra como file://), pois autenticação e módulos externos exigem uma origem web.

## Segurança
O gabarito não é enviado ao navegador. A correção ocorre na Edge Function autenticada. A chave publishable é pública; a chave service_role permanece somente no ambiente gerenciado do Supabase. RLS protege perfis e histórico; painéis exibem somente agregados estaduais.

## Primeiro administrador
Após o primeiro cadastro, a conta administrativa autorizada deve ser promovida explicitamente no SQL Editor. Consulte docs/PLATAFORMA-AVALIACAO-NACIONAL.md. Não há promoção automática do primeiro visitante.

## Banco de questões
O CSV de 1.712 questões pode ser carregado pelo painel Administração ENAT após a promoção do administrador. O importador aceita até 2 MB, reconhece os códigos oficiais, divide lotes grandes e mantém IDs originais.

## HSI-DOTH-P
A classificação HSI é opcional e não é inferida automaticamente a partir de uma disciplina. A nota de conhecimento ENAT e os indicadores HSI permanecem separados.

## Validação
Execute node tests/smoke-test.js para testes estáticos básicos. A homologação de produção exige testes de cadastro, autenticação, sorteio, correção, histórico, importação e revisão dos advisors do Supabase.
