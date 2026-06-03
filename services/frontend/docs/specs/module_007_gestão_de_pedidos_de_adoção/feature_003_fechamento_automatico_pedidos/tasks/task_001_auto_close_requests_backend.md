# TASK-BACKEND-003 — Fechamento Automático de Pedidos ao Confirmar Adoção

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-003-auto-close-requests-backend`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_003_fechamento_automatico_pedidos/spec_context.md`
**Part**: 1 of 1 — Backend
**Generated**: `2026-06-02`

---

## Context

Quando um animal é confirmado como adotado (`confirmAdoption` no `animal-management.service`), todos os pedidos de adoção com status `pending` ou `in_review` para aquele animal devem ser automaticamente cancelados com `cancelled_by: 'system'`. Já existe um TODO no método `confirmAdoption` para esta integração: `// TODO: integrar com módulo de Pedidos — cancelar pedidos pendentes (RN-06)`.

---

## Scope

**In:**
- Novo método no repository de `adoption-requests` para cancelar em lote por `animal_id`
- Novo método no service de `adoption-requests` para auto-close
- Integração no `animal-management.service.confirmAdoption` chamando o auto-close dentro da transação existente
- Audit log para cada pedido cancelado automaticamente
- Testes unitários e de integração

**Out:**
- Endpoints REST (não há endpoint novo — é lógica interna entre domínios)
- Notificações por e-mail aos adotantes (apenas audit log por enquanto)
- Frontend
- Alteração nos endpoints de `adoption-requests` (TASK-BACKEND-001 e TASK-BACKEND-002)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/adoption-requests/adoption-requests.repository.ts` | método cancelByAnimalId |
| `modify` | `src/domains/adoption-requests/adoption-requests.service.ts` | método autoCloseByAnimal |
| `modify` | `src/domains/animal-management/animal-management.service.ts` | integrar auto-close |
| `create` | `tests/unit/adoption-requests.auto-close.spec.ts` | testes unitários |
| `create` | `tests/integration/adoption-requests.auto-close.spec.ts` | testes integração |

---

## Implementation

### `adoption-requests.repository.ts` *(modify)*
**Alteração**:
- Adicionar `cancelAllActiveByAnimalId(animalId: string, trx: Knex.Transaction): Promise<string[]>`
  - UPDATE `adoption_requests` SET `status = 'cancelled', cancelled_by = 'system', cancellation_reason = 'Animal adotado por outro tutor.', updated_at = NOW()` WHERE `animal_id = animalId AND status IN ('pending', 'in_review')`
  - ANTES do UPDATE, fazer SELECT para obter os IDs dos pedidos que serão cancelados (necessário para audit log)
  - Retorna array de IDs cancelados

### `adoption-requests.service.ts` *(modify)*
**Alteração**:
- Adicionar `autoCloseByAnimal(animalId: string, ongId: string, triggeredByUserId: string, trx: Knex.Transaction): Promise<void>`
  1. Chamar `repository.cancelAllActiveByAnimalId(animalId, trx)` — retorna IDs cancelados
  2. Para cada ID cancelado, registrar audit log: `action: 'adoption_request.auto_close', entity: 'adoption_request', entity_id: id, ong_id: ongId, metadata: { trigger: 'animal_adopted', animal_id: animalId }`
  3. Se nenhum pedido cancelado, retornar silenciosamente

- **Exportar** a instância do service como `adoptionRequestsService` (singleton) para ser importada pelo `animal-management.service`

### `animal-management.service.ts` *(modify)*
**Reference pattern**: método `confirmAdoption` existente no mesmo arquivo
**Alteração**:
- Importar `adoptionRequestsService` de `~/domains/adoption-requests/adoption-requests.service`
- No método `confirmAdoption`, **dentro da transação** (`db.transaction`), após o `createStatusHistory`, chamar:
  ```ts
  await adoptionRequestsService.autoCloseByAnimal(id, ongId, userId, trx);
  ```
- Remover o comentário TODO existente: `// TODO: integrar com módulo de Pedidos — cancelar pedidos pendentes (RN-06)`

### `adoption-requests.auto-close.spec.ts` (unit) *(create)*
**Reference pattern**: `tests/unit/animal-management.service.spec.ts`
**Cenários**:
- Animal com 3 pedidos pendentes → todos cancelados, retorna 3 IDs
- Animal com 1 pedido `approved` e 2 `pending` → apenas 2 pendentes cancelados
- Animal sem pedidos ativos → nenhum cancelado, sem erro
- Audit log registrado para cada pedido cancelado

### `adoption-requests.auto-close.spec.ts` (integration) *(create)*
**Reference pattern**: `tests/integration/animal-management.create.spec.ts`
**Cenários**:
- Criar animal + 2 pedidos pendentes + confirmar adoção → pedidos mudam para `cancelled` com `cancelled_by: 'system'`
- Criar animal + pedido `approved` + pedido `pending` + confirmar adoção → apenas `pending` cancelado
- Confirmar adoção de animal sem pedidos → sem erro, adoção confirmada normalmente
- Pedidos cancelados automaticamente possuem `cancellation_reason: 'Animal adotado por outro tutor.'`

---

## Acceptance Criteria

- [ ] **Given** animal com pedidos `pending` e `in_review`, **When** `confirmAdoption` é chamado, **Then** todos esses pedidos mudam para `cancelled` com `cancelled_by: 'system'`
- [ ] **Given** animal com pedido `approved`, **When** `confirmAdoption`, **Then** pedido `approved` NÃO é cancelado
- [ ] **Given** animal sem pedidos ativos, **When** `confirmAdoption`, **Then** adoção confirmada sem erro
- [ ] Pedidos cancelados automaticamente possuem `cancellation_reason: 'Animal adotado por outro tutor.'`
- [ ] Para cada pedido cancelado, há um registro de audit log com `action: 'adoption_request.auto_close'`
- [ ] O auto-close acontece dentro da mesma transação do `confirmAdoption` — se falhar, a adoção também não é confirmada
- [ ] O comentário TODO existente no `confirmAdoption` é removido

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (domínio `adoption-requests` base com repository e service)
- **Blocks**: Nenhuma — feature independente após TASK-BACKEND-001