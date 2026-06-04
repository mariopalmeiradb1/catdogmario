# TASK-FULL-004 — Registro e Edição de Contato (Backend + Frontend)

**Root**: `catdogmario/services/backend/` e `catdogmario/services/frontend/`
**Branch**: `feature/TASK-FULL-004-register-edit-contact`
**Spec**: `.makuco/specs/module_009_acompanhamento_pós_adoção/feature_002_registro_contato/spec_context.md`
**Part**: 4 of 5 — Registro de contato
**Generated**: `2026-06-03`

---

## Context

Implementa a FEATURE-002 (core): voluntários registram o resultado do contato pós-adoção vinculado a um lembrete, completando-o automaticamente. Administradores podem editar observações. Status "Sem resposta" gera notificação ao admin. A tabela `follow_up_contacts` já foi criada na TASK-002.

---

## Scope

**In:**
- Métodos `registerContact()` e `editContact()` no follow-up.service
- Validators Zod para criação e edição
- Endpoints POST `/reminders/:id/contact` e PUT `/contacts/:id`
- Notificação automática ao admin quando status = `no_response`
- Modal `RegisterContactModal.tsx` no frontend
- Modal `EditContactModal.tsx` no frontend (somente admin)
- Integração dos modais na `FollowUpListPage.tsx`
- Testes unitários e de integração

**Out:**
- Não criar timeline/histórico (TASK-005)
- Não modificar migrations (já criadas na TASK-002)
- Não modificar o domínio de notificações (TASK-001)
- Não implementar alerta visual de padrão "2+ sem resposta consecutivos" na listagem (TASK-005)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `services/backend/src/domains/follow-up/follow-up.service.ts` | registerContact + editContact |
| `modify` | `services/backend/src/domains/follow-up/follow-up.repository.ts` | queries de contato |
| `modify` | `services/backend/src/domains/follow-up/follow-up.routes.ts` | endpoints de contato |
| `modify` | `services/backend/src/domains/follow-up/follow-up.controller.ts` | handlers de contato |
| `modify` | `services/backend/src/domains/follow-up/follow-up.validator.ts` | schemas create/edit |
| `modify` | `services/backend/src/domains/follow-up/follow-up.types.ts` | interfaces de contato |
| `create` | `services/frontend/src/components/RegisterContactModal.tsx` | modal registro |
| `create` | `services/frontend/src/components/EditContactModal.tsx` | modal edição admin |
| `modify` | `services/frontend/src/pages/ong/FollowUpListPage.tsx` | integrar modais |
| `modify` | `services/frontend/src/services/follow-up.service.ts` | métodos de contato |
| `modify` | `services/frontend/src/hooks/useFollowUpList.ts` | ações de contato |
| `create` | `services/backend/tests/unit/follow-up.contact.spec.ts` | testes unitários |
| `create` | `services/backend/tests/integration/follow-up.contact.spec.ts` | testes integração |

---

## Implementation

### `follow-up.types.ts` *(modify — adicionar interfaces)*

**Adicionar**:
- Interface `RegisterContactInput`: `contact_date: string` (ISO date), `status: ContactStatus`, `observation: string`
- Interface `EditContactInput`: `observation: string`
- Interface `FollowUpContactDetail`: todos campos de `follow_up_contacts` + `registered_by_name`

### `follow-up.validator.ts` *(modify — adicionar schemas)*

**Adicionar**:
- `registerContactSchema` (body):
  - `contact_date`: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) — ISO date
  - `status`: z.enum(['positive', 'neutral', 'negative', 'no_response'])
  - `observation`: z.string().min(10, 'A observação deve ter no mínimo 10 caracteres.').max(1000, 'A observação deve ter no máximo 1000 caracteres.')
- `editContactSchema` (body):
  - `observation`: z.string().min(10).max(1000)
- `contactIdParamSchema` (params):
  - `id`: z.string().uuid()

### `follow-up.repository.ts` *(modify — adicionar métodos)*

**Novos métodos**:
- `findReminderForContact(reminderId: string, ongId: string)` — retorna lembrete com `adoption_date` (JOIN adoption_requests) para validação de data
- `hasContactForReminder(reminderId: string)` — boolean, check duplicidade
- `createContact(input: { id, reminder_id, registered_by, ong_id, contact_date, status, observation })` — INSERT
- `updateReminderStatus(reminderId: string, status: ReminderStatus, trx?)` — UPDATE single
- `findContactById(contactId: string, ongId: string)` — para edição
- `updateContactObservation(contactId: string, observation: string, updatedAt: Date)` — UPDATE observation

