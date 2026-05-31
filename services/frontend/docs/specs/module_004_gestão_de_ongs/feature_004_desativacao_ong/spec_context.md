# FEATURE-004 — Desativação/Inativação de ONG

---

## Grupo 1 — Identificação

**Feature:** FEATURE-004 — Desativação/Inativação de ONG
**Módulo:** MODULE-004 — Gestão de ONGs
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-05-31
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

Permite ao Administrador do Sistema desativar uma ONG na plataforma, bloqueando seu acesso e removendo seus animais do catálogo público, com preservação total do histórico para auditoria. Essa feature é essencial para casos de descumprimento de políticas, encerramento de operações ou solicitação de remoção, garantindo controle administrativo sobre a qualidade das organizações na plataforma sem perda de rastreabilidade.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Administrador do Sistema | Total | Desativa e reativa ONGs |

---

### Premissas

- A ONG a ser desativada está com status "Aprovada" (ou "Pendente", conforme ciclo de vida).
- O sistema já possui mecanismo de autenticação que valida o status da ONG a cada requisição.
- Animais possuem vínculo com a ONG e o catálogo público exibe apenas animais de ONGs ativas.
- Pedidos de adoção possuem vínculo com a ONG e podem ter status alterado programaticamente.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-002 (módulo 004) — Aprovação de ONG | FEATURE | Resolvida | Sem ONGs aprovadas para desativar |
| Sistema de envio de e-mails transacionais | Decisão técnica | Pendente | Notificação aos adotantes sobre cancelamento de pedidos não é enviada |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — termos: ONG (status Inativa), Administrador do Sistema, Pedido de adoção
- product/scope_features_context.md — descrição da feature "Desativação/Inativação de ONG"

**Tabelas de banco de dados:** ongs, animals, adoption_requests, users

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Desativar uma ONG na plataforma

Como Administrador do Sistema, quero desativar uma ONG que descumpriu políticas ou encerrou operações, para que a plataforma mantenha apenas organizações ativas e confiáveis.

**Pode ser testada independentemente:** Sim. Ao desativar uma ONG, o status muda, animais somem do catálogo, pedidos são cancelados e usuários perdem acesso.

**Cenários de aceite:**

1. **Dado** que o admin está nos detalhes de uma ONG com status "Aprovada", **quando** clica em "Desativar ONG", **então** o sistema exibe modal de confirmação com a mensagem de impacto.
2. **Dado** que o admin confirma a desativação, **quando** o processo finaliza, **então** o status muda para "Inativa" e a mensagem "ONG desativada com sucesso." é exibida.
3. **Dado** que a ONG foi desativada, **quando** um usuário público acessa o catálogo, **então** os animais daquela ONG não aparecem nos resultados de busca.
4. **Dado** que a ONG foi desativada, **quando** o Admin da ONG ou um voluntário tenta fazer login, **então** o sistema exibe "Sua organização está inativa na plataforma. Entre em contato com o suporte para mais informações."
5. **Dado** que a ONG tinha pedidos de adoção com status "Pendente", "Em Análise" ou "Em Andamento", **quando** é desativada, **então** todos esses pedidos são automaticamente cancelados e os adotantes recebem e-mail informando o cancelamento.
6. **Dado** que o admin cancela a confirmação de desativação, **quando** volta à tela de detalhes, **então** nenhuma ação é executada e o status permanece inalterado.

---

#### HU-02 — Reativar uma ONG desativada

Como Administrador do Sistema, quero reativar uma ONG que solicitou retorno à plataforma, para que ela possa voltar a operar após resolver as pendências.

**Pode ser testada independentemente:** Sim. Ao reativar, o status volta para "Aprovada" e os usuários da ONG recuperam acesso.

**Cenários de aceite:**

1. **Dado** que o admin está nos detalhes de uma ONG com status "Inativa", **quando** clica em "Reativar ONG", **então** o status muda para "Aprovada" e a mensagem "ONG reativada com sucesso. O administrador da ONG já pode acessar o sistema." é exibida.
2. **Dado** que a ONG foi reativada, **quando** o Admin da ONG faz login, **então** consegue acessar o sistema normalmente.
3. **Dado** que a ONG foi reativada, **quando** o Admin da ONG acessa a listagem de animais, **então** os animais ainda estão invisíveis no catálogo público e precisam ser reativados manualmente pela ONG.

