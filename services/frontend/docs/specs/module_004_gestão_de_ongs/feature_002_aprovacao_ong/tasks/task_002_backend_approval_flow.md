# TASK-BACKEND-002 — Backend Approval Flow (List, Approve, Reject, In-Review)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-002-backend-approval-flow`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_002_aprovacao_ong/spec_context.md`
**Part**: 2 of 5 — Approval business logic
**Generated**: 2026-05-31

---

## Context

Implementa a lógica de negócio completa de aprovação de ONGs: listagem com filtros/paginação, detalhamento, transições de status (in_review, approved, rejected), bloqueio de 10 dias para re-cadastro, envio de e-mails de aprovação/rejeição e controle de concorrência. Altera o fluxo de registro de ONG para verificar bloqueio.
Ver spec: `.makuco/specs/module_004_gestão_de_ongs/feature_002_aprovacao_ong/spec_context.md`.

---

## Scope

**In:**
- Implementar métodos no repository: `listPending`, `findById`, `updateStatus`, `createRejection`, `findRecentRejection`, `findByIdForConcurrency`
- Implementar métodos no service: `listPending`, `getDetail`, `markInReview`, `approve`, `reject`
- Implementar handlers no controller: `list`, `getDetail`, `markInReview`, `approve`, `reject`
- Templates de e-mail de aprovação e rejeição em `mail.templates.ts`
- Alterar `auth.service.ts` → `registerOng` para verificar bloqueio de 10 dias (CNPJ e e-mail)
- Adicionar `OngRegistrationBlockedError` em `auth.errors.ts`

