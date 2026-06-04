# TASK-BACKEND-001 — Gestão de Pedidos de Adoção (API + Migration)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-001-create-adoption-request-backend`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_001_envio_pedido_adocao/spec_context.md`
**Part**: 1 of 2 — Backend (API + Database)
**Generated**: `2026-06-02`

---

## Context

Implementar o domínio completo de pedidos de adoção no backend: migração da tabela `adoption_requests`, endpoints para envio de pedido (adotante), listagem de pedidos (voluntário/admin), e cancelamento pelo adotante. O animal precisa estar com status `available` para receber pedidos, e um adotante não pode ter mais de um pedido ativo (pendente/em análise) para o mesmo animal.
Spec: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_001_envio_pedido_adocao/spec_context.md`

---

## Scope

**In:**
- Migração para criar tabela `adoption_requests`
- Domínio completo `adoption-requests/`: types, errors, validator, repository, service, controller, routes
- Endpoint `POST /api/v1/adoption-requests` — adotante cria pedido (status `pending`)
- Endpoint `GET /api/v1/adoption-requests` — voluntário/admin lista pedidos da ONG com filtros por status e animal
- Endpoint `GET /api/v1/adoption-requests/mine` — adotante lista seus próprios pedidos com filtro por status
- Endpoint `GET /api/v1/adoption-requests/:id` — voluntário/admin ou adotante dono visualiza detalhes
- Endpoint `PATCH /api/v1/adoption-requests/:id/cancel` — adotante cancela pedido próprio
- Registro das rotas no `app.ts`
- Registro da tabela `adoption_requests` no `cleanTestDb()` do setup de testes
- Testes unitários do service
- Testes de integração dos endpoints

**Out:**
- Aprovação e rejeição de pedidos (será TASK-002 deste módulo)
- Fechamento automático de pedidos quando animal vira "Adotado" (será TASK-003)
- Notificações por e-mail ou push (fora do escopo do módulo por enquanto — apenas audit log)
- Frontend — será task separada
- Cadastro/perfil do adotante (já existe como parte do auth — role `adopter`)
- Alteração de status do animal (domínio `animal-management` existente, não tocar)

---

## Ubiquitous Language

| Termo de Negócio | Código |
|---|---|
| Pedido de adoção | `adoption_request` (tabela), `AdoptionRequest` (tipo) |
| Pendente | `status: 'pending'` |
| Em análise | `status: 'in_review'` |
| Aprovado | `status: 'approved'` |
| Rejeitado | `status: 'rejected'` |
| Cancelado | `status: 'cancelled'` |
| Concluído | `status: 'completed'` |
| Adotante | `role: 'adopter'` — usuário com `req.user.role === 'adopter'` |
| Voluntário | `role: 'ong_volunteer'` ou `role: 'ong_admin'` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260602_016_create_adoption_requests_table.ts` | tabela de pedidos de adoção |
| `create` | `src/domains/adoption-requests/adoption-requests.types.ts` | tipos do domínio |
| `create` | `src/domains/adoption-requests/adoption-requests.errors.ts` | erros de domínio |
| `create` | `src/domains/adoption-requests/adoption-requests.validator.ts` | schemas Zod |
| `create` | `src/domains/adoption-requests/adoption-requests.repository.ts` | queries de banco |
| `create` | `src/domains/adoption-requests/adoption-requests.service.ts` | regras de negócio |
| `create` | `src/domains/adoption-requests/adoption-requests.controller.ts` | handlers HTTP |
| `create` | `src/domains/adoption-requests/adoption-requests.routes.ts` | definição de rotas |
| `modify` | `src/app.ts` | registrar nova rota |
| `modify` | `tests/helpers/setup.ts` | limpar tabela nos testes |
| `create` | `tests/unit/adoption-requests.service.spec.ts` | testes unitários |
| `create` | `tests/integration/adoption-requests.create.spec.ts` | testes integração envio |
| `create` | `tests/integration/adoption-requests.list.spec.ts` | testes integração listagem |
| `create` | `tests/integration/adoption-requests.cancel.spec.ts` | testes integração cancelamento |

---

## Implementation

