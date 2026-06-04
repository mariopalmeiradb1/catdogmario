# TASK-BACKEND-010 — Registro de Visita Realizada

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-010-register-visit-completed`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_005_registro_visita/spec_context.md`
**Part**: 1 of 1 — Backend
**Generated**: `2026-06-03`

---

## Context

Implementar o endpoint para registrar que uma visita agendada foi realizada, com observações e avaliação qualitativa, além do endpoint de visualização de detalhes da visita com visibilidade baseada em role. A tabela `visits` já existe (criada em TASK-BACKEND-009) com status `scheduled`; esta task adiciona colunas de completude e os métodos de negócio. Controle de concorrência via `SELECT ... FOR UPDATE` dentro de transação.

---

## Scope

**In:**
- Migration para adicionar colunas `completed_at`, `completed_by`, `evaluation`, `observations` à tabela `visits`
- Tipos, erros e validator para registro de visita
- Métodos no repository: `findVisitForCompletion`, `completeVisit`, `findVisitDetail`
- Método `completeVisit` no service com validação e transação
- Método `getVisitDetail` no service com filtro por role
- Controller handlers e rotas `PATCH /visits/:visitId/complete` e `GET /visits/:visitId`
- Audit log com action `visit_completed`

**Out:**
- Frontend (task separada)
- Cancelamento de visita ou reagendamento
- Alteração de status do pedido de adoção
- Upload de fotos/vídeos da visita
- Notificação ao adotante sobre o registro
- Edição/exclusão de registro já completado
- Testes (task separada)

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Visita realizada | Registro em `visits` com status `completed` |
| Avaliação qualitativa | Campo `evaluation`: `'positive' \| 'neutral' \| 'negative'` |
| Observações internas | Campo `observations` — visível apenas para volunteer/admin |
---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260603_019_add_completion_columns_to_visits.ts` | colunas de completude |
| `modify` | `src/domains/adoption-requests/adoption-requests.types.ts` | tipos visit completion |
| `modify` | `src/domains/adoption-requests/adoption-requests.errors.ts` | erros de registro visita |
| `modify` | `src/domains/adoption-requests/adoption-requests.validator.ts` | schema completeVisit + visitIdParam |
| `modify` | `src/domains/adoption-requests/adoption-requests.repository.ts` | métodos find/complete visit |
| `modify` | `src/domains/adoption-requests/adoption-requests.service.ts` | completeVisit + getVisitDetail |
| `modify` | `src/domains/adoption-requests/adoption-requests.controller.ts` | handlers completeVisit + getVisitDetail |
| `modify` | `src/domains/adoption-requests/adoption-requests.routes.ts` | rotas PATCH/GET visits |

---

## Implementation

### `20260603_019_add_completion_columns_to_visits.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260603_017_add_completed_at_to_adoption_requests.ts`
**Differences from reference**:
- `alterTable('visits')` adicionando:
  - `completed_at` datetime nullable
  - `completed_by` string(36) nullable, references `users(id)` ON DELETE SET NULL
  - `evaluation` enum(`'positive'`, `'neutral'`, `'negative'`) nullable
  - `observations` text nullable (MySQL TEXT, validação de 2000 chars no service)
- Down: drop as 4 colunas

---

### `adoption-requests.types.ts` *(modify)*

**Reference pattern**: tipos existentes no mesmo arquivo (`ScheduleVisitInput`, `VisitStatus`)
**Additions**:
- `export type VisitEvaluation = 'positive' | 'neutral' | 'negative';`
- Interface `CompleteVisitInput`:
  ```typescript
  export interface CompleteVisitInput {
    completed_at: string; // ISO 8601
    evaluation: VisitEvaluation;
    observations?: string;
  }
  ```
- Interface `VisitDetailVolunteer` (retorno completo para volunteer/admin):
  ```typescript
  export interface VisitDetailVolunteer {
    id: string;
    adoption_request_id: string;
    animal_id: string;
    ong_id: string;
    scheduled_by: string;
    visit_date: string;
    notes: string | null;
    status: VisitStatus;
    completed_at: string | null;
    completed_by: string | null;
    evaluation: VisitEvaluation | null;
    observations: string | null;
    created_at: string;
    updated_at: string;
  }
  ```
- Interface `VisitDetailAdopter` (retorno parcial — sem `observations`, `notes`, `scheduled_by`, `ong_id`):
  ```typescript
  export interface VisitDetailAdopter {
    id: string;
    adoption_request_id: string;
    animal_id: string;
    visit_date: string;
    status: VisitStatus;
    completed_at: string | null;
    evaluation: VisitEvaluation | null;
    created_at: string;
    updated_at: string;
  }
  ```

---

### `adoption-requests.errors.ts` *(modify)*

**Reference pattern**: erros existentes no mesmo arquivo (`AppError` base)
**Additions**:
- `VisitNotFoundError`: status 404, code `VISIT_NOT_FOUND`, message "Visita não encontrada."
- `VisitAlreadyCompletedError`: status 409, code `VISIT_ALREADY_COMPLETED`, message "Esta visita já foi registrada como realizada."
- `VisitCancelledError`: status 422, code `VISIT_CANCELLED`, message "Não é possível registrar uma visita que foi cancelada."
- `InvalidCompletionDateError`: status 422, code `INVALID_COMPLETION_DATE`, message recebida via constructor (variações: data futura, anterior ao agendamento)
- `InvalidEvaluationError`: status 422, code `INVALID_EVALUATION`, message "A avaliação deve ser: positiva, neutra ou negativa."
- `VisitOngMismatchError`: status 403, code `VISIT_ONG_MISMATCH`, message "Você não tem permissão para registrar visitas de outra organização."

---

### `adoption-requests.validator.ts` *(modify)*

**Reference pattern**: `rejectAdoptionRequestSchema` no mesmo arquivo
**Additions**:
```typescript
export const completeVisitSchema = z.object({
  completed_at: z.string().datetime({ message: 'Data de realização inválida. Use formato ISO 8601.' }),
  evaluation: z.enum(['positive', 'neutral', 'negative'], {
    errorMap: () => ({ message: 'A avaliação deve ser: positiva, neutra ou negativa.' }),
  }),
  observations: z.string().trim().max(2000, 'As observações devem ter no máximo 2000 caracteres.').optional(),
});