**Out:**
- Não implementar edição de ONG (TASK-BACKEND-003)
- Não implementar desativação/reativação (TASK-BACKEND-004)
- Não alterar login flow (isso está em TASK-BACKEND-004)
- Não criar testes de integração (serão criados junto com o frontend ou em task dedicada)
- Não alterar frontend

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/ong-management/ong-management.repository.ts` | implementar queries |
| `modify` | `src/domains/ong-management/ong-management.service.ts` | regras de negócio |
| `modify` | `src/domains/ong-management/ong-management.controller.ts` | handlers HTTP |
| `modify` | `src/shared/services/mail/mail.templates.ts` | templates aprovação/rejeição |
| `modify` | `src/domains/auth/auth.service.ts` | bloqueio 10 dias no registro |
| `modify` | `src/domains/auth/auth.errors.ts` | novo erro de bloqueio |

---

## Implementation

### `ong-management.repository.ts` *(modify)*

**Reference pattern**: `src/domains/auth/auth.repository.ts` (padrão de queries Knex)
**Differences from reference**:
- `listPending(filters: OngListFilters)`: query na tabela `ongs` com WHERE status IN ('pending', 'in_review'), filtros dinâmicos (status, state, city, dateFrom/dateTo em created_at), orderBy created_at ASC, paginação offset-based. Retorna `PaginatedResult<OngListItem>`. Usar `count(*)` separado para total.
- `findById(id: string)`: retorna `OngDetail | null` — SELECT * FROM ongs WHERE id = ?
- `findByIdForConcurrency(id: string)`: retorna `{ id, status, updated_at }` — usado para verificar concorrência antes de salvar
- `updateStatus(id: string, status: OngStatus, expectedCurrentStatus: OngStatus[])`: UPDATE ongs SET status = ?, updated_at = NOW() WHERE id = ? AND status IN (?). Retorna número de rows affected. Se 0 rows → conflito de concorrência.
- `createRejection(data: { ong_id, reason?, rejected_by, rejected_at })`: INSERT na tabela `ong_rejections`
- `findRecentRejection(cnpj: string, email: string)`: busca em `ong_rejections` JOIN `ongs` ON ong_id JOIN `users` ON ong_id WHERE (ongs.cnpj = ? OR users.email = ?) AND rejected_at > NOW() - 10 days. Retorna `OngRejection | null`.
- `updateOngRejectedAt(id: string)`: UPDATE ongs SET rejected_at = NOW(), updated_at = NOW() WHERE id = ?

### `ong-management.service.ts` *(modify)*

**Reference pattern**: `src/domains/auth/auth.service.ts` (estrutura de métodos com validação → repo → side-effects)
**Differences from reference**:
- `listPending(filters)`: delega direto para repository
- `getDetail(id)`: busca por ID, throw `OngNotFoundError` se null
- `markInReview(ongId, adminUserId)`: verificar status atual é 'pending' via `updateStatus(id, 'in_review', ['pending'])`. Se 0 rows → throw `OngStatusConflictError`
- `approve(ongId, adminUserId)`: `updateStatus(id, 'approved', ['pending', 'in_review'])`. Se 0 rows → throw `OngStatusConflictError`. Buscar e-mail do ong_admin via JOIN users. Enviar e-mail de aprovação via `mailService.send()`.
- `reject(ongId, adminUserId, reason?)`: `updateStatus(id, 'rejected', ['pending', 'in_review'])`. Se 0 rows → throw `OngStatusConflictError`. Criar registro em `ong_rejections`. Atualizar `rejected_at` na ONG. Buscar e-mail do ong_admin. Enviar e-mail de rejeição com motivo (se informado) e data de liberação (rejected_at + 10 dias).

### `ong-management.controller.ts` *(modify)*

**Reference pattern**: `src/domains/auth/auth.controller.ts`
**Differences from reference**:
- `list`: extrair filters de `req.query`, chamar `service.listPending(filters)`, retornar 200 com resultado paginado
- `getDetail`: extrair `id` de `req.params`, chamar `service.getDetail(id)`, retornar 200
- `markInReview`: extrair `id` de `req.params`, chamar `service.markInReview(id, req.user.userId)`, retornar 200 com `{ message: 'ONG marcada como Em Análise.' }`
- `approve`: extrair `id` de `req.params`, chamar `service.approve(id, req.user.userId)`, retornar 200 com `{ message: 'ONG aprovada com sucesso. Um e-mail com instruções de acesso foi enviado.' }`
- `reject`: extrair `id` de `req.params` e `reason` de `req.body`, chamar `service.reject(id, req.user.userId, reason)`, retornar 200 com `{ message: 'ONG rejeitada. A notificação foi enviada por e-mail.' }`

### `mail.templates.ts` *(modify)*

**Reference pattern**: funções `buildConfirmationEmail` e `buildPasswordResetEmail` existentes
**Differences from reference**:
- Adicionar `buildApprovalEmail(ongName: string, loginUrl: string): string` — HTML com assunto implícito: "Seu cadastro no CatDog Mário foi aprovado!". Conteúdo: parabéns, instruções para acessar o sistema via `loginUrl`.
- Adicionar `buildRejectionEmail(ongName: string, reason: string | null, retryDate: string): string` — assunto implícito: "Seu cadastro no CatDog Mário não foi aprovado". Conteúdo: informar rejeição, incluir motivo se fornecido, informar data de liberação para nova tentativa.

### `auth.service.ts` *(modify)*

**Changes**:
- No método `registerOng`, após verificar e-mail e CNPJ duplicados, adicionar verificação de bloqueio:
  - Importar `ongManagementRepository` de `~/domains/ong-management/ong-management.repository`
  - Chamar `ongManagementRepository.findRecentRejection(data.cnpj, data.email)`
  - Se resultado não-null: throw `OngRegistrationBlockedError(retryDate)` — onde `retryDate` = `rejection.rejected_at + 10 dias`, formatada como DD/MM/YYYY

### `auth.errors.ts` *(modify)*

**Changes**:
- Adicionar classe `OngRegistrationBlockedError`:
  ```typescript
  export class OngRegistrationBlockedError extends AppError {
    constructor(retryDate: string) {
      super(403, 'ONG_REGISTRATION_BLOCKED', `Este CNPJ/e-mail teve um cadastro recusado recentemente. Um novo cadastro poderá ser enviado a partir de ${retryDate}.`);
    }
  }
  ```

---

## Acceptance Criteria

- [ ] **Given** 3 ONGs com status 'pending' e 1 com 'in_review', **When** admin faz GET /api/v1/ong-management/, **Then** retorna 4 itens paginados ordenados por created_at ASC.
- [ ] **Given** filtro `status=pending`, **When** admin faz GET com query param, **Then** retorna apenas ONGs com status 'pending'.
- [ ] **Given** ONG com status 'pending', **When** admin faz PATCH /:id/in-review, **Then** status muda para 'in_review' e retorna mensagem de sucesso.
- [ ] **Given** ONG com status 'pending', **When** admin faz PATCH /:id/approve, **Then** status muda para 'approved' e e-mail de aprovação é enviado ao admin da ONG.
- [ ] **Given** ONG com status 'in_review', **When** admin faz PATCH /:id/approve, **Then** status muda para 'approved'.
- [ ] **Given** ONG com status 'pending', **When** admin faz PATCH /:id/reject com reason "Dados incompletos", **Then** status muda para 'rejected', registro em `ong_rejections` criado com reason, e-mail enviado com motivo e data de liberação.
- [ ] **Given** ONG com status 'pending', **When** admin faz PATCH /:id/reject sem reason, **Then** rejeição funciona normalmente sem motivo no e-mail.
- [ ] **Given** reason com 501 caracteres, **When** admin tenta rejeitar, **Then** retorna 422 validation error.
- [ ] **Given** ONG já aprovada, **When** admin tenta PATCH /:id/approve novamente, **Then** retorna 409 OngStatusConflictError.
- [ ] **Given** ONG rejeitada há 5 dias, **When** mesmo CNPJ tenta novo cadastro via POST /api/v1/auth/register/ong, **Then** retorna 403 com mensagem de bloqueio e data de liberação.
- [ ] **Given** ONG rejeitada há 11 dias, **When** mesmo CNPJ tenta novo cadastro, **Then** cadastro é permitido normalmente.
- [ ] **Given** ONG rejeitada há 5 dias, **When** mesmo e-mail (CNPJ diferente) tenta cadastro, **Then** retorna 403 com bloqueio.

---

## API Notes

| Method | Path | Auth | Body/Query | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/v1/ong-management/` | system_admin | query: status, state, city, dateFrom, dateTo, page, limit | 200 PaginatedResult | 401, 403 |
| GET | `/api/v1/ong-management/:id` | system_admin | — | 200 OngDetail | 401, 403, 404 |
| PATCH | `/api/v1/ong-management/:id/in-review` | system_admin | — | 200 { message } | 401, 403, 404, 409 |
| PATCH | `/api/v1/ong-management/:id/approve` | system_admin | — | 200 { message } | 401, 403, 404, 409 |
| PATCH | `/api/v1/ong-management/:id/reject` | system_admin | { reason?: string } | 200 { message } | 401, 403, 404, 409, 422 |

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (domain skeleton + migrations)
- **Blocks**: TASK-FRONTEND-003 (admin pages depend on these endpoints)