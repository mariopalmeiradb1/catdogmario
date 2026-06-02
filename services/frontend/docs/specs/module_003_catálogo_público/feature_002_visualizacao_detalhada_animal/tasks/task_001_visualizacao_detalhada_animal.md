# TASK-FULL-001 — Visualização Detalhada do Animal (Modal no Catálogo Público)

**Root**: `services/backend/` e `services/frontend/`
**Branch**: `feature/TASK-FULL-001-visualizacao-detalhada-animal`
**Spec**: `.makuco/specs/module_003_catálogo_público/feature_002_visualizacao_detalhada_animal/spec_context.md`
**Generated**: `2026-06-02`

---

## Context

Implementar o endpoint público `GET /catalog/:id` e a modal de detalhes do animal no catálogo público. O visitante clica no card de um animal e uma modal exibe carrossel de mídia, dados completos e informações da ONG responsável — sem exigir autenticação. O botão "Solicitar Adoção" deve existir mas permanecer desabilitado (módulo futuro).

---

## Scope

**In:**
- Endpoint backend `GET /catalog/:id` (público, sem auth) no catalog domain
- Validação de UUID no path param
- Query de detalhe com JOIN em `animals`, `animal_media` e `ongs`
- Tratamento 404 para animal inexistente ou com status não-público
- Tipos TypeScript frontend para detalhe do animal
- Service frontend `getAnimalDetail(id)`
- Hook `useAnimalDetail` com lazy fetch
- Componente `MediaCarousel` (fotos + vídeo inline, thumbnails, placeholder por espécie)
- Componente `AnimalDetailModal` (modal com todas as seções condicionais)
- Integração: `onClick` no `AnimalCard` + estado na `CatalogPage`
- Testes unitários e de integração (backend e frontend)

**Out:**
- Não criar rota/página dedicada com URL própria — é modal.
- Não implementar ação efetiva de "Solicitar Adoção" ou "Entrar na fila".
- Não tocar no `useCatalog` hook (listagem/filtros/scroll).
- Não implementar SEO, Open Graph, compartilhamento ou favoritar.
- Não implementar zoom em fotos ou fullscreen de vídeo.
- Não criar migrations — tabelas já existem.

---

## Ubiquitous Language

| Business Term | Code Mapping |
|---|---|
| Detalhe do Animal | `CatalogAnimalDetail` (tipo no catalog domain) |
| Mídia | `CatalogAnimalMedia` (type: 'photo' \| 'video', url, sort_order) |
| ONG Responsável | `CatalogOngInfo` (name, city, state, phone, email) |
| Em Processo de Adoção | `status: 'in_adoption_process'` |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `services/backend/src/domains/catalog/catalog.types.ts` | add detail types |
| `modify` | `services/backend/src/domains/catalog/catalog.validator.ts` | add params schema |
| `modify` | `services/backend/src/domains/catalog/catalog.repository.ts` | add findByIdPublic method |
| `modify` | `services/backend/src/domains/catalog/catalog.service.ts` | add getAnimalDetail method |
| `modify` | `services/backend/src/domains/catalog/catalog.controller.ts` | add detail handler |
| `modify` | `services/backend/src/domains/catalog/catalog.routes.ts` | register GET /:id |
| `modify` | `services/frontend/src/types/catalog.types.ts` | add detail types |
| `modify` | `services/frontend/src/services/catalog.service.ts` | add getAnimalDetail |
| `create` | `services/frontend/src/hooks/useAnimalDetail.ts` | detail fetch hook |
| `create` | `services/frontend/src/components/catalog/MediaCarousel.tsx` | carousel component |
| `create` | `services/frontend/src/components/catalog/AnimalDetailModal.tsx` | detail modal |
| `modify` | `services/frontend/src/components/catalog/AnimalCard.tsx` | add onClick prop |
| `modify` | `services/frontend/src/pages/public/CatalogPage.tsx` | integrate modal |
| `create` | `services/backend/tests/integration/catalog.detail.spec.ts` | integration tests |
| `create` | `services/frontend/tests/components/AnimalDetailModal.spec.tsx` | component tests |

---

## Implementation

### `catalog.types.ts` *(modify — backend)*