### `20260602_016_create_adoption_requests_table.ts` *(create)*
**Reference pattern**: `src/database/migrations/20260602_015_add_adoption_columns_and_status_history.ts`
**Schema**:
```
adoption_requests:
  id: string(36) PK
  animal_id: string(36) FK -> animals.id ON DELETE CASCADE
  adopter_id: string(36) FK -> users.id ON DELETE CASCADE
  ong_id: string(36) FK -> ongs.id ON DELETE CASCADE
  status: enum('pending', 'in_review', 'approved', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending'
  rejection_reason: text NULLABLE
  cancelled_by: enum('adopter', 'system') NULLABLE
  cancellation_reason: string(255) NULLABLE
  created_at: timestamp NOT NULL DEFAULT NOW()
  updated_at: timestamp NOT NULL DEFAULT NOW()
```
- Índices: `(animal_id, status)` para consultas de pedidos por animal, `(adopter_id, status)` para consultas do adotante, `(ong_id, status)` para listagem do voluntário
- A regra de "um pedido ativo por adotante por animal" é validada no service (MySQL não suporta partial unique index)

### `adoption-requests.types.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.types.ts`
**Conteúdo**:
- `AdoptionRequestStatus`: type union `'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'completed'`
- `CANCELLABLE_STATUSES`: array `['pending', 'in_review']` — estados que permitem cancelamento pelo adotante
- `CreateAdoptionRequestInput`: `{ animal_id: string }`
- `AdoptionRequestListFilters`: `{ status?: AdoptionRequestStatus | 'all'; animal_id?: string; page: number; limit: number }`
- `AdoptionRequestDetail`:
  ```ts
  {
    id: string;
    animal_id: string;
    animal_name: string;
    animal_species: string;
    animal_breed: string;
    adopter_id: string;
    adopter_name: string;
    adopter_email: string;
    ong_id: string;
    status: AdoptionRequestStatus;
    rejection_reason: string | null;
    cancelled_by: 'adopter' | 'system' | null;
    cancellation_reason: string | null;
    created_at: string;
    updated_at: string;
  }
  ```
- `AdoptionRequestListItem`:
  ```ts
  {
    id: string;
    animal_name: string;
    animal_species: string;
    adopter_name: string;
    status: AdoptionRequestStatus;
    created_at: string;
  }
  ```
- `AdoptionRequestCreatedResponse`: `{ id: string; animal_id: string; status: AdoptionRequestStatus; created_at: Date }`
- `AdopterRequestListItem`: `{ id: string; animal_name: string; animal_species: string; ong_name: string; status: AdoptionRequestStatus; rejection_reason: string | null; created_at: string }`
- `AdopterRequestListFilters`: `{ status?: AdoptionRequestStatus | 'all'; page: number; limit: number }`

### `adoption-requests.errors.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.errors.ts`
**Erros**:
- `AnimalNotAvailableError` — HTTP 422, `ANIMAL_NOT_AVAILABLE`, "Este animal não está disponível para adoção."
- `DuplicateAdoptionRequestError` — HTTP 409, `DUPLICATE_ADOPTION_REQUEST`, "Você já possui um pedido ativo para este animal."
- `AdoptionRequestNotFoundError` — HTTP 404, `ADOPTION_REQUEST_NOT_FOUND`, "Pedido de adoção não encontrado."
- `CannotCancelRequestError` — HTTP 422, `CANNOT_CANCEL_REQUEST`, "Apenas pedidos com status Pendente ou Em Análise podem ser cancelados."
- `NotRequestOwnerError` — HTTP 403, `NOT_REQUEST_OWNER`, "Você não tem permissão para cancelar este pedido."

### `adoption-requests.validator.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.validator.ts`
**Schemas**:
- `createAdoptionRequestSchema`: `{ animal_id: z.string().uuid('ID do animal inválido.') }`
- `listAdoptionRequestsQuerySchema`: `{ status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'cancelled', 'completed', 'all']).optional(), animal_id: z.string().uuid().optional(), page: z.coerce.number().int().positive().optional().default(1), limit: z.coerce.number().int().positive().max(100).optional().default(20) }`
- `adoptionRequestIdParamSchema`: `{ id: z.string().uuid('ID do pedido inválido.') }`

