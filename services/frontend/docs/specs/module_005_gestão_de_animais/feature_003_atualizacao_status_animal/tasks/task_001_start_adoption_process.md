# TASK-BACKEND-001 — Infraestrutura da Máquina de Estados + Transição para "Em Processo de Adoção"

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-001-start-adoption-process`
**Spec**: `.makuco/specs/module_005_gestão_de_animais/feature_003_atualizacao_status_animal/spec_context.md`
**Part**: 1 of 3 — Infraestrutura + HU-01
**Generated**: `2026-06-02`

---

## Context

Implementar a base da máquina de estados do animal (validação de transições, controle de concorrência via `SELECT FOR UPDATE`, tabela de histórico) e o primeiro endpoint `PATCH /:id/start-adoption-process` que transiciona `available → in_adoption_process`. Este endpoint será chamado futuramente pelo módulo de Visitas ao agendar uma visita. Spec: `.makuco/specs/module_005_gestão_de_animais/feature_003_atualizacao_status_animal/spec_context.md` (HU-01).

---

## Scope

**In:**
- Migration: adicionar colunas `responsibility_term_number` e `adopted_at` na tabela `animals`
- Migration: criar tabela `animal_status_history`
- Novo erro `InvalidStatusTransitionError`
- Novos tipos: `StatusTransitionResult`, `ConfirmAdoptionResult`, `VALID_TRANSITIONS`
- Repository: `findByIdForUpdate(id, ongId, trx)`, `updateStatus(id, status, extraFields, trx)`, `createStatusHistory(entry, trx)`
- Service: `validateTransition(from, to)` privado + `startAdoptionProcess(id, userId, ongId)`
- Controller: `startAdoptionProcess`
- Rota: `PATCH /:id/start-adoption-process`
- Testes unitários do service

**Out:**
- Não alterar métodos existentes (`create`, `update`, `inactivate`, `uploadMedia`, `removeMedia`)
- Não alterar catálogo (será feito na Task 003)
- Não implementar frontend
- Não implementar `revertToAvailable` nem `confirmAdoption` (Tasks 002 e 003)

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Transição de Status | `validateTransition(from: AnimalStatus, to: AnimalStatus)` |
| Histórico de Status | tabela `animal_status_history`, método `createStatusHistory` |
| Em Processo de Adoção | `'in_adoption_process'` no enum `AnimalStatus` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260602_015_add_adoption_columns_and_status_history.ts` | novos campos e tabela histórico |
| `modify` | `src/domains/animal-management/animal-management.errors.ts` | novo erro transição inválida |
| `modify` | `src/domains/animal-management/animal-management.types.ts` | novos tipos de transição |
| `modify` | `src/domains/animal-management/animal-management.repository.ts` | métodos forUpdate e updateStatus |
| `modify` | `src/domains/animal-management/animal-management.service.ts` | validateTransition + startAdoptionProcess |
| `modify` | `src/domains/animal-management/animal-management.controller.ts` | controller startAdoptionProcess |
| `modify` | `src/domains/animal-management/animal-management.routes.ts` | rota PATCH start-adoption-process |
| `create` | `tests/unit/animal-management.status.spec.ts` | testes da máquina de estados |

---

## Implementation

### `20260602_015_add_adoption_columns_and_status_history.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260601_014_add_inactive_status_to_animals.ts`
**Differences from reference**:
- `up`:
  - `ALTER TABLE animals ADD COLUMN responsibility_term_number VARCHAR(100) NULL`
  - `ALTER TABLE animals ADD COLUMN adopted_at TIMESTAMP NULL`
  - Criar tabela `animal_status_history` com colunas:
    - `id VARCHAR(36) PK`
    - `animal_id VARCHAR(36) NOT NULL FK → animals.id ON DELETE CASCADE`
    - `from_status ENUM('available','in_adoption_process','adopted','inactive') NOT NULL`
    - `to_status ENUM('available','in_adoption_process','adopted','inactive') NOT NULL`
    - `trigger_type ENUM('automatic','manual') NOT NULL`
    - `trigger_reason VARCHAR(255) NULL`
    - `triggered_by VARCHAR(36) NOT NULL` (user_id ou 'system')
    - `metadata JSON NULL`
    - `created_at TIMESTAMP NOT NULL DEFAULT NOW()`
  - Índice: `idx_status_history_animal_id` em `animal_id`
