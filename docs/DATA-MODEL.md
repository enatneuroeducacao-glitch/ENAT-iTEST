# ENAT iTEST — modelo de dados proposto

**Status: proposta técnica, não aplicada a nenhum banco.** Este documento define uma primeira estrutura para revisão antes de criar migrations ou conectar qualquer ambiente. Nenhum dado real foi importado.

## Princípios

- PostgreSQL como candidato relacional; a escolha de hospedagem e do provedor ainda precisa ser confirmada.
- Identificadores UUID, timestamps em UTC e exclusão lógica quando houver necessidade de preservar trilha de auditoria.
- O servidor é a autoridade para permissões, tempo de prova, correção e publicação de resultados.
- Senhas nunca são armazenadas pela aplicação em texto puro; preferir provedor de autenticação testado.
- Dados de aluno devem ser minimizados e protegidos por autorização por turma e finalidade.
- Não usar conteúdo ou resultados reais até revisão de privacidade, segurança e regras institucionais.

## Entidades principais

### users
- `id UUID PRIMARY KEY`
- `auth_subject TEXT UNIQUE NOT NULL` — identificador do provedor de autenticação, não a senha.
- `display_name TEXT NOT NULL`
- `email TEXT` — acesso restrito; unicidade depende da política de identidade.
- `status TEXT NOT NULL` — `active`, `suspended`, `pending`
- `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`

### memberships
- `id UUID PRIMARY KEY`
- `user_id UUID REFERENCES users(id)`
- `role TEXT NOT NULL` — `admin`, `teacher`, `student`, `auditor`
- `scope_type TEXT NOT NULL` — `global`, `class`, `organization`
- `scope_id UUID NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- Restrição recomendada: combinar usuário, função e escopo para evitar vínculos duplicados.

### question_categories
- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`
- `description TEXT`
- `created_by UUID REFERENCES users(id)`
- `created_at TIMESTAMPTZ NOT NULL`

### questions
- `id UUID PRIMARY KEY`
- `category_id UUID REFERENCES question_categories(id)`
- `prompt TEXT NOT NULL`
- `question_type TEXT NOT NULL` — iniciar com `single_choice`; ampliar após especificação.
- `difficulty TEXT`
- `explanation TEXT`
- `source_reference TEXT` — autoria/licença/proveniência quando aplicável.
- `status TEXT NOT NULL` — `draft`, `review`, `published`, `archived`
- `created_by UUID REFERENCES users(id)`
- `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`

### question_options
- `id UUID PRIMARY KEY`
- `question_id UUID NOT NULL REFERENCES questions(id)`
- `option_text TEXT NOT NULL`
- `position INTEGER NOT NULL`
- `is_correct BOOLEAN NOT NULL DEFAULT FALSE`
- `UNIQUE(question_id, position)`
- A API pública de prova nunca deve enviar `is_correct` antes do encerramento autorizado.

