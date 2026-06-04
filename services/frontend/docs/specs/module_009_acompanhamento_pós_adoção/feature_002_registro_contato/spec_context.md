# FEATURE-002 — Registro de Contato Realizado

---

## Grupo 1 — Identificação

**Feature:** FEATURE-002 — Registro de Contato Realizado
**Módulo:** MODULE-009 — Acompanhamento Pós-Adoção
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-06-03
**Aprovado por:** _Pendente_

---

## Objetivo da Feature

Mesmo quando o contato pós-adoção é realizado, não há registro formal no sistema — informações ficam dispersas em mensagens pessoais, cadernos ou e-mails, sem rastreabilidade nem possibilidade de análise. Esta feature permite que voluntários registrem no sistema a data, o resultado e as observações de cada contato realizado com o tutor. Beneficia voluntários (registro rápido e padronizado), administradores (visibilidade do histórico completo) e a ONG como instituição (evidências para relatórios, prestação de contas e identificação de padrões). O valor de negócio inclui histórico auditável, identificação precoce de padrões negativos e construção de evidências de boas práticas para captação de recursos.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário | Escrita | Cria registros de contato da sua ONG |
| Administrador da ONG | Total | Cria, edita, visualiza todos os registros da ONG |
| Tutor | Nenhum | Não acessa esta funcionalidade |

---

### Premissas

- FEATURE-001 (Calendário Automático de Acompanhamento) já está implementada e gerando lembretes.
- O voluntário já realizou o contato com o tutor (por telefone, WhatsApp ou outro canal externo ao sistema).
- O sistema possui o registro de adoção com dados do tutor.
- O usuário já está autenticado ao acessar esta funcionalidade.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 — Calendário Automático de Acompanhamento | Feature obrigatória | Pendente | Sem lembretes não há onde vincular os registros de contato |
| Cadastro de adoção com dados do tutor | Feature existente | Resolvida | Sem dados do tutor para referência no registro |
| Campos obrigatórios: Data + Status + Observação | Decisão de negócio | Resolvida | Indefinição no formulário |
| Opções de status: Positivo / Neutro / Negativo / Sem resposta | Decisão de negócio | Resolvida | Indefinição nas classificações |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — definição de "Acompanhamento pós-adoção"
- specs/module_009_acompanhamento_pós_adoção/feature_001_calendario_acompanhamento/spec_context.md — define os lembretes consumidos por esta feature

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Registrar contato realizado com sucesso

Como voluntário da ONG, quero registrar no sistema a data, o resultado e as observações de um contato pós-adoção realizado, para que a ONG tenha um histórico completo e rastreável de cada interação com o tutor.

**Pode ser testada independentemente:** Sim. Basta acessar um lembrete pendente e preencher o formulário de registro.

**Cenários de aceite:**

1. **Dado** um lembrete com status "Pendente" ou "Atrasado" para o animal "Rex" do tutor "Maria", **quando** o voluntário acessa o lembrete e registra: data=15/07/2026, status="Positivo", observação="Animal adaptado, tutor satisfeito", **então** o registro é salvo, o lembrete muda para status "Concluído", e o registro fica visível no histórico daquela adoção.
2. **Dado** um lembrete com status "Concluído", **quando** o voluntário tenta registrar novo contato para o mesmo lembrete, **então** o sistema não permite e exibe mensagem: "Este acompanhamento já foi registrado".

---

#### HU-02 — Registrar contato sem resposta do tutor

Como voluntário da ONG, quero registrar que tentei contatar o tutor mas não obtive resposta, para que o sistema identifique tutores não responsivos e alerte o administrador para providências.

**Pode ser testada independentemente:** Sim. Basta registrar um contato com status "Sem resposta" e verificar que a notificação é enviada ao admin.

**Cenários de aceite:**

1. **Dado** um lembrete pendente para o animal "Luna" da tutora "Carla", **quando** o voluntário registra: data=15/08/2026, status="Sem resposta", observação="Tentativa por telefone e WhatsApp, sem retorno", **então** o registro é salvo, o lembrete muda para "Concluído", e o administrador da ONG recebe uma notificação in-app alertando sobre a falta de resposta.
2. **Dado** dois lembretes consecutivos do mesmo tutor com status "Sem resposta", **quando** o administrador acessa o histórico do tutor, **então** o sistema exibe alerta visual indicando padrão de não-resposta.

---

#### HU-03 — Visualizar histórico de contatos de uma adoção