### `adoption-requests.repository.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.repository.ts`
**Métodos**:
- `create(data: { id, animal_id, adopter_id, ong_id }): Promise<AdoptionRequestCreatedResponse>` — INSERT + return
- `findAnimalForAdoption(animalId: string): Promise<{ id: string; ong_id: string; status: string; name: string } | null>` — SELECT de `animals` (id, ong_id, status, name) sem filtro de ong_id (adotante pode ser de qualquer lugar)
- `hasActiveRequest(animalId: string, adopterId: string): Promise<boolean>` — SELECT EXISTS em `adoption_requests` WHERE animal_id + adopter_id + status IN ('pending', 'in_review')
- `findByIdForVolunteer(id: string, ongId: string): Promise<AdoptionRequestDetail | null>` — SELECT com JOIN em `animals` (name, species, breed) e `users` (name, email) WHERE `adoption_requests.id = id AND adoption_requests.ong_id = ongId`
- `findByIdForAdopter(id: string, adopterId: string): Promise<AdoptionRequestDetail | null>` — SELECT com JOIN similar, WHERE `adoption_requests.id = id AND adoption_requests.adopter_id = adopterId`
- `list(ongId: string, filters: AdoptionRequestListFilters): Promise<{ items: AdoptionRequestListItem[]; total: number }>` — SELECT paginado com JOINs, filtros opcionais por status e animal_id, ORDER BY `created_at DESC`
- `listByAdopter(adopterId: string, filters: AdopterRequestListFilters): Promise<{ items: AdopterRequestListItem[]; total: number }>` — SELECT paginado com JOINs em `animals` (name, species) e `ongs` (name), WHERE `adopter_id = adopterId`, filtro opcional por status, ORDER BY `created_at DESC`
- `updateStatus(id: string, status: AdoptionRequestStatus, extra?: { cancelled_by?: string; cancellation_reason?: string }): Promise<void>` — UPDATE status + updated_at + extra fields

### `adoption-requests.service.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.service.ts`
**Métodos**:
- `create(input: CreateAdoptionRequestInput, userId: string): Promise<AdoptionRequestCreatedResponse>`
  1. Buscar animal via `repository.findAnimalForAdoption(input.animal_id)` → se null, throw `AnimalNotAvailableError`
  2. Verificar `animal.status === 'available'` → senão, throw `AnimalNotAvailableError`
  3. Verificar `repository.hasActiveRequest(input.animal_id, userId)` → se true, throw `DuplicateAdoptionRequestError`
  4. Gerar UUID (`crypto.randomUUID()`)
  5. Chamar `repository.create({ id, animal_id: input.animal_id, adopter_id: userId, ong_id: animal.ong_id })`
  6. Registrar audit log: `action: 'adoption_request.create', entity: 'adoption_request', entity_id: id, ong_id: animal.ong_id, metadata: { animal_id: input.animal_id, animal_name: animal.name }`
  7. Retornar resultado

- `list(ongId: string, filters: AdoptionRequestListFilters): Promise<{ data: AdoptionRequestListItem[]; pagination: { page, limit, total } }>`
  1. Chamar `repository.list(ongId, filters)`
  2. Retornar com shape de paginação (mesmo padrão de `animal-management.service.list`)

- `listMine(userId: string, filters: AdopterRequestListFilters): Promise<{ data: AdopterRequestListItem[]; pagination: { page, limit, total } }>`
  1. Chamar `repository.listByAdopter(userId, filters)`
  2. Retornar com shape de paginação

- `findById(id: string, userId: string, role: string, ongId: string | null): Promise<AdoptionRequestDetail>`
  1. Se role é `adopter` → usar `repository.findByIdForAdopter(id, userId)`
  2. Se role é `ong_volunteer` ou `ong_admin` → usar `repository.findByIdForVolunteer(id, ongId!)`
  3. Se null → throw `AdoptionRequestNotFoundError`
  4. Retornar detail

- `cancel(id: string, userId: string): Promise<void>`
  1. Buscar pedido via `repository.findByIdForAdopter(id, userId)` → se null, throw `AdoptionRequestNotFoundError`
  2. Verificar status IN `CANCELLABLE_STATUSES` → senão, throw `CannotCancelRequestError`
  3. Chamar `repository.updateStatus(id, 'cancelled', { cancelled_by: 'adopter' })`
  4. Registrar audit log: `action: 'adoption_request.cancel', entity: 'adoption_request', entity_id: id, ong_id: request.ong_id`

