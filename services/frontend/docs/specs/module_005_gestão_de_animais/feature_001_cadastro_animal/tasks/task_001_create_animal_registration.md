# TASK-BACKEND-001 — Cadastro de Animal (API + Migrations)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-001-create-animal-registration`
**Spec**: `.makuco/specs/module_005_gestão_de_animais/feature_001_cadastro_animal/spec_context.md`
**Part**: 1 of 2 — Backend (API + Database)
**Generated**: `2026-06-01`

---

## Context

Implementar endpoint de criação de animal para voluntários/admins de ONGs aprovadas. A tabela `animals` já existe mas precisa de novas colunas (castração, peso, altura, comprimento, observações). Upload de mídia está fora do escopo — apenas dados textuais.
Spec: `.makuco/specs/module_005_gestão_de_animais/feature_001_cadastro_animal/spec_context.md`

---

## Scope

**In:**
- Migração para adicionar novas colunas à tabela `animals` (castration, estimated_age_category, weight_kg, height_cm, length_cm, rescue_observations, general_observations) + alterar `temperament` para JSON + tornar `size` nullable
- Migração para criar tabela `animal_media` (preparação futura)
- Domínio completo `animal-management`: types, errors, validator, repository, service, controller, routes
- Registro das rotas no `app.ts`
- Adaptar `catalog.repository.ts` para deserializar `temperament` como JSON
- Testes unitários e de integração

**Out:**
- Upload de mídia (fotos/vídeo) — será TASK separada
- Edição de animal (FEATURE-002)
- Atualização de status do animal (FEATURE-003)
- Frontend — será TASK-FRONTEND-002
- Gerenciamento da lista de raças (feature separada do admin da ONG)
- Seed de dados

---

## Ubiquitous Language

| Termo de Negócio | Código |
|---|---|
| Espécie (Gato/Cachorro) | `species: 'dog' \| 'cat'` |
| Castração (Sim/Não/Desconhecido) | `castration: 'yes' \| 'no' \| 'unknown'` |
| Idade estimada (Filhote/Jovem/Adulto/Idoso) | `estimated_age_category: 'puppy' \| 'young' \| 'adult' \| 'senior'` |
| Temperamento (seleção múltipla) | `temperament: string[]` — armazenado como JSON no banco |
| Status "Disponível" | `status: 'available'` (default automático na criação) |
| Alerta de duplicidade | Consulta por `name + species + breed` na mesma `ong_id` — retorna flag `duplicateWarning` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260601_012_alter_animals_add_registration_fields.ts` | novas colunas do cadastro |
| `create` | `src/database/migrations/20260601_013_create_animal_media_table.ts` | preparação para upload futuro |
| `create` | `src/domains/animal-management/animal-management.types.ts` | tipos do domínio |
| `create` | `src/domains/animal-management/animal-management.errors.ts` | erros de domínio |
| `create` | `src/domains/animal-management/animal-management.validator.ts` | schema Zod de criação |
| `create` | `src/domains/animal-management/animal-management.repository.ts` | queries de inserção e duplicidade |
| `create` | `src/domains/animal-management/animal-management.service.ts` | regras de negócio + audit log |
| `create` | `src/domains/animal-management/animal-management.controller.ts` | handler HTTP |
| `create` | `src/domains/animal-management/animal-management.routes.ts` | definição de rotas |
| `modify` | `src/app.ts` | registrar nova rota |
| `modify` | `src/domains/catalog/catalog.repository.ts` | parse JSON temperament |
| `create` | `tests/unit/animal-management.service.spec.ts` | testes unitários service |
| `create` | `tests/integration/animal-management.create.spec.ts` | teste integração endpoint |

---

## Implementation

### `20260601_012_alter_animals_add_registration_fields.ts` *(create)*
**Reference pattern**: `src/database/migrations/20260530_007_create_animals_table.ts`
**Diferenças do reference**:
- É uma migração `ALTER TABLE`, não `CREATE TABLE`
- Adicionar colunas:
  ```sql
  castration ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown'
  estimated_age_category ENUM('puppy', 'young', 'adult', 'senior') NULLABLE
  weight_kg DECIMAL(5,1) NULLABLE
  height_cm INTEGER UNSIGNED NULLABLE
  length_cm INTEGER UNSIGNED NULLABLE
  rescue_observations TEXT NULLABLE
  general_observations TEXT NULLABLE
  ```
- Alterar `temperament`: de `string(100)` para `JSON` (usar `knex.schema.alterTable` com `.json('temperament').alter()`)
- Alterar `size`: remover `NOT NULL` (tornar nullable) — animais existentes mantêm valor
- Alterar `name`: de `string(150)` para `string(100)` (spec exige max 100)
- No `down()`: reverter todas as alterações (drop columns, restore types)

### `20260601_013_create_animal_media_table.ts` *(create)*
**Reference pattern**: `src/database/migrations/20260530_007_create_animals_table.ts`
**Schema**:
```
animal_media:
  id: string(36) PK
  animal_id: string(36) FK -> animals.id ON DELETE CASCADE
  type: enum('photo', 'video')
  url: string(500) NOT NULL
  original_name: string(255) NOT NULL
  size_bytes: integer unsigned NOT NULL
  mime_type: string(50) NOT NULL
  sort_order: integer unsigned NOT NULL DEFAULT 0
  created_at: timestamp DEFAULT NOW()
