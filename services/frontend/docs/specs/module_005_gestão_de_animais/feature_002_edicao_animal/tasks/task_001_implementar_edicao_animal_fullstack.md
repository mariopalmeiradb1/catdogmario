# TASK-FULLSTACK-001 — Edição de Animal (Backend + Frontend)

**Root**: `services/backend/` e `services/frontend/`
**Branch**: `feature/TASK-FULLSTACK-001-edicao-animal`
**Spec**: `.makuco/specs/module_005_gestão_de_animais/feature_002_edicao_animal/spec_context.md`
**Generated**: `2026-06-01`

---

## Context

Implementar edição completa de dados de animais: listagem funcional, edição de campos, gestão de mídia (fotos/vídeo), inativação (soft delete) e visualização de auditoria por animal. O backend atualmente só possui `create` no domínio `animal-management` — todos os demais endpoints são novos. O frontend `AnimalListPage` é um placeholder vazio. Concorrência otimista via `updated_at` é obrigatória (RNF-04 da spec).

---

## Scope

**In:**
- Migration: adicionar `inactive` ao enum `status` da tabela `animals` + coluna `inactivated_at`
- Backend: endpoints GET list, GET by id, PUT update, PATCH inactivate, POST media upload, DELETE media
- Lógica de diff de campos para metadata de auditoria
- Concorrência otimista (rejeitar update se `updated_at` diverge)
- Middleware de upload com multer (disco local, interface abstraída)
- Frontend: types, service layer, AnimalForm compartilhado, AnimalMediaSection, pages (List, Edit, Detail), modais (Inactivate, AuditLog)
- Rotas: `/ong/animals/:id/edit`, `/ong/animals/:id`
- Testes unitários e de integração para backend; testes de componente para frontend

**Out:**
- Transições de status entre disponível/em processo/adotado (FEATURE-003)
- Reativação de animais inativados
- Exclusão física de registros
- Ficha médica / histórico vacinal
- Upload para cloud storage (S3) — MVP usa disco local
- Alterações no módulo de catálogo público (`catalog` domain) — a listagem pública já consome dados via queries existentes
- Não alterar `auth`, `ong-management`, nem migrations anteriores

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Inativo | `status: 'inactive'` na tabela `animals` |
| Inativação | Endpoint `PATCH /:id/inactivate`, action `'animal.inactivate'` no audit |
| Diff de campos | `metadata.changed_fields` no `audit_logs` — objeto `{ field: { old, new } }` |
| Concorrência otimista | Campo `updated_at` enviado no body do PUT, comparado com DB antes do update |

---

## Files

| Action | Path (from service root) | Why (≤5 words) |
|---|---|---|
| `create` | `backend/src/database/migrations/20260601_014_add_inactive_status_to_animals.ts` | adicionar inactive + inactivated_at |
| `modify` | `backend/src/domains/animal-management/animal-management.types.ts` | novos tipos (Update, Detail, List) |
| `modify` | `backend/src/domains/animal-management/animal-management.validator.ts` | schemas update + list filters |
| `modify` | `backend/src/domains/animal-management/animal-management.errors.ts` | novos erros de domínio |
| `modify` | `backend/src/domains/animal-management/animal-management.repository.ts` | métodos CRUD expandidos |
| `modify` | `backend/src/domains/animal-management/animal-management.service.ts` | lógica de update, inactivate, media |
| `modify` | `backend/src/domains/animal-management/animal-management.controller.ts` | handlers dos novos endpoints |
| `modify` | `backend/src/domains/animal-management/animal-management.routes.ts` | registrar novas rotas |
| `create` | `backend/src/shared/services/file-storage.service.ts` | interface + implementação local |
| `create` | `backend/src/shared/middlewares/upload.middleware.ts` | config multer |
| `modify` | `frontend/src/types/animal-management.types.ts` | tipos Detail, List, Update, Media |
| `modify` | `frontend/src/services/animal-management.service.ts` | métodos list, findById, update, etc. |
| `create` | `frontend/src/components/ong/AnimalForm.tsx` | form compartilhado create/edit |
| `create` | `frontend/src/components/ong/AnimalMediaSection.tsx` | upload/preview/remove mídia |
| `create` | `frontend/src/components/ong/InactivateConfirmModal.tsx` | modal confirmação inativação |
| `create` | `frontend/src/components/ong/AnimalAuditLogModal.tsx` | modal histórico auditoria |
| `modify` | `frontend/src/pages/ong/AnimalListPage.tsx` | tabela funcional + filtros + ações |
| `create` | `frontend/src/pages/ong/AnimalEditPage.tsx` | página de edição |
| `create` | `frontend/src/pages/ong/AnimalDetailPage.tsx` | visualização read-only |
| `modify` | `frontend/src/pages/ong/AnimalCreatePage.tsx` | refatorar para usar AnimalForm |
| `modify` | `frontend/src/routes/index.tsx` | novas rotas edit/detail |
| `modify` | `backend/tests/unit/animal-management.service.spec.ts` | expandir testes unitários |
| `create` | `backend/tests/integration/animal-management.update.spec.ts` | testes integração edição |
| `create` | `frontend/tests/pages/AnimalEditPage.spec.tsx` | testes página edição |

