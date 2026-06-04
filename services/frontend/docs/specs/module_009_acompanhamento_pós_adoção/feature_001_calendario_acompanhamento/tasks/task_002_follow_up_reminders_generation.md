# TASK-FULL-002 — Domínio Follow-Up: Geração de Lembretes + Listagem (Backend + Frontend)

**Root**: `catdogmario/services/backend/` e `catdogmario/services/frontend/`
**Branch**: `feature/TASK-FULL-002-follow-up-reminders-generation`
**Spec**: `.makuco/specs/module_009_acompanhamento_pós_adoção/feature_001_calendario_acompanhamento/spec_context.md`
**Part**: 2 of 5 — Geração automática de lembretes e listagem
**Generated**: `2026-06-03`

---

## Context

Implementa o core da FEATURE-001: ao concluir uma adoção, o sistema gera automaticamente 3 lembretes (30/60/90 dias). Voluntários e admins visualizam os lembretes em uma lista com filtros. Também estabelece as migrations das tabelas `follow_up_reminders` e `follow_up_contacts`, e cria o domínio backend `follow-up` completo.

---

## Scope

**In:**
- Migrations das tabelas `follow_up_reminders` e `follow_up_contacts`
- Domínio `follow-up` no backend: types, errors, repository, service, controller, routes, validator
- Método `generateReminders()` chamado dentro da transação de "completar adoção"
- Hook no `adoption-requests.service` para invocar geração de lembretes
- Registrar rota `/follow-up` em `app.ts`
- Endpoints GET `/reminders` (com filtros) e GET `/reminders/:id`
- Service frontend `follow-up.service.ts`
- Hook `useFollowUpList.ts`
- Página `FollowUpListPage.tsx` com filtros e indicação visual de status
- Rota no frontend `/ong/follow-up`
- Testes unitários e de integração

**Out:**
- Rotina diária de notificações (TASK-003)
- Cancelamento por devolução (TASK-003)
- Redistribuição por desligamento (TASK-003)
- Registro de contato (TASK-004)
- Timeline/histórico (TASK-005)
- Não modificar o fluxo de conclusão do pedido além de adicionar a chamada ao `followUpService`

---

## Ubiquitous Language

| Termo de Negócio | Mapeamento no Código |
|---|---|
| Lembrete de acompanhamento | `follow_up_reminders` table / `FollowUpReminder` type |
| Contato realizado | `follow_up_contacts` table / `FollowUpContact` type |
| Marco (30/60/90 dias) | `reminder_number`: 1, 2, 3 |
| Voluntário atribuído | `assigned_volunteer_id` — quem completa a adoção |
| Status do lembrete | `pending` → `completed` / `cancelled` / `overdue` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `services/backend/src/database/migrations/20260604_021_create_follow_up_reminders_table.ts` | tabela lembretes |
| `create` | `services/backend/src/database/migrations/20260604_022_create_follow_up_contacts_table.ts` | tabela contatos |
| `create` | `services/backend/src/domains/follow-up/follow-up.types.ts` | interfaces e enums |
| `create` | `services/backend/src/domains/follow-up/follow-up.errors.ts` | erros do domínio |
| `create` | `services/backend/src/domains/follow-up/follow-up.repository.ts` | queries Knex |
| `create` | `services/backend/src/domains/follow-up/follow-up.service.ts` | lógica de negócio |
| `create` | `services/backend/src/domains/follow-up/follow-up.controller.ts` | request/response |
| `create` | `services/backend/src/domains/follow-up/follow-up.routes.ts` | rotas Express |
| `create` | `services/backend/src/domains/follow-up/follow-up.validator.ts` | schemas Zod |
| `modify` | `services/backend/src/app.ts` | registrar rota /follow-up |
| `modify` | `services/backend/src/domains/adoption-requests/adoption-requests.service.ts` | hook geração lembretes |
| `create` | `services/frontend/src/services/follow-up.service.ts` | client Axios |
| `create` | `services/frontend/src/hooks/useFollowUpList.ts` | estado + filtros |
| `create` | `services/frontend/src/pages/ong/FollowUpListPage.tsx` | página de lembretes |
| `modify` | `services/frontend/src/routes/index.tsx` | rota /ong/follow-up |
| `create` | `services/backend/tests/unit/follow-up.service.spec.ts` | testes unitários |
| `create` | `services/backend/tests/integration/follow-up.reminders.spec.ts` | testes integração |

