# FEATURE-004 — Agendamento de Visita

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-004 — Agendamento de Visita_
**Módulo:** _MODULE-007 — Gestão de Pedidos de Adoção_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-06-03_
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

Voluntários e administradores de ONGs agendam visitas de adotantes diretamente no sistema, garantindo exclusividade no processo de adoção. Ao confirmar o agendamento, o sistema transiciona automaticamente o status do animal e do pedido, fecha pedidos concorrentes e notifica o adotante. Essa feature entrega controle do fluxo de adoção, transparência para o adotante e eliminação de conflitos de múltiplos processos simultâneos para o mesmo animal.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário da ONG (ong_volunteer) | Escrita | Pode agendar visitas para pedidos da sua ONG |
| Administrador da ONG (ong_admin) | Escrita / Cancelamento | Pode agendar e cancelar visitas da sua ONG |
| Adotante (adopter) | Leitura | Visualiza apenas detalhes da própria visita agendada |

---

### Premissas

- O voluntário/admin está autenticado e vinculado a uma ONG aprovada.
- O módulo de Gestão de Pedidos de Adoção (MODULE-007) já está funcional, com pedidos em status `pending` ou `in_review`.
- O módulo de Gestão de Animais (MODULE-005) já está funcional, com animais em status `available`.
- O sistema de notificação por e-mail já está implementado (mailService).
- O sistema de audit log (`recordAuditLog`) está disponível.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 (MODULE-007) — Criação de Pedido de Adoção | FEATURE | Resolvida | Sem pedidos, não há visitas a agendar |
| MODULE-005 — Gestão de Animais | FEATURE | Resolvida | Necessário para transição de status do animal |
| Sistema de notificação por e-mail | Infraestrutura | Resolvida | Adotante não seria notificado |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — definição de "Visita" e ciclo de vida dos status
- product/scope_features_context.md — escopo do módulo Gestão de Pedidos de Adoção
- Código existente: `autoCloseByAnimal` em adoption-requests.service.ts (padrão para cancelamento automático)

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Agendar visita para um pedido de adoção

Como **voluntário da ONG**, quero agendar uma visita para um adotante diretamente no sistema, para que o processo de adoção avance com exclusividade e o adotante seja notificado dos detalhes.

**Pode ser testada independentemente:** Sim. Ao submeter o agendamento com dados válidos, o registro de visita é criado, os status transicionam e o adotante recebe notificação.

**Cenários de aceite:**

1. **Dado** que existe um pedido de adoção com status "pending" ou "in_review" e o animal vinculado possui status "available", **quando** o voluntário informa uma data/hora válida (futura, dentro do horário de funcionamento, com mínimo de 24h de antecedência), **então** o sistema cria o registro de visita com status "scheduled", o status do pedido permanece inalterado, o status do animal muda para "in_adoption_process" e o adotante recebe notificação com data, horário e endereço da visita.
2. **Dado** que o voluntário tenta agendar uma visita, **quando** a data informada é no passado ou com menos de 24h de antecedência, **então** o sistema rejeita o agendamento e exibe a mensagem "A data da visita deve ter no mínimo 24 horas de antecedência."
3. **Dado** que o voluntário tenta agendar uma visita, **quando** o horário informado está fora do expediente (antes das 08:00, após 18:00 ou em domingo), **então** o sistema rejeita e exibe "O horário da visita deve ser entre 08:00 e 18:00, de segunda a sábado."

---

#### HU-02 — Cancelamento automático de pedidos concorrentes

Como **voluntário da ONG**, quero que ao agendar uma visita, todos os demais pedidos pendentes para o mesmo animal sejam automaticamente cancelados, para que não haja duplicação de esforços nem conflito de processos simultâneos.

**Pode ser testada independentemente:** Sim. Ao agendar visita para um animal com múltiplos pedidos, os demais são cancelados automaticamente.

**Cenários de aceite:**

1. **Dado** que existem 3 pedidos de adoção para o mesmo animal (pedido A em "pending", pedido B em "in_review", pedido C em "pending"), **quando** o voluntário agenda uma visita vinculada ao pedido A, **então** os pedidos B e C são automaticamente alterados para "cancelled" com `cancelled_by = 'system'` e `cancellation_reason = 'Visita agendada para outro adotante.'`, e o audit log registra a quantidade de pedidos cancelados.
2. **Dado** que existe apenas 1 pedido de adoção para o animal, **quando** o voluntário agenda uma visita para esse pedido, **então** nenhum pedido adicional é cancelado e o fluxo segue normalmente.

---

#### HU-03 — Rejeição de agendamento para animal indisponível

Como **voluntário da ONG**, quero ser impedido de agendar uma visita para um animal que já está em processo de adoção ou já foi adotado, para que a exclusividade do processo seja garantida pelo sistema.

**Pode ser testada independentemente:** Sim. Ao tentar agendar para animal em `in_adoption_process` ou `adopted`, o sistema rejeita com mensagem clara.

**Cenários de aceite:**

1. **Dado** que o animal possui status "in_adoption_process", **quando** o voluntário tenta agendar uma visita para um pedido vinculado a esse animal, **então** o sistema rejeita com erro 409 e exibe "Este animal já está em processo de adoção. Não é possível agendar outra visita."
2. **Dado** que o animal possui status "adopted", **quando** o voluntário tenta agendar uma visita, **então** o sistema rejeita com erro 409 e exibe "Este animal já foi adotado."

---

### Regras de Negócio

- **RN-01:** Apenas usuários com role `ong_volunteer` ou `ong_admin` podem agendar visitas.
- **RN-02:** Só é possível agendar visita para um animal cujo status atual seja `available`. Se o animal já estiver em `in_adoption_process` ou `adopted`, o agendamento deve ser recusado.
- **RN-03:** A data/hora da visita deve ser futura, com antecedência mínima de 24 horas e no máximo 30 dias no futuro.
- **RN-04:** O horário da visita deve estar dentro da janela de funcionamento: segunda a sábado, das 08:00 às 18:00.
- **RN-05:** Ao confirmar o agendamento, em uma única transação: (a) o status do animal muda para `in_adoption_process`; (b) o status do pedido de adoção permanece inalterado (a aprovação ocorre somente após a conclusão da visita); (c) todos os demais pedidos com status `pending` ou `in_review` para o mesmo animal são cancelados automaticamente.
- **RN-06:** Após o agendamento bem-sucedido, o sistema envia notificação ao adotante com: nome do animal, data, horário e endereço da ONG.
- **RN-07:** Deve haver no máximo uma visita ativa (status `scheduled`) por animal.
- **RN-08:** Toda operação de agendamento deve ser registrada no audit log.
- **RN-09:** O pedido de adoção vinculado ao agendamento deve estar com status `pending` ou `in_review`. Pedidos já `rejected`, `cancelled` ou `completed` não são elegíveis.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Na tela de detalhe de um pedido de adoção (visão voluntário/admin), exibe-se um botão "Agendar Visita" caso o animal esteja disponível e o pedido esteja elegível.

#### Ações disponíveis

**Ação 1 — Agendar Visita**

O voluntário seleciona data e horário para a visita e opcionalmente adiciona observações.

Regras condicionais:
- Se o animal não está `available` → exibir mensagem de erro e impedir ação
- Se o pedido não está `pending` ou `in_review` → exibir mensagem de erro
- Se a data é inválida → exibir mensagem de validação específica
- Se confirmado: criar registro de visita, transicionar status, cancelar pedidos concorrentes, notificar adotante

---

#### Validações e Restrições

- `adoption_request_id` é obrigatório, UUID válido, deve existir no banco e pertencer à ONG do voluntário.
- `visit_date` é obrigatório, formato ISO 8601, futura, mínimo 24h de antecedência, máximo 30 dias, dentro do horário de funcionamento.
- `notes` é opcional, máximo 500 caracteres.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Agendamento bem-sucedido | "Visita agendada com sucesso para {data} às {horário}. O adotante será notificado." |
| Animal já em processo | "Este animal já está em processo de adoção. Não é possível agendar outra visita." |
| Animal já adotado | "Este animal já foi adotado." |
| Data no passado | "A data da visita deve ser futura." |
| Menos de 24h de antecedência | "A data da visita deve ter no mínimo 24 horas de antecedência." |
| Mais de 30 dias | "A data da visita deve ser no máximo 30 dias a partir de hoje." |
| Fora do horário | "O horário da visita deve ser entre 08:00 e 18:00, de segunda a sábado." |
| Pedido não elegível | "Este pedido de adoção não está elegível para agendamento de visita." |
| Pedido não encontrado | "Pedido de adoção não encontrado." |
| Sem permissão | "Você não possui permissão para realizar esta ação." |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Consistência | Transições de status devem ser atômicas (transação única) | Zero inconsistências entre status do animal, pedido e visita |
| RNF-02 | Concorrência | Race conditions devem ser tratadas para garantir exclusividade | Apenas uma visita ativa por animal, tentativas concorrentes rejeitadas |

---

### O que Não Deve Ser Feito

- Esta feature não implementa cancelamento ou reagendamento de visita.
- Esta feature não notifica os adotantes dos pedidos cancelados automaticamente.
- Esta feature não implementa confirmação de presença do adotante.
- Esta feature não registra o resultado da visita (aprovação/reprovação).
- Esta feature não implementa assinatura do termo de responsabilidade.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Agendamento válido | Pedido pending, animal available, data +48h, seg 10:00 | Visita criada, status transicionados | Positivo |
| CT-02 | Data no passado | visit_date = ontem | Erro 422, mensagem de data futura | Negativo |
| CT-03 | Menos de 24h | visit_date = daqui a 12h | Erro 422, mensagem mín. 24h | Negativo |
| CT-04 | Mais de 30 dias | visit_date = daqui a 45 dias | Erro 422, mensagem máx. 30 dias | Negativo |
| CT-05 | Domingo | visit_date = próximo domingo 10:00 | Erro 422, mensagem horário | Negativo |
| CT-06 | Fora do horário | visit_date = terça 20:00 | Erro 422, mensagem horário | Negativo |
| CT-07 | Animal in_adoption_process | Animal com status in_adoption_process | Erro 409, mensagem exclusividade | Negativo |
| CT-08 | Animal adopted | Animal com status adopted | Erro 409, mensagem adotado | Negativo |
| CT-09 | Pedido cancelled | Pedido com status cancelled | Erro 422, pedido não elegível | Negativo |
| CT-10 | Cancelamento de concorrentes | 3 pedidos, agendar para 1 | 2 cancelados, 1 approved | Positivo |
| CT-11 | Adotante tenta agendar | Role = adopter | Erro 403 | Negativo |
| CT-12 | Pedido de outra ONG | Voluntário da ONG A tenta agendar pedido da ONG B | Erro 404 | Negativo |
| CT-13 | Race condition | 2 agendamentos simultâneos | Apenas 1 criado, outro recebe 409 | Borda |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O sistema cria registro de visita com status `scheduled` ao confirmar agendamento.
- [ ] CA-02: O status do animal transiciona para `in_adoption_process` atomicamente.
- [ ] CA-03: O status do pedido transiciona para `approved` atomicamente.
- [ ] CA-04: Pedidos concorrentes são cancelados automaticamente na mesma transação.
- [ ] CA-05: Adotante recebe notificação por e-mail com detalhes da visita.
- [ ] CA-06: Audit log registra a ação com metadata relevante.
- [ ] CA-07: Todas as validações de data/horário funcionam corretamente.
- [ ] CA-08: Tentativas com animal indisponível retornam erro claro.

**Regressão:**
- [ ] FEATURE-001 (Criação de Pedidos) — garantir que criar pedidos continua funcionando
- [ ] FEATURE-003 (Auto-close) — garantir que auto-close por adoção continua funcional

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Visitas agendadas com sucesso pelo sistema | 0 | >90% dos agendamentos sem erro | Logs de audit |
| Conflitos de processo simultâneo | Desconhecido | 0 conflitos | Monitoramento de erros 409 |
