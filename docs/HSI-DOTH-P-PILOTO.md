# HSI-DOTH-P — versão piloto experimental 1.0.0

## Objetivo e limites
Módulo de autoavaliação para reflexão sobre padrões autorrelatados relacionados a decisões, organização, tempo, humanização e autopercepção psicocomportamental. Esta versão é experimental, construída para teste de compreensão, usabilidade e consistência operacional. Não é instrumento psicométrico validado, teste psicológico, diagnóstico, avaliação clínica, laudo, certificação ou medida de aptidão. Não deve ser usado para seleção, contratação, habilitação, avaliação de desempenho profissional ou decisões individuais de alto impacto.

## Formato
- 25 afirmações, cinco por dimensão.
- Escala Likert de cinco pontos: 1 Discordo totalmente; 2 Discordo; 3 Nem concordo nem discordo; 4 Concordo; 5 Concordo totalmente.
- Aplicação independente da avaliação de conhecimentos ENAT.
- Participação voluntária, com aviso explícito antes do início.
- O participante pode sair antes de enviar; respostas só são gravadas na conclusão.
- Cada aplicação recebe uma versão fixa do instrumento (1.0.0).

## Dimensões e itens
| Dimensão | Códigos | Foco reflexivo |
|---|---|---|
| Decision | DEC-01 a DEC-05 | Consideração de informações, alternativas e consequências |
| Organization | ORG-01 a ORG-05 | Planejamento, priorização e acompanhamento |
| Time | TIM-01 a TIM-05 | Ritmo, prazos e antecipação de imprevistos |
| Humanization | HUM-01 a HUM-05 | Escuta, respeito, comunicação e consideração pelo outro |
| Psychocomportamental | PSY-01 a PSY-05 | Percepção da influência emocional e pausa antes de agir |

Há um item invertido em cada dimensão. A recodificação é realizada exclusivamente no servidor: valor pontuado = 6 − resposta original para itens invertidos; os demais mantêm a resposta original.

## Cálculo
Cada dimensão é calculada separadamente pela média dos cinco itens recodificados, de 1 a 5. Para facilitar a leitura, o sistema também exibe um índice descritivo transformado:
`índice = (média − 1) × 25`
O índice varia de 0 a 100. Não há nota total ou classificação global HSI nesta versão.

Faixas exibidas:
- abaixo de 2,34: concordância baixa;
- de 2,34 a 3,66: concordância intermediária;
- a partir de 3,67: concordância alta.

As faixas descrevem somente a concordância com as afirmações formuladas positivamente após recodificação. Não representam níveis de risco, aptidão, capacidade, saúde mental ou mérito.

## Feedback
O feedback é textual, específico por dimensão e orientado à reflexão. Não compara o participante com outras pessoas e não faz inferências clínicas. O resultado individual e o histórico ficam disponíveis somente ao titular por meio da Edge Function autenticada. Não há publicação de resultados HSI por estado nem dashboard coletivo nesta fase.

## Privacidade e segurança
- Itens, tentativas e respostas HSI não têm acesso direto concedido a anon/authenticated.
- RLS está habilitado nas três tabelas; políticas explícitas negam acesso direto ao cliente.
- A Edge Function valida JWT e propriedade da tentativa; operações de escrita e cálculo usam service_role apenas no servidor.
- A função SQL de conclusão é transacional e executável somente por service_role.
- Respostas individuais não são incluídas no dashboard nacional/estadual.

## Plano de validação do piloto
1. Fazer teste de compreensão das afirmações com participantes voluntários e diversidade de perfis.
2. Registrar dúvidas, itens ambíguos, tempo de resposta e abandono.
3. Avaliar distribuição das respostas e consistência dos itens por dimensão, sem tratar resultados iniciais como validação.
4. Revisar linguagem e conteúdo com especialistas em educação, segurança viária, psicologia e metodologia de pesquisa.
5. Definir protocolo ético e de proteção de dados adequado antes de qualquer pesquisa formal ou publicação.
6. Somente após estudo metodológico apropriado considerar análise de confiabilidade, estrutura fatorial, validade e eventual revisão do instrumento.

A versão 1.0.0 deve permanecer congelada durante a primeira rodada de coleta. Alterações futuras devem gerar nova versão, sem sobrescrever respostas ou resultados anteriores.