```
- Index composto em `(animal_id, type)` para consultas de mídia por animal
- Constraint: não implementar validação de quantidade no banco (será no service)

### `animal-management.types.ts` *(create)*
**Reference pattern**: `src/domains/ong-management/ong-management.types.ts`
**Conteúdo**:
- `CreateAnimalInput`: campos obrigatórios (name, species, breed, sex, castration, temperament: string[], estimated_age_category) + opcionais (size, weight_kg, height_cm, length_cm, special_needs, special_needs_description, rescue_observations, general_observations)
- `AnimalCreatedResponse`: { id, name, species, breed, status, created_at }
- `CreateAnimalResult`: { data: AnimalCreatedResponse, duplicateWarning: boolean }

### `animal-management.errors.ts` *(create)*
**Reference pattern**: `src/domains/ong-management/ong-management.errors.ts`
**Erros**:
- `OngNotApprovedError` — HTTP 403, código `ONG_NOT_APPROVED`, mensagem: "Sua ONG precisa estar aprovada para cadastrar animais."

### `animal-management.validator.ts` *(create)*
**Reference pattern**: `src/domains/ong-management/ong-management.validator.ts`
**Diferenças do reference**:
- Schema `createAnimalSchema` com validações:
  - `name`: string, trim, min(1), max(100), obrigatório
  - `species`: enum(['dog', 'cat']), obrigatório
  - `breed`: string, trim, min(1), max(100), obrigatório
  - `sex`: enum(['male', 'female']), obrigatório
  - `castration`: enum(['yes', 'no', 'unknown']), obrigatório
  - `temperament`: array de strings, min(1 item), valores permitidos: `['docile', 'playful', 'shy', 'aggressive_with_animals', 'independent', 'needy', 'other']`
  - `estimated_age_category`: enum(['puppy', 'young', 'adult', 'senior']), obrigatório
  - `size`: enum(['small', 'medium', 'large']).optional().nullable()
  - `weight_kg`: number, positive, max 2 digits before decimal + 1 after. Optional
  - `height_cm`: integer, positive. Optional
  - `length_cm`: integer, positive. Optional
  - `special_needs`: boolean. Optional, default false
  - `special_needs_description`: string, max(500). Optional, nullable
  - `rescue_observations`: string, max(1000). Optional, nullable
  - `general_observations`: string, max(1000). Optional, nullable

### `animal-management.repository.ts` *(create)*
**Reference pattern**: `src/domains/catalog/catalog.repository.ts`
**Diferenças do reference**:
- Método `create(data: CreateAnimalInput & { id: string, ong_id: string }): Promise<AnimalCreatedResponse>` — INSERT com `JSON.stringify(data.temperament)` para o campo temperament
- Método `findDuplicate(ongId: string, name: string, species: string, breed: string): Promise<boolean>` — SELECT EXISTS com WHERE case-insensitive (LOWER) em name+species+breed com ong_id
- Método `findOngStatus(ongId: string): Promise<string | null>` — consulta `ongs.status` pelo id

### `animal-management.service.ts` *(create)*
**Reference pattern**: `src/domains/ong-management/ong-management.service.ts`
**Diferenças do reference**:
- Método `create(input: CreateAnimalInput, userId: string, ongId: string): Promise<CreateAnimalResult>`
- Fluxo:
  1. Verificar ONG aprovada via `repository.findOngStatus(ongId)` → se não 'approved', throw `OngNotApprovedError`
  2. Verificar duplicidade via `repository.findDuplicate(ongId, input.name, input.species, input.breed)` → setar flag `duplicateWarning`
  3. Gerar UUID (`crypto.randomUUID()`)
  4. Chamar `repository.create({ ...input, id, ong_id: ongId })`
  5. Registrar audit log: `action: 'animal.create', entity: 'animal', entity_id: id`
  6. Retornar `{ data, duplicateWarning }`

### `animal-management.controller.ts` *(create)*
**Reference pattern**: `src/domains/ong-management/ong-management.controller.ts`
**Diferenças do reference**:
- Único método: `create(req, res, next)` → `HttpStatus.CREATED` (201)
- Extrai `req.user!.userId` e `req.user!.ongId` — se `ongId` é null, retornar 403
- Chama `service.create(req.body, userId, ongId)`

### `animal-management.routes.ts` *(create)*
**Reference pattern**: `src/domains/ong-management/ong-management.routes.ts`
**Diferenças do reference**:
- Rota única: `POST /` com middlewares `authenticate`, `authorize(['ong_admin', 'ong_volunteer'])`, `validate(createAnimalSchema)`

### `app.ts` *(modify)*
**Alteração**: Adicionar import `animalManagementRoutes` e registrar `app.use('/api/v1/animal-management', animalManagementRoutes)` após a linha do `ong-management`

### `catalog.repository.ts` *(modify)*
**Alteração**:
- No método `mapToAnimal`, parsear `temperament`: `temperament: row.temperament ? JSON.parse(row.temperament as string) : null`
- No filtro `temperament`, usar `whereRaw("JSON_CONTAINS(a.temperament, ?)", [JSON.stringify(filters.temperament)])` em vez de `andWhere('a.temperament', filters.temperament)`

### `animal-management.service.spec.ts` *(create)*
**Reference pattern**: `tests/unit/ong-management.service.spec.ts`
**Cenários**:
- Criação com sucesso (campos obrigatórios) → retorna `{ data, duplicateWarning: false }`
- Criação com duplicidade detectada → retorna `{ data, duplicateWarning: true }`
- ONG não aprovada → throw `OngNotApprovedError`
- ONG inexistente (ongId inválido) → throw `OngNotApprovedError`

### `animal-management.create.spec.ts` *(create)*
**Reference pattern**: `tests/integration/auth.register.spec.ts`
**Cenários**:
- POST com body válido + token de voluntário → 201 + animal criado com status 'available'
- POST sem autenticação → 401
- POST com role 'adopter' → 403
- POST com campo obrigatório faltando → 422 com field errors
- POST com ONG não aprovada → 403
- POST com duplicidade → 201 + `duplicateWarning: true`
- Isolamento multi-tenant: animal criado é associado ao `ong_id` do token, não a outro

---

## Acceptance Criteria

- [ ] **Given** voluntário autenticado de ONG aprovada, **When** POST `/api/v1/animal-management` com todos campos obrigatórios, **Then** retorna 201 com `{ data: { id, name, species, breed, status: 'available', created_at }, duplicateWarning: false }`
- [ ] **Given** campos obrigatórios faltando no body, **When** POST, **Then** retorna 422 com `fields` detalhando cada campo inválido
- [ ] **Given** temperament é array vazio, **When** POST, **Then** retorna 422 — mínimo 1 item
- [ ] **Given** animal com mesmo nome+espécie+raça já existe na mesma ONG, **When** POST, **Then** retorna 201 com `duplicateWarning: true` — cadastro NÃO é bloqueado
- [ ] **Given** usuário com role `adopter`, **When** POST, **Then** retorna 403
- [ ] **Given** token ausente, **When** POST, **Then** retorna 401
- [ ] **Given** ONG do usuário com status ≠ 'approved', **When** POST, **Then** retorna 403 com mensagem "Sua ONG precisa estar aprovada para cadastrar animais."
- [ ] **Given** animal criado com sucesso, **When** consultado no catálogo público, **Then** aparece com `status: 'available'` e `temperament` como array (não string)
- [ ] **Given** duplicidade em outra ONG (mesmo nome+espécie+raça), **When** POST na minha ONG, **Then** `duplicateWarning: false` — sem alerta
- [ ] Audit log registrado com `action: 'animal.create'` após criação bem-sucedida
- [ ] Campos opcionais (weight_kg, height_cm, length_cm, special_needs_description, rescue_observations, general_observations) aceitos como null/ausentes sem erro

---

## Authorization

- `ong_admin | ong_volunteer` → pode criar animais (middleware `authorize(['ong_admin', 'ong_volunteer'])`)
- `adopter | system_admin` → retorna 403; não deve ter acesso ao endpoint
- Backend valida adicionalmente que `req.user.ongId` não é null e que a ONG tem status 'approved'

---

## API Notes

- **Endpoint**: `POST /api/v1/animal-management`
- **Content-Type**: `application/json`
- **Auth**: Bearer token + roles `['ong_admin', 'ong_volunteer']`
- **Request body**:
  ```json
  {
    "name": "Rex",
    "species": "dog",
    "breed": "Labrador",
    "sex": "male",
    "castration": "yes",
    "temperament": ["docile", "playful"],
    "estimated_age_category": "adult",
    "size": "large",
    "weight_kg": 25.5,
    "height_cm": 60,
    "length_cm": 80,
    "special_needs": false,
    "special_needs_description": null,
    "rescue_observations": "Encontrado na rua...",
    "general_observations": "Muito dócil..."
  }
  ```
- **Success**: `201` — `{ data: { id, name, species, breed, status, created_at }, duplicateWarning: boolean }`
- **Errors**: `401` — token ausente/inválido; `403` — role não autorizado ou ONG não aprovada; `422` — validação falhou (body com `fields`)

---

## Dependencies

- **Requires**: Nenhuma — tabela `animals` e módulos auth/ong-management já implementados
- **Blocks**: TASK-FRONTEND-002 (formulário de cadastro no frontend), TASK futura de upload de mídia