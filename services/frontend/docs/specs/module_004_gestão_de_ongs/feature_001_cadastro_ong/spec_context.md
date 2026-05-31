# FEATURE-001 — Cadastro de ONG (Complemento)

---

## Grupo 1 — Identificação

**Feature:** FEATURE-001 — Cadastro de ONG (Complemento)
**Módulo:** MODULE-004 — Gestão de ONGs
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-05-30
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

O cadastro de ONG atual coleta apenas dados mínimos (nome, CNPJ, telefone, endereço). Esta feature complementa o formulário com informações institucionais que aumentam a confiança dos adotantes e fornecem insumos suficientes para o Administrador do Sistema avaliar a legitimidade e a capacidade operacional da ONG durante o processo de aprovação. Com isso, reduz-se a necessidade de contato direto para obter informações básicas, agilizando o processo de onboarding.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Administrador da ONG | Escrita | Preenche os campos no cadastro e no perfil |
| Administrador do Sistema | Leitura | Visualiza as informações ao avaliar a aprovação |
| Adotante | Leitura | Visualiza informações públicas da ONG (feature futura) |

---

### Premissas

- O formulário de cadastro existente será estendido — não substituído.
- O campo "E-mail" existente será renomeado para "E-mail institucional" — sem mudança funcional (continua sendo usado para login e confirmação de conta).
- Uma tela de perfil da ONG será disponibilizada para abrigar campos opcionais (missão, fotos, redes sociais).
- A infraestrutura de armazenamento de arquivos estará disponível para upload de fotos.
- O fluxo de confirmação de e-mail existente permanece inalterado.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 (módulo 002) — Autenticação | FEATURE | Resolvida | Fluxo de registro de ONG base já funcional |
| Infraestrutura de armazenamento de arquivos | Decisão técnica | Pendente | Upload de fotos não pode ser implementado |
| Tela de perfil da ONG | FEATURE | Pendente | Campos opcionais (missão, fotos, redes sociais) não terão onde ser exibidos |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — termos: ONG, Administrador da ONG, Administrador do Sistema
- product/scope_features_context.md — descrição da feature "Cadastro de ONG"
- Código existente: services/backend/src/domains/auth/auth.service.ts (método registerOng)
- Migração existente: services/backend/src/database/migrations/20260529_001_create_ongs_table.ts

**Tabelas de banco de dados:** ongs, ong_photos (nova)

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Informar descrição e capacidade no cadastro

Como Administrador da ONG, quero informar a descrição da ONG e a capacidade de animais durante o cadastro, para que o Administrador do Sistema tenha informações suficientes para avaliar minha solicitação.

**Pode ser testada independentemente:** Sim. Ao submeter o formulário de cadastro com os novos campos obrigatórios preenchidos, os dados são persistidos e visíveis no painel de aprovação do Admin.

**Cenários de aceite:**

1. **Dado** que estou preenchendo o formulário de cadastro da ONG, **quando** tento submeter sem preencher o campo "Descrição da ONG", **então** o sistema exibe a mensagem "Descrição é obrigatória (mínimo 50 caracteres)" e não submete o formulário.
2. **Dado** que preenchi a descrição com 45 caracteres, **quando** tento submeter o formulário, **então** o sistema exibe "Descrição deve ter no mínimo 50 caracteres" e não submete.
3. **Dado** que preenchi a descrição corretamente (50-500 caracteres) e a capacidade com um número inteiro ≥ 1, **quando** submeto o formulário com todos os campos obrigatórios válidos, **então** a ONG é criada com status "Pendente" contendo a descrição e capacidade informadas.
4. **Dado** que preenchi o campo "Capacidade de animais" com "0" ou "-5" ou "abc", **quando** tento submeter o formulário, **então** o sistema exibe "Capacidade deve ser um número inteiro maior que zero" e não submete.

---

#### HU-02 — Completar perfil com missão e redes sociais

Como Administrador da ONG, quero adicionar a missão da ONG e links de redes sociais no perfil, para que adotantes possam conhecer melhor a ONG e entrar em contato por outros canais.

**Pode ser testada independentemente:** Sim. Após login como Admin da ONG, a tela de perfil permite salvar missão e redes sociais independentemente do processo de cadastro.

**Cenários de aceite:**