export const visitIdParamSchema = z.object({
  visitId: z.string({ required_error: 'ID da visita é obrigatório.' }).uuid('ID da visita inválido.'),
});
```

---

### `adoption-requests.repository.ts` *(modify)*

**Reference pattern**: método `findByIdForOng` (query simples com filtro de ong)
**Additions**:

- `findVisitForCompletion(visitId: string, ongId: string, trx: Knex.Transaction): Promise<{ id, status, visit_date, ong_id, adoption_request_id } | null>`
  - `SELECT id, status, visit_date, ong_id, adoption_request_id FROM visits WHERE id = ? AND ong_id = ? FOR UPDATE` (via `trx('visits').where(...).forUpdate().first()`)
  - Retorna null se não encontrar

- `completeVisit(visitId: string, data: { completed_at: string, completed_by: string, evaluation: string, observations?: string }, trx: Knex.Transaction): Promise<void>`
  - `UPDATE visits SET status = 'completed', completed_at = ?, completed_by = ?, evaluation = ?, observations = ?, updated_at = NOW() WHERE id = ?`

- `findVisitDetailFull(visitId: string): Promise<VisitDetailVolunteer | null>`
  - SELECT all columns from `visits` WHERE id = ?
  - Retorna formato `VisitDetailVolunteer`

- `findVisitDetailForAdopter(visitId: string, adopterId: string): Promise<VisitDetailAdopter | null>`
  - JOIN `visits` com `adoption_requests` ON `visits.adoption_request_id = adoption_requests.id`
  - WHERE `visits.id = ?` AND `adoption_requests.adopter_id = ?`
  - SELECT apenas campos de `VisitDetailAdopter` (exclui `observations`, `notes`, `scheduled_by`, `ong_id`)

---

### `adoption-requests.service.ts` *(modify)*

**Reference pattern**: método `approve` (validação de status + update + audit log)
**Addition** — método `completeVisit(visitId: string, input: CompleteVisitInput, userId: string, ongId: string): Promise<void>`:

Fluxo (dentro de `db.transaction`):
1. `findVisitForCompletion(visitId, ongId, trx)` → se null, verificar se visita existe em outra ONG:
   - Buscar sem filtro de ong: se existe mas ong_id != ongId → throw `VisitOngMismatchError`
   - Se não existe → throw `VisitNotFoundError`
2. Validar `visit.status`:
   - `'completed'` → throw `VisitAlreadyCompletedError`
   - `'cancelled'` → throw `VisitCancelledError`
   - Deve ser `'scheduled'`
3. Validar `completed_at`:
   - Parsear como Date
   - Se no futuro → throw `InvalidCompletionDateError("A data de realização não pode ser no futuro.")`
   - Se anterior a `visit.visit_date` → throw `InvalidCompletionDateError("A data de realização não pode ser anterior à data do agendamento.")`
4. `completeVisit(visitId, { completed_at: input.completed_at, completed_by: userId, evaluation: input.evaluation, observations: input.observations }, trx)`

Após a transação:
5. `recordAuditLog({ user_id: userId, ong_id: ongId, action: 'visit_completed', entity: 'visit', entity_id: visitId, metadata: { evaluation: input.evaluation, adoption_request_id: visit.adoption_request_id } })`

**Addition** — método `getVisitDetail(visitId: string, userId: string, role: string, ongId: string | null): Promise<VisitDetailVolunteer | VisitDetailAdopter>`:
1. Se role é `ong_volunteer` ou `ong_admin`:
   - `findVisitDetailFull(visitId)` → se null throw `VisitNotFoundError`
   - Verificar `visit.ong_id === ongId` → senão throw `VisitNotFoundError` (não revelar existência)
   - Retornar completo
2. Se role é `adopter`:
   - `findVisitDetailForAdopter(visitId, userId)` → se null throw `VisitNotFoundError`
   - Retornar parcial (sem observations)

---

### `adoption-requests.controller.ts` *(modify)*

**Reference pattern**: método `approve` (mesma estrutura ongId guard + service call)
**Additions**:

- Método `completeVisit`:
  - Extrair `userId`, `ongId` de `req.user!`
  - Guard: se `!ongId` → 403 "Você não está vinculado a nenhuma ONG."
  - Chamar `adoptionRequestsService.completeVisit(req.params.visitId, req.body, userId, ongId)`
  - Responder `200` com `{ message: 'Visita registrada como realizada com sucesso.' }`

- Método `getVisitDetail`:
  - Extrair `userId`, `role`, `ongId` de `req.user!`
  - Chamar `adoptionRequestsService.getVisitDetail(req.params.visitId, userId, role, ongId)`
  - Responder `200` com `{ data: result }`

---

### `adoption-requests.routes.ts` *(modify)*

**Reference pattern**: rota `PATCH /:id/approve`
**Additions** (posicionar antes da rota `GET /:id` para evitar conflito):
```typescript
router.patch(
  '/visits/:visitId/complete',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(visitIdParamSchema, 'params'),
  validate(completeVisitSchema),
  (req, res, next) => adoptionRequestsController.completeVisit(req, res, next),
);

