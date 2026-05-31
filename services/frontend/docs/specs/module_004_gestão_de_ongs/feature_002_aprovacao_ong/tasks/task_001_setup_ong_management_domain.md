# TASK-BACKEND-001 — Setup ONG Management Domain + Migrations

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-001-setup-ong-management-domain`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_002_aprovacao_ong/spec_context.md`
**Part**: 1 of 5 — Domain infrastructure
**Generated**: 2026-05-31

---

## Context

Cria a infraestrutura do domínio `ong-management` (migrations, tipos, erros, validators, repository vazio, controller vazio, routes e registro no app.ts). Esse domínio concentrará toda lógica de aprovação, edição e desativação de ONGs — as features 002, 003 e 004 do módulo 004 compartilham este domínio.
Pré-requisito: as migrations existentes já criaram a tabela `ongs` com enum `status` contendo `pending|approved|rejected|inactive`.

---

## Scope

**In:**
- Migration para adicionar `in_review` ao enum status da tabela `ongs`
- Migration para adicionar colunas `mission`, `instagram`, `facebook`, `whatsapp`, `rejected_at`, `deactivated_at` à tabela `ongs`
- Migration para criar tabela `ong_rejections`
- Migration para criar tabela `adoption_requests` (minimalista para suportar cancelamento em desativação)
- Criar esqueleto do domínio: types, errors, validator, repository, service, controller, routes
- Registrar routes em `app.ts`

