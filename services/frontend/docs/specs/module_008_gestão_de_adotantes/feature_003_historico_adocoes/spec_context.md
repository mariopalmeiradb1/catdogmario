# FEATURE-003 — Histórico de Adoções

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-003 — Histórico de Adoções_
**Módulo:** _MODULE-008 — Gestão de Adotantes_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-06-03_
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

O adotante visualiza seu histórico completo de pedidos de adoção anteriores (pendentes, aprovados, rejeitados, cancelados) e adoções realizadas, incluindo nome do animal, data do pedido, status atual e ONG responsável. Essa feature entrega transparência e controle ao adotante, permitindo que ele acompanhe toda sua jornada dentro da plataforma, independentemente da ONG envolvida.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Adotante (autenticado, com perfil) | Leitura | Visualiza apenas seus próprios pedidos em todas as ONGs |

---

### Premissas

- O adotante já possui perfil cadastrado (FEATURE-001 concluída).
- O usuário está autenticado (MODULE-002).
- O módulo de Gestão de Pedidos de Adoção (MODULE-006) já está funcional e fornece os dados de pedidos.
- O histórico é somente leitura — nenhuma ação de escrita é possível nesta tela.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 — Cadastro de Adotante | FEATURE | Resolvida | Sem perfil, não há adotante para ter histórico |
| MODULE-006 — Gestão de Pedidos de Adoção | FEATURE | Pendente | Fornece os dados de pedidos que compõem o histórico |
| MODULE-005 — Gestão de Animais | FEATURE | Resolvida | Fornece dados do animal (nome, foto, espécie) |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — definição de "Pedido de adoção" e ciclo de vida dos status
- product/scope_features_context.md — escopo do módulo Gestão de Adotantes

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Visualizar histórico de pedidos de adoção

Como **adotante**, quero visualizar o histórico completo dos meus pedidos de adoção em todas as ONGs, para que eu tenha transparência e controle sobre minha jornada na plataforma.

**Pode ser testada independentemente:** Sim. Ao acessar a seção "Meu Histórico", a lista de pedidos é exibida ordenada por data, com filtros funcionais e paginação.

**Cenários de aceite:**

1. **Dado** que o adotante está autenticado e possui pedidos de adoção anteriores, **quando** ele acessa a seção "Meu Histórico", **então** o sistema exibe uma lista de todos os pedidos ordenados por data (mais recente primeiro), e cada item mostra: nome do animal, data do pedido, status atual e nome da ONG.
2. **Dado** que o adotante está autenticado e não possui nenhum pedido de adoção, **quando** ele acessa a seção "Meu Histórico", **então** o sistema exibe a mensagem "Você ainda não fez nenhum pedido de adoção." e exibe um link "Explorar animais disponíveis" direcionando ao catálogo público.
3. **Dado** que o adotante está visualizando seu histórico com múltiplos pedidos, **quando** ele seleciona o filtro "Concluído", **então** o sistema exibe apenas os pedidos com status "Concluído" e mantém a ordenação por data.
4. **Dado** que o adotante possui mais de 10 pedidos de adoção, **quando** ele acessa o histórico, **então** o sistema exibe os primeiros 10 registros e exibe controles de paginação para navegar entre as páginas.

---

#### HU-02 — Visualizar detalhes de um pedido no histórico

Como **adotante**, quero acessar os detalhes de um pedido específico no meu histórico, para que eu possa ver informações completas sobre aquele processo de adoção.

**Pode ser testada independentemente:** Sim. Ao clicar em um pedido na lista, a tela de detalhe é exibida com as informações completas e condicionais conforme o status.

**Cenários de aceite:**

1. **Dado** que o adotante está visualizando seu histórico, **quando** ele clica em um pedido com status "Concluído", **então** o sistema exibe: nome do animal, espécie, raça, foto, data do pedido, data de conclusão, nome da ONG e status final.
2. **Dado** que o adotante está visualizando seu histórico, **quando** ele clica em um pedido com status "Em andamento", **então** o sistema exibe os dados do pedido, a etapa atual do processo e a data da última atualização de status.
3. **Dado** que o adotante está visualizando seu histórico, **quando** ele clica em um pedido com status "Rejeitado", **então** o sistema exibe os dados do pedido e o motivo da rejeição (se fornecido pela ONG).

---

### Regras de Negócio

- **RN-01:** O histórico deve exibir pedidos de TODAS as ONGs, não apenas uma. Sem filtro por tenant para os dados do próprio adotante.
- **RN-02:** A ordenação padrão é por data do pedido, do mais recente ao mais antigo.
- **RN-03:** O adotante só visualiza seus próprios pedidos (nunca de terceiros). Filtro por adotante_id da sessão.
- **RN-04:** Pedidos cancelados pelo próprio adotante também aparecem no histórico. Nenhum status é filtrado.
- **RN-05:** Paginação padrão de 10 itens por página.
- **RN-06:** O status exibido deve ser sempre o status atual/real do pedido, sincronizado com MODULE-006.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Ao acessar a seção "Meu Histórico", o sistema exibe uma lista paginada de pedidos de adoção do adotante logado. Cada item da lista contém:

| Informação | Origem |
|---|---|
| Nome do animal | MODULE-005 (Gestão de Animais) |
| Foto do animal (thumbnail) | MODULE-005 |
| Espécie do animal | MODULE-005 |
| Data do pedido | MODULE-006 (Gestão de Pedidos) |
| Status atual | MODULE-006 |
| Nome da ONG | Dados da ONG (tenant) |

Ordenação padrão: data do pedido (decrescente).
Paginação: 10 itens por página com controles (anterior/próxima/número de página).

#### Ações disponíveis

**Ação 1 — Filtrar pedidos**

O adotante pode aplicar filtros para refinar a visualização:

| Filtro | Tipo | Opções |
|---|---|---|
| Status | Seleção múltipla | Pendente, Em análise, Em andamento, Concluído, Cancelado, Rejeitado |
| Período | Intervalo de datas | Data inicial e data final |

Regras condicionais:
- Se nenhum filtro aplicado → exibe todos os pedidos.
- Se filtro(s) aplicado(s) sem resultados → exibe "Nenhum pedido encontrado com os filtros selecionados."
- Filtros são cumulativos (status + período podem ser combinados).

**Ação 2 — Visualizar detalhe do pedido**

Ao clicar em um item do histórico, o sistema exibe a tela de detalhe:

| Informação | Sempre visível | Condicional |
|---|---|---|
| Nome do animal | Sim | — |
| Foto do animal | Sim | — |
| Espécie e raça | Sim | — |
| Nome da ONG | Sim | — |
| Data do pedido | Sim | — |
| Status atual | Sim | — |
| Data da última atualização | Sim | — |
| Data de conclusão | — | Apenas se status = Concluído |
| Motivo da rejeição | — | Apenas se status = Rejeitado e motivo fornecido |

Botão "Voltar ao histórico" para retornar à lista.

**Indicadores visuais de status:**

| Status | Cor/Badge |
|---|---|
| Pendente | Amarelo |
| Em análise | Azul |
| Em andamento | Azul escuro |
| Concluído | Verde |
| Cancelado | Cinza |
| Rejeitado | Vermelho |

---

#### Validações e Restrições

- O adotante só pode visualizar seus próprios pedidos (controle por sessão).
- Nenhuma ação de escrita é permitida nesta tela.
- Tentativa de acessar detalhe de pedido de outro adotante resulta em erro ou redirecionamento.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Histórico vazio (sem pedidos) | 'Você ainda não fez nenhum pedido de adoção.' |
| Nenhum resultado para filtro aplicado | 'Nenhum pedido encontrado com os filtros selecionados.' |
| Erro ao carregar histórico | 'Não foi possível carregar seu histórico. Tente novamente.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | A listagem deve carregar em tempo adequado mesmo com muitos pedidos | P95 ≤ 2s com 100+ pedidos |
| RNF-02 | Escalabilidade | A paginação deve ser implementada no backend (não carregar todos no frontend) | Paginação processada no servidor, sem carregar todos os registros no cliente |
| RNF-03 | Segurança | A consulta cross-tenant deve respeitar isolamento — adotante vê apenas SEUS dados | Teste de segurança obrigatório |
| RNF-04 | Resiliência | Dados de animais removidos/inativados ainda devem aparecer no histórico | Manter referência mesmo se animal inativado |

---

### O que Não Deve Ser Feito

- Permitir cancelamento de pedido a partir da tela de histórico (responsabilidade do MODULE-006).
- Permitir re-submissão de pedido rejeitado a partir do histórico.
- Implementar sistema de avaliação/rating da ONG.
- Exportar histórico para PDF/Excel (feature futura).
- Chat ou comunicação com a ONG a partir do histórico.
- Exibir dados de outros adotantes ou rankings comparativos.
- Notificações push de mudança de status (módulo de notificações separado).
- Implementar busca textual dentro do histórico (filtros são suficientes).

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Adotante com 3 pedidos acessa histórico | Acesso à seção | Lista com 3 itens, ordenados por data decrescente | Positivo |
| CT-02 | Adotante com pedidos em 2 ONGs diferentes | Acesso à seção | Ambos os pedidos aparecem no histórico | Positivo |
| CT-03 | Filtrar por status "Concluído" | Selecionar filtro | Apenas pedidos concluídos exibidos | Positivo |
| CT-04 | Filtrar por período específico | Datas inicial e final | Apenas pedidos dentro do período exibidos | Positivo |
| CT-05 | Clicar em pedido concluído | Clique no item | Detalhe exibido com data de conclusão | Positivo |
| CT-06 | Clicar em pedido rejeitado com motivo | Clique no item | Detalhe exibido com motivo da rejeição | Positivo |
| CT-07 | Adotante sem nenhum pedido | Acesso à seção | Mensagem de histórico vazio + link para catálogo | Borda |
| CT-08 | Filtro sem resultados | Filtro "Concluído" sem pedidos concluídos | Mensagem "Nenhum pedido encontrado com os filtros" | Borda |
| CT-09 | Adotante com exatamente 10 pedidos | Acesso à seção | Lista com 10 itens, sem controle de paginação | Borda |
| CT-10 | Adotante com 11 pedidos | Acesso à seção | Lista com 10 itens + controle de paginação para página 2 | Borda |
| CT-11 | Tentativa de acessar histórico de outro adotante via API | Manipulação de URL/API | Acesso negado ou retorna apenas dados próprios | Negativo |
| CT-12 | Animal do pedido foi inativado | Animal inativado após adoção | Nome e foto do animal ainda aparecem no histórico | Borda |
| CT-13 | Pedido cancelado pelo adotante | Pedido com status "Cancelado" | Pedido exibido com badge cinza "Cancelado" | Positivo |
| CT-14 | Verificar badges de cor para cada status | Pedidos com status variados | Cada status exibe a cor/badge correta | Positivo |
| CT-15 | Acessar detalhe de pedido com ID inexistente | ID inválido na URL | Erro ou redirecionamento para lista | Negativo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O histórico exibe pedidos de TODAS as ONGs do adotante logado.
- [ ] CA-02: A ordenação padrão é data decrescente (mais recente primeiro).
- [ ] CA-03: Filtros são cumulativos (status + período podem ser combinados).
- [ ] CA-04: Pedidos em qualquer status (incluindo cancelado/rejeitado) são exibidos.
- [ ] CA-05: O detalhe do pedido rejeitado mostra motivo quando disponível.
- [ ] CA-06: Histórico vazio direciona o adotante para o catálogo.
- [ ] CA-07: Paginação funciona corretamente com mais de 10 pedidos.

**Regressão:**
- [ ] A criação de novos pedidos (MODULE-006) aparece automaticamente no histórico.
- [ ] Mudanças de status em pedidos (MODULE-006) são refletidas em tempo real no histórico.
- [ ] Inativação de animal (MODULE-005) não remove pedidos do histórico.
- [ ] Edição de perfil (FEATURE-002) não impacta o histórico de pedidos.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Taxa de adotantes que acessam o histórico mensalmente | 0% | > 50% | Analytics — acessos à seção / adotantes ativos |
| Redução de contatos ao suporte sobre status de pedido | N/A | -40% | Tickets de suporte categorizados |
| Tempo médio para encontrar informação no histórico | N/A | < 30 segundos | Analytics — tempo na tela até saída |

---
