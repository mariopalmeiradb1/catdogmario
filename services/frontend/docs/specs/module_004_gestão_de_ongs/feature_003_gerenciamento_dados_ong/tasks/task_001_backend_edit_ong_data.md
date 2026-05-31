# TASK-BACKEND-003 — Backend Edit ONG Data (ONG Admin + System Admin)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-003-backend-edit-ong-data`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_003_gerenciamento_dados_ong/spec_context.md`
**Part**: 3 of 5 — Edit business logic
**Generated**: 2026-05-31

---

## Context

Implementa a edição de dados da ONG por dois perfis distintos: o Administrador da ONG (campos restritos — sem Nome e CNPJ) e o Administrador do Sistema (todos os campos). Inclui validação de CNPJ único ao editar e endpoint separado para cada perfil.
Ver spec: `.makuco/specs/module_004_gestão_de_ongs/feature_003_gerenciamento_dados_ong/spec_context.md`.

---

## Scope

**In:**
- Implementar métodos no repository: `updateOngData`, `findOngByCnpjExcluding`, `findOngByUserId`
- Implementar métodos no service: `updateByOngAdmin`, `updateBySystemAdmin`, `getMyOngDetail`
- Implementar handlers no controller: `getMyOng`, `updateMyOng` e `updateByAdmin`
- Validação de CNPJ único (Admin Sistema) antes de salvar
- Adicionar rota `GET /my-ong` (ong_admin) no routes para o frontend consumir

**Out:**
- Não implementar upload de fotos (infraestrutura pendente — adiado)
- Não implementar desativação/reativação (TASK-BACKEND-004)
- Não alterar frontend
- Não criar testes de integração nesta task

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/ong-management/ong-management.repository.ts` | queries de update |
| `modify` | `src/domains/ong-management/ong-management.service.ts` | lógica de edição |
| `modify` | `src/domains/ong-management/ong-management.controller.ts` | handlers update |

---

## Implementation

### `ong-management.repository.ts` *(modify)*

**Reference pattern**: métodos já implementados neste arquivo (TASK-BACKEND-002)
**Differences from reference**:
- `updateOngData(id: string, data: Partial<UpdateOngAdminInput>)`: UPDATE ongs SET ...data, updated_at = NOW() WHERE id = ?. Aceita qualquer subset de campos. Retorna void.
- `findOngByCnpjExcluding(cnpj: string, excludeId: string)`: SELECT id FROM ongs WHERE cnpj = ? AND id != ?. Retorna `{ id: string } | null`.
- `findOngByUserId(userId: string)`: SELECT ongs.* FROM ongs JOIN users ON users.ong_id = ongs.id WHERE users.id = ? AND users.role = 'ong_admin'. Retorna `OngDetail | null`.

### `ong-management.service.ts` *(modify)*

**Reference pattern**: métodos existentes (listPending, approve, reject)
**Differences from reference**:
- `updateByOngAdmin(userId: string, data: UpdateOngInput)`:
  1. Buscar ONG do usuário via `repository.findOngByUserId(userId)`
  2. Se null → throw `OngNotFoundError`
  3. Se ONG status !== 'approved' → throw `InvalidOngStatusTransitionError` (ONG precisa estar aprovada para editar)
  4. Chamar `repository.updateOngData(ong.id, data)` — dados já filtrados pelo Zod schema (sem `name` e `cnpj`)
  5. Retornar ONG atualizada via `repository.findById(ong.id)`
- `updateBySystemAdmin(ongId: string, data: UpdateOngAdminInput)`:
  1. Buscar ONG via `repository.findById(ongId)`
  2. Se null → throw `OngNotFoundError`
  3. Se `data.cnpj` presente e diferente do atual → verificar unicidade via `findOngByCnpjExcluding(data.cnpj, ongId)`. Se duplicado → throw `CnpjDuplicateError`
  4. Chamar `repository.updateOngData(ongId, data)`
  5. Retornar ONG atualizada via `repository.findById(ongId)`

### `ong-management.controller.ts` *(modify)*

**Reference pattern**: handlers existentes (list, approve, reject)
**Differences from reference**:
- Handler `updateMyOng` para rota `PUT /my-ong` (ong_admin):
  - Extrair dados de `req.body`, chamar `service.updateByOngAdmin(req.user.userId, req.body)`
  - Retornar 200 com `{ message: 'Dados atualizados com sucesso.', data: ong }`
- Handler `updateByAdmin` para rota `PUT /:id` (system_admin):
  - Extrair `id` de `req.params` e dados de `req.body`
  - Chamar `service.updateBySystemAdmin(id, req.body)`
  - Retornar 200 com `{ message: 'Dados atualizados com sucesso.', data: ong }`

---

## Acceptance Criteria

- [ ] **Given** ong_admin autenticado com ONG aprovada, **When** faz PUT /api/v1/ong-management/my-ong com phone e description válidos, **Then** dados são atualizados e retorna 200.
- [ ] **Given** ong_admin autenticado, **When** envia `name` ou `cnpj` no body, **Then** validação Zod (updateOngSchema) rejeita — retorna 422.
- [ ] **Given** ong_admin com ONG status 'pending', **When** tenta editar, **Then** retorna erro (ONG precisa estar aprovada).
- [ ] **Given** system_admin, **When** faz PUT /api/v1/ong-management/:id com CNPJ válido e único, **Then** dados são atualizados incluindo name e cnpj.
- [ ] **Given** system_admin altera CNPJ para um já existente em outra ONG, **When** tenta salvar, **Then** retorna 409 CnpjDuplicateError.
- [ ] **Given** description com 49 caracteres, **When** qualquer perfil tenta salvar, **Then** retorna 422 validation error.
- [ ] **Given** capacity = 0, **When** tenta salvar, **Then** retorna 422.
- [ ] **Given** instagram = "http://google.com", **When** tenta salvar, **Then** retorna 422 (URL deve conter "instagram.com").
- [ ] **Given** whatsapp = "123", **When** tenta salvar, **Then** retorna 422 (deve ter 10-11 dígitos).

---

## API Notes

| Method | Path | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| PUT | `/api/v1/ong-management/my-ong` | ong_admin | UpdateOngInput | 200 { message, data } | 401, 403, 404, 422 |
| PUT | `/api/v1/ong-management/:id` | system_admin | UpdateOngAdminInput | 200 { message, data } | 401, 403, 404, 409, 422 |

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (domain skeleton + validators), TASK-BACKEND-002 (repository base methods)
- **Blocks**: TASK-FRONTEND-004 (ONG profile page depends on PUT /my-ong endpoint)