**Reference pattern**: tipos existentes `CatalogAnimal`, `CatalogResponse` no mesmo arquivo.
**Additions**:
- `CatalogAnimalMedia`: `{ id: string; type: 'photo' | 'video'; url: string; mime_type: string; sort_order: number }`
- `CatalogOngInfo`: `{ name: string; city: string | null; state: string | null; phone: string | null; email: string | null }`
- `CatalogAnimalDetail`: todos os campos do animal (name, species, breed, sex, castration, temperament: string[], estimated_age_category, size, weight_kg, height_cm, length_cm, special_needs, special_needs_description, rescue_observations, general_observations, status) + `media: CatalogAnimalMedia[]` + `ong: CatalogOngInfo`
- `CatalogAnimalDetailResponse`: `{ data: CatalogAnimalDetail }`

---

### `catalog.validator.ts` *(modify)*

**Reference pattern**: `catalogQuerySchema` no mesmo arquivo.
**Addition**:
- `catalogDetailParamsSchema = z.object({ id: z.string().uuid() })`

---

### `catalog.repository.ts` *(modify)*

**Reference pattern**: `findByIdWithMedia` em `animal-management.repository.ts`.
**Differences from reference**:
- Método: `findByIdPublic(id: string): Promise<CatalogAnimalDetail | null>`
- NÃO exige `ongId` — é público
- Filtro de segurança: `WHERE a.status IN ('available', 'in_adoption_process') AND o.status = 'approved'`
- JOIN com `ongs` para trazer name, city, state, phone, email (APENAS esses campos)
- Query de mídia: `SELECT id, type, url, mime_type, sort_order FROM animal_media WHERE animal_id = :id ORDER BY sort_order ASC`
- Não retornar `ong_id`, `created_at`, `updated_at`, `inactivated_at`

---

### `catalog.service.ts` *(modify)*

**Reference pattern**: `listAnimals` no mesmo arquivo.
**Addition**:
- Método `getAnimalDetail(id: string): Promise<CatalogAnimalDetail>`
- Chama `catalogRepository.findByIdPublic(id)`
- Se resultado null → lançar erro com status 404, code `ANIMAL_NOT_FOUND`, message `Animal não encontrado no catálogo.`

---

### `catalog.controller.ts` *(modify)*

**Reference pattern**: método `list` no mesmo arquivo.
**Addition**:
- Método `detail(req, res, next)` — extrai `req.params.id`, chama `catalogService.getAnimalDetail(id)`, responde com `{ data: result }`

---

### `catalog.routes.ts` *(modify)*

**Reference pattern**: rota `GET /` no mesmo arquivo.
**Addition**:
- `router.get('/:id', validate(catalogDetailParamsSchema, 'params'), (req, res, next) => catalogController.detail(req, res, next))`
- Posicionar DEPOIS da rota `GET /` para evitar conflito de match

---

### `catalog.types.ts` *(modify — frontend)*

**Reference pattern**: `CatalogAnimal` no mesmo arquivo.
**Additions**: Espelhar os tipos backend — `CatalogAnimalDetail`, `CatalogAnimalMedia`, `CatalogOngInfo`

---

### `catalog.service.ts` *(modify — frontend)*

**Reference pattern**: `getAnimals` no mesmo arquivo.
**Addition**:
- `getAnimalDetail(id: string, signal?: AbortSignal): Promise<CatalogAnimalDetail>` — `GET /catalog/${id}` retornando `response.data.data`

---

### `useAnimalDetail.ts` *(create)*

**Reference pattern**: `useCatalog.ts` (padrão de fetch com AbortController e error handling).
**Differences from reference**:
- Lazy fetch: não carrega automaticamente no mount. Expõe `fetchDetail(id: string)` que dispara o request.
- State: `{ data: CatalogAnimalDetail | null; loading: boolean; error: string | null }`
- Ao chamar `fetchDetail`, aborta request anterior se existir
- Error message padrão: `'Não foi possível carregar os detalhes do animal. Tente novamente.'`
- Expõe `reset()` para limpar state ao fechar modal

---

### `MediaCarousel.tsx` *(create)*

