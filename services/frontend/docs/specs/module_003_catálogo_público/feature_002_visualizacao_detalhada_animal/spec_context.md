# FEATURE-002 — Visualização Detalhada do Animal

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-002 — Visualização Detalhada do Animal_
**Módulo:** _MODULE-003 — Catálogo Público_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-06-02_
**Aprovado por:** _A preencher_

---

## Objetivo da Feature

O catálogo público exibe cards resumidos dos animais disponíveis, mas o visitante precisa de informações completas para avaliar se um animal é compatível com seu perfil e ambiente. Esta feature resolve esse problema entregando uma visualização detalhada com carrossel de fotos/vídeos e todos os dados do cadastro do animal. O benefício direto é permitir que potenciais adotantes tomem decisões informadas sem precisar visitar a ONG presencialmente, aumentando a probabilidade de match e reduzindo o tempo de permanência dos animais no abrigo.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Visitante anônimo | Leitura | Qualquer pessoa sem login pode visualizar detalhes de animais |
| Adotante (logado ou não) | Leitura | Pode visualizar detalhes independentemente do estado de autenticação |

---

### Premissas

- O catálogo público com listagem de cards (FEATURE-001) já está implementado e funcional.
- A API de detalhes do animal está disponível com todos os campos da entidade AnimalDetail (incluindo mídia e dados da ONG).
- Dados da ONG responsável (nome, cidade, telefone/email) estão acessíveis via relação com o animal.
- Placeholders por espécie (gato/cachorro) estão disponíveis como assets estáticos.
- Vídeos são hospedados e acessíveis via URL direta.
- O módulo de pedido de adoção será implementado em feature futura — o botão "Solicitar Adoção" permanece desabilitado nesta entrega.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 — Catálogo Público (Listagem e Filtros) | FEATURE | Implementada | Sem listagem de cards, não há ponto de entrada para abrir os detalhes |
| API de detalhes do animal (endpoint com dados completos + mídia) | API | Pendente | Modal não terá dados para exibir |
| Dados de contato da ONG (nome, cidade, telefone/email) | Decisão técnica | Pendente | Seção da ONG ficará incompleta |
| Módulo de Pedido de Adoção | FEATURE | Futuro | Botão "Solicitar Adoção" permanece desabilitado |

---

### Referências e Insumos

**Artefatos consultados:**
- `product/scope_features_context.md` — descrição da feature "Visualização Detalhada do Animal"
- `specs/module_003_catálogo_público/feature_001_catalogo_listagem_filtros/spec_context.md` — feature anterior do catálogo

**Tabelas de banco de dados:** Animals, Animals_Media, ONGs — conforme cadastros dos respectivos módulos

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Visualizar informações completas do animal

Como visitante do catálogo público, quero ver todas as informações de um animal ao clicar no seu card, para que eu possa avaliar se o animal é compatível com meu perfil e ambiente antes de considerar a adoção.

**Pode ser testada independentemente:** Sim. Basta existir ao menos um animal com status "Disponível" na plataforma para verificar que a modal abre e exibe todas as informações corretamente.

**Cenários de aceite:**

1. **Dado** que estou na listagem do catálogo público, **quando** clico em um card de animal com status "Disponível", **então** uma modal abre exibindo: carrossel de mídia, nome, dados básicos (espécie, raça, sexo, castração, idade, porte), temperamento em tags, informações físicas (peso, altura, comprimento), observações e dados da ONG (nome, cidade, contato).
2. **Dado** que a modal de detalhes está aberta, **quando** clico no botão fechar (X) ou pressiono Escape, **então** a modal fecha e a listagem do catálogo permanece no mesmo estado anterior (mesmos filtros, mesma posição de scroll).
3. **Dado** que o animal tem necessidades especiais, **quando** visualizo os detalhes na modal, **então** vejo uma seção adicional "Necessidades Especiais" com a descrição correspondente.
4. **Dado** que o animal NÃO tem necessidades especiais, **quando** visualizo os detalhes na modal, **então** a seção "Necessidades Especiais" não é exibida.
5. **Dado** que o animal está com status "Em Processo de Adoção", **quando** visualizo os detalhes na modal, **então** vejo um aviso informando que o animal está em processo de adoção e o botão exibe "Entrar na fila de espera" (desabilitado com tooltip "Em breve").
6. **Dado** que o animal tem campos opcionais nulos (peso, altura, comprimento), **quando** visualizo os detalhes na modal, **então** esses campos são omitidos da exibição (não mostram "0" ou vazio).
7. **Dado** que o array de temperamento está vazio, **quando** visualizo os detalhes, **então** a seção de temperamento não é exibida.
8. **Dado** que observações gerais e observações de resgate estão ambas vazias, **quando** visualizo os detalhes, **então** a seção de observações não é exibida.

