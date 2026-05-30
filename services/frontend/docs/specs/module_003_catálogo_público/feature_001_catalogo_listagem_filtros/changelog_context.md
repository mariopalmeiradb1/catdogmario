# Alterações da Feature — RF-001 Navegação, Listagem e Filtros de Busca do Catálogo Público

> **Como preencher:** registre aqui toda alteração realizada após a aprovação inicial da spec. Cada entrada deve descrever o que mudou, por que mudou e quem autorizou. Não edite entradas anteriores — apenas adicione novas.
> **Caminho:** `specs/module_003_catálogo_público/feature_001_catalogo_listagem_filtros/changelog_context.md`

---

## Versão atual da spec

**Versão:** v1.1
**Spec original aprovada em:** _A preencher_
**Última alteração:** 2026-05-30

---

## Histórico de Alterações

---

### ALT-001 — Header auth-aware no layout do catálogo

**Data:** 2026-05-30
**Solicitado por:** Usuário
**Tipo:** Melhoria de UX

**O que mudou:**
- O header do catálogo agora exibe um botão "Entrar" (com ícone de login) que redireciona para `/login` quando o usuário não está autenticado.
- Quando o usuário está logado, o botão "Entrar" é substituído por uma saudação "Olá, {primeiro nome}" e um botão "Sair" que executa logout e redireciona para `/catalog`.

**Arquivos impactados:**
- `src/components/layouts/CatalogLayout.tsx`

---

### ALT-002 — Contagem de registros exibidos

**Data:** 2026-05-30
**Solicitado por:** Usuário
**Tipo:** Melhoria de UX

**O que mudou:**
- Adicionado texto "X animais encontrados" (ou "1 animal encontrado" no singular) entre os filtros e a grade de cards, visível apenas quando há resultados carregados.

**Arquivos impactados:**
- `src/pages/public/CatalogPage.tsx`

---

### ALT-003 — Debounce aumentado de 400ms para 600ms

**Data:** 2026-05-30
**Solicitado por:** Usuário
**Tipo:** Ajuste de performance/UX

**O que mudou:**
- O debounce do campo de busca textual foi aumentado de 400ms para 600ms para reduzir requisições desnecessárias durante a digitação.

**Arquivos impactados:**
- `src/hooks/useCatalog.ts`

**Observação:** O valor 600ms ultrapassa levemente a faixa 300-500ms definida na spec original (RNF-07), mas foi ajustado a pedido explícito do usuário.

---

### ALT-004 — Campo de idade: limite máximo, debounce e opção de limpar

**Data:** 2026-05-30
**Solicitado por:** Usuário
**Tipo:** Melhoria de UX + validação

**O que mudou:**
- Campo de idade agora tem valor máximo de 30 anos (`max={30}`).
- Campo de idade agora aplica debounce de 600ms antes de disparar a busca (estado local + setTimeout).
- Adicionada opção `allowClear` ao campo de idade para permitir limpar o valor.

**Arquivos impactados:**
- `src/components/catalog/CatalogFilters.tsx`

---

> Adicione novas entradas seguindo o mesmo padrão. Nunca edite ou remova entradas anteriores.
