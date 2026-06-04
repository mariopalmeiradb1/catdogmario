# TASK-FULL-005 — Timeline de Acompanhamento e Ajustes Finais

**Root**: `catdogmario/services/backend/` e `catdogmario/services/frontend/`
**Branch**: `feature/TASK-FULL-005-timeline-history`
**Spec**: `.makuco/specs/module_009_acompanhamento_pós_adoção/feature_002_registro_contato/spec_context.md`
**Part**: 5 of 5 — Histórico e timeline
**Generated**: `2026-06-03`

---

## Context

Implementa a visualização do histórico completo de acompanhamento de uma adoção em formato timeline cronológica, alerta visual de padrão "sem resposta" consecutivo, e link de acesso a partir do detalhe do pedido de adoção. Fecha o ciclo das duas features (FEATURE-001 e FEATURE-002) com a visão consolidada.

---

## Scope

**In:**
- Endpoint GET `/follow-up/adoptions/:adoptionRequestId/timeline` no backend
- Método `getAdoptionTimeline()` no service
- Página `FollowUpTimelinePage.tsx` no frontend com Ant Design Timeline
- Hook `useFollowUpTimeline.ts`
- Rota frontend `/ong/follow-up/timeline/:adoptionRequestId`
- Link na `AdoptionRequestDetailPage` para a timeline (se adoção completed)
- Alerta visual de padrão "2+ sem resposta consecutivos" do mesmo tutor
- Indicação de "Acompanhamento Completo" quando 3 contatos positivos
- Testes de integração do endpoint

**Out:**
- Não criar exportação (PDF, CSV)
- Não criar dashboard ou relatórios consolidados
- Não modificar a listagem de lembretes (TASK-002) nem o registro de contato (TASK-004)
- Não implementar navegação entre timelines de diferentes adoções

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `services/backend/src/domains/follow-up/follow-up.service.ts` | getAdoptionTimeline |
| `modify` | `services/backend/src/domains/follow-up/follow-up.repository.ts` | query timeline |
| `modify` | `services/backend/src/domains/follow-up/follow-up.routes.ts` | endpoint timeline |
| `modify` | `services/backend/src/domains/follow-up/follow-up.controller.ts` | handler timeline |
| `modify` | `services/backend/src/domains/follow-up/follow-up.validator.ts` | schema param |
| `modify` | `services/backend/src/domains/follow-up/follow-up.types.ts` | interface timeline |
| `create` | `services/frontend/src/pages/ong/FollowUpTimelinePage.tsx` | página timeline |
| `create` | `services/frontend/src/hooks/useFollowUpTimeline.ts` | fetch timeline |
| `modify` | `services/frontend/src/services/follow-up.service.ts` | método timeline |
| `modify` | `services/frontend/src/routes/index.tsx` | rota timeline |
| `modify` | `services/frontend/src/pages/ong/AdoptionRequestDetailPage.tsx` | link para timeline |
| `create` | `services/backend/tests/integration/follow-up.timeline.spec.ts` | testes integração |

---

## Implementation

### `follow-up.types.ts` *(modify — adicionar interface)*

**Adicionar**:
```typescript
interface TimelineEntry {
  reminder_id: string;
  reminder_number: number; // 1, 2, 3
  due_date: string;
  reminder_status: ReminderStatus;
  contact?: {
    id: string;
    contact_date: string;
    status: ContactStatus;
    observation: string;
    registered_by_name: string;
    created_at: string;
  } | null;
}

interface AdoptionTimeline {
  adoption_request_id: string;
  animal_name: string;
  adopter_name: string;
  adopter_phone: string | null;
  adopter_email: string;
  adoption_date: string;
  is_complete: boolean; // true se 3 lembretes completed
  has_no_response_pattern: boolean; // true se 2+ consecutivos no_response
  entries: TimelineEntry[];
}
```

### `follow-up.repository.ts` *(modify — adicionar método)*

**Novo método `getTimelineByAdoption(adoptionRequestId: string, ongId: string)`**:
- Query `follow_up_reminders` LEFT JOIN `follow_up_contacts` ON `follow_up_contacts.reminder_id = follow_up_reminders.id`
- JOIN `users` (registered_by) para nome de quem registrou
- WHERE `adoption_request_id` AND `ong_id`
- ORDER BY `reminder_number ASC`
- Também buscar dados da adoção: animal_name, adopter_name, adopter_phone, adopter_email, adoption_date (da tabela adoption_requests + joins)

### `follow-up.service.ts` *(modify — adicionar método)*

**Método `getAdoptionTimeline(adoptionRequestId: string, ongId: string)`**:
1. Buscar via repository `getTimelineByAdoption()`
2. Se nenhum lembrete encontrado, throw `ReminderNotFoundError` (a adoção não tem lembretes ou não pertence à ONG)
3. Calcular `is_complete`: todos 3 lembretes com status `completed`
4. Calcular `has_no_response_pattern`: 2+ contatos consecutivos (por reminder_number) com status `no_response`
5. Retornar `AdoptionTimeline`

### `follow-up.routes.ts` *(modify)*