---

#### HU-02 — Navegar pelo carrossel de mídia do animal

Como visitante visualizando detalhes de um animal, quero navegar entre fotos e assistir ao vídeo do animal, para que eu possa conhecer melhor sua aparência e comportamento.

**Pode ser testada independentemente:** Sim. Basta existir um animal com mais de uma mídia cadastrada para verificar que a navegação funciona.

**Cenários de aceite:**

1. **Dado** que a modal está aberta para um animal com múltiplas mídias (fotos e/ou vídeo), **quando** clico na seta direita ou em um thumbnail, **então** a mídia principal muda para o item selecionado, respeitando a ordem de prioridade definida no cadastro.
2. **Dado** que o carrossel está exibindo o item de vídeo, **quando** clico no botão de play, **então** o vídeo é reproduzido inline dentro do carrossel sem abrir player externo.
3. **Dado** que o animal não possui nenhuma mídia cadastrada, **quando** abro a modal de detalhes, **então** vejo uma imagem placeholder genérica correspondente à espécie do animal (gato ou cachorro).
4. **Dado** que o animal possui apenas 1 foto e nenhum vídeo, **quando** abro a modal de detalhes, **então** o carrossel exibe a foto sem setas de navegação e sem thumbnails.
5. **Dado** que estou em um dispositivo touch, **quando** faço gesto de swipe no carrossel, **então** a mídia avança ou retrocede conforme a direção do gesto.
6. **Dado** que uma imagem falha ao carregar, **quando** visualizo o carrossel, **então** vejo um placeholder de erro com ícone de imagem quebrada no lugar da foto com problema.

---

#### HU-03 — Identificar ONG responsável pelo animal

Como visitante visualizando detalhes de um animal, quero ver os dados da ONG responsável, para que eu saiba quem cuida do animal e como entrar em contato caso tenha interesse.

**Pode ser testada independentemente:** Sim. Basta verificar que a seção da ONG é exibida com as informações corretas da organização responsável pelo animal.

**Cenários de aceite:**

1. **Dado** que estou visualizando detalhes de um animal, **quando** olho a seção "ONG Responsável", **então** vejo o nome da ONG, a cidade e ao menos uma forma de contato (telefone ou e-mail).
2. **Dado** que a ONG não possui telefone cadastrado mas possui e-mail, **quando** visualizo a seção da ONG, **então** apenas o e-mail é exibido como forma de contato.

---

### Regras de Negócio

- **RN-01:** Somente animais com status "Disponível" ou "Em Processo de Adoção" podem ter seus detalhes visualizados no catálogo público.
- **RN-02:** A visualização de detalhes NÃO requer login ou cadastro.
- **RN-03:** A seção "Necessidades Especiais" só é renderizada quando o animal possui necessidades especiais registradas.
- **RN-04:** Campos opcionais com valor nulo (peso, altura, comprimento) são omitidos da exibição — nunca exibir "0" ou campo vazio.
- **RN-05:** A seção de temperamento só é exibida quando o array de temperamento contém ao menos um item.
- **RN-06:** A seção de observações só é exibida quando ao menos um dos campos (observações gerais ou observações de resgate) está preenchido.
- **RN-07:** Cada animal pode ter no máximo 3 fotos e 1 vídeo (até 30 segundos em HD).
- **RN-08:** A mídia no carrossel é exibida na ordem de prioridade definida pelo voluntário no momento do cadastro.
- **RN-09:** O aviso de "Em Processo de Adoção" NÃO expõe dados do outro adotante interessado — é genérico.
- **RN-10:** O botão "Solicitar Adoção" permanece desabilitado (com tooltip "Em breve") até a implementação do módulo de pedido de adoção.
- **RN-11:** Os dados da ONG exibidos são exclusivamente da ONG proprietária do animal.
- **RN-12:** Quando o animal não possui mídia, é exibido um placeholder genérico baseado na espécie (silhueta de gato ou cachorro).

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Ao clicar em um card de animal no catálogo, o sistema exibe uma modal com scroll interno contendo:

