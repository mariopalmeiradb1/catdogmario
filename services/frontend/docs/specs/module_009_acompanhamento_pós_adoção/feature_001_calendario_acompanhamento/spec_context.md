# FEATURE-001 — Calendário Automático de Acompanhamento

---

## Grupo 1 — Identificação

**Feature:** FEATURE-001 — Calendário Automático de Acompanhamento
**Módulo:** MODULE-009 — Acompanhamento Pós-Adoção
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-06-03
**Aprovado por:** _Pendente_

---

## Objetivo da Feature

Atualmente, ONGs dependem de controle manual (planilhas, agendas pessoais) para lembrar de contatar tutores nos marcos pós-adoção, resultando em esquecimentos, acompanhamentos atrasados e perda de vínculo. Esta feature gera automaticamente lembretes de acompanhamento em 30, 60 e 90 dias a partir da data de adoção, garantindo 100% de cobertura dos acompanhamentos. Beneficia voluntários e administradores (eliminação de carga cognitiva), tutores (atenção consistente) e os próprios animais (detecção precoce de problemas). O valor de negócio inclui rastreabilidade para relatórios, prestação de contas e redução de devoluções por problemas não identificados a tempo.

---

## Grupo 2 — Contexto

### Quem Acessa

> Liste exatamente os perfis ou permissões que habilitam o acesso. Termos vagos não são válidos.

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário | Leitura | Visualiza lembretes da sua ONG; recebe notificações in-app |
| Administrador da ONG | Total | Visualiza todos os lembretes; recebe notificações; pode reatribuir lembretes |
| Tutor | Nenhum | Não acessa esta funcionalidade |

---

### Premissas

- O pedido de adoção já possui ciclo de vida implementado até status "Concluído".
- O animal passa para status "Adotado" automaticamente ao concluir o pedido.
- A data de adoção (momento em que o animal passa para "Adotado") é registrada e auditável.
- O sistema possui infraestrutura de notificações in-app funcional.
- Existe cadastro de telefone e e-mail do tutor no pedido de adoção.
- O usuário já está autenticado ao acessar esta funcionalidade.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| Fluxo de pedido de adoção com status "Concluído" | Feature existente | Resolvida | Sem gatilho para gerar lembretes |
| Cadastro de animal com status "Adotado" | Feature existente | Resolvida | Sem data-base para cálculo dos marcos |
| Sistema de notificações in-app | Feature existente | Resolvida | Voluntários não seriam alertados |
| Marcos fixos: 30, 60 e 90 dias | Decisão de negócio | Resolvida | Indefinição nos prazos de contato |
| FEATURE-002 — Registro de Contato Realizado | Feature paralela | Pendente | Lembretes seriam gerados mas não poderiam ser concluídos via registro |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — definição de "Acompanhamento pós-adoção"
- overview/project_goal_context.md — objetivo de acompanhamento pós-adoção mencionado no perfil do voluntário

---

## Grupo 3 — Comportamento

### Histórias de Usuário

> Cada história deve ser independentemente testável — implementada sozinha, deve entregar valor observável.

---

#### HU-01 — Geração automática de lembretes ao concluir adoção

Como voluntário da ONG, quero que o sistema gere automaticamente lembretes de acompanhamento em 30, 60 e 90 dias a partir da data de adoção, para que eu não precise criar controles manuais e nenhum acompanhamento seja esquecido.

**Pode ser testada independentemente:** Sim. Basta concluir uma adoção e verificar que 3 lembretes são criados com as datas corretas.

**Cenários de aceite:**

1. **Dado** um pedido de adoção com status "Concluído" e animal marcado como "Adotado" em 01/07/2026, **quando** o sistema processa a conclusão da adoção, **então** são criados 3 lembretes com datas-alvo: 31/07/2026 (30 dias), 29/08/2026 (60 dias) e 28/09/2026 (90 dias), todos com status "Pendente".
2. **Dado** um lembrete gerado automaticamente, **quando** qualquer voluntário ou admin da ONG acessa a lista de acompanhamentos, **então** o lembrete exibe: nome do animal, nome do tutor, data de adoção, telefone do tutor, e-mail do tutor, data-alvo do contato e status do lembrete.

---

#### HU-02 — Notificação in-app no dia do lembrete

Como voluntário da ONG, quero receber uma notificação in-app no dia em que o contato deve ser realizado, para que eu seja lembrado proativamente sem precisar verificar manualmente o calendário.

**Pode ser testada independentemente:** Sim. Basta simular a data-alvo como data atual e verificar que a notificação é disparada.

**Cenários de aceite:**

1. **Dado** um lembrete com data-alvo igual à data atual e status "Pendente", **quando** o sistema executa a rotina de notificações no início do dia, **então** todos os voluntários ativos e administradores da ONG recebem uma notificação in-app com as informações do acompanhamento.
2. **Dado** um lembrete com data-alvo anterior à data atual (atrasado) e status "Pendente", **quando** o sistema executa a rotina de notificações, **então** a notificação é exibida com indicação visual de "Atrasado".

---