Como administrador da ONG, quero visualizar o histórico completo de contatos registrados para uma adoção específica, para que eu possa avaliar a evolução do acompanhamento e tomar decisões informadas.

**Pode ser testada independentemente:** Sim. Basta acessar uma adoção com registros e verificar a exibição cronológica.

**Cenários de aceite:**

1. **Dado** uma adoção com 2 contatos registrados (30 e 60 dias), **quando** o administrador acessa o histórico de acompanhamento daquela adoção, **então** o sistema exibe em ordem cronológica: data do contato, quem registrou, status, observação, e indica visualmente os marcos pendentes.
2. **Dado** uma adoção com 3 contatos completos (30, 60 e 90 dias) todos com status "Positivo", **quando** o administrador visualiza o histórico, **então** o sistema indica que o acompanhamento está "Completo" com badge visual de sucesso.

---

### Regras de Negócio

- **RN-01:** O registro de contato só pode ser criado a partir de um lembrete existente (vinculação obrigatória). Não há registro "avulso".
- **RN-02:** Campos obrigatórios: Data do contato (date), Status (enum: Positivo/Neutro/Negativo/Sem resposta), Observação (texto, mínimo 10 caracteres, máximo 1000 caracteres).
- **RN-03:** A data do contato não pode ser futura (posterior à data atual).
- **RN-04:** A data do contato não pode ser anterior à data de adoção.
- **RN-05:** Ao salvar o registro, o lembrete associado muda automaticamente para status "Concluído".
- **RN-06:** Cada lembrete aceita exatamente 1 registro de contato. Não há duplicidade.
- **RN-07:** Qualquer voluntário ativo da ONG pode registrar o contato, independentemente de quem recebeu o lembrete.
- **RN-08:** Quando o status é "Sem resposta", o sistema deve gerar automaticamente uma notificação in-app para o administrador da ONG.
- **RN-09:** O registro de contato, uma vez salvo, não pode ser excluído — apenas editado pelo administrador (manter rastreabilidade).
- **RN-10:** O histórico de contatos é isolado por tenant (ONG).

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

A partir de um lembrete de acompanhamento (na listagem de lembretes da FEATURE-001), o voluntário acessa o botão "Registrar contato" que abre o formulário de registro. Na página de detalhes de uma adoção, o sistema exibe o histórico de contatos em formato de timeline cronológica.

#### Ações disponíveis

**Ação 1 — Registrar contato**

Acessível a partir do lembrete pendente/atrasado via botão "Registrar contato". Abre formulário com os campos: Data do contato (date picker, padrão: data atual), Status do contato (select: Positivo / Neutro / Negativo / Sem resposta), Observação (textarea). Ao submeter com sucesso, o lembrete é marcado como "Concluído" e o usuário é redirecionado para a lista de acompanhamentos.

Regras condicionais:
- Se status = "Sem resposta" → notificação enviada ao administrador da ONG
- Se 2+ registros consecutivos do mesmo tutor com "Sem resposta" → alerta visual no histórico

**Ação 2 — Editar registro existente (somente administrador)**

O administrador pode editar a observação de um registro já salvo. A edição grava log de alteração (autor, timestamp, campos alterados).

---

#### Validações e Restrições

- Data do contato é obrigatória.
- Data do contato não pode ser posterior à data atual.
- Data do contato não pode ser anterior à data de adoção.
- Status do contato é obrigatório.
- Observação é obrigatória, com mínimo de 10 e máximo de 1000 caracteres.
- Botão "Registrar contato" não é exibido para lembretes com status "Concluído" ou "Cancelado".
- Botão "Editar" só é exibido para o perfil Administrador da ONG.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Registro salvo com sucesso | 'Contato registrado com sucesso' |
| Data futura | 'A data do contato não pode ser posterior a hoje.' |
| Data anterior à adoção | 'A data do contato não pode ser anterior à data de adoção ({data_adoção}).' |
| Observação curta | 'A observação deve ter no mínimo 10 caracteres.' |
| Observação longa | 'A observação deve ter no máximo 1000 caracteres.' |
| Lembrete já concluído | 'Este acompanhamento já foi registrado.' |
| Operação em lembrete cancelado | 'Não é possível registrar contato para um acompanhamento cancelado.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | Salvar registro de contato | < 1 segundo |
| RNF-02 | Desempenho | Carregar histórico de contatos de uma adoção | < 500ms |
| RNF-03 | Confiabilidade | Operação de salvar atômica (registro + atualização do lembrete) | Na mesma transação |
| RNF-04 | Segurança | Controle de acesso estrito por tenant | Validação server-side de ONG |
| RNF-05 | Auditoria | Toda criação e edição grava autor, timestamp e campos alterados | 100% rastreável |
| RNF-06 | Integridade | Não permitir registro de contato para lembrete de outra ONG | Validação server-side |

---

### O que Não Deve Ser Feito

- Não implementar upload de arquivos/fotos do animal no registro.
- Não implementar contato automático com o tutor (envio de mensagem/e-mail pelo sistema).
- Não implementar relatórios consolidados ou dashboards (feature futura).
- Não implementar exportação de dados (PDF, CSV, Excel).
- Não implementar workflow automático em caso de "Negativo" ou "Sem resposta" (ex: agendar visita domiciliar).
- Não permitir exclusão de registros por qualquer perfil.
- Não implementar registro de contato sem vínculo com lembrete.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Registro com todos campos válidos | Data: hoje, Status: Positivo, Obs: "Animal adaptado bem ao novo lar" (32 chars) | Registro salvo, lembrete → Concluído | Positivo |
| CT-02 | Registro com data futura | Data: amanhã | Erro: "A data do contato não pode ser posterior a hoje." | Negativo |
| CT-03 | Registro com data anterior à adoção | Data adoção: 01/07, Data contato: 25/06 | Erro: "A data do contato não pode ser anterior à data de adoção" | Negativo |
| CT-04 | Observação com menos de 10 caracteres | Obs: "Ok" (2 chars) | Erro: "A observação deve ter no mínimo 10 caracteres." | Negativo |
| CT-05 | Observação com exatamente 10 caracteres | Obs: "Tudo certo" (10 chars) | Registro salvo com sucesso | Borda |
| CT-06 | Registro duplicado no mesmo lembrete | Tentar registrar contato em lembrete já "Concluído" | Erro: "Este acompanhamento já foi registrado" | Negativo |
| CT-07 | Status "Sem resposta" gera alerta | Status: Sem resposta | Registro salvo + notificação ao admin | Positivo |
| CT-08 | Dois "Sem resposta" consecutivos | 2 registros do mesmo tutor com "Sem resposta" | Alerta visual de padrão no histórico | Positivo |
| CT-09 | Voluntário de ONG-A tenta registrar em lembrete de ONG-B | Request com IDs cruzados | Acesso negado | Negativo |
| CT-10 | Admin edita observação existente | Admin altera obs de "Adaptado" para "Adaptado, com ressalvas" | Registro atualizado + log de alteração gravado | Positivo |
| CT-11 | Registro em lembrete cancelado | Tentar registrar contato em lembrete cancelado | Erro: "Não é possível registrar contato para um acompanhamento cancelado." | Negativo |
| CT-12 | Observação com 1000 caracteres (limite) | Texto com exatamente 1000 chars | Registro salvo com sucesso | Borda |
| CT-13 | Observação com 1001 caracteres | Texto com 1001 chars | Erro de validação: limite excedido | Negativo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: Voluntário consegue registrar contato a partir de lembrete pendente/atrasado.
- [ ] CA-02: Registro de contato atualiza automaticamente o status do lembrete para "Concluído".
- [ ] CA-03: Status "Sem resposta" gera notificação imediata ao administrador.
- [ ] CA-04: Histórico de contatos é exibido em timeline cronológica na página da adoção.
- [ ] CA-05: Administrador pode editar registros existentes com log de alteração.
- [ ] CA-06: Validações de data e observação funcionam em tempo real no formulário.

**Regressão:**
- [ ] Fluxo de adoção existente não sofre alteração de comportamento.
- [ ] Geração de lembretes (FEATURE-001) não é afetada pela adição do registro.
- [ ] Notificações de outras features não são afetadas.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Registros preenchidos com observações de qualidade (> 50 caracteres) | 0% | ≥ 80% | Proporção de registros com observação > 50 chars |
| Tempo médio entre data-alvo do lembrete e data do registro | Sem medição | ≤ 2 dias | Diferença média calculada pelo sistema |
| Registros "Sem resposta" com ação do admin em 48h | 0% | ≥ 95% | Tempo entre notificação e ação administrativa |
| Adoções com histórico completo (3 registros) em 90 dias | 0% | ≥ 85% | Proporção de adoções com ciclo completo |

---

## Grupo 5 — Estimativa

> Preencha após o escopo completo estar definido e revisado.

**Use Points gerados:** _Número estimado_
**Estimativa de custo:** _Valor estimado ou faixa_
