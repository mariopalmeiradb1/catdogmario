# FEATURE-001 — Navegação, Listagem e Filtros de Busca do Catálogo Público

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-001 — Navegação, Listagem e Filtros de Busca do Catálogo Público_
**Módulo:** _MODULE-003 — Catálogo Público_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-05-30_
**Aprovado por:** _A preencher_

---

## Objetivo da Feature

O catálogo público é a principal porta de entrada para potenciais adotantes conhecerem os animais disponíveis. Esta feature resolve o gargalo de visibilidade: atualmente, interessados precisam visitar ONGs presencialmente para conhecer os animais. Com a listagem pública e os filtros de busca, qualquer pessoa pode navegar por todos os animais cadastrados na plataforma sem criar conta ou fazer login, encontrando rapidamente animais compatíveis com suas preferências. O valor entregue é o aumento em 60% da exposição dos animais e a democratização do acesso à informação, reduzindo o tempo de busca e aumentando a probabilidade de match entre animal e adotante.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Visitante anônimo | Leitura | Qualquer pessoa sem login pode visualizar e filtrar o catálogo |
| Adotante (logado ou não) | Leitura | Pode navegar pelo catálogo independentemente do estado de autenticação |

---

### Premissas

- O módulo de Gestão de Animais já está implementado e fornece os dados dos animais cadastrados.
- As ONGs possuem endereço cadastrado com cidade/estado, usado como localização do animal no catálogo.
- O módulo de autenticação existe mas NÃO é necessário para acessar esta feature.
- Animais cadastrados possuem ao menos os campos obrigatórios preenchidos: nome, espécie, raça, sexo, porte, idade estimada.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| Gestão de Animais — Cadastro de Animal | FEATURE | Pendente | Sem animais cadastrados, o catálogo não tem dados para exibir |
| Gestão de ONGs — Cadastro de ONG | FEATURE | Pendente | Sem ONGs, não há localização para exibir nos cards |
| Dados de localização da ONG (cidade/estado) | Decisão técnica | Pendente | Cards não exibem localização corretamente |

---

### Referências e Insumos

**Protótipo / Wireframe:**
- Arquivo local: `specs/module_003_catálogo_público/feature_001_catalogo_listagem_filtros/assets/prototype-v1.png`

**Artefatos consultados:**
- `overview/glossary_context.md` — termos: Animal/Pet, ONG, Adotante
- `product/scope_features_context.md` — módulo Catálogo Público e features associadas

**Tabelas de banco de dados:** Animais, ONGs — conforme cadastros dos respectivos módulos

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Visualizar catálogo de animais disponíveis

Como visitante do site, quero ver uma lista de animais disponíveis para adoção, para que eu possa conhecer as opções sem precisar visitar ONGs presencialmente.

**Pode ser testada independentemente:** Sim. Basta existir ao menos um animal com status "Disponível" na plataforma para verificar que a grade de cards é exibida corretamente.

**Cenários de aceite:**

1. **Dado** que existem animais com status "Disponível" cadastrados na plataforma, **quando** acesso a página do catálogo público sem estar logado, **então** vejo uma grade de cards com foto, nome, localização, tag de espécie, tags de sexo/porte/idade e descrição breve de cada animal.
2. **Dado** que não existem animais disponíveis na plataforma, **quando** acesso o catálogo, **então** vejo a mensagem "Nenhum animal disponível no momento. Volte em breve!"
3. **Dado** que estou visualizando o catálogo em um dispositivo mobile, **quando** a página carrega, **então** os cards são exibidos em coluna única com layout legível e navegável por toque.

---

#### HU-02 — Carregar mais animais via scroll infinito

Como visitante navegando o catálogo, quero que mais animais sejam carregados automaticamente ao rolar a página, para que eu possa ver todos os animais disponíveis sem clicar em botões de paginação.

**Pode ser testada independentemente:** Sim. Basta existirem mais de 8 animais disponíveis para verificar que o carregamento automático funciona ao rolar.

**Cenários de aceite:**

1. **Dado** que existem mais de 8 animais disponíveis, **quando** rolo a página até o final dos cards exibidos, **então** mais 8 cards são carregados automaticamente abaixo dos existentes.
2. **Dado** que todos os animais já foram carregados, **quando** rolo ao final da lista, **então** nenhum carregamento adicional é feito.
3. **Dado** que o próximo lote está carregando, **quando** olho o final da lista, **então** vejo um indicador de carregamento (skeleton cards no formato dos cards reais).

