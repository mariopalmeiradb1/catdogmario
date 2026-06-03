# TASK-FRONTEND-006 — Frontend edição de perfil + view voluntário

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-006-frontend-edicao-perfil`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_002_edicao_perfil_adotante/spec_context.md`
**Part**: 2 of 2 — Frontend edição e visualização
**Generated**: `2026-06-03`

## Context

Implementar a página "Meu Perfil" para o adotante editar seus dados, e a página de visualização do perfil do adotante pelo voluntário (acessada via detalhe do pedido de adoção). O service e tipos base já foram criados em TASK-FRONTEND-004.

## Scope

**In:**
- Página "Meu Perfil" do adotante (visualização + edição inline)
- Hook `useUpdateAdopterProfile` (mutation)
- Componente de visualização do perfil pelo voluntário (dados mascarados, somente leitura)
- Rota no painel do voluntário para visualizar perfil do adotante

**Out:**
- Não alterar service base (já existe de TASK-004).
- Não implementar histórico (FEATURE-003).
- Não implementar edição de e-mail (responsabilidade do módulo de autenticação).
- Não notificar ONG quando perfil é editado.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/pages/adopter/AdopterProfilePage.tsx` | página "Meu Perfil" |
| `create` | `src/components/adopter-management/AdopterProfileForm.tsx` | formulário edição |
| `create` | `src/pages/ong/AdopterProfileViewPage.tsx` | view pelo voluntário |
| `create` | `src/components/adopter-management/AdopterProfileView.tsx` | componente somente leitura |
| `modify` | `src/hooks/useAdopterProfile.ts` | adicionar mutation update |
| `modify` | `src/routes/` | adicionar rotas |

## Implementation

### `AdopterProfilePage.tsx` *(create)*

**Reference pattern**: páginas existentes em `src/pages/adopter/`

**Differences from reference**:
- Estado: modo "visualização" (default) e modo "edição"
- Botão "Editar" → habilita campos editáveis
- Botão "Salvar" (habilitado só quando há dirty fields) e "Cancelar"
- Cancelar com dirty fields → modal de confirmação "Você tem alterações não salvas. Deseja descartar?"
- Feedback: toast de sucesso/erro conforme mensagens da spec

### `AdopterProfileForm.tsx` *(create)*

**Reference pattern**: `src/components/adopter-management/AdopterRegistrationForm.tsx` (TASK-004)

**Differences from reference**:
- Recebe dados atuais como `defaultValues`
- CPF: campo desabilitado (read-only, cinza)
- E-mail: campo desabilitado (read-only, cinza)
- Todos os demais campos: editáveis quando em modo edição
- Mesmas validações do cadastro (Zod), exceto CPF que não é enviado
- Submit chama `updateMyProfile` do service (PUT /me)
- Detectar "nenhuma alteração" → toast "Nenhuma alteração foi realizada."

### `AdopterProfileViewPage.tsx` *(create)*

**Reference pattern**: páginas em `src/pages/ong/`

**Differences from reference**:
- Recebe `adopterId` da URL (param)
- Chama `GET /api/v1/adopter-management/:id`
- Renderiza `AdopterProfileView` com dados mascarados
- Link "Voltar" retorna ao detalhe do pedido

### `AdopterProfileView.tsx` *(create)*

**Reference pattern**: componentes de detalhe existentes

**Differences from reference**:
- Todos os campos em modo somente leitura
- CPF exibido como `***.XXX.XXX-**` (já vem mascarado do backend)
- RG mascarado (já vem mascarado do backend)
- Seção "Resumo de adoções" com total de pedidos e adoções concluídas (dados vêm do endpoint)

### `useAdopterProfile.ts` *(modify)*

**Differences from reference**:
- Adicionar `useUpdateAdopterProfile()`: mutation PUT `/me`, invalida query `['adopter-profile']` no sucesso
- Adicionar `useAdopterProfileById(id: string)`: query GET `/:id` com key `['adopter-profile', id]` (para voluntário)

## Acceptance Criteria

- [ ] Adotante acessa "Meu Perfil" e vê todos os dados preenchidos.
- [ ] CPF e e-mail são exibidos como somente leitura (visualmente desabilitados).
- [ ] Ao clicar "Editar", campos editáveis são habilitados.
- [ ] Ao salvar com alterações válidas, toast "Perfil atualizado com sucesso." aparece.
- [ ] Ao salvar sem alteração, toast "Nenhuma alteração foi realizada." aparece.
- [ ] Ao cancelar com dirty fields, modal de confirmação aparece.
- [ ] Voluntário acessa perfil do adotante e vê CPF/RG mascarados.
- [ ] Formulário responsivo (mobile ≥ 320px).

## Dependencies

- **Requires**: TASK-FRONTEND-004 (service e tipos), TASK-BACKEND-005 (endpoints testados).
- **Blocks**: Nenhum.