- `down`: drop tabela `animal_status_history`, drop colunas `responsibility_term_number` e `adopted_at`

### `animal-management.errors.ts` *(modify)*

**Reference pattern**: `CannotInactivateError` no mesmo arquivo
**Differences from reference**:
- Adicionar `InvalidStatusTransitionError`:
  - HTTP 422, code `'INVALID_STATUS_TRANSITION'`
  - Mensagem: `` `Transição de status de "${fromStatus}" para "${toStatus}" não é permitida.` ``
  - Constructor recebe `(fromStatus: string, toStatus: string)`

### `animal-management.types.ts` *(modify)*

**Adicionar ao final do arquivo:**
```typescript
export const VALID_TRANSITIONS: Record<AnimalStatus, AnimalStatus[]> = {
  available: ['in_adoption_process', 'inactive'],
  in_adoption_process: ['available', 'adopted'],
  adopted: ['available', 'inactive'],
  inactive: [],
};

export interface StatusTransitionResult {
  id: string;
  status: AnimalStatus;
  updated_at: string;
}

export interface ConfirmAdoptionResult {
  id: string;
  status: 'adopted';
  adopted_at: string;
  responsibility_term_number: string;
}

export interface StatusHistoryEntry {
  id: string;
  animal_id: string;
  from_status: AnimalStatus;
  to_status: AnimalStatus;
  trigger_type: 'automatic' | 'manual';
  trigger_reason: string;
  triggered_by: string;
  metadata?: Record<string, unknown> | null;
}
```

### `animal-management.repository.ts` *(modify)*

**Reference pattern**: método `inactivate` no mesmo arquivo
**Adicionar 3 novos métodos na classe:**
- `findByIdForUpdate(id: string, ongId: string, trx: Knex.Transaction)`: `trx('animals').where({ id, ong_id: ongId }).forUpdate().first()` — retorna `AnimalRow | null`
- `updateStatus(id: string, status: string, extraFields: Record<string, unknown> | null, trx: Knex.Transaction)`: `trx('animals').where({ id }).update({ status, updated_at: new Date(), ...extraFields })`
- `createStatusHistory(entry: StatusHistoryEntry, trx: Knex.Transaction)`: `trx('animal_status_history').insert(entry)` — `entry.metadata` deve ser `JSON.stringify` se presente

**Import necessário**: `import { Knex } from 'knex';` (se não existir) e `StatusHistoryEntry` do types.

### `animal-management.service.ts` *(modify)*

**Reference pattern**: método `inactivate` no mesmo arquivo
**Adicionar:**
- Import de `VALID_TRANSITIONS`, `StatusTransitionResult`, `StatusHistoryEntry` do types
- Import de `InvalidStatusTransitionError` dos errors
- Import de `db` do config/database (para `db.transaction`)
- Método privado `validateTransition(fromStatus: AnimalStatus, toStatus: AnimalStatus): void`:
  - Se `!VALID_TRANSITIONS[fromStatus].includes(toStatus)` → throw `InvalidStatusTransitionError(fromStatus, toStatus)`
- Método `startAdoptionProcess(id: string, userId: string, ongId: string): Promise<StatusTransitionResult>`:
  - Executa dentro de `db.transaction(async (trx) => { ... })`
  - `findByIdForUpdate(id, ongId, trx)` → se null throw `AnimalNotFoundError`
  - `validateTransition(current.status, 'in_adoption_process')`
  - `updateStatus(id, 'in_adoption_process', null, trx)`
  - `createStatusHistory({ id: crypto.randomUUID(), animal_id: id, from_status: current.status, to_status: 'in_adoption_process', trigger_type: 'automatic', trigger_reason: 'visit_scheduled', triggered_by: userId }, trx)`
  - Após transação: `recordAuditLog({ user_id: userId, ong_id: ongId, action: 'animal.status.start_adoption_process', entity: 'animal', entity_id: id, metadata: { from_status: current.status, to_status: 'in_adoption_process' } })`
  - Retorna `{ id, status: 'in_adoption_process', updated_at: new Date().toISOString() }`

