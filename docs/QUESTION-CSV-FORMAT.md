# Importação e exportação CSV do banco de questões

## Estado e limites

O módulo atual importa e exporta questões próprias armazenadas no `localStorage` deste navegador. Não é um banco compartilhado entre computadores, não substitui uma API e não grava dados no servidor. O arquivo de exportação deve ser guardado como cópia de segurança antes de limpar os dados do navegador.

## Cabeçalho obrigatório

O CSV deve usar UTF-8 (BOM é aceito) e cabeçalho com estes nomes exatos:

```csv
prompt,category,type,options,answer,pairs,expectedAnswer,updated
```

- `prompt`: enunciado da questão.
- `category`: categoria ou área.
- `type`: `multiple_choice`, `true_false`, `matching`, `short_text` ou `essay`.
- `options`: alternativas separadas por `|`; necessário para múltipla escolha e verdadeiro/falso.
- `answer`: número da alternativa correta, começando em 1; por exemplo, 1 é a primeira alternativa.
- `pairs`: pares de associação no formato `termo=>correspondência`, separados por `|`.
- `expectedAnswer`: resposta esperada para resposta curta.
- `updated`: campo informativo opcional.

Campos de texto com vírgulas, aspas ou quebras de linha devem seguir a regra CSV de envolver o campo em aspas duplas; aspas internas são duplicadas. Em `options` e `pairs`, não use o separador interno `|` no próprio texto da alternativa/termo.

## Tipos

- **Múltipla escolha:** pelo menos duas alternativas não vazias e `answer` válido.
- **Verdadeiro ou falso:** exatamente duas alternativas e gabarito válido.
- **Relação/associação:** pelo menos dois pares preenchidos em `pairs`.
- **Resposta curta:** `expectedAnswer` obrigatório.
- **Discursiva:** enunciado obrigatório; a correção manual/por rubrica ainda precisa de backend próprio.

## Importação segura

A importação valida o arquivo inteiro antes de gravar. Se qualquer linha falhar, nenhuma questão do arquivo é adicionada. Limite atual: 2 MB e 1.000 questões por arquivo. As questões importadas são adicionadas às questões locais existentes, sem substituir automaticamente registros existentes.

## Limitação importante

GitHub Pages publica arquivos estáticos. Para tornar o sistema multiusuário e adequado a avaliações reais, ainda são necessários backend, banco de dados, autenticação, autorização, auditoria, backups do servidor e testes de segurança. Não coloque dados pessoais de alunos neste protótipo.