---

## Implementation

### `20260604_021_create_follow_up_reminders_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260603_018_create_visits_table.ts`
**Differences from reference**:
- Tabela: `follow_up_reminders`
- Colunas:
  - `id` VARCHAR(36) PK
  - `adoption_request_id` VARCHAR(36) FK→adoption_requests.id NOT NULL
  - `animal_id` VARCHAR(36) FK→animals.id NOT NULL
  - `adopter_id` VARCHAR(36) FK→users.id NOT NULL
  - `assigned_volunteer_id` VARCHAR(36) FK→users.id NOT NULL
  - `ong_id` VARCHAR(36) FK→ongs.id NOT NULL
  - `reminder_number` TINYINT NOT NULL (1, 2 ou 3)
  - `due_date` DATE NOT NULL
  - `status` ENUM('pending','completed','cancelled','overdue') NOT NULL DEFAULT 'pending'
  - `cancellation_reason` VARCHAR(255) NULL
  - `created_at` TIMESTAMP NOT NULL DEFAULT NOW()
  - `updated_at` TIMESTAMP NOT NULL DEFAULT NOW()
- Constraint UNIQUE: `(adoption_request_id, reminder_number)` — impede duplicatas
- Índices: `(ong_id, status, due_date)`, `(adoption_request_id)`, `(animal_id, status)`, `(assigned_volunteer_id, status)`
- FK onDelete: CASCADE para adoption_request_id e ong_id; RESTRICT para animal_id, adopter_id, assigned_volunteer_id

### `20260604_022_create_follow_up_contacts_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260603_018_create_visits_table.ts`
**Differences from reference**:
- Tabela: `follow_up_contacts`
- Colunas:
  - `id` VARCHAR(36) PK
  - `reminder_id` VARCHAR(36) FK→follow_up_reminders.id UNIQUE NOT NULL
  - `registered_by` VARCHAR(36) FK→users.id NOT NULL
  - `ong_id` VARCHAR(36) FK→ongs.id NOT NULL
  - `contact_date` DATE NOT NULL
  - `status` ENUM('positive','neutral','negative','no_response') NOT NULL
  - `observation` TEXT NOT NULL
  - `created_at` TIMESTAMP NOT NULL DEFAULT NOW()
  - `updated_at` TIMESTAMP NOT NULL DEFAULT NOW()
- Constraint UNIQUE em `reminder_id` — garante 1:1 com lembrete

### `follow-up.types.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.types.ts`
**Differences from reference**:
- `ReminderStatus` = `'pending' | 'completed' | 'cancelled' | 'overdue'`
- `ContactStatus` = `'positive' | 'neutral' | 'negative' | 'no_response'`
- `REMINDER_MILESTONES` = `[30, 60, 90]` (constante exportada)
- Interface `FollowUpReminder`: todos campos da tabela + joins (`animal_name`, `adopter_name`, `adopter_phone`, `adopter_email`, `volunteer_name`)
- Interface `ReminderListFilters`: `status?`, `due_date_from?`, `due_date_to?`, `animal_name?`, `adopter_name?`, `assigned_volunteer_id?`, `page`, `limit`
- Interface `ReminderDetail`: lembrete completo + contato vinculado (se existir)
- Interface `GenerateRemindersInput`: `adoption_request_id`, `animal_id`, `adopter_id`, `assigned_volunteer_id`, `ong_id`, `adoption_date: Date`