---

#### HU-03 — Visualizar ONGs inativas

Como Administrador do Sistema, quero visualizar dados de ONGs inativas no painel administrativo, para fins de auditoria e rastreabilidade.

**Pode ser testada independentemente:** Sim. O filtro de status "Inativa" na listagem geral de ONGs permite visualizar os dados preservados.

**Cenários de aceite:**

1. **Dado** que o admin está na listagem geral de ONGs, **quando** aplica o filtro de status "Inativa", **então** todas as ONGs desativadas são exibidas com seus dados resumidos e data de desativação.
2. **Dado** que o admin clica em uma ONG inativa, **quando** visualiza os detalhes, **então** todos os dados aparecem como somente leitura, com a data de desativação e o botão "Reativar ONG" disponível.

---

### Regras de Negócio

- **RN-01:** Apenas o Administrador do Sistema pode desativar ou reativar uma ONG.
- **RN-02:** Ao desativar, o status muda de "Aprovada" (ou "Pendente") para "Inativa".
- **RN-03:** Não é necessário informar motivo para desativar — apenas confirmação.
- **RN-04:** Ao desativar, todos os animais da ONG ficam invisíveis no catálogo público imediatamente.
- **RN-05:** Ao desativar, todos os pedidos de adoção com status "Pendente", "Em Análise" ou "Em Andamento" vinculados à ONG são cancelados automaticamente.
- **RN-06:** Ao desativar, o Administrador da ONG e todos os voluntários vinculados perdem acesso ao sistema imediatamente (sessões invalidadas).
- **RN-07:** Os dados históricos da ONG (animais, pedidos, voluntários) permanecem preservados para auditoria.
- **RN-08:** O Administrador do Sistema pode visualizar dados de ONGs inativas no painel administrativo.
- **RN-09:** Não existe desativação automática. A ação é sempre manual.
- **RN-10:** A reativação altera o status de "Inativa" para "Aprovada". O Administrador da ONG e voluntários recuperam acesso.
- **RN-11:** Ao reativar, os animais não voltam automaticamente ao catálogo — a ONG precisa reativá-los manualmente.
- **RN-12:** Adotantes com pedidos cancelados pela desativação devem ser notificados por e-mail.
- **RN-13:** Pedidos com status final (Concluído, Cancelado, Rejeitado) não são afetados pela desativação.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

**Tela de detalhes de ONG aprovada** (painel administrativo):
- Botão "Desativar ONG" visível apenas para ONGs com status "Aprovada"

**Tela de detalhes de ONG inativa** (painel administrativo):
- Todos os dados exibidos como somente leitura
- Data de desativação visível
- Botão "Reativar ONG" disponível
- Botão "Desativar ONG" ausente

**Listagem geral de ONGs:**
- Filtro de status inclui "Inativa"
- ONGs inativas exibidas com indicação visual de status

#### Ações disponíveis

**Ação 1 — Desativar ONG**

O admin clica em "Desativar ONG" na tela de detalhes de uma ONG aprovada.

Regras condicionais:
- Se status é "Aprovada" → exibe modal de confirmação
  - Se confirmado: status muda para "Inativa", animais ficam invisíveis, pedidos ativos cancelados, sessões invalidadas, e-mails enviados aos adotantes afetados
  - Se cancelado: nenhuma ação é executada
- Se status é "Inativa" → botão "Desativar" não é exibido

**Ação 2 — Reativar ONG**

O admin clica em "Reativar ONG" na tela de detalhes de uma ONG inativa.

Regras condicionais:
- Se status é "Inativa" → status muda para "Aprovada", Admin da ONG e voluntários recuperam acesso
- Se status é "Aprovada" → botão "Reativar" não é exibido

---

#### Validações e Restrições

