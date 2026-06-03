# FEATURE-002 — Edição de Perfil do Adotante

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-002 — Edição de Perfil do Adotante_
**Módulo:** _MODULE-008 — Gestão de Adotantes_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-06-03_
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

O adotante pode editar seus dados cadastrais a qualquer momento através de sua área logada, mantendo suas informações atualizadas de forma autônoma. Isso melhora a qualidade dos dados disponíveis para a ONG durante o processo de aprovação de pedidos de adoção. Adicionalmente, voluntários podem visualizar o perfil do adotante (com dados sensíveis mascarados) ao analisar pedidos vinculados à sua ONG.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Adotante (autenticado, com perfil) | Escrita | Edita seus próprios dados cadastrais |
| Voluntário da ONG | Leitura | Visualiza perfil do adotante vinculado a pedido da sua ONG (dados sensíveis mascarados) |
| Administrador da ONG | Leitura | Mesma permissão do voluntário |

---

### Premissas

- O adotante já possui perfil cadastrado (FEATURE-001 concluída).
- O usuário está autenticado (MODULE-002).
- Não há fluxo de aprovação para edições — alterações são imediatas.
- O e-mail é gerido pelo módulo de autenticação e não é editável nesta tela.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 — Cadastro de Adotante | FEATURE | Resolvida | Sem perfil cadastrado, não há o que editar |
| MODULE-002 — Autenticação e Permissões | FEATURE | Resolvida | Controle de acesso e identificação do usuário |
| MODULE-006 — Gestão de Pedidos de Adoção | FEATURE | Pendente | Voluntário acessa perfil via contexto do pedido |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — definição de "Adotante", "Voluntário"
- product/scope_features_context.md — escopo do módulo Gestão de Adotantes
- FEATURE-001 spec — campos e validações do cadastro original

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Editar dados pessoais do perfil

Como **adotante**, quero editar meus dados cadastrais na minha área logada, para que minhas informações estejam sempre atualizadas para as ONGs que avaliam meus pedidos.

**Pode ser testada independentemente:** Sim. O adotante acessa "Meu Perfil", altera campos editáveis, salva e os dados são persistidos com a nova informação.

**Cenários de aceite:**

1. **Dado** que o adotante está autenticado e possui perfil cadastrado, **quando** ele acessa a seção "Meu Perfil" e altera campos permitidos (ex: telefone, endereço) e confirma a alteração, **então** o sistema salva as alterações e exibe a mensagem "Perfil atualizado com sucesso."
2. **Dado** que o adotante está na tela de edição de perfil, **quando** ele visualiza o campo CPF, **então** o campo é exibido como somente leitura (não editável).
3. **Dado** que o adotante está editando seu perfil, **quando** ele limpa um campo obrigatório e tenta salvar, **então** o sistema exibe a mensagem "[Nome do campo] é obrigatório." e não salva as alterações.
4. **Dado** que o adotante possui um pedido de adoção com status "Em análise", **quando** ele edita seus dados cadastrais, **então** o sistema salva as alterações normalmente e a ONG visualizará os dados atualizados ao consultar o perfil.

---

#### HU-02 — Visualização de perfil do adotante pelo voluntário

Como **voluntário da ONG**, quero visualizar o perfil completo do adotante ao analisar um pedido de adoção, para que eu tenha as informações necessárias para tomar uma decisão informada.

**Pode ser testada independentemente:** Sim. O voluntário acessa o detalhe de um pedido da sua ONG e consegue visualizar o perfil do adotante com dados sensíveis mascarados.

**Cenários de aceite:**

1. **Dado** que o voluntário está analisando um pedido de adoção, **quando** ele acessa o perfil do adotante vinculado ao pedido, **então** o sistema exibe todos os dados cadastrais do adotante em modo somente leitura, com CPF e RG parcialmente mascarados.
2. **Dado** que o voluntário de uma ONG tenta acessar o perfil de um adotante que não possui pedido na sua ONG, **quando** a requisição é feita, **então** o sistema nega o acesso (isolamento multi-tenant).