---

## Implementation

### Fase 1 — Migration

#### `20260601_014_add_inactive_status_to_animals.ts` *(create)*
**Reference pattern**: `src/database/migrations/20260601_012_alter_animals_add_registration_fields.ts`
**Differences from reference**:
- `up`: `ALTER TABLE animals MODIFY COLUMN status ENUM('available', 'in_adoption_process', 'adopted', 'inactive') NOT NULL DEFAULT 'available'`
- `up`: `ALTER TABLE animals ADD COLUMN inactivated_at TIMESTAMP NULL`
- `down`: reverter enum sem `inactive`, drop `inactivated_at`

---

### Fase 2 — Backend Types & Validators

#### `animal-management.types.ts` *(modify)*
Adicionar interfaces (manter `CreateAnimalInput` existente intacto):
```ts
export interface UpdateAnimalInput {
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string[];
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior';
  size?: 'small' | 'medium' | 'large' | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  special_needs?: boolean;
  special_needs_description?: string | null;
  rescue_observations?: string | null;
  general_observations?: string | null;
  updated_at: string; // concorrência otimista
}

export type AnimalStatus = 'available' | 'in_adoption_process' | 'adopted' | 'inactive';

export interface AnimalMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  sort_order: number;
}

export interface AnimalDetail {
  id: string;
  ong_id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string[];
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior';
  size: 'small' | 'medium' | 'large' | null;
  weight_kg: number | null;
  height_cm: number | null;
  length_cm: number | null;
  special_needs: boolean;
  special_needs_description: string | null;
  rescue_observations: string | null;
  general_observations: string | null;
  status: AnimalStatus;
  created_at: string;
  updated_at: string;
  inactivated_at: string | null;
  media: AnimalMedia[];
}

export interface AnimalListItem {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  status: AnimalStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalListFilters {
  status?: AnimalStatus | 'all';
  page: number;
  limit: number;
}
```

#### `animal-management.validator.ts` *(modify)*
**Reference pattern**: `createAnimalSchema` já existente no mesmo arquivo.
**Differences from reference**:
- `updateAnimalSchema`: reutilizar `createAnimalSchema.extend({ updated_at: z.string().datetime() })`
- `listAnimalsQuerySchema`: `z.object({ status: z.enum(['available', 'in_adoption_process', 'adopted', 'inactive', 'all']).optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) })`

#### `animal-management.errors.ts` *(modify)*
**Reference pattern**: `OngNotApprovedError` no mesmo arquivo (extends `AppError`).
Adicionar:
- `AnimalNotFoundError` — 404, code `'ANIMAL_NOT_FOUND'`, message `'Animal não encontrado.'`
- `AnimalNotEditableError` — 422, code `'ANIMAL_NOT_EDITABLE'`, message `'Animais adotados ou inativos não podem ser editados.'`
- `CannotInactivateError` — 422, code `'CANNOT_INACTIVATE'`, message `'Não é possível inativar um animal que está em processo de adoção. Aguarde a conclusão ou cancelamento do processo.'`
- `ConcurrencyConflictError` — 409, code `'CONFLICT'`, message `'Os dados foram alterados por outro usuário. Recarregue a página e tente novamente.'`
- `MediaLimitExceededError` — 422, code `'MEDIA_LIMIT_EXCEEDED'`, message dinâmica por tipo

---

### Fase 3 — Backend Repository

