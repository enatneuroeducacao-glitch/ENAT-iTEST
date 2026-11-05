# ENAT-iTEST — Avaliação Nacional

## Experiência do participante
- Cadastro simples: nome, e-mail, senha e UF.
- Autenticação Supabase Auth; o perfil é criado por trigger.
- Painel nacional e quadro com as 27 unidades federativas.
- Rodada com 30 questões aleatórias, sem repetição na mesma prova.
- Nota de 0 a 10; aprovação a partir de 7,0 (21 acertos).
- Feedback com acertos, erros, alternativa correta e explicação cadastrada.
- Histórico individual, acessível somente pelo titular.

## Segurança
- O navegador recebe enunciados e alternativas, nunca o gabarito.
- Seleção, correção e gravação ocorrem na Edge Function autenticada.
- Perfis e tentativas individuais têm políticas RLS.
- Dashboard retorna estatísticas agregadas por UF, sem nomes ou e-mails.
- A chave publishable em assets/supabase-config.js é pública por definição; nunca colocar service_role/secret key no frontend.

## Projeto Supabase
- Nome: ENAT-iTEST
- Ref: ngevhyzltbotmrpnfiyf
- Região: sa-east-1
- Edge Function: enat-itest-api (JWT obrigatório).

## Primeiro administrador
O primeiro participante deve se cadastrar normalmente. Depois, a conta autorizada deve ser promovida explicitamente no SQL Editor. Substitua o e-mail pelo endereço usado no cadastro:
```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_DO_ADMIN');
```
O primeiro visitante não recebe privilégios administrativos automaticamente.

## Importação do banco
1. Promover a conta administrativa.
2. Entrar na plataforma e usar Administração ENAT > Selecionar CSV.
3. O arquivo deve ter até 2 MB e colunas id,prompt,category,type,options,answer.
4. O importador reconhece os 17 códigos oficiais e os aliases NEU→NAT e PRO→FAP.
5. Arquivos acima de 1.000 registros são divididos em lotes; a gravação ocorre em blocos de até 250.
6. IDs originais são preservados; reenviar o arquivo não duplica os IDs.

## HSI-DOTH-P
O portal contém uma seção independente de autoavaliação piloto Likert 1.0.0, com 25 afirmações (cinco por dimensão), cinco opções de resposta, recodificação de itens invertidos e cinco indicadores separados. Não há nota global. O resultado não é diagnóstico, laudo, medida validada de aptidão ou instrumento psicométrico validado. Consulte docs/HSI-DOTH-P-PILOTO.md para metodologia, limites, cálculo e plano de validação. A nota de conhecimento ENAT permanece totalmente separada.

## Homologação pendente
- Criar e confirmar o primeiro usuário participante.
- Promover a conta administrativa autorizada e importar o CSV de 1.712 questões.
- Testar cadastro, confirmação de e-mail, início, finalização, nota, feedback e histórico.
- Testar dashboard nacional/UF após as primeiras tentativas.
- Executar advisors de segurança e desempenho após importação.
- Configurar URL de produção nas URLs permitidas do Supabase Auth antes do deploy público.