### `follow-up.service.ts` *(modify — adicionar métodos)*

**Método `registerContact(reminderId: string, input: RegisterContactInput, userId: string, ongId: string)`**:
1. `findReminderForContact(reminderId, ongId)` → se não encontrado, throw `ReminderNotFoundError`
2. Validar status do lembrete: se não `pending` nem `overdue`, throw `ReminderNotPendingError`
   - Se `completed`: mensagem específica "Este acompanhamento já foi registrado."
   - Se `cancelled`: mensagem específica "Não é possível registrar contato para um acompanhamento cancelado."
3. `hasContactForReminder(reminderId)` → se true, throw `ContactAlreadyRegisteredError`
4. Validar `contact_date`:
   - Se futura (> hoje): throw `InvalidContactDateError` com mensagem "A data do contato não pode ser posterior a hoje."
   - Se anterior à data de adoção: throw `InvalidContactDateError` com mensagem "A data do contato não pode ser anterior à data de adoção ({data})."
5. Transação:
   - `createContact({ id: crypto.randomUUID(), reminder_id: reminderId, registered_by: userId, ong_id: ongId, ...input })`
   - `updateReminderStatus(reminderId, 'completed', trx)`
6. Se `input.status === 'no_response'`:
   - Buscar admins da ONG
   - `notificationsService.create()` para cada admin:
     - title: `'Acompanhamento sem resposta — {animal_name} / Tutor: {adopter_name}'`
     - type: `'contact_no_response'`
     - reference_entity: `'follow_up_contact'`, reference_id: contactId
7. Registrar audit log: `follow_up.contact_registered`

**Método `editContact(contactId: string, input: EditContactInput, userId: string, ongId: string, role: string)`**:
1. Se `role !== 'ong_admin'`, throw `InsufficientPermissionError`
2. `findContactById(contactId, ongId)` → se não encontrado, throw `ContactNotFoundError`
3. `updateContactObservation(contactId, input.observation, new Date())`
4. Registrar audit log: `follow_up.contact_edited` com metadata `{ contact_id, previous_observation (truncada a 100 chars) }`

### `follow-up.routes.ts` *(modify — adicionar rotas)*

**Adicionar**:
- `POST /reminders/:id/contact` → authenticate + authorize(['ong_admin', 'ong_volunteer']) + validate(idParamSchema, 'params') + validate(registerContactSchema) → controller.registerContact
- `PUT /contacts/:id` → authenticate + authorize(['ong_admin']) + validate(contactIdParamSchema, 'params') + validate(editContactSchema) → controller.editContact

### `follow-up.controller.ts` *(modify — adicionar handlers)*

**Adicionar**:
- `registerContact(req, res, next)`: extrai `req.params.id` (reminderId), `req.body`, `req.user!.userId`, `req.user!.ongId` → chama service → response 201 `{ data: contact }`
- `editContact(req, res, next)`: extrai `req.params.id` (contactId), `req.body`, `req.user!.userId`, `req.user!.ongId`, `req.user!.role` → chama service → response 200 `{ data: contact }`

### `follow-up.service.ts` (frontend) *(modify)*

**Adicionar métodos**:
- `registerContact(reminderId: string, input: RegisterContactInput)` → POST `/reminders/${reminderId}/contact`
- `editContact(contactId: string, input: { observation: string })` → PUT `/contacts/${contactId}`

### `RegisterContactModal.tsx` *(create)*

**Especificação** (sem referência direta equivalente):
- Ant Design: `<Modal>` com `<Form>` dentro
- Props: `open: boolean`, `reminder: { id, animal_name, adopter_name, adoption_date } | null`, `onSuccess: () => void`, `onCancel: () => void`
- Campos:
  - Data do contato: `<DatePicker>` — default: hoje, `disabledDate`: futuras e anteriores à `adoption_date`
  - Status: `<Select>` — opções: Positivo, Neutro, Negativo, Sem resposta
  - Observação: `<Input.TextArea>` — maxLength=1000, showCount=true, placeholder="Descreva o resultado do contato..."
- Validação frontend:
  - Data: obrigatória, não futura, não anterior a adoption_date
  - Status: obrigatório
  - Observação: obrigatória, mínimo 10 caracteres
