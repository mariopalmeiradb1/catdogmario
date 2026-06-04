# FEATURE-005 — Registro de Visita Realizada

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-005 — Registro de Visita Realizada_
**Módulo:** _MODULE-007 — Gestão de Pedidos de Adoção_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-06-03_
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

Após a realização de uma visita agendada, voluntários registram no sistema que a visita ocorreu, incluindo observações sobre o encontro e uma avaliação qualitativa. Essa feature entrega rastreabilidade completa do processo de adoção, permitindo que outros voluntários e administradores acompanhem a evolução, identifiquem possíveis problemas e tomem decisões informadas sobre a aprovação final.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário da ONG (ong_volunteer) | Escrita | Pode registrar visitas realizadas da sua ONG |
| Administrador da ONG (ong_admin) | Escrita / Leitura completa | Pode registrar e ver observações internas |
| Adotante (adopter) | Leitura parcial | Visualiza data e avaliação, mas NÃO vê observações internas |

---

### Premissas

- O voluntário/admin está autenticado e vinculado a uma ONG aprovada.
- A FEATURE-004 (Agendamento de Visita) já está implementada, com visitas em status `scheduled`.
- O voluntário que registra a visita não precisa ser o mesmo que a agendou.
- O sistema de audit log (`recordAuditLog`) está disponível.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-004 — Agendamento de Visita | FEATURE | Pendente | Sem visitas agendadas, não há o que registrar |
| MODULE-007 — Gestão de Pedidos de Adoção | FEATURE | Resolvida | Contexto do pedido vinculado à visita |

---

### Referências e Insumos

**Artefatos consultados:**
- FEATURE-004 spec — define a criação do registro de visita com status `scheduled`
- overview/glossary_context.md — definição de "Visita" e ciclo de vida
- Código existente: `recordAuditLog` em shared/services/audit-log.shared.ts

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Registrar visita como realizada

Como **voluntário da ONG**, quero registrar que uma visita agendada foi realizada, para que o histórico do processo de adoção fique completo e outros membros possam acompanhar a evolução.

**Pode ser testada independentemente:** Sim. Ao submeter o registro com dados válidos, o status da visita transiciona para `completed` e os dados são persistidos.

**Cenários de aceite:**

1. **Dado** que existe uma visita com status "scheduled" vinculada a um pedido de adoção, **quando** o voluntário submete o registro com data/hora efetiva, avaliação "positive" e observações "Animal se adaptou bem ao adotante", **então** o status da visita é atualizado para "completed", os campos `completed_at`, `completed_by`, `evaluation` e `observations` são persistidos, e um registro de auditoria é criado.
2. **Dado** que existe uma visita com status "scheduled", **quando** um usuário com role "adopter" tenta registrar a visita, **então** o sistema retorna erro 403 e a mensagem "Você não tem permissão para registrar visitas."
3. **Dado** que a visita já está com status "completed", **quando** o voluntário tenta registrar novamente, **então** o sistema retorna erro 409 e exibe "Esta visita já foi registrada como realizada."

---

#### HU-02 — Incluir observações e avaliação qualitativa

Como **voluntário da ONG**, quero registrar observações sobre como foi o encontro e uma avaliação qualitativa, para que outros voluntários e administradores tenham contexto para tomar decisões sobre o pedido.

**Pode ser testada independentemente:** Sim. Observações e avaliação são persistidas e visíveis apenas para membros da ONG.

**Cenários de aceite:**

1. **Dado** que existe uma visita com status "scheduled" e o voluntário preenche observações com "Adotante demonstrou cuidado, ambiente adequado" e seleciona avaliação "positive", **quando** submete o registro, **então** a visita é registrada com as observações e avaliação informadas.
2. **Dado** que existe uma visita com status "scheduled" e o voluntário não preenche observações, **quando** submete o registro com avaliação "neutral", **então** a visita é registrada com avaliação "neutral" e observações nulas.
3. **Dado** que o voluntário preenche observações com texto de mais de 2000 caracteres, **quando** submete o registro, **então** o sistema retorna erro 422 e exibe "As observações devem ter no máximo 2000 caracteres."

---

#### HU-03 — Visualizar registro de visita realizada

Como **voluntário ou administrador da ONG**, quero visualizar os detalhes de uma visita registrada, para que eu possa acompanhar a evolução do processo.

**Pode ser testada independentemente:** Sim. Ao consultar uma visita `completed`, os detalhes são exibidos conforme o perfil do usuário.

**Cenários de aceite:**

1. **Dado** que existe uma visita com status "completed" e o usuário logado é voluntário/admin da ONG, **quando** consulta os detalhes, **então** o sistema exibe: data/hora do agendamento, data/hora efetiva, voluntário que registrou, avaliação e observações.
2. **Dado** que existe uma visita com status "completed" vinculada ao pedido do adotante, **quando** o adotante consulta os detalhes, **então** o sistema exibe data/hora do agendamento, data/hora efetiva e avaliação, mas NÃO exibe as observações internas do voluntário.

---

### Regras de Negócio

- **RN-01:** Somente usuários com role `ong_volunteer` ou `ong_admin` podem registrar a realização de uma visita.
- **RN-02:** Apenas visitas com status `scheduled` podem ser registradas como `completed`.
- **RN-03:** Ao registrar a visita, o sistema deve gravar: data/hora efetiva (`completed_at`), ID do voluntário (`completed_by`), observações textuais (opcional, máximo 2000 caracteres) e avaliação qualitativa (`positive`, `neutral`, `negative`).
- **RN-04:** O status da visita transiciona de `scheduled` para `completed`.
- **RN-05:** O status do pedido de adoção NÃO é alterado automaticamente — a decisão final ocorre em outra feature.
- **RN-06:** O registro deve gerar entrada no audit log com ação `visit_completed`.
- **RN-07:** O voluntário que registra não precisa ser o mesmo que agendou; qualquer voluntário/admin da ONG pode registrar.
- **RN-08:** Não é permitido registrar com data/hora efetiva no futuro.
- **RN-09:** Não é permitido registrar a visita mais de uma vez (idempotência).

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Na tela de detalhe de uma visita agendada (visão voluntário/admin), exibe-se um botão "Registrar Visita" caso o status da visita seja `scheduled`.

#### Ações disponíveis

**Ação 1 — Registrar Visita Realizada**

O voluntário informa data/hora efetiva, seleciona avaliação qualitativa e opcionalmente inclui observações.

Regras condicionais:
- Se a visita não está `scheduled` → exibir mensagem de erro e impedir ação
- Se a data efetiva é no futuro → exibir mensagem de validação
- Se a data efetiva é anterior à data de agendamento → exibir mensagem de validação
- Se confirmado: atualizar registro de visita, registrar audit log

---

#### Validações e Restrições

- `visit_id` é obrigatório, UUID válido, deve existir na tabela `visits` e pertencer à ONG do voluntário.
- `completed_at` é obrigatório, formato ISO 8601, não pode ser no futuro, não pode ser anterior à data de agendamento.
- `evaluation` é obrigatório, enum: `positive`, `neutral`, `negative`.
- `observations` é opcional, máximo 2000 caracteres, conteúdo textual puro (sem marcação ou código executável).

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Registro bem-sucedido | "Visita registrada como realizada com sucesso." |
| Visita já completada | "Esta visita já foi registrada como realizada." |
| Visita não encontrada | "Visita não encontrada." |
| Visita cancelada | "Não é possível registrar uma visita que foi cancelada." |
| Data no futuro | "A data de realização não pode ser no futuro." |
| Data anterior ao agendamento | "A data de realização não pode ser anterior à data do agendamento." |
| Observações muito longas | "As observações devem ter no máximo 2000 caracteres." |
| Avaliação inválida | "A avaliação deve ser: positiva, neutra ou negativa." |
| Sem permissão | "Você não tem permissão para registrar visitas." |
| Voluntário de outra ONG | "Você não tem permissão para registrar visitas de outra organização." |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Segurança | Observações internas não devem ser expostas ao adotante | Verificação de role antes de retornar campo |
| RNF-02 | Concorrência | Registros duplicados devem ser impedidos | Verificação de status dentro de transação |

---

### O que Não Deve Ser Feito

- Esta feature não decide aprovação/rejeição do pedido de adoção após a visita.
- Esta feature não implementa upload de fotos ou vídeos da visita.
- Esta feature não notifica automaticamente o adotante sobre o registro.
- Esta feature não permite edição ou exclusão de um registro já completado.
- Esta feature não implementa reagendamento de visita.
- Esta feature não implementa avaliação com nota numérica ou scoring.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Registro válido com observações | Visita scheduled, avaliação positive, observações preenchidas | Visita completed, dados persistidos | Positivo |
| CT-02 | Registro válido sem observações | Visita scheduled, avaliação neutral, sem observações | Visita completed, observations null | Positivo |
| CT-03 | Visita já completada | Visita com status completed | Erro 409 | Negativo |
| CT-04 | Visita cancelada | Visita com status cancelled | Erro 422 | Negativo |
| CT-05 | Visita inexistente | visit_id inválido | Erro 404 | Negativo |
| CT-06 | Data no futuro | completed_at = amanhã | Erro 422 | Negativo |
| CT-07 | Data anterior ao agendamento | completed_at < scheduled_at | Erro 422 | Negativo |
| CT-08 | Avaliação inválida | evaluation = "excellent" | Erro 422, mensagem de validação | Negativo |
| CT-09 | Observações > 2000 chars | observations com 2001 caracteres | Erro 422 | Negativo |
| CT-10 | Adotante tenta registrar | Role = adopter | Erro 403 | Negativo |
| CT-11 | Voluntário de outra ONG | Voluntário ONG A, visita ONG B | Erro 403 | Negativo |
| CT-12 | Visualização pelo adotante | Role = adopter consulta detalhe | Exibe dados parciais (sem observations) | Positivo |
| CT-13 | Race condition | 2 registros simultâneos | Apenas 1 aceito, outro 409 | Borda |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O sistema atualiza status da visita para `completed` ao registrar.
- [ ] CA-02: Campos `completed_at`, `completed_by`, `evaluation` e `observations` são persistidos.
- [ ] CA-03: Audit log registra ação `visit_completed` com metadata.
- [ ] CA-04: Status do pedido de adoção NÃO é alterado.
- [ ] CA-05: Observações internas não são expostas ao adotante.
- [ ] CA-06: Todas as validações de campo funcionam corretamente.
- [ ] CA-07: Visita já completada retorna erro 409 (idempotência).

**Regressão:**
- [ ] FEATURE-004 (Agendamento) — garantir que agendamentos continuam funcionando
- [ ] FEATURE-001 (Criação de Pedidos) — garantir que pedidos não são impactados

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Visitas com registro completo | 0 | 100% das visitas realizadas com registro | Contagem de visitas completed vs scheduled expiradas |
| Tempo médio entre visita e registro | Desconhecido | < 24h | Diferença entre completed_at e scheduled_at |