1. **Carrossel de mídia** (topo): fotos e vídeo do animal com navegação por setas, swipe e thumbnails clicáveis
2. **Nome do animal** em destaque (título)
3. **Dados básicos**: espécie, raça, sexo, castração (sim/não/desconhecido), idade estimada (filhote/jovem/adulto/idoso), porte (pequeno/médio/grande)
4. **Temperamento**: tags coloridas (chips/badges) com cada traço do temperamento
5. **Informações físicas** (condicionais): peso (kg), altura (cm), comprimento (cm) — exibidos apenas se preenchidos
6. **Necessidades especiais** (condicional): seção exibida apenas quando o animal tem necessidades especiais, com a descrição
7. **Observações** (condicional): observações gerais e/ou observações de resgate — exibidas apenas se preenchidas
8. **ONG responsável**: nome, cidade, telefone e/ou e-mail de contato
9. **Botão de ação** (rodapé fixo): "Solicitar Adoção" (desabilitado) ou "Entrar na fila de espera" (desabilitado) conforme status do animal

#### Ações disponíveis

**Ação 1 — Abrir modal de detalhes**

O visitante clica em um card de animal no catálogo e a modal abre com os dados completos do animal.

Regras condicionais:
- Se o animal está "Disponível" → botão exibe "Solicitar Adoção" (desabilitado, tooltip "Em breve")
- Se o animal está "Em Processo de Adoção" → aviso genérico + botão exibe "Entrar na fila de espera" (desabilitado, tooltip "Em breve")

**Ação 2 — Navegar no carrossel**

O visitante navega entre as mídias do animal usando setas laterais, thumbnails ou gestos de swipe.

Regras condicionais:
- Se há apenas 1 mídia → setas e thumbnails ficam ocultos
- Se o item atual é vídeo → exibe thumbnail com overlay de botão play
- Se o visitante clica no play do vídeo → reprodução inline dentro do carrossel

**Ação 3 — Fechar modal**

O visitante fecha a modal para retornar ao catálogo.

Regras condicionais:
- Se clica no X → modal fecha
- Se pressiona Escape → modal fecha
- Se clica fora da modal (overlay) → modal fecha
- Ao fechar, o catálogo mantém estado anterior (filtros, posição de scroll)

---

#### Validações e Restrições

- Modal não abre para animais com status diferente de "Disponível" ou "Em Processo de Adoção" (esses não aparecem no catálogo).
- O conteúdo da modal é scrollável quando ultrapassa a altura disponível da viewport.
- Navegação por teclado: Escape fecha, Tab navega entre elementos interativos, setas controlam o carrossel.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Animal em processo de adoção | 'Este animal já está em processo de adoção.' |
| Botão desabilitado (tooltip) | 'Em breve' |
| Falha ao carregar dados do animal | 'Não foi possível carregar os detalhes do animal. Tente novamente.' |
| Falha ao carregar vídeo | 'Vídeo indisponível' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | A modal deve carregar e exibir os dados rapidamente após o clique | Conteúdo visível em menos de 2 segundos |
| RNF-02 | Desempenho | Imagens devem carregar progressivamente | Lazy loading com placeholder até resolução completa |
| RNF-03 | Acessibilidade | Navegação completa por teclado | Escape fecha, Tab navega, setas controlam carrossel |
| RNF-04 | Usabilidade | Suporte a gestos touch no carrossel | Swipe funcional em dispositivos móveis |
| RNF-05 | Responsividade | A modal deve funcionar em todas as viewports | De 320px a 1920px+ sem quebras de layout |

---

### O que Não Deve Ser Feito

