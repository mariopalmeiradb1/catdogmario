# TASK-FRONTEND-004 — Frontend cadastro de adotante

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-004-frontend-cadastro`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_001_cadastro_adotante/spec_context.md`
**Part**: 4 of 4 — Frontend cadastro
**Generated**: `2026-06-03`

## Context

Implementar a página e formulário de cadastro de adotante no frontend. O fluxo é interceptado quando o adotante tenta criar um pedido de adoção sem ter perfil — o backend retorna 422 com código `ADOPTER_PROFILE_REQUIRED` e o frontend redireciona para a tela de cadastro.

## Scope

**In:**
- Service API para o domain adopter-management
- Tipos TypeScript para o frontend
- Hook `useAdopterProfile`
- Página de cadastro (`AdopterRegistrationPage`)
- Formulário de cadastro (`AdopterRegistrationForm`)
- Interceptor que redireciona para cadastro ao receber `ADOPTER_PROFILE_REQUIRED`

**Out:**
- Não implementar edição de perfil (task da FEATURE-002).
- Não implementar histórico (task da FEATURE-003).
- Não implementar consulta de CEP via API externa — campos de endereço são preenchidos manualmente.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/services/adopter-management.service.ts` | API client do domínio |
| `create` | `src/types/adopter-management.types.ts` | interfaces frontend |
| `create` | `src/hooks/useAdopterProfile.ts` | hook de estado do perfil |
| `create` | `src/pages/adopter/AdopterRegistrationPage.tsx` | página de cadastro |
| `create` | `src/components/adopter-management/AdopterRegistrationForm.tsx` | formulário completo |
| `modify` | `src/routes/` | adicionar rota /cadastro-adotante |

## Implementation

### `adopter-management.service.ts` *(create)*

**Reference pattern**: `src/services/adoption-requests.service.ts`

**Differences from reference**:
- `createProfile(data: CreateAdopterProfileInput): Promise<AdopterProfile>`
- `getMyProfile(): Promise<AdopterProfile>`
- `updateMyProfile(data: UpdateAdopterProfileInput): Promise<AdopterProfile>`
- Base URL: `/api/v1/adopter-management`

### `adopter-management.types.ts` *(create)*

**Reference pattern**: `src/types/` (qualquer arquivo de tipos existente)

**Differences from reference**:
- Interface `AdopterProfile`: id, user_id, full_name, cpf, rg, birth_date, phone, cep, street, number, complement, neighborhood, city, state, has_current_animals, current_animals_description, had_animals_before, previous_animals_description, status, created_at, updated_at
- Interface `CreateAdopterProfileInput`: todos os campos menos id, user_id, status, timestamps
- Interface `UpdateAdopterProfileInput`: mesmo que Create sem cpf

### `useAdopterProfile.ts` *(create)*

**Reference pattern**: `src/hooks/useAdopterRequests.ts` (se existir) ou padrão React Query

**Differences from reference**:
- `useAdopterProfile()`: query GET `/me` com key `['adopter-profile']`
- `useCreateAdopterProfile()`: mutation POST, invalida query após sucesso
- Retorna `{ profile, isLoading, createProfile, hasProfile }`

### `AdopterRegistrationPage.tsx` *(create)*

**Reference pattern**: páginas em `src/pages/adopter/`

**Differences from reference**:
- Layout: título "Cadastro de Adotante", subtítulo explicando que é necessário para prosseguir com adoção
- Renderiza `AdopterRegistrationForm`
- Após sucesso: redireciona para a URL armazenada em query param `?redirect=` ou para `/catalogo`
- Se já tem perfil (via hook): redireciona automaticamente

### `AdopterRegistrationForm.tsx` *(create)*

**Reference pattern**: formulários existentes no projeto (ex: componentes em `src/components/`)

**Differences from reference**:
- Formulário com todos os 17 campos da spec
- Campo e-mail pré-preenchido e desabilitado (vem do contexto de auth)
- Campos condicionais: "Quais e quantos animais possui?" visível apenas quando `has_current_animals === true`; "Quais animais já teve?" visível apenas quando `had_animals_before === true`
- Máscaras: CPF (999.999.999-99), telefone ((99) 99999-9999), CEP (99999-999)
- Validação client-side com Zod: CPF algorítmico, idade ≥ 18, campos obrigatórios
- UF: select com 27 opções
- Botão submit: "Cadastrar e continuar"
- Exibir mensagens de erro da API (CPF duplicado, etc.) em toast ou inline

## Acceptance Criteria

- [ ] Adotante sem perfil que tenta solicitar adoção é redirecionado para página de cadastro.
- [ ] Formulário exibe todos os 17 campos conforme spec.
- [ ] E-mail é pré-preenchido e não-editável.
- [ ] Campos condicionais aparecem/desaparecem conforme toggle Sim/Não.
- [ ] Máscara de CPF, telefone e CEP funciona corretamente.
- [ ] Validação client-side rejeita CPF inválido (111.111.111-11) antes de enviar.
- [ ] Validação client-side rejeita idade < 18.
- [ ] Após cadastro bem-sucedido, redirecionamento funciona.
- [ ] Erros da API (CPF duplicado, etc.) são exibidos ao usuário.
- [ ] Formulário responsivo em mobile (viewport ≥ 320px).

## Dependencies

- **Requires**: TASK-BACKEND-002 (endpoints disponíveis).
- **Blocks**: Nenhum diretamente, mas FEATURE-002 frontend depende deste service.
