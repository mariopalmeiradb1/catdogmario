# TASK-FRONTEND-002 — Listagem de Pedidos de Adoção para Voluntários

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-002-volunteer-requests-list-frontend`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_001_envio_pedido_adocao/spec_context.md`
**Part**: 1 of 1 — Frontend (Voluntário: Listagem + Detalhe)
**Generated**: `2026-06-02`

---

## Context

Criar a listagem de pedidos de adoção para voluntários e admins da ONG, com filtros por status e por animal. Também criar a página de detalhes do pedido que exibe informações do adotante, do animal e o histórico do pedido. A listagem deve ser acessível pelo menu da ONG e também via link na página de detalhes do animal.
API disponível via TASK-BACKEND-001.

---

## Scope

**In:**
- Métodos adicionais no service `adoption-requests.service.ts` para listagem e detalhe (voluntário)
- Tipos adicionais em `adoption-requests.types.ts` para listagem de voluntário
- Hook `useVolunteerRequests` para listagem
- Nova página `AdoptionRequestListPage` — listagem de pedidos da ONG
- Nova página `AdoptionRequestDetailPage` — detalhes de um pedido
- Rotas `/ong/adoption-requests` e `/ong/adoption-requests/:id`
- Link no menu/sidebar da ONG
- Link na `AnimalDetailPage` para ver pedidos do animal
- Testes de componente

**Out:**
- Botão "Solicitar Adoção" no catálogo (TASK-FRONTEND-001)
- Ações de aprovação/rejeição (TASK-FRONTEND-003 — os botões serão adicionados nessa task)
- Backend (TASK-BACKEND-001)
- Área do adotante (TASK-FRONTEND-001)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/services/adoption-requests.service.ts` | métodos list e detail |
| `modify` | `src/types/adoption-requests.types.ts` | tipos voluntário |
| `create` | `src/hooks/useVolunteerRequests.ts` | hook listagem voluntário |
| `create` | `src/pages/ong/AdoptionRequestListPage.tsx` | página listagem pedidos |
| `create` | `src/pages/ong/AdoptionRequestDetailPage.tsx` | página detalhe pedido |
| `modify` | `src/routes/index.tsx` | rotas /ong/adoption-requests |
| `modify` | `src/components/layouts/OngLayout.tsx` | link menu pedidos |
| `modify` | `src/pages/ong/AnimalDetailPage.tsx` | link pedidos do animal |
| `create` | `tests/components/AdoptionRequestListPage.spec.tsx` | testes listagem |
| `create` | `tests/components/AdoptionRequestDetailPage.spec.tsx` | testes detalhe |

---

## Implementation

### `adoption-requests.service.ts` *(modify)*
**Reference pattern**: arquivo criado na TASK-FRONTEND-001
**Novos métodos**:
- `list(filters?: VolunteerRequestFilters): Promise<VolunteerRequestListResponse>` — GET `/` com params
- `findById(id: string): Promise<AdoptionRequestDetail>` — GET `/${id}`

### `adoption-requests.types.ts` *(modify)*
**Novos tipos**:
- `VolunteerRequestFilters`: `{ status?: AdoptionRequestStatus | 'all'; animal_id?: string; page?: number; limit?: number }`
- `VolunteerRequestListItem`: `{ id: string; animal_name: string; animal_species: string; adopter_name: string; status: AdoptionRequestStatus; created_at: string }`
- `VolunteerRequestListResponse`: `{ data: VolunteerRequestListItem[]; pagination: { page: number; limit: number; total: number } }`
- `AdoptionRequestDetail`: `{ id: string; animal_id: string; animal_name: string; animal_species: string; animal_breed: string; adopter_id: string; adopter_name: string; adopter_email: string; ong_id: string; status: AdoptionRequestStatus; rejection_reason: string | null; cancelled_by: string | null; cancellation_reason: string | null; created_at: string; updated_at: string }`

### `useVolunteerRequests.ts` *(create)*
**Reference pattern**: `src/hooks/useCatalog.ts` (para pattern de fetching), porém sem infinite scroll
**Diferenças do reference**:
- State: `data: VolunteerRequestListItem[]`, `loading`, `error`, `filters: VolunteerRequestFilters`, `total`
- Fetch: `adoptionRequestsService.list(filters)`
- Paginação via Ant Design Table (não infinite scroll)
- Expõe `setFilters`, `fetchRequests`

### `AdoptionRequestListPage.tsx` *(create)*
**Reference pattern**: `src/pages/ong/AnimalListPage.tsx`
**Diferenças do reference**:
- Título: "Pedidos de Adoção"
- Filtros: `Select` de status (Todos, Pendente, Em Análise, Aprovado, Rejeitado, Cancelado, Concluído) — sem filtro de espécie/busca por nome
- Suporta query param `?animal_id=X` via `useSearchParams` — quando presente, filtra por animal e exibe banner informativo "Mostrando pedidos do animal: {nome}"
- Colunas da tabela: Adotante (nome), Animal (nome + espécie), Status (Tag colorida), Data do Pedido, Ações
- Status colors: `pending: 'orange'`, `in_review: 'blue'`, `approved: 'green'`, `rejected: 'red'`, `cancelled: 'default'`, `completed: 'purple'`
- Status labels em PT-BR
- Coluna Ações: botão `EyeOutlined` que navega para `/ong/adoption-requests/:id`
- Paginação padrão do Table

### `AdoptionRequestDetailPage.tsx` *(create)*
**Reference pattern**: `src/pages/ong/AnimalDetailPage.tsx`
**Diferenças do reference**:
- Título: "Detalhes do Pedido de Adoção"
- Busca pedido via `adoptionRequestsService.findById(id)` com `useEffect` no mount
- Layout com `Descriptions` (antd):
  - Seção "Informações do Pedido": Status (Tag colorida), Data do Pedido, Última Atualização
  - Seção "Animal": Nome (link para `/ong/animals/:animal_id`), Espécie, Raça
  - Seção "Adotante": Nome, E-mail
  - Se `rejection_reason` presente: `Alert` type `error` com título "Motivo da Rejeição" e description `rejection_reason`
  - Se `cancelled_by === 'system'`: `Alert` type `info` com mensagem explicativa
  - Se `cancelled_by === 'adopter'`: `Alert` type `warning` com "Cancelado pelo adotante"
- Botão "Voltar" que retorna para `/ong/adoption-requests`
- **Não incluir** botões de aprovação/rejeição aqui — serão adicionados na TASK-FRONTEND-003

### `routes/index.tsx` *(modify)*
**Alteração**: Dentro do bloco `{/* Private: ONG - ong_volunteer and ong_admin */}` → `<OngLayout>`, adicionar:
```tsx
<Route path="/ong/adoption-requests" element={<AdoptionRequestListPage />} />
<Route path="/ong/adoption-requests/:id" element={<AdoptionRequestDetailPage />} />
```

### `OngLayout.tsx` *(modify)*
**Reference pattern**: menu existente no `OngLayout`
**Alteração**: Adicionar item de menu com label "Pedidos de Adoção", ícone `SolutionOutlined`, link `/ong/adoption-requests` — posicionar após "Animais"

### `AnimalDetailPage.tsx` *(modify)*
**Alteração**: Adicionar botão/link "Ver Pedidos de Adoção" que navega para `/ong/adoption-requests?animal_id={animalId}`. Posicionar na seção de ações ou como botão secundário na página de detalhes do animal. Usar `Button` com ícone `FileSearchOutlined`.

### Testes *(create)*
**Reference pattern**: `tests/components/AnimalDetailModal.spec.tsx`
**AdoptionRequestListPage.spec.tsx**:
- Renderiza tabela com pedidos mockados
- Filtro de status funciona
- Query param `animal_id` aplica filtro e exibe banner
- Botão de visualização navega para detalhe
- Estado de loading

**AdoptionRequestDetailPage.spec.tsx**:
- Renderiza informações do pedido
- Exibe motivo de rejeição quando presente
- Exibe alerta de cancelamento por sistema
- Link do animal navega para detalhes do animal
- Botão voltar navega para listagem

---

## Acceptance Criteria

- [ ] **Given** voluntário autenticado, **When** navega para `/ong/adoption-requests`, **Then** tabela exibe pedidos da ONG com colunas Adotante, Animal, Status, Data, Ações
- [ ] **Given** voluntário, **When** seleciona filtro de status "Pendente", **Then** tabela mostra apenas pedidos pendentes
- [ ] **Given** voluntário na página de detalhes do animal, **When** clica "Ver Pedidos de Adoção", **Then** navega para `/ong/adoption-requests?animal_id=X` com lista filtrada
- [ ] **Given** voluntário, **When** clica no ícone de visualização de um pedido, **Then** navega para `/ong/adoption-requests/:id`
- [ ] **Given** voluntário na página de detalhe do pedido, **When** carrega, **Then** exibe dados do adotante, animal e status do pedido
- [ ] **Given** pedido rejeitado com `rejection_reason`, **When** visualiza detalhe, **Then** alerta com motivo da rejeição é exibido
- [ ] **Given** pedido cancelado por sistema, **When** visualiza detalhe, **Then** alerta informativo é exibido
- [ ] Menu da ONG contém link "Pedidos de Adoção" apontando para `/ong/adoption-requests`

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (endpoints de listagem e detalhe), TASK-FRONTEND-001 (service e types base)
- **Blocks**: TASK-FRONTEND-003 (botões de aprovação/rejeição serão adicionados à página de detalhe)