**Out:**
- Não implementar lógica de negócio nos métodos do service/controller (apenas estrutura vazia ou stubs que retornam 501)
- Não alterar o domínio `auth` nesta task
- Não criar testes (cobertos em tasks posteriores)
- Não alterar frontend

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Em Análise (interno) | `status: 'in_review'` na tabela `ongs` |
| Rejeitada | `status: 'rejected'` + registro em `ong_rejections` |
| Inativa | `status: 'inactive'` + `deactivated_at` preenchido |
| Bloqueio 10 dias | `ong_rejections.rejected_at` + 10 dias corridos |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260531_009_add_in_review_and_ong_fields.ts` | enum + novos campos |
| `create` | `src/database/migrations/20260531_010_create_ong_rejections_table.ts` | tracking de rejeições |
| `create` | `src/database/migrations/20260531_011_create_adoption_requests_table.ts` | suporte a cancelamento |
| `create` | `src/domains/ong-management/ong-management.types.ts` | tipos do domínio |
| `create` | `src/domains/ong-management/ong-management.errors.ts` | erros de domínio |
| `create` | `src/domains/ong-management/ong-management.validator.ts` | schemas Zod |
| `create` | `src/domains/ong-management/ong-management.repository.ts` | classe vazia |
| `create` | `src/domains/ong-management/ong-management.service.ts` | classe vazia |
| `create` | `src/domains/ong-management/ong-management.controller.ts` | classe vazia |
| `create` | `src/domains/ong-management/ong-management.routes.ts` | definição de rotas |
| `modify` | `src/app.ts` | registrar novo domínio |

---

## Implementation

### `20260531_009_add_in_review_and_ong_fields.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260530_006_add_city_state_to_ongs.ts`
**Differences from reference**:
- Usar raw SQL para alterar o enum: `ALTER TABLE ongs MODIFY COLUMN status ENUM('pending','approved','rejected','inactive','in_review') NOT NULL DEFAULT 'pending'`
- Adicionar colunas:
  - `mission` varchar(300) nullable
  - `instagram` varchar(255) nullable
  - `facebook` varchar(255) nullable
  - `whatsapp` varchar(15) nullable
  - `rejected_at` timestamp nullable
  - `deactivated_at` timestamp nullable
- Down: remover colunas adicionadas e reverter enum (remover `in_review`)

### `20260531_010_create_ong_rejections_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260529_003_create_email_confirmations_table.ts`
**Differences from reference**:
- Tabela: `ong_rejections`
- Colunas: `id` string(36) PK, `ong_id` string(36) FK→ongs.id NOT NULL, `reason` varchar(500) nullable, `rejected_by` string(36) FK→users.id NOT NULL, `rejected_at` timestamp NOT NULL defaultTo(now())
- Index em `ong_id`
- Down: dropTableIfExists

### `20260531_011_create_adoption_requests_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260530_007_create_animals_table.ts`
**Differences from reference**:
- Tabela: `adoption_requests`
- Colunas: `id` string(36) PK, `animal_id` string(36) FK→animals.id NOT NULL, `adopter_id` string(36) FK→users.id NOT NULL, `ong_id` string(36) FK→ongs.id NOT NULL, `status` enum('pending','in_analysis','in_progress','completed','cancelled','rejected') NOT NULL defaultTo('pending'), `created_at` timestamp, `updated_at` timestamp
- Indexes: `ong_id`, `adopter_id`, composite `[ong_id, status]`

### `ong-management.types.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.types.ts`
**Differences from reference**:
- Interface `OngDetail` estende a `Ong` existente com campos novos: `mission`, `instagram`, `facebook`, `whatsapp`, `rejected_at`, `deactivated_at`, `city`, `state`
- Type `OngStatus = 'pending' | 'approved' | 'rejected' | 'inactive' | 'in_review'`
- Interface `OngListFilters`: `status?`, `state?`, `city?`, `dateFrom?`, `dateTo?`, `page`, `limit`
- Interface `OngListItem`: subset para listagem (id, name, cnpj, city, state, status, created_at)
- Interface `PaginatedResult<T>`: `data: T[]`, `total: number`, `page: number`, `limit: number`
- Interface `ApproveOngInput`: `ongId: string`
- Interface `RejectOngInput`: `ongId: string`, `reason?: string`
- Interface `UpdateOngInput`: campos editáveis (phone, address, city, state, description, mission, capacity, instagram, facebook, whatsapp)
- Interface `UpdateOngAdminInput` extends `UpdateOngInput`: adiciona `name`, `cnpj`
- Interface `OngRejection`: `id`, `ong_id`, `reason`, `rejected_by`, `rejected_at`

### `ong-management.errors.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.errors.ts`
**Differences from reference**:
- Importar `AppError` de `~/domains/auth/auth.errors` (reusar base)
- Erros: `OngNotFoundError(404)`, `OngStatusConflictError(409, 'O status desta ONG foi alterado por outro administrador. Os dados foram atualizados.')`, `OngRegistrationBlockedError(403, mensagem com data de liberação — receber data no constructor)`, `OngInactiveError(403, 'Sua organização está inativa na plataforma. Entre em contato com o suporte para mais informações.')`, `InvalidOngStatusTransitionError(422)`, `CnpjDuplicateError(409, 'CNPJ já cadastrado em outra organização.')`, `RejectReasonTooLongError(422)`

### `ong-management.validator.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.validator.ts`
**Differences from reference**:
- `listOngsSchema` (query): status enum opcional, state string(2) opcional, city string opcional, dateFrom/dateTo string ISO opcional, page number min(1) default(1), limit number min(1) max(100) default(20)
- `rejectOngSchema` (body): reason string max(500) opcional
- `updateOngSchema` (body): phone, address, city, state, description (min 50, max 500), mission (min 50, max 300, opcional), capacity (int ≥1), instagram (URL contendo "instagram.com", opcional), facebook (URL contendo "facebook.com", opcional), whatsapp (10-11 dígitos, opcional)
- `updateOngAdminSchema` (body): extends updateOngSchema + name (min 3, max 150), cnpj (14 dígitos)
- `ongIdParamSchema` (params): id string uuid

### `ong-management.repository.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.repository.ts`
**Differences from reference**:
- Classe `OngManagementRepository` com métodos stub (retornando `throw new Error('Not implemented')`)
- Métodos previstos: `listPending`, `findById`, `updateStatus`, `createRejection`, `findRecentRejection`, `updateOngData`, `findByIdForConcurrency`, `cancelActiveAdoptionRequests`, `findAffectedAdopters`, `revokeOngUsersSessions`, `findOngByCnpjExcluding`
- Export singleton: `export const ongManagementRepository = new OngManagementRepository()`

### `ong-management.service.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.service.ts` (estrutura de classe)
**Differences from reference**:
- Classe `OngManagementService` com métodos stub
- Métodos: `listPending`, `getDetail`, `markInReview`, `approve`, `reject`, `updateByOngAdmin`, `updateBySystemAdmin`, `deactivate`, `reactivate`
- Export singleton: `export const ongManagementService = new OngManagementService()`

### `ong-management.controller.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.controller.ts`
**Differences from reference**:
- Classe `OngManagementController` com métodos stub (cada um retorna `res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } })`)
- Métodos: `list`, `getDetail`, `markInReview`, `approve`, `reject`, `updateByAdmin`, `getMyOng`, `updateMyOng`, `deactivate`, `reactivate`
- Export singleton: `export const ongManagementController = new OngManagementController()`

### `ong-management.routes.ts` *(create)*

**Reference pattern**: `src/domains/auth/auth.routes.ts`
**Differences from reference**:
- Todas as rotas exigem `authenticate` + `authorize`
- Rotas admin (`system_admin`):
  - `GET /` → list (validate listOngsSchema, source 'query')
  - `GET /:id` → getDetail (validate ongIdParamSchema, source 'params')
  - `PATCH /:id/in-review` → markInReview
  - `PATCH /:id/approve` → approve
  - `PATCH /:id/reject` → reject (validate rejectOngSchema)
  - `PUT /:id` → update (validate updateOngAdminSchema)
  - `PATCH /:id/deactivate` → deactivate
  - `PATCH /:id/reactivate` → reactivate
- Rota ong_admin:
  - `GET /my-ong` → getMyOng — authorize(['ong_admin'])
  - `PUT /my-ong` → updateMyOng (validate updateOngSchema) — authorize(['ong_admin'])

### `app.ts` *(modify)*

**Changes**:
- Adicionar import: `import { ongManagementRoutes } from './domains/ong-management/ong-management.routes'`
- Adicionar registro: `app.use('/api/v1/ong-management', ongManagementRoutes)` após a linha do catalogRoutes

---

## Acceptance Criteria

- [ ] **Given** as migrations executadas, **When** verifico a tabela `ongs`, **Then** o enum status contém `in_review` e as colunas `mission`, `instagram`, `facebook`, `whatsapp`, `rejected_at`, `deactivated_at` existem.
- [ ] **Given** as migrations executadas, **When** verifico o banco, **Then** tabelas `ong_rejections` e `adoption_requests` existem com as colunas e FKs corretas.
- [ ] **Given** o servidor rodando, **When** faço `GET /api/v1/ong-management/` sem auth, **Then** retorna 401.
- [ ] **Given** autenticado como `system_admin`, **When** faço `GET /api/v1/ong-management/`, **Then** retorna 501 (stub).
- [ ] **Given** autenticado como `ong_admin`, **When** faço `PUT /api/v1/ong-management/my-ong`, **Then** retorna 501 (stub).
- [ ] **Given** autenticado como `adopter`, **When** faço qualquer request para `/api/v1/ong-management/*`, **Then** retorna 403.
- [ ] Migrations têm `down()` funcional que reverte todas as alterações.

---

## Dependencies

- **Requires**: Nenhuma — esta é a primeira task do módulo.
- **Blocks**: TASK-BACKEND-002 (approval flow), TASK-BACKEND-003 (edit), TASK-BACKEND-004 (deactivate), TASK-FRONTEND-003 (admin pages), TASK-FRONTEND-004 (ong profile).

---

## API Notes

> Omit if endpoint is already documented and no divergence exists.

- **Endpoint**: `[METHOD] /[resource]/:id`
- **Input**: [params or "none beyond auth headers"]
- **Success**: `[status]` — `[response shape]`
- **Errors**: `[4xx]` — [when]; `[4xx]` — [when]

---

## Dependencies

- **Requires**: [TASK-ID] ([what it provides])
- **Blocks**: [TASK-ID] ([what depends on this])