### `adoption-requests.controller.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.controller.ts`
**Diferenças do reference**:
- Método `create`: role `adopter`, extrai apenas `req.user!.userId` (sem ongId), chama `service.create(req.body, userId)`, retorna 201
- Método `list`: roles `ong_admin|ong_volunteer`, extrai `ongId` do token, se `ongId` null → 403, chama `service.list(ongId, filters)`
- Método `listMine`: role `adopter`, extrai `userId`, chama `service.listMine(userId, filters)`, retorna 200
- Método `findById`: roles `adopter|ong_admin|ong_volunteer`, extrai `userId, role, ongId`, chama `service.findById(id, userId, role, ongId)`
- Método `cancel`: role `adopter`, extrai `userId`, chama `service.cancel(req.params.id, userId)`, retorna 204

### `adoption-requests.routes.ts` *(create)*
**Reference pattern**: `src/domains/animal-management/animal-management.routes.ts`
**Rotas**:
- `POST /` — `authenticate`, `authorize(['adopter'])`, `validate(createAdoptionRequestSchema)`, controller.create
- `GET /` — `authenticate`, `authorize(['ong_admin', 'ong_volunteer'])`, `validate(listAdoptionRequestsQuerySchema, 'query')`, controller.list
- `GET /mine` — `authenticate`, `authorize(['adopter'])`, `validate(listAdoptionRequestsQuerySchema, 'query')`, controller.listMine — **IMPORTANTE**: esta rota deve ser registrada ANTES de `GET /:id` para evitar conflito de roteamento
- `GET /:id` — `authenticate`, `authorize(['adopter', 'ong_admin', 'ong_volunteer'])`, `validate(adoptionRequestIdParamSchema, 'params')`, controller.findById
- `PATCH /:id/cancel` — `authenticate`, `authorize(['adopter'])`, `validate(adoptionRequestIdParamSchema, 'params')`, controller.cancel

### `app.ts` *(modify)*
**Alteração**: Adicionar import `adoptionRequestRoutes` de `./domains/adoption-requests/adoption-requests.routes` e registrar `app.use('/api/v1/adoption-requests', adoptionRequestRoutes)` após a linha do `animal-management`

### `tests/helpers/setup.ts` *(modify)*
**Alteração**: Adicionar `await db('adoption_requests').del();` na função `cleanTestDb()` **antes** de `await db('users').del()` (respeitar FK)

### `adoption-requests.service.spec.ts` *(create)*
**Reference pattern**: `tests/unit/animal-management.service.spec.ts`
**Cenários**:
- Criação com sucesso → retorna `{ id, animal_id, status: 'pending', created_at }`
- Animal não encontrado → throw `AnimalNotAvailableError`
- Animal com status `in_adoption_process` → throw `AnimalNotAvailableError`
- Animal com status `adopted` → throw `AnimalNotAvailableError`
- Adotante já tem pedido ativo para mesmo animal → throw `DuplicateAdoptionRequestError`
- Cancelamento com sucesso (status `pending`) → sem erro
- Cancelamento com sucesso (status `in_review`) → sem erro
- Cancelamento de pedido `approved` → throw `CannotCancelRequestError`
- Cancelamento de pedido inexistente → throw `AdoptionRequestNotFoundError`

### `adoption-requests.create.spec.ts` *(create)*
**Reference pattern**: `tests/integration/animal-management.create.spec.ts`
**Cenários**:
- POST com body válido + token de adotante → 201 + pedido criado com status `pending`
- POST sem autenticação → 401
- POST com role `ong_volunteer` → 403
- POST com `animal_id` inexistente → 422
- POST com animal com status `adopted` → 422
- POST com pedido ativo duplicado para mesmo animal → 409
- Adotante pode criar pedidos para animais de ONGs diferentes

### `adoption-requests.list.spec.ts` *(create)*
**Reference pattern**: `tests/integration/animal-management.create.spec.ts`
**Cenários**:
- GET com token de voluntário → 200 + lista de pedidos da ONG
- GET com filtro de status → retorna apenas pedidos com status informado
- GET com filtro de `animal_id` → retorna apenas pedidos do animal
- GET sem token → 401
- GET com role `adopter` → 403
- Isolamento multi-tenant: voluntário não vê pedidos de outra ONG
- Paginação: page + limit respeitados, total correto