#### `animal-management.repository.ts` *(modify)*
**Reference pattern**: método `create` existente no mesmo arquivo.
Adicionar métodos:
- `findById(id: string, ongId: string): Promise<AnimalRow | null>` — `SELECT * FROM animals WHERE id=? AND ong_id=?`
- `findByIdWithMedia(id: string, ongId: string): Promise<AnimalDetail | null>` — query animal + query `animal_media WHERE animal_id=?` separada, parse `temperament` de JSON, montar array de media
- `list(ongId: string, filters: AnimalListFilters): Promise<{ items: AnimalListItem[]; total: number }>` — query paginada; se `status === 'all'` não filtra status; default exclui `inactive` (`WHERE status != 'inactive'`); `photo_url` = subquery primeiro registro de `animal_media` com `type='photo'` ORDER BY `sort_order` LIMIT 1
- `update(id: string, fields: Partial<Record<string, unknown>>): Promise<void>` — `UPDATE animals SET ...fields, updated_at=NOW() WHERE id=?`
- `inactivate(id: string): Promise<void>` — `UPDATE animals SET status='inactive', inactivated_at=NOW(), updated_at=NOW() WHERE id=?`
- `countMedia(animalId: string, type: 'photo' | 'video'): Promise<number>` — `SELECT COUNT(*) FROM animal_media WHERE animal_id=? AND type=?`
- `createMedia(data: { id, animal_id, type, url, original_name, size_bytes, mime_type, sort_order }): Promise<AnimalMedia>`
- `findMediaById(mediaId: string): Promise<{ id, animal_id, url, type } | null>`
- `deleteMedia(mediaId: string): Promise<void>`
- `getNextMediaSortOrder(animalId: string, type: 'photo' | 'video'): Promise<number>` — `SELECT COALESCE(MAX(sort_order), -1) + 1 FROM animal_media WHERE animal_id=? AND type=?`

---

### Fase 4 — Backend Service

#### `animal-management.service.ts` *(modify)*
**Reference pattern**: método `create` existente no mesmo arquivo.
Adicionar métodos:

**`list(ongId, filters)`** — delega ao repository, retorna `{ data: items, pagination: { page, limit, total } }`.

**`findById(id, ongId)`** — chama `repository.findByIdWithMedia`, lança `AnimalNotFoundError` se null.

**`update(id, input, userId, ongId)`**:
1. `const current = await repository.findById(id, ongId)` → lança `AnimalNotFoundError` se null
2. Verificar `current.status` ∈ `['available', 'in_adoption_process']` → `AnimalNotEditableError` caso contrário
3. Comparar `new Date(input.updated_at).getTime()` com `new Date(current.updated_at).getTime()` → `ConcurrencyConflictError` se diferem
4. `const changedFields = computeChangedFields(current, input)` — helper privado
5. Se `Object.keys(changedFields).length === 0` → retornar `findByIdWithMedia(id, ongId)` sem auditoria
6. Construir objeto de update: mapear input para colunas DB (ex: `temperament` → `JSON.stringify(input.temperament)`)
7. `await repository.update(id, updateFields)`
8. `await recordAuditLog({ user_id: userId, ong_id: ongId, action: 'animal.update', entity: 'animal', entity_id: id, metadata: { changed_fields: changedFields } })`
9. Retornar `findByIdWithMedia(id, ongId)`

**`inactivate(id, userId, ongId)`**:
1. `findById` → `AnimalNotFoundError` se null
2. Verificar `status ∈ ['available', 'adopted']` → `CannotInactivateError` se `in_adoption_process`
3. `repository.inactivate(id)`
4. `recordAuditLog(action: 'animal.inactivate', entity: 'animal', entity_id: id)`
5. Retornar `{ id, status: 'inactive', inactivated_at }`

**`uploadMedia(id, file, type, userId, ongId)`**:
1. `const animal = await repository.findById(id, ongId)` → 404 + verificar status editável
2. `const count = await repository.countMedia(id, type)` → verificar limite (photo: 3, video: 1) → `MediaLimitExceededError`
3. `const url = await fileStorage.save(file)` — usa a instância injetada de `FileStorageService`
4. `const sortOrder = await repository.getNextMediaSortOrder(id, type)`
5. `const media = await repository.createMedia({ id: crypto.randomUUID(), animal_id: id, type, url, original_name: file.originalname, size_bytes: file.size, mime_type: file.mimetype, sort_order: sortOrder })`
6. `await recordAuditLog(action: 'animal.media.add', entity: 'animal', entity_id: id, metadata: { media_id: media.id, media_type: type })`
7. Retornar `media`