---

#### HU-03 — Filtrar animais por espécie

Como visitante do catálogo, quero filtrar os animais por espécie (cão ou gato), para que eu veja apenas os animais do tipo que me interesso em adotar.

**Pode ser testada independentemente:** Sim. Basta existirem animais de ambas as espécies para verificar que a filtragem retorna apenas a espécie selecionada.

**Cenários de aceite:**

1. **Dado** que estou no catálogo com filtro de espécie em "Todos", **quando** seleciono "Cachorro", **então** apenas cães disponíveis são exibidos e os resultados atualizam automaticamente.
2. **Dado** que selecionei "Gato" e havia um filtro de raça com raça canina selecionada, **quando** a espécie muda, **então** o filtro de raça é resetado e mostra apenas raças felinas.
3. **Dado** que selecionei "Cachorro" e não existem cães disponíveis, **quando** o filtro é aplicado, **então** vejo a mensagem "Nenhum animal encontrado com os filtros selecionados. Tente ajustar sua busca."

---

#### HU-04 — Filtrar animais por raça com cascateamento

Como visitante do catálogo, quero filtrar por raça específica com opções que dependem da espécie selecionada, para que eu encontre rapidamente a raça que procuro.

**Pode ser testada independentemente:** Sim. Basta alterar o filtro de espécie e verificar que as opções de raça se atualizam corretamente.

**Cenários de aceite:**

1. **Dado** que espécie = "Cachorro", **quando** abro o filtro de raça, **então** vejo as 11 raças caninas: Vira-lata (SRD), Labrador Retriever, Golden Retriever, Pastor Alemão, Bulldog Francês, Poodle, Beagle, Border Collie, Shih Tzu, Rottweiler, Dachshund (salsicha).
2. **Dado** que espécie = "Gato", **quando** abro o filtro de raça, **então** vejo as 10 raças felinas: Vira-lata (SRD), Persa, Maine Coon, Siamês, Ragdoll, British Shorthair, Sphynx (sem pelo), Bengal, Angorá, Munchkin.
3. **Dado** que espécie = "Todos", **quando** abro o filtro de raça, **então** vejo todas as 21 raças (cães + gatos) disponíveis.
4. **Dado** que selecionei raça "Labrador Retriever" com espécie "Cachorro", **quando** mudo espécie para "Gato", **então** o filtro de raça é limpo automaticamente.

---

#### HU-05 — Buscar animais por nome ou cidade

Como visitante do catálogo, quero digitar o nome de um animal ou uma cidade na barra de busca, para que eu encontre rapidamente um animal específico ou animais de uma região.

**Pode ser testada independentemente:** Sim. Basta digitar um nome ou cidade existente e verificar que os resultados filtram corretamente.

**Cenários de aceite:**

1. **Dado** que digito "Brisa" na barra de busca, **quando** passo do debounce, **então** vejo apenas animais cujo nome contenha "Brisa".
2. **Dado** que digito "Campo Mourão" na barra de busca, **quando** os resultados atualizam, **então** vejo animais de ONGs localizadas em Campo Mourão.
3. **Dado** que digito um texto que não corresponde a nenhum animal ou cidade, **quando** os resultados atualizam, **então** vejo a mensagem "Nenhum animal encontrado com os filtros selecionados. Tente ajustar sua busca."
4. **Dado** que limpo o campo de busca, **quando** o campo fica vazio, **então** o catálogo volta a exibir todos os animais (respeitando outros filtros ativos).

---

#### HU-06 — Combinar múltiplos filtros

Como visitante do catálogo, quero aplicar vários filtros simultaneamente, para que eu encontre animais que atendam a todos os meus critérios de preferência.

**Pode ser testada independentemente:** Sim. Basta selecionar mais de um filtro e verificar que os resultados atendem a TODOS os critérios combinados.

**Cenários de aceite:**