---

### Regras de Negócio

- **RN-01:** O campo CPF não pode ser editado após o cadastro. Exibido como somente leitura.
- **RN-02:** O campo e-mail não pode ser editado na tela de perfil (gerido pela autenticação MODULE-002). Exibido como somente leitura.
- **RN-03:** Todas as alterações devem manter as mesmas validações do cadastro original (FEATURE-001).
- **RN-04:** O voluntário/admin da ONG pode visualizar o perfil do adotante somente quando vinculado a um pedido de adoção dirigido à sua ONG (isolamento multi-tenant).
- **RN-05:** Dados sensíveis (CPF, RG) devem ser mascarados na visualização por terceiros (voluntário/admin ONG).
- **RN-06:** Alterações no perfil registram data/hora da última atualização automaticamente.
- **RN-07:** Não há fluxo de aprovação para edições — alterações são imediatas.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

**Para o adotante (tela "Meu Perfil"):**
- Todos os campos do cadastro preenchidos com os dados atuais.
- CPF e e-mail marcados como somente leitura (visualmente diferenciados — desabilitados/cinza).
- Botão "Editar" que habilita os campos editáveis.
- Botão "Salvar" (habilitado apenas quando há alteração) e "Cancelar".

**Para o voluntário/admin (visualização via pedido):**
- Todos os campos em modo leitura.
- CPF mascarado: `***.XXX.XXX-**` (mostra apenas dígitos centrais).
- RG mascarado: últimos 4 caracteres visíveis, restante `*`.
- Seção "Histórico de adoções" com resumo (quantidade de adoções concluídas, pedidos anteriores).

#### Ações disponíveis

**Ação 1 — Editar perfil (adotante)**

O adotante clica em "Editar", altera os campos desejados e clica em "Salvar".

Regras condicionais:
- Se não há alteração detectada → exibe mensagem "Nenhuma alteração foi realizada."
- Se a data de nascimento for alterada para resultar em idade < 18 → rejeitar com mensagem de idade insuficiente.
- Se o adotante clica "Cancelar" com alterações pendentes → exibir diálogo "Você tem alterações não salvas. Deseja descartar?"
  - Se confirmado: descarta alterações e retorna ao modo visualização.
  - Se cancelado: mantém no modo edição.

**Campos editáveis vs. não editáveis:**

| Campo | Editável |
|---|---|
| Nome completo | Sim |
| Data de nascimento | Sim |
| CPF | **Não** |
| RG | Sim |
| Endereço (todos os campos) | Sim |
| Telefone | Sim |
| E-mail | **Não** |
| Possui outros animais? | Sim |
| Quais e quantos animais possui? | Sim |
| Já teve animais anteriormente? | Sim |
| Quais animais já teve? | Sim |

---

#### Validações e Restrições

- Mesmas validações do cadastro original (FEATURE-001, RN-01 a RN-08 aplicáveis).
- Se a data de nascimento for alterada, recalcular idade (deve permanecer ≥ 18).
- Consulta de CEP funciona igual ao cadastro.
- Campos condicionais mantêm a mesma lógica (obrigatórios quando pergunta = "Sim").

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Edição salva com sucesso | 'Perfil atualizado com sucesso.' |
| Nenhuma alteração detectada | 'Nenhuma alteração foi realizada.' |
| Campo obrigatório vazio | '[Nome do campo] é obrigatório.' |
| Data de nascimento resulta em < 18 anos | 'É necessário ter 18 anos ou mais para adotar.' |
| Cancelamento com alterações pendentes | 'Você tem alterações não salvas. Deseja descartar?' |
| Erro de servidor | 'Ocorreu um erro ao salvar suas alterações. Tente novamente.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | A tela de perfil deve carregar em tempo adequado | P95 ≤ 1,5s |
| RNF-02 | Auditoria | Alterações devem gerar registro de auditoria (campo alterado, valor anterior, valor novo, timestamp) | 100% das alterações registradas |
| RNF-03 | Segurança | A visualização por voluntário deve respeitar isolamento multi-tenant | Voluntário só vê adotantes com pedidos na sua ONG |
| RNF-04 | Segurança | A máscara de dados sensíveis deve ser aplicada no backend (não apenas no frontend) | Dados mascarados na resposta do sistema |

---

### O que Não Deve Ser Feito

- Permitir edição de CPF (nem via suporte no escopo desta feature).
- Permitir edição de e-mail nesta tela (responsabilidade do MODULE-002).
- Criar fluxo de aprovação/revisão para alterações do perfil.
- Notificar a ONG automaticamente quando o adotante editar dados.
- Permitir que voluntário/admin edite dados do adotante.
- Implementar versionamento completo do perfil (apenas auditoria simples).
- Exportação de dados do adotante (feature futura de LGPD).

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Adotante altera telefone e salva | Novo telefone válido | Dados atualizados, mensagem de sucesso | Positivo |
| CT-02 | Adotante altera endereço via novo CEP | CEP válido diferente | Campos preenchidos via CEP, salvos corretamente | Positivo |
| CT-03 | Adotante tenta editar campo CPF | Clique no campo CPF | Campo não é editável (desabilitado) | Negativo |
| CT-04 | Adotante remove nome e tenta salvar | Nome em branco | Mensagem de campo obrigatório | Negativo |
| CT-05 | Adotante altera data de nascimento para idade < 18 | Data resulta em 17 anos | Mensagem de idade insuficiente, não salva | Negativo |
| CT-06 | Adotante cancela edição com alterações pendentes | Clique em "Cancelar" | Diálogo de confirmação exibido | Positivo |
| CT-07 | Voluntário visualiza perfil com pedido na sua ONG | Acesso via pedido | Perfil exibido com dados mascarados | Positivo |
| CT-08 | Voluntário tenta acessar perfil sem pedido na sua ONG | Acesso direto | Acesso negado | Negativo |
| CT-09 | Adotante salva sem fazer alteração | Clique em "Salvar" sem editar | Mensagem "Nenhuma alteração foi realizada" | Borda |
| CT-10 | Adotante altera "Possui outros animais" de Sim para Não | Toggle para "Não" | Campo condicional ocultado e valor limpo | Positivo |
| CT-11 | Voluntário de ONG A tenta ver adotante com pedido apenas na ONG B | Acesso via API | Acesso negado (isolamento multi-tenant) | Negativo |
| CT-12 | CPF aparece mascarado na visualização pelo voluntário | Voluntário acessa perfil | CPF exibido como ***.XXX.XXX-** | Positivo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: CPF e e-mail nunca são editáveis sob nenhuma circunstância na tela de perfil.
- [ ] CA-02: A edição é imediata (sem fluxo de aprovação).
- [ ] CA-03: Ao cancelar edição com mudanças, o sistema pergunta antes de descartar.
- [ ] CA-04: Voluntário vê dados mascarados — nunca o CPF/RG completos.
- [ ] CA-05: Cada alteração gera registro de auditoria.
- [ ] CA-06: Voluntário só visualiza adotantes com pedidos na sua ONG.

**Regressão:**
- [ ] Editar o perfil não altera o status de pedidos de adoção em andamento.
- [ ] A conta de autenticação (MODULE-002) não é impactada por edições no perfil do adotante.
- [ ] Dados exibidos no histórico (FEATURE-003) refletem o estado atual do perfil.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Taxa de adotantes com dados atualizados (editaram perfil pelo menos 1x) | 0% | > 30% | Analytics — perfis editados / perfis criados |
| Tempo médio para editar perfil | N/A | < 2 minutos | Analytics — clique em "Editar" até "Salvar" |
| Taxa de erros de acesso multi-tenant (voluntários vendo dados indevidos) | N/A | 0% | Logs de auditoria + testes de segurança |

---
