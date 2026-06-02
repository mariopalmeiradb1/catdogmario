# TASK-BACKEND-002 — Reversão automática para "Disponível" ao cancelar visitas

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-002-revert-to-available`
**Spec**: `.makuco/specs/module_005_gestão_de_animais/feature_003_atualizacao_status_animal/spec_context.md`
**Part**: 2 of 3 — HU-02
**Generated**: `2026-06-02`

---

## Context

Implementar o endpoint `PATCH /:id/revert-to-available` que transiciona `in_adoption_process → available`. Este endpoint será chamado pelo módulo de Visitas quando todas as visitas ativas de um animal forem canceladas. Utiliza a infraestrutura de state machine criada na Task 001.

---

## Scope

**In:**
- Service: método `revertToAvailable(id, userId, ongId)`
- Controller: método `revertToAvailable`
- Rota: `PATCH /:id/revert-to-available`
- Testes unitários adicionais em `animal-management.status.spec.ts`

**Out:**
- Não alterar migration, tipos base, ou `validateTransition` (já existem da Task 001)
- Não implementar lógica de contagem de visitas ativas (responsabilidade do módulo de Visitas)
- Não alterar frontend
- Não implementar `confirmAdoption` (Task 003)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/animal-management/animal-management.service.ts` | método revertToAvailable |
| `modify` | `src/domains/animal-management/animal-management.controller.ts` | controller revertToAvailable |
| `modify` | `src/domains/animal-management/animal-management.routes.ts` | rota PATCH revert-to-available |
| `modify` | `tests/unit/animal-management.status.spec.ts` | testes da reversão |

---

## Implementation

### `animal-management.service.ts` *(modify)*

**Reference pattern**: método `startAdoptionProcess` criado na Task 001
**Differences from reference**:
- Método `revertToAvailable(id: string, userId: string, ongId: string): Promise<StatusTransitionResult>`
- Mesmo pattern transacional: `db.transaction` → `findByIdForUpdate` → `validateTransition(current.status, 'available')` → `updateStatus` → `createStatusHistory`
- `trigger_type: 'automatic'`, `trigger_reason: 'all_visits_cancelled'`
- Audit action: `'animal.status.revert_to_available'`

### `animal-management.controller.ts` *(modify)*

**Reference pattern**: controller `startAdoptionProcess` criado na Task 001
**Differences from reference**:
- Método `revertToAvailable` — mesma estrutura, chama `service.revertToAvailable`

### `animal-management.routes.ts` *(modify)*

**Reference pattern**: rota `PATCH /:id/start-adoption-process` criada na Task 001
**Adicionar após:**
```typescript
router.patch(
  '/:id/revert-to-available',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  (req, res, next) => animalManagementController.revertToAvailable(req, res, next),
);
```

### `animal-management.status.spec.ts` *(modify)*

**Adicionar describe para `revertToAvailable`:**
- Animal `in_adoption_process` → retorna status `available`
- Animal `available` → throw `InvalidStatusTransitionError`
- Animal `adopted` → throw `InvalidStatusTransitionError`
- Animal inexistente → throw `AnimalNotFoundError`
- Verificar `createStatusHistory` com `trigger_reason='all_visits_cancelled'`
- Verificar `recordAuditLog` com action correta

---

## Acceptance Criteria

- [ ] **Given** animal com status `in_adoption_process`, **When** `PATCH /:id/revert-to-available` é chamado, **Then** status muda para `available` e response `200` com `{ data: { id, status: 'available', updated_at } }`.
- [ ] **Given** animal com status `available`, **When** `PATCH /:id/revert-to-available` é chamado, **Then** response `422` com code `INVALID_STATUS_TRANSITION`.
- [ ] **Given** animal com status `adopted`, **When** `PATCH /:id/revert-to-available` é chamado, **Then** response `422` com code `INVALID_STATUS_TRANSITION`.
- [ ] **Given** animal inexistente, **When** endpoint é chamado, **Then** response `404` com code `ANIMAL_NOT_FOUND`.
- [ ] **Given** transição bem-sucedida, **When** verifico `animal_status_history`, **Then** registro com `from_status='in_adoption_process'`, `to_status='available'`, `trigger_type='automatic'`, `trigger_reason='all_visits_cancelled'`.
- [ ] **Given** transição bem-sucedida, **When** verifico audit_log, **Then** entrada com `action='animal.status.revert_to_available'`.

---

## API Notes

- **Endpoint**: `PATCH /api/animals/:id/revert-to-available`
- **Auth**: `authenticate` + `authorize(['ong_admin', 'ong_volunteer'])`
- **Input**: sem body (ação disparada pelo módulo de visitas ao cancelar todas)
- **Success**: `200` — `{ data: { id: string, status: 'available', updated_at: string } }`
- **Errors**: `404` — animal não encontrado; `422` — transição inválida; `403` — sem ong vinculada

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (infraestrutura de state machine: migration, `validateTransition`, `findByIdForUpdate`, `updateStatus`, `createStatusHistory`, tipos)
- **Blocks**: nenhum