- Esta feature NÃO implementa a ação efetiva de "Solicitar Adoção" ou "Entrar na fila" — apenas exibe o botão desabilitado.
- Esta feature NÃO cria uma página dedicada com URL própria — é uma modal sobre o catálogo.
- Esta feature NÃO implementa SEO, meta tags ou Open Graph para a página de detalhes.
- Esta feature NÃO implementa botões de compartilhamento em redes sociais.
- Esta feature NÃO permite favoritar ou salvar animais.
- Esta feature NÃO implementa chat com a ONG.
- Esta feature NÃO implementa zoom em fotos ou tela cheia para vídeos.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Abrir modal de animal disponível | Clique no card de animal com status "Disponível" | Modal abre com todas as seções preenchidas | Positivo |
| CT-02 | Abrir modal de animal em processo | Clique no card de animal "Em Processo de Adoção" | Modal abre com aviso de processo + botão "Entrar na fila" desabilitado | Positivo |
| CT-03 | Fechar modal com X | Clique no botão fechar | Modal fecha, catálogo mantém estado | Positivo |
| CT-04 | Fechar modal com Escape | Pressionar tecla Escape | Modal fecha | Positivo |
| CT-05 | Fechar modal clicando fora | Clique no overlay fora da modal | Modal fecha | Positivo |
| CT-06 | Navegar carrossel com setas | Clique na seta direita | Próxima mídia é exibida na ordem | Positivo |
| CT-07 | Navegar carrossel com thumbnail | Clique em thumbnail específico | Mídia correspondente é exibida | Positivo |
| CT-08 | Reproduzir vídeo inline | Clique no play do vídeo | Vídeo reproduz dentro do carrossel | Positivo |
| CT-09 | Animal sem mídia | Abrir detalhes de animal sem fotos/vídeo | Placeholder de espécie exibido | Borda |
| CT-10 | Animal com 1 foto apenas | Abrir detalhes | Foto exibida sem setas e sem thumbnails | Borda |
| CT-11 | Campos opcionais nulos | Animal com peso/altura/comprimento nulos | Campos omitidos, sem "0" ou vazio | Borda |
| CT-12 | Sem necessidades especiais | Animal sem necessidades especiais | Seção não renderizada | Negativo |
| CT-13 | Com necessidades especiais | Animal com necessidades especiais | Seção renderizada com descrição | Positivo |
| CT-14 | Temperamento vazio | Animal com array vazio de temperamento | Seção de temperamento omitida | Borda |
| CT-15 | Observações vazias | Ambos campos de observações nulos | Seção de observações omitida | Borda |
| CT-16 | Falha ao carregar dados | Erro na API de detalhes | Mensagem de erro exibida, modal não abre | Negativo |
| CT-17 | Falha ao carregar imagem | URL de imagem inválida | Placeholder de erro exibido no lugar | Negativo |
| CT-18 | Swipe em mobile | Gesto de swipe no carrossel | Navegação funciona por toque | Positivo |
| CT-19 | Tooltip no botão desabilitado | Hover no botão "Solicitar Adoção" | Tooltip "Em breve" exibido | Positivo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O sistema exibe modal com informações completas ao clicar no card de um animal.
- [ ] CA-02: O carrossel permite navegação entre fotos e reprodução de vídeo inline.
- [ ] CA-03: Seções condicionais (necessidades especiais, temperamento, observações, campos físicos) são omitidas quando dados estão vazios ou nulos.
- [ ] CA-04: O botão de ação exibe texto adequado ao status e permanece desabilitado com tooltip.
- [ ] CA-05: A modal fecha corretamente por X, Escape ou clique no overlay, preservando o estado do catálogo.
- [ ] CA-06: Dados da ONG responsável são exibidos (nome, cidade, contato).
- [ ] CA-07: A modal é responsiva e funcional em viewports de 320px a 1920px+.
- [ ] CA-08: Navegação por teclado funciona (Escape, Tab, setas).

**Regressão:**
- [ ] FEATURE-001 — A listagem do catálogo não é afetada (filtros, scroll infinito, cards continuam funcionando).

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Visitantes que abrem detalhes de animais | 0 | >50% dos visitantes do catálogo clicam em ao menos 1 animal | Analytics de eventos |
| Tempo médio na visualização de detalhes | N/A | >30 segundos (indica engajamento com conteúdo) | Analytics de tempo |
| Taxa de abertura da modal sem erros | N/A | >99% | Monitoramento de erros |

---
