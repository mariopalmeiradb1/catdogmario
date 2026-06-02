# TASK-BACKEND-003 — Confirmar Adoção + Integração com Catálogo

**Root**: `services/backend/` e `services/frontend/`
**Branch**: `feature/TASK-BACKEND-003-confirm-adoption`
**Spec**: `.makuco/specs/module_005_gestão_de_animais/feature_003_atualizacao_status_animal/spec_context.md`
**Part**: 3 of 3 — HU-03
**Generated**: `2026-06-02`

---

## Context

Implementar o endpoint `PATCH /:id/confirm-adoption` que transiciona `in_adoption_process → adopted` com número do termo de responsabilidade obrigatório. Também inclui: alterar o catálogo para exibir animais `in_adoption_process` com badge e corrigir o tipo `AnimalStatus` no frontend. O cancelamento de pedidos pendentes (RN-06) é um hook para integração futura — não implementado.

---

## Scope

**In:**
- Backend: schema Zod `confirmAdoptionSchema`
- Backend: service `confirmAdoption(id, userId, ongId, termNumber)`
- Backend: controller e rota `PATCH /:id/confirm-adoption`
- Backend: alterar `catalog.repository.ts` para incluir `in_adoption_process`
- Backend: alterar `catalog.types.ts` para incluir campo `status` no `CatalogAnimal`
- Frontend: corrigir tipo `AnimalStatus` em `animal-management.types.ts`
- Frontend: corrigir tipo `CatalogAnimal` em `catalog.types.ts` para incluir `status`
- Testes unitários adicionais em `animal-management.status.spec.ts`

**Out:**
- Não implementar cancelamento de pedidos pendentes (módulo inexistente — deixar `// TODO` no service)
- Não implementar notificações a adotantes
- Não alterar página de detalhe do animal no frontend (UI de botão "Confirmar Adoção" será outra task)
- Não alterar `startAdoptionProcess` nem `revertToAvailable` (Tasks 001 e 002)

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Termo de Responsabilidade | campo `responsibility_term_number: string` no body e na tabela `animals` |
| Confirmação de Adoção | método `confirmAdoption`, ação manual do voluntário |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/animal-management/animal-management.validator.ts` | schema confirmAdoptionSchema |
| `modify` | `src/domains/animal-management/animal-management.service.ts` | método confirmAdoption |
| `modify` | `src/domains/animal-management/animal-management.controller.ts` | controller confirmAdoption |
| `modify` | `src/domains/animal-management/animal-management.routes.ts` | rota PATCH confirm-adoption |
| `modify` | `src/domains/catalog/catalog.repository.ts` | incluir in_adoption_process |
| `modify` | `src/domains/catalog/catalog.types.ts` | campo status no CatalogAnimal |
| `modify` | `services/frontend/src/types/animal-management.types.ts` | corrigir AnimalStatus |
| `modify` | `services/frontend/src/types/catalog.types.ts` | adicionar status ao CatalogAnimal |
| `modify` | `tests/unit/animal-management.status.spec.ts` | testes confirmAdoption |

---

## Implementation

### `animal-management.validator.ts` *(modify)*

**Reference pattern**: `createAnimalSchema` no mesmo arquivo
**Adicionar ao final:**
```typescript
export const confirmAdoptionSchema = z.object({
  responsibility_term_number: z
    .string({ required_error: 'Informe o número do termo de responsabilidade para confirmar a adoção.' })
    .trim()
    .min(1, 'Informe o número do termo de responsabilidade para confirmar a adoção.')
    .max(100, 'Número do termo deve ter no máximo 100 caracteres.'),
});
```

### `animal-management.service.ts` *(modify)*

**Reference pattern**: método `startAdoptionProcess` criado na Task 001
**Adicionar método `confirmAdoption(id: string, userId: string, ongId: string, termNumber: string): Promise<ConfirmAdoptionResult>`:**
- Transação: `findByIdForUpdate` → `validateTransition(current.status, 'adopted')`
- `updateStatus(id, 'adopted', { responsibility_term_number: termNumber, adopted_at: new Date() }, trx)`
- `createStatusHistory` com `trigger_type: 'manual'`, `trigger_reason: 'adoption_confirmed'`, metadata: `{ responsibility_term_number: termNumber }`
- Após transação: `recordAuditLog` com `action: 'animal.status.confirm_adoption'`
- `// TODO: integrar com módulo de Pedidos — cancelar pedidos pendentes (RN-06)`
- Retorna `{ id, status: 'adopted', adopted_at: new Date().toISOString(), responsibility_term_number: termNumber }`

### `animal-management.controller.ts` *(modify)*

