# TASK-BACKEND-001 — Backend Auth API: Scaffold + Autenticação Completa

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-001-backend-auth-api`
**Spec**: `.makuco/specs/module_002_autenticação_e_permissões/feature_001_autenticacao_permissoes/spec_context.md`
**Part**: 1 of 2 — Backend
**Generated**: 2026-05-29

---

## Context

Implementar toda a camada backend da feature de Autenticação e Permissões do CatDog Mário — um projeto greenfield. Inclui scaffold do projeto Express/TypeScript, schema MySQL via Knex migrations, domínio auth completo (registro, login, confirmação de email, recuperação de senha, refresh de token) e testes. Este é o primeiro código do repositório; não há padrões existentes para referenciar.

---

## Scope

**In:**
- Scaffold do projeto backend (package.json, tsconfig, ESLint, Prettier, Jest, Knex, Docker Compose com MySQL)
- Migrations para as tabelas: `ongs`, `users`, `email_confirmations`, `password_resets`, `refresh_tokens`
- Seed do Administrador do Sistema
- Shared utilities: hash (bcrypt), token (JWT), crypto (randomBytes), date helpers
- Mail service com nodemailer + templates HTML estilizados (branding CatDog)
- Domínio auth completo: routes, controller, service, repository, validator (Zod)
- Middlewares: authenticate (JWT), authorize (role-based), error-handler, validate
- Todos os 11 endpoints da API de auth
- Testes de integração cobrindo os fluxos principais (≥80% coverage no domínio auth)

**Out:**
- Frontend (coberto em TASK-FRONTEND-002)
- Funcionalidades de gestão de ONGs (aprovação, edição, desativação) — apenas o status `pending/approved` é lido
- Gestão de voluntários — apenas o login do voluntário é suportado
- Catálogo de animais, pedidos de adoção, ou qualquer domínio além de auth
- CI/CD (GitHub Actions) — será configurado em task separada
- Rate limiting e proteção contra brute force (explicitamente fora do escopo da feature)

---

## Ubiquitous Language

| Termo de Negócio | Mapeamento no Código |
|---|---|
| Adotante | `role: 'adopter'` na tabela `users` |
| Voluntário da ONG | `role: 'ong_volunteer'` na tabela `users` |
| Administrador da ONG | `role: 'ong_admin'` na tabela `users` |
| Administrador do Sistema | `role: 'system_admin'` na tabela `users` |
| ONG pendente | `ongs.status = 'pending'` |
| ONG aprovada | `ongs.status = 'approved'` |
| Email confirmado | `users.email_confirmed_at IS NOT NULL` |
| Conta ativa | `users.is_active = true` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `package.json` | dependências e scripts |
| `create` | `tsconfig.json` | config TypeScript com path alias |
| `create` | `.eslintrc.js` | padrões de linting |
| `create` | `.prettierrc` | formatação de código |
| `create` | `jest.config.ts` | config de testes |
| `create` | `knexfile.ts` | config Knex multi-ambiente |
| `create` | `Dockerfile` | imagem do backend |
| `create` | `docker-compose.yml` | MySQL + backend dev |
| `create` | `.env.example` | variáveis de ambiente |
| `create` | `src/index.ts` | entry point |
| `create` | `src/app.ts` | factory do Express app |
| `create` | `src/config/env.ts` | loader de env vars |
| `create` | `src/config/database.ts` | instância Knex |
| `create` | `src/config/cors.ts` | config CORS |
| `create` | `src/database/migrations/20260529_001_create_ongs_table.ts` | schema ongs |
| `create` | `src/database/migrations/20260529_002_create_users_table.ts` | schema users |
| `create` | `src/database/migrations/20260529_003_create_email_confirmations_table.ts` | schema email confirmations |
| `create` | `src/database/migrations/20260529_004_create_password_resets_table.ts` | schema password resets |
| `create` | `src/database/migrations/20260529_005_create_refresh_tokens_table.ts` | schema refresh tokens |
| `create` | `src/database/seeds/001_system_admin.ts` | seed admin do sistema |
| `create` | `src/shared/utils/hash.util.ts` | bcrypt wrap |
| `create` | `src/shared/utils/token.util.ts` | JWT sign/verify |
| `create` | `src/shared/utils/crypto.util.ts` | random token/code gen |
| `create` | `src/shared/utils/date.util.ts` | cálculos de expiração |
| `create` | `src/shared/services/mail/mail.service.ts` | interface + implementação SMTP |
| `create` | `src/shared/services/mail/mail.templates.ts` | templates HTML email |
| `create` | `src/shared/services/mail/mail.types.ts` | tipos do mail payload |
| `create` | `src/shared/middlewares/authenticate.middleware.ts` | verificação JWT |
| `create` | `src/shared/middlewares/authorize.middleware.ts` | guard por role |
| `create` | `src/shared/middlewares/error-handler.middleware.ts` | handler global de erros |
| `create` | `src/shared/middlewares/validate.middleware.ts` | validação Zod |
| `create` | `src/shared/types/express.d.ts` | augment Request |
| `create` | `src/shared/types/common.types.ts` | tipos compartilhados |
| `create` | `src/shared/constants/roles.ts` | enum de roles |
| `create` | `src/shared/constants/http-status.ts` | constantes HTTP |
| `create` | `src/domains/auth/auth.routes.ts` | rotas auth |
| `create` | `src/domains/auth/auth.controller.ts` | handlers HTTP |
| `create` | `src/domains/auth/auth.service.ts` | lógica de negócio |
| `create` | `src/domains/auth/auth.repository.ts` | queries Knex |
| `create` | `src/domains/auth/auth.validator.ts` | schemas Zod |
| `create` | `src/domains/auth/auth.types.ts` | interfaces/DTOs |
| `create` | `src/domains/auth/auth.errors.ts` | erros do domínio |
| `create` | `tests/unit/auth.service.spec.ts` | testes unitários service |
| `create` | `tests/unit/token.util.spec.ts` | testes unitários token |
| `create` | `tests/unit/hash.util.spec.ts` | testes unitários hash |
| `create` | `tests/integration/auth.register.spec.ts` | testes registro |
| `create` | `tests/integration/auth.login.spec.ts` | testes login |
| `create` | `tests/integration/auth.confirm-email.spec.ts` | testes confirmação |
| `create` | `tests/integration/auth.password-reset.spec.ts` | testes recuperação senha |
| `create` | `tests/integration/auth.refresh-token.spec.ts` | testes refresh |

---

## Implementation

### Projeto e Configuração

#### `package.json`
Dependências de produção: `express`, `cors`, `helmet`, `knex`, `mysql2`, `bcrypt`, `jsonwebtoken`, `zod`, `nodemailer`, `uuid`, `dotenv`.
Dependências de dev: `typescript`, `@types/express`, `@types/cors`, `@types/bcrypt`, `@types/jsonwebtoken`, `@types/nodemailer`, `@types/uuid`, `ts-node`, `ts-jest`, `jest`, `@types/jest`, `supertest`, `@types/supertest`, `eslint`, `prettier`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`.
Scripts: `dev` (ts-node src/index.ts), `build` (tsc), `start` (node dist/index.js), `test` (jest), `test:coverage` (jest --coverage), `migrate` (knex migrate:latest), `migrate:rollback` (knex migrate:rollback), `seed` (knex seed:run).

#### `tsconfig.json`
- `target: ES2022`, `module: commonjs`, `outDir: ./dist`, `rootDir: ./src`
- Path alias: `"~/*": ["./src/*"]`
- `strict: true`, `esModuleInterop: true`, `resolveJsonModule: true`

#### `docker-compose.yml`
- Serviço `mysql`: imagem `mysql:8.0`, porta `3306`, volume persistente, env vars (`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=catdog_mario_dev`)
- Serviço `backend`: build contexto `.`, porta `3000:3000`, depends_on mysql, env_file `.env`

#### `.env.example`
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=catdog_mario_dev
JWT_SECRET=your-secret-key-min-32-chars-here!!
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY_DAYS=7
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
MAIL_FROM=noreply@catdogmario.com.br
FRONTEND_URL=http://localhost:5173
```

#### `src/config/env.ts`
Carrega `dotenv` e exporta objeto tipado com todas as variáveis. Valida presença das obrigatórias no startup (throw se ausente).

#### `src/config/database.ts`
Exporta instância Knex configurada a partir de `env.ts`. Usa connection pool padrão.

#### `src/config/cors.ts`
Exporta config do middleware `cors`: `origin: env.FRONTEND_URL`, `credentials: true`, `methods: ['GET','POST','PUT','DELETE','PATCH']`.

---

### Database Migrations

#### `20260529_001_create_ongs_table.ts`
```sql
id          CHAR(36) PK
name        VARCHAR(150) NOT NULL
cnpj        VARCHAR(18) NOT NULL UNIQUE
phone       VARCHAR(20) NOT NULL
address     VARCHAR(500) NOT NULL
status      ENUM('pending','approved','rejected','inactive') NOT NULL DEFAULT 'pending'
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### `20260529_002_create_users_table.ts`
```sql
id                  CHAR(36) PK
name                VARCHAR(100) NOT NULL
email               VARCHAR(255) NOT NULL UNIQUE
password_hash       VARCHAR(255) NOT NULL
role                ENUM('adopter','ong_volunteer','ong_admin','system_admin') NOT NULL
ong_id              CHAR(36) NULLABLE FK → ongs.id ON DELETE SET NULL
email_confirmed_at  TIMESTAMP NULLABLE
is_active           BOOLEAN NOT NULL DEFAULT TRUE
created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```
Indexes: `idx_users_email` (UNIQUE), `idx_users_ong_id`.

#### `20260529_003_create_email_confirmations_table.ts`
```sql
id          CHAR(36) PK
user_id     CHAR(36) NOT NULL FK → users.id ON DELETE CASCADE
token       VARCHAR(128) NOT NULL UNIQUE
used_at     TIMESTAMP NULLABLE
expires_at  TIMESTAMP NOT NULL
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```
Indexes: `idx_email_confirmations_token` (UNIQUE), `idx_email_confirmations_user_id`.

#### `20260529_004_create_password_resets_table.ts`
```sql
id          CHAR(36) PK
user_id     CHAR(36) NOT NULL FK → users.id ON DELETE CASCADE
code        VARCHAR(6) NOT NULL
used_at     TIMESTAMP NULLABLE
expires_at  TIMESTAMP NOT NULL
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```
Indexes: `idx_password_resets_user_id`, `idx_password_resets_code`.

#### `20260529_005_create_refresh_tokens_table.ts`
```sql
id          CHAR(36) PK
user_id     CHAR(36) NOT NULL FK → users.id ON DELETE CASCADE
token_hash  VARCHAR(255) NOT NULL UNIQUE
expires_at  TIMESTAMP NOT NULL
revoked_at  TIMESTAMP NULLABLE
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```
Indexes: `idx_refresh_tokens_token_hash` (UNIQUE), `idx_refresh_tokens_user_id`.

#### `src/database/seeds/001_system_admin.ts`
- Cria usuário com `role: 'system_admin'`, `email: 'admin@catdogmario.com.br'`, senha `Admin@123` (hash bcrypt), `email_confirmed_at: now()`, `is_active: true`.
- Usa `INSERT IGNORE` ou verifica existência antes de inserir (idempotente).

---

### Shared Utilities

#### `src/shared/utils/hash.util.ts`
- `hashPassword(plain: string): Promise<string>` — bcrypt hash com cost factor 12.
- `comparePassword(plain: string, hash: string): Promise<boolean>` — bcrypt compare.

#### `src/shared/utils/token.util.ts`
- `generateAccessToken(payload: TokenPayload): string` — JWT sign com `env.JWT_SECRET`, expiry `env.JWT_EXPIRY`.
- `verifyAccessToken(token: string): TokenPayload` — JWT verify, throw em falha.
- `TokenPayload`: `{ userId: string, role: string, ongId: string | null }`.

#### `src/shared/utils/crypto.util.ts`
- `generateConfirmationToken(): string` — `crypto.randomBytes(64).toString('hex')` (128 chars).
- `generateResetCode(): string` — 6 dígitos numéricos aleatórios (`crypto.randomInt(100000, 999999).toString()`).
- `hashToken(token: string): string` — SHA-256 do token (para armazenar refresh tokens no DB).

#### `src/shared/utils/date.util.ts`
- `addHours(date: Date, hours: number): Date`
- `addMinutes(date: Date, minutes: number): Date`
- `addDays(date: Date, days: number): Date`
- `isExpired(date: Date): boolean`

---

### Mail Service

#### `src/shared/services/mail/mail.service.ts`
- Interface `MailService` com `send(payload: MailPayload): Promise<void>`.
- Classe `SmtpMailService` implementa usando `nodemailer.createTransport` com config do `env.ts`.
- Em caso de erro no envio, loga o erro mas **não propaga** (não bloqueia o fluxo chamador).

#### `src/shared/services/mail/mail.templates.ts`
Duas funções exportadas:
- `buildConfirmationEmail(userName: string, confirmUrl: string): string` — HTML com branding CatDog (roxo `#6B4EFF`, laranja `#FF6B35`), logo, paw prints decorativos, botão de confirmação.
- `buildPasswordResetEmail(userName: string, code: string): string` — HTML com branding, exibe o código de 6 dígitos em destaque.

---

### Middlewares

#### `src/shared/middlewares/authenticate.middleware.ts`
- Extrai `Authorization: Bearer <token>` do header.
- Verifica JWT via `verifyAccessToken`. Se inválido/ausente → responde `401 { error: { code: 'UNAUTHORIZED', message: 'Token inválido ou ausente.' } }`.
- Popula `req.user = { userId, role, ongId }`.

#### `src/shared/middlewares/authorize.middleware.ts`
- Factory function: `authorize(allowedRoles: string[])`.
- Verifica `req.user.role` está em `allowedRoles`. Se não → `403 { error: { code: 'FORBIDDEN', message: 'Você não tem permissão para acessar esta página.' } }`.

#### `src/shared/middlewares/error-handler.middleware.ts`
- Captura erros `AppError` (com `statusCode`, `code`, `message`) e retorna formato padrão.
- Erros desconhecidos → `500 { error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } }`.
- Em `NODE_ENV=development`, inclui `stack` no response.

#### `src/shared/middlewares/validate.middleware.ts`
- Factory: `validate(schema: ZodSchema, source: 'body' | 'params' | 'query')`.
- Parseia `req[source]` com Zod. Se falha → `422` com erros campo-a-campo:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.", "fields": { "email": "Informe um e-mail válido." } } }
```

---

### Domínio Auth

#### `src/domains/auth/auth.errors.ts`
Classe base `AppError extends Error { statusCode, code, message }`.
Erros específicos:
- `EmailAlreadyExistsError` (409, `EMAIL_ALREADY_EXISTS`, `'Este e-mail já está cadastrado.'`)
- `CnpjAlreadyExistsError` (409, `CNPJ_ALREADY_EXISTS`, `'Este CNPJ já está cadastrado.'`)
- `InvalidCredentialsError` (401, `INVALID_CREDENTIALS`, `'E-mail ou senha incorretos.'`)
- `EmailNotConfirmedError` (403, `EMAIL_NOT_CONFIRMED`, `'Confirme seu e-mail para acessar a plataforma.'`)
- `OngPendingApprovalError` (403, `ONG_PENDING_APPROVAL`, `'Sua ONG ainda está em análise. Você será notificado quando for aprovada.'`)
- `TokenExpiredError` (400, `TOKEN_EXPIRED`, `'Este link expirou. Clique abaixo para receber um novo.'`)
- `TokenAlreadyUsedError` (400, `TOKEN_ALREADY_USED`, `'Este link já foi utilizado.'`)
- `InvalidCodeError` (400, `INVALID_CODE`, `'Código inválido.'`)
- `CodeExpiredError` (400, `CODE_EXPIRED`, `'Código expirado. Solicite um novo.'`)

#### `src/domains/auth/auth.validator.ts`
Schemas Zod:
- `registerAdopterSchema`: `{ name: z.string().min(3).max(100), email: z.string().email(), password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/), password_confirmation: z.string() }` + refinement `password === password_confirmation`.
- `registerOngSchema`: extends adopter + `{ ong_name: z.string().min(3).max(150), cnpj: z.string() (validação formato), phone: z.string(), address: z.string().min(1) }`.
- `loginSchema`: `{ email: z.string().email(), password: z.string().min(1) }`.
- `confirmEmailSchema`: `{ token: z.string().min(1) }`.
- `resendConfirmationSchema`: `{ email: z.string().email() }`.
- `forgotPasswordSchema`: `{ email: z.string().email() }`.
- `verifyResetCodeSchema`: `{ email: z.string().email(), code: z.string().length(6).regex(/^\d{6}$/) }`.
- `resetPasswordSchema`: `{ reset_token: z.string().min(1), password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/), password_confirmation: z.string() }` + refinement.

Mensagens de erro customizadas em português para cada campo.

#### `src/domains/auth/auth.repository.ts`
Métodos (todos recebem instância Knex):
- `findUserByEmail(email: string): Promise<User | null>`
- `findUserById(id: string): Promise<User | null>`
- `findOngByCnpj(cnpj: string): Promise<Ong | null>`
- `createUser(data: CreateUserData): Promise<string>` — retorna id
- `createOng(data: CreateOngData): Promise<string>` — retorna id
- `confirmUserEmail(userId: string): Promise<void>` — sets `email_confirmed_at = now()`
- `createEmailConfirmation(data: { userId, token, expiresAt }): Promise<void>`
- `findEmailConfirmationByToken(token: string): Promise<EmailConfirmation | null>`
- `markEmailConfirmationUsed(id: string): Promise<void>`
- `createPasswordReset(data: { userId, code, expiresAt }): Promise<void>`
- `findPasswordReset(email: string, code: string): Promise<PasswordReset | null>` — join com users
- `markPasswordResetUsed(id: string): Promise<void>`
- `updateUserPassword(userId: string, passwordHash: string): Promise<void>`
- `createRefreshToken(data: { userId, tokenHash, expiresAt }): Promise<void>`
- `findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>`
- `revokeRefreshToken(id: string): Promise<void>`
- `revokeAllUserRefreshTokens(userId: string): Promise<void>`

Email é armazenado em lowercase (`email.toLowerCase()`).

#### `src/domains/auth/auth.service.ts`
Métodos públicos:
- `registerAdopter(data)`: valida email único → cria user (role=adopter) → gera token confirmação (expira 24h) → envia email confirmação → retorna mensagem sucesso.
- `registerOng(data)`: valida email + CNPJ únicos → cria ONG (status=pending) → cria user (role=ong_admin, ong_id) → gera token confirmação → envia email → retorna mensagem sucesso.
- `login(data)`: busca user por email → compara senha → verifica `is_active` → verifica `email_confirmed_at` → se `ong_admin`, verifica `ong.status === 'approved'` → gera access token → gera refresh token (hash SHA-256, salva no DB) → retorna `{ access_token, user }` + refresh token cookie value.
- `confirmEmail(token)`: busca confirmation → verifica `used_at` (já usado?) → verifica `expires_at` (expirado?) → marca usado → confirma email do user → retorna sucesso.
- `resendConfirmation(email)`: busca user → se existe e não confirmado, gera novo token e envia → **sempre retorna mensagem genérica** (anti-enumeração).
- `forgotPassword(email)`: busca user → se existe, gera code 6 dígitos (expira 15min), salva, envia email → **sempre retorna mensagem genérica**.
- `verifyResetCode(email, code)`: busca password_reset → verifica `used_at` e `expires_at` → gera `reset_token` JWT curto (5min, payload: userId) → retorna reset_token.
- `resetPassword(resetToken, password)`: verifica JWT reset_token → hash nova senha → atualiza user → marca password_reset usado → revoga todos refresh tokens do user.
- `refreshToken(refreshTokenValue)`: hash do valor → busca no DB → verifica não revogado e não expirado → busca user fresh do DB → verifica `is_active` → revoga token antigo → gera novo access token com role ATUAL → gera novo refresh token → retorna.
- `logout(refreshTokenValue)`: hash → busca → revoga → limpa cookie.

#### `src/domains/auth/auth.controller.ts`
Cada método: extrai dados de `req.body`/`req.cookies`, chama service, retorna `res.status(xxx).json(...)`.
Para `login` e `refresh`: seta cookie `refresh_token` com opções: `httpOnly: true`, `secure: env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/api/v1/auth'`, `maxAge: 7 * 24 * 60 * 60 * 1000`.
Para `logout`: limpa o cookie com `res.clearCookie('refresh_token', { path: '/api/v1/auth' })`.

#### `src/domains/auth/auth.routes.ts`
```
POST /api/v1/auth/register/adopter     → validate(registerAdopterSchema) → controller.registerAdopter
POST /api/v1/auth/register/ong         → validate(registerOngSchema) → controller.registerOng
POST /api/v1/auth/login                → validate(loginSchema) → controller.login
POST /api/v1/auth/confirm-email        → validate(confirmEmailSchema) → controller.confirmEmail
POST /api/v1/auth/resend-confirmation  → validate(resendConfirmationSchema) → controller.resendConfirmation
POST /api/v1/auth/forgot-password      → validate(forgotPasswordSchema) → controller.forgotPassword
POST /api/v1/auth/verify-reset-code    → validate(verifyResetCodeSchema) → controller.verifyResetCode
POST /api/v1/auth/reset-password       → validate(resetPasswordSchema) → controller.resetPassword
POST /api/v1/auth/refresh              → controller.refresh
POST /api/v1/auth/logout               → controller.logout
GET  /api/v1/auth/me                   → authenticate → controller.me
```

#### `src/app.ts`
Express app factory:
1. `helmet()` (segurança headers)
2. `cors(corsConfig)`
3. `express.json()`
4. `cookieParser()`
5. Monta rotas auth
6. Error handler middleware (último)

#### `src/index.ts`
- Carrega env, inicializa DB connection, chama `app.listen(PORT)`, loga "Server running on port X".

---

### Testes

#### Testes Unitários (`tests/unit/`)
- `auth.service.spec.ts`: Mock do repository e mail service. Testa cada método do service isoladamente — validações de negócio, fluxos de erro, geração de tokens.
- `token.util.spec.ts`: Testa geração e verificação de JWT, payloads corretos, expiração.
- `hash.util.spec.ts`: Testa hash e compare de senhas.

#### Testes de Integração (`tests/integration/`)
Usam `supertest` contra a app Express real com DB de teste (database separado `catdog_mario_test`). Cada suite roda migrations antes e limpa tabelas entre testes.

- `auth.register.spec.ts`: Registro adotante sucesso, registro ONG sucesso, email duplicado, CNPJ duplicado, senha fraca, senhas divergentes.
- `auth.login.spec.ts`: Login sucesso (cada role), credenciais inválidas, email não confirmado, ONG pendente, conta desativada.
- `auth.confirm-email.spec.ts`: Confirmação sucesso, link expirado, link já usado.
- `auth.password-reset.spec.ts`: Fluxo completo (forgot → verify → reset), código expirado, código inválido, email inexistente retorna mesma mensagem.
- `auth.refresh-token.spec.ts`: Refresh sucesso com rotação, token revogado, token expirado, user desativado entre refreshes, role alterado entre refreshes.

---

## API Notes

**Base path**: `/api/v1/auth`

| # | Method | Path | Status Success | Notes |
|---|--------|------|----------------|-------|
| 1 | POST | `/register/adopter` | 201 | `{ message: 'Cadastro realizado! Verifique seu e-mail para ativar sua conta.' }` |
| 2 | POST | `/register/ong` | 201 | `{ message: 'Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação.' }` |
| 3 | POST | `/login` | 200 | `{ access_token, user: { id, name, email, role } }` + Set-Cookie |
| 4 | POST | `/confirm-email` | 200 | `{ message: 'E-mail confirmado com sucesso! Faça login para continuar.' }` |
| 5 | POST | `/resend-confirmation` | 200 | `{ message: 'Se o e-mail estiver cadastrado, enviaremos um novo link de confirmação.' }` |
| 6 | POST | `/forgot-password` | 200 | `{ message: 'Enviamos um código de 6 dígitos para seu e-mail.' }` |
| 7 | POST | `/verify-reset-code` | 200 | `{ reset_token }` |
| 8 | POST | `/reset-password` | 200 | `{ message: 'Senha alterada com sucesso!' }` |
| 9 | POST | `/refresh` | 200 | `{ access_token, user: { id, name, email, role } }` + Set-Cookie |
| 10 | POST | `/logout` | 200 | `{ message: 'Logout realizado com sucesso.' }` + Clear-Cookie |
| 11 | GET | `/me` | 200 | `{ id, name, email, role, ong_id }` |

**Formato de erro padrão:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem em português."
  }
}
```

Para erros de validação (422):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos.",
    "fields": { "email": "Informe um e-mail válido.", "password": "A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número." }
  }
}
```

---

## Acceptance Criteria

- [ ] **Dado** que o servidor inicia, **Quando** todas as env vars estão presentes, **Então** o Express escuta na porta configurada e responde 200 em `GET /api/v1/auth/me` (com token válido).
- [ ] **Dado** um Adotante preenchendo dados válidos, **Quando** POST `/register/adopter`, **Então** status 201, user criado no DB com `role=adopter`, `email_confirmed_at=NULL`, email de confirmação gerado com token de 128 chars e expiração 24h.
- [ ] **Dado** um Admin ONG preenchendo dados válidos, **Quando** POST `/register/ong`, **Então** status 201, ONG criada com `status=pending`, user criado com `role=ong_admin` e `ong_id` preenchido.
- [ ] **Dado** email já existente (case-insensitive), **Quando** POST `/register/*`, **Então** status 409, `code: EMAIL_ALREADY_EXISTS`.
- [ ] **Dado** CNPJ já existente, **Quando** POST `/register/ong`, **Então** status 409, `code: CNPJ_ALREADY_EXISTS`.
- [ ] **Dado** token de confirmação válido e não usado, **Quando** POST `/confirm-email`, **Então** status 200, `email_confirmed_at` preenchido, token marcado `used_at`.
- [ ] **Dado** token expirado, **Quando** POST `/confirm-email`, **Então** status 400, `code: TOKEN_EXPIRED`.
- [ ] **Dado** token já usado, **Quando** POST `/confirm-email`, **Então** status 400, `code: TOKEN_ALREADY_USED`.
- [ ] **Dado** user com email confirmado e role=adopter, **Quando** POST `/login` com credenciais corretas, **Então** status 200, body contém `access_token` e `user.role=adopter`, cookie `refresh_token` setado com httpOnly.
- [ ] **Dado** user ong_admin com email confirmado mas ONG pending, **Quando** POST `/login`, **Então** status 403, `code: ONG_PENDING_APPROVAL`.
- [ ] **Dado** user com email não confirmado, **Quando** POST `/login`, **Então** status 403, `code: EMAIL_NOT_CONFIRMED`.
- [ ] **Dado** credenciais inválidas (email ou senha errados), **Quando** POST `/login`, **Então** status 401, mesma mensagem genérica `'E-mail ou senha incorretos.'`.
- [ ] **Dado** email inexistente, **Quando** POST `/forgot-password`, **Então** status 200 com mesma mensagem de sucesso (anti-enumeração).
- [ ] **Dado** email existente, **Quando** POST `/forgot-password`, **Então** password_reset criado com code de 6 dígitos e expiração 15min.
- [ ] **Dado** código válido dentro de 15min, **Quando** POST `/verify-reset-code`, **Então** status 200 com `reset_token` (JWT 5min).
- [ ] **Dado** reset_token válido + nova senha forte, **Quando** POST `/reset-password`, **Então** senha atualizada (hash novo no DB), todos refresh tokens do user revogados.
- [ ] **Dado** refresh token válido no cookie, **Quando** POST `/refresh`, **Então** token antigo revogado, novo access_token gerado com role ATUAL do DB, novo refresh token no cookie.
- [ ] **Dado** user desativado (`is_active=false`) entre renovações, **Quando** POST `/refresh`, **Então** status 401, cookie limpo.
- [ ] **Dado** role do user alterado no DB, **Quando** POST `/refresh`, **Então** novo access_token contém o role atualizado.
- [ ] **Dado** POST `/logout` com refresh token no cookie, **Quando** executado, **Então** token revogado no DB, cookie limpo, status 200.
- [ ] Cobertura de testes ≥ 80% no domínio `src/domains/auth/`.
- [ ] Todas as senhas armazenadas com bcrypt cost 12 — nenhuma senha plaintext no DB.
- [ ] Refresh tokens armazenados como SHA-256 hash — token raw nunca persiste no DB.

---

## Dependencies

- **Requires**: Nenhuma task anterior (esta é a primeira task do projeto).
- **Blocks**: TASK-FRONTEND-002 (frontend precisa da API rodando para integração).
