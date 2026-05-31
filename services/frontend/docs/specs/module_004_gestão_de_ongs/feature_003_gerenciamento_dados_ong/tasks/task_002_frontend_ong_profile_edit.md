# TASK-FRONTEND-004 — Frontend ONG Profile Edit Page

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-004-frontend-ong-profile-edit`
**Spec**: `.makuco/specs/module_004_gestão_de_ongs/feature_003_gerenciamento_dados_ong/spec_context.md`
**Part**: 5 of 5 — ONG profile frontend
**Generated**: 2026-05-31

---

## Context

Implementa a página de edição de perfil da ONG para o Administrador da ONG. Campos Nome e CNPJ são read-only com tooltip explicativo. O botão Salvar só fica ativo quando há mudanças. Validações em tempo real no cliente replicam as regras do backend. Upload de fotos está adiado (infraestrutura pendente).
Ver spec: `.makuco/specs/module_004_gestão_de_ongs/feature_003_gerenciamento_dados_ong/spec_context.md`.

---

## Scope

**In:**
- Criar `OngProfilePage.tsx` com formulário de edição
- Criar hook `useOngEdit.ts` com dirty tracking e submit
- Adicionar rota `/ong/profile` no bloco de rotas ONG
- Adicionar chamada `getMyOng()` e `updateMyOng(data)` no service existente ou no novo ong-management.service.ts

**Out:**
- Não implementar upload de fotos (infraestrutura pendente)
- Não implementar edição de Nome e CNPJ (campos read-only para ong_admin)
- Não alterar backend (endpoints já implementados em TASK-BACKEND-003)
- Não criar testes de componentes nesta task

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/pages/ong/OngProfilePage.tsx` | página de edição perfil |
| `create` | `src/hooks/useOngEdit.ts` | dirty tracking + submit |
| `modify` | `src/services/ong-management.service.ts` | getMyOng + updateMyOng |
| `modify` | `src/routes/index.tsx` | rota /ong/profile |

---

## Implementation

### `OngProfilePage.tsx` *(create)*

**Reference pattern**: `src/pages/auth/RegisterOngPage.tsx` (formulário Ant Design com validação)
**Differences from reference**:
- Usa hook `useOngEdit()` para carregar dados e gerenciar estado
- Form Ant Design com layout vertical
- Campos read-only (Nome, CNPJ): componente `Input` com prop `disabled` + Tooltip ao lado com texto "Este campo não pode ser alterado. Em caso de erro, entre em contato com o suporte."
- Campos editáveis: Phone (mascarado), Address, City, State (Select UFs), Description (TextArea min 50, max 500 com showCount), Mission (TextArea min 50, max 300, opcional, com showCount), Capacity (InputNumber min 1), Instagram (Input com placeholder "https://instagram.com/..."), Facebook (Input), WhatsApp (Input com mask 10-11 dígitos)
- Validações em tempo real via Form.Item rules (mesmo regras do backend):
  - description: required, min 50, max 500
  - mission: quando preenchido, min 50, max 300
  - capacity: required, integer >= 1
  - instagram: quando preenchido, pattern deve conter "instagram.com"
  - facebook: quando preenchido, pattern deve conter "facebook.com"
  - whatsapp: quando preenchido, 10-11 dígitos numéricos
- Botão "Salvar Alterações": `disabled` quando `!isDirty` (do hook), loading quando submitting
- Botão "Cancelar": chama `resetForm()` do hook — restaura valores iniciais

### `useOngEdit.ts` *(create)*

**Reference pattern**: nenhum direto — hook com form + dirty tracking
**Differences from reference**:
- Usa `Form.useForm()` do Ant Design
- State: `ong: OngDetail | null`, `loading`, `submitting`, `isDirty`
- `useEffect` → fetch ONG via `ongManagementService.getMyOng()` e setFieldsValue no form
- `isDirty`: comparar valores atuais do form com `initialValues` — usar `Form.useWatch` ou `onValuesChange` callback do Form
- `submit(values)`: chamar `ongManagementService.updateMyOng(values)`, on success → message.success('Dados atualizados com sucesso.') + refetch + setIsDirty(false). On error → message.error com mensagem da API.
- `resetForm()`: form.resetFields() + setIsDirty(false)
- Retorna: { form, ong, loading, submitting, isDirty, submit, resetForm }

### `ong-management.service.ts` *(modify)*

**Reference pattern**: métodos existentes neste arquivo (list, approve, etc.)
**Differences from reference**:
- Adicionar `getMyOng()`: GET `/api/v1/ong-management/my-ong` — retorna OngDetail da ONG do usuário logado
- Adicionar `updateMyOng(data: UpdateOngInput)`: PUT `/api/v1/ong-management/my-ong` — retorna { message, data }
- **Nota**: o endpoint GET /my-ong precisa existir no backend. Se não foi criado em TASK-BACKEND-003, adicionar:
  - No routes: `router.get('/my-ong', authenticate, authorize(['ong_admin']), controller.getMyOng)`
  - No controller: handler que chama `service.getMyOngDetail(req.user.userId)`
  - No service: `getMyOngDetail(userId)` → `repository.findOngByUserId(userId)` → return ou throw NotFound

### `routes/index.tsx` *(modify)*

**Changes**:
- Adicionar import: `import { OngProfilePage } from '~/pages/ong/OngProfilePage'`
- Dentro do bloco `{/* Private: ONG */}`, após a rota `/ong/dashboard`:
  - `<Route path="/ong/profile" element={<OngProfilePage />} />`

---

## Acceptance Criteria

- [ ] **Given** ong_admin logado acessa /ong/profile, **When** página carrega, **Then** formulário exibe dados atuais da ONG com Nome e CNPJ read-only e tooltip.
- [ ] **Given** formulário carregado sem alterações, **When** observo botão Salvar, **Then** está desabilitado.
- [ ] **Given** admin altera campo Description para valor válido, **When** observo botão Salvar, **Then** está habilitado.
- [ ] **Given** admin preenche Description com 49 chars, **When** campo perde foco, **Then** erro de validação exibido inline antes de clicar Salvar.
- [ ] **Given** admin preenche Instagram com URL sem "instagram.com", **When** campo perde foco, **Then** erro "Informe uma URL válida para Instagram" exibido.
- [ ] **Given** admin faz alterações e clica Cancelar, **When** ação executada, **Then** formulário volta aos valores originais e isDirty = false.
- [ ] **Given** admin salva dados válidos, **When** API retorna sucesso, **Then** message.success exibida, botão Salvar desabilitado novamente.
- [ ] **Given** API retorna erro de validação, **When** submit falha, **Then** message.error com mensagem do backend, dados não perdidos.
- [ ] `adopter` ou `system_admin` — rota /ong/profile não acessível (RoleRoute bloqueia).

---

## Dependencies

- **Requires**: TASK-BACKEND-003 (PUT /my-ong endpoint), TASK-FRONTEND-003 (ong-management.service.ts base)
- **Blocks**: Nenhuma
