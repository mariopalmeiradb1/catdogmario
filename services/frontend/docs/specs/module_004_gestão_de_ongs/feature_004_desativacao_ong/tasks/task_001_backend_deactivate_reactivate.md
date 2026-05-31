# TASK-BACKEND-004 — Backend Deactivate/Reactivate ONG

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-004-backend-deactivate-reactivate`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_004_desativacao_ong/spec_context.md`
**Part**: 4 of 5 — Deactivation business logic
**Generated**: 2026-05-31

---

## Context

Implementa desativação e reativação de ONGs pelo Admin do Sistema. A desativação é uma operação atômica: muda status para 'inactive', oculta animais do catálogo, cancela pedidos de adoção ativos, invalida sessões de todos os usuários da ONG e notifica adotantes afetados por e-mail. A reativação restaura status para 'approved' sem restaurar automaticamente animais ao catálogo. Modifica o login para bloquear usuários de ONGs inativas.
Ver spec: `.makuco/specs/module_004_gestão_de_ongs/feature_004_desativacao_ong/spec_context.md`.

---

## Scope

**In:**
- Implementar métodos no repository: `cancelActiveAdoptionRequests`, `findAffectedAdopters`, `revokeOngUsersSessions`, `setDeactivatedAt`
- Implementar métodos no service: `deactivate`, `reactivate`
- Implementar handlers no controller: `deactivate`, `reactivate`
- Template de e-mail para adotantes (pedido cancelado por desativação)
- Alterar `auth.service.ts` → `login` para verificar ONG inativa para roles `ong_admin` e `ong_volunteer`
- Adicionar `OngInactiveError` em auth.errors (ou reusar de ong-management.errors)

