# TASK-BACKEND-007 — Backend histórico de adoções (endpoint + filtros)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-007-backend-historico`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_003_historico_adocoes/spec_context.md`
**Part**: 1 of 2 — Backend histórico
**Generated**: `2026-06-03`

## Context

Implementar endpoint de histórico de adoções do adotante. O endpoint já existe parcialmente como `GET /api/v1/adoption-requests/mine` (listMine). Esta task estende esse endpoint com filtros adicionais (período) e adiciona um endpoint de detalhe enriquecido para o contexto do histórico. O histórico é cross-tenant — mostra pedidos de todas as ONGs.

## Scope

**In:**
- Estender filtros do `listMine` em adoption-requests (adicionar filtro por período: `date_from`, `date_to`)
- Adicionar dados extras na resposta (foto do animal thumbnail, raça)
- Endpoint de detalhe do pedido para adotante com informações condicionais (motivo rejeição, data conclusão)

**Out:**
- Não criar novo domain — reutilizar `adoption-requests`.
- Não alterar a lógica de criação/aprovação/rejeição de pedidos.
- Não implementar frontend (TASK-008).
- Não implementar exportação para PDF.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/adoption-requests/adoption-requests.validator.ts` | adicionar filtros date_from/date_to |
| `modify` | `src/domains/adoption-requests/adoption-requests.types.ts` | estender types com novos campos |
| `modify` | `src/domains/adoption-requests/adoption-requests.repository.ts` | query com filtros de período |
| `modify` | `src/domains/adoption-requests/adoption-requests.service.ts` | lógica de filtros |

## Implementation

### `adoption-requests.validator.ts` *(modify)*

**Reference pattern**: schema `listAdoptionRequestsQuerySchema` existente

**Differences from reference**:
- Adicionar ao `listAdoptionRequestsQuerySchema` (ou criar `listAdopterHistoryQuerySchema`):
  - `date_from`: `z.string().datetime().optional()` — data início do período
  - `date_to`: `z.string().datetime().optional()` — data fim do período

### `adoption-requests.types.ts` *(modify)*

**Differences from reference**:
- Adicionar à interface `AdopterRequestListFilters`: `date_from?: string`, `date_to?: string`
- Adicionar à interface `AdopterRequestListItem`: `animal_photo_url: string | null`, `animal_breed: string | null`, `ong_name: string`
- Criar interface `AdopterRequestDetail`: extends `AdopterRequestListItem` + `animal_species`, `animal_breed`, `rejection_reason`, `cancelled_by`, `cancellation_reason`, `updated_at`, `completed_at: string | null`

### `adoption-requests.repository.ts` *(modify)*

**Differences from reference**:
- No `listByAdopter`: adicionar WHERE conditions para `date_from` e `date_to` (`created_at >= ?` e `created_at <= ?`)
- Adicionar JOIN com `animals` para trazer `photo_url` (primeira foto) e `breed`
- Adicionar JOIN com `ongs` para trazer `name` (ong_name)
- Criar `findByIdForAdopter(requestId: string, adopterId: string)`: retorna detalhe completo com dados do animal, ONG, motivo rejeição, datas — filtra por `adopter_id` para segurança

### `adoption-requests.service.ts` *(modify)*

**Differences from reference**:
- No `listMine`: passar filtros `date_from`/`date_to` ao repository
- Criar `getDetailForAdopter(requestId: string, userId: string)`: chama repository, retorna detalhe enriquecido. Se não encontrado → 404.

### Novo endpoint no routes (via controller)

- `GET /api/v1/adoption-requests/mine/:id` — authenticate, authorize(['adopter']), controller.getMyRequestDetail

## Acceptance Criteria

- [ ] `GET /mine?date_from=2026-01-01&date_to=2026-06-01` retorna apenas pedidos dentro do período.
- [ ] `GET /mine?status=completed` continua funcionando (regressão).
- [ ] `GET /mine` retorna `animal_photo_url`, `animal_breed` e `ong_name` em cada item.
- [ ] `GET /mine/:id` retorna detalhe completo do pedido para o adotante.
- [ ] `GET /mine/:id` com ID de pedido de outro adotante retorna 404 (não 403 — não revelar existência).
- [ ] `GET /mine/:id` de pedido rejeitado inclui `rejection_reason`.
- [ ] Paginação continua funcionando (10 por página).
- [ ] Todos os testes existentes de `adoption-requests` continuam passando (regressão).

## Dependencies

- **Requires**: TASK-BACKEND-002 (domain adopter já existe, endpoints /mine já existem).
- **Blocks**: TASK-FRONTEND-008 (frontend histórico).