### `adoption-requests.cancel.spec.ts` *(create)*
**Reference pattern**: `tests/integration/animal-management.create.spec.ts`
**Cenários**:
- PATCH com token de adotante + pedido pendente → 204
- PATCH com token de adotante + pedido em análise → 204
- PATCH com pedido aprovado → 422
- PATCH com pedido de outro adotante → 404 (não revela existência)
- PATCH sem token → 401
- PATCH com role `ong_volunteer` → 403

---

## Acceptance Criteria

- [ ] **Given** adotante autenticado e animal disponível, **When** POST `/api/v1/adoption-requests` com `animal_id` válido, **Then** retorna 201 com `{ id, animal_id, status: 'pending', created_at }`
- [ ] **Given** adotante com pedido ativo (pending/in_review) para o animal X, **When** POST com mesmo `animal_id`, **Then** retorna 409 com código `DUPLICATE_ADOPTION_REQUEST`
- [ ] **Given** animal com status `in_adoption_process` ou `adopted`, **When** POST com `animal_id` deste animal, **Then** retorna 422 com código `ANIMAL_NOT_AVAILABLE`
- [ ] **Given** voluntário autenticado, **When** GET `/api/v1/adoption-requests`, **Then** retorna 200 com lista paginada de pedidos da ONG do voluntário
- [ ] **Given** voluntário, **When** GET com `?status=pending`, **Then** retorna apenas pedidos com status `pending`
- [ ] **Given** voluntário, **When** GET com `?animal_id=X`, **Then** retorna apenas pedidos do animal X
- [ ] **Given** voluntário de ONG A, **When** GET `/api/v1/adoption-requests`, **Then** NÃO retorna pedidos de ONG B
- [ ] **Given** adotante autenticado, **When** GET `/api/v1/adoption-requests/mine`, **Then** retorna 200 com lista paginada dos seus próprios pedidos (com nome do animal, espécie e nome da ONG)
- [ ] **Given** adotante autenticado e pedido com status `pending`, **When** PATCH `/:id/cancel`, **Then** retorna 204 e status do pedido muda para `cancelled`
- [ ] **Given** adotante e pedido com status `approved`, **When** PATCH `/:id/cancel`, **Then** retorna 422 com código `CANNOT_CANCEL_REQUEST`
- [ ] **Given** adotante A, **When** tenta cancelar pedido do adotante B, **Then** retorna 404 (sem vazar existência)
- [ ] Todos os endpoints protegidos com `authenticate` — sem token retorna 401
- [ ] Cada criação e cancelamento gera registro de audit log

---

## Authorization

- `adopter` → pode criar pedidos (POST /), listar próprios pedidos (GET /mine), visualizar pedido próprio (GET /:id), cancelar pedido próprio (PATCH /:id/cancel)
- `ong_volunteer | ong_admin` → pode listar pedidos da ONG (GET /), visualizar detalhes de pedido da ONG (GET /:id)
- `system_admin` → sem acesso a estes endpoints nesta task
- Backend enforça via middleware `authorize([...])` — roles não permitidas recebem 403

---

## API Notes

- **POST** `/api/v1/adoption-requests` — Input: `{ animal_id: string }` — Success: `201` — Errors: `401`, `403`, `409` (duplicado), `422` (animal indisponível ou validação)
- **GET** `/api/v1/adoption-requests` — Query: `?status=pending|in_review|...|all&animal_id=uuid&page=1&limit=20` — Success: `200 { data: [...], pagination: { page, limit, total } }`
- **GET** `/api/v1/adoption-requests/mine` — Query: `?status=pending|...|all&page=1&limit=20` — Success: `200 { data: [...], pagination: { page, limit, total } }` — Retorna pedidos do adotante com `animal_name`, `animal_species`, `ong_name`
- **GET** `/api/v1/adoption-requests/:id` — Success: `200 { ... }` — Errors: `404`
- **PATCH** `/api/v1/adoption-requests/:id/cancel` — Input: nenhum body — Success: `204` — Errors: `404`, `422`

---

## Dependencies

- **Requires**: Nenhuma task pendente — tabelas `animals`, `users`, `ongs` já existem
- **Blocks**: TASK-002 (aprovação/rejeição de pedidos), TASK-003 (fechamento automático), task frontend de pedidos