**`removeMedia(id, mediaId, userId, ongId)`**:
1. `const animal = await repository.findById(id, ongId)` → 404 + verificar status editável
2. `const media = await repository.findMediaById(mediaId)` → 404 se null; verificar `media.animal_id === id`
3. `await fileStorage.remove(media.url)`
4. `await repository.deleteMedia(mediaId)`
5. `await recordAuditLog(action: 'animal.media.remove', entity: 'animal', entity_id: id, metadata: { media_id: mediaId, media_type: media.type })`

**Helper privado `computeChangedFields(current, input)`**:
- Campos: `name, species, breed, sex, castration, temperament, estimated_age_category, size, weight_kg, height_cm, length_cm, special_needs, special_needs_description, rescue_observations, general_observations`
- Para `temperament`: comparar `JSON.stringify([...current].sort())` vs `JSON.stringify([...input].sort())`
- Para campos numéricos nullable: tratar `null` vs `undefined` como iguais
- Retornar `Record<string, { old: unknown; new: unknown }>` somente com campos alterados

---

### Fase 5 — Backend Controller & Routes

#### `animal-management.controller.ts` *(modify)*
**Reference pattern**: método `create` existente no mesmo arquivo.
Adicionar handlers (mesmo padrão try/catch → next(error)):
- `list(req, res, next)` — extrai `ongId` do `req.user!.ongId`, `query` para filters
- `findById(req, res, next)` — extrai `req.params.id`, `req.user!.ongId`
- `update(req, res, next)` — extrai `req.params.id`, `req.body`, `req.user!.userId`, `req.user!.ongId`
- `inactivate(req, res, next)` — extrai `req.params.id`, `req.user!.userId`, `req.user!.ongId`
- `uploadMedia(req, res, next)` — extrai `req.params.id`, `req.file` (multer), `req.body.type`, userId, ongId; responde 201
- `removeMedia(req, res, next)` — extrai `req.params.id`, `req.params.mediaId`, userId, ongId; responde 204

#### `animal-management.routes.ts` *(modify)*
**Reference pattern**: rota POST existente no mesmo arquivo.
Adicionar após a rota POST existente:
```ts
router.get('/', authenticate, authorize(['ong_admin', 'ong_volunteer']), validate(listAnimalsQuerySchema, 'query'), (req, res, next) => controller.list(req, res, next));
router.get('/:id', authenticate, authorize(['ong_admin', 'ong_volunteer']), (req, res, next) => controller.findById(req, res, next));
router.put('/:id', authenticate, authorize(['ong_admin', 'ong_volunteer']), validate(updateAnimalSchema), (req, res, next) => controller.update(req, res, next));
router.patch('/:id/inactivate', authenticate, authorize(['ong_admin']), (req, res, next) => controller.inactivate(req, res, next));
router.post('/:id/media', authenticate, authorize(['ong_admin', 'ong_volunteer']), uploadMiddleware, (req, res, next) => controller.uploadMedia(req, res, next));
router.delete('/:id/media/:mediaId', authenticate, authorize(['ong_admin', 'ong_volunteer']), (req, res, next) => controller.removeMedia(req, res, next));
```
- Importar `uploadMiddleware` de `~/shared/middlewares/upload.middleware`
- Importar novos schemas do validator

---

### Fase 6 — File Storage & Upload Middleware

#### `file-storage.service.ts` *(create)*
```ts
export interface FileStorageService {
  save(file: Express.Multer.File): Promise<string>;
  remove(url: string): Promise<void>;
}
```
Implementação `LocalFileStorage`:
- Diretório: `uploads/animals/` relativo ao root do backend
- Criar diretório se não existe (`fs.mkdirSync recursive`)
- Nome do arquivo: `${crypto.randomUUID()}-${file.originalname}`
- Move de `file.path` (multer tmp) para destino final
- URL retornada: `/uploads/animals/${filename}`
- `remove(url)`: resolve path absoluto a partir da URL relativa, `fs.unlinkSync`
- Exportar instância singleton: `export const fileStorage = new LocalFileStorage()`

