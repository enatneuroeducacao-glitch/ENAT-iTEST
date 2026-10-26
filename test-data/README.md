# Prova fictícia para teste do ENAT iTEST

## Arquivo
`test-data/enat-itest-prova-ficticia.csv`

- 15 questões fictícias para homologação.
- Categorias diferentes para validar a separação por categoria.
- Tipos incluídos: múltipla escolha, verdadeiro/falso, relação/associação e resposta curta.
- Delimitador CSV: ponto e vírgula (`;`).
- Não contém dados pessoais nem questões de uma prova oficial.

## Como testar
1. Abra o ENAT iTEST e entre em **Banco de questões**.
2. Use **Importar CSV** e selecione o arquivo.
3. Confira se as 15 questões aparecem e se cada categoria mantém suas próprias questões.
4. Crie uma avaliação chamada **Prova fictícia — Homologação QR/Correção**, categoria **Educação para o trânsito**.
5. Vincule somente as questões dessa categoria. Para testar todos os tipos de questão, crie avaliações separadas por categoria ou use questões da mesma categoria com tipos variados.
6. Imprima a prova, a folha de respostas e o gabarito.
7. Teste a leitura do QR com uma imagem nítida.

## Gabarito de conferência
As questões de múltipla escolha e verdadeiro/falso usam índice zero para a resposta correta:
- múltipla escolha: `answer=0` corresponde à alternativa A;
- verdadeiro/falso: `answer=0` corresponde a Verdadeiro;
- relação: confira os pares descritos no campo `pairs`;
- resposta curta: confira o texto de referência em `expectedAnswer`.

## Limitação importante
O QR Code atual identifica o documento/avaliação. A leitura de QR, isoladamente, não lê as bolhas preenchidas. A correção automática exige um modelo de folha de respostas estável, leitura OMR, validação de alinhamento e comparação com o gabarito. Não atribua notas com base apenas na identificação do QR.
