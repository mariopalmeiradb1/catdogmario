# TASK-BACKEND-005 — Backend edição de perfil + visualização voluntário (testes)

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-005-backend-edicao-perfil`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_002_edicao_perfil_adotante/spec_context.md`
**Part**: 1 of 2 — Backend e testes da edição
**Generated**: `2026-06-03`

## Context

Os endpoints `PUT /me` e `GET /:id` já foram criados em TASK-BACKEND-002. Esta task adiciona testes de integração específicos para edição e para visualização mascarada pelo voluntário, e ajusta o service para registrar auditoria detalhada (campo alterado, valor anterior, valor novo).

## Scope

**In:**
- Ajustar `adopter-management.service.ts` para registrar audit log detalhado na edição (campos alterados)
- Testes de integração para PUT /me com cenários de edição
- Testes de integração para GET /:id com cenários de mascaramento e isolamento multi-tenant

**Out:**
- Não criar novos endpoints — já existem de TASK-002.
- Não implementar frontend (TASK-006).
- Não implementar versionamento completo do perfil.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/domains/adopter-management/adopter-management.service.ts` | audit log detalhado na edição |
| `create` | `tests/integration/adopter-management.edit-profile.spec.ts` | testes edição perfil |
| `create` | `tests/integration/adopter-management.volunteer-view.spec.ts` | testes view voluntário |

## Implementation

### `adopter-management.service.ts` *(modify)*

**Reference pattern**: padrão de audit já usado no `create`

**Differences from reference**:
- No `updateMyProfile`: antes de atualizar, buscar perfil atual. Comparar campos alterados. Registrar audit log com `metadata: { changes: [{ field, old_value, new_value }] }`.
- Recalcular idade se `birth_date` mudou → throw `UnderageAdopterError` se < 18.

### `adopter-management.edit-profile.spec.ts` *(create)*

**Reference pattern**: `tests/integration/adoption-requests.create.spec.ts`

**Differences from reference**:
- Endpoint: `PUT /api/v1/adopter-management/me`
- Setup: criar perfil via POST antes de cada teste
- Cenários:
  - 200: alterar telefone → novo valor persiste
  - 200: alterar endereço completo → dados atualizados
  - 200: enviar body com campo `cpf` → campo ignorado, CPF não muda
  - 422: alterar birth_date para idade < 18 → rejeitado
  - 200: alterar "has_current_animals" de true para false → description limpa
  - 200: sem alterações no body (mesmos dados) → 200 sem erro
  - 401: sem token → rejeitado
  - Verificar audit_logs registra campos alterados

### `adopter-management.volunteer-view.spec.ts` *(create)*

**Reference pattern**: `tests/integration/adoption-requests.list.spec.ts`

**Differences from reference**:
- Endpoint: `GET /api/v1/adopter-management/:adopterId`
- Setup: criar adotante com perfil + criar pedido de adoção na ONG do voluntário
- Cenários:
  - 200: voluntário da ONG vê perfil, CPF no formato `***.XXX.XXX-**`
  - 200: RG mascarado (últimos 4 visíveis)
  - 403: voluntário de outra ONG (sem pedido vinculado) → acesso negado
  - 200: admin da ONG também pode visualizar
  - 401: sem autenticação → rejeitado

## Acceptance Criteria

- [ ] PUT /me atualiza campos e gera audit log com detalhes das mudanças.
- [ ] PUT /me ignora campo `cpf` no body.
- [ ] PUT /me rejeita data de nascimento que resulta em < 18 anos.
- [ ] GET /:id retorna CPF mascarado para voluntário (`***.XXX.XXX-**`).
- [ ] GET /:id retorna 403 quando voluntário não tem pedido vinculado àquele adotante na sua ONG.
- [ ] Todos os testes passam.

## Dependencies

- **Requires**: TASK-BACKEND-001, TASK-BACKEND-002.
- **Blocks**: TASK-FRONTEND-006 (frontend edição).
