# FEATURE-001 — Cadastro de Adotante

---

## Grupo 1 — Identificação

**Feature:** _FEATURE-001 — Cadastro de Adotante_
**Módulo:** _MODULE-008 — Gestão de Adotantes_
**Status:** _Rascunho_
**Criado por:** _Makuco Specify Agent — 2026-06-03_
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

O cadastro de adotante acontece automaticamente no momento do primeiro pedido de adoção, eliminando a necessidade de um cadastro prévio separado. O sistema coleta dados pessoais, endereço e informações sobre experiência com animais, aplicando validações automáticas (CPF válido, idade mínima de 18 anos). Essa feature garante conformidade com as regras de negócio, evita cadastros inválidos ou fraudulentos, e fornece à ONG as informações necessárias para avaliar a solicitação de adoção.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Adotante (autenticado, sem perfil de adotante) | Escrita | Preenche e submete o formulário de cadastro |

---

### Premissas

- O usuário já está autenticado no sistema (MODULE-002 implementado).
- O cadastro é disparado apenas quando o adotante inicia seu primeiro pedido de adoção e ainda não possui perfil.
- O e-mail utilizado é o da conta autenticada (não editável no formulário).
- O módulo Catálogo Público (MODULE-003) e Gestão de Animais (MODULE-005) já estão implementados.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| MODULE-002 — Autenticação e Permissões | FEATURE | Resolvida | Sem autenticação, não há como vincular o perfil ao usuário |
| MODULE-006 — Gestão de Pedidos de Adoção | FEATURE | Pendente | Este módulo consome os dados do cadastro de adotante |
| Serviço de consulta de CEP (API externa) | API | Resolvida | Preenchimento automático de endereço não funciona (fallback manual disponível) |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — definição de "Adotante", "Pedido de adoção"
- product/scope_features_context.md — escopo do módulo Gestão de Adotantes

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Cadastro automático no primeiro pedido de adoção

Como **adotante**, quero que meus dados cadastrais sejam solicitados no momento do meu primeiro pedido de adoção, para que eu possa prosseguir com o processo sem precisar de um cadastro prévio separado.

**Pode ser testada independentemente:** Sim. Ao simular o fluxo de um usuário autenticado sem perfil iniciando um pedido, o formulário deve ser exibido e o cadastro persistido após preenchimento válido.

**Cenários de aceite:**

1. **Dado** que o adotante está autenticado e não possui cadastro de adotante, **quando** ele inicia seu primeiro pedido de adoção e preenche todos os campos obrigatórios com dados válidos, **então** o sistema cria o perfil de adotante vinculado à conta e prossegue com o fluxo de pedido de adoção.
2. **Dado** que o adotante está preenchendo o formulário de cadastro, **quando** ele informa um CPF já vinculado a outro perfil de adotante, **então** o sistema exibe a mensagem "CPF já cadastrado no sistema. Entre em contato com o suporte." e não permite prosseguir.
3. **Dado** que o adotante está preenchendo o formulário de cadastro, **quando** ele informa uma data de nascimento que resulta em idade inferior a 18 anos, **então** o sistema exibe a mensagem "É necessário ter 18 anos ou mais para adotar." e não permite prosseguir.
4. **Dado** que o adotante está preenchendo o formulário de cadastro, **quando** ele informa um CPF com dígitos verificadores inválidos, **então** o sistema exibe a mensagem "CPF inválido. Verifique o número informado." e não permite prosseguir.

---

#### HU-02 — Preenchimento automático de endereço via CEP

Como **adotante**, quero que ao informar meu CEP os campos de endereço sejam preenchidos automaticamente, para que eu complete meu cadastro de forma rápida e sem erros.

**Pode ser testada independentemente:** Sim. Ao informar um CEP válido, os campos de endereço devem ser preenchidos automaticamente; se o CEP for inexistente ou o serviço estiver indisponível, os campos ficam livres para preenchimento manual.

**Cenários de aceite:**

1. **Dado** que o adotante está no formulário de cadastro, **quando** ele informa um CEP válido com 8 dígitos, **então** o sistema preenche automaticamente logradouro, bairro, cidade e UF, e permite que o adotante edite os campos preenchidos.
2. **Dado** que o adotante está no formulário de cadastro, **quando** ele informa um CEP válido no formato mas inexistente na base, **então** o sistema exibe a mensagem "CEP não encontrado. Preencha o endereço manualmente." e libera os campos de endereço para preenchimento manual.
3. **Dado** que o adotante está no formulário de cadastro e o serviço de consulta de CEP está indisponível, **quando** ele informa um CEP, **então** o sistema libera os campos de endereço para preenchimento manual e não bloqueia o cadastro.

---

### Regras de Negócio

- **RN-01:** CPF deve ser único no sistema — um CPF corresponde a exatamente um perfil de adotante. Rejeitar cadastro com CPF duplicado.
- **RN-02:** Adotante deve ter 18 anos completos na data do cadastro, calculado a partir da data de nascimento. Rejeitar cadastro se idade < 18.
- **RN-03:** CPF deve passar na validação algorítmica (dígitos verificadores). Rejeitar CPF inválido.
- **RN-04:** O cadastro de adotante é vinculado à conta de login pelo e-mail. O e-mail do cadastro é o e-mail da conta autenticada (não editável no formulário).
- **RN-05:** O perfil de adotante não pode ser deletado, apenas inativado (conformidade LGPD).
- **RN-06:** Campos obrigatórios devem ser todos preenchidos para concluir o cadastro. Bloquear envio se houver campo obrigatório vazio.
- **RN-07:** O cadastro só é disparado quando o adotante ainda não possui perfil de adotante e inicia um pedido de adoção. Verificar existência de perfil antes de exibir formulário.
- **RN-08:** UF deve ser uma das 27 unidades federativas válidas do Brasil.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Quando o adotante autenticado sem perfil de adotante inicia um pedido de adoção, o sistema intercepta o fluxo antes do envio do pedido e exibe o formulário de cadastro com todos os campos abaixo:

| Campo | Tipo | Obrigatório | Formato/Validação |
|---|---|---|---|
| Nome completo | Texto | Sim | Mín. 3 caracteres, máx. 150 |
| Data de nascimento | Data | Sim | DD/MM/AAAA, não futura, idade ≥ 18 |
| CPF | Texto mascarado | Sim | 999.999.999-99, validação algorítmica |
| RG | Texto | Sim | Máx. 20 caracteres |
| CEP | Texto mascarado | Sim | 99999-999 |
| Logradouro | Texto | Sim | Máx. 200 caracteres |
| Número | Texto | Sim | Máx. 10 caracteres |
| Complemento | Texto | Não | Máx. 100 caracteres |
| Bairro | Texto | Sim | Máx. 100 caracteres |
| Cidade | Texto | Sim | Máx. 100 caracteres |
| UF | Seleção | Sim | Lista fixa das 27 UFs |
| Telefone | Texto mascarado | Sim | (99) 99999-9999 ou (99) 9999-9999 |
| E-mail | Texto (somente leitura) | Sim | Herdado da conta autenticada, não editável |
| Possui outros animais? | Booleano (Sim/Não) | Sim | — |
| Quais e quantos animais possui? | Texto | Condicional (se "Sim" acima) | Máx. 500 caracteres |
| Já teve animais anteriormente? | Booleano (Sim/Não) | Sim | — |
| Quais animais já teve? | Texto | Condicional (se "Sim" acima) | Máx. 500 caracteres |

#### Ações disponíveis

**Ação 1 — Submeter cadastro**

O adotante preenche todos os campos obrigatórios e submete o formulário. O sistema valida todos os campos no backend, verifica unicidade do CPF, calcula idade a partir da data de nascimento, persiste os dados com timestamp de criação, vincula o perfil ao usuário autenticado e retorna ao fluxo de pedido de adoção.

Regras condicionais:
- Se o adotante já possui perfil de adotante → o formulário não é exibido, o fluxo de pedido segue normalmente.
- Se o CPF informado já está vinculado a outro perfil → cadastro bloqueado com mensagem de CPF duplicado.
- Se a idade calculada é inferior a 18 anos → cadastro bloqueado com mensagem de idade insuficiente.

**Ação 2 — Consulta automática de CEP**

Ao informar o CEP, o sistema consulta uma API externa para preencher automaticamente logradouro, bairro, cidade e UF.

Regras condicionais:
- Se o CEP é válido e encontrado → campos preenchidos automaticamente (editáveis).
- Se o CEP é válido mas inexistente → mensagem de CEP não encontrado, campos liberados para preenchimento manual.
- Se o serviço de CEP está indisponível → campos liberados para preenchimento manual, sem bloquear o cadastro.

---

#### Validações e Restrições

- Nome completo é obrigatório, mín. 3 caracteres, máx. 150 caracteres.
- Data de nascimento é obrigatória, não pode ser data futura, deve resultar em idade ≥ 18.
- CPF é obrigatório, deve seguir formato 999.999.999-99, deve passar validação algorítmica, deve ser único no sistema.
- RG é obrigatório, máx. 20 caracteres.
- CEP é obrigatório, formato 99999-999.
- Logradouro, número, bairro, cidade e UF são obrigatórios.
- Telefone é obrigatório, formato (99) 99999-9999 ou (99) 9999-9999.
- E-mail não é editável (herdado da conta autenticada).
- Campos condicionais ("Quais e quantos animais possui?" e "Quais animais já teve?") são obrigatórios quando a pergunta associada é "Sim".

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Cadastro concluído com sucesso | 'Cadastro realizado com sucesso! Você pode prosseguir com seu pedido de adoção.' |
| CPF inválido | 'CPF inválido. Verifique o número informado.' |
| CPF já cadastrado | 'CPF já cadastrado no sistema. Entre em contato com o suporte.' |
| Idade insuficiente | 'É necessário ter 18 anos ou mais para adotar.' |
| Campo obrigatório vazio | '[Nome do campo] é obrigatório.' |
| Telefone com formato inválido | 'Formato de telefone inválido.' |
| CEP não encontrado | 'CEP não encontrado. Preencha o endereço manualmente.' |
| Erro genérico de servidor | 'Ocorreu um erro ao processar seu cadastro. Tente novamente em alguns instantes.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | O formulário deve carregar em tempo adequado | P95 ≤ 2s |
| RNF-02 | Resiliência | A consulta de CEP deve ter timeout com fallback para preenchimento manual | Timeout de 5s, sem bloquear cadastro |
| RNF-03 | Segurança | Dados sensíveis (CPF, RG) devem ser armazenados criptografados em repouso | Criptografia em repouso obrigatória |
| RNF-04 | Segurança | A validação de CPF deve ocorrer tanto na interface do usuário quanto no servidor | Validação em ambas as camadas obrigatória |
| RNF-05 | Acessibilidade | O formulário deve ser responsivo (mobile-first) | Funcional em viewports ≥ 320px |
| RNF-06 | Auditoria | Logs de criação de perfil devem ser registrados (sem dados sensíveis no log) | 100% das criações registradas |

---

### O que Não Deve Ser Feito

- Upload de documentos (foto de RG, comprovante de residência) — feature futura.
- Verificação de antecedentes criminais.
- Score ou pontuação do adotante.
- Validação de RG por órgão emissor (apenas formato básico).
- Integração com Receita Federal para validação de CPF.
- Cadastro de adotante sem iniciar pedido de adoção (não existe cadastro avulso).
- Cadastro de pessoa jurídica.
- Fluxo de recuperação para CPF duplicado (apenas mensagem + suporte).

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Cadastro completo com dados válidos | Todos os campos preenchidos corretamente | Cadastro criado, redirecionamento para pedido de adoção | Positivo |
| CT-02 | CPF com dígitos verificadores inválidos | CPF: 111.111.111-11 | Mensagem "CPF inválido", formulário não enviado | Negativo |
| CT-03 | Data de nascimento resulta em 17 anos | Data: há 17 anos | Mensagem "É necessário ter 18 anos ou mais" | Negativo |
| CT-04 | CPF já existente no banco | CPF válido de outro adotante | Mensagem "CPF já cadastrado no sistema" | Negativo |
| CT-05 | Campos obrigatórios vazios | Campos em branco | Mensagem de campo obrigatório para cada campo vazio | Negativo |
| CT-06 | Adotante com exatamente 18 anos completos hoje | Data de nascimento = hoje - 18 anos | Cadastro aceito | Borda |
| CT-07 | Adotante que completa 18 anos amanhã | Data de nascimento = hoje - 18 anos + 1 dia | Cadastro rejeitado | Borda |
| CT-08 | CEP válido com retorno completo | CEP existente na base | Campos logradouro, bairro, cidade, UF preenchidos | Positivo |
| CT-09 | CEP inexistente | CEP no formato correto mas não existe | Mensagem de CEP não encontrado, campos liberados | Negativo |
| CT-10 | "Possui outros animais" = Sim | Marcar "Sim" | Campo "Quais e quantos" aparece como obrigatório | Positivo |
| CT-11 | Campo condicional vazio quando obrigatório | "Possui outros animais" = Sim, campo condicional vazio | Validação de campo obrigatório | Negativo |
| CT-12 | Adotante que já possui perfil tenta acessar formulário | Usuário com perfil existente | Sistema pula o cadastro e segue para pedido | Borda |
| CT-13 | Telefone com formato inválido | Telefone: "123" | Mensagem "Formato de telefone inválido" | Negativo |
| CT-14 | Nome com exatamente 3 caracteres | Nome: "Ana" | Aceito | Borda |
| CT-15 | Nome com 2 caracteres | Nome: "Jo" | Rejeitado por mín. 3 caracteres | Negativo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O formulário é exibido SOMENTE quando o adotante não tem perfil E inicia pedido de adoção.
- [ ] CA-02: Após cadastro bem-sucedido, o fluxo de pedido continua sem necessidade de re-autenticação.
- [ ] CA-03: O e-mail exibido no formulário é o da conta autenticada e não pode ser alterado.
- [ ] CA-04: Campos condicionais (animais) só aparecem quando a respectiva pergunta é "Sim".
- [ ] CA-05: CPF com dígitos verificadores inválidos é rejeitado.
- [ ] CA-06: Idade inferior a 18 anos é rejeitada.
- [ ] CA-07: CPF duplicado é rejeitado com mensagem clara.

**Regressão:**
- [ ] A criação de um perfil de adotante não impacta o módulo de autenticação (MODULE-002).
- [ ] O catálogo público (MODULE-003) permanece acessível sem cadastro de adotante.
- [ ] Um segundo pedido de adoção do mesmo adotante NÃO re-exibe o formulário de cadastro.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Taxa de conclusão do cadastro (adotantes que completam o formulário) | 0 | > 85% | Analytics — formulários iniciados vs. concluídos |
| Tempo médio de preenchimento do formulário | N/A | < 3 minutos | Analytics — timestamp início vs. submissão |
| Taxa de erros de validação na primeira tentativa | N/A | < 30% | Analytics — submissões rejeitadas por validação |

---