#### `upload.middleware.ts` *(create)*
- `multer({ dest: path.join(process.cwd(), 'uploads/tmp/') })`
- `limits: { fileSize: 50 * 1024 * 1024 }` (50MB — vídeo HD 30s)
- `fileFilter`: aceitar mimetypes `['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']`; rejeitar com erro 422 outros
- Exportar: `export const uploadMiddleware = multer(config).single('file')`

---

### Fase 7 — Frontend Types & Service

#### `animal-management.types.ts` *(modify)* — frontend
Adicionar ao arquivo existente (manter `CreateAnimalInput`, `AnimalCreatedResponse`, `CreateAnimalResult`):
```ts
export interface AnimalMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  sort_order: number;
}

export type AnimalStatus = 'available' | 'in_adoption_process' | 'adopted' | 'inactive';

export interface AnimalDetail {
  id: string;
  ong_id: string;
  name: string;
  species: Species;
  breed: string;
  sex: AnimalSex;
  castration: Castration;
  temperament: Temperament[];
  estimated_age_category: EstimatedAgeCategory;
  size: AnimalSize | null;
  weight_kg: number | null;
  height_cm: number | null;
  length_cm: number | null;
  special_needs: boolean;
  special_needs_description: string | null;
  rescue_observations: string | null;
  general_observations: string | null;
  status: AnimalStatus;
  created_at: string;
  updated_at: string;
  inactivated_at: string | null;
  media: AnimalMedia[];
}

export interface AnimalListItem {
  id: string;
  name: string;
  species: Species;
  breed: string;
  status: AnimalStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAnimalInput extends CreateAnimalInput {
  updated_at: string;
}

export interface AnimalListFilters {
  status?: AnimalStatus | 'all';
  page: number;
  limit: number;
}

export interface AnimalListResponse {
  data: AnimalListItem[];
  pagination: { page: number; limit: number; total: number };
}
```

#### `animal-management.service.ts` *(modify)* — frontend
**Reference pattern**: método `create` existente + `audit-log.service.ts` (padrão axios com interceptor).
Adicionar ao objeto `animalManagementService`:
- `list(filters: AnimalListFilters): Promise<AnimalListResponse>` — `GET /` com `{ params: filters }`
- `findById(id: string): Promise<{ data: AnimalDetail }>` — `GET /${id}`
- `update(id: string, input: UpdateAnimalInput): Promise<{ data: AnimalDetail }>` — `PUT /${id}` com body
- `inactivate(id: string): Promise<void>` — `PATCH /${id}/inactivate`
- `uploadMedia(id: string, file: File, type: 'photo' | 'video'): Promise<{ data: AnimalMedia }>` — `POST /${id}/media` com `FormData` (append `file` e `type`)
- `removeMedia(id: string, mediaId: string): Promise<void>` — `DELETE /${id}/media/${mediaId}`

---

### Fase 8 — Frontend Shared Components

#### `AnimalForm.tsx` *(create)*
**Reference pattern**: `src/pages/ong/AnimalCreatePage.tsx` (extrair o form existente).
**Props**:
```ts
interface AnimalFormProps {
  initialValues?: Partial<CreateAnimalInput>;
  onSubmit: (values: CreateAnimalInput) => Promise<void>;
  loading: boolean;
  mode: 'create' | 'edit';
  disabled?: boolean;
}
```
**Differences from reference**:
- Todas as constantes de options (`speciesOptions`, `sexOptions`, etc.) movidas para cá
- Form Ant Design completo com mesmos campos e validações do `AnimalCreatePage`
- Se `mode === 'edit'`: botão submit diz "Salvar Alterações"
- Se `mode === 'create'`: botão submit diz "Cadastrar"
- Se `disabled === true`: todos os Form.Item com `disabled`, sem botão submit
- Não contém lógica de submit/error/navigation — isso fica na page caller

