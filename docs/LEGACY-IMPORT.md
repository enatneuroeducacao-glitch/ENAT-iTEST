# Importação do sistema legado — procedimento seguro

## Regra principal

Os arquivos originais são fonte de leitura e não podem ser alterados pelo importador. A versão inicial do ENAT iTEST não executa importação; este documento estabelece os requisitos para uma etapa futura.

## Procedimento esperado

1. Trabalhar em cópia isolada dos arquivos entregues.
2. Registrar nome, tamanho, data disponível e SHA-256 de cada arquivo.
3. Detectar o formato e a versão antes de interpretar campos.
4. Ler sem gravar no arquivo de origem; rejeitar arquivos truncados ou inválidos com erro explicável.
5. Converter para uma representação intermediária versionada.
6. Produzir relatório de prévia: contagens, relações, valores ausentes, registros rejeitados e campos não reconhecidos.
7. Não importar nada sem aprovação explícita do responsável.
8. Em homologação, importar para banco separado e comparar contagens e resultados.
9. Registrar a execução, versão do conversor, hashes de entrada e relatório de saída.
10. Para qualquer divergência, interromper a migração e investigar; nunca corrigir silenciosamente dados de origem.

## Verificações

- Quantidade de categorias, questões, opções, turmas, alunos, avaliações e resultados.
- Integridade das referências entre entidades.
- Codificação de texto, caracteres acentuados e conteúdo multilinha.
- Questões com uma ou mais respostas corretas conforme regra original.
- Pontuação total, respostas em branco e arredondamento.
- Duplicidades e identificadores ausentes.
- Comparação de amostras e resultados conhecidos.

## Segurança e privacidade

- Usar dados sintéticos em desenvolvimento.
- Não enviar arquivos com dados pessoais para repositórios públicos.
- Nunca gravar credenciais ou tokens em arquivos de configuração versionados.
- Restringir acesso aos backups e definir período de retenção.
- Armazenar relatórios de migração sem expor conteúdo sensível desnecessário.

## Critério de aceite

A migração só pode ser aprovada quando a origem permanecer intacta, o relatório não apresentar divergências não explicadas, as regras de pontuação estiverem verificadas e existir um procedimento de restauração testado.
