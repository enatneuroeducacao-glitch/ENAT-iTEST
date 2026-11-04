# Importação e exportação CSV do banco de questões

## Estado e limites

A versão estática armazena os registros em `localStorage` deste navegador. Isso é apenas armazenamento local de demonstração: não sincroniza entre computadores e não substitui o backend multiusuário. Não use este armazenamento para dados pessoais de alunos ou avaliações oficiais.

**Limites únicos para CSV e backup JSON:**
- Tamanho máximo: **2 MB por arquivo**.
- Quantidade máxima: **1.000 questões por arquivo**.
- Lotes maiores devem ser divididos em arquivos independentes. Para o primeiro lote, use **Substituir**; para os seguintes, use **Adicionar**.
- No modo Adicionar, qualquer colisão de ID com o banco existente interrompe a operação. O sistema não renumera nem substitui IDs.

## Cabeçalho obrigatório

O CSV deve usar UTF-8 (BOM é aceito) e conter os seguintes nomes de coluna:

```csv
id,prompt,category,type,options,answer,pairs,expectedAnswer,updated
```

- `id`: **obrigatório e preservado exatamente como recebido**. Aceita códigos alfanuméricos como `DD0110`, `NGCC0001`, `NAT0001` e `FAP0001`. Não é recalculado na importação.
- `prompt`: enunciado da questão.
- `category`: nome oficial da disciplina. Se estiver genérico (por exemplo, `Categoria 0`), a disciplina é resolvida pelo prefixo oficial do ID. Se não houver prefixo reconhecido nem categoria oficial, a linha é rejeitada; nenhuma disciplina é inventada.
- `type`: `multiple_choice`, `true_false`, `matching`, `short_text` ou `essay`.
- `options`: alternativas separadas por `|`; necessário para múltipla escolha e verdadeiro/falso.
- `answer`: letra (A, B, C...) ou número da alternativa correta começando em 1.
- `pairs`: pares no formato `termo=>correspondência`, separados por `|`.
- `expectedAnswer`: resposta esperada para resposta curta.
- `updated`: campo informativo opcional.

Campos de texto com vírgulas, aspas ou quebras de linha devem seguir a regra CSV de envolver o campo em aspas duplas; aspas internas são duplicadas. Em `options` e `pairs`, não use o separador interno `|` no próprio texto da alternativa/termo.

## Disciplinas oficiais e prefixos

| Prefixo | Disciplina |
|---|---|
| DD | Direção Defensiva |
| LT | Legislação de Trânsito |
| CRT | Crimes de Trânsito |
| INF | Infrações |
| NGCC | Normas Gerais de Circulação e Conduta |
| SIN | Sinalização |
| PS | Primeiros Socorros |
| CID | Cidadania |
| MEI | Meio Ambiente |
| MEC | Mecânica Básica |
| RI | Relacionamento Interpessoal |
| PST | Psicologia de Trânsito |
| PRA | Prática de Direção |
| ENGT | Engenharia de Tráfego |
| DID | Didática |
| NAT | Neuroeducação Aplicada ao Trânsito |
| FAP | Formação e Atuação Profissional |

O prefixo do ID é a referência prioritária. Se o texto da categoria divergir do prefixo reconhecido, a classificação oficial do prefixo prevalece. Prefixos longos, como `NGCC` e `ENGT`, são reconhecidos integralmente. Para compatibilidade com lotes antigos, os prefixos históricos `NEU` e `PRO` ainda são lidos como `NAT` e `FAP`, respectivamente; novos IDs devem usar os códigos atualizados.

## Tipos

- **Múltipla escolha:** pelo menos duas alternativas não vazias e gabarito válido.
- **Verdadeiro ou falso:** exatamente duas alternativas e gabarito válido.
- **Relação/associação:** pelo menos dois pares preenchidos em `pairs`.
- **Resposta curta:** `expectedAnswer` obrigatório.
- **Discursiva:** enunciado obrigatório; a correção manual/por rubrica ainda precisa de backend próprio.

## Integridade da importação

1. O arquivo inteiro é validado antes de qualquer gravação.
2. IDs ausentes, inválidos ou duplicados no próprio arquivo bloqueiam a importação.
3. No modo Adicionar, IDs já existentes bloqueiam a operação.
4. IDs são preservados como texto, inclusive os códigos alfanuméricos das disciplinas.
5. Duplicidade de conteúdo é sinalizada, mas não provoca renumeração nem descarte silencioso de registros com IDs distintos.
6. Na substituição, o banco local existente é exportado antes da gravação.
7. Se qualquer validação falhar, nada é gravado.

## Limitação de persistência

GitHub Pages publica arquivos estáticos. A plataforma ainda precisa de backend, banco de dados centralizado, autenticação, autorização, auditoria, backups no servidor e testes de segurança para operar com múltiplos usuários. O armazenamento local desta versão não sincroniza e não deve ser considerado ambiente de produção.