- A desativação exige confirmação explícita via modal.
- Sessões ativas de usuários da ONG devem ser invalidadas no momento da desativação.
- O sistema deve verificar o status da ONG em cada requisição autenticada de seus usuários.
- A reativação não restaura automaticamente animais ao catálogo público.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Confirmação de desativação (modal) | 'Tem certeza que deseja desativar esta ONG? Esta ação bloqueará o acesso de todos os usuários vinculados.' |
| Desativação concluída | 'ONG desativada com sucesso.' |
| Reativação concluída | 'ONG reativada com sucesso. O administrador da ONG já pode acessar o sistema.' |
| Login bloqueado (ONG inativa) | 'Sua organização está inativa na plataforma. Entre em contato com o suporte para mais informações.' |
| E-mail ao adotante (pedido cancelado) | 'Seu pedido de adoção de {nome_animal} foi cancelado porque a ONG {nome_ong} encerrou suas atividades na plataforma.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Confiabilidade | A invalidação de sessões deve ocorrer de forma imediata e completa | Zero acessos de usuários da ONG após desativação |
| RNF-02 | Integridade | O cancelamento de pedidos e ocultação de animais devem ocorrer de forma atômica | Nenhum estado intermediário visível (ex: animais visíveis com ONG inativa) |
| RNF-03 | Auditoria | Dados históricos devem permanecer íntegros indefinidamente | 100% dos registros anteriores acessíveis após desativação |

---

### O que Não Deve Ser Feito

- Esta feature não envia notificação por e-mail à ONG sobre desativação ou reativação.
- Esta feature não exige motivo obrigatório para desativação.
- Esta feature não implementa desativação automática por inatividade.
- Esta feature não transfere animais para outra ONG antes da desativação.
- Esta feature não implementa período de carência ou transição antes de bloquear acesso.
- Esta feature não implementa exclusão definitiva de dados (apenas inativação via mudança de status).
- Esta feature não restaura automaticamente animais ao catálogo público na reativação.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Desativar ONG aprovada | ONG com status "Aprovada" | Status muda para "Inativa", animais ocultos, pedidos cancelados | Positivo |
| CT-02 | Cancelar desativação | Admin clica "Cancelar" no modal | Nenhuma alteração, status permanece "Aprovada" | Positivo |
| CT-03 | Login após desativação (Admin ONG) | Credenciais válidas do Admin da ONG | Mensagem de ONG inativa, acesso negado | Positivo |
| CT-04 | Login após desativação (Voluntário) | Credenciais válidas de voluntário | Mensagem de ONG inativa, acesso negado | Positivo |
| CT-05 | Catálogo após desativação | Busca por animais da ONG desativada | Nenhum animal da ONG aparece nos resultados | Positivo |
| CT-06 | Pedido "Pendente" é cancelado | ONG com 2 pedidos pendentes | Ambos mudam para "Cancelado", e-mails enviados | Positivo |
| CT-07 | Pedido "Concluído" não é afetado | ONG com 1 pedido concluído | Pedido permanece com status "Concluído" | Borda |
| CT-08 | Reativar ONG inativa | ONG com status "Inativa" | Status muda para "Aprovada", admin recupera acesso | Positivo |
| CT-09 | Animais após reativação | ONG reativada | Animais permanecem invisíveis no catálogo | Borda |
| CT-10 | Botão "Desativar" em ONG já inativa | ONG com status "Inativa" | Botão não é exibido, apenas "Reativar" | Borda |
| CT-11 | Sessão ativa invalidada | Admin ONG logado durante desativação | Próxima requisição redireciona para login com mensagem | Positivo |
| CT-12 | Desativar ONG com status "Pendente" | ONG com status "Pendente" | Status muda para "Inativa" | Positivo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O admin consegue desativar uma ONG aprovada com confirmação via modal.
- [ ] CA-02: Animais da ONG desativada não aparecem no catálogo público.
- [ ] CA-03: Pedidos ativos são cancelados automaticamente e adotantes notificados.
- [ ] CA-04: Usuários da ONG (admin e voluntários) perdem acesso imediatamente.
- [ ] CA-05: O admin consegue reativar uma ONG inativa e o acesso é restaurado.
- [ ] CA-06: Animais não voltam automaticamente ao catálogo após reativação.

**Regressão:**
- [ ] Catálogo público (módulo 003) — animais de ONGs ativas devem continuar visíveis normalmente.
- [ ] Fluxo de login — apenas usuários de ONGs inativas devem ter acesso bloqueado.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Tempo para desativar uma ONG problemática | Indefinido (processo manual externo) | < 5 minutos desde a decisão até o bloqueio efetivo | Diferença entre clique em "Desativar" e confirmação de invalidação de sessões |
| Dados históricos preservados após desativação | 0% | 100% dos registros acessíveis | Consulta de dados de ONGs inativas no painel administrativo |

---
