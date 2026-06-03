# TASK-FRONTEND-008 — Frontend histórico de adoções

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-008-frontend-historico`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_003_historico_adocoes/spec_context.md`
**Part**: 2 of 2 — Frontend histórico
**Generated**: `2026-06-03`

## Context

Implementar a seção "Meu Histórico" no painel do adotante. Lista paginada de pedidos de adoção com filtros (status, período), badges coloridos por status, e tela de detalhe com informações condicionais. Usa o endpoint `GET /api/v1/adoption-requests/mine` já existente (estendido em TASK-007).

## Scope

**In:**
- Página de listagem do histórico com filtros e paginação
- Componente de filtros (status + período)
- Componente de lista com cards/linhas e badges coloridos
- Página de detalhe do pedido
- Hook para buscar histórico e detalhe
- Rota no painel do adotante

**Out:**
- Não implementar cancelamento de pedido a partir do histórico.
- Não implementar exportação para PDF.
- Não implementar busca textual.
- Não implementar notificações push.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/pages/adopter/AdoptionHistoryPage.tsx` | página principal do histórico |
| `create` | `src/components/adopter-management/AdoptionHistoryList.tsx` | lista com cards/badges |
| `create` | `src/components/adopter-management/AdoptionHistoryFilters.tsx` | filtros status + período |
| `create` | `src/components/adopter-management/AdoptionHistoryDetail.tsx` | detalhe do pedido |
| `create` | `src/hooks/useAdoptionHistory.ts` | hook query history + detail |
| `modify` | `src/routes/` | adicionar rotas |

## Implementation

### `AdoptionHistoryPage.tsx` *(create)*

**Reference pattern**: páginas de listagem em `src/pages/adopter/`

**Differences from reference**:
- Título: "Meu Histórico"
- Renderiza `AdoptionHistoryFilters` + `AdoptionHistoryList`
- Estado vazio: mensagem "Você ainda não fez nenhum pedido de adoção." + link "Explorar animais disponíveis" → `/catalogo`
- Paginação: controles anterior/próxima/número de página
- Ao clicar em item → navega para detalhe (`/historico/:id`)

### `AdoptionHistoryFilters.tsx` *(create)*

**Reference pattern**: componentes de filtro existentes no projeto

**Differences from reference**:
- Filtro "Status": select múltiplo com opções: Pendente, Em análise, Em andamento, Concluído, Cancelado, Rejeitado
- Filtro "Período": dois date pickers (data inicial, data final)
- Botão "Limpar filtros"
- Filtros cumulativos — estado gerenciado via query params da URL

### `AdoptionHistoryList.tsx` *(create)*

**Reference pattern**: componentes de listagem existentes

**Differences from reference**:
- Cada item exibe: thumbnail do animal, nome do animal, espécie, data do pedido, nome da ONG, badge de status
- Badge de status com cores:
  - Pendente → amarelo
  - Em análise → azul
  - Em andamento → azul escuro
  - Concluído → verde
  - Cancelado → cinza
  - Rejeitado → vermelho
- Mensagem quando filtro sem resultados: "Nenhum pedido encontrado com os filtros selecionados."
- Clique no item → navegação para detalhe

### `AdoptionHistoryDetail.tsx` *(create)*

**Reference pattern**: componentes de detalhe existentes

**Differences from reference**:
- Exibe: foto do animal (carrossel se múltiplas), nome, espécie, raça, nome da ONG, data do pedido, status, data última atualização
- Campos condicionais:
  - Se `status === 'completed'` → exibe "Data de conclusão"
  - Se `status === 'rejected'` e `rejection_reason` não é null → exibe "Motivo da rejeição"
- Botão "Voltar ao histórico" → navega para lista
- Badge de status com mesmas cores da lista

### `useAdoptionHistory.ts` *(create)*

**Reference pattern**: `src/hooks/useAdopterRequests.ts` (se existir) ou padrão React Query

**Differences from reference**:
- `useAdoptionHistory(filters)`: query GET `/api/v1/adoption-requests/mine` com filtros como query params. Key: `['adoption-history', filters]`
- `useAdoptionHistoryDetail(id)`: query GET `/api/v1/adoption-requests/mine/:id`. Key: `['adoption-history-detail', id]`
- Retorna `{ data, pagination, isLoading, error }`

## Acceptance Criteria

- [ ] Adotante acessa "Meu Histórico" e vê lista paginada de pedidos (10 por página).
- [ ] Badges coloridos exibidos corretamente para cada status.
- [ ] Filtro por status funciona (exibe apenas pedidos com status selecionado).
- [ ] Filtro por período funciona (date_from / date_to).
- [ ] Filtros são cumulativos (status + período combinados).
- [ ] Histórico vazio exibe mensagem + link para catálogo.
- [ ] Filtro sem resultado exibe "Nenhum pedido encontrado com os filtros selecionados."
- [ ] Clique em pedido navega para detalhe com informações completas.
- [ ] Detalhe de pedido rejeitado mostra motivo da rejeição.
- [ ] Detalhe de pedido concluído mostra data de conclusão.
- [ ] Paginação funciona (11 pedidos → página 1 com 10 + controle para página 2).
- [ ] Responsivo em mobile (≥ 320px).

## Dependencies

- **Requires**: TASK-BACKEND-007 (endpoints com filtros e detalhe), TASK-FRONTEND-004 (service base).
- **Blocks**: Nenhum.