- onSubmit: chama `followUpService.registerContact()` → `message.success('Contato registrado com sucesso')` → `onSuccess()` → fecha modal
- onError: `message.error()` com mensagem do backend

### `EditContactModal.tsx` *(create)*

**Especificação**:
- Ant Design: `<Modal>` com `<Form>` dentro
- Props: `open: boolean`, `contact: { id, observation } | null`, `onSuccess: () => void`, `onCancel: () => void`
- Campo único: `<Input.TextArea>` pré-preenchido com observação atual
- Validação: mínimo 10, máximo 1000 caracteres
- onSubmit: chama `followUpService.editContact()` → `message.success('Registro atualizado com sucesso')` → `onSuccess()`
- Renderizado somente se `user.role === 'ong_admin'`

### `FollowUpListPage.tsx` *(modify)*

**Adicionar**:
- Estado: `selectedReminder` para RegisterContactModal, `selectedContact` para EditContactModal
- Coluna "Ações" na tabela:
  - Botão "Registrar Contato" (`<Button type="link">`) — exibido apenas se `status === 'pending' || status === 'overdue'`
  - Botão "Editar" — exibido apenas se lembrete `completed` e user.role === 'ong_admin'
- Renderizar `<RegisterContactModal>` e `<EditContactModal>` no JSX
- `onSuccess` de ambos modais: refetch da lista

---

## Acceptance Criteria

- [ ] **Given** lembrete `pending`, **When** voluntário submete contato com dados válidos (data=hoje, status=positivo, obs=30 chars), **Then** contato salvo, lembrete → `completed`, response 201.
- [ ] **Given** lembrete `overdue`, **When** voluntário registra contato, **Then** contato salvo, lembrete → `completed`.
- [ ] **Given** lembrete `completed`, **When** voluntário tenta registrar contato, **Then** erro 422 "Este acompanhamento já foi registrado."
- [ ] **Given** lembrete `cancelled`, **When** voluntário tenta registrar contato, **Then** erro 422 "Não é possível registrar contato para um acompanhamento cancelado."
- [ ] **Given** data do contato = amanhã, **When** submit, **Then** erro 422 "A data do contato não pode ser posterior a hoje."
- [ ] **Given** data do contato anterior à data de adoção, **When** submit, **Then** erro 422 com data formatada.
- [ ] **Given** observação com 5 caracteres, **When** submit, **Then** erro validação "A observação deve ter no mínimo 10 caracteres."
- [ ] **Given** status = `no_response`, **When** contato salvo com sucesso, **Then** notificação `contact_no_response` enviada ao admin da ONG.
- [ ] **Given** contato existente, **When** admin edita observação, **Then** observation atualizada + audit log gravado.
- [ ] **Given** contato existente, **When** ong_volunteer tenta editar, **Then** erro 403.
- [ ] **Given** voluntário de ONG-A, **When** tenta registrar contato em lembrete de ONG-B, **Then** erro 404.
- [ ] **Given** frontend com lembrete `pending`, **When** clica "Registrar Contato", **Then** modal abre com campos corretos.
- [ ] **Given** modal preenchido corretamente, **When** submete, **Then** toast sucesso + modal fecha + tabela atualiza.
- [ ] **Given** operação atômica, **When** createContact sucede mas updateReminderStatus falha, **Then** ambos sofrem rollback.

---

## API Notes

- **POST** `/api/v1/follow-up/reminders/:id/contact` — Body: `{ contact_date, status, observation }`. Success: `201 { data: FollowUpContactDetail }`. Errors: `404` (lembrete não encontrado/outra ONG), `409` (contato já existe), `422` (data inválida, obs curta, lembrete não pendente/overdue).
- **PUT** `/api/v1/follow-up/contacts/:id` — Body: `{ observation }`. Success: `200 { data: FollowUpContactDetail }`. Errors: `403` (não admin), `404` (contato não encontrado).

---

## Authorization

- `ong_admin | ong_volunteer` → pode registrar contato em qualquer lembrete da ONG (RN-07).
- `ong_admin` → único role que pode editar contato existente.
- Backend valida ong_id em todas operações (server-side tenant check).

---

## Dependencies

- **Requires**: TASK-FULL-001 (notificationsService.create para alertar admin), TASK-FULL-002 (domínio follow-up, tabelas, FollowUpListPage base).
- **Blocks**: TASK-FULL-005 (timeline precisa de contatos registrados para exibir histórico).
