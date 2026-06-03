# TASK-BACKEND-003 — Testes unitários e de integração do adopter-management

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-003-backend-tests`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_001_cadastro_adotante/spec_context.md`
**Part**: 3 of 4 — Testes backend
**Generated**: `2026-06-03`

## Context

Implementar testes unitários para o service e testes de integração para os endpoints do domain `adopter-management`. Os testes de CPF e masking já foram criados em TASK-001.

## Scope

**In:**
- Teste unitário do service (`adopter-management.service.spec.ts`)
- Testes de integração: create, update, view
- Cobertura mínima de 80% do service

**Out:**
- Não alterar código de produção.
- Testes de `cpf.util` e `data-masking.util` já feitos em TASK-001.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `tests/unit/adopter-management.service.spec.ts` | testes unitários do service |
| `create` | `tests/integration/adopter-management.create.spec.ts` | integração criação perfil |
| `create` | `tests/integration/adopter-management.update.spec.ts` | integração atualização perfil |
| `create` | `tests/integration/adopter-management.view.spec.ts` | integração visualização voluntário |

## Implementation

### `adopter-management.service.spec.ts` *(create)*

**Reference pattern**: `tests/unit/adoption-requests.service.spec.ts`

**Differences from reference**:
- Mock do repository (`adopter-management.repository`)
- Mock do `recordAuditLog`
- Cenários `create`:
  - Sucesso com dados válidos
  - Falha: usuário já tem perfil → `AdopterProfileAlreadyExistsError`
  - Falha: CPF inválido → `InvalidCpfError`
  - Falha: CPF duplicado → `CpfAlreadyRegisteredError`
  - Falha: idade < 18 → `UnderageAdopterError`
  - Borda: exatamente 18 anos hoje → sucesso
- Cenários `updateMyProfile`:
  - Sucesso atualiza campos
  - Falha: nova data nascimento resulta em < 18 → `UnderageAdopterError`
- Cenários `getProfileForVolunteer`:
  - Sucesso retorna dados mascarados
  - Falha: sem pedido na ONG → `UnauthorizedProfileAccessError`

### `adopter-management.create.spec.ts` *(create)*

**Reference pattern**: `tests/integration/adoption-requests.create.spec.ts`

**Differences from reference**:
- Endpoint: `POST /api/v1/adopter-management`
- Auth: token de adotante
- Cenários:
  - 201: criação com dados válidos completos
  - 409: CPF duplicado
  - 422: CPF inválido (111.111.111-11)
  - 422: idade < 18
  - 409: usuário já tem perfil (segundo POST)
  - 422: campos obrigatórios ausentes
  - 401: sem autenticação

### `adopter-management.update.spec.ts` *(create)*

**Reference pattern**: `tests/integration/adoption-requests.create.spec.ts`

**Differences from reference**:
- Endpoint: `PUT /api/v1/adopter-management/me`
- Pré-condição: perfil já existe (inserir via POST antes)
- Cenários:
  - 200: atualizar telefone e endereço
  - 200: não aceitar CPF no body (campo ignorado)
  - 422: data nascimento resulta em < 18

### `adopter-management.view.spec.ts` *(create)*

**Reference pattern**: `tests/integration/adoption-requests.list.spec.ts`

**Differences from reference**:
- Endpoint: `GET /api/v1/adopter-management/:id`
- Pré-condição: adotante com perfil + pedido de adoção na ONG do voluntário
- Cenários:
  - 200: voluntário vê perfil com CPF mascarado (`***.XXX.XXX-**`)
  - 200: voluntário vê perfil com RG mascarado
  - 403: voluntário sem pedido na ONG tenta acessar
  - 401: sem autenticação

## Acceptance Criteria

- [ ] Todos os testes unitários passam (`npm test -- tests/unit/adopter-management`).
- [ ] Todos os testes de integração passam (`npm test -- tests/integration/adopter-management`).
- [ ] Cobertura do service ≥ 80%.
- [ ] Cenários de borda (idade exata 18, CPF all-same-digits) cobertos.
- [ ] Isolamento multi-tenant testado (voluntário de ONG A não vê adotante sem pedido na ONG A).

## Dependencies

- **Requires**: TASK-BACKEND-001 (migration + utils), TASK-BACKEND-002 (domain files).
- **Blocks**: Nenhum.