#### HU-03 — Cancelamento automático de lembretes por devolução do animal

Como administrador da ONG, quero que os lembretes pendentes sejam cancelados automaticamente quando um animal é devolvido, para que voluntários não desperdicem tempo tentando contatar um tutor que já devolveu o animal.

**Pode ser testada independentemente:** Sim. Basta devolver um animal com lembretes pendentes e verificar que eles são cancelados.

**Cenários de aceite:**

1. **Dado** um animal com status "Adotado" que possui lembretes pendentes de acompanhamento, **quando** o animal é devolvido à ONG (status muda de "Adotado" para outro status), **então** todos os lembretes com status "Pendente" daquela adoção são automaticamente alterados para "Cancelado" com motivo "Devolução do animal".
2. **Dado** um animal devolvido cujos lembretes de 30 e 60 dias já foram concluídos, **quando** o animal é devolvido antes do lembrete de 90 dias, **então** apenas o lembrete de 90 dias (pendente) é cancelado; os lembretes já concluídos permanecem inalterados.

---

#### HU-04 — Redistribuição de lembretes ao desligar voluntário

Como administrador da ONG, quero que quando um voluntário é desligado, seus lembretes pendentes sejam redistribuídos automaticamente para outro voluntário ativo, para que nenhum acompanhamento fique sem responsável.

**Pode ser testada independentemente:** Sim. Basta desativar um voluntário com lembretes pendentes e verificar a redistribuição.

**Cenários de aceite:**

1. **Dado** um voluntário com 3 lembretes pendentes atribuídos, **quando** o voluntário é desligado/desativado da ONG, **então** o sistema redistribui os lembretes pendentes para outro voluntário ativo da ONG e notifica o novo responsável.
2. **Dado** uma ONG sem voluntários ativos (além do que está sendo desligado), **quando** o voluntário é desligado, **então** todos os lembretes são atribuídos ao administrador da ONG.

---

### Regras de Negócio

- **RN-01:** Os marcos de acompanhamento são fixos: 30, 60 e 90 dias corridos a partir da data em que o animal recebeu status "Adotado".
- **RN-02:** Os 3 lembretes são gerados automaticamente e simultaneamente no momento em que a adoção é concluída. Não há criação manual.
- **RN-03:** O lembrete vence no dia exato do marco (sem janela de tolerância). Após a data-alvo, o status passa a ser considerado "Atrasado" se não houver registro de contato.
- **RN-04:** Notificações são entregues exclusivamente via canal in-app.
- **RN-05:** Se o animal for devolvido (status deixa de ser "Adotado"), todos os lembretes com status "Pendente" são automaticamente cancelados.
- **RN-06:** Se o voluntário for desligado, seus lembretes pendentes são redistribuídos automaticamente para outro voluntário ativo da ONG. Se nenhum existir, vão para o administrador.
- **RN-07:** Os lembretes são isolados por tenant (ONG). Nenhuma ONG visualiza dados de outra.
- **RN-08:** Um lembrete pode ter os seguintes status: Pendente → Concluído / Cancelado / Atrasado.
- **RN-09:** Lembrete com status "Atrasado" permanece visível e acionável até que o contato seja registrado ou o lembrete seja cancelado.
- **RN-10:** Notificações de lembretes atrasados são reemitidas diariamente até resolução.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

O sistema exibe uma lista de lembretes de acompanhamento pós-adoção, filtráveis por: status (Pendente, Atrasado, Concluído, Cancelado), período, nome do animal e nome do tutor. Cada item da lista exibe: nome do animal, nome do tutor, data de adoção, data-alvo do contato, telefone do tutor, e-mail do tutor, status do lembrete e dias de atraso (quando aplicável). Há indicação visual clara (cor/ícone) para lembretes atrasados. O administrador também pode filtrar por voluntário responsável.

#### Ações disponíveis

**Ação 1 — Geração automática de lembretes**

Ao detectar transição de status do pedido de adoção para "Concluído", o sistema cria 3 registros de lembrete vinculados àquela adoção. A criação é transacional — ou cria os 3, ou nenhum.

**Ação 2 — Envio de notificações**

A rotina diária verifica lembretes com data-alvo igual ou anterior à data atual e envia notificações in-app.

Regras condicionais:
- Se lembrete está na data-alvo → notificação com título "Acompanhamento pós-adoção pendente"
- Se lembrete está atrasado → notificação com título "Acompanhamento atrasado — [nome do animal]"

**Ação 3 — Cancelamento automático por devolução**

Ao detectar que o animal deixou o status "Adotado", todos os lembretes pendentes são cancelados automaticamente com motivo registrado.

**Ação 4 — Redistribuição por desligamento de voluntário**

Ao desativar um voluntário, seus lembretes pendentes são redistribuídos para outro voluntário ativo (ou administrador, se não houver voluntário disponível).

---

#### Validações e Restrições

- Não é permitida geração duplicada de lembretes para a mesma adoção.
- Não é permitido cancelamento manual de lembretes por voluntário (somente admin ou automático por devolução).
- Dados de lembretes são estritamente isolados por ONG (validação server-side).

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Notificação no dia do marco | 'Acompanhamento pós-adoção pendente — [nome do animal] / Tutor: [nome do tutor]' |
| Notificação de atraso | 'Acompanhamento atrasado — [nome do animal] / Tutor: [nome do tutor]' |
| Lembretes redistribuídos | 'Você recebeu [N] acompanhamentos pendentes transferidos' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | Geração dos 3 lembretes ao concluir adoção | < 2 segundos |
| RNF-02 | Desempenho | Carregamento da listagem de lembretes | < 1 segundo para ONGs com até 500 adoções |
| RNF-03 | Confiabilidade | Rotina de notificações com mecanismo de retry | 3 tentativas em caso de falha |
| RNF-04 | Confiabilidade | Geração de lembretes idempotente | Reprocessar mesma adoção não gera duplicatas |
| RNF-05 | Disponibilidade | Rotina de verificação diária de lembretes | Executa todos os dias, incluindo finais de semana e feriados |
| RNF-06 | Isolamento | Dados isolados por tenant (ONG) | Nenhum dado cruza entre ONGs |
| RNF-07 | Auditoria | Alteração de status de lembrete registra autor, data e motivo | 100% das alterações auditadas |

---

### O que Não Deve Ser Feito

- Não implementar envio de e-mail ou push notification ao tutor.
- Não implementar configuração personalizada de marcos por ONG.
- Não implementar criação manual de lembretes.
- Não implementar calendário visual (agenda gráfica). A funcionalidade é baseada em lista.
- Não implementar integração com Google Calendar ou similares.
- Não implementar lembretes para datas diferentes de 30/60/90 dias.
- Não implementar fluxo de re-adoção (novo ciclo de lembretes para o mesmo animal com outro tutor) — será tratado em feature futura.
- Não permitir que o tutor/adotante visualize os lembretes da ONG.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Geração de lembretes ao concluir adoção | Pedido de adoção → status "Concluído" com data 01/07/2026 | 3 lembretes criados: 31/07, 29/08, 28/09 com status "Pendente" | Positivo |
| CT-02 | Tentativa de gerar lembretes duplicados | Reprocessar mesma adoção já com lembretes | Nenhum lembrete duplicado criado | Negativo |
| CT-03 | Cancelamento por devolução | Animal devolvido com 2 lembretes pendentes | 2 lembretes → status "Cancelado" | Positivo |
| CT-04 | Devolução sem lembretes pendentes | Animal devolvido após 90 dias (todos concluídos) | Nenhuma alteração nos lembretes | Borda |
| CT-05 | Notificação no dia do marco | Data atual = data-alvo de lembrete pendente | Notificação in-app enviada a todos voluntários/admin da ONG | Positivo |
| CT-06 | Lembrete atrasado | Data atual > data-alvo, sem registro de contato | Status exibido como "Atrasado" + renotificação diária | Positivo |
| CT-07 | Voluntário desligado com lembretes | Voluntário desativado com 2 lembretes pendentes | Lembretes redistribuídos para voluntário ativo | Positivo |
| CT-08 | ONG sem voluntários ativos ao desligar | Único voluntário desligado | Lembretes atribuídos ao administrador | Borda |
| CT-09 | Isolamento multi-tenant | ONG-A acessa listagem | Apenas lembretes da ONG-A são exibidos | Positivo |
| CT-10 | Adoção concluída sem e-mail do tutor | Tutor sem e-mail cadastrado | Lembrete criado normalmente; campo e-mail exibido como vazio | Borda |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: Toda adoção concluída gera exatamente 3 lembretes sem intervenção manual.
- [ ] CA-02: Lembretes atrasados são identificáveis visualmente na listagem.
- [ ] CA-03: Devoluções cancelam lembretes pendentes instantaneamente.
- [ ] CA-04: Voluntário desligado tem seus lembretes redistribuídos automaticamente.
- [ ] CA-05: Notificações in-app são entregues no dia do marco e reemitidas diariamente para atrasados.

**Regressão:**
- [ ] Fluxo de adoção existente (pedido → conclusão) não sofre alteração de comportamento.
- [ ] Notificações de outras features não são afetadas.
- [ ] Desligamento de voluntário continua funcionando normalmente para outras funcionalidades.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Adoções com acompanhamento completo (3 contatos) | 0% | ≥ 90% em 6 meses | Proporção de adoções com 3 lembretes concluídos |
| Tempo médio de atraso nos acompanhamentos | Sem medição | ≤ 3 dias | Diferença entre data-alvo e data do registro de contato |
| Lembretes atrasados por mais de 7 dias | Sem medição | ≤ 5% | Proporção de lembretes com atraso > 7 dias |
| Redução de devoluções por problemas não detectados | Baseline atual | -20% em 6 meses | Comparativo de devoluções antes/depois da feature |

---

## Grupo 5 — Estimativa

> Preencha após o escopo completo estar definido e revisado.

**Use Points gerados:** _Número estimado_
**Estimativa de custo:** _Valor estimado ou faixa_
