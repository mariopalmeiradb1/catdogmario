# TASK-FRONTEND-002 — Frontend Auth UI: Scaffold + Páginas de Autenticação

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-002-frontend-auth-ui`
**Spec**: `.makuco/specs/module_002_autenticação_e_permissões/feature_001_autenticacao_permissoes/spec_context.md`
**Part**: 2 of 2 — Frontend
**Generated**: 2026-05-29

---

## Context

Implementar toda a camada frontend da feature de Autenticação e Permissões — scaffold do projeto React/Vite/Ant Design, contexto de autenticação, páginas de login/registro/confirmação/recuperação, layouts por role e guards de rota. Consome a API descrita em TASK-BACKEND-001. Projeto greenfield sem código existente.

---

## Scope

**In:**
- Scaffold do projeto frontend (package.json, Vite config, tsconfig, Ant Design, Axios, Vitest)
- Auth context/provider com state management, interceptor Axios para refresh automático
- Páginas: Login, Registro Adotante, Registro ONG, Confirmação Email, Esqueceu Senha, Verificar Código, Redefinir Senha
- Layouts: PublicLayout (card centralizado), AdopterLayout (top nav), OngLayout (menu lateral), AdminLayout (menu lateral)
- Routing com guards: PrivateRoute (requer auth), RoleRoute (requer role específico)
- Componentes reutilizáveis: Logo, PasswordInput (com toggle visibilidade)
- Páginas placeholder pós-login (CatalogPage, DashboardPage, OngListPage)
- Mensagens centralizadas em `utils/messages.ts`
- Testes com Vitest + React Testing Library (páginas de login e registro)

**Out:**
- Backend/API (coberto em TASK-BACKEND-001)
- Funcionalidades completas das páginas pós-login (catálogo, painel ONG, painel admin) — apenas placeholders
- Responsividade mobile completa (foco em desktop nesta fase)
- Internacionalização (i18n) — todas as strings são em português fixo
- Temas dark/light — apenas tema padrão Ant Design com customização de cores primárias

---

## Ubiquitous Language

| Termo de Negócio | Mapeamento no Código |
|---|---|
| Adotante | `role: 'adopter'`, redireciona para `/catalog` |
| Voluntário da ONG | `role: 'ong_volunteer'`, redireciona para `/ong/dashboard` |
| Administrador da ONG | `role: 'ong_admin'`, redireciona para `/ong/dashboard` |
| Administrador do Sistema | `role: 'system_admin'`, redireciona para `/admin/ongs` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `package.json` | dependências e scripts |
| `create` | `vite.config.ts` | config Vite + path alias |
| `create` | `tsconfig.json` | TypeScript config |
| `create` | `tsconfig.node.json` | config TS para Vite |
| `create` | `.eslintrc.js` | linting rules |
| `create` | `.prettierrc` | formatação |
| `create` | `.env.example` | variáveis de ambiente |
| `create` | `index.html` | HTML entry point |
| `create` | `src/main.tsx` | React root render |
| `create` | `src/App.tsx` | Router + providers |
| `create` | `src/vite-env.d.ts` | Vite types |
| `create` | `src/config/env.ts` | VITE_ env vars |
| `create` | `src/routes/index.tsx` | definições de rotas |
| `create` | `src/routes/PrivateRoute.tsx` | guard autenticação |
| `create` | `src/routes/RoleRoute.tsx` | guard por role |
| `create` | `src/contexts/AuthContext.tsx` | state auth + provider |
| `create` | `src/hooks/useAuth.ts` | shortcut AuthContext |
| `create` | `src/hooks/useApi.ts` | instância Axios |
| `create` | `src/services/auth.service.ts` | chamadas API auth |
| `create` | `src/pages/auth/LoginPage.tsx` | página de login |
| `create` | `src/pages/auth/RegisterAdopterPage.tsx` | registro adotante |
| `create` | `src/pages/auth/RegisterOngPage.tsx` | registro ONG |
| `create` | `src/pages/auth/ConfirmEmailPage.tsx` | confirmação email |
| `create` | `src/pages/auth/ForgotPasswordPage.tsx` | esqueceu senha |
| `create` | `src/pages/auth/VerifyCodePage.tsx` | verificar código |
| `create` | `src/pages/auth/ResetPasswordPage.tsx` | redefinir senha |
| `create` | `src/pages/adopter/CatalogPage.tsx` | placeholder catálogo |
| `create` | `src/pages/ong/DashboardPage.tsx` | placeholder painel ONG |
| `create` | `src/pages/admin/OngListPage.tsx` | placeholder painel admin |
| `create` | `src/components/layouts/PublicLayout.tsx` | layout auth (card) |
| `create` | `src/components/layouts/AdopterLayout.tsx` | layout adotante |
| `create` | `src/components/layouts/OngLayout.tsx` | layout ONG |
| `create` | `src/components/layouts/AdminLayout.tsx` | layout admin |
| `create` | `src/components/auth/LoginForm.tsx` | form login |
| `create` | `src/components/auth/RegisterAdopterForm.tsx` | form registro adotante |
| `create` | `src/components/auth/RegisterOngForm.tsx` | form registro ONG |
| `create` | `src/components/auth/ForgotPasswordForm.tsx` | form esqueceu senha |
| `create` | `src/components/auth/VerifyCodeForm.tsx` | form código |
| `create` | `src/components/auth/ResetPasswordForm.tsx` | form nova senha |
| `create` | `src/components/ui/Logo.tsx` | logo CatDog |
| `create` | `src/components/ui/PasswordInput.tsx` | input senha + toggle |
| `create` | `src/components/ui/LoadingSpinner.tsx` | spinner loading |
| `create` | `src/types/auth.types.ts` | tipos auth |
| `create` | `src/types/api.types.ts` | tipos API erro |
| `create` | `src/utils/messages.ts` | mensagens centralizadas |
| `create` | `src/utils/validators.ts` | regras validação frontend |
| `create` | `tests/pages/LoginPage.spec.tsx` | testes login |
| `create` | `tests/pages/RegisterAdopterPage.spec.tsx` | testes registro |
| `create` | `tests/components/LoginForm.spec.tsx` | testes form login |

---

## Implementation

### Projeto e Configuração

#### `package.json`
Dependências: `react`, `react-dom`, `react-router-dom`, `antd`, `@ant-design/icons`, `axios`.
Dependências dev: `typescript`, `@types/react`, `@types/react-dom`, `vite`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `eslint`, `prettier`.
Scripts: `dev` (vite), `build` (tsc && vite build), `preview` (vite preview), `test` (vitest), `test:coverage` (vitest --coverage).

#### `vite.config.ts`
- Plugin `@vitejs/plugin-react`.
- Resolve alias: `'~'` → `path.resolve(__dirname, './src')`.
- Server port: `5173`.
- Test config (Vitest inline): `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/test-setup.ts'`.

#### `.env.example`
```
VITE_API_URL=http://localhost:3000/api/v1
```

---

### Contexto e Hooks

#### `src/contexts/AuthContext.tsx`
Interface:
```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
```

Comportamento:
- No mount, faz `POST /auth/refresh` para tentar restaurar sessão (refresh token no cookie). Se sucesso, popula `user` e armazena `accessToken` em memória (variável, não localStorage). Se falha, `user = null`.
- `login`: chama `POST /auth/login`, armazena access_token em memória, decodifica payload para `user`, redireciona conforme role.
- `logout`: chama `POST /auth/logout`, limpa state.
- `isLoading = true` durante tentativa inicial de refresh no mount.

#### `src/hooks/useApi.ts`
- Cria instância Axios com `baseURL: env.VITE_API_URL`, `withCredentials: true`.
- Request interceptor: adiciona `Authorization: Bearer ${accessToken}` se disponível.
- Response interceptor: em 401, tenta `POST /auth/refresh`. Se sucesso, atualiza accessToken e retenta a request original. Se falha, chama `logout()`.
- **Importante:** Evitar loop infinito — se o 401 vier do próprio `/auth/refresh`, não retenta.

#### `src/hooks/useAuth.ts`
Wrapper simples: `useContext(AuthContext)` com throw se fora do provider.

---

### Routing

#### `src/routes/index.tsx`
Usa `react-router-dom` v6 com `createBrowserRouter` ou `<Routes>`:
```
/login                    → PublicLayout > LoginPage
/register                 → PublicLayout > RegisterAdopterPage
/register/ong             → PublicLayout > RegisterOngPage
/confirm-email/:token     → PublicLayout > ConfirmEmailPage
/forgot-password          → PublicLayout > ForgotPasswordPage
/verify-code              → PublicLayout > VerifyCodePage
/reset-password           → PublicLayout > ResetPasswordPage
/catalog                  → PrivateRoute > RoleRoute(['adopter']) > AdopterLayout > CatalogPage
/ong/dashboard            → PrivateRoute > RoleRoute(['ong_volunteer','ong_admin']) > OngLayout > DashboardPage
/admin/ongs               → PrivateRoute > RoleRoute(['system_admin']) > AdminLayout > OngListPage
```
Rota `/` redireciona para `/login`.
Rota catch-all (`*`) redireciona para `/login`.

#### `src/routes/PrivateRoute.tsx`
- Se `isLoading`, renderiza `LoadingSpinner`.
- Se `!isAuthenticated`, redireciona para `/login`.
- Caso contrário, renderiza `<Outlet />`.

#### `src/routes/RoleRoute.tsx`
- Props: `allowedRoles: string[]`.
- Se `user.role` não está em `allowedRoles`, redireciona para a home do role atual (usando mapa role→path).
- Caso contrário, renderiza `<Outlet />`.

---

### Layouts

#### `src/components/layouts/PublicLayout.tsx`
- Fundo cinza claro (`#f5f5f5`) com padrão sutil de paw prints e corações (CSS background-image ou SVG pattern).
- Card centralizado na tela: branco, `border-radius: 12px`, `box-shadow` suave, padding `40px`, `max-width: 480px`.
- Logo CatDog no topo do card.
- Renderiza `<Outlet />` dentro do card.

#### `src/components/layouts/AdopterLayout.tsx`
- Ant Design `Layout` com `Header` (top navigation bar).
- Header: Logo à esquerda, nome do usuário + botão Sair à direita.
- `Content` renderiza `<Outlet />`.

#### `src/components/layouts/OngLayout.tsx`
- Ant Design `Layout` com `Sider` (menu lateral colapsável) + `Content`.
- Sider: Logo no topo, menu com itens (por enquanto apenas "Solicitações" como placeholder).
- Header: nome do usuário + botão Sair.
- `Content` renderiza `<Outlet />`.

#### `src/components/layouts/AdminLayout.tsx`
- Mesmo padrão do `OngLayout`, mas menu com item "ONGs" como placeholder.

---

### Páginas e Forms

#### `src/pages/auth/LoginPage.tsx`
- Título: "Bem vindo!"
- Subtítulo: "Digite os seus dados de acesso no campo abaixo"
- Renderiza `<LoginForm />`.
- Links: "Esqueceu sua senha?" → `/forgot-password`, "Não tem uma conta? Cadastre-se" → `/register`.

#### `src/components/auth/LoginForm.tsx`
- Ant Design `Form` com campos: Email (`Input`), Senha (`PasswordInput`).
- Botão "Entrar" (`Button type="primary"` full-width, loading state).
- Validação frontend: email obrigatório e formato válido, senha obrigatória.
- OnSubmit: chama `login(email, password)` do AuthContext.
- Em erro da API: exibe mensagem via `message.error()` do Ant Design (mensagem vinda do campo `error.message` da response).

#### `src/pages/auth/RegisterAdopterPage.tsx`
- Título: "Criar conta"
- Renderiza `<RegisterAdopterForm />`.
- Link: "Já tem uma conta? Faça login" → `/login`.
- Link: "Sou uma ONG" → `/register/ong`.

#### `src/components/auth/RegisterAdopterForm.tsx`
- Campos: Nome (`Input`), Email (`Input`), Senha (`PasswordInput`), Confirmar Senha (`PasswordInput`).
- Validações (Ant Design `rules`):
  - Nome: required, min 3, max 100.
  - Email: required, tipo email.
  - Senha: required, min 8, pattern `/(?=.*[A-Z])(?=.*\d)/` com mensagem customizada.
  - Confirmar: required, deve igualar campo senha.
- OnSubmit: `POST /auth/register/adopter`. Sucesso → exibe `message.success()` com mensagem da API → redireciona para `/login` após 2s.
- Erro 409 (email duplicado): exibe mensagem no campo email via `form.setFields`.

#### `src/pages/auth/RegisterOngPage.tsx`
- Título: "Cadastrar ONG"
- Renderiza `<RegisterOngForm />`.
- Link: "Voltar para cadastro pessoal" → `/register`.

#### `src/components/auth/RegisterOngForm.tsx`
- Campos pessoais: Nome, Email, Senha, Confirmar Senha (mesmas regras do adotante).
- Campos ONG (seção separada com `Divider` "Dados da ONG"): Nome da ONG (`Input`, min 3, max 150), CNPJ (`Input` com máscara `XX.XXX.XXX/XXXX-XX`), Telefone (`Input` com máscara), Endereço (`Input`).
- OnSubmit: `POST /auth/register/ong`. Sucesso → `message.success()` → redireciona `/login` após 2s.
- Erros 409: mapear `EMAIL_ALREADY_EXISTS` e `CNPJ_ALREADY_EXISTS` para campos específicos.

#### `src/pages/auth/ConfirmEmailPage.tsx`
- Extrai `:token` da URL via `useParams`.
- No mount, chama `POST /auth/confirm-email { token }`.
- Estados: loading (spinner), sucesso (mensagem + link para login), erro (mensagem de erro + link para reenvio se expirado).
- Botão "Reenviar email de confirmação" (visível só em erro de expiração): abre campo de email e chama `/resend-confirmation`.

#### `src/pages/auth/ForgotPasswordPage.tsx`
- Título: "Recuperar senha"
- Renderiza `<ForgotPasswordForm />`.
- Link: "Voltar ao login" → `/login`.

#### `src/components/auth/ForgotPasswordForm.tsx`
- Campo: Email.
- OnSubmit: `POST /auth/forgot-password`. Sempre sucesso → `message.success('Enviamos um código...')` → redireciona para `/verify-code` passando email via state.

#### `src/pages/auth/VerifyCodePage.tsx`
- Recebe `email` do navigation state (se ausente, redireciona para `/forgot-password`).
- Renderiza `<VerifyCodeForm />`.

#### `src/components/auth/VerifyCodeForm.tsx`
- Campo: Código de 6 dígitos (Ant Design `Input.OTP` ou 6 inputs individuais).
- OnSubmit: `POST /auth/verify-reset-code { email, code }`. Sucesso → armazena `reset_token` em state → navega para `/reset-password`.
- Erro (código inválido/expirado): exibe mensagem via `message.error()`.

#### `src/pages/auth/ResetPasswordPage.tsx`
- Recebe `reset_token` do navigation state (se ausente, redireciona para `/forgot-password`).
- Renderiza `<ResetPasswordForm />`.

#### `src/components/auth/ResetPasswordForm.tsx`
- Campos: Nova Senha (`PasswordInput`), Confirmar Nova Senha (`PasswordInput`).
- Mesmas regras de senha do registro.
- OnSubmit: `POST /auth/reset-password { reset_token, password, password_confirmation }`. Sucesso → `message.success('Senha alterada com sucesso!')` → redireciona `/login` após 2s.

---

### Componentes UI

#### `src/components/ui/Logo.tsx`
- SVG ou imagem: silhueta de gato laranja (`#FF6B35`) + texto "CatDog" em cinza escuro (`#333`), separados por linha vertical fina.
- Props: `size?: 'sm' | 'md' | 'lg'` para variações de tamanho.

#### `src/components/ui/PasswordInput.tsx`
- Wrapper sobre Ant Design `Input.Password` (já possui toggle nativo de visibilidade com ícone de olho).
- Apenas re-exporta com props tipadas para consistência.

#### `src/components/ui/LoadingSpinner.tsx`
- Ant Design `Spin` centralizado na tela (full-page overlay durante auth loading).

---

### Services e Types

#### `src/services/auth.service.ts`
Funções exportadas (cada uma usa a instância Axios de `useApi`):
- `registerAdopter(data): Promise<{ message: string }>`
- `registerOng(data): Promise<{ message: string }>`
- `login(data): Promise<{ access_token: string, user: User }>`
- `confirmEmail(token): Promise<{ message: string }>`
- `resendConfirmation(email): Promise<{ message: string }>`
- `forgotPassword(email): Promise<{ message: string }>`
- `verifyResetCode(email, code): Promise<{ reset_token: string }>`
- `resetPassword(data): Promise<{ message: string }>`
- `refresh(): Promise<{ access_token: string, user: User }>`
- `logout(): Promise<void>`
- `getMe(): Promise<User>`

#### `src/types/auth.types.ts`
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'adopter' | 'ong_volunteer' | 'ong_admin' | 'system_admin';
  ong_id?: string | null;
}

interface LoginResponse {
  access_token: string;
  user: User;
}
```

#### `src/types/api.types.ts`
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
```

#### `src/utils/messages.ts`
Centraliza todas as mensagens mostradas ao usuário (as mesmas definidas na spec). Exporta objeto constante por categoria:
```typescript
export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: '...',
  REGISTER_ADOPTER_SUCCESS: 'Cadastro realizado! Verifique seu e-mail para ativar sua conta.',
  REGISTER_ONG_SUCCESS: 'Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação.',
  // ... todas as demais
};
```

#### `src/utils/validators.ts`
Regras de validação reutilizáveis para Ant Design Form rules:
- `nameRules`: required, min 3, max 100.
- `emailRules`: required, type email.
- `passwordRules`: required, min 8, pattern com uppercase e dígito.
- `cnpjRules`: required, pattern.
- `phoneRules`: required, pattern.

---

### Testes

#### `tests/pages/LoginPage.spec.tsx`
- Renderiza LoginPage com mocks de AuthContext e Router.
- Verifica presença de campos email/senha, botão "Entrar", links "Esqueceu senha" e "Cadastre-se".
- Simula submit com credenciais → verifica que `login()` do context foi chamado.
- Simula erro de API → verifica que mensagem de erro é exibida.

#### `tests/pages/RegisterAdopterPage.spec.tsx`
- Renderiza RegisterAdopterPage.
- Verifica campos: nome, email, senha, confirmar senha.
- Simula submit com dados válidos → verifica chamada ao service.
- Simula validação: senha fraca → mensagem de erro inline.
- Simula senhas divergentes → mensagem "As senhas não coincidem."

#### `tests/components/LoginForm.spec.tsx`
- Testa form isoladamente.
- Verifica toggle de visibilidade da senha (ícone de olho).
- Verifica loading state do botão durante submit.
- Verifica que campos estão required.

---

## Acceptance Criteria

- [ ] **Dado** que o frontend inicia, **Quando** acessado em `http://localhost:5173`, **Então** redireciona para `/login` e exibe a tela de login com logo, campos, botão e links.
- [ ] **Dado** usuário na tela de login, **Quando** clica "Cadastre-se", **Então** navega para `/register` com formulário de Adotante.
- [ ] **Dado** usuário na tela de registro, **Quando** clica "Sou uma ONG", **Então** navega para `/register/ong` com formulário expandido (dados pessoais + dados ONG).
- [ ] **Dado** formulário de registro com dados válidos, **Quando** submete, **Então** exibe mensagem de sucesso e redireciona para login após 2s.
- [ ] **Dado** erro 409 da API (email/CNPJ duplicado), **Quando** registro falha, **Então** exibe mensagem de erro inline no campo correspondente.
- [ ] **Dado** formulário com senha fraca (< 8 chars ou sem maiúscula/número), **Quando** tenta submeter, **Então** validação frontend bloqueia e exibe mensagem.
- [ ] **Dado** senhas não coincidem, **Quando** tenta submeter, **Então** exibe "As senhas não coincidem."
- [ ] **Dado** login com credenciais corretas (Adotante), **Quando** API retorna sucesso, **Então** redireciona para `/catalog`.
- [ ] **Dado** login com credenciais corretas (Voluntário ou Admin ONG), **Quando** API retorna sucesso, **Então** redireciona para `/ong/dashboard`.
- [ ] **Dado** login com credenciais corretas (Admin Sistema), **Quando** API retorna sucesso, **Então** redireciona para `/admin/ongs`.
- [ ] **Dado** erro de login (401/403), **Quando** API retorna erro, **Então** exibe mensagem retornada pela API via toast/message.
- [ ] **Dado** acesso a `/confirm-email/:token`, **Quando** token válido, **Então** exibe mensagem "E-mail confirmado com sucesso!" com link para login.
- [ ] **Dado** token expirado ou já usado, **Quando** API retorna erro, **Então** exibe mensagem adequada com opção de reenvio.
- [ ] **Dado** fluxo de recuperação de senha, **Quando** email submetido, **Então** exibe mensagem genérica e navega para tela de código.
- [ ] **Dado** código correto, **Quando** submetido, **Então** navega para tela de nova senha.
- [ ] **Dado** nova senha válida, **Quando** submetida, **Então** exibe "Senha alterada com sucesso!" e redireciona para login.
- [ ] **Dado** usuário não autenticado, **Quando** tenta acessar `/catalog`, `/ong/dashboard` ou `/admin/ongs`, **Então** redireciona para `/login`.
- [ ] **Dado** usuário autenticado com role=adopter, **Quando** tenta acessar `/admin/ongs`, **Então** redireciona para `/catalog` (sua home).
- [ ] **Dado** access token expirado, **Quando** próxima request falha com 401, **Então** Axios interceptor tenta refresh automático e retenta a request original.
- [ ] **Dado** refresh falha (token expirado/revogado), **Quando** interceptor falha, **Então** user é deslogado e redirecionado para `/login`.
- [ ] **Dado** campo de senha, **Quando** clica no ícone de olho, **Então** alterna entre exibir e ocultar a senha.
- [ ] Layouts diferenciados: PublicLayout (card centralizado), AdopterLayout (top nav), OngLayout (sidebar), AdminLayout (sidebar).
- [ ] Testes Vitest passando com cobertura ≥ 80% nos componentes de auth.

---

## Dependencies

- **Requires**: TASK-BACKEND-001 (API deve estar rodando para integração e2e; testes frontend podem usar mocks da API).
- **Blocks**: Nenhuma task subsequente imediata.