router.get(
  '/visits/:visitId',
  authenticate,
  authorize(['adopter', 'ong_admin', 'ong_volunteer']),
  validate(visitIdParamSchema, 'params'),
  (req, res, next) => adoptionRequestsController.getVisitDetail(req, res, next),
);
```

---

## Acceptance Criteria

- [ ] **Given** visita com status `scheduled` e voluntário da mesma ONG, **When** submete `PATCH /visits/:visitId/complete` com `completed_at` válido, `evaluation: "positive"` e observações, **Then** retorna 200 com mensagem de sucesso, status da visita transiciona para `completed`, campos `completed_at`, `completed_by`, `evaluation` e `observations` são persistidos
- [ ] **Given** visita com status `scheduled`, **When** voluntário submete sem observações e `evaluation: "neutral"`, **Then** visita registrada com `observations = null`
- [ ] **Given** visita com status `completed`, **When** voluntário tenta registrar novamente, **Then** retorna 409 "Esta visita já foi registrada como realizada."
- [ ] **Given** visita com status `cancelled`, **When** voluntário tenta registrar, **Then** retorna 422 "Não é possível registrar uma visita que foi cancelada."
- [ ] **Given** `completed_at` no futuro, **When** submete, **Then** retorna 422 "A data de realização não pode ser no futuro."
- [ ] **Given** `completed_at` anterior a `visit_date`, **When** submete, **Then** retorna 422 "A data de realização não pode ser anterior à data do agendamento."
- [ ] **Given** `observations` com mais de 2000 caracteres, **When** submete, **Then** retorna 422 "As observações devem ter no máximo 2000 caracteres."
- [ ] **Given** `evaluation` inválido (ex: "excellent"), **When** submete, **Then** retorna 422 "A avaliação deve ser: positiva, neutra ou negativa."
- [ ] **Given** role `adopter`, **When** tenta acessar rota PATCH complete, **Then** retorna 403
- [ ] **Given** voluntário de ONG A, visita pertence à ONG B, **When** tenta registrar, **Then** retorna 403 "Você não tem permissão para registrar visitas de outra organização."
- [ ] **Given** visita inexistente, **When** tenta registrar, **Then** retorna 404 "Visita não encontrada."
- [ ] **Given** registro bem-sucedido, **Then** audit log registrado com action `visit_completed`, entity `visit`, metadata contém `evaluation` e `adoption_request_id`
- [ ] **Given** status do pedido de adoção antes do registro, **Then** status do pedido NÃO é alterado após o registro da visita
- [ ] **Given** 2 requisições simultâneas de complete para mesma visita, **Then** apenas 1 é aceita (409 para a segunda) — garantido por `FOR UPDATE`
- [ ] **Given** voluntário/admin consulta `GET /visits/:visitId` de visita completed da sua ONG, **Then** retorna todos os campos incluindo `observations`
- [ ] **Given** adotante consulta `GET /visits/:visitId` de visita vinculada ao seu pedido, **Then** retorna dados parciais SEM `observations`, `notes`, `scheduled_by`, `ong_id`

---

## Authorization

- `ong_volunteer | ong_admin` → PATCH complete e GET detail (visão completa)
- `adopter` → GET detail apenas (visão parcial, apenas visitas do próprio pedido)
- ONG ownership: visita deve pertencer à mesma ONG do voluntário (validado no repository com `ong_id` + `FOR UPDATE`)

---

## API Notes

- **Endpoint 1**: `PATCH /adoption-requests/visits/:visitId/complete`
- **Input**: `{ completed_at: string (ISO 8601), evaluation: 'positive' | 'neutral' | 'negative', observations?: string }`
- **Success**: `200` — `{ message: 'Visita registrada como realizada com sucesso.' }`
- **Errors**: `403` — sem permissão/outra ONG; `404` — visita não encontrada; `409` — já completada; `422` — validação de data/avaliação/observações/visita cancelada

- **Endpoint 2**: `GET /adoption-requests/visits/:visitId`
- **Input**: apenas auth headers
- **Success**: `200` — `{ data: VisitDetailVolunteer | VisitDetailAdopter }` (conforme role)
- **Errors**: `404` — visita não encontrada/não pertence ao usuário

---

## Dependencies

- **Requires**: TASK-BACKEND-009 (tabela `visits` com status `scheduled`, migration 018, métodos de visita no repository)
- **Blocks**: TASK-FRONTEND (tela de registro de visita)