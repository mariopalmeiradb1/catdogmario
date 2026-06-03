# TASK-BACKEND-001 — Migration adopter_profiles + utils CPF e masking

**Root**: `services/backend/`
**Branch**: `feature/TASK-BACKEND-001-migration-e-utils`
**Spec**: `.makuco/specs/module_008_gestão_de_adotantes/feature_001_cadastro_adotante/spec_context.md`
**Part**: 1 of 4 — Infraestrutura de banco e utilitários
**Generated**: `2026-06-03`

## Context

Criar a tabela `adopter_profiles` e utilitários de validação de CPF e mascaramento de dados sensíveis. Esta é a base de dados para o módulo de Gestão de Adotantes. A tabela armazena o perfil do adotante vinculado ao `users.id` existente.

## Scope

**In:**
- Migration para tabela `adopter_profiles`
- Utilitário de validação algorítmica de CPF (`cpf.util.ts`)
- Utilitário de mascaramento de dados sensíveis (`data-masking.util.ts`)
- Testes unitários para ambos utilitários

**Out:**
- Não criar domain files (service, controller, routes) — isso é TASK-002.
- Não alterar tabelas existentes (`users`, `adoption_requests`).
- Não implementar criptografia em repouso do CPF — armazenar como VARCHAR plano.

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/database/migrations/20260603_017_create_adopter_profiles_table.ts` | tabela de perfis de adotante |
| `create` | `src/shared/utils/cpf.util.ts` | validação algorítmica de CPF |
| `create` | `src/shared/utils/data-masking.util.ts` | máscara de CPF e RG |
| `create` | `tests/unit/cpf.util.spec.ts` | testes do utilitário CPF |
| `create` | `tests/unit/data-masking.util.spec.ts` | testes do mascaramento |

## Implementation

### `20260603_017_create_adopter_profiles_table.ts` *(create)*

**Reference pattern**: `src/database/migrations/20260602_016_create_adoption_requests_table.ts`

**Differences from reference**:
- Tabela: `adopter_profiles`
- Colunas:
  - `id` VARCHAR(36) PRIMARY KEY
  - `user_id` VARCHAR(36) NOT NULL UNIQUE — FK para `users(id)` ON DELETE CASCADE
  - `full_name` VARCHAR(150) NOT NULL
  - `cpf` VARCHAR(11) NOT NULL UNIQUE
  - `rg` VARCHAR(20) NOT NULL
  - `birth_date` DATE NOT NULL
  - `phone` VARCHAR(15) NOT NULL
  - `cep` VARCHAR(8) NOT NULL
  - `street` VARCHAR(200) NOT NULL
  - `number` VARCHAR(10) NOT NULL
  - `complement` VARCHAR(100) NULL
  - `neighborhood` VARCHAR(100) NOT NULL
  - `city` VARCHAR(100) NOT NULL
  - `state` CHAR(2) NOT NULL
  - `has_current_animals` BOOLEAN NOT NULL DEFAULT FALSE
  - `current_animals_description` VARCHAR(500) NULL
  - `had_animals_before` BOOLEAN NOT NULL DEFAULT FALSE
  - `previous_animals_description` VARCHAR(500) NULL
  - `status` ENUM('active','inactive') NOT NULL DEFAULT 'active'
  - `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- Índices: `idx_adopter_profiles_cpf (cpf)`, `idx_adopter_profiles_user_id (user_id)`
- FK: `fk_adopter_profiles_user` → `users(id)` ON DELETE CASCADE
- `down`: `dropTable('adopter_profiles')`

### `cpf.util.ts` *(create)*

**Reference pattern**: `src/shared/utils/hash.util.ts` (export style)

**Differences from reference**:
- Exportar duas funções: `isValidCpf(cpf: string): boolean` e `sanitizeCpf(cpf: string): string`
- `sanitizeCpf`: remove tudo que não é dígito (`replace(/\D/g, '')`)
- `isValidCpf`: recebe CPF com ou sem máscara, sanitiza, rejeita se length !== 11, rejeita se todos os dígitos iguais, calcula dígitos verificadores (algoritmo padrão módulo 11)

### `data-masking.util.ts` *(create)*

**Reference pattern**: `src/shared/utils/hash.util.ts` (export style)

**Differences from reference**:
- Exportar: `maskCpf(cpf: string): string` e `maskRg(rg: string): string`
- `maskCpf`: recebe CPF sanitizado (11 dígitos), retorna `***.${cpf.slice(3,6)}.${cpf.slice(6,9)}-**`
- `maskRg`: recebe RG string, retorna `${'*'.repeat(rg.length - 4)}${rg.slice(-4)}`

### `cpf.util.spec.ts` *(create)*

**Reference pattern**: `tests/unit/hash.util.spec.ts`

**Cenários**:
- CPF válido (ex: `52998224725`) → `true`
- CPF com máscara válida (ex: `529.982.247-25`) → `true` (após sanitize)
- Todos dígitos iguais (`11111111111`) → `false`
- Dígito verificador incorreto → `false`
- Menos de 11 dígitos → `false`
- `sanitizeCpf` remove pontos e traço

### `data-masking.util.spec.ts` *(create)*

**Reference pattern**: `tests/unit/hash.util.spec.ts`

**Cenários**:
- `maskCpf('52998224725')` → `'***.982.247-**'`
- `maskRg('123456789')` → `'*****6789'`
- RG com 7 caracteres → máscara preserva últimos 4

## Acceptance Criteria

- [ ] Migration executa sem erro (`knex migrate:latest`) e cria tabela com todas as colunas, índices e FK.
- [ ] `isValidCpf('52998224725')` retorna `true`.
- [ ] `isValidCpf('11111111111')` retorna `false`.
- [ ] `isValidCpf('123')` retorna `false`.
- [ ] `sanitizeCpf('529.982.247-25')` retorna `'52998224725'`.
- [ ] `maskCpf('52998224725')` retorna `'***.982.247-**'`.
- [ ] `maskRg('123456789')` retorna `'*****6789'`.
- [ ] Todos os testes passam com `npm test`.

## Dependencies

- **Requires**: Nenhum — esta é a primeira task do módulo.
- **Blocks**: TASK-BACKEND-002 (domain backend), TASK-BACKEND-003 (testes de integração).
