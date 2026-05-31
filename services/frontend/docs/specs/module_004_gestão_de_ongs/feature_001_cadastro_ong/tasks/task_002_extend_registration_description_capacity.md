# TASK-FULL-002 — Estender cadastro de ONG com descrição e capacidade

**Root**: `services/backend/` e `services/frontend/`
**Branch**: `feature/TASK-FULL-002-extend-ong-registration`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_001_cadastro_ong/spec_context.md`
**Part**: 1 de 2 — Extensão do formulário de cadastro (HU-01)
**Generated**: 2026-05-31

---

## Context

Estende o formulário de cadastro de ONG com dois campos obrigatórios (descrição e capacidade de animais) para que o Administrador do Sistema tenha informações suficientes na avaliação de aprovação. O fluxo de registro existente (`registerOng` em `auth.service.ts`) já cria ONG + usuário + confirmação de e-mail — este task adiciona os novos campos a esse fluxo sem alterar sua estrutura. O label "E-mail" será renomeado para "E-mail institucional" apenas no frontend (sem mudança funcional).

---

## Scope

**In:**
- Migration adicionando colunas `description` (text, NOT NULL) e `animal_capacity` (integer, NOT NULL) à tabela `ongs`
- Validação Zod backend para os novos campos no schema `registerOngSchema`
- Atualização do tipo `RegisterOngInput`, `CreateOngData` e interface `Ong` no backend
- Atualização do repositório `createOng` para persistir os novos campos
- Formulário frontend `RegisterOngForm.tsx` com os novos campos (textarea + input numérico)
- Validação frontend (regras Ant Design) para descrição (50-500 chars, não só espaços) e capacidade (inteiro ≥ 1)
- Tipo `RegisterOngData` frontend atualizado
- Service frontend `authService.registerOng` enviando os novos campos
- Label do campo e-mail renomeado para "E-mail institucional" no formulário
- Testes de integração backend cobrindo os novos campos

**Out:**
- Não criar domínio `ong` (será parte do TASK-FULL-003 — Perfil da ONG)
- Não implementar tela de perfil, missão, redes sociais ou upload de fotos (HU-02/HU-03)
- Não alterar fluxo de login, confirmação de e-mail ou refresh token
- Não modificar seed existente
- Não criar testes unitários frontend neste task (cobertos em task separado)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `services/backend/src/database/migrations/20260531_008_add_description_capacity_to_ongs.ts` | novas colunas na tabela ongs |
| `modify` | `services/backend/src/domains/auth/auth.types.ts` | adicionar campos às interfaces |
| `modify` | `services/backend/src/domains/auth/auth.validator.ts` | validação Zod dos novos campos |
| `modify` | `services/backend/src/domains/auth/auth.repository.ts` | persistir description e capacity |
| `modify` | `services/backend/src/domains/auth/auth.service.ts` | passar novos campos ao createOng |
| `modify` | `services/frontend/src/types/auth.types.ts` | campos no tipo RegisterOngData |
| `modify` | `services/frontend/src/components/auth/RegisterOngForm.tsx` | novos campos no formulário |
| `modify` | `services/frontend/src/utils/validators.ts` | regras para descrição e capacidade |
| `modify` | `services/frontend/src/utils/messages.ts` | mensagens de validação |
| `modify` | `services/backend/tests/integration/auth.register.spec.ts` | testes para novos campos |

---

## Implementation

### `20260531_008_add_description_capacity_to_ongs.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260530_006_add_city_state_to_ongs.ts`
**Differences from reference**:
- Adiciona `table.text('description').notNullable().defaultTo('')` (default para registros existentes)
- Adiciona `table.integer('animal_capacity').notNullable().defaultTo(1)` (default para registros existentes)
- Down: `dropColumn('animal_capacity')` e `dropColumn('description')`

---

### `auth.types.ts` *(modify)*

**Changes**:
- Interface `Ong`: adicionar `description: string` e `animal_capacity: number`
- Interface `RegisterOngInput`: adicionar `description: string` e `animal_capacity: number`
- Interface `CreateOngData`: adicionar `description: string` e `animal_capacity: number`

---

### `auth.validator.ts` *(modify)*

**Reference pattern**: campos existentes no `registerOngSchema` (mesmo arquivo)
**Changes**:
- Adicionar ao `registerOngSchema.object({})`:
  ```typescript
  description: z
    .string({ required_error: 'Descrição é obrigatória (mínimo 50 caracteres).' })
    .min(50, 'Descrição deve ter no mínimo 50 caracteres.')
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .refine((val) => val.trim().length >= 50, {
      message: 'Descrição deve ter no mínimo 50 caracteres.',
    }),
  animal_capacity: z
    .number({ required_error: 'Capacidade deve ser um número inteiro maior que zero.', invalid_type_error: 'Capacidade deve ser um número inteiro maior que zero.' })
    .int('Capacidade deve ser um número inteiro maior que zero.')
    .min(1, 'Capacidade deve ser um número inteiro maior que zero.'),
  ```

---

### `auth.repository.ts` *(modify)*

**Changes**:
- Método `createOng`: nenhuma mudança necessária — já faz spread de `data`, basta que `CreateOngData` inclua os novos campos.
- Verificar que o spread `{ ...data, id }` persiste `description` e `animal_capacity` automaticamente.

---

### `auth.service.ts` *(modify)*

**Changes**:
- Método `registerOng`: passar `description` e `animal_capacity` no objeto enviado a `createOng`:
  ```typescript
  await authRepository.createOng({
    id: ongId,
    name: data.ong_name,
    cnpj: data.cnpj,
    phone: data.phone,
    address: data.address,
    description: data.description,
    animal_capacity: data.animal_capacity,
  });
  ```

---

### `services/frontend/src/types/auth.types.ts` *(modify)*

**Changes**:
- Interface `RegisterOngData`: adicionar `description: string` e `animal_capacity: number`

---

### `RegisterOngForm.tsx` *(modify)*

**Reference pattern**: campos existentes no mesmo arquivo (seção "Dados da ONG" após `<Divider>`)
**Changes**:
- Renomear placeholder do campo `email`: `"E-mail"` → `"E-mail institucional"`
- Após o campo `address`, adicionar:
  - `Form.Item` name=`description` com `<Input.TextArea>`, placeholder "Descrição da ONG", maxLength=500, showCount=true, rows=4
  - Regras: required, min 50, max 500, validador custom para rejeitar texto só de espaços
  - `Form.Item` name=`animal_capacity` com `<InputNumber>`, placeholder "Capacidade de animais", min=1, precision=0, style={{ width: '100%' }}
  - Regras: required, validador custom para garantir inteiro ≥ 1
- No `handleSubmit`, incluir `description` e `animal_capacity` no payload (já vem do form values)

---

### `validators.ts` *(modify)*

**Changes**:
- Exportar `descriptionRules: Rule[]`:
  - `{ required: true, message: 'Descrição é obrigatória (mínimo 50 caracteres).' }`
  - `{ min: 50, message: 'Descrição deve ter no mínimo 50 caracteres.' }`
  - `{ max: 500, message: 'Descrição deve ter no máximo 500 caracteres.' }`
  - Validator custom: `val.trim().length < 50` → erro
- Exportar `animalCapacityRules: Rule[]`:
  - `{ required: true, message: 'Capacidade deve ser um número inteiro maior que zero.' }`
  - Validator custom: `!Number.isInteger(val) || val < 1` → erro

---

### `messages.ts` *(modify)*

**Changes**:
- Adicionar em `VALIDATION_MESSAGES`:
  - `DESCRIPTION_REQUIRED: 'Descrição é obrigatória (mínimo 50 caracteres).'`
  - `DESCRIPTION_MIN: 'Descrição deve ter no mínimo 50 caracteres.'`
  - `DESCRIPTION_MAX: 'Descrição deve ter no máximo 500 caracteres.'`
  - `CAPACITY_INVALID: 'Capacidade deve ser um número inteiro maior que zero.'`

---

### `auth.register.spec.ts` *(modify)*

**Reference pattern**: testes existentes de `POST /api/v1/auth/register/ong` no mesmo arquivo
**Changes**:
- Atualizar payload válido dos testes existentes para incluir `description` (100 chars) e `animal_capacity` (20)
- Adicionar cenários:
  - Submissão sem `description` → 400 com mensagem de erro
  - `description` com 45 chars → 400
  - `description` com apenas espaços → 400
  - `description` com 501 chars → 400
  - `animal_capacity` = 0 → 400
  - `animal_capacity` = -1 → 400
  - `animal_capacity` = 3.5 → 400
  - `animal_capacity` = "abc" → 400
  - Cadastro com campos válidos (description 50+ chars, capacity ≥ 1) → 201, dados persistidos no banco

---

## Acceptance Criteria

- [ ] **Given** formulário de cadastro de ONG, **When** renderizado, **Then** exibe campos "Descrição da ONG" (textarea com contador) e "Capacidade de animais" (numérico) na seção "Dados da ONG".
- [ ] **Given** campo e-mail no formulário, **When** renderizado, **Then** exibe placeholder "E-mail institucional".
- [ ] **Given** campo descrição vazio, **When** submete formulário, **Then** exibe "Descrição é obrigatória (mínimo 50 caracteres)" e não submete.
- [ ] **Given** descrição com 45 caracteres, **When** submete formulário, **Then** exibe "Descrição deve ter no mínimo 50 caracteres" e não submete.
- [ ] **Given** descrição com apenas espaços em branco, **When** submete formulário, **Then** exibe erro de mínimo e não submete.
- [ ] **Given** descrição com 501 caracteres, **When** submete formulário, **Then** exibe "Descrição deve ter no máximo 500 caracteres" e não submete.
- [ ] **Given** capacidade = 0, **When** submete formulário, **Then** exibe "Capacidade deve ser um número inteiro maior que zero" e não submete.
- [ ] **Given** capacidade com valor decimal (3.5), **When** submete formulário, **Then** exibe erro e não submete.
- [ ] **Given** capacidade com valor negativo (-1), **When** submete formulário, **Then** exibe erro e não submete.
- [ ] **Given** todos os campos válidos (descrição 100 chars, capacidade 20), **When** submete formulário, **Then** ONG criada com status "pending", dados persistidos incluindo `description` e `animal_capacity`.
- [ ] **Given** backend recebe request sem `description`, **When** validação executa, **Then** retorna 400 com mensagem adequada.
- [ ] **Given** backend recebe `animal_capacity` = "abc", **When** validação executa, **Then** retorna 400 com mensagem adequada.
- [ ] Fluxo de login existente não sofre regressão.
- [ ] Fluxo de confirmação de e-mail não sofre regressão.

---

## API Notes

- **Endpoint**: `POST /api/v1/auth/register/ong` (existente, sem mudança de rota)
- **Input** (campos adicionais no body):
  ```json
  {
    "description": "string (50-500 chars, not whitespace-only)",
    "animal_capacity": 20
  }
  ```
- **Success**: `201` — `{ "message": "Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação." }`
- **Errors**: `400` — validação falhou (mensagens específicas por campo); `409` — email/CNPJ já existente (comportamento existente inalterado)

---

## Dependencies

- **Requires**: nenhum — o fluxo de registro de ONG e tabela `ongs` já existem.
- **Blocks**: TASK-FULL-003 (Perfil da ONG — HU-02/HU-03, que criará o domínio `ong` com missão, fotos e redes sociais)