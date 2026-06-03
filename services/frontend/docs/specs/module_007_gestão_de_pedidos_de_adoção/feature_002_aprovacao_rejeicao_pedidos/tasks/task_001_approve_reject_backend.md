# TASK-BACKEND-002 — Aprovação e Rejeição de Pedidos de Adoção (API)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-002-approve-reject-backend`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_002_aprovacao_rejeicao_pedidos/spec_context.md`
**Part**: 1 of 2 — Backend
**Generated**: `2026-06-02`

---

## Context

Adicionar endpoints de aprovação, rejeição e início de análise ao domínio `adoption-requests` criado na TASK-BACKEND-001. Voluntários/admins da ONG podem aprovar (→ `approved`), rejeitar (→ `rejected`, justificativa obrigatória) ou iniciar análise (→ `in_review`). Apenas pedidos com status `pending` ou `in_review` são elegíveis.
Spec: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_002_aprovacao_rejeicao_pedidos/spec_context.md`

---

## Scope

**In:**
- Endpoint `PATCH /api/v1/adoption-requests/:id/start-review` — voluntário inicia análise
- Endpoint `PATCH /api/v1/adoption-requests/:id/approve` — voluntário aprova pedido
- Endpoint `PATCH /api/v1/adoption-requests/:id/reject` — voluntário rejeita com justificativa
- Novos tipos, erros, validação, repository, service, controller, routes (modificações nos arquivos existentes)
- Testes unitários e de integração

**Out:**
- Criação de pedido, listagem, detalhe, cancelamento (TASK-BACKEND-001)
- Fechamento automático de pedidos (TASK-BACKEND-003)
- Notificações por e-mail (apenas audit log)
- Frontend (TASK-FRONTEND-003)
- Alteração de status do animal (domínio `animal-management`, não tocar)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/adoption-requests/adoption-requests.types.ts` | constantes de transição |
| `modify` | `src/domains/adoption-requests/adoption-requests.errors.ts` | erro transição inválida |
| `modify` | `src/domains/adoption-requests/adoption-requests.validator.ts` | schema rejeição |
| `modify` | `src/domains/adoption-requests/adoption-requests.repository.ts` | método findByIdForOng |
| `modify` | `src/domains/adoption-requests/adoption-requests.service.ts` | approve/reject/startReview |
| `modify` | `src/domains/adoption-requests/adoption-requests.controller.ts` | handlers novos |
| `modify` | `src/domains/adoption-requests/adoption-requests.routes.ts` | 3 novas rotas PATCH |
| `create` | `tests/unit/adoption-requests.approve-reject.spec.ts` | testes unitários |
| `create` | `tests/integration/adoption-requests.approve-reject.spec.ts` | testes integração |

---

## Implementation

### `adoption-requests.types.ts` *(modify)*
**Alterações**:
- Adicionar `APPROVABLE_STATUSES: ['pending', 'in_review']` — estados que permitem aprovação/rejeição
- Adicionar `REVIEWABLE_STATUSES: ['pending']` — estados que permitem mudar para "em análise"
- Adicionar `RejectAdoptionRequestInput: { rejection_reason: string }`

### `adoption-requests.errors.ts` *(modify)*
**Alteração**:
- Adicionar `InvalidRequestTransitionError` — HTTP 422, `INVALID_REQUEST_TRANSITION`, mensagem dinâmica: `"Este pedido não pode ser ${action} no status atual."` (recebe action string no construtor)

### `adoption-requests.validator.ts` *(modify)*
**Alteração**:
- Adicionar `rejectAdoptionRequestSchema`: `{ rejection_reason: z.string().trim().min(10, 'A justificativa deve ter pelo menos 10 caracteres.').max(1000, 'A justificativa deve ter no máximo 1000 caracteres.') }`

### `adoption-requests.repository.ts` *(modify)*
**Alteração**:
- Adicionar `findByIdForOng(id: string, ongId: string): Promise<{ id: string; status: AdoptionRequestStatus; animal_id: string; adopter_id: string } | null>` — SELECT simples sem JOINs, WHERE `id = id AND ong_id = ongId`
- Modificar `updateStatus` para aceitar `rejection_reason` no objeto `extra`

### `adoption-requests.service.ts` *(modify)*
**Reference pattern**: `src/domains/animal-management/animal-management.service.ts` (método `startAdoptionProcess`)
**Novos métodos**:

- `startReview(id: string, userId: string, ongId: string): Promise<void>`
  1. `repository.findByIdForOng(id, ongId)` → null → throw `AdoptionRequestNotFoundError`
  2. Verificar status IN `REVIEWABLE_STATUSES` → senão, throw `InvalidRequestTransitionError('colocado em análise')`
  3. `repository.updateStatus(id, 'in_review')`
  4. Audit log: `action: 'adoption_request.start_review'`

- `approve(id: string, userId: string, ongId: string): Promise<void>`
  1. `repository.findByIdForOng(id, ongId)` → null → throw `AdoptionRequestNotFoundError`
  2. Verificar status IN `APPROVABLE_STATUSES` → senão, throw `InvalidRequestTransitionError('aprovado')`
  3. `repository.updateStatus(id, 'approved')`
  4. Audit log: `action: 'adoption_request.approve'`

