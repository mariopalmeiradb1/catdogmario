# TASK-BACKEND-009 — Agendamento de Visita (Backend)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-009-schedule-visit`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_004_agendamento_visita/spec_context.md`
**Part**: 1 of 2 — Backend
**Generated**: `2026-06-03`

---

## Context

Implementar o endpoint para agendamento de visitas dentro do domínio `adoption-requests`. Voluntários/admins de ONG informam data/hora e o sistema cria um registro de visita, transiciona status do animal e do pedido, cancela pedidos concorrentes e notifica o adotante — tudo em transação única. O padrão `autoCloseByAnimal` já demonstra cancelamento transacional.

---

## Scope

**In:**
- Migration para criar tabela `visits`
- Tipos, erros, validator e repository para visitas
- Método `scheduleVisit` no service com orquestração transacional
- Controller handler e rota `POST /:id/schedule-visit`
- Template de e-mail de notificação ao adotante
- Audit log da operação

**Out:**
- Frontend (TASK-FRONTEND-009)
- Cancelamento de visita, reagendamento
- Registro de resultado da visita (FEATURE-005)
- Testes (task separada)
- Notificação dos adotantes com pedidos cancelados automaticamente

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Visita | Registro na tabela `visits`, status `scheduled` |
| Agendamento | Ação `POST /:id/schedule-visit` que cria visita + transiciona status |
| Pedidos concorrentes | Outros registros em `adoption_requests` com mesmo `animal_id` e status `pending`/`in_review` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260603_018_create_visits_table.ts` | tabela visits |
| `modify` | `src/domains/adoption-requests/adoption-requests.types.ts` | tipos de visita |
| `modify` | `src/domains/adoption-requests/adoption-requests.errors.ts` | erros de agendamento |
| `modify` | `src/domains/adoption-requests/adoption-requests.validator.ts` | schema scheduleVisit |
| `modify` | `src/domains/adoption-requests/adoption-requests.repository.ts` | métodos de visita |
| `modify` | `src/domains/adoption-requests/adoption-requests.service.ts` | orquestração transacional |
| `modify` | `src/domains/adoption-requests/adoption-requests.controller.ts` | handler scheduleVisit |
| `modify` | `src/domains/adoption-requests/adoption-requests.routes.ts` | rota POST schedule-visit |
| `modify` | `src/shared/services/mail/mail.templates.ts` | template notificação |

---

## Implementation

### `20260603_018_create_visits_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260603_017_add_completed_at_to_adoption_requests.ts`
**Differences from reference**:
- `createTable('visits')` em vez de `alterTable`
- Schema:
  - `id` string(36) PK
  - `adoption_request_id` string(36) NOT NULL, FK → adoption_requests(id) ON DELETE CASCADE
  - `animal_id` string(36) NOT NULL, FK → animals(id) ON DELETE CASCADE
  - `ong_id` string(36) NOT NULL, FK → ongs(id) ON DELETE CASCADE
  - `scheduled_by` string(36) NOT NULL, FK → users(id)
  - `visit_date` datetime NOT NULL
  - `notes` string(500) nullable
  - `status` enum('scheduled', 'completed', 'cancelled') NOT NULL default 'scheduled'
  - `created_at` timestamp default now()
  - `updated_at` timestamp default now()
- Índice único: `unique(['animal_id', 'status'])` WHERE status = 'scheduled' — como MySQL não suporta partial unique index, usar índice composto `idx_visits_animal_status` e validar unicidade no service
- Índice: `idx_visits_adoption_request_id`

---

### `adoption-requests.types.ts` *(modify)*

**Reference pattern**: tipos existentes no mesmo arquivo (`AdoptionRequestCreatedResponse`)
**Additions**:
- `export type VisitStatus = 'scheduled' | 'completed' | 'cancelled';`
- Interface `ScheduleVisitInput`:
  ```typescript
  export interface ScheduleVisitInput {
    visit_date: string; // ISO 8601
    notes?: string;
  }
  ```
- Interface `ScheduleVisitResponse`:
  ```typescript
  export interface ScheduleVisitResponse {
    id: string;
    adoption_request_id: string;
    animal_name: string;
    visit_date: string;
    status: VisitStatus;
    created_at: string;
  }
  ```
- `export const VISIT_ELIGIBLE_STATUSES: AdoptionRequestStatus[] = ['pending', 'in_review'];`

---

### `adoption-requests.errors.ts` *(modify)*

**Reference pattern**: erros existentes no mesmo arquivo (`AppError` base)
**Additions**:
- `AnimalAlreadyInProcessError`: status 409, code `ANIMAL_ALREADY_IN_PROCESS`, message "Este animal já está em processo de adoção. Não é possível agendar outra visita."
- `AnimalAlreadyAdoptedError`: status 409, code `ANIMAL_ALREADY_ADOPTED`, message "Este animal já foi adotado."
- `RequestNotEligibleForVisitError`: status 422, code `REQUEST_NOT_ELIGIBLE`, message "Este pedido de adoção não está elegível para agendamento de visita."
- `InvalidVisitDateError`: status 422, code `INVALID_VISIT_DATE`, message recebida via constructor (para variações: data passada, < 24h, > 30 dias, fora do horário)

---

### `adoption-requests.validator.ts` *(modify)*

**Reference pattern**: `rejectAdoptionRequestSchema` no mesmo arquivo
**Addition**:
```typescript
export const scheduleVisitSchema = z.object({
  visit_date: z.string().datetime({ message: 'Data da visita inválida. Use formato ISO 8601.' }),
  notes: z.string().trim().max(500, 'As observações devem ter no máximo 500 caracteres.').optional(),
});
```
- Validação de regras de negócio (24h, 30d, horário) fica no service, não no schema Zod.

---

### `adoption-requests.repository.ts` *(modify)*

**Reference pattern**: método `cancelAllActiveByAnimalId` no mesmo arquivo
**Additions**:
- `createVisit(data: { id, adoption_request_id, animal_id, ong_id, scheduled_by, visit_date, notes, status }, trx: Knex.Transaction): Promise<void>` — INSERT na tabela visits
- `hasActiveVisitForAnimal(animalId: string, trx: Knex.Transaction): Promise<boolean>` — SELECT count WHERE animal_id = X AND status = 'scheduled'
- `findRequestWithAnimalAndAdopter(requestId: string, ongId: string, trx: Knex.Transaction): Promise<{...} | null>` — JOIN adoption_requests + animals + users(adopter) + ongs, retornando:
  - request: id, status, animal_id, adopter_id
  - animal: name, status (as animal_status)
  - adopter: name (as adopter_name), email (as adopter_email)
  - ong: name (as ong_name), address (as ong_address), city, state
  - Usa `forUpdate()` no animal row para lock pessimista

**Modification to existing method**:
- `cancelAllActiveByAnimalId(animalId: string, trx: Knex.Transaction, excludeRequestId?: string)` — adicionar parâmetro opcional. Quando presente, incluir `.where('id', '!=', excludeRequestId)` no filtro. A `cancellation_reason` passa a ser "Visita agendada para outro adotante."

---

### `adoption-requests.service.ts` *(modify)*

**Reference pattern**: método `autoCloseByAnimal` (transação + audit loop)
**Addition** — método `scheduleVisit(requestId: string, input: ScheduleVisitInput, userId: string, ongId: string): Promise<ScheduleVisitResponse>`:

Fluxo (dentro de `db.transaction`):
1. `findRequestWithAnimalAndAdopter(requestId, ongId, trx)` → se null, throw `AdoptionRequestNotFoundError`
2. Validar `request.status` in `VISIT_ELIGIBLE_STATUSES` → senão throw `RequestNotEligibleForVisitError`
3. Validar `animal_status`:
   - `'in_adoption_process'` → throw `AnimalAlreadyInProcessError`
   - `'adopted'` → throw `AnimalAlreadyAdoptedError`
   - Deve ser `'available'`
4. Validar `visit_date` (chamar método privado `validateVisitDate`):
   - Parsear como Date
   - Deve ser futura
   - Min 24h de antecedência
   - Max 30 dias no futuro
   - Dia da semana: 1-6 (seg-sáb, rejeitar 0 = domingo)
   - Hora: >= 8 e < 18
   - Cada falha throw `InvalidVisitDateError` com mensagem específica
5. `hasActiveVisitForAnimal(animalId, trx)` → se true, throw `AnimalAlreadyInProcessError`
6. Criar visita: `createVisit({ id: crypto.randomUUID(), ... }, trx)`
7. Atualizar status do animal: importar `animalManagementRepository.updateStatus(animalId, 'in_adoption_process', null, trx)` (o status do pedido permanece inalterado — a aprovação ocorre somente após a conclusão da visita)
8. Cancelar concorrentes: `cancelAllActiveByAnimalId(animalId, trx, requestId)` — passando `excludeRequestId`

Após a transação (fora do bloco `trx`):
9. Enviar e-mail: `mailService.send({ to: adopter_email, subject, html: buildVisitScheduledEmail(...) })`
10. `recordAuditLog({ user_id: userId, ong_id: ongId, action: 'visit.schedule', entity: 'visit', entity_id: visitId, metadata: { adoption_request_id, animal_id, cancelled_count } })`
11. Retornar `ScheduleVisitResponse`

**Import additions**: `db` from `~/config/database`, `animalManagementRepository` from `~/domains/animal-management/animal-management.repository`, `mailService` + `buildVisitScheduledEmail`

---

### `adoption-requests.controller.ts` *(modify)*

**Reference pattern**: método `approve` no mesmo arquivo (mesma estrutura ongId guard + service call)
**Addition** — método `scheduleVisit`:
- Extrair `userId`, `ongId` de `req.user!`
- Guard: se `!ongId` → 403 "Você não está vinculado a nenhuma ONG."
- Chamar `adoptionRequestsService.scheduleVisit(req.params.id, req.body, userId, ongId)`
- Responder `201` com `{ data: result }`

---

### `adoption-requests.routes.ts` *(modify)*

**Reference pattern**: rota `PATCH /:id/approve`
**Addition**:
```typescript
router.post(
  '/:id/schedule-visit',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(adoptionRequestIdParamSchema, 'params'),
  validate(scheduleVisitSchema),
  (req, res, next) => adoptionRequestsController.scheduleVisit(req, res, next),
);
```
- Posicionar antes da rota `GET /:id` para evitar conflito de matching

---

### `mail.templates.ts` *(modify)*

**Reference pattern**: `buildConfirmationEmail` no mesmo arquivo (HTML com interpolação)
**Addition** — função `buildVisitScheduledEmail(params: { adopterName, animalName, visitDate, ongName, ongAddress, ongCity, ongState }): string`
- Estrutura HTML idêntica ao template existente (header roxo, corpo branco, footer)
- Conteúdo:
  - Título: "Visita Agendada! 🎉"
  - Saudação: "Olá, {adopterName}!"
  - Corpo: "Sua visita para conhecer o(a) **{animalName}** foi agendada."
  - Detalhes em lista: Data/hora (formatada pt-BR), Endereço ({ongAddress}, {ongCity}/{ongState}), ONG ({ongName})
  - Nota: "Por favor, compareça no horário agendado."

---

## Acceptance Criteria

- [ ] **Given** pedido `pending` + animal `available`, **When** voluntário submete `POST /:id/schedule-visit` com data +48h seg 10:00, **Then** retorna 201 com visita `scheduled`, pedido transiciona para `approved`, animal transiciona para `in_adoption_process`
- [ ] **Given** agendamento criado com sucesso, **When** transaction commita, **Then** pedidos concorrentes para o mesmo animal ficam `cancelled` com `cancelled_by='system'` e `cancellation_reason='Visita agendada para outro adotante.'`
- [ ] **Given** agendamento criado com sucesso, **When** response enviada, **Then** adotante recebe e-mail com dados da visita
- [ ] **Given** animal com status `in_adoption_process`, **When** voluntário tenta agendar, **Then** retorna 409 com mensagem de exclusividade
- [ ] **Given** animal com status `adopted`, **When** voluntário tenta agendar, **Then** retorna 409 com mensagem "já foi adotado"
- [ ] **Given** `visit_date` com < 24h de antecedência, **When** voluntário submete, **Then** retorna 422 com mensagem "mínimo 24 horas"
- [ ] **Given** `visit_date` > 30 dias no futuro, **When** voluntário submete, **Then** retorna 422 com mensagem "máximo 30 dias"
- [ ] **Given** `visit_date` em domingo ou fora 08:00-18:00, **When** voluntário submete, **Then** retorna 422 com mensagem de horário
- [ ] **Given** pedido com status `cancelled`/`rejected`/`completed`, **When** voluntário tenta agendar, **Then** retorna 422 "não está elegível"
- [ ] **Given** pedido pertence a outra ONG, **When** voluntário tenta agendar, **Then** retorna 404 "não encontrado"
- [ ] **Given** role `adopter`, **When** tenta acessar rota, **Then** retorna 403
- [ ] Audit log registrado com action `visit.schedule`, entity `visit`, metadata inclui `cancelled_count`

---

## Authorization

- `ong_volunteer | ong_admin` → rota acessível, agendamento funcional
- `adopter | system_admin` → 403 via middleware `authorize`
- ONG ownership: pedido deve pertencer à mesma ONG do voluntário (validado no repository JOIN)

---

## API Notes

- **Endpoint**: `POST /adoption-requests/:id/schedule-visit`
- **Input**: `{ visit_date: string (ISO 8601), notes?: string }`
- **Success**: `201` — `{ data: { id, adoption_request_id, animal_name, visit_date, status, created_at } }`
- **Errors**: `404` — pedido não encontrado/outra ONG; `409` — animal indisponível; `422` — validação de data/horário/status do pedido; `403` — sem permissão

---

## Dependencies

- **Requires**: TASK-BACKEND-007 (campo `completed_at` na tabela — migration 017 já aplicada), módulo animal-management (repository.updateStatus com suporte a trx)
- **Blocks**: TASK-FRONTEND-009 (frontend de agendamento), TASK-BACKEND-010 (registro de visita realizada — FEATURE-005)