### classes
- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`
- `description TEXT`
- `owner_id UUID REFERENCES users(id)`
- `status TEXT NOT NULL` — `active`, `archived`
- `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`

### class_members
- `class_id UUID REFERENCES classes(id)`
- `user_id UUID REFERENCES users(id)`
- `membership_status TEXT NOT NULL` — `active`, `removed`
- `joined_at TIMESTAMPTZ NOT NULL`
- Chave primária composta recomendada: `(class_id, user_id)`.

### assessments
- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `description TEXT`
- `status TEXT NOT NULL` — `draft`, `published`, `closed`, `archived`
- `duration_seconds INTEGER NULL CHECK (duration_seconds > 0)`
- `max_attempts INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts > 0)`
- `available_from TIMESTAMPTZ NULL`, `available_until TIMESTAMPTZ NULL`
- `created_by UUID REFERENCES users(id)`
- `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`

### assessment_questions
- `assessment_id UUID REFERENCES assessments(id)`
- `question_id UUID REFERENCES questions(id)`
- `position INTEGER NOT NULL`
- `points NUMERIC(8,2) NOT NULL DEFAULT 1 CHECK (points >= 0)`
- Chave primária composta recomendada: `(assessment_id, question_id)`; `position` deve ser único dentro de cada avaliação.
- Para avaliações publicadas, preservar uma versão imutável do conteúdo/gabarito utilizado na tentativa; não depender somente do estado atual da questão.

### assessment_assignments
- `id UUID PRIMARY KEY`
- `assessment_id UUID REFERENCES assessments(id)`
- `class_id UUID REFERENCES classes(id)`
- `assigned_by UUID REFERENCES users(id)`
- `assigned_at TIMESTAMPTZ NOT NULL`
- `UNIQUE(assessment_id, class_id)`

### attempts
- `id UUID PRIMARY KEY`
- `assessment_id UUID REFERENCES assessments(id)`
- `student_id UUID REFERENCES users(id)`
- `attempt_number INTEGER NOT NULL CHECK (attempt_number > 0)`
- `status TEXT NOT NULL` — `in_progress`, `submitted`, `graded`, `voided`
- `started_at TIMESTAMPTZ NOT NULL`, `submitted_at TIMESTAMPTZ NULL`
- `score NUMERIC(10,2) NULL`, `max_score NUMERIC(10,2) NULL`
- `UNIQUE(assessment_id, student_id, attempt_number)`
- O servidor valida elegibilidade, janela de disponibilidade, duração e limite de tentativas em transação.

### attempt_answers
- `id UUID PRIMARY KEY`
- `attempt_id UUID REFERENCES attempts(id)`
- `question_id UUID REFERENCES questions(id)`
- `selected_option_id UUID REFERENCES question_options(id)`
- `answered_at TIMESTAMPTZ NOT NULL`
- `is_correct BOOLEAN NULL`, `awarded_points NUMERIC(8,2) NULL`
- `UNIQUE(attempt_id, question_id)`
- Preservar snapshot/versionamento da questão e das alternativas usadas em cada tentativa antes de liberar provas reais.

### audit_events
- `id UUID PRIMARY KEY`
- `actor_user_id UUID NULL REFERENCES users(id)`
- `action TEXT NOT NULL`
- `entity_type TEXT NOT NULL`, `entity_id UUID NULL`
- `occurred_at TIMESTAMPTZ NOT NULL`
- `request_id TEXT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'` — não registrar senhas, tokens, gabaritos sigilosos ou dados pessoais desnecessários.
- A conta da aplicação não deve ter permissão para alterar ou apagar trilhas de auditoria sem procedimento administrativo controlado.

## API mínima proposta

Todas as rotas exigem autenticação, salvo login/recuperação geridos pelo provedor. Autorização deve ocorrer no servidor em cada operação.

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/v1/questions` | Listar questões conforme permissão e filtros |
| POST | `/api/v1/questions` | Criar questão em rascunho |
| PATCH | `/api/v1/questions/:id` | Atualizar questão permitida |
| GET | `/api/v1/classes` | Listar turmas acessíveis |
| POST | `/api/v1/classes` | Criar turma |
| GET | `/api/v1/assessments` | Listar avaliações acessíveis |
| POST | `/api/v1/assessments` | Criar avaliação em rascunho |
| POST | `/api/v1/assessments/:id/publish` | Validar e publicar avaliação |
| POST | `/api/v1/assessments/:id/attempts` | Iniciar tentativa autorizada |
| PUT | `/api/v1/attempts/:id/answers/:questionId` | Gravar/responder uma questão |
| POST | `/api/v1/attempts/:id/submit` | Encerrar tentativa e calcular resultado no servidor |
| GET | `/api/v1/attempts/:id/result` | Consultar resultado conforme política de liberação |

## Transações e integridade

1. Criar tentativa: verificar publicação, atribuição, janela, identidade e limite de tentativas; inserir em transação.
2. Submeter tentativa: bloquear a tentativa, validar prazo, corrigir no servidor, gravar nota e evento de auditoria na mesma transação.
3. Publicar avaliação: validar questões/alternativas, congelar versão utilizada e impedir alterações silenciosas na prova publicada.
4. Importar legado: usar tabelas/staging isoladas, chave de origem e relatório de reconciliação; nunca fazer upsert direto nas tabelas finais sem aprovação e rollback testado.

## Decisões que continuam pendentes

- Escolher e aprovar hospedagem/backend e provedor de autenticação.
- Confirmar requisitos legais, política de retenção e perfis de acesso.
- Inventariar o formato real do legado e as regras de nota.
- Especificar revisão de questões, embaralhamento, temporizador, acessibilidade e liberação de resultados.
- Criar migrations versionadas e testes apenas depois dessas decisões.