- `reject(id: string, input: RejectAdoptionRequestInput, userId: string, ongId: string): Promise<void>`
  1. `repository.findByIdForOng(id, ongId)` → null → throw `AdoptionRequestNotFoundError`
  2. Verificar status IN `APPROVABLE_STATUSES` → senão, throw `InvalidRequestTransitionError('rejeitado')`
  3. `repository.updateStatus(id, 'rejected', { rejection_reason: input.rejection_reason })`
  4. Audit log: `action: 'adoption_request.reject', metadata: { rejection_reason: input.rejection_reason }`

### `adoption-requests.controller.ts` *(modify)*
**Novos métodos** (padrão idêntico aos existentes):
- `startReview`: extrai `userId`, `ongId` → valida ongId → `service.startReview` → 204
- `approve`: extrai `userId`, `ongId` → valida ongId → `service.approve` → 204
- `reject`: extrai `userId`, `ongId` → valida ongId → `service.reject(id, req.body, userId, ongId)` → 204

### `adoption-requests.routes.ts` *(modify)*
**Novas rotas**:
- `PATCH /:id/start-review` — `authenticate`, `authorize(['ong_admin', 'ong_volunteer'])`, `validate(adoptionRequestIdParamSchema, 'params')`, controller.startReview
- `PATCH /:id/approve` — `authenticate`, `authorize(['ong_admin', 'ong_volunteer'])`, `validate(adoptionRequestIdParamSchema, 'params')`, controller.approve
- `PATCH /:id/reject` — `authenticate`, `authorize(['ong_admin', 'ong_volunteer'])`, `validate(adoptionRequestIdParamSchema, 'params')`, `validate(rejectAdoptionRequestSchema)`, controller.reject

### `adoption-requests.approve-reject.spec.ts` (unit) *(create)*
**Reference pattern**: `tests/unit/animal-management.service.spec.ts`
**Cenários**:
- Aprovação com sucesso (status `pending`) → sem erro
- Aprovação com sucesso (status `in_review`) → sem erro
- Aprovação de pedido `rejected` → throw `InvalidRequestTransitionError`
- Rejeição com sucesso + justificativa válida → sem erro
- Rejeição de pedido `approved` → throw `InvalidRequestTransitionError`
- Start review de pedido `pending` → sem erro
- Start review de pedido `in_review` → throw `InvalidRequestTransitionError`
- Pedido de outra ONG → throw `AdoptionRequestNotFoundError`

### `adoption-requests.approve-reject.spec.ts` (integration) *(create)*
**Reference pattern**: `tests/integration/animal-management.create.spec.ts`
**Cenários**:
- PATCH approve + voluntário + pedido pendente → 204
- PATCH reject + voluntário + justificativa válida → 204
- PATCH reject sem justificativa → 422
- PATCH reject justificativa < 10 chars → 422
- PATCH approve sem token → 401
- PATCH approve com role `adopter` → 403
- PATCH approve pedido de outra ONG → 404
- PATCH approve pedido já rejeitado → 422
- PATCH start-review pedido pendente → 204

---

## Acceptance Criteria

- [ ] **Given** voluntário e pedido `pending`, **When** PATCH `/:id/approve`, **Then** 204 e status → `approved`
- [ ] **Given** voluntário e pedido `in_review`, **When** PATCH `/:id/approve`, **Then** 204 e status → `approved`
- [ ] **Given** voluntário e pedido `rejected`, **When** PATCH `/:id/approve`, **Then** 422 `INVALID_REQUEST_TRANSITION`
- [ ] **Given** voluntário e pedido `pending`, **When** PATCH `/:id/reject` com `rejection_reason` (≥10 chars), **Then** 204, status → `rejected`, `rejection_reason` persistida
- [ ] **Given** voluntário, **When** PATCH `/:id/reject` sem body, **Then** 422
- [ ] **Given** voluntário e pedido `pending`, **When** PATCH `/:id/start-review`, **Then** 204 e status → `in_review`
- [ ] **Given** voluntário ONG A, **When** tenta aprovar pedido de ONG B, **Then** 404
- [ ] Endpoints restritos a `ong_admin | ong_volunteer` — `adopter` recebe 403
- [ ] Cada ação gera registro de audit log

---

## Authorization

- `ong_volunteer | ong_admin` → approve, reject, start-review de pedidos da própria ONG
- `adopter` → 403 em todos os endpoints desta task
- Voluntário de ONG A não acessa pedidos de ONG B (404)

---

## API Notes

- **PATCH** `/api/v1/adoption-requests/:id/start-review` — Input: nenhum — Success: `204` — Errors: `404`, `422`
- **PATCH** `/api/v1/adoption-requests/:id/approve` — Input: nenhum — Success: `204` — Errors: `404`, `422`
- **PATCH** `/api/v1/adoption-requests/:id/reject` — Input: `{ rejection_reason: string }` — Success: `204` — Errors: `404`, `422`

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (domínio `adoption-requests` base)
- **Blocks**: TASK-FRONTEND-003 (UI de aprovação/rejeição)