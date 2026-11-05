# ENAT iTEST — Plataforma Nacional de Avaliação

Portal do Ensino Neuroeducacional Aplicado ao Trânsito para cadastro de participantes, avaliações objetivas e indicadores nacionais/estaduais.

## Funcionalidades
- Cadastro com nome, e-mail, senha e estado (UF).
- Painel nacional com participantes, avaliações, média e aprovação.
- Comparativo agregado das 27 unidades federativas.
- Rodadas de 30 questões aleatórias, sem repetição na mesma rodada.
- Nota de 0 a 10, aprovação a partir de 7,0 (21 acertos).
- Feedback de acertos, erros, gabarito e explicações.
- Histórico individual e importação administrativa CSV com preservação de IDs.
- Seção HSI-DOTH-P piloto: 25 afirmações Likert, cinco dimensões e cinco indicadores separados da nota ENAT.

## Stack e ambiente
- Frontend estático: HTML, CSS e JavaScript.
- Autenticação, PostgreSQL, RLS e Edge Functions: Supabase.
- Projeto: ngevhyzltbotmrpnfiyf (sa-east-1).
- Edge Function: enat-itest-api.

## Segurança
O gabarito não é enviado ao navegador. A correção ocorre na Edge Function autenticada. O frontend contém somente chave publishable; a chave service_role permanece no ambiente gerenciado do Supabase. RLS protege perfis e histórico; os painéis exibem somente dados agregados por UF.

## Primeiro administrador e importação
Após o primeiro cadastro, a conta administrativa autorizada deve ser promovida explicitamente no SQL Editor. Consulte docs/PLATAFORMA-AVALIACAO-NACIONAL.md. O CSV de 1.712 questões pode então ser importado no painel Administração ENAT; os lotes grandes são divididos automaticamente e os IDs originais são mantidos.

## HSI-DOTH-P
O módulo piloto oferece 25 afirmações em escala Likert, cinco dimensões e cinco indicadores descritivos separados da nota ENAT. Não é instrumento psicométrico validado nem diagnóstico. Consulte docs/HSI-DOTH-P-PILOTO.md.

## Validação
Execute node tests/smoke-test.js para testes estáticos básicos. A homologação de produção exige testes de cadastro, autenticação, sorteio, correção, histórico, importação e revisão dos advisors do Supabase.
