# FEATURE-003 — Atualização de Status do Animal

---

## Grupo 1 — Identificação

**Feature:** FEATURE-003 — Atualização de Status do Animal
**Módulo:** MODULE-005 — Gestão de Animais
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-06-01
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

O status do animal indica em qual etapa do processo de adoção ele se encontra. Sem esse controle, voluntários não sabem quais animais estão realmente disponíveis, adotantes veem animais que já estão em processo com outra pessoa, e há duplicação de esforços. Esta feature implementa a máquina de estados do animal ("Disponível" → "Em Processo de Adoção" → "Adotado"), com transições automáticas acionadas por eventos do processo de adoção e transições manuais controladas por permissões, garantindo visibilidade clara sobre o estágio de cada animal e integridade do processo.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário da ONG | Escrita parcial | Pode confirmar adoção (Em Processo → Adotado) com número do termo |
| Administrador da ONG | Total | Pode reverter status de "Adotado" para "Disponível" (cenário de devolução) |
| Sistema (automático) | Escrita | Transição automática ao agendar ou cancelar visitas |

---

### Premissas

- O animal já foi cadastrado via FEATURE-001 e possui status "Disponível".
- O módulo de Processo de Adoção (agendamento de visitas) emitirá eventos/callbacks ao agendar ou cancelar visitas, disparando as transições automáticas.
- O módulo de Pedidos de Adoção consome o status do animal para determinar se novos pedidos podem ser criados.
- O catálogo público respeita o status do animal para exibição e bloqueio de ações.
- Apenas 1 processo de adoção ativo por vez por animal.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 (MODULE-005) — Cadastro de Animal | FEATURE | Resolvida | Sem animal cadastrado, não há status para gerenciar |
| Módulo: Processo de Adoção — Agendamento de Visita | FEATURE | Pendente | Transição automática Disponível → Em Processo depende de evento de agendamento |
| Módulo: Processo de Adoção — Registro de Termo | FEATURE | Pendente | Transição Em Processo → Adotado depende do registro do número do termo |
| Módulo: Gestão de Pedidos de Adoção | FEATURE | Pendente | Bloqueio de novos pedidos quando status = "Em Processo" depende de integração |
| MODULE-003 — Catálogo Público | FEATURE | Resolvida | Catálogo precisa refletir status e exibir badge quando "Em Processo" |

---

### Referências e Insumos

**Artefatos consultados:**
- `overview/glossary_context.md` — ciclo de vida do status do animal (Disponível, Em Processo de Adoção, Adotado)
- `product/scope_features_context.md` — descrição da feature de atualização de status e relação com visitas

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Transição automática para "Em Processo de Adoção"

Quando um voluntário agenda uma visita para um animal no módulo de Processo de Adoção, o sistema automaticamente altera o status do animal de "Disponível" para "Em Processo de Adoção". A partir deste momento, novos pedidos de adoção para este animal são bloqueados e o catálogo público exibe um badge indicativo.

**Pode ser testada independentemente:** Sim — basta agendar uma visita para um animal "Disponível" e verificar que o status muda automaticamente e o catálogo exibe o badge.

**Cenários de aceite:**

1. **Dado** um animal com status "Disponível" e um pedido aprovado, **quando** uma visita é agendada para este animal, **então** o status muda automaticamente para "Em Processo de Adoção".
2. **Dado** um animal com status "Em Processo de Adoção", **quando** um adotante tenta enviar um novo pedido de adoção, **então** o sistema bloqueia com mensagem informando que o animal está em processo.
3. **Dado** um animal com status "Em Processo de Adoção", **quando** um adotante acessa o catálogo público, **então** o animal é exibido com badge "Em Processo de Adoção" e sem botão "Solicitar Adoção".

---

#### HU-02 — Reversão automática para "Disponível" ao cancelar visita

Se todas as visitas ativas para um animal forem canceladas e não houver outro processo em andamento, o sistema automaticamente reverte o status para "Disponível", permitindo que novos pedidos sejam feitos.

**Pode ser testada independentemente:** Sim — basta cancelar todas as visitas ativas de um animal "Em Processo" e verificar que o status reverte para "Disponível".

**Cenários de aceite:**

1. **Dado** um animal "Em Processo" com 1 visita agendada, **quando** essa visita é cancelada, **então** o status volta para "Disponível" e novos pedidos são permitidos.
2. **Dado** um animal "Em Processo" com 2 visitas agendadas (cenário de reagendamento), **quando** apenas 1 visita é cancelada e outra permanece ativa, **então** o status permanece "Em Processo de Adoção".

---

#### HU-03 — Confirmar adoção (transição para "Adotado")

Quando o voluntário confirma a entrega do animal ao tutor, ele deve registrar o número do termo de responsabilidade. Somente após informar este número é que o status pode ser alterado para "Adotado". O animal então é removido do catálogo público e não aceita mais pedidos.

**Pode ser testada independentemente:** Sim — basta um voluntário confirmar a adoção de um animal "Em Processo" informando o número do termo e verificar que o status muda para "Adotado".

**Cenários de aceite:**

1. **Dado** um animal com status "Em Processo de Adoção", **quando** o voluntário informa o número do termo de responsabilidade e confirma a adoção, **então** o status muda para "Adotado" e o animal sai do catálogo público.
2. **Dado** um animal com status "Em Processo de Adoção", **quando** o voluntário tenta confirmar a adoção sem preencher o número do termo, **então** o sistema bloqueia com mensagem de campo obrigatório.
3. **Dado** um animal que acabou de ser marcado como "Adotado", **quando** verifico o catálogo público, **então** o animal não aparece mais.
4. **Dado** um animal "Adotado", **quando** verifico os demais pedidos pendentes para aquele animal, **então** todos foram automaticamente cancelados e os adotantes foram notificados.

---

#### HU-04 — Reverter adoção (devolução)

Em casos excepcionais (devolução do animal pelo tutor), o Administrador da ONG pode reverter o status de "Adotado" para "Disponível", informando obrigatoriamente o motivo da devolução. O animal volta ao catálogo público.

**Pode ser testada independentemente:** Sim — basta o Admin reverter o status de um animal "Adotado" informando motivo e verificar que ele reaparece no catálogo como "Disponível".

**Cenários de aceite:**

1. **Dado** que sou Administrador da ONG e o animal está "Adotado", **quando** seleciono reverter status e preencho o motivo, **então** o status volta para "Disponível" e o animal reaparece no catálogo público.
2. **Dado** que sou Administrador e tento reverter sem preencher o motivo, **quando** confirmo, **então** o sistema bloqueia com mensagem de campo obrigatório.
3. **Dado** que sou Voluntário e o animal está "Adotado", **quando** visualizo o animal, **então** não há opção de reverter status.
4. **Dado** que a reversão foi concluída, **quando** verifico o log de auditoria, **então** o motivo da devolução está registrado junto com o usuário e data.

---

### Regras de Negócio

- **RN-01:** A transição Disponível → Em Processo de Adoção é automática e disparada pelo agendamento de uma visita.
- **RN-02:** A transição Em Processo → Disponível é automática e disparada pelo cancelamento de todas as visitas ativas do animal.
- **RN-03:** A transição Em Processo → Adotado requer ação manual do Voluntário com registro obrigatório do número do termo de responsabilidade.
- **RN-04:** A transição Adotado → Disponível requer ação manual do Administrador da ONG com registro obrigatório do motivo (devolução).
- **RN-05:** Apenas 1 processo de adoção ativo por vez por animal. Enquanto o status é "Em Processo de Adoção", novos pedidos são bloqueados.
- **RN-06:** Quando um animal é marcado como "Adotado", todos os demais pedidos pendentes ou em análise para aquele animal são automaticamente cancelados e os adotantes notificados.
- **RN-07:** Animal "Em Processo de Adoção" permanece visível no catálogo público com badge indicativo, porém sem a opção de enviar novo pedido.
- **RN-08:** Animal "Adotado" é removido do catálogo público.
- **RN-09:** Transições manuais de status sem atender os pré-requisitos são bloqueadas pelo sistema.
- **RN-10:** Toda mudança de status é registrada em log de auditoria com usuário (ou "sistema" para automáticas), data/hora e motivo (quando aplicável).

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Na listagem interna de animais, cada animal exibe seu status atual como badge visual. Ao acessar os detalhes de um animal, o voluntário vê o status atual e as ações disponíveis conforme o estado:

| Status atual | Ações manuais disponíveis |
|---|---|
| Disponível | Nenhuma ação de status manual (transição é automática via agendamento) |
| Em Processo de Adoção | Confirmar adoção (Voluntário/Admin) |
| Adotado | Reverter para Disponível (apenas Admin da ONG) |

#### Ações disponíveis

**Ação 1 — Confirmar adoção**

Disponível apenas quando o status é "Em Processo de Adoção". O voluntário aciona "Confirmar adoção", o sistema exibe um formulário solicitando o número do termo de responsabilidade. Após preenchimento e confirmação, o status muda para "Adotado".

Regras condicionais:
- Se número do termo preenchido e confirmação dada → status alterado para "Adotado", animal removido do catálogo, pedidos pendentes cancelados.
- Se número do termo não preenchido → sistema bloqueia com mensagem de campo obrigatório.
- Se status ≠ "Em Processo de Adoção" → ação não disponível.

**Ação 2 — Reverter adoção (devolução)**

Disponível apenas para Administrador da ONG quando o status é "Adotado". O Admin aciona "Reverter adoção", o sistema exibe formulário solicitando o motivo da devolução. Após preenchimento e confirmação, o status volta para "Disponível".

Regras condicionais:
- Se motivo preenchido e confirmação dada → status revertido para "Disponível", animal reaparece no catálogo.
- Se motivo não preenchido → sistema bloqueia com mensagem de campo obrigatório.
- Se perfil = Voluntário → ação não disponível.
- Se status ≠ "Adotado" → ação não disponível.

---

#### Validações e Restrições

- O número do termo de responsabilidade é obrigatório para confirmar adoção (texto, não vazio).
- O motivo da devolução é obrigatório para reverter adoção (texto, mínimo 10 caracteres).
- Transições automáticas são executadas pelo sistema — não há formulário para o usuário nessas transições.
- Um animal com status "Em Processo de Adoção" não pode receber novos pedidos de adoção.
- Não é possível alterar manualmente o status para "Em Processo de Adoção" — apenas via agendamento de visita.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Confirmação de adoção sem número do termo | 'Informe o número do termo de responsabilidade para confirmar a adoção.' |
| Adoção confirmada com sucesso | 'Adoção confirmada com sucesso! O animal foi registrado como adotado.' |
| Reversão sem motivo preenchido | 'Informe o motivo da devolução para reverter o status.' |
| Motivo com menos de 10 caracteres | 'O motivo deve ter pelo menos 10 caracteres.' |
| Reversão concluída | 'Status revertido para Disponível. O animal voltou ao catálogo público.' |
| Adotante tenta enviar pedido para animal em processo | 'Este animal está em processo de adoção e não aceita novos pedidos no momento.' |
| Pedidos cancelados automaticamente | 'O animal [nome] foi adotado. Seu pedido foi encerrado automaticamente.' (notificação ao adotante) |
| Transição automática para Em Processo | Sem mensagem ao voluntário — a transição acontece como efeito do agendamento da visita. |

---

#### Integrações

| Sistema externo | O que é enviado | O que é recebido | Em caso de falha |
|---|---|---|---|
| Módulo: Processo de Adoção (Visitas) | Evento: visita agendada/cancelada | Status do animal atualizado automaticamente | Sistema registra erro em log e mantém status anterior; voluntário é alertado para verificar manualmente |
| Módulo: Gestão de Pedidos | Evento: animal marcado como "Adotado" | Pedidos pendentes são cancelados automaticamente | Se cancelamento falhar, pedidos permanecem e Admin é notificado |
| Módulo: Catálogo Público | Status atualizado do animal | Exibição/ocultação correta no catálogo | Catálogo consulta status em tempo real — sem cache desatualizado |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Consistência | Transições automáticas devem executar em tempo aceitável | Status atualizado em menos de 5 segundos após evento disparador |
| RNF-02 | Integridade | Transições de status devem ser atômicas | Se qualquer etapa falhar (ex: cancelar pedidos), a transição não é aplicada parcialmente |
| RNF-03 | Rastreabilidade | Toda mudança de status é auditada | 100% das transições registradas com timestamp, usuário/sistema e motivo |
| RNF-04 | Concorrência | O sistema deve garantir que ações simultâneas sobre o mesmo animal não causem estados inválidos | Se duas ações tentam alterar o status ao mesmo tempo, apenas uma é aplicada e a outra recebe erro informativo |

---

### O que Não Deve Ser Feito

- Esta feature não implementa o agendamento de visitas — apenas reage ao evento de agendamento/cancelamento vindo de outro módulo.
- Esta feature não gerencia pedidos de adoção — apenas aciona o cancelamento automático como efeito da transição para "Adotado".
- Esta feature não implementa o cadastro nem a edição de dados do animal — apenas controla transições de status.
- Esta feature não implementa notificações por e-mail ou push — apenas gera os eventos que podem ser consumidos por um módulo de notificações.
- Esta feature não permite transições de status fora da máquina de estados definida (ex: Disponível → Adotado diretamente).

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Agendamento de visita muda status | Agendar visita para animal "Disponível" | Status muda para "Em Processo de Adoção" | Positivo |
| CT-02 | Cancelar única visita reverte status | Cancelar a única visita ativa | Status reverte para "Disponível" | Positivo |
| CT-03 | Cancelar 1 de 2 visitas mantém status | Cancelar 1 visita, outra permanece | Status permanece "Em Processo" | Borda |
| CT-04 | Confirmar adoção com termo | Informar nº do termo e confirmar | Status muda para "Adotado" | Positivo |
| CT-05 | Confirmar adoção sem termo | Tentar confirmar sem nº do termo | Bloqueio com mensagem de validação | Negativo |
| CT-06 | Novo pedido para animal em processo | Adotante tenta solicitar adoção | Pedido bloqueado com mensagem | Negativo |
| CT-07 | Animal adotado sai do catálogo | Confirmar adoção | Animal não visível no catálogo público | Positivo |
| CT-08 | Pedidos pendentes cancelados ao adotar | Animal com 2 pedidos pendentes é adotado | Ambos pedidos cancelados, adotantes notificados | Positivo |
| CT-09 | Reverter adoção com motivo (Admin) | Admin reverte com motivo válido | Status volta para "Disponível", animal no catálogo | Positivo |
| CT-10 | Reverter adoção sem motivo (Admin) | Admin tenta reverter sem motivo | Bloqueio com mensagem | Negativo |
| CT-11 | Voluntário tenta reverter adoção | Voluntário acessa animal "Adotado" | Opção de reversão não visível | Negativo |
| CT-12 | Transição direta Disponível → Adotado | Tentar marcar como adotado sem passar por Em Processo | Ação indisponível — máquina de estados impede | Negativo |
| CT-13 | Badge exibido no catálogo | Animal "Em Processo" no catálogo | Badge visível, botão de pedido ausente | Positivo |
| CT-14 | Log de auditoria em transição automática | Visita agendada dispara transição | Log registra transição com "Sistema" como ator | Positivo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O status muda automaticamente para "Em Processo de Adoção" quando uma visita é agendada.
- [ ] CA-02: O status reverte automaticamente para "Disponível" quando todas as visitas ativas são canceladas.
- [ ] CA-03: A transição para "Adotado" requer o número do termo de responsabilidade preenchido.
- [ ] CA-04: Quando um animal é adotado, pedidos pendentes são automaticamente cancelados.
- [ ] CA-05: Novos pedidos de adoção são bloqueados para animais "Em Processo de Adoção".
- [ ] CA-06: O catálogo público exibe badge "Em Processo de Adoção" e oculta animais "Adotados".
- [ ] CA-07: Apenas o Administrador da ONG pode reverter "Adotado" → "Disponível" com motivo obrigatório.
- [ ] CA-08: Toda transição de status é registrada em log de auditoria.

**Regressão:**
- [ ] MODULE-003 (Catálogo Público) — status refletido corretamente em tempo real (badge, visibilidade).
- [ ] Módulo: Gestão de Pedidos — bloqueio de novos pedidos e cancelamento automático devem funcionar corretamente.
- [ ] FEATURE-002 (Edição) — a permissão de edição deve respeitar o status atual do animal.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Percentual de animais com status correto vs. situação real | 0 (sem controle) | > 95% dos status refletem a realidade | Auditoria mensal comparando status no sistema vs. situação física |
| Pedidos duplicados para animais em processo | N/A | 0 pedidos para animais em processo | Contagem de pedidos bloqueados pelo sistema |
| Tempo entre evento (visita/entrega) e atualização de status | N/A (manual) | < 5 segundos para transições automáticas | Log de auditoria — diferença entre timestamp do evento e timestamp da transição |

---

## Grupo 5 — Estimativa

> Preencha após o escopo completo estar definido e revisado.

**Use Points gerados:** _Número estimado_
**Estimativa de custo:** _Valor estimado ou faixa_
