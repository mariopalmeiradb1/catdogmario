# TASK-FRONTEND-003 — Aprovação e Rejeição de Pedidos (UI Voluntário)

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-003-approve-reject-frontend`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_002_aprovacao_rejeicao_pedidos/spec_context.md`
**Part**: 2 of 2 — Frontend
**Generated**: `2026-06-02`

---

## Context

Adicionar ações de aprovação, rejeição e início de análise na página de detalhes do pedido de adoção (`AdoptionRequestDetailPage`), criada na TASK-FRONTEND-002. O voluntário pode aprovar diretamente, rejeitar com justificativa obrigatória (modal), ou iniciar análise. API disponível via TASK-BACKEND-002.

---

## Scope

**In:**
- Métodos `approve`, `reject`, `startReview` no service `adoption-requests.service.ts`
- Botões de ação na `AdoptionRequestDetailPage`
- Modal de rejeição com campo de justificativa (textarea, min 10 chars)
- Feedback visual (message.success/error) e atualização do pedido após ação
- Testes de componente

**Out:**
- Listagem de pedidos (TASK-FRONTEND-002)
- Envio de pedido e cancelamento (TASK-FRONTEND-001)
- Backend (TASK-BACKEND-002)
- Notificações ao adotante (fora do escopo)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/services/adoption-requests.service.ts` | métodos approve/reject/startReview |
| `create` | `src/components/adoption-management/RejectRequestModal.tsx` | modal rejeição |
| `modify` | `src/pages/ong/AdoptionRequestDetailPage.tsx` | botões de ação |
| `create` | `tests/components/AdoptionRequestDetailPage.actions.spec.tsx` | testes ações |
| `create` | `tests/components/RejectRequestModal.spec.tsx` | testes modal |

---

## Implementation

### `adoption-requests.service.ts` *(modify)*
**Novos métodos**:
- `startReview(id: string): Promise<void>` — PATCH `/${id}/start-review`
- `approve(id: string): Promise<void>` — PATCH `/${id}/approve`
- `reject(id: string, rejectionReason: string): Promise<void>` — PATCH `/${id}/reject` com body `{ rejection_reason: rejectionReason }`

### `RejectRequestModal.tsx` *(create)*
**Reference pattern**: padrão de modal do projeto (ex: confirmação de cancelamento em `AnimalDetailModal`)
**Props**: `{ open: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void>; loading: boolean }`
**Comportamento**:
- `Modal` do antd com título "Rejeitar Pedido de Adoção"
- `Input.TextArea` com placeholder "Informe o motivo da rejeição..." e `maxLength={1000}`
- Validação client-side: mínimo 10 caracteres — botão "Rejeitar" desabilitado se < 10 chars
- Mensagem helper abaixo do textarea: "Mínimo de 10 caracteres. O motivo será visível para o adotante."
- Botão "Cancelar" fecha modal sem ação
- Botão "Rejeitar" (type `danger`) chama `onConfirm(reason)` — loading state
- Ao fechar, limpa o campo de texto

### `AdoptionRequestDetailPage.tsx` *(modify)*
**Alterações**:
- Importar `adoptionRequestsService`, `RejectRequestModal`, `message`, `Modal` (antd), `Popconfirm`
- Adicionar estados: `actionLoading: boolean`, `rejectModalOpen: boolean`
- Seção de ações (renderizada apenas quando status permite ação):
  - Status `pending`:
    - Botão "Iniciar Análise" (tipo `default`) — `Popconfirm` com "Deseja iniciar a análise deste pedido?" → chama `adoptionRequestsService.startReview(id)` → `message.success('Pedido movido para análise.')` → re-fetch detalhes
    - Botão "Aprovar" (tipo `primary`, cor verde) — `Popconfirm` com "Deseja aprovar este pedido?" → chama `adoptionRequestsService.approve(id)` → `message.success('Pedido aprovado.')` → re-fetch
    - Botão "Rejeitar" (tipo `default`, cor danger) — abre `RejectRequestModal`
  - Status `in_review`:
    - Botão "Aprovar" + Botão "Rejeitar" (mesma lógica acima)
  - Demais status: nenhum botão de ação
- Callback do `RejectRequestModal.onConfirm`: chama `adoptionRequestsService.reject(id, reason)` → `message.success('Pedido rejeitado.')` → fecha modal → re-fetch
- Erro em qualquer ação: `message.error('Erro ao processar ação. Tente novamente.')`
- Todos os botões mostram loading durante a chamada API

### `AdoptionRequestDetailPage.actions.spec.tsx` *(create)*
**Reference pattern**: `tests/components/AnimalDetailModal.spec.tsx`
**Cenários**:
- Pedido `pending` → exibe 3 botões (Iniciar Análise, Aprovar, Rejeitar)
- Pedido `in_review` → exibe 2 botões (Aprovar, Rejeitar) — sem "Iniciar Análise"
- Pedido `approved` → nenhum botão de ação renderizado
- Pedido `rejected` → nenhum botão de ação renderizado
- Clique em Aprovar + confirmar → chama service.approve, exibe success
- Clique em Rejeitar → abre modal

### `RejectRequestModal.spec.tsx` *(create)*
**Cenários**:
- Modal aberto → textarea vazio, botão Rejeitar desabilitado
- Digitar < 10 chars → botão continua desabilitado
- Digitar ≥ 10 chars → botão habilitado
- Clicar Rejeitar → chama onConfirm com o texto
- Clicar Cancelar → chama onClose, textarea limpo
- Loading → botão mostra spinner

---

## Acceptance Criteria

- [ ] **Given** voluntário na página de detalhe de pedido `pending`, **When** renderiza, **Then** exibe botões "Iniciar Análise", "Aprovar" e "Rejeitar"
- [ ] **Given** voluntário e pedido `in_review`, **When** renderiza, **Then** exibe apenas "Aprovar" e "Rejeitar"
- [ ] **Given** voluntário e pedido `approved`/`rejected`/`cancelled`, **When** renderiza, **Then** nenhum botão de ação no DOM
- [ ] **Given** voluntário clica "Aprovar" e confirma no Popconfirm, **When** API retorna sucesso, **Then** `message.success('Pedido aprovado.')` e página atualiza com novo status
- [ ] **Given** voluntário clica "Rejeitar", **When** modal abre, **Then** textarea vazio e botão "Rejeitar" desabilitado
- [ ] **Given** voluntário digita justificativa com ≥10 chars e clica "Rejeitar", **When** API retorna sucesso, **Then** `message.success('Pedido rejeitado.')`, modal fecha, página atualiza
- [ ] **Given** voluntário digita justificativa com <10 chars, **When** observa botão, **Then** botão "Rejeitar" permanece desabilitado
- [ ] **Given** voluntário clica "Iniciar Análise" e confirma, **When** API retorna sucesso, **Then** `message.success('Pedido movido para análise.')` e página atualiza
- [ ] **Given** qualquer ação com erro da API, **When** falha, **Then** `message.error(...)` e estado anterior preservado

---

## Dependencies

- **Requires**: TASK-BACKEND-002 (endpoints approve, reject, start-review), TASK-FRONTEND-002 (página de detalhe do pedido)
- **Blocks**: Nenhuma