1. **Dado** que seleciono espécie "Cachorro", porte "Médio" e sexo "Feminino", **quando** os filtros são aplicados, **então** apenas cães fêmeas de porte médio disponíveis são exibidos.
2. **Dado** que tenho filtros combinados ativos e quero remover um, **quando** desseleciono/limpo um filtro individual, **então** os demais filtros permanecem ativos e os resultados atualizam.
3. **Dado** que ativo o switch de necessidades especiais combinado com outros filtros, **quando** os resultados atualizam, **então** apenas animais que possuem necessidades especiais E atendem aos outros filtros são exibidos.

---

#### HU-07 — Compartilhar catálogo filtrado via URL

Como visitante do catálogo, quero que os filtros aplicados sejam refletidos na URL, para que eu possa compartilhar um link com os resultados filtrados para outra pessoa.

**Pode ser testada independentemente:** Sim. Basta aplicar filtros, copiar a URL e acessá-la em outra aba para verificar que os filtros são restaurados.

**Cenários de aceite:**

1. **Dado** que aplico filtros (ex.: espécie=cachorro, porte=grande), **quando** copio a URL da barra de endereço, **então** a URL contém os query params dos filtros ativos.
2. **Dado** que recebo uma URL com filtros nos query params, **quando** acesso essa URL, **então** os filtros são pré-preenchidos e os resultados já estão filtrados.
3. **Dado** que a URL contém parâmetros de filtro inválidos, **quando** acesso essa URL, **então** os parâmetros inválidos são ignorados e o catálogo carrega com filtros padrão.

---

### Regras de Negócio

- **RN-01:** Somente animais com status "Disponível" são exibidos no catálogo público.
- **RN-02:** O catálogo exibe animais de TODAS as ONGs cadastradas e aprovadas, sem separação por tenant.
- **RN-03:** A localização exibida no card do animal é derivada do endereço cadastrado da ONG responsável (cidade/estado).
- **RN-04:** O filtro de raça é cascateado: depende da espécie selecionada. Se espécie = "Todos", exibe raças de cães e gatos combinadas.
- **RN-05:** Filtros podem ser combinados livremente (lógica AND entre todos os filtros ativos).
- **RN-06:** Animais sem foto são exibidos com imagem placeholder contendo o ícone da espécie (cão ou gato).
- **RN-07:** A idade é exibida como texto estimado (ex.: "2 anos", "6 meses").
- **RN-08:** O card exibe apenas a foto principal (primeira foto cadastrada) do animal.
- **RN-09:** Os filtros ativos são refletidos na URL (query params) para permitir compartilhamento de links com filtros aplicados.
- **RN-10:** Ao alterar qualquer filtro, os resultados são atualizados automaticamente (sem botão de submissão).
- **RN-11:** O carregamento de cards segue infinite scroll com lotes de 8 cards.
- **RN-12:** Ao selecionar uma espécie diferente, o filtro de raça é resetado e suas opções são atualizadas conforme a nova espécie.
- **RN-13:** A busca textual pesquisa simultaneamente no nome do animal e na cidade da ONG.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Ao acessar a página do catálogo público, o usuário vê:
- Uma barra de busca textual com placeholder "Busque por nome ou cidade"
- Uma barra de filtros contendo: espécie (select), raça (select cascateado), idade (numérico), porte (select), sexo (select), temperamento (select), necessidades especiais (switch)
- Uma grade de cards de animais disponíveis (até 8 cards no carregamento inicial)
- Cada card contém: foto principal (ou placeholder), nome do animal, localização (cidade da ONG), tag de espécie (cachorro/gato), tags de sexo/porte/idade, e uma descrição breve
- Design: fundo cinza claro, cards brancos com cantos arredondados, tags em tom lilás suave

#### Ações disponíveis

**Ação 1 — Busca textual**

O visitante digita na barra de busca e, após debounce, os resultados são filtrados por nome do animal ou cidade da ONG.

Regras condicionais:
- Se o texto digitado corresponde a nomes de animais → exibe animais cujo nome contenha o texto
- Se o texto digitado corresponde a cidades de ONGs → exibe animais de ONGs naquela cidade
- Se o campo é limpo → retorna todos os animais (respeitando demais filtros ativos)

**Ação 2 — Seleção de filtros**

O visitante seleciona valores nos filtros disponíveis e os resultados atualizam automaticamente.

Regras condicionais:
- Se filtro de espécie é alterado → filtro de raça é resetado e suas opções são atualizadas
- Se filtro de necessidades especiais é ativado → exibe apenas animais com necessidades especiais registradas
- Se combinação de filtros não retorna resultados → exibe mensagem de estado vazio

