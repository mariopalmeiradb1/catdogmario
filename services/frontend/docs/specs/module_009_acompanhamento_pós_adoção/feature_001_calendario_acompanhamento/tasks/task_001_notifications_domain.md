# TASK-FULL-001 — Domínio de Notificações In-App (Backend + Frontend)

**Root**: `catdogmario/services/backend/` e `catdogmario/services/frontend/`
**Branch**: `feature/TASK-FULL-001-notifications-domain`
**Spec**: `.makuco/specs/module_009_acompanhamento_pós_adoção/feature_001_calendario_acompanhamento/spec_context.md`
**Part**: 1 of 5 — Infraestrutura de notificações
**Generated**: `2026-06-03`

---

## Context

Cria o sistema de notificações in-app que será consumido pelo módulo de acompanhamento pós-adoção e por futuras features. Atualmente não existe tabela nem domínio de notificações — esta task estabelece a infraestrutura completa (tabela, endpoints CRUD, componente de sino no header com polling).

---

## Scope

**In:**
- Migration da tabela `notifications`
- Domínio completo no backend: types, repository, service, controller, routes, validator
- Registrar rota em `app.ts`
- Service frontend (`notifications.service.ts`)
- Hook `useNotifications.ts` com polling a cada 60s
- Componentes `NotificationBell.tsx` e `NotificationDropdown.tsx` no layout da ONG
- Testes unitários do service backend
- Testes de integração dos endpoints

**Out:**
- Não criar notificações de teste/seed — serão geradas pelo follow-up (TASK-002/003)
- Não implementar WebSocket ou real-time
- Não tocar no layout do adotante (notificações são apenas para ong_admin/ong_volunteer nesta fase)
- Não implementar preferências de notificação por usuário

---

## Ubiquitous Language

| Termo de Negócio | Mapeamento no Código |
|---|---|
| Notificação in-app | `notifications` table / `Notification` type |
| Tipo de notificação | `notification.type`: `follow_up_due`, `follow_up_overdue`, `contact_no_response`, `reminders_redistributed` |
| Entidade referenciada | `reference_entity` + `reference_id` — polimorfismo por string |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `services/backend/src/database/migrations/20260604_020_create_notifications_table.ts` | tabela notifications |
| `create` | `services/backend/src/domains/notifications/notifications.types.ts` | interfaces e enums |
| `create` | `services/backend/src/domains/notifications/notifications.repository.ts` | queries Knex |
| `create` | `services/backend/src/domains/notifications/notifications.service.ts` | lógica de negócio |
| `create` | `services/backend/src/domains/notifications/notifications.controller.ts` | request/response |
| `create` | `services/backend/src/domains/notifications/notifications.routes.ts` | rotas Express |
| `create` | `services/backend/src/domains/notifications/notifications.validator.ts` | schemas Zod |
| `modify` | `services/backend/src/app.ts` | registrar rota /notifications |
| `create` | `services/frontend/src/services/notifications.service.ts` | client Axios |
| `create` | `services/frontend/src/hooks/useNotifications.ts` | polling + estado |
| `create` | `services/frontend/src/components/NotificationBell.tsx` | ícone + badge |
| `create` | `services/frontend/src/components/NotificationDropdown.tsx` | lista dropdown |
| `modify` | `services/frontend/src/components/` (OngLayout ou Header) | integrar NotificationBell |
| `create` | `services/backend/tests/unit/notifications.service.spec.ts` | testes unitários |
| `create` | `services/backend/tests/integration/notifications.spec.ts` | testes integração |

---

## Implementation

### `20260604_020_create_notifications_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260603_018_create_visits_table.ts`
**Differences from reference**:
- Tabela: `notifications`
- Colunas: `id` VARCHAR(36) PK, `user_id` VARCHAR(36) FK→users.id NOT NULL, `ong_id` VARCHAR(36) FK→ongs.id NOT NULL, `title` VARCHAR(255) NOT NULL, `message` TEXT NOT NULL, `type` VARCHAR(50) NOT NULL, `reference_entity` VARCHAR(50) NULL, `reference_id` VARCHAR(36) NULL, `is_read` BOOLEAN NOT NULL DEFAULT FALSE, `created_at` TIMESTAMP DEFAULT NOW()
- Índices: `idx_notifications_user_read_date(user_id, is_read, created_at)`, `idx_notifications_ong_user(ong_id, user_id)`
- FK onDelete: CASCADE para user_id e ong_id

### `notifications.types.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.types.ts`
**Differences from reference**:
- `NotificationType` = `'follow_up_due' | 'follow_up_overdue' | 'contact_no_response' | 'reminders_redistributed'`
- Interface `CreateNotificationInput`: `user_id`, `ong_id`, `title`, `message`, `type: NotificationType`, `reference_entity?`, `reference_id?`
- Interface `NotificationListItem`: todos campos da tabela
- Interface `NotificationFilters`: `is_read?: boolean`, `page: number`, `limit: number`

### `notifications.repository.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.repository.ts`
**Differences from reference**:
- Métodos: `create(input)`, `createBulk(inputs[])`, `listByUser(userId, ongId, filters)`, `getUnreadCount(userId, ongId)`, `markAsRead(id, userId, ongId)`, `markAllAsRead(userId, ongId)`
- Todas queries filtram por `user_id` AND `ong_id`
- `listByUser` ordena por `created_at DESC` com paginação
- `createBulk` usa `db.batchInsert('notifications', items, 100)`