**Adicionar**:
- `GET /adoptions/:adoptionRequestId/timeline` → authenticate + authorize(['ong_admin', 'ong_volunteer']) + validate(adoptionRequestIdSchema, 'params') → controller.getTimeline

### `follow-up.controller.ts` *(modify)*

**Adicionar** método `getTimeline`:
- Extrai `req.params.adoptionRequestId`, `req.user!.ongId`
- Response: `200 { data: AdoptionTimeline }`

### `follow-up.service.ts` (frontend) *(modify)*

**Adicionar método**:
- `getTimeline(adoptionRequestId: string)` → GET `/adoptions/${adoptionRequestId}/timeline`

### `useFollowUpTimeline.ts` *(create)*

**Reference pattern**: `src/hooks/useAdopterRequests.ts`
**Differences from reference**:
- Recebe `adoptionRequestId` como parâmetro
- Fetch único on-mount (sem filtros/paginação)
- Estado: `timeline: AdoptionTimeline | null`, `loading`, `error`
- Não precisa de refetch automático

### `FollowUpTimelinePage.tsx` *(create)*

**Especificação** (sem referência direta):
- Recebe `adoptionRequestId` via `useParams()`
- Header com dados da adoção: nome do animal, tutor, telefone, e-mail, data de adoção
- Se `is_complete`: `<Alert type="success" message="Acompanhamento Completo" />` com ícone ✓
- Se `has_no_response_pattern`: `<Alert type="warning" message="Padrão de não-resposta detectado" />`
- Ant Design `<Timeline>` com 3 items (um por marco):
  - Timeline.Item `color` baseado no status:
    - `completed` + contato positivo → `green`
    - `completed` + contato negativo/no_response → `orange`/`red`
    - `pending` → `blue`
    - `overdue` → `red`
    - `cancelled` → `gray`
  - Conteúdo de cada item:
    - Título: "Marco {N} — {due_date formatada}" + Tag de status
    - Se tem contato: card com data do contato, status (Tag colorida), observação, "Registrado por {nome}"
    - Se não tem contato e pendente/overdue: texto "Aguardando contato" ou "Atrasado — {dias} dias"
- Botão "Voltar" → navega para `/ong/adoption-requests/:id` ou história do browser

### Rota frontend *(modify `routes/index.tsx`)*

**Adicionar** dentro do RoleRoute de `['ong_admin', 'ong_volunteer']`:
- `<Route path="/ong/follow-up/timeline/:adoptionRequestId" element={<FollowUpTimelinePage />} />`

### `AdoptionRequestDetailPage.tsx` *(modify)*

**Adicionar**:
- Condição: se `request.status === 'completed'`, exibir botão/link "Ver Acompanhamento"
- Link navega para `/ong/follow-up/timeline/${request.id}`
- Posicionar abaixo das informações do pedido, antes da seção de visitas (se existir)

---

## Acceptance Criteria

- [ ] **Given** adoção completed com 3 lembretes (2 completed, 1 pending), **When** GET `/api/v1/follow-up/adoptions/:id/timeline`, **Then** retorna 3 entries ordenadas por reminder_number, com contatos nos 2 primeiros.
- [ ] **Given** adoção com 3 contatos `completed`, **When** timeline carregada, **Then** `is_complete = true`.
- [ ] **Given** 2 contatos consecutivos com status `no_response`, **When** timeline carregada, **Then** `has_no_response_pattern = true`.
- [ ] **Given** apenas 1 contato `no_response` (não consecutivo), **When** timeline, **Then** `has_no_response_pattern = false`.
- [ ] **Given** adoção de outra ONG, **When** voluntário de ONG-A acessa timeline, **Then** retorna 404.
- [ ] **Given** adoção sem lembretes (não completed), **When** acessa timeline, **Then** retorna 404.
- [ ] **Given** frontend no path `/ong/follow-up/timeline/:id`, **When** renderizado, **Then** exibe Timeline com 3 marcos, dados da adoção no header, e alerts quando aplicável.
- [ ] **Given** timeline com `is_complete = true`, **When** renderizada, **Then** Alert verde "Acompanhamento Completo" visível.
- [ ] **Given** timeline com `has_no_response_pattern = true`, **When** renderizada, **Then** Alert amarelo "Padrão de não-resposta detectado" visível.
- [ ] **Given** pedido de adoção com status `completed` no detalhe, **When** página renderizada, **Then** link/botão "Ver Acompanhamento" presente.
- [ ] **Given** pedido de adoção com status `pending`, **When** página renderizada, **Then** link "Ver Acompanhamento" NÃO presente no DOM.

---

## API Notes

- **GET** `/api/v1/follow-up/adoptions/:adoptionRequestId/timeline` — Response: `200 { data: AdoptionTimeline }`. Errors: `404` (adoção sem lembretes ou de outra ONG), `401`, `403`.

---

## Dependencies

- **Requires**: TASK-FULL-002 (domínio follow-up, repository base), TASK-FULL-004 (contatos registrados para visualização).
- **Blocks**: Nenhum — esta é a última task do módulo.