**Ação 3 — Scroll infinito**

O visitante rola a página para baixo e novos cards são carregados automaticamente.

Regras condicionais:
- Se há mais animais além dos já carregados → carrega próximo lote de 8 cards
- Se todos os animais já foram carregados → nenhuma ação adicional é executada
- Se está em processo de carregamento → exibe skeleton cards como indicador

---

#### Validações e Restrições

- O campo de idade aceita apenas valores numéricos positivos entre 1 e 30. Valores 0, negativos ou acima de 30 são ignorados. O campo possui opção de limpar.
- A busca textual tem debounce de 600ms para evitar requisições excessivas.
- O campo de idade tem debounce de 600ms, valor máximo de 30 anos e opção de limpar (allowClear).
- Nomes de animais longos (acima do espaço disponível no card) são truncados com reticências.
- Caracteres especiais na busca textual são sanitizados.
- URLs com query params inválidos são ignoradas (filtros carregam com valores padrão).

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Nenhum animal disponível na plataforma | "Nenhum animal disponível no momento. Volte em breve!" |
| Filtros aplicados sem resultado | "Nenhum animal encontrado com os filtros selecionados. Tente ajustar sua busca." |
| Erro de carregamento (falha de conexão/servidor) | "Não foi possível carregar os animais. Tente novamente em alguns instantes." (com botão "Tentar novamente") |
| Carregamento em andamento | Skeleton/shimmer cards no formato dos cards reais |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | O catálogo carrega rapidamente na primeira visita | Primeiro lote de 8 cards visível em menos de 2 segundos |
| RNF-02 | Escalabilidade | O sistema mantém desempenho aceitável com volume crescente de dados | Suporta até 1.000 animais cadastrados sem degradação perceptível |
| RNF-03 | Responsividade | O layout se adapta a diferentes tamanhos de tela | 4 colunas em desktop, 2 colunas em tablet, 1 coluna em mobile |
| RNF-04 | Desempenho | A aplicação de filtros é percebida como instantânea | Resultados refletem filtros em menos de 500ms |
| RNF-05 | Desempenho | Imagens não bloqueiam o carregamento da página | Lazy loading para cards fora da viewport |
| RNF-06 | Acessibilidade | O catálogo é acessível sem autenticação | Rota pública, sem redirecionamento para login |
| RNF-07 | Usabilidade | A busca textual e campo de idade não disparam requisições a cada tecla | Debounce de 600ms aplicado ao campo de busca e ao campo de idade |

---

### O que Não Deve Ser Feito