**Reference pattern**: controller `startAdoptionProcess` criado na Task 001
**Differences from reference**:
- Extrai `req.body.responsibility_term_number` do body
- Chama `service.confirmAdoption(req.params.id, userId, ongId, req.body.responsibility_term_number)`

### `animal-management.routes.ts` *(modify)*

**Reference pattern**: rota `PATCH /:id/start-adoption-process`
**Adicionar:**
```typescript
router.patch(
  '/:id/confirm-adoption',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(confirmAdoptionSchema),
  (req, res, next) => animalManagementController.confirmAdoption(req, res, next),
);
```
**Nota:** importar `confirmAdoptionSchema` do validator.

### `catalog.repository.ts` *(modify)*

**Alterar filtro de status:**
- De: `.where('a.status', 'available')`
- Para: `.whereIn('a.status', ['available', 'in_adoption_process'])`
- Adicionar `'a.status'` ao `.select(...)` para expor no response

### `catalog.types.ts` *(modify — backend)*

**Adicionar campo `status` à interface `CatalogAnimal`:**
```typescript
status: 'available' | 'in_adoption_process';
```

### `services/frontend/src/types/animal-management.types.ts` *(modify)*

**Corrigir tipo `AnimalStatus`:**
- De: `export type AnimalStatus = 'available' | 'adopted' | 'in_treatment' | 'inactive';`
- Para: `export type AnimalStatus = 'available' | 'in_adoption_process' | 'adopted' | 'inactive';`

### `services/frontend/src/types/catalog.types.ts` *(modify)*

**Adicionar campo `status` à interface `CatalogAnimal`:**
```typescript
status: 'available' | 'in_adoption_process';
```

### `animal-management.status.spec.ts` *(modify)*

**Adicionar describe para `confirmAdoption`:**
- Animal `in_adoption_process` + term number → retorna `{ status: 'adopted', adopted_at, responsibility_term_number }`
- Animal `available` → throw `InvalidStatusTransitionError`
- Animal `adopted` → throw `InvalidStatusTransitionError`
- Animal inexistente → throw `AnimalNotFoundError`
- Verificar que `updateStatus` recebe `responsibility_term_number` e `adopted_at`
- Verificar `createStatusHistory` com `trigger_type='manual'`
- Verificar `recordAuditLog` com action `'animal.status.confirm_adoption'`

---

## Acceptance Criteria

- [ ] **Given** animal com status `in_adoption_process`, **When** `PATCH /:id/confirm-adoption` com `{ responsibility_term_number: "TR-2026-001" }`, **Then** status muda para `adopted`, response `200` com `{ data: { id, status: 'adopted', adopted_at, responsibility_term_number } }`.
- [ ] **Given** animal com status `in_adoption_process`, **When** body sem `responsibility_term_number`, **Then** response `422` com mensagem de validação Zod.
- [ ] **Given** animal com status `in_adoption_process`, **When** `responsibility_term_number` é string vazia, **Then** response `422` com mensagem `'Informe o número do termo de responsabilidade para confirmar a adoção.'`.
- [ ] **Given** animal com status `available`, **When** endpoint é chamado, **Then** response `422` com code `INVALID_STATUS_TRANSITION`.
- [ ] **Given** animal confirmado como adotado, **When** verifico `animal_status_history`, **Then** registro com `trigger_type='manual'`, `trigger_reason='adoption_confirmed'`, metadata contendo term_number.
- [ ] **Given** animal confirmado como adotado, **When** verifico tabela `animals`, **Then** colunas `responsibility_term_number` e `adopted_at` estão preenchidas.
- [ ] **Given** catálogo público consultado, **When** existem animais `available` e `in_adoption_process`, **Then** ambos retornam na listagem com campo `status` presente no response.
- [ ] **Given** animal com status `adopted`, **When** catálogo é consultado, **Then** animal NÃO aparece nos resultados.
- [ ] Frontend type `AnimalStatus` corrigido: contém `'in_adoption_process'` e NÃO contém `'in_treatment'`.
- [ ] Frontend type `CatalogAnimal` inclui campo `status: 'available' | 'in_adoption_process'`.

---

## API Notes

- **Endpoint**: `PATCH /api/animals/:id/confirm-adoption`
- **Auth**: `authenticate` + `authorize(['ong_admin', 'ong_volunteer'])`
- **Input**: `{ responsibility_term_number: string }` — obrigatório, 1-100 chars
- **Success**: `200` — `{ data: { id: string, status: 'adopted', adopted_at: string, responsibility_term_number: string } }`
- **Errors**: `404` — animal não encontrado; `422` — transição inválida ou validação Zod; `403` — sem ong vinculada

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (infraestrutura de state machine, migration com colunas `responsibility_term_number` e `adopted_at`)
- **Blocks**: nenhum (frontend UI de botão "Confirmar Adoção" será task futura separada)