1. **Dado** que estou logado como Administrador da ONG e acesso a tela de perfil, **quando** preencho o campo "Missão" com texto entre 50 e 300 caracteres e salvo, **então** a missão é salva e exibida no perfil da ONG.
2. **Dado** que preencho o campo Instagram com uma URL inválida (ex: "instagram"), **quando** tento salvar, **então** o sistema exibe "Informe uma URL válida para Instagram" e não salva.
3. **Dado** que preencho WhatsApp com "11999998888" (formato válido), **quando** salvo o perfil, **então** o número é armazenado e exibido nas informações da ONG.
4. **Dado** que preencho o campo "Missão" com menos de 50 caracteres, **quando** tento salvar, **então** o sistema exibe "Missão deve ter no mínimo 50 caracteres" e não salva.

---

#### HU-03 — Adicionar fotos da ONG no perfil

Como Administrador da ONG, quero fazer upload de fotos do espaço físico da ONG, para que adotantes e o Administrador do Sistema possam avaliar a estrutura disponível.

**Pode ser testada independentemente:** Sim. O upload de fotos funciona isoladamente na tela de perfil da ONG.

**Cenários de aceite:**

1. **Dado** que estou na tela de perfil da ONG, **quando** faço upload de uma imagem JPG de 3MB, **então** a imagem é salva, um preview é exibido e o contador mostra "1/5 fotos".
2. **Dado** que já tenho 5 fotos cadastradas, **quando** tento fazer upload de uma 6ª foto, **então** o sistema exibe "Limite máximo de 5 fotos atingido" e não permite o upload.
3. **Dado** que tento fazer upload de um arquivo .gif de 2MB, **quando** seleciono o arquivo, **então** o sistema exibe "Formato não permitido. Apenas JPG e PNG são aceitos" e rejeita o arquivo.
4. **Dado** que tento fazer upload de um arquivo PNG de 7MB, **quando** seleciono o arquivo, **então** o sistema exibe "Arquivo excede o tamanho máximo de 5MB" e rejeita o arquivo.
5. **Dado** que tenho 3 fotos cadastradas, **quando** clico em remover uma foto específica e confirmo, **então** a foto é removida e o contador atualiza para "2/5 fotos".

---

### Regras de Negócio

- **RN-01:** O campo "E-mail institucional" é obrigatório, único no sistema, utilizado para login e contato público. Validação de formato RFC 5322. Funcionalidade idêntica ao campo "E-mail" existente — apenas renomeação de label.
- **RN-02:** A "Descrição da ONG" é obrigatória no cadastro. Mínimo 50 caracteres, máximo 500. Não aceita texto composto apenas por espaços em branco.
- **RN-03:** A "Capacidade de animais" é obrigatória no cadastro. Deve ser um número inteiro positivo ≥ 1. Não aceita decimais, zero ou valores negativos.
- **RN-04:** O campo "Missão" é opcional (disponível apenas no perfil). Quando preenchido: mínimo 50 caracteres, máximo 300.
- **RN-05:** Fotos são opcionais (disponíveis apenas no perfil). Máximo 5 fotos. Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB por arquivo.
- **RN-06:** Redes sociais são opcionais (disponíveis apenas no perfil). Instagram e Facebook: validação de URL (deve conter domínio válido). WhatsApp: número brasileiro com DDD (10-11 dígitos numéricos).
- **RN-07:** Campos opcionais (Missão, Fotos, Redes sociais) não bloqueiam o cadastro e podem ser preenchidos a qualquer momento na tela de perfil.
- **RN-08:** Campos obrigatórios (E-mail institucional, Descrição, Capacidade) bloqueiam a submissão do formulário de cadastro se não preenchidos ou inválidos.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

**Formulário de cadastro** (rota /register/ong):
- Campos existentes: Nome do responsável, E-mail institucional (renomeado), Senha, Confirmação de senha, Nome da ONG, CNPJ, Telefone, Endereço
- Novos campos obrigatórios: Descrição da ONG (textarea com contador de caracteres), Capacidade de animais (campo numérico)
- Seção "Dados da ONG" agrupa todos os campos da organização

**Tela de perfil da ONG** (disponível pós-login como Admin da ONG):
- Campos opcionais: Missão (textarea com contador), Instagram (URL), Facebook (URL), WhatsApp (número), Fotos (upload com preview)
- Botão "Salvar alterações"

#### Ações disponíveis

**Ação 1 — Submeter cadastro com campos complementares**