**Out:**
- Não enviar e-mail à ONG sobre desativação/reativação (spec define que não há notificação à ONG)
- Não implementar desativação automática por inatividade
- Não transferir animais entre ONGs
- Não alterar frontend
- Não criar testes de integração nesta task

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/ong-management/ong-management.repository.ts` | queries desativação |
| `modify` | `src/domains/ong-management/ong-management.service.ts` | lógica deactivate/reactivate |
| `modify` | `src/domains/ong-management/ong-management.controller.ts` | handlers |
| `modify` | `src/shared/services/mail/mail.templates.ts` | template pedido cancelado |
| `modify` | `src/domains/auth/auth.service.ts` | login check ONG inativa |
| `modify` | `src/domains/auth/auth.errors.ts` | OngInactiveError |

---

## Implementation

### `ong-management.repository.ts` *(modify)*

**Reference pattern**: métodos já existentes neste arquivo
**Differences from reference**:
- `cancelActiveAdoptionRequests(ongId: string)`: UPDATE adoption_requests SET status = 'cancelled', updated_at = NOW() WHERE ong_id = ? AND status IN ('pending', 'in_analysis', 'in_progress'). Retorna número de rows affected.
- `findAffectedAdopters(ongId: string)`: SELECT adoption_requests.id, users.email, users.name, animals.name as animal_name FROM adoption_requests JOIN users ON users.id = adoption_requests.adopter_id JOIN animals ON animals.id = adoption_requests.animal_id WHERE adoption_requests.ong_id = ? AND adoption_requests.status IN ('pending', 'in_analysis', 'in_progress'). Retorna array. **Importante**: chamar ANTES de cancelar os pedidos.
- `revokeOngUsersSessions(ongId: string)`: UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id IN (SELECT id FROM users WHERE ong_id = ? AND is_active = true). Retorna void.
- `deactivateOngUsers(ongId: string)`: UPDATE users SET is_active = false, updated_at = NOW() WHERE ong_id = ? — desativa os usuários para que mesmo com token válido não passem no login.
- `reactivateOngUsers(ongId: string)`: UPDATE users SET is_active = true, updated_at = NOW() WHERE ong_id = ?
- `setDeactivatedAt(ongId: string)`: UPDATE ongs SET deactivated_at = NOW(), updated_at = NOW() WHERE id = ?
- `clearDeactivatedAt(ongId: string)`: UPDATE ongs SET deactivated_at = NULL, updated_at = NOW() WHERE id = ?

### `ong-management.service.ts` *(modify)*

**Reference pattern**: métodos existentes (approve, reject)
**Differences from reference**:
- `deactivate(ongId: string, adminUserId: string)`:
  1. Buscar ONG via `repository.findById(ongId)` — throw `OngNotFoundError` se null
  2. Verificar status é 'approved' ou 'pending' — throw `InvalidOngStatusTransitionError` se não
  3. **Buscar adotantes afetados ANTES** de cancelar (para ter dados do e-mail): `repository.findAffectedAdopters(ongId)`
  4. Executar em sequência (mesma transação via Knex transaction):
     - `repository.updateStatus(ongId, 'inactive', ['approved', 'pending'])`
     - `repository.setDeactivatedAt(ongId)`
     - `repository.cancelActiveAdoptionRequests(ongId)`
     - `repository.revokeOngUsersSessions(ongId)`
     - `repository.deactivateOngUsers(ongId)`
  5. Após commit: enviar e-mails aos adotantes afetados (fire-and-forget, não bloqueia resposta)
- `reactivate(ongId: string, adminUserId: string)`:
  1. Buscar ONG via `repository.findById(ongId)` — throw `OngNotFoundError` se null
  2. Verificar status é 'inactive' — throw `InvalidOngStatusTransitionError` se não
  3. `repository.updateStatus(ongId, 'approved', ['inactive'])`
  4. `repository.clearDeactivatedAt(ongId)`
  5. `repository.reactivateOngUsers(ongId)`
  6. Animais permanecem como estão — NÃO restaurar ao catálogo

**Nota sobre transação Knex**: usar `db.transaction(async (trx) => { ... })` passando `trx` aos métodos do repository. Adicionar overload nos métodos do repository que aceita `trx?: Knex.Transaction` como último parâmetro opcional.

### `ong-management.controller.ts` *(modify)*

**Reference pattern**: handlers existentes
**Differences from reference**:
- `deactivate`: extrair `id` de `req.params`, chamar `service.deactivate(id, req.user.userId)`, retornar 200 com `{ message: 'ONG desativada com sucesso.' }`
- `reactivate`: extrair `id` de `req.params`, chamar `service.reactivate(id, req.user.userId)`, retornar 200 com `{ message: 'ONG reativada com sucesso. O administrador da ONG já pode acessar o sistema.' }`

### `mail.templates.ts` *(modify)*

**Reference pattern**: funções existentes (buildApprovalEmail, buildRejectionEmail)
**Differences from reference**:
- Adicionar `buildAdoptionCancelledEmail(adopterName: string, animalName: string, ongName: string): string` — HTML: "Olá {adopterName}, seu pedido de adoção de {animalName} foi cancelado porque a ONG {ongName} encerrou suas atividades na plataforma."

### `auth.service.ts` *(modify)*

**Changes**:
- No método `login`, expandir a verificação de ONG status para cobrir TODOS os roles vinculados a ONG (`ong_admin` E `ong_volunteer`):
  - Condição atual: `if (user.role === Roles.ONG_ADMIN && user.ong_id)`
  - Alterar para: `if ((user.role === Roles.ONG_ADMIN || user.role === Roles.ONG_VOLUNTEER) && user.ong_id)`
  - Dentro do bloco, após buscar a ONG:
    - Se `ong.status === 'inactive'` → throw `OngInactiveError()`
    - Se `ong.status !== 'approved'` → throw `OngPendingApprovalError()` (mantém comportamento existente)

### `auth.errors.ts` *(modify)*

**Changes**:
- Adicionar:
  ```typescript
  export class OngInactiveError extends AppError {
    constructor() {
      super(403, 'ONG_INACTIVE', 'Sua organização está inativa na plataforma. Entre em contato com o suporte para mais informações.');
    }
  }
  ```

---

## Acceptance Criteria

- [ ] **Given** ONG aprovada com 2 pedidos 'pending' e 1 'completed', **When** admin desativa, **Then** status='inactive', 2 pedidos cancelados, pedido 'completed' inalterado, adotantes notificados, sessions revogadas.
- [ ] **Given** ONG desativada, **When** ong_admin tenta login com credenciais válidas, **Then** retorna 403 ONG_INACTIVE com mensagem específica.
- [ ] **Given** ONG desativada, **When** ong_volunteer tenta login, **Then** retorna 403 ONG_INACTIVE.
- [ ] **Given** ONG inativa, **When** admin faz PATCH /:id/reactivate, **Then** status='approved', ong_admin pode fazer login novamente.
- [ ] **Given** ONG reativada, **When** consulto catálogo, **Then** animais permanecem invisíveis (não restaurados automaticamente).
- [ ] **Given** ONG já inativa, **When** admin tenta desativar novamente, **Then** retorna erro (status inválido para transição).
- [ ] **Given** ONG aprovada, **When** admin tenta reativar, **Then** retorna erro (apenas inativa pode ser reativada).
- [ ] **Given** admin cancela modal no frontend, **When** request não é enviada, **Then** nenhum efeito colateral (comportamento do frontend, validado pela ausência de request).
- [ ] **Given** ONG desativada, **When** token de refresh do ong_admin é usado, **Then** token está revogado e retorna 401.
- [ ] **Given** desativação em andamento, **When** ocorre erro parcial, **Then** transação faz rollback e nenhum estado intermediário é persistido.

---

## API Notes

| Method | Path | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| PATCH | `/api/v1/ong-management/:id/deactivate` | system_admin | — | 200 { message } | 401, 403, 404, 409, 422 |
| PATCH | `/api/v1/ong-management/:id/reactivate` | system_admin | — | 200 { message } | 401, 403, 404, 422 |

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (migrations + domain skeleton), TASK-BACKEND-002 (repository base + status update methods)
- **Blocks**: TASK-FRONTEND-003 (admin pages — deactivate/reactivate buttons)