**Reference pattern**: nenhum existente — construir com AntDesign `Carousel` (ou `Image.PreviewGroup` se mais adequado).
**Props**: `media: CatalogAnimalMedia[]; species: 'dog' | 'cat'`
**Comportamento**:
- 0 mídias → placeholder estático por espécie (emoji 🐕 ou 🐈 como no `AnimalCard`)
- 1 mídia → imagem/vídeo sem setas nem thumbnails
- 2+ mídias → setas laterais + strip de thumbnails clicáveis abaixo
- Vídeo: thumbnail com overlay play icon (▶). Ao clicar, renderiza `<video>` com controls, autoplay
- Imagem com erro de carregamento → placeholder com ícone de imagem quebrada (AntDesign `<Empty>` ou custom)
- Touch: usar Carousel nativo com swipe ou CSS `scroll-snap`
- Altura do carrossel: fixa em ~300px desktop, adaptar em mobile
- `sort_order` já vem ordenado da API — renderizar na ordem recebida

---

### `AnimalDetailModal.tsx` *(create)*

**Reference pattern**: nenhum modal existente no projeto — usar `Modal` do AntDesign diretamente.
**Props**: `animalId: string | null; onClose: () => void`
**Comportamento**:
- `open={!!animalId}` — controle externo via prop
- Ao abrir (animalId muda para non-null): chama `useAnimalDetail().fetchDetail(animalId)`
- Ao fechar: chama `onClose()` + `reset()` do hook
- Layout interno (scroll):
  1. `<MediaCarousel media={data.media} species={data.species} />`
  2. `<Title level={3}>{data.name}</Title>`
  3. Seção "Dados Básicos": grid/descriptions com espécie, raça, sexo, castração, idade (mapear categoria), porte — usar `Descriptions` do AntDesign
  4. Seção "Temperamento" (condicional: array.length > 0): `Tag` coloridas (#9b59b6 como no card)
  5. Seção "Informações Físicas" (condicional: ao menos 1 preenchido): peso (kg), altura (cm), comprimento (cm)
  6. Seção "Necessidades Especiais" (condicional: special_needs === true): Alert ou destaque com descrição
  7. Seção "Observações" (condicional: ao menos 1 preenchido): general_observations e/ou rescue_observations
  8. Seção "ONG Responsável": nome, cidade/estado, contato (telefone ou email)
- Footer fixo:
  - Status "available": `<Button disabled><Tooltip title="Em breve">Solicitar Adoção</Tooltip></Button>`
  - Status "in_adoption_process": `<Alert message="Este animal já está em processo de adoção." />` + `<Button disabled><Tooltip title="Em breve">Entrar na fila de espera</Tooltip></Button>`
- Loading state: `<Skeleton>` dentro da modal
- Error state: mensagem de erro + botão retry ou fechar modal
- Mapear `estimated_age_category`: puppy→Filhote, young→Jovem, adult→Adulto, senior→Idoso
- Mapear `castration`: yes→Sim, no→Não, unknown→Desconhecido
- Mapear `size`: small→Pequeno, medium→Médio, large→Grande
- Mapear `sex`: male→Macho, female→Fêmea
- Mapear `species`: dog→Cachorro, cat→Gato

---

### `AnimalCard.tsx` *(modify)*

**Reference pattern**: componente existente no mesmo arquivo.
**Changes**:
- Adicionar prop `onClick?: (id: string) => void`
- No `<Card>`: `onClick={() => onClick?.(animal.id)}`
- Adicionar `cursor: pointer` ao card style (já tem `hoverable` que cuida disso)

---

### `CatalogPage.tsx` *(modify)*

**Reference pattern**: estado existente no componente.
**Changes**:
- Adicionar state: `const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)`
- Passar `onClick={setSelectedAnimalId}` ao `<AnimalCard>`
- Renderizar `<AnimalDetailModal animalId={selectedAnimalId} onClose={() => setSelectedAnimalId(null)} />` após a grid

---

### `catalog.detail.spec.ts` *(create — backend tests)*

**Reference pattern**: `tests/integration/auth.login.spec.ts` (padrão de teste de integração).
**Cenários**:
- 200: animal disponível retorna detalhes completos + mídia + ong
- 200: animal em processo de adoção retorna detalhes com status correto
- 404: UUID válido mas animal inexistente → `{ error: { code: 'ANIMAL_NOT_FOUND' } }`
- 404: animal com status 'adopted' ou 'inactive' → 404
- 400: ID não-UUID → erro de validação
- Verificar que campos sensíveis da ONG (cnpj, endereço completo) NÃO são retornados

---

### `AnimalDetailModal.spec.tsx` *(create — frontend tests)*

**Reference pattern**: testes existentes em `tests/components/`.
**Cenários**:
- Renderiza modal quando `animalId` é non-null
- Não renderiza quando `animalId` é null
- Exibe todas as seções quando dados completos
- Omite seção "Necessidades Especiais" quando `special_needs = false`
- Omite seção "Temperamento" quando array vazio
- Omite campos físicos quando nulos
- Botão "Solicitar Adoção" está disabled para status 'available'
- Exibe aviso + "Entrar na fila" para status 'in_adoption_process'
- Exibe loading skeleton durante fetch
- Exibe erro quando fetch falha

---

## Acceptance Criteria

- [ ] **Given** visitante na listagem do catálogo, **When** clica em um card, **Then** modal abre com carrossel de mídia, nome, dados básicos, temperamento, ONG e botão de ação.
- [ ] **Given** modal aberta, **When** clica X, Escape ou overlay, **Then** modal fecha e catálogo mantém filtros e scroll.
- [ ] **Given** animal com múltiplas mídias, **When** navega no carrossel (setas/thumbnails/swipe), **Then** mídia muda na ordem de sort_order.
- [ ] **Given** animal com vídeo, **When** clica play no carrossel, **Then** vídeo reproduz inline.
- [ ] **Given** animal sem mídia, **When** modal abre, **Then** placeholder de espécie é exibido.
- [ ] **Given** animal com 1 foto apenas, **When** modal abre, **Then** foto exibida sem setas e sem thumbnails.
- [ ] **Given** animal com `special_needs = false`, **When** modal abre, **Then** seção "Necessidades Especiais" ausente do DOM.
- [ ] **Given** animal com peso/altura/comprimento nulos, **When** modal abre, **Then** campos omitidos (não exibe "0" ou vazio).
- [ ] **Given** animal com temperamento vazio, **When** modal abre, **Then** seção de temperamento ausente do DOM.
- [ ] **Given** animal "Em Processo de Adoção", **When** modal abre, **Then** exibe aviso genérico + botão "Entrar na fila de espera" disabled com tooltip "Em breve".
- [ ] **Given** animal "Disponível", **When** modal abre, **Then** botão "Solicitar Adoção" disabled com tooltip "Em breve".
- [ ] **Given** `GET /catalog/:id` com UUID válido de animal público, **When** requisição feita, **Then** retorna 200 com todos os campos definidos em `CatalogAnimalDetail`.
- [ ] **Given** `GET /catalog/:id` com UUID de animal inexistente/adotado/inativo, **When** requisição feita, **Then** retorna 404 com code `ANIMAL_NOT_FOUND`.
- [ ] **Given** `GET /catalog/:id` com string não-UUID, **When** requisição feita, **Then** retorna 400 (validation error).
- [ ] Dados da ONG retornados limitados a: name, city, state, phone, email — CNPJ e endereço completo NUNCA retornados.
- [ ] Modal responsiva: funciona sem quebras de layout em 320px–1920px+.
- [ ] Navegação por teclado: Escape fecha modal, Tab navega elementos, setas controlam carrossel.

---

## API Notes

- **Endpoint**: `GET /api/v1/catalog/:id`
- **Auth**: Nenhuma (endpoint público)
- **Input**: `id` como path param (UUID v4)
- **Success**: `200` — `{ data: CatalogAnimalDetail }`
- **Errors**: `404` — animal não encontrado ou sem status público; `400` — UUID inválido
- **Segurança**: Retorna apenas animais com `status IN ('available', 'in_adoption_process')` E `ong.status = 'approved'`. Não expõe ong_id, cnpj, endereço ou dados internos.

---

## Dependencies

- **Requires**: FEATURE-001 (catálogo com listagem de cards) — já implementada
- **Blocks**: Feature de Pedido de Adoção (botão será habilitado quando implementada)