### `animal-management.controller.ts` *(modify)*

**Reference pattern**: método `inactivate` no mesmo arquivo
**Adicionar método `startAdoptionProcess`:**
- Mesma estrutura: extrai `userId`, `ongId` de `req.user!`; valida `ongId`; chama service; retorna `res.status(200).json({ data: result })`

### `animal-management.routes.ts` *(modify)*

**Reference pattern**: rota `PATCH /:id/inactivate`
**Adicionar após a rota de inactivate:**
```typescript
router.patch(
  '/:id/start-adoption-process',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  (req, res, next) => animalManagementController.startAdoptionProcess(req, res, next),
);
```

### `animal-management.status.spec.ts` *(create)*

**Reference pattern**: `tests/unit/animal-management.service.spec.ts`
**Cobertura:**
- `startAdoptionProcess` com animal `available` → retorna status `in_adoption_process`
- `startAdoptionProcess` com animal `in_adoption_process` → throw `InvalidStatusTransitionError`
- `startAdoptionProcess` com animal `adopted` → throw `InvalidStatusTransitionError`
- `startAdoptionProcess` com animal inexistente → throw `AnimalNotFoundError`
- `validateTransition` (testar indiretamente via chamadas)
- Verificar que `createStatusHistory` é chamado com dados corretos
- Verificar que `recordAuditLog` é chamado
---

## Acceptance Criteria

- [ ] **Given** animal com status `available`, **When** `PATCH /:id/start-adoption-process` é chamado, **Then** status muda para `in_adoption_process` e response `200` com `{ data: { id, status, updated_at } }`.
- [ ] **Given** animal com status `in_adoption_process`, **When** `PATCH /:id/start-adoption-process` é chamado, **Then** response `422` com code `INVALID_STATUS_TRANSITION`.
- [ ] **Given** animal com status `adopted`, **When** `PATCH /:id/start-adoption-process` é chamado, **Then** response `422` com code `INVALID_STATUS_TRANSITION`.
- [ ] **Given** animal inexistente, **When** endpoint é chamado, **Then** response `404` com code `ANIMAL_NOT_FOUND`.
- [ ] **Given** transição bem-sucedida, **When** verifico a tabela `animal_status_history`, **Then** existe um registro com `from_status='available'`, `to_status='in_adoption_process'`, `trigger_type='automatic'`, `trigger_reason='visit_scheduled'`.
- [ ] **Given** transição bem-sucedida, **When** verifico o audit_log, **Then** existe entrada com `action='animal.status.start_adoption_process'`.
- [ ] **Given** duas requisições simultâneas para o mesmo animal, **When** ambas tentam transicionar, **Then** apenas uma sucede e a outra recebe erro (garantia via `FOR UPDATE`).
- [ ] Migration cria colunas `responsibility_term_number` e `adopted_at` na tabela `animals` e a tabela `animal_status_history` com índice em `animal_id`.

---

## API Notes

- **Endpoint**: `PATCH /api/animals/:id/start-adoption-process`
- **Auth**: `authenticate` + `authorize(['ong_admin', 'ong_volunteer'])`
- **Input**: sem body (ação disparada pelo módulo de visitas)
- **Success**: `200` — `{ data: { id: string, status: 'in_adoption_process', updated_at: string } }`
- **Errors**: `404` — animal não encontrado; `422` — transição inválida; `403` — sem ong vinculada

---

## Dependencies

- **Requires**: nenhum
- **Blocks**: TASK-BACKEND-002 (revert-to-available depende da infra de state machine), TASK-BACKEND-003 (confirm-adoption depende da infra e da migration)