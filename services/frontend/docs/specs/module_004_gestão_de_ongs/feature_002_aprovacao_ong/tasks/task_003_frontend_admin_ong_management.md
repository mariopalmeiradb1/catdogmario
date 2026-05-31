# TASK-FRONTEND-003 — Frontend Admin ONG Management Pages

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-003-frontend-admin-ong-management`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_002_aprovacao_ong/spec_context.md`
**Part**: 5 of 5 — Admin frontend (aprovação + detalhes + desativação)
**Generated**: 2026-05-31

---

## Context

Implementa as páginas do painel administrativo para gestão de ONGs: reescreve a OngListPage com listagem real (filtros, paginação, status badge), cria OngDetailPage com ações (aprovar, rejeitar, marcar em análise, desativar, reativar) e OngEditPage para edição pelo Admin do Sistema. Usa Ant Design (já instalado) como UI library.
Ver specs: feature_002 (aprovação), feature_003 (edição admin), feature_004 (desativação).

---

## Scope

**In:**
- Reescrever `OngListPage.tsx` com Table, filtros e paginação reais
- Criar `OngDetailPage.tsx` com visualização e botões de ação por status
- Criar `OngEditPage.tsx` para edição pelo Admin do Sistema
- Criar componentes: `OngStatusBadge`, `RejectModal`, `DeactivateConfirmModal`, `OngFilters`
- Criar service `ong-management.service.ts` com chamadas à API
- Criar types `ong-management.types.ts`
- Criar hooks `useOngList.ts` e `useOngDetail.ts`
- Registrar rotas `/admin/ongs/:id` e `/admin/ongs/:id/edit`

