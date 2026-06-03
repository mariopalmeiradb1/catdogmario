# TASK-BACKEND-002 — Domain adopter-management (create + read + routes)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-002-domain-backend`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_001_cadastro_adotante/spec_context.md`
**Part**: 2 of 4 — Domain backend completo
**Generated**: `2026-06-03`

## Context

Implementar o domain `adopter-management` com endpoints para criação de perfil, leitura do próprio perfil, atualização de perfil e visualização pelo voluntário (dados mascarados). Segue o padrão de `adoption-requests` domain. Ver spec para regras de negócio completas.

## Scope

**In:**
- Types, errors, validator, repository, service, controller e routes do domain `adopter-management`
- Registro das rotas em `app.ts`
- Endpoint POST `/api/v1/adopter-management` (criar perfil)
- Endpoint GET `/api/v1/adopter-management/me` (ler próprio perfil)
- Endpoint PUT `/api/v1/adopter-management/me` (atualizar perfil)
- Endpoint GET `/api/v1/adopter-management/:id` (voluntário visualiza adotante vinculado a pedido)

**Out:**
- Não criar migration (TASK-001).
- Não criar testes (TASK-003).
- Não criar frontend (TASK-004).
- Não implementar integração com API de CEP externa.

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Adotante | `AdopterProfile` (interface) / `adopter_profiles` (table) |
| Perfil inativo | `status: 'inactive'` na tabela |

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/domains/adopter-management/adopter-management.types.ts` | interfaces e DTOs |
| `create` | `src/domains/adopter-management/adopter-management.errors.ts` | erros de domínio |
| `create` | `src/domains/adopter-management/adopter-management.validator.ts` | schemas Zod |
| `create` | `src/domains/adopter-management/adopter-management.repository.ts` | queries Knex |
| `create` | `src/domains/adopter-management/adopter-management.service.ts` | lógica de negócio |
| `create` | `src/domains/adopter-management/adopter-management.controller.ts` | handlers HTTP |
| `create` | `src/domains/adopter-management/adopter-management.routes.ts` | definição de rotas |
| `modify` | `src/app.ts` | registrar novas rotas |

## Implementation

### `adopter-management.types.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.types.ts`

**Differences from reference**:
- Interface `AdopterProfile`: todos os campos da tabela `adopter_profiles` + `email` (vindo de `users`)
- Interface `CreateAdopterProfileInput`: campos do formulário (full_name, cpf, rg, birth_date, phone, cep, street, number, complement, neighborhood, city, state, has_current_animals, current_animals_description, had_animals_before, previous_animals_description)
- Interface `UpdateAdopterProfileInput`: mesmo que Create mas sem `cpf`
- Interface `AdopterProfileMaskedView`: como `AdopterProfile` mas com `cpf` e `rg` mascarados (strings)
- Type `AdopterProfileStatus = 'active' | 'inactive'`

### `adopter-management.errors.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.errors.ts`

**Differences from reference**:
- `AdopterProfileAlreadyExistsError` (409) — "Este usuário já possui um perfil de adotante."
- `CpfAlreadyRegisteredError` (409) — "CPF já cadastrado no sistema. Entre em contato com o suporte."
- `InvalidCpfError` (422) — "CPF inválido. Verifique o número informado."
- `UnderageAdopterError` (422) — "É necessário ter 18 anos ou mais para adotar."
- `AdopterProfileNotFoundError` (404) — "Perfil de adotante não encontrado."
- `UnauthorizedProfileAccessError` (403) — "Acesso não autorizado a este perfil."

### `adopter-management.validator.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.validator.ts`

**Differences from reference**:
- `createAdopterProfileSchema`: Zod object com todos os campos obrigatórios. `cpf` como string trim length 11-14 (com ou sem máscara). `birth_date` como string (ISO date). `state` enum com 27 UFs. `phone` regex para formatos brasileiros. Campos condicionais via `refine`.
- `updateAdopterProfileSchema`: mesmo que create sem `cpf`.
- `adopterIdParamSchema`: `{ id: z.string().uuid() }`

### `adopter-management.repository.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.repository.ts`

**Differences from reference**:
- `findByUserId(userId: string)`: SELECT from `adopter_profiles` WHERE `user_id` = ?
- `findByCpf(cpf: string)`: SELECT WHERE `cpf` = ?
- `findById(id: string)`: SELECT WHERE `id` = ?
- `create(data)`: INSERT na tabela `adopter_profiles`
- `update(userId: string, data)`: UPDATE WHERE `user_id` = ?
- `hasAdoptionRequestInOng(adopterId: string, ongId: string)`: SELECT 1 FROM `adoption_requests` WHERE `adopter_id` = ? AND `ong_id` = ? LIMIT 1

### `adopter-management.service.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.service.ts`

**Differences from reference**:
- Importar `isValidCpf`, `sanitizeCpf` de `~/shared/utils/cpf.util`
- Importar `maskCpf`, `maskRg` de `~/shared/utils/data-masking.util`
- Importar `recordAuditLog` de `~/shared/services/audit-log.shared`
- `create(input, userId, userEmail)`:
  1. Verificar se já existe perfil pelo userId → throw `AdopterProfileAlreadyExistsError`
  2. Sanitizar CPF → validar com `isValidCpf` → throw `InvalidCpfError`
  3. Verificar unicidade CPF → throw `CpfAlreadyRegisteredError`
  4. Calcular idade: `new Date() - birth_date` ≥ 18 anos → throw `UnderageAdopterError`
  5. Gerar UUID, persistir via repository, registrar audit log
- `getMyProfile(userId)`: buscar por userId, lançar `NotFoundError` se não existe
- `updateMyProfile(userId, input)`: validar idade se birth_date mudou, atualizar via repository, registrar audit log com campos alterados
- `getProfileForVolunteer(adopterId, ongId)`: verificar via `hasAdoptionRequestInOng`, throw `UnauthorizedProfileAccessError` se false. Retornar perfil com CPF e RG mascarados.

### `adopter-management.controller.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.controller.ts`

**Differences from reference**:
- `create(req, res)`: chama service.create, retorna 201
- `getMe(req, res)`: chama service.getMyProfile(req.user.id), retorna 200
- `updateMe(req, res)`: chama service.updateMyProfile, retorna 200
- `getForVolunteer(req, res)`: extrai `req.params.id` como adopterId e `req.user.ong_id` como ongId, chama service.getProfileForVolunteer, retorna 200

### `adopter-management.routes.ts` *(create)*

**Reference pattern**: `src/domains/adoption-requests/adoption-requests.routes.ts`

**Differences from reference**:
- `POST /` — authenticate, authorize(['adopter']), validate(createSchema), controller.create
- `GET /me` — authenticate, authorize(['adopter']), controller.getMe
- `PUT /me` — authenticate, authorize(['adopter']), validate(updateSchema), controller.updateMe
- `GET /:id` — authenticate, authorize(['ong_admin', 'ong_volunteer']), validate(idParam, 'params'), controller.getForVolunteer
- Export como `adopterManagementRoutes`

### `app.ts` *(modify)*

**Differences from reference**:
- Adicionar import: `import { adopterManagementRoutes } from './domains/adopter-management/adopter-management.routes';`
- Adicionar rota: `app.use('/api/v1/adopter-management', adopterManagementRoutes);` (após adoption-requests)

## Acceptance Criteria

- [ ] `POST /api/v1/adopter-management` com dados válidos cria perfil e retorna 201.
- [ ] `POST /api/v1/adopter-management` com CPF duplicado retorna 409 com mensagem de CPF já cadastrado.
- [ ] `POST /api/v1/adopter-management` com CPF inválido retorna 422.
- [ ] `POST /api/v1/adopter-management` com idade < 18 retorna 422.
- [ ] `POST /api/v1/adopter-management` por usuário que já tem perfil retorna 409.
- [ ] `GET /api/v1/adopter-management/me` retorna perfil completo do adotante autenticado.
- [ ] `PUT /api/v1/adopter-management/me` atualiza campos permitidos (não aceita CPF no body).
- [ ] `GET /api/v1/adopter-management/:id` por voluntário retorna perfil com CPF/RG mascarados.
- [ ] `GET /api/v1/adopter-management/:id` por voluntário sem pedido na ONG retorna 403.
- [ ] Todas as ações geram audit log.

## Dependencies

- **Requires**: TASK-BACKEND-001 (migration + utils).
- **Blocks**: TASK-BACKEND-003 (testes), TASK-FRONTEND-004 (frontend cadastro).