O responsável da ONG preenche o formulário completo incluindo descrição e capacidade. Ao submeter:
- Se todos os campos obrigatórios estão válidos → ONG criada com status "Pendente", e-mail de confirmação enviado
- Se algum campo obrigatório é inválido → formulário não é submetido, erros exibidos nos campos correspondentes

**Ação 2 — Salvar perfil da ONG (campos opcionais)**

O Administrador da ONG acessa a tela de perfil e preenche/atualiza missão, redes sociais ou fotos. Ao salvar:
- Se campos preenchidos são válidos → dados salvos, mensagem de sucesso
- Se algum campo preenchido é inválido → dados não são salvos, erros exibidos nos campos correspondentes

**Ação 3 — Upload de fotos**

O Administrador da ONG seleciona arquivos para upload:
- Se formato válido e tamanho ≤ 5MB e total de fotos < 5 → foto salva, preview exibido
- Se formato inválido → mensagem de erro, arquivo rejeitado
- Se tamanho > 5MB → mensagem de erro, arquivo rejeitado
- Se limite de 5 fotos atingido → mensagem de erro, upload bloqueado

**Ação 4 — Remover foto**

O Administrador da ONG clica em remover foto:
- Se confirmado → foto removida, contador atualizado
- Se cancelado → nenhuma ação executada

---

#### Validações e Restrições

- "Descrição da ONG" é obrigatório, mínimo 50 caracteres, máximo 500 caracteres.
- "Capacidade de animais" é obrigatório, aceita apenas números inteiros ≥ 1.
- "Missão" quando preenchido: mínimo 50 caracteres, máximo 300 caracteres.
- "Instagram" quando preenchido: deve ser URL válida contendo "instagram.com".
- "Facebook" quando preenchido: deve ser URL válida contendo "facebook.com".
- "WhatsApp" quando preenchido: deve conter apenas dígitos, entre 10 e 11 caracteres (DDD + número).
- Upload de foto: apenas JPG e PNG, máximo 5MB por arquivo, máximo 5 fotos por ONG.
- Contador de caracteres visível nos campos Descrição e Missão.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Descrição não preenchida | 'Descrição é obrigatória (mínimo 50 caracteres)' |
| Descrição < 50 caracteres | 'Descrição deve ter no mínimo 50 caracteres' |
| Descrição > 500 caracteres | 'Descrição deve ter no máximo 500 caracteres' |
| Capacidade inválida | 'Capacidade deve ser um número inteiro maior que zero' |
| Missão < 50 caracteres | 'Missão deve ter no mínimo 50 caracteres' |
| Missão > 300 caracteres | 'Missão deve ter no máximo 300 caracteres' |
| URL Instagram inválida | 'Informe uma URL válida para Instagram' |
| URL Facebook inválida | 'Informe uma URL válida para Facebook' |
| WhatsApp formato inválido | 'Informe um número de WhatsApp válido com DDD (10-11 dígitos)' |
| Upload formato não aceito | 'Formato não permitido. Apenas JPG e PNG são aceitos' |
| Upload excede tamanho | 'Arquivo excede o tamanho máximo de 5MB' |
| Limite de fotos atingido | 'Limite máximo de 5 fotos atingido' |
| Perfil salvo com sucesso | 'Perfil da ONG atualizado com sucesso' |
| Cadastro submetido com sucesso | 'Cadastro realizado! Verifique seu e-mail para ativar sua conta.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | Upload de foto deve ser rápido mesmo em conexões móveis | Conclusão em até 10 segundos para arquivo de 5MB em conexão 4G (5 Mbps) |
| RNF-02 | Usabilidade | Validações devem ocorrer no cliente antes de enviar ao servidor | Formato e tamanho de arquivo rejeitados sem transferência de dados |
| RNF-03 | Segurança | Todas as validações devem ser replicadas no servidor | Nenhum dado inválido é persistido mesmo com bypass do cliente |
| RNF-04 | Responsividade | Novos campos devem funcionar em dispositivos mobile | Formulário utilizável em telas ≥ 320px de largura |

---

### O que Não Deve Ser Feito