**Out:**
- Não implementar tela de edição pela ONG (TASK-FRONTEND-004)
- Não implementar upload de fotos
- Não implementar testes de componentes nesta task

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/types/ong-management.types.ts` | tipos compartilhados |
| `create` | `src/services/ong-management.service.ts` | chamadas API |
| `create` | `src/hooks/useOngList.ts` | state listagem + filtros |
| `create` | `src/hooks/useOngDetail.ts` | fetch + ações ONG |
| `create` | `src/components/ong-management/OngStatusBadge.tsx` | badge colorido por status |
| `create` | `src/components/ong-management/OngFilters.tsx` | barra de filtros |
| `create` | `src/components/ong-management/RejectModal.tsx` | modal rejeição + motivo |
| `create` | `src/components/ong-management/DeactivateConfirmModal.tsx` | modal confirmação desativação |
| `modify` | `src/pages/admin/OngListPage.tsx` | reescrever com dados reais |
| `create` | `src/pages/admin/OngDetailPage.tsx` | detalhes + ações |
| `create` | `src/pages/admin/OngEditPage.tsx` | edição admin |
| `modify` | `src/routes/index.tsx` | novas rotas admin |

---

## Implementation

### `ong-management.types.ts` *(create)*

**Reference pattern**: `src/types/catalog.types.ts`
**Differences from reference**:
- `OngStatus = 'pending' | 'approved' | 'rejected' | 'inactive' | 'in_review'`
- `OngListItem`: { id, name, cnpj, city, state, status: OngStatus, created_at }
- `OngDetail`: extends OngListItem + { phone, address, description, mission, capacity, instagram, facebook, whatsapp, rejected_at, deactivated_at, updated_at }
- `OngListFilters`: { status?, state?, city?, dateFrom?, dateTo?, page, limit }
- `PaginatedResponse<T>`: { data: T[], total: number, page: number, limit: number }

### `ong-management.service.ts` *(create)*

**Reference pattern**: `src/services/catalog.service.ts`
**Differences from reference**:
- Base URL: `/api/v1/ong-management`
- Métodos: `list(filters)`, `getDetail(id)`, `markInReview(id)`, `approve(id)`, `reject(id, reason?)`, `update(id, data)`, `deactivate(id)`, `reactivate(id)`
- Todos incluem header Authorization com token do auth context
- Métodos PATCH para ações de status, PUT para edição

### `useOngList.ts` *(create)*

**Reference pattern**: `src/hooks/useCatalog.ts`
**Differences from reference**:
- State: `ongs`, `total`, `loading`, `filters` (OngListFilters), `error`
- Funções expostas: `setFilters`, `fetchOngs`, `handlePageChange`
- UseEffect: refetch quando filters mudam
- Retorna objeto com { ongs, total, loading, error, filters, setFilters, handlePageChange }

### `useOngDetail.ts` *(create)*

**Reference pattern**: nenhum direto — hook simples com fetch + actions
**Differences from reference**:
- Params: `ongId: string`
- State: `ong: OngDetail | null`, `loading`, `error`, `actionLoading`
- Funções expostas: `markInReview()`, `approve()`, `reject(reason?)`, `deactivate()`, `reactivate()`, `refetch()`
- Cada action: set actionLoading=true, call service, refetch, show message.success ou message.error (Ant Design)
- Retorna { ong, loading, error, actionLoading, markInReview, approve, reject, deactivate, reactivate, refetch }

### `OngStatusBadge.tsx` *(create)*

**Reference pattern**: nenhum existente — componente simples
**Differences from reference**:
- Props: `status: OngStatus`
- Renderiza `<Tag color={colorMap[status]}>{labelMap[status]}</Tag>` (Ant Design Tag)
- Mapeamento de cores: pending='orange', in_review='blue', approved='green', rejected='red', inactive='default'
- Mapeamento de labels: pending='Pendente', in_review='Em Análise', approved='Aprovada', rejected='Rejeitada', inactive='Inativa'

### `OngFilters.tsx` *(create)*

**Reference pattern**: nenhum direto — usar componentes Ant Design (Select, DatePicker, Input)
**Differences from reference**:
- Props: `filters: OngListFilters`, `onFiltersChange: (filters: OngListFilters) => void`
- Layout: Row com Cols — Select para status, Input para cidade, Select para estado (lista UFs), RangePicker para período
- Estados brasileiros como constante dentro do componente (array de 27 UFs)

### `RejectModal.tsx` *(create)*

**Reference pattern**: nenhum — usar Ant Design Modal + Input.TextArea
**Differences from reference**:
- Props: `open: boolean`, `onConfirm: (reason?: string) => void`, `onCancel: () => void`, `loading: boolean`
- State interno: `reason` (string, max 500 chars)
- Input.TextArea com maxLength=500 e showCount
- Botão confirmar: "Rejeitar ONG", danger style
- Ao fechar: limpar o campo reason

### `DeactivateConfirmModal.tsx` *(create)*

**Reference pattern**: similar ao RejectModal mas sem campo texto
**Differences from reference**:
- Props: `open: boolean`, `onConfirm: () => void`, `onCancel: () => void`, `loading: boolean`
- Mensagem: "Tem certeza que deseja desativar esta ONG? Esta ação bloqueará o acesso de todos os usuários vinculados."
- Botão confirmar: "Desativar ONG", danger style

### `OngListPage.tsx` *(modify — reescrever)*

**Reference pattern**: `src/pages/public/CatalogPage.tsx` (padrão de página com listagem)
**Differences from reference**:
- Usar `useOngList` hook
- Layout: Title + OngFilters no topo + Table (Ant Design) com colunas: Nome, CNPJ, Cidade/UF, Data Cadastro (formatada), Status (OngStatusBadge)
- Paginação no footer da Table (Ant Design Table tem paginação built-in)
- Cada linha clicável → navega para `/admin/ongs/${id}`
- Colunas ordenáveis: Data Cadastro (default ASC)

### `OngDetailPage.tsx` *(create)*

**Reference pattern**: nenhum direto — página de detalhe com Ant Design Descriptions + botões
**Differences from reference**:
- Usa `useOngDetail(id)` com id de `useParams()`
- Layout: Breadcrumb → Title com OngStatusBadge → Descriptions (Ant Design) com todos campos → Bloco de ações
- Botões de ação visíveis conforme status:
  - pending: "Marcar Em Análise" (primary), "Aprovar" (success), "Rejeitar" (danger)
  - in_review: "Aprovar" (success), "Rejeitar" (danger) — "Marcar Em Análise" desabilitado
  - approved: "Editar Dados" (link para /edit), "Desativar ONG" (danger)
  - inactive: "Reativar ONG" (primary), dados em readonly com data de desativação
  - rejected: nenhum botão de ação (somente visualização)
- Integra RejectModal e DeactivateConfirmModal

### `OngEditPage.tsx` *(create)*

**Reference pattern**: `src/pages/auth/RegisterOngPage.tsx` (formulário com validação)
**Differences from reference**:
- Usa `useParams()` para obter id, fetch ONG detail como initialValues
- Form Ant Design com todos os campos (incluindo name e cnpj editáveis para system_admin)
- Validações no formulário: mesmas regras do backend (description min 50, capacity >= 1, etc.)
- Botão "Salvar Alterações" — chama `ongManagementService.update(id, values)`
- Botão "Cancelar" — navigate back
- Após sucesso: message.success + navigate to detail page

### `routes/index.tsx` *(modify)*

**Changes**:
- Adicionar imports: `OngDetailPage`, `OngEditPage`
- Dentro do bloco `{/* Private: Admin */}`, após `<Route path="/admin/ongs" ...>`:
  - `<Route path="/admin/ongs/:id" element={<OngDetailPage />} />`
  - `<Route path="/admin/ongs/:id/edit" element={<OngEditPage />} />`

---

## Acceptance Criteria

- [ ] **Given** admin logado acessa /admin/ongs, **When** página carrega, **Then** listagem exibe ONGs pendentes/em análise com filtros funcionais e paginação.
- [ ] **Given** nenhuma ONG pendente, **When** página carrega, **Then** exibe mensagem "Não há solicitações de cadastro pendentes no momento."
- [ ] **Given** admin clica em uma ONG na listagem, **When** navega para detalhe, **Then** todos os dados cadastrais são exibidos com botões de ação corretos para o status.
- [ ] **Given** ONG com status 'pending', **When** admin clica "Aprovar", **Then** ação executada, mensagem de sucesso, status badge atualiza para 'Aprovada'.
- [ ] **Given** ONG com status 'pending', **When** admin clica "Rejeitar", **Then** modal abre com campo motivo opcional (max 500 chars) e botão de confirmação.
- [ ] **Given** modal de rejeição aberto, **When** admin confirma sem motivo, **Then** rejeição processada, modal fecha, status atualiza.
- [ ] **Given** ONG aprovada, **When** admin clica "Desativar ONG", **Then** modal de confirmação exibe mensagem de impacto e botão danger.
- [ ] **Given** ONG inativa, **When** admin clica "Reativar ONG", **Then** status muda para 'Aprovada', mensagem de sucesso exibida.
- [ ] **Given** admin acessa /admin/ongs/:id/edit, **When** página carrega, **Then** formulário pré-preenchido com dados atuais, todos campos editáveis.
- [ ] **Given** admin edita e salva com dados válidos, **When** API retorna sucesso, **Then** message.success + redirect para detail page.
- [ ] **Given** API retorna erro de concorrência (409), **When** admin tenta ação, **Then** message.error com texto de conflito e dados recarregam.
- [ ] `adopter` ou `ong_admin` — rotas /admin/* não acessíveis (RoleRoute bloqueia).

---

## Dependencies

- **Requires**: TASK-BACKEND-002 (approval endpoints), TASK-BACKEND-003 (edit endpoint), TASK-BACKEND-004 (deactivate/reactivate endpoints)
- **Blocks**: Nenhuma
