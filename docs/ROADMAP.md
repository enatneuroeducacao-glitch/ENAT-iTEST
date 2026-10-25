# ENAT iTEST — roteiro técnico

## Estado atual

O repositório contém uma primeira interface estática responsiva com dados sintéticos, navegação entre áreas e criação local de registros demonstrativos. Não há backend, autenticação real, banco de dados ou persistência entre sessões.

## Etapa 0 — Base do projeto (iniciada)

- [x] Criar README e documentação inicial.
- [x] Criar painel web responsivo.
- [x] Criar navegação demonstrativa: visão geral, questões, avaliações, turmas, resultados e relatórios.
- [x] Criar formulário de avaliação demonstrativa.
- [ ] Executar testes em navegadores e dispositivos.
- [ ] Definir estratégia de publicação.

## Etapa 1 — Especificação e validação

- Inventariar modelos de dados e regras de avaliação do sistema legado.
- Confirmar titularidade/licença e permissões de reutilização do código original.
- Documentar formatos de arquivo, codificação, versões e relações entre entidades.
- Criar conjunto sintético de testes que cubra respostas, notas, questões e turmas.
- Definir stack de backend, banco de dados, hospedagem e observabilidade.

## Etapa 2 — Backend seguro

- Implementar autenticação, recuperação de conta e controle de acesso por função.
- Definir funções iniciais: administrador, professor, aluno e auditor.
- Implementar API validada no servidor para questões, avaliações, turmas, tentativas e resultados.
- Criar migrações versionadas, logs de auditoria e política de retenção.
- Adicionar testes unitários, de integração e de autorização.
- Não confiar em notas ou respostas calculadas apenas pelo navegador.

## Etapa 3 — Banco de questões e avaliação

- Cadastro, edição, categorias, tags, nível de dificuldade e estado de revisão.
- Alternativas, gabarito, explicação e origem da questão, conforme modelo aprovado.
- Montagem de avaliações, instruções, duração, tentativas e regras de correção.
- Interface de realização de prova e gravação confiável de respostas.
- Submeter, corrigir e apresentar resultados com trilha de auditoria.

## Etapa 4 — Migração legada

- Executar inventário em modo somente leitura.
- Criar cópia verificável dos arquivos de origem e registrar hashes.
- Desenvolver importador versionado sem sobrescrever originais.
- Gerar prévia com contagem de entidades, campos desconhecidos e erros.
- Importar apenas para ambiente isolado após aprovação explícita.
- Comparar amostras, contagens e notas com o sistema original.
- Documentar reversão e critérios de aceite antes de qualquer migração produtiva.

## Etapa 5 — Homologação e publicação

- Testar acessibilidade, responsividade, desempenho e segurança.
- Validar backups e procedimento de restauração.
- Verificar logs, monitoramento e alertas.
- Executar homologação com dados fictícios e usuários autorizados.
- Publicar somente após revisão de segurança e aprovação do responsável.

## Critérios mínimos para produção

- Autenticação e autorização aplicadas no servidor.
- Nenhum segredo ou dado pessoal no repositório.
- Banco de dados com backups e restauração testada.
- Testes de correção e permissões aprovados.
- Importação validada com relatório e plano de reversão.
- HTTPS, logs e tratamento seguro de erros.