- Esta feature NÃO inclui a página de detalhe do animal (feature separada: Visualização Detalhada do Animal).
- NÃO permite favoritar ou salvar animais.
- NÃO inclui envio de solicitação de adoção a partir do catálogo.
- NÃO exibe perfil clicável da ONG.
- NÃO inclui compartilhamento em redes sociais (botão de share).
- NÃO implementa notificações de novos animais.
- NÃO implementa ordenação pelo usuário (sort).
- NÃO inclui filtro por ONG específica.
- NÃO inclui geolocalização ou cálculo de distância.
- NÃO implementa internacionalização (apenas Português BR).

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Catálogo com animais disponíveis | Acesso à página sem login | Grade de cards exibida com dados corretos | Positivo |
| CT-02 | Filtrar por espécie "Gato" | Selecionar "Gato" no filtro | Apenas gatos exibidos | Positivo |
| CT-03 | Buscar por nome existente | Digitar "Brisa" na busca | Animal "Brisa" exibido | Positivo |
| CT-04 | Buscar por cidade existente | Digitar "Campo Mourão" | Animais de Campo Mourão exibidos | Positivo |
| CT-05 | Combinar espécie + porte + sexo | Cachorro + Médio + Feminino | Apenas cães fêmeas de porte médio | Positivo |
| CT-06 | Acessar URL com query params válidos | URL com ?especie=cachorro&porte=grande | Filtros pré-preenchidos, resultados filtrados | Positivo |
| CT-07 | Scroll infinito com 20 animais | Rolar até o final da lista | 8 cards iniciais + 8 ao rolar + 4 no próximo lote | Positivo |
| CT-08 | Raças cascateiam com espécie | Selecionar "Cachorro" e abrir raça | 11 raças caninas exibidas | Positivo |
| CT-09 | Switch necessidades especiais ativado | Ativar switch | Apenas animais com necessidades especiais | Positivo |
| CT-10 | Layout mobile | Viewport 375px | Cards em 1 coluna, filtros acessíveis | Positivo |
| CT-11 | Catálogo sem animais | Plataforma sem animais disponíveis | Mensagem "Nenhum animal disponível no momento. Volte em breve!" | Negativo |
| CT-12 | Filtros sem resultado | Combinação que não retorna dados | Mensagem "Nenhum animal encontrado com os filtros selecionados." | Negativo |
| CT-13 | Falha de rede ao carregar | Simular erro de conexão | Mensagem de erro com botão "Tentar novamente" | Negativo |
| CT-14 | URL com query params inválidos | URL com ?especie=xyz | Params ignorados, catálogo com filtros padrão | Negativo |
| CT-15 | Idade com valor negativo | Digitar -1 no campo de idade | Filtro não aplicado / ignorado | Negativo |
| CT-16 | Busca com caracteres especiais | Digitar script injection | Sanitização aplicada, sem erro, sem resultados | Negativo |
| CT-17 | Exatamente 1 animal disponível | Apenas 1 animal com status "Disponível" | 1 card exibido, sem infinite scroll | Borda |
| CT-18 | Exatamente 8 animais | 8 animais disponíveis | 8 cards exibidos, sem trigger de scroll | Borda |
| CT-19 | Animal com nome longo | Nome com 200+ caracteres | Truncado com reticências no card | Borda |
| CT-20 | Trocar espécie com raça selecionada | Ter raça canina selecionada, mudar para "Gato" | Raça reseta, resultados atualizam | Borda |
| CT-21 | Scroll rápido | Rolar rapidamente disparando múltiplos eventos | Não duplica cards, carrega sequencialmente | Borda |
| CT-22 | Animal sem foto cadastrada | Animal sem nenhuma foto | Placeholder com ícone da espécie exibido | Borda |
| CT-23 | Animal muda status durante navegação | Animal sai de "Disponível" enquanto usuário navega | Não aparece no próximo lote carregado | Borda |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O catálogo exibe cards de todos os animais com status "Disponível" de todas as ONGs aprovadas.
- [ ] CA-02: Cada card exibe foto principal, nome, localização, tag de espécie, tags de sexo/porte/idade e descrição breve.
- [ ] CA-03: O layout é responsivo: 4 colunas em desktop, 2 em tablet, 1 em mobile.
- [ ] CA-04: Os filtros (espécie, raça, idade, porte, sexo, temperamento, necessidades especiais) funcionam corretamente e podem ser combinados.
- [ ] CA-05: O filtro de raça cascateia corretamente com a espécie selecionada.
- [ ] CA-06: A busca textual filtra por nome do animal e cidade da ONG simultaneamente.
- [ ] CA-07: Os filtros são aplicados automaticamente ao alterar qualquer campo (sem botão de submissão).
- [ ] CA-08: O infinite scroll carrega lotes de 8 cards ao rolar até o final.
- [ ] CA-09: Os filtros ativos são sincronizados com a URL via query params.
- [ ] CA-10: Estados vazios exibem mensagens adequadas (catálogo vazio, filtros sem resultado, erro de carregamento).
- [ ] CA-11: O catálogo é acessível sem login.

**Regressão:**
- [ ] Módulo de Gestão de Animais — alterações no cadastro de animal devem refletir corretamente no catálogo.
- [ ] Módulo de Gestão de ONGs — alterações na localização da ONG devem refletir nos cards.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Exposição dos animais (visualizações únicas) | 0 | Aumento de 60% vs. divulgação manual | Analytics de pageviews no catálogo |
| Tempo de carregamento inicial | N/A | < 2 segundos | Monitoramento de performance |
| Usuários que utilizam pelo menos 1 filtro | 0 | > 40% dos visitantes | Analytics de interação com filtros |
| Taxa de erro de carregamento | N/A | < 1% | Monitoramento de erros |
| Visitantes que visualizam mais de 8 cards (scroll) | 0 | > 60% dos visitantes | Analytics de scroll depth |

---