#### `AnimalMediaSection.tsx` *(create)*
**Reference pattern**: nenhum componente similar existe — criar do zero.
**Props**:
```ts
interface AnimalMediaSectionProps {
  animalId: string;
  media: AnimalMedia[];
  disabled?: boolean;
  onMediaChange: () => void;
}
```
**Comportamento**:
- Card Ant Design com título "Mídia"
- Grid de fotos: `Row` + `Col` com `Image` do Ant Design (preview nativo)
- Player de vídeo: tag `<video>` com `controls`
- Botão "Adicionar foto" (`Upload` do Ant Design, `accept="image/jpeg,image/png,image/webp"`) — disabled se `media.filter(m => m.type === 'photo').length >= 3`
- Botão "Adicionar vídeo" (`Upload`, `accept="video/mp4,video/quicktime"`) — disabled se já tem 1 vídeo
- Cada mídia: botão `DeleteOutlined` com `Popconfirm` ("Remover esta mídia?")
- Upload: chama `animalManagementService.uploadMedia(animalId, file, type)` → `onMediaChange()`
- Remove: chama `animalManagementService.removeMedia(animalId, mediaId)` → `onMediaChange()`
- Se `disabled`: não renderiza botões add/remove
- Mensagens de erro/sucesso via `message` do Ant Design

#### `InactivateConfirmModal.tsx` *(create)*
**Reference pattern**: `src/components/ong-management/DeactivateConfirmModal.tsx`
**Differences from reference**:
- Props: `animalId: string | null`, `animalName: string`, `visible: boolean`, `onClose: () => void`, `onSuccess: () => void`
- Título: "Inativar Animal"
- Corpo: "Deseja realmente inativar este animal? Ele será removido do catálogo público."
- onConfirm: `await animalManagementService.inactivate(animalId)` → `message.success('Animal inativado com sucesso. O registro foi preservado no histórico.')` → `onSuccess()`
- onError: `message.error(error.response?.data?.error?.message || 'Erro ao inativar animal.')`

#### `AnimalAuditLogModal.tsx` *(create)*
**Reference pattern**: `src/pages/ong/AuditLogPage.tsx` (padrão Table + filtros).
**Differences from reference**:
- `Modal` ou `Drawer` ao invés de page
- Props: `animalId: string`, `visible: boolean`, `onClose: () => void`
- Auto-fetch ao abrir: `auditLogService.list({ entity: 'animal', entity_id: animalId, page: 1, limit: 50 })`
- Colunas: Data/Hora, Usuário (`user_name`), Ação, Campos Alterados
- Coluna "Campos Alterados": renderiza `metadata.changed_fields` como lista `<ul>`: `{campo}: {old} → {new}`
- Paginação simples (prev/next)

---

### Fase 9 — Frontend Pages & Routes

#### `AnimalListPage.tsx` *(modify — rewrite completo)*
**Reference pattern**: padrão Ant Design Table com filtros (ver `AuditLogPage.tsx` para Table pattern).
**Comportamento**:
- Cabeçalho: título "Animais" + botão "Cadastrar Animal" (mantido)
- Filtro por status: `Select` acima da tabela com opções: "Disponível", "Em Processo", "Adotado", "Inativos", "Todos" — default não inclui inativos (sem filtro = server exclui inativos)
- Table colunas: Foto (Avatar com fallback), Nome, Espécie, Raça, Status (Tag/Badge com cor), Ações
- Status badge: available=`green`, in_adoption_process=`orange`, adopted=`blue`, inactive=`default`(gray)
- Paginação do Table controlada (page, limit, total do backend)
- Coluna Ações (Space):
  - Se `status ∈ ['available', 'in_adoption_process']`: `<Button>Editar</Button>` → `navigate(/ong/animals/${id}/edit)`
  - Se `status ∈ ['adopted', 'inactive']`: `<Button>Visualizar</Button>` → `navigate(/ong/animals/${id})`
  - Se `status ∈ ['available', 'adopted']` AND `role === 'ong_admin'`: `<Button danger>Inativar</Button>` → abre `InactivateConfirmModal`
  - Se `role === 'ong_admin'`: `<Button>Auditoria</Button>` → abre `AnimalAuditLogModal`
- Acessar `role` via `useAuth()` hook existente
- State para `InactivateConfirmModal`: `{ visible, animalId, animalName }`
- State para `AnimalAuditLogModal`: `{ visible, animalId }`
- Após inativação com sucesso: recarregar lista

#### `AnimalEditPage.tsx` *(create)*
**Reference pattern**: `src/pages/ong/AnimalCreatePage.tsx`
**Differences from reference**:
- `useParams<{ id: string }>()` para pegar ID
- `useEffect` ao montar: `animalManagementService.findById(id)` → armazenar em state
- Se `animal.status` !== `'available'` && !== `'in_adoption_process'` → `navigate(/ong/animals/${id}, { replace: true })`
- Loading state enquanto busca animal
- Renderiza `<AnimalForm mode="edit" initialValues={animal} onSubmit={handleSubmit} loading={saving} />`
- Abaixo do form: `<AnimalMediaSection animalId={id} media={animal.media} onMediaChange={refetchAnimal} />`
- `handleSubmit`: `await animalManagementService.update(id, { ...values, updated_at: animal.updated_at })`
- Erro 409: `message.error('Os dados foram alterados por outro usuário. Recarregue a página e tente novamente.')` + `refetchAnimal()`
- Erro 422: exibir `error.response.data.error.message`
- Sucesso: `message.success('Dados do animal atualizados com sucesso.')` → `navigate('/ong/animals')`
- Botão "Voltar" → `/ong/animals`

#### `AnimalDetailPage.tsx` *(create)*
**Reference pattern**: mesmo layout do `AnimalEditPage`.
**Differences from reference**:
- Usa `<AnimalForm disabled mode="edit" initialValues={animal} onSubmit={async () => {}} loading={false} />`
- `<AnimalMediaSection animalId={id} media={animal.media} disabled />`
- Título: `animal.name` + `<Tag>{statusLabel}</Tag>`
- Se `role === 'ong_admin'`: botão "Histórico de Alterações" → abre `AnimalAuditLogModal`
- Sem botão submit/save

#### `AnimalCreatePage.tsx` *(modify)*
- Substituir o form inline (campos + constantes) por `<AnimalForm mode="create" onSubmit={handleSubmit} loading={loading} />`
- Manter lógica de submit, error handling, navegação e duplicateWarning na page
- Remover constantes de options que agora vivem em `AnimalForm`

#### `routes/index.tsx` *(modify)*
Dentro do bloco existente `RoleRoute allowedRoles={['ong_volunteer', 'ong_admin']}` + `OngLayout`, após `<Route path="/ong/animals/create" ...>`:
```tsx
<Route path="/ong/animals/:id/edit" element={<AnimalEditPage />} />
<Route path="/ong/animals/:id" element={<AnimalDetailPage />} />
```
Importar `AnimalEditPage` e `AnimalDetailPage`.

---

### Fase 10 — Testes

#### `animal-management.service.spec.ts` *(modify — expandir)*
**Reference pattern**: testes existentes do `create` no mesmo arquivo.
Cenários obrigatórios:
- `update` com campos alterados → retorna animal atualizado + auditoria com `changed_fields`
- `update` sem campos alterados → retorna animal sem gerar auditoria
- `update` em animal com status `adopted` → lança `AnimalNotEditableError`
- `update` com `updated_at` divergente → lança `ConcurrencyConflictError`
- `update` em animal de outra ONG → lança `AnimalNotFoundError`
- `inactivate` animal `available` → sucesso, status `inactive`
- `inactivate` animal `in_adoption_process` → lança `CannotInactivateError`
- `uploadMedia` foto dentro do limite → sucesso
- `uploadMedia` foto excedendo limite → lança `MediaLimitExceededError`
- `removeMedia` mídia de outro animal → erro

#### `animal-management.update.spec.ts` *(create)*
**Reference pattern**: `tests/integration/animal-management.create.spec.ts`
Cenários:
- PUT `/api/v1/animal-management/:id` com campos válidos → 200 + body com AnimalDetail
- PUT com status adopted → 422 + error code `ANIMAL_NOT_EDITABLE`
- PUT com updated_at divergente → 409 + error code `CONFLICT`
- PUT sem autenticação → 401
- PUT em animal de outra ONG → 404
- PATCH `/:id/inactivate` com `ong_admin` → 200
- PATCH `/:id/inactivate` com `ong_volunteer` → 403
- PATCH `/:id/inactivate` em animal `in_adoption_process` → 422
- POST `/:id/media` com foto (dentro do limite) → 201 + body com AnimalMedia
- POST `/:id/media` com foto (excedeu 3) → 422
- DELETE `/:id/media/:mediaId` → 204

#### `AnimalEditPage.spec.tsx` *(create)*
Cenários mínimos:
- Renderiza form preenchido com dados do animal
- Submit com sucesso → `message.success` + navegação
- Erro 409 (concorrência) → `message.error` com texto apropriado

---

## Acceptance Criteria

- [ ] **Given** voluntário acessa listagem de animais, **When** página carrega, **Then** Table exibe animais da ONG com status, foto, nome, espécie, raça e ações.
- [ ] **Given** animal com status `available`, **When** voluntário clica "Editar", **Then** formulário preenchido com dados atuais é exibido.
- [ ] **Given** voluntário altera peso de 5.0 para 6.5 e salva, **When** PUT é processado, **Then** peso atualizado no DB e audit_log gerado com `changed_fields: { weight_kg: { old: 5.0, new: 6.5 } }`.
- [ ] **Given** voluntário salva sem alterar nenhum campo, **When** PUT é processado, **Then** nenhum audit_log é gerado.
- [ ] **Given** animal com status `adopted`, **When** voluntário acessa detalhes, **Then** formulário exibido em modo read-only, sem botão editar.
- [ ] **Given** dois voluntários editam o mesmo animal, **When** o segundo salva com `updated_at` antigo, **Then** resposta 409 com mensagem de conflito.
- [ ] **Given** animal com 2 fotos, **When** voluntário adiciona 1 foto válida, **Then** animal fica com 3 fotos e mídia aparece imediatamente.
- [ ] **Given** animal com 3 fotos, **When** voluntário tenta adicionar mais 1, **Then** upload rejeitado com mensagem de limite.
- [ ] **Given** animal com status `available`, **When** admin clica "Inativar" e confirma, **Then** animal recebe status `inactive` e desaparece da listagem default.
- [ ] **Given** animal com status `in_adoption_process`, **When** admin tenta inativar, **Then** ação bloqueada com mensagem explicativa.
- [ ] **Given** voluntário, **When** visualiza listagem, **Then** botão "Inativar" NÃO está no DOM (não oculto por style).
- [ ] **Given** admin acessa histórico de animal editado, **When** modal abre, **Then** lista de alterações exibida com usuário, data/hora e campos alterados.
- [ ] **Given** voluntário, **When** acessa detalhes do animal, **Then** botão "Histórico de Alterações" NÃO está no DOM.
- [ ] **Given** voluntário de ONG-A, **When** tenta acessar animal de ONG-B via URL, **Then** resposta 404 (isolamento multi-tenant).
- [ ] **Given** filtro "inativos" selecionado na listagem, **When** carrega, **Then** apenas animais com status `inactive` são exibidos.

---

## Authorization

- `ong_admin` + `ong_volunteer` → list, findById, update, uploadMedia, removeMedia — enforced via `authorize` middleware
- `ong_admin` only → inactivate endpoint (403 para volunteer) — enforced via `authorize(['ong_admin'])`
- Frontend: botão "Inativar" e botão "Auditoria" renderizados apenas se `role === 'ong_admin'` (ausente do DOM, não hidden)
- Multi-tenant: toda query filtra por `ong_id` extraído do JWT; animal de outra ONG retorna 404 (nunca 403)

---

## API Notes

| Endpoint | Method | Success | Key Errors |
|---|---|---|---|
| `/api/v1/animal-management` | GET | 200 `{ data: AnimalListItem[], pagination }` | 401, 403 |
| `/api/v1/animal-management/:id` | GET | 200 `{ data: AnimalDetail }` | 401, 403, 404 |
| `/api/v1/animal-management/:id` | PUT | 200 `{ data: AnimalDetail }` | 401, 403, 404, 409 (conflict), 422 (not editable / validation) |
| `/api/v1/animal-management/:id/inactivate` | PATCH | 200 `{ data: { id, status, inactivated_at } }` | 401, 403, 404, 422 (cannot inactivate) |
| `/api/v1/animal-management/:id/media` | POST | 201 `{ data: AnimalMedia }` | 401, 403, 404, 422 (limit / invalid type) |
| `/api/v1/animal-management/:id/media/:mediaId` | DELETE | 204 | 401, 403, 404 |

- PUT body: `UpdateAnimalInput` — inclui `updated_at` para concorrência otimista
- POST media: `multipart/form-data` com field `file` (binary) e field `type` (`'photo'` | `'video'`)
- Validação de query: middleware `validate(schema, 'query')` para GET list

---

## Dependencies

- **Requires**: FEATURE-001 cadastro de animal (completo), MODULE-002 auth/authorize (completo), migration `013_create_animal_media_table` (já aplicada)
- **Blocks**: FEATURE-003 (Atualização de Status do Animal), futuro migration para S3 storage
- **Blocks**: [TASK-ID] ([what depends on this])