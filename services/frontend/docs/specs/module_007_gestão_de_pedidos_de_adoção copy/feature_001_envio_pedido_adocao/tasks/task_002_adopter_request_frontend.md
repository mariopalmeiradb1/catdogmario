# TASK-FRONTEND-001 — Envio de Pedido de Adoção + Área do Adotante

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-001-adopter-request-frontend`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_001_envio_pedido_adocao/spec_context.md`
**Part**: 2 of 2 — Frontend (Adopter)
**Generated**: `2026-06-02`

---

## Context

Implementar o fluxo do adotante para pedidos de adoção: botão "Solicitar Adoção" funcional no modal de detalhes do catálogo, página de listagem dos pedidos do adotante, e ação de cancelamento. O botão atualmente existe mas está desabilitado (`disabled`) com tooltip "Em breve" no `AnimalDetailModal`. A API backend já estará disponível via TASK-BACKEND-001.

---

## Scope

**In:**
- Service `adoption-requests.service.ts` com métodos para criar pedido e listar pedidos do adotante
- Tipos `adoption-requests.types.ts`
- Hook `useAdopterRequests` para listagem de pedidos do adotante
- Ativar botão "Solicitar Adoção" no `AnimalDetailModal` para adotantes autenticados
- Nova página `AdopterRequestsPage` — listagem dos pedidos do adotante com filtro por status e ação de cancelamento
- Rota `/adopter/requests` no `routes/index.tsx`
- Link no layout/menu do adotante para "Meus Pedidos"
- Testes de componente

**Out:**
- Tela de cadastro/perfil do adotante (já existe via auth)
- Listagem de pedidos para voluntários (TASK-FRONTEND-002)
- Aprovação/rejeição (TASK-FRONTEND-003)
- Backend (TASK-BACKEND-001)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/services/adoption-requests.service.ts` | chamadas API pedidos |
| `create` | `src/types/adoption-requests.types.ts` | tipos do domínio |
| `create` | `src/hooks/useAdopterRequests.ts` | hook listagem adotante |
| `modify` | `src/components/catalog/AnimalDetailModal.tsx` | ativar botão solicitar |
| `create` | `src/pages/adopter/AdopterRequestsPage.tsx` | página meus pedidos |
| `modify` | `src/routes/index.tsx` | rota /adopter/requests |
| `modify` | `src/components/layouts/AdopterLayout.tsx` | link menu meus pedidos |
| `create` | `tests/components/AdopterRequestsPage.spec.tsx` | testes da página |
| `create` | `tests/components/AnimalDetailModal.adoption.spec.tsx` | testes botão solicitar |

---

## Implementation

### `adoption-requests.service.ts` *(create)*
**Reference pattern**: `src/services/animal-management.service.ts`
**Diferenças do reference**:
- `baseURL`: `${env.VITE_API_URL}/adoption-requests`
- Métodos:
  - `create(animalId: string): Promise<AdoptionRequestCreatedResponse>` — POST `/` com body `{ animal_id: animalId }`
  - `listMine(filters?: AdopterRequestFilters): Promise<AdopterRequestListResponse>` — GET `/mine` com params (esta rota será adicionada no backend — **alternativa**: usar GET `/` se o backend retornar pedidos do adotante quando role é `adopter`. Verificar no TASK-BACKEND-001 se existe endpoint separado; caso contrário, usar GET `/` que já retorna pedidos do adotante baseado no token)
  - `cancel(id: string): Promise<void>` — PATCH `/${id}/cancel`
- Interceptor de auth idêntico ao reference

**NOTA**: O TASK-BACKEND-001 define GET `/` apenas para voluntários. Para o adotante listar seus próprios pedidos, é necessário adicionar um endpoint `GET /api/v1/adoption-requests/mine` no backend **OU** ajustar o GET existente para servir ambos os roles. **Decisão**: Adicionar `GET /mine` ao TASK-BACKEND-001 (atualizar aquele task) ou criar inline aqui. Recomendação: modificar TASK-BACKEND-001 para incluir `GET /mine` com `authorize(['adopter'])` que chama `repository.listByAdopter(userId, filters)`.

### `adoption-requests.types.ts` *(create)*
**Reference pattern**: `src/types/animal-management.types.ts`
**Conteúdo**:
- `AdoptionRequestStatus`: `'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'completed'`
- `AdoptionRequestCreatedResponse`: `{ id: string; animal_id: string; status: AdoptionRequestStatus; created_at: string }`
- `AdopterRequestListItem`: `{ id: string; animal_name: string; animal_species: string; ong_name: string; status: AdoptionRequestStatus; rejection_reason: string | null; created_at: string }`
- `AdopterRequestFilters`: `{ status?: AdoptionRequestStatus | 'all'; page?: number; limit?: number }`
- `AdopterRequestListResponse`: `{ data: AdopterRequestListItem[]; pagination: { page: number; limit: number; total: number } }`

### `useAdopterRequests.ts` *(create)*
**Reference pattern**: `src/hooks/useCatalog.ts`
**Diferenças do reference**:
- State: `data: AdopterRequestListItem[]`, `loading`, `error`, `filters`, `total`
- Fetch: chama `adoptionRequestsService.listMine(filters)`
- Expõe `cancelRequest(id: string)` que chama `adoptionRequestsService.cancel(id)`, mostra `message.success('Pedido cancelado.')` e re-fetch
- Sem infinite scroll — paginação via `Table` do Ant Design (mesmo padrão de `AnimalListPage`)

### `AnimalDetailModal.tsx` *(modify)*
**Reference pattern**: componente `ModalFooter` no mesmo arquivo
**Alterações no `ModalFooter`**:
- Importar `useAuth` de `~/hooks/useAuth` e `adoptionRequestsService` de `~/services/adoption-requests.service`
- Importar `message` de `antd` e `useState` de `react`
- Props: adicionar `animalId: string`, `onRequestSent?: () => void`
- Quando `status === 'available'`:
  - Se usuário NÃO está logado: manter botão "Solicitar Adoção" mas redirecionar para `/login` ao clicar (usar `useNavigate`)
  - Se usuário está logado e `role === 'adopter'`: botão ativo que chama `adoptionRequestsService.create(animalId)`
    - Loading state no botão durante a chamada
    - Sucesso: `message.success('Pedido de adoção enviado com sucesso!')`, chamar `onRequestSent()`, fechar modal
    - Erro 409 (duplicado): `message.warning('Você já possui um pedido ativo para este animal.')`
    - Erro genérico: `message.error('Erro ao enviar pedido. Tente novamente.')`
  - Se usuário está logado mas NÃO é `adopter`: não mostrar botão (voluntários/admins não adotam pela plataforma)
- Remover `<Tooltip title="Em breve">` e `disabled` do botão para adotantes
- Manter o comportamento de `in_adoption_process` (alerta + botão "Entrar na fila de espera" desabilitado)

### `AdopterRequestsPage.tsx` *(create)*
**Reference pattern**: `src/pages/ong/AnimalListPage.tsx`
**Diferenças do reference**:
- Título: "Meus Pedidos de Adoção"
- Usa hook `useAdopterRequests` em vez de chamar service direto
- Filtro: apenas `Select` de status (Todos, Pendente, Em Análise, Aprovado, Rejeitado, Cancelado)
- Colunas da tabela: Animal (nome + espécie), ONG, Status (Tag colorida), Data do Pedido, Ações
- Status colors: `pending: 'orange'`, `in_review: 'blue'`, `approved: 'green'`, `rejected: 'red'`, `cancelled: 'default'`, `completed: 'purple'`
- Status labels em PT-BR: Pendente, Em Análise, Aprovado, Rejeitado, Cancelado, Concluído
- Coluna Ações: botão "Cancelar" (com `Popconfirm`) visível apenas para status `pending` ou `in_review`
- Se `rejection_reason` existe e status é `rejected`, exibir tooltip com motivo ao hover no status Tag
- Paginação padrão do Ant Design Table

### `routes/index.tsx` *(modify)*
**Alteração**: Dentro do bloco `{/* Private: Adopter */}` → `<AdopterLayout>`, adicionar:
```tsx
<Route path="/adopter/requests" element={<AdopterRequestsPage />} />
```
- Import: `import { AdopterRequestsPage } from '~/pages/adopter/AdopterRequestsPage';`

### `AdopterLayout.tsx` *(modify)*
**Reference pattern**: `src/components/layouts/OngLayout.tsx`
**Alteração**: Adicionar item de menu/sidebar com link para `/adopter/requests` com label "Meus Pedidos" e ícone `FileTextOutlined` do Ant Design

### `AdopterRequestsPage.spec.tsx` *(create)*
**Reference pattern**: `tests/components/AnimalDetailModal.spec.tsx`
**Cenários**:
- Renderiza tabela com pedidos mockados
- Mostra estados de loading
- Filtro de status filtra lista
- Botão "Cancelar" aparece para pedidos `pending` e `in_review`
- Botão "Cancelar" NÃO aparece para pedidos `approved`, `rejected`, `cancelled`
- Popconfirm exige confirmação antes de cancelar
- Tooltip com motivo de rejeição no status `rejected`

### `AnimalDetailModal.adoption.spec.tsx` *(create)*
**Reference pattern**: `tests/components/AnimalDetailModal.spec.tsx`
**Cenários**:
- Usuário não logado + animal disponível → botão "Solicitar Adoção" redireciona para login
- Adotante logado + animal disponível → botão habilitado, clique envia pedido
- Adotante logado + erro 409 → exibe warning de duplicidade
- Voluntário logado + animal disponível → botão não renderizado
- Animal em processo de adoção → exibe alerta, botão desabilitado (mantém comportamento atual)

---

## Acceptance Criteria

- [ ] **Given** adotante logado e animal disponível no catálogo, **When** clica "Solicitar Adoção", **Then** pedido é criado, `message.success` aparece e modal fecha
- [ ] **Given** adotante com pedido ativo para o animal, **When** clica "Solicitar Adoção", **Then** `message.warning` com "Você já possui um pedido ativo para este animal."
- [ ] **Given** usuário não logado e animal disponível, **When** clica "Solicitar Adoção", **Then** redirecionado para `/login`
- [ ] **Given** voluntário logado e animal disponível, **When** vê modal, **Then** botão "Solicitar Adoção" NÃO está no DOM
- [ ] **Given** adotante navega para `/adopter/requests`, **When** página carrega, **Then** tabela exibe pedidos do adotante com colunas Animal, ONG, Status, Data, Ações
- [ ] **Given** pedido com status `pending`, **When** adotante clica "Cancelar" e confirma, **Then** pedido muda para `cancelled` e tabela atualiza
- [ ] **Given** pedido com status `rejected` e `rejection_reason`, **When** hover no Tag de status, **Then** tooltip mostra motivo da rejeição
- [ ] **Given** pedido com status `approved`, **When** renderiza, **Then** botão "Cancelar" NÃO aparece
- [ ] Menu do adotante contém link "Meus Pedidos" apontando para `/adopter/requests`

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (endpoints de criação, listagem e cancelamento de pedidos). **NOTA**: verificar se TASK-BACKEND-001 inclui endpoint `GET /mine` para listagem do adotante — se não, ajustar TASK-BACKEND-001 antes de implementar esta task.
- **Blocks**: Nenhuma