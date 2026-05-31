# TASK-FULL-001 — Estender cadastro de ONG com descrição e capacidade

**Root**: `services/backend/` e `services/frontend/`
**Branch**: `feature/TASK-FULL-001-extend-registration-form`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_001_cadastro_ong/spec_context.md`
**Part**: 1 of 2 — Extensão do formulário de cadastro
**Generated**: 2026-05-30

---

## Context

Adicionar campos obrigatórios "Descrição da ONG" (text, 50-500 chars) e "Capacidade de animais" (integer >= 1) ao fluxo de registro de ONG existente. A tabela `ongs` atualmente armazena apenas name/cnpj/phone/address — os novos campos são exigidos pelo Admin do Sistema para avaliar a ONG. A migration deve considerar que já podem existir registros na tabela (usar DEFAULT para backfill).

---

## Scope

**In:**
- Migration adicionando colunas `description` e `capacity` à tabela `ongs`
- Atualização do Zod schema `registerOngSchema` com validações dos novos campos
- Atualização de `RegisterOngInput`, `CreateOngData` e `Ong` em `auth.types.ts`
- Passagem dos novos campos no `AuthService.registerOng()` e `AuthRepository.createOng()`
- Adição dos campos textarea (descrição) e input numérico (capacidade) no `RegisterOngForm.tsx`
- Renomear label do campo e-mail para "E-mail institucional" no formulário frontend
- Atualização de `utils/validators.ts` e `utils/messages.ts` com novas regras e mensagens

**Out:**
- Não criar tela de perfil da ONG (TASK-FULL-002)
- Não criar domínio `ong-profile` (TASK-FULL-002)
- Não criar tabela `ong_photos` nem upload de fotos (TASK-FULL-002)
- Não alterar fluxo de login, confirmação de e-mail ou aprovação
- Não criar campos opcionais (missão, redes sociais)
- Não alterar testes existentes que passam atualmente (apenas adicionar novos cenários)

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Descrição da ONG | `description: string` na tabela `ongs` e em `RegisterOngInput` |
| Capacidade de animais | `capacity: number` na tabela `ongs` e em `RegisterOngInput` |
| E-mail institucional | Label do campo `email` no form (sem mudança funcional no campo) |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260530_008_add_description_capacity_to_ongs.ts` | nova migration com colunas |
| `modify` | `src/domains/auth/auth.types.ts` | adicionar campos nas interfaces |
| `modify` | `src/domains/auth/auth.validator.ts` | validação Zod dos novos campos |
| `modify` | `src/domains/auth/auth.service.ts` | passar campos no createOng |
| `modify` | `src/domains/auth/auth.repository.ts` | nenhuma mudança estrutural necessária — `createOng` já usa spread |

Para o frontend (`services/frontend/`):

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `src/components/auth/RegisterOngForm.tsx` | novos campos + rename label |
| `modify` | `src/utils/validators.ts` | regras descrição e capacidade |
| `modify` | `src/utils/messages.ts` | mensagens de validação |

---

## Implementation

### `20260530_008_add_description_capacity_to_ongs.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260530_006_add_city_state_to_ongs.ts`
**Differences from reference**:
- `table.text('description').notNullable().defaultTo('')` — DEFAULT vazio para backfill de registros existentes
- `table.integer('capacity').unsigned().notNullable().defaultTo(1)` — DEFAULT 1 para backfill
- Sem índices adicionais
- Down: `dropColumn('capacity')` então `dropColumn('description')`

---

### `auth.types.ts` *(modify)*

**Changes**:
- Adicionar à interface `Ong`: `description: string;` e `capacity: number;`
- Adicionar à interface `CreateOngData`: `description: string;` e `capacity: number;`
- Adicionar à interface `RegisterOngInput`: `description: string;` e `capacity: number;`

---

### `auth.validator.ts` *(modify)*

**Reference pattern**: campos `ong_name` e `address` no `registerOngSchema` existente
**Changes ao `registerOngSchema`**:
- Adicionar `description`:
  ```typescript
  description: z
    .string({ required_error: 'Descrição é obrigatória (mínimo 50 caracteres).' })
    .trim()
    .min(50, 'Descrição deve ter no mínimo 50 caracteres.')
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .refine((val) => val.trim().length >= 50, { message: 'Descrição é obrigatória (mínimo 50 caracteres).' }),
  ```
- Adicionar `capacity`:
  ```typescript
  capacity: z
    .number({ required_error: 'Capacidade deve ser um número inteiro maior que zero.', invalid_type_error: 'Capacidade deve ser um número inteiro maior que zero.' })
    .int('Capacidade deve ser um número inteiro maior que zero.')
    .min(1, 'Capacidade deve ser um número inteiro maior que zero.'),
  ```
- Nota: o `.trim()` no description garante rejeição de strings compostas apenas por espaços (RN-02)

---

### `auth.service.ts` *(modify)*

**Changes**:
- No método `registerOng`, adicionar `description` e `capacity` ao objeto passado para `createOng`:
  ```typescript
  await authRepository.createOng({
    id: ongId,
    name: data.ong_name,
    cnpj: data.cnpj,
    phone: data.phone,
    address: data.address,
    description: data.description,
    capacity: data.capacity,
  });
  ```

---

### `RegisterOngForm.tsx` *(modify)*

**Reference pattern**: os `Form.Item` existentes para `ong_name` e `address`
**Changes**:
- Importar `Input.TextArea` do Ant Design (se não importado) e `InputNumber`
- Renomear placeholder do campo `email` de "E-mail" para "E-mail institucional"
- Após o campo `address`, dentro da seção "Dados da ONG" (após `<Divider>`), adicionar:

1. **Campo Descrição** — `Form.Item` com `name="description"`:
   - Componente: `<Input.TextArea placeholder="Descrição da ONG" rows={4} maxLength={500} showCount />`
   - Rules: required + min 50 + max 500 + whitespace validation
   - Mensagens conforme `VALIDATION_MESSAGES`

2. **Campo Capacidade** — `Form.Item` com `name="capacity"`:
   - Componente: `<InputNumber placeholder="Capacidade de animais" min={1} precision={0} style={{ width: '100%' }} size="large" />`
   - Rules: required + custom validator para inteiro >= 1

- Adicionar à interface `RegisterOngFormValues`: `description: string;` e `capacity: number;`

---

### `validators.ts` *(modify)*

**Changes**:
- Exportar `descriptionRules: Rule[]`:
  - `{ required: true, message: VALIDATION_MESSAGES.DESCRIPTION_REQUIRED }`
  - `{ min: 50, message: VALIDATION_MESSAGES.DESCRIPTION_MIN }`
  - `{ max: 500, message: VALIDATION_MESSAGES.DESCRIPTION_MAX }`
  - Validador custom para rejeitar apenas espaços em branco
- Exportar `capacityRules: Rule[]`:
  - `{ required: true, message: VALIDATION_MESSAGES.CAPACITY_INVALID }`
  - Validador custom: inteiro >= 1

---

### `messages.ts` *(modify)*

**Changes** — Adicionar ao objeto `VALIDATION_MESSAGES`:
```typescript
DESCRIPTION_REQUIRED: 'Descrição é obrigatória (mínimo 50 caracteres).',
DESCRIPTION_MIN: 'Descrição deve ter no mínimo 50 caracteres.',
DESCRIPTION_MAX: 'Descrição deve ter no máximo 500 caracteres.',
CAPACITY_INVALID: 'Capacidade deve ser um número inteiro maior que zero.',
```

---

## Acceptance Criteria

- [ ] **Given** formulário de cadastro ONG, **When** renderizado, **Then** exibe campos "Descrição da ONG" (textarea com contador) e "Capacidade de animais" (input numérico) na seção "Dados da ONG".
- [ ] **Given** campo e-mail no formulário, **When** renderizado, **Then** exibe placeholder "E-mail institucional".
- [ ] **Given** descrição vazia, **When** tenta submeter, **Then** exibe "Descrição é obrigatória (mínimo 50 caracteres)" e não submete.
- [ ] **Given** descrição com 45 caracteres, **When** tenta submeter, **Then** exibe "Descrição deve ter no mínimo 50 caracteres" e não submete.
- [ ] **Given** descrição com 501 caracteres, **When** tenta submeter, **Then** exibe "Descrição deve ter no máximo 500 caracteres" e não submete.
- [ ] **Given** descrição com apenas espaços em branco, **When** tenta submeter, **Then** exibe mensagem de erro e não submete.
- [ ] **Given** capacidade = 0, **When** tenta submeter, **Then** exibe "Capacidade deve ser um número inteiro maior que zero" e não submete.
- [ ] **Given** capacidade = 3.5, **When** tenta submeter, **Then** exibe mensagem de erro e não submete.
- [ ] **Given** capacidade = -1, **When** tenta submeter, **Then** exibe mensagem de erro e não submete.
- [ ] **Given** todos os campos válidos (descrição 100 chars, capacidade = 20), **When** submete formulário, **Then** ONG criada com status "pending", colunas `description` e `capacity` persistidas, e-mail de confirmação enviado.
- [ ] **Given** request direto à API sem campo `description`, **When** `POST /api/v1/auth/register/ong`, **Then** retorna 422 com erro de validação (server-side enforcement).
- [ ] **Given** request direto à API com `capacity = 0`, **When** `POST /api/v1/auth/register/ong`, **Then** retorna 422 com erro de validação.
- [ ] Fluxo de registro existente (sem novos campos) → mantém comportamento inalterado para os campos originais.
- [ ] Login de ONG Admin → não impactado pela adição de colunas.

---

## API Notes

- **Endpoint**: `POST /api/v1/auth/register/ong` (existente, body estendido)
- **Novos campos no body**:
  - `description`: string, obrigatório, 50-500 chars após trim
  - `capacity`: number, obrigatório, inteiro >= 1
- **Resposta**: sem alteração — `201` com `{ message: "Cadastro realizado! ..." }`
- **Erro de validação**: `422` — `{ error: { code: "VALIDATION_ERROR", fields: { ... } } }`

---

## Dependencies

- **Requires**: nenhuma — a tabela `ongs` e o fluxo de registro já existem e estão funcionais
- **Blocks**: TASK-FULL-002 (Perfil da ONG + Upload de fotos — depende das colunas `description`/`capacity` existirem na tabela)