# FEATURE-002 — Aprovação de ONG

---

## Grupo 1 — Identificação

**Feature:** FEATURE-002 — Aprovação de ONG
**Módulo:** MODULE-004 — Gestão de ONGs
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-05-31
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

O processo de aprovação garante que apenas ONGs legítimas e com informações completas operem na plataforma CatDog Mário. O Administrador do Sistema analisa solicitações de cadastro, valida a completude dos dados e decide pela aprovação ou rejeição. Essa feature entrega controle de qualidade e segurança no onboarding de organizações, protegendo adotantes e a credibilidade da plataforma.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Administrador do Sistema | Total | Visualiza, analisa, aprova, rejeita e marca ONGs como "Em Análise" |

---

### Premissas

- O cadastro da ONG (FEATURE-001) já está implementado e funcional, gerando ONGs com status "Pendente".
- O sistema de envio de e-mails transacionais está disponível.
- A ONG já confirmou seu e-mail durante o cadastro (fluxo de confirmação de conta existente).
- O Administrador do Sistema já possui acesso autenticado ao painel administrativo.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 (módulo 004) — Cadastro de ONG | FEATURE | Resolvida | Sem ONGs com status "Pendente" para aprovar |
| Sistema de envio de e-mails transacionais | Decisão técnica | Pendente | Notificações de aprovação e rejeição não podem ser enviadas |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — termos: ONG, Administrador do Sistema, status Pendente/Aprovada/Rejeitada
- product/scope_features_context.md — descrição da feature "Aprovação de ONG"
- specs/module_004_gestão_de_ongs/feature_001_cadastro_ong/spec_context.md — campos do formulário de cadastro

**Tabelas de banco de dados:** ongs

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Visualizar listagem de ONGs pendentes de aprovação

Como Administrador do Sistema, quero visualizar todas as ONGs com cadastro pendente ou em análise em uma listagem organizada, para que eu possa priorizar e gerenciar as solicitações de forma eficiente.

**Pode ser testada independentemente:** Sim. Ao acessar o painel administrativo, a listagem exibe ONGs com status "Pendente" e "Em Análise" com os dados resumidos.

**Cenários de aceite:**

1. **Dado** que existem ONGs com status "Pendente" e "Em Análise" no sistema, **quando** o admin acessa a tela de listagem de ONGs pendentes, **então** o sistema exibe todas essas ONGs com Nome, CNPJ, Cidade/Estado, Data do Cadastro e Status.
2. **Dado** que o admin está na listagem, **quando** aplica o filtro por status "Pendente", **então** apenas ONGs com status "Pendente" são exibidas.
3. **Dado** que o admin está na listagem, **quando** ordena por "Data do cadastro", **então** as ONGs mais antigas aparecem primeiro (padrão).
4. **Dado** que não existem ONGs pendentes ou em análise, **quando** o admin acessa a listagem, **então** o sistema exibe mensagem informando que não há solicitações pendentes.

---

#### HU-02 — Analisar detalhes de uma ONG pendente

Como Administrador do Sistema, quero visualizar todos os dados cadastrais de uma ONG pendente, para que eu possa avaliar a completude e legitimidade do cadastro antes de decidir.

**Pode ser testada independentemente:** Sim. Ao clicar em uma ONG na listagem, todos os dados do formulário são exibidos em tela de detalhes.

**Cenários de aceite:**

1. **Dado** que o admin está na listagem de ONGs pendentes, **quando** clica em uma ONG, **então** o sistema exibe todos os dados do formulário (Nome, CNPJ, Telefone, Endereço, Cidade, Estado, Descrição, Capacidade, e campos opcionais preenchidos).
2. **Dado** que o admin está nos detalhes de uma ONG com status "Pendente", **quando** visualiza os botões de ação, **então** estão disponíveis: "Marcar Em Análise", "Aprovar" e "Rejeitar".
3. **Dado** que o admin está nos detalhes de uma ONG com status "Em Análise", **quando** visualiza os botões de ação, **então** estão disponíveis: "Aprovar" e "Rejeitar" (botão "Marcar Em Análise" desabilitado).

---

#### HU-03 — Aprovar cadastro de uma ONG

Como Administrador do Sistema, quero aprovar o cadastro de uma ONG validada, para que ela possa começar a operar na plataforma imediatamente.

**Pode ser testada independentemente:** Sim. Ao aprovar uma ONG, o status muda para "Aprovada", e-mail é enviado e a ONG consegue operar.

**Cenários de aceite:**

1. **Dado** que o admin está nos detalhes de uma ONG com status "Pendente" ou "Em Análise", **quando** clica em "Aprovar", **então** o status muda para "Aprovada" e a mensagem de confirmação é exibida.
2. **Dado** que uma ONG foi aprovada, **quando** o processo finaliza, **então** um e-mail com instruções de primeiro acesso é enviado ao e-mail do responsável da ONG.
3. **Dado** que a ONG foi aprovada, **quando** o Administrador da ONG faz login, **então** tem acesso completo às funcionalidades do sistema.

---

#### HU-04 — Rejeitar cadastro de uma ONG

Como Administrador do Sistema, quero rejeitar o cadastro de uma ONG que não atende aos critérios, para que a plataforma mantenha apenas organizações legítimas.

**Pode ser testada independentemente:** Sim. Ao rejeitar uma ONG, o status muda, e-mail é enviado e bloqueio de 10 dias é ativado.

**Cenários de aceite:**

1. **Dado** que o admin está nos detalhes de uma ONG com status "Pendente" ou "Em Análise", **quando** clica em "Rejeitar", **então** o sistema exibe campo opcional para motivo (máximo 500 caracteres) e botão de confirmação.
2. **Dado** que o admin confirma a rejeição sem motivo, **quando** o processo finaliza, **então** o status muda para "Rejeitada" e um e-mail é enviado à ONG informando a rejeição e a data em que pode tentar novamente.
3. **Dado** que o admin confirma a rejeição com motivo preenchido, **quando** o e-mail é enviado à ONG, **então** o motivo informado é incluído no corpo do e-mail.
4. **Dado** que uma ONG foi rejeitada há menos de 10 dias, **quando** o mesmo CNPJ ou e-mail tenta realizar novo cadastro, **então** o sistema bloqueia e exibe a data de liberação.
5. **Dado** que passaram 10 dias completos desde a rejeição (dia 11 em diante), **quando** o mesmo CNPJ ou e-mail tenta novo cadastro, **então** o sistema permite normalmente.

---

#### HU-05 — Marcar ONG como "Em Análise"

Como Administrador do Sistema, quero marcar uma ONG como "Em Análise", para sinalizar internamente que já iniciei a verificação daquele cadastro.

**Pode ser testada independentemente:** Sim. Ao marcar, o status muda internamente sem notificar a ONG.

**Cenários de aceite:**

1. **Dado** que o admin está nos detalhes de uma ONG com status "Pendente", **quando** clica em "Marcar Em Análise", **então** o status muda para "Em Análise" e a mensagem de confirmação é exibida.
2. **Dado** que uma ONG foi marcada como "Em Análise", **quando** a ONG acessa o sistema, **então** ela continua vendo seu status como "Pendente" (status "Em Análise" é interno).

---

### Regras de Negócio

- **RN-01:** Apenas usuários com perfil "Administrador do Sistema" podem aprovar, rejeitar ou marcar como "Em Análise" uma ONG.
- **RN-02:** O fluxo de status segue: Pendente → Em Análise → Aprovada ou Rejeitada. A aprovação e rejeição também podem ocorrer diretamente a partir de "Pendente".
- **RN-03:** Ao aprovar, o status muda para "Aprovada" e a ONG pode operar imediatamente.
- **RN-04:** Ao rejeitar, o status muda para "Rejeitada". A ONG (mesmo CNPJ ou e-mail do responsável) só pode realizar novo cadastro após 10 dias corridos da data de rejeição.
- **RN-05:** O motivo de rejeição é opcional. Se informado, é incluído no e-mail de notificação. Máximo de 500 caracteres.
- **RN-06:** O e-mail de aprovação deve conter instruções de primeiro acesso ao sistema.
- **RN-07:** O e-mail de rejeição deve informar a data a partir da qual a ONG pode tentar novamente e, se informado, o motivo.
- **RN-08:** A ONG não visualiza o status "Em Análise" — do ponto de vista dela, o cadastro está "Pendente" até receber o e-mail final.
- **RN-09:** Tentativa de novo cadastro com CNPJ ou e-mail bloqueado (dentro dos 10 dias) deve ser impedida pelo sistema com mensagem informativa contendo a data de liberação.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

**Listagem de ONGs pendentes** (painel administrativo):
- Exibe todas as ONGs com status "Pendente" e "Em Análise"
- Colunas: Nome da ONG, CNPJ, Cidade/Estado, Data do Cadastro, Status
- Ordenação padrão: mais antigas primeiro (data do cadastro ascendente)
- Filtros: Status (Pendente, Em Análise), Estado, Cidade, Período de cadastro
- Indicador de quantidade total por status

**Tela de detalhes da ONG pendente:**
- Exibe todos os dados do formulário de cadastro: Nome, CNPJ, Telefone, Endereço completo, Cidade, Estado, Descrição, Capacidade, Missão (se preenchido), Fotos (se enviadas), Redes Sociais (se informadas)
- Exibe data/hora do envio do cadastro
- Botões de ação conforme status atual

#### Ações disponíveis

**Ação 1 — Marcar Em Análise**

O admin clica em "Marcar Em Análise" para sinalizar que iniciou a verificação.

Regras condicionais:
- Se status atual é "Pendente" → status muda para "Em Análise", sem notificação à ONG
- Se status atual é "Em Análise" → ação indisponível (botão desabilitado)

**Ação 2 — Aprovar**

O admin clica em "Aprovar" para liberar a ONG na plataforma.

Regras condicionais:
- Se status atual é "Pendente" ou "Em Análise" → status muda para "Aprovada", e-mail de aprovação enviado
- Se outro admin já alterou o status (concorrência) → sistema exibe erro e recarrega dados atualizados

**Ação 3 — Rejeitar**

O admin clica em "Rejeitar" para recusar o cadastro.

Regras condicionais:
- Se status atual é "Pendente" ou "Em Análise" → sistema exibe campo de motivo (opcional) e botão de confirmação
  - Se confirmado: status muda para "Rejeitada", e-mail de rejeição enviado, data de bloqueio registrada
  - Se cancelado: nenhuma ação é executada

---

#### Validações e Restrições

- Motivo de rejeição: opcional, máximo 500 caracteres.
- Bloqueio de novo cadastro: sistema verifica CNPJ e e-mail do responsável contra rejeições dos últimos 10 dias corridos.
- Concorrência: antes de salvar qualquer transição de status, o sistema deve verificar se o status atual não foi alterado por outro administrador.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Aprovação realizada | 'ONG aprovada com sucesso. Um e-mail com instruções de acesso foi enviado.' |
| Rejeição realizada | 'ONG rejeitada. A notificação foi enviada por e-mail.' |
| ONG marcada em análise | 'ONG marcada como Em Análise.' |
| Bloqueio 10 dias (no cadastro) | 'Este CNPJ/e-mail teve um cadastro recusado recentemente. Um novo cadastro poderá ser enviado a partir de {data}.' |
| Conflito de concorrência | 'O status desta ONG foi alterado por outro administrador. Os dados foram atualizados.' |
| Listagem vazia | 'Não há solicitações de cadastro pendentes no momento.' |
| E-mail de aprovação (assunto) | 'Seu cadastro no CatDog Mário foi aprovado!' |
| E-mail de rejeição (assunto) | 'Seu cadastro no CatDog Mário não foi aprovado' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | A listagem de ONGs pendentes deve carregar rapidamente mesmo com volume alto | Tempo de carregamento inferior a 3 segundos com até 500 ONGs pendentes |
| RNF-02 | Confiabilidade | A verificação de concorrência deve prevenir decisões conflitantes | Zero aprovações/rejeições duplicadas em cenários de acesso simultâneo |
| RNF-03 | Disponibilidade | E-mails de notificação devem ser enviados de forma assíncrona sem bloquear a ação do admin | Ação do admin completa em menos de 2 segundos, e-mail enviado em até 5 minutos |

---

### O que Não Deve Ser Feito

- Esta feature não implementa aprovação automática por critérios pré-definidos.
- Esta feature não integra com a Receita Federal para validação de CNPJ.
- Esta feature não implementa chat ou mensageria entre admin e ONG durante a análise.
- Esta feature não exibe histórico de tentativas anteriores de cadastro de uma mesma ONG.
- Esta feature não implementa notificação in-app (apenas e-mail).
- Esta feature não permite que o Administrador da ONG veja o status "Em Análise".

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Listagem com ONGs pendentes | 3 ONGs pendentes no sistema | Listagem exibe 3 ONGs ordenadas por data | Positivo |
| CT-02 | Listagem vazia | Nenhuma ONG pendente | Mensagem informativa exibida | Borda |
| CT-03 | Filtrar por status "Pendente" | 2 pendentes, 1 em análise | Apenas 2 ONGs exibidas | Positivo |
| CT-04 | Aprovar ONG pendente | ONG com status "Pendente" | Status muda para "Aprovada", e-mail enviado | Positivo |
| CT-05 | Aprovar ONG em análise | ONG com status "Em Análise" | Status muda para "Aprovada", e-mail enviado | Positivo |
| CT-06 | Rejeitar com motivo | ONG pendente, motivo "Dados incompletos" | Status "Rejeitada", e-mail com motivo enviado | Positivo |
| CT-07 | Rejeitar sem motivo | ONG pendente, campo motivo vazio | Status "Rejeitada", e-mail sem motivo enviado | Positivo |
| CT-08 | Motivo com 501 caracteres | Texto com 501 chars | Validação impede submissão | Borda |
| CT-09 | Bloqueio de cadastro no 5º dia | CNPJ rejeitado há 5 dias | Cadastro bloqueado com data de liberação | Positivo |
| CT-10 | Liberação no 11º dia | CNPJ rejeitado há 11 dias | Cadastro permitido | Borda |
| CT-11 | Bloqueio por e-mail com CNPJ diferente | E-mail rejeitado, CNPJ novo | Cadastro bloqueado | Positivo |
| CT-12 | Conflito de concorrência | Dois admins aprovando/rejeitando simultaneamente | Segundo admin vê erro de concorrência | Negativo |
| CT-13 | Marcar em análise ONG já em análise | ONG com status "Em Análise" | Botão desabilitado, ação indisponível | Borda |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O sistema exibe listagem de ONGs pendentes e em análise com filtros funcionais.
- [ ] CA-02: O admin consegue aprovar uma ONG e o e-mail de aprovação é enviado em até 5 minutos.
- [ ] CA-03: O admin consegue rejeitar uma ONG e o bloqueio de 10 dias é ativado corretamente.
- [ ] CA-04: ONGs com CNPJ ou e-mail bloqueados não conseguem realizar novo cadastro dentro do período.
- [ ] CA-05: O status "Em Análise" não é visível para a ONG.

**Regressão:**
- [ ] FEATURE-001 (módulo 004) — o fluxo de cadastro não deve ser impactado negativamente (exceto bloqueio de 10 dias).

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| ONGs processadas em até 4 dias | 0% (não existe processo) | >90% das solicitações decididas em até 4 dias | Diferença entre data do cadastro e data da decisão |
| Taxa de ONGs aprovadas na primeira tentativa | 0 | >60% | Razão aprovações / total de decisões |

---