### `follow-up.errors.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.errors.ts`
**Errors**:
- `RemindersAlreadyExistError` — tentativa de gerar duplicado (409)
- `ReminderNotFoundError` — lembrete não encontrado/outra ONG (404)
- `ReminderNotPendingError` — ação em lembrete não pendente/overdue (422)
- `ContactAlreadyRegisteredError` — lembrete já tem contato (409)
- `InvalidContactDateError` — data futura ou anterior à adoção (422)
- `ContactNotFoundError` — contato não encontrado (404)
- `InsufficientPermissionError` — operação restrita a admin (403)

### `follow-up.repository.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.repository.ts`
**Differences from reference**:
- `createReminders(reminders[], trx: Knex.Transaction)` — batch insert dos 3 lembretes na transação
- `hasRemindersForAdoption(adoptionRequestId)` — check idempotência (retorna boolean)
- `listReminders(ongId, filters)` — JOIN com animals, users (adopter), users (volunteer); paginação; filtros por status, due_date range, LIKE em animal_name e adopter_name
- `findReminderById(id, ongId)` — detalhe com joins
- `findRemindersByAdoption(adoptionRequestId, ongId)` — para timeline (TASK-005)
- Todas queries incluem `.where('follow_up_reminders.ong_id', ongId)`

### `follow-up.service.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.service.ts`
**Differences from reference**:
- `generateReminders(input: GenerateRemindersInput, trx: Knex.Transaction)`:
  1. Verifica idempotência via `hasRemindersForAdoption()`
  2. Se já existem, retorna silenciosamente (sem erro — idempotente)
  3. Calcula 3 due_dates: `adoption_date + 30d`, `+60d`, `+90d` (usar `new Date()` com aritmética de dias)
  4. Gera 3 objetos com `crypto.randomUUID()`, `reminder_number` 1/2/3
  5. Insere via `createReminders(reminders, trx)`
  6. Registra audit log: `follow_up.reminders_generated`
- `listReminders(ongId, filters)` — delegação ao repository com paginação
- `findById(id, ongId)` — busca com validação de existência
- Exportar singleton: `export const followUpService = new FollowUpService()`

### Modificação em `adoption-requests.service.ts` *(modify)*

**Changes**:
- Importar `followUpService` de `~/domains/follow-up/follow-up.service`
- No método que transiciona para `completed` (localizar pelo `updateStatus(id, 'completed', ...)`):
  - Após atualizar status, obter dados da adoção (animal_id, adopter_id, ong_id)
  - Chamar `followUpService.generateReminders({ adoption_request_id: id, animal_id, adopter_id, assigned_volunteer_id: userId, ong_id, adoption_date: new Date() }, trx)` dentro da mesma transação
  - Se não houver transação, envolver em `db.transaction()`

### `follow-up.routes.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.routes.ts`
**Differences from reference**:
- `GET /reminders` → authenticate + authorize(['ong_admin', 'ong_volunteer']) + validate(listFiltersSchema, 'query')
- `GET /reminders/:id` → authenticate + authorize(['ong_admin', 'ong_volunteer']) + validate(idParamSchema, 'params')

### `follow-up.service.ts` (frontend) *(create)*

**Reference pattern**: `src/services/adoption-requests.service.ts`
**Differences from reference**:
- `baseURL`: `${env.VITE_API_URL}/follow-up`
- Métodos: `listReminders(filters?)`, `getReminderDetail(id)`

### `useFollowUpList.ts` *(create)*

**Reference pattern**: `src/hooks/useVolunteerRequests.ts` (se existir) ou `src/hooks/useAdopterRequests.ts`
**Differences from reference**:
- Filtros: `status`, `due_date_from`, `due_date_to`, `animal_name`, `adopter_name`, `assigned_volunteer_id`, `page`, `limit`
- `updateFilters(partial)` mescla com estado atual e reseta page para 1
- Fetch on mount e ao mudar filtros

### `FollowUpListPage.tsx` *(create)*

**Reference pattern**: `src/pages/ong/AdoptionRequestListPage.tsx`
**Differences from reference**:
- Título: "Acompanhamento Pós-Adoção"
- Filtros: `<Select>` para status (Pendente/Atrasado/Concluído/Cancelado/Todos), `<DatePicker.RangePicker>` para período, `<Input.Search>` para nome do animal, `<Input.Search>` para nome do tutor
- Se role = ong_admin, exibir `<Select>` adicional para filtrar por voluntário
- Tabela com colunas: Animal, Tutor, Telefone, E-mail, Data-alvo, Status, Dias de atraso, Ações
- Status rendering:
  - `pending` → `<Tag color="blue">Pendente</Tag>`
  - `overdue` → `<Tag color="red">Atrasado</Tag>` + texto com dias de atraso
  - `completed` → `<Tag color="green">Concluído</Tag>`
  - `cancelled` → `<Tag color="default">Cancelado</Tag>`
- Coluna "Dias de atraso": calculado no frontend como `Math.max(0, dayjs().diff(due_date, 'day'))` se status pendente/overdue
- Ação: botão "Registrar Contato" (desabilitado/oculto se não pending/overdue) — implementação real na TASK-004, aqui apenas placeholder

### Rota frontend *(modify `routes/index.tsx`)*

- Adicionar `<Route path="/ong/follow-up" element={<FollowUpListPage />} />` dentro do RoleRoute de `['ong_admin', 'ong_volunteer']`

---

## Acceptance Criteria

- [ ] **Given** pedido de adoção com status `in_review`, **When** transiciona para `completed`, **Then** 3 lembretes criados com due_dates +30d, +60d, +90d e status `pending`.
- [ ] **Given** adoção já com lembretes gerados, **When** reprocessada (idempotência), **Then** nenhum lembrete duplicado, sem erro.
- [ ] **Given** constraint UNIQUE `(adoption_request_id, reminder_number)`, **When** INSERT duplicado, **Then** DB rejeita com constraint violation.
- [ ] **Given** lembretes existentes para ONG-A, **When** ong_volunteer de ONG-A acessa GET `/api/v1/follow-up/reminders`, **Then** retorna apenas lembretes da ONG-A com paginação.
- [ ] **Given** filtro `status=overdue`, **When** listagem, **Then** retorna apenas lembretes com status overdue.
- [ ] **Given** filtro `animal_name=Rex`, **When** listagem, **Then** retorna lembretes do animal cujo nome contém "Rex" (LIKE).
- [ ] **Given** frontend no path `/ong/follow-up`, **When** renderizado, **Then** exibe tabela de lembretes com filtros e indicação visual por status.
- [ ] **Given** lembrete com status `overdue`, **When** exibido na tabela, **Then** Tag vermelha "Atrasado" + dias de atraso calculados.
- [ ] **Given** usuário `adopter`, **When** acessa endpoints de follow-up, **Then** retorna 403.
- [ ] **Given** geração de lembretes falha (ex: DB down), **When** transação de completar adoção, **Then** adoção NÃO é completada (rollback transacional).

---

## API Notes

- **GET** `/api/v1/follow-up/reminders` — Query: `status`, `due_date_from`, `due_date_to`, `animal_name`, `adopter_name`, `assigned_volunteer_id`, `page`, `limit`. Response: `{ data: FollowUpReminder[], pagination: { page, limit, total } }`
- **GET** `/api/v1/follow-up/reminders/:id` — Response: `{ data: ReminderDetail }`
- Erros: `401`, `403`, `404`

---

## Dependencies

- **Requires**: TASK-FULL-001 (tabela `notifications` precisa existir para FK futura; `notificationsService` importado em TASK-003).
- **Blocks**: TASK-FULL-003 (rotina diária, cancelamento, redistribuição), TASK-FULL-004 (registro de contato), TASK-FULL-005 (timeline).