- Esta feature não implementa edição/crop de imagem no upload.
- Esta feature não implementa reordenação de fotos nem definição de foto principal.
- Esta feature não cria fluxo de verificação separado para e-mail institucional (usa o fluxo de confirmação de conta existente).
- Esta feature não altera o fluxo de aprovação/rejeição pelo Administrador do Sistema (apenas exibe os novos campos na tela de avaliação).
- Esta feature não implementa campos de redes sociais além de Instagram, Facebook e WhatsApp.
- Esta feature não divide capacidade de animais por espécie.
- Esta feature não cria tela pública do perfil da ONG (escopo de feature futura).

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Cadastro com todos os campos obrigatórios válidos | Descrição com 100 chars, Capacidade = 20 | ONG criada com status "Pendente", dados persistidos | Positivo |
| CT-02 | Cadastro sem descrição | Campo descrição vazio | Mensagem de erro, formulário não submetido | Negativo |
| CT-03 | Descrição com exatos 50 caracteres | Texto com 50 chars | Aceito, formulário submetido | Borda |
| CT-04 | Descrição com 501 caracteres | Texto com 501 chars | Mensagem "máximo 500 caracteres", não submete | Borda |
| CT-05 | Capacidade com valor zero | Capacidade = 0 | Mensagem de erro, não submete | Negativo |
| CT-06 | Capacidade com valor decimal | Capacidade = 3.5 | Mensagem de erro, não submete | Negativo |
| CT-07 | Capacidade com valor negativo | Capacidade = -1 | Mensagem de erro, não submete | Negativo |
| CT-08 | Upload de JPG com 4MB | Arquivo JPG, 4MB | Upload aceito, preview exibido | Positivo |
| CT-09 | Upload de arquivo 6MB | Arquivo PNG, 6MB | Rejeição com mensagem de tamanho | Negativo |
| CT-10 | Upload de formato GIF | Arquivo GIF, 2MB | Rejeição com mensagem de formato | Negativo |
| CT-11 | Upload da 6ª foto | 5 fotos já existem | Rejeição com mensagem de limite | Borda |
| CT-12 | Missão com 49 caracteres | Texto com 49 chars | Mensagem de erro, não salva | Borda |
| CT-13 | Instagram com URL válida | https://instagram.com/ong | Salvo com sucesso | Positivo |
| CT-14 | Instagram com texto sem URL | "instagram" | Mensagem de erro, não salva | Negativo |
| CT-15 | WhatsApp com 11 dígitos | 11999998888 | Salvo com sucesso | Positivo |
| CT-16 | WhatsApp com 9 dígitos | 119999988 | Mensagem de erro, não salva | Negativo |
| CT-17 | Remoção de foto existente | Clicar remover + confirmar | Foto removida, contador atualizado | Positivo |
| CT-18 | Descrição com apenas espaços em branco | "          " (espaços) | Mensagem de erro, não submete | Negativo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O formulário de cadastro exibe campos "Descrição da ONG" e "Capacidade de animais" como obrigatórios.
- [ ] CA-02: O formulário não pode ser submetido sem descrição válida (50-500 caracteres) e capacidade válida (inteiro ≥ 1).
- [ ] CA-03: O campo "E-mail" é exibido com label "E-mail institucional" no formulário de cadastro.
- [ ] CA-04: A tela de perfil da ONG permite preencher Missão, Redes sociais e Fotos opcionalmente.
- [ ] CA-05: O upload de fotos respeita os limites de formato (JPG/PNG), tamanho (5MB) e quantidade (5).
- [ ] CA-06: O Administrador do Sistema visualiza todos os campos complementares ao avaliar a ONG pendente.
- [ ] CA-07: Validações são aplicadas tanto no cliente quanto no servidor.
- [ ] CA-08: Mensagens de erro são claras, específicas e em português.

**Regressão:**
- [ ] FEATURE-001 (módulo 002) — O fluxo de registro existente (nome, email, senha, CNPJ, telefone, endereço) continua funcionando sem regressão.
- [ ] Login de ONG Admin — A adição de campos não impacta o fluxo de login.
- [ ] Confirmação de e-mail — O fluxo de confirmação permanece inalterado.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Completude do perfil das ONGs | 0% (apenas dados básicos) | >80% das ONGs com descrição e capacidade | Consulta ao banco de dados |
| Tempo médio de avaliação pelo Admin | Indisponível (novo processo) | < 2 dias por solicitação | Diferença entre data de cadastro e data de aprovação/rejeição |
| Taxa de aprovação na 1ª tentativa | Indisponível | >70% das ONGs aprovadas sem necessidade de recontato | Contagem de aprovações vs. total de cadastros |

---