### `notifications.service.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.service.ts`
**Differences from reference**:
- Métodos públicos: `create(input)`, `createBulk(inputs[])`, `listForUser(userId, ongId, filters)`, `getUnreadCount(userId, ongId)`, `markAsRead(id, userId, ongId)`, `markAllAsRead(userId, ongId)`
- `create` e `createBulk` geram UUID via `crypto.randomUUID()`
- Sem audit log (notificações são infraestrutura, não entidade auditável)
- Exportar instância singleton: `export const notificationsService = new NotificationsService()`

### `notifications.controller.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.controller.ts`
**Differences from reference**:
- Extrai `userId` e `ongId` de `req.user!`
- Para usuário sem `ongId`, retornar 403 com mensagem `'Você não está vinculado a nenhuma ONG.'`

### `notifications.routes.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.routes.ts`
**Differences from reference**:
- `GET /` → authenticate + authorize(['ong_admin', 'ong_volunteer']) + validate(filtersSchema, 'query')
- `GET /unread-count` → authenticate + authorize(['ong_admin', 'ong_volunteer'])
- `PATCH /:id/read` → authenticate + authorize(['ong_admin', 'ong_volunteer']) + validate(idParamSchema, 'params')
- `PATCH /read-all` → authenticate + authorize(['ong_admin', 'ong_volunteer'])

### `notifications.service.ts` (frontend) *(create)*

**Reference pattern**: `src/services/adoption-requests.service.ts`
**Differences from reference**:
- `baseURL`: `${env.VITE_API_URL}/notifications`
- Métodos: `list(filters?)`, `getUnreadCount()`, `markAsRead(id)`, `markAllAsRead()`

### `useNotifications.ts` *(create)*

**Reference pattern**: `src/hooks/useAdopterRequests.ts`
**Differences from reference**:
- Polling com `setInterval` a cada 60s para `getUnreadCount()` — limpar no cleanup
- Estado: `notifications[]`, `unreadCount: number`, `loading: boolean`
- `fetchNotifications()` chamado on-mount e ao abrir dropdown
- `handleMarkAsRead(id)` e `handleMarkAllAsRead()` com atualização otimista do estado local

### `NotificationBell.tsx` *(create)*

**Especificação** (sem referência equivalente):
- Ant Design: `<Badge count={unreadCount} size="small">` envolvendo `<BellOutlined style={{ fontSize: 20 }} />`
- onClick abre/fecha o `NotificationDropdown`
- Badge não renderiza quando count = 0 (comportamento default do Ant Design Badge)

### `NotificationDropdown.tsx` *(create)*

**Especificação** (sem referência equivalente):
- Ant Design: `<Popover>` com `<List>` dentro, trigger pelo Bell
- Cada item: título (bold), mensagem (truncada em 80 chars), tempo relativo (`dayjs().fromNow()`)
- Item não lido: background `#f6ffed`
- Footer: botão "Marcar todas como lidas" (disabled se nenhuma não-lida)
- Máximo 10 itens; se total > 10, exibir link "Ver todas" (futura página — por ora apenas indicação)
- Click no item: `markAsRead(id)`

---

## Acceptance Criteria

- [ ] **Given** migration executada, **When** banco inspecionado, **Then** tabela `notifications` existe com todas colunas e índices.
- [ ] **Given** usuário ong_volunteer autenticado, **When** GET `/api/v1/notifications`, **Then** retorna apenas notificações da sua ONG, paginadas.
- [ ] **Given** 5 notificações (3 não lidas), **When** GET `/api/v1/notifications/unread-count`, **Then** retorna `{ count: 3 }`.
- [ ] **Given** notificação não lida pertencente ao usuário, **When** PATCH `/api/v1/notifications/:id/read`, **Then** `is_read` = true, response 204.
- [ ] **Given** 3 não lidas do usuário, **When** PATCH `/api/v1/notifications/read-all`, **Then** todas marcadas como lidas, response 204.
- [ ] **Given** usuário de ONG-A, **When** tenta marcar notificação de ONG-B como lida, **Then** retorna 404.
- [ ] **Given** usuário `adopter`, **When** acessa qualquer endpoint de notificações, **Then** retorna 403.
- [ ] **Given** frontend carregado no layout ONG, **When** renderizado, **Then** sino aparece no header com badge de contagem.
- [ ] **Given** sino clicado, **When** dropdown abre, **Then** lista até 10 notificações com indicação visual de não-lidas.
- [ ] **Given** "Marcar todas como lidas" clicado, **When** API responde sucesso, **Then** badge zera e itens perdem destaque visual.

---

## API Notes

- **GET** `/api/v1/notifications` — Query: `is_read` (boolean optional), `page` (default 1), `limit` (default 20). Response: `{ data: Notification[], pagination: { page, limit, total } }`
- **GET** `/api/v1/notifications/unread-count` — Response: `{ count: number }`
- **PATCH** `/api/v1/notifications/:id/read` — Response: `204 No Content`
- **PATCH** `/api/v1/notifications/read-all` — Response: `204 No Content`
- Erros: `401` (não autenticado), `403` (role inválido), `404` (notificação não pertence ao user/ong)

---

## Dependencies

- **Requires**: Nenhuma task anterior.
- **Blocks**: TASK-FULL-002 (geração de lembretes usa `notificationsService`), TASK-FULL-003 (rotina diária usa `createBulk`), TASK-FULL-004 (registro de contato usa `create` para alerta de "sem resposta").
