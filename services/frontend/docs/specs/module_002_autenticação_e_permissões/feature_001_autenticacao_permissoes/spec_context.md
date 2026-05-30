# FEATURE-001 — Autenticação e Permissões

---

## Grupo 1 — Identificação

**Feature:** FEATURE-001 — Autenticação e Permissões
**Módulo:** MODULE-002 — Autenticação e Permissões
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-05-29
**Aprovado por:** _A preencher_

---

## Objetivo da Feature

Esta feature resolve a necessidade fundamental de acesso seguro à plataforma CatDog Mário, permitindo que os quatro perfis de usuário (Adotante, Voluntário da ONG, Administrador da ONG e Administrador do Sistema) se autentiquem e acessem as funcionalidades adequadas ao seu papel. Sem ela, nenhuma outra feature pode funcionar, pois é a porta de entrada da plataforma. O valor entregue é segurança de acesso, experiência personalizada por papel e verificação contínua de permissões.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Adotante | Escrita (auto-registro) / Leitura (login) | Pode se registrar e fazer login após confirmação de email |
| Voluntário da ONG | Leitura (login) | Criado pelo Administrador da ONG; faz login após receber credenciais e confirmar email |
| Administrador da ONG | Escrita (auto-registro) / Leitura (login) | Auto-registro junto com dados da ONG; login liberado após confirmação de email E aprovação da ONG |
| Administrador do Sistema | Leitura (login) | Criado via seed no deploy; não possui auto-registro |

---

### Premissas

- O Administrador do Sistema é criado via seed no deploy inicial — não há auto-registro para este papel.
- Um usuário pertence a no máximo uma ONG.
- Não há login social (Google, Facebook) nesta versão.
- Não há autenticação de dois fatores (2FA) nesta versão.
- A funcionalidade "Esqueceu sua senha?" está inclusa nesta feature.
- O Administrador da ONG, uma vez aprovado e com email confirmado, é notificado por email sobre a aprovação.
- A criação de Voluntários pelo Administrador da ONG será detalhada na feature "Gestão de Voluntários" — aqui tratamos apenas o fluxo de autenticação do voluntário após criação.
- O registro de Administrador da ONG inclui dados mínimos da ONG (nome, CNPJ, telefone, endereço) — campos completos são detalhados na feature de gestão de ONGs.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| Serviço de envio de email | Decisão técnica | Pendente | Impossibilidade de confirmar contas e recuperar senhas |
| Feature de Gestão de ONGs (aprovação) | FEATURE | Pendente | Administrador da ONG não pode ter login liberado sem fluxo de aprovação |
| Seed de Administrador do Sistema | Decisão técnica | Pendente | Não haverá usuário para aprovar ONGs |

---

### Referências e Insumos

**Protótipo / Wireframe:**
- Arquivo local: `specs/module_002_autenticação_e_permissões/feature_001_autenticacao_permissoes/assets/login-reference.png`

**Artefatos consultados:**
- `overview/glossary_context.md` — termos: Adotante, Voluntário, Administrador da ONG, Administrador do Sistema
- `overview/project_goal_context.md` — perfis de usuário e seus papéis
- `product/scope_features_context.md` — módulo Gestão de Usuários e Permissões

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Registro de Adotante

O Adotante acessa a tela de login e clica em "Cadastre-se". É direcionado à tela de registro onde preenche nome, email, senha e confirmação de senha. Ao submeter o formulário com dados válidos, sua conta é criada com status de email pendente e um email estilizado de confirmação é enviado. O Adotante vê uma mensagem de sucesso orientando-o a verificar sua caixa de entrada.

**Pode ser testada independentemente:** Sim. O cadastro cria a conta e envia o email de confirmação, sendo observável sem depender de outras histórias.

**Cenários de aceite:**

1. **Dado** que o Adotante está na tela de registro, **quando** preenche todos os campos corretamente e clica "Cadastrar", **então** a conta é criada e o sistema exibe "Cadastro realizado! Verifique seu e-mail para ativar sua conta."
2. **Dado** que o Adotante informa um email já cadastrado, **quando** clica "Cadastrar", **então** o sistema exibe "Este e-mail já está cadastrado."
3. **Dado** que o Adotante informa uma senha que não atende à política, **quando** clica "Cadastrar", **então** o sistema exibe os requisitos de senha não atendidos.
4. **Dado** que as senhas não coincidem, **quando** clica "Cadastrar", **então** o sistema exibe "As senhas não coincidem."

---

#### HU-02 — Registro de Administrador de ONG

O representante de uma ONG acessa a tela de registro e seleciona a opção "Sou uma ONG". O formulário expande para incluir dados pessoais (nome, email, senha, confirmação) e dados mínimos da ONG (nome da ONG, CNPJ, telefone, endereço). Ao submeter com dados válidos, a conta e a ONG são criadas com status pendente. Um email de confirmação é enviado e o sistema informa que, após confirmação do email, a ONG passará por aprovação.

**Pode ser testada independentemente:** Sim. O cadastro cria conta + ONG pendente e envia email, independente do fluxo de aprovação.

**Cenários de aceite:**

1. **Dado** que o representante está na tela de registro e seleciona "Sou uma ONG", **quando** preenche todos os campos corretamente e clica "Cadastrar", **então** conta e ONG são criadas com status pendente e o sistema exibe "Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação."
2. **Dado** que informa um CNPJ já cadastrado, **quando** clica "Cadastrar", **então** o sistema exibe "Este CNPJ já está cadastrado."
3. **Dado** que informa um email já cadastrado, **quando** clica "Cadastrar", **então** o sistema exibe "Este e-mail já está cadastrado."

---

#### HU-03 — Confirmação de Email

O usuário recém-registrado recebe um email estilizado com o branding CatDog (cores roxo e laranja, logo, padrão de paw prints). O email contém um link de confirmação. Ao clicar no link dentro de 24 horas, o email é marcado como confirmado e o usuário é redirecionado para a tela de login com mensagem de sucesso. Se o link expirou ou já foi utilizado, o sistema exibe mensagem adequada com opção de reenvio.

**Pode ser testada independentemente:** Sim. Basta ter uma conta com email pendente para testar o fluxo de confirmação.

**Cenários de aceite:**

1. **Dado** que o usuário se registrou com sucesso, **quando** verifica sua caixa de entrada, **então** recebe um email estilizado com o branding CatDog contendo link de confirmação.
2. **Dado** que o usuário clica no link dentro de 24 horas, **quando** a página carrega, **então** o email é confirmado e o sistema exibe "E-mail confirmado com sucesso! Faça login para continuar." com redirecionamento para login.
3. **Dado** que o usuário clica no link após 24 horas, **quando** a página carrega, **então** o sistema exibe "Este link expirou. Clique abaixo para receber um novo." com botão de reenvio.
4. **Dado** que o usuário clica em um link já utilizado, **quando** a página carrega, **então** o sistema exibe "Este link já foi utilizado." com link para ir ao login.

---

#### HU-04 — Login e Redirecionamento por Papel

O usuário com conta confirmada acessa a tela de login, informa email e senha, e ao clicar "Entrar" é autenticado e redirecionado para a página adequada ao seu papel. Cada papel possui um layout/menu diferenciado. Adotantes vão para o catálogo de animais; Voluntários e Administradores de ONG vão para o painel de solicitações; Administrador do Sistema vai para o painel de ONGs.

**Pode ser testada independentemente:** Sim. Com contas de diferentes papéis já confirmadas, o redirecionamento é observável.

**Cenários de aceite:**

1. **Dado** que o usuário é Adotante com email confirmado, **quando** faz login com credenciais corretas, **então** é redirecionado ao catálogo de animais disponíveis.
2. **Dado** que o usuário é Voluntário da ONG ou Administrador da ONG com acesso liberado, **quando** faz login, **então** é redirecionado ao painel de solicitações de adoção com menu lateral.
3. **Dado** que o usuário é Administrador do Sistema, **quando** faz login, **então** é redirecionado ao painel de ONGs cadastradas com menu lateral.
4. **Dado** que o usuário informa credenciais incorretas, **quando** clica "Entrar", **então** vê "E-mail ou senha incorretos."
5. **Dado** que o email do usuário não foi confirmado, **quando** tenta fazer login, **então** vê "Confirme seu e-mail para acessar a plataforma." com opção de reenvio.
6. **Dado** que o usuário é Administrador de ONG e a ONG está pendente de aprovação, **quando** tenta fazer login (com email confirmado), **então** vê "Sua ONG ainda está em análise. Você será notificado quando for aprovada."

---

#### HU-05 — Recuperação de Senha

O usuário que esqueceu a senha clica em "Esqueceu sua senha?" na tela de login. Informa seu email e recebe um código de 6 dígitos por email. Ao informar o código correto dentro de 15 minutos, é direcionado à tela de definição de nova senha. Após definir a nova senha com confirmação, a senha é atualizada e o usuário é redirecionado ao login.

**Pode ser testada independentemente:** Sim. Com qualquer conta existente, o fluxo completo de recuperação é observável.

**Cenários de aceite:**

1. **Dado** que o usuário está na tela de login, **quando** clica "Esqueceu sua senha?" e informa seu email, **então** vê "Enviamos um código de 6 dígitos para seu e-mail." (independente de o email existir ou não no sistema).
2. **Dado** que o usuário recebeu o código, **quando** informa o código correto dentro de 15 minutos, **então** é direcionado à tela de nova senha.
3. **Dado** que o código expirou, **quando** tenta usá-lo, **então** vê "Código expirado. Solicite um novo."
4. **Dado** que define nova senha válida com confirmação, **quando** clica "Alterar senha", **então** a senha é atualizada e vê "Senha alterada com sucesso!" com redirecionamento ao login.

---

#### HU-06 — Renovação de Token com Verificação de Permissões

A plataforma utiliza tokens de curta duração para acesso. Quando o token expira, o sistema automaticamente o renova consultando as permissões atuais do usuário no banco de dados. Isso garante que alterações de papel ou desativações sejam aplicadas sem necessidade de logout manual, em um prazo máximo equivalente à duração do token de acesso.

**Pode ser testada independentemente:** Sim. Alterando o papel de um usuário logado e aguardando a renovação do token, observa-se a mudança de permissões.

**Cenários de aceite:**

1. **Dado** que o token de acesso expirou, **quando** o sistema tenta renovar via refresh token, **então** um novo token é gerado com as permissões atuais do banco de dados.
2. **Dado** que o papel do usuário foi alterado pelo administrador, **quando** o token é renovado, **então** o novo token reflete o papel atualizado e a interface se adapta ao novo layout.
3. **Dado** que a conta do usuário foi desativada, **quando** o sistema tenta renovar o token, **então** o refresh é rejeitado e o usuário é redirecionado ao login com "Sua sessão expirou. Faça login novamente."
4. **Dado** que o refresh token expirou (após 7 dias sem uso), **quando** o sistema tenta renovar, **então** o usuário é redirecionado ao login.

---

### Regras de Negócio

- **RN-01:** Apenas Adotantes e Administradores de ONG podem se auto-registrar na plataforma. Voluntários são criados pelo Administrador da ONG.
- **RN-02:** O email deve ser único no sistema (case-insensitive). Não é permitido cadastrar duas contas com o mesmo email.
- **RN-03:** Ao registrar como Administrador de ONG, o usuário deve preencher simultaneamente seus dados pessoais e os dados mínimos da ONG.
- **RN-04:** O registro de Administrador de ONG fica pendente de aprovação pelo Administrador do Sistema. O usuário não pode fazer login até a ONG ser aprovada.
- **RN-05:** Ao concluir o registro (Adotante ou Administrador de ONG), um email estilizado de confirmação é enviado automaticamente.
- **RN-06:** O usuário não pode fazer login sem confirmar o email.
- **RN-07:** O link de confirmação de email expira em 24 horas e é de uso único.
- **RN-08:** Após expiração do link, o usuário pode solicitar reenvio do email de confirmação.
- **RN-09:** Login é feito exclusivamente via email + senha.
- **RN-10:** Não há bloqueio por tentativas falhas de login. A mensagem de erro é genérica para evitar enumeração de contas.
- **RN-11:** Após login bem-sucedido, o sistema redireciona o usuário conforme seu papel.
- **RN-12:** Recuperação de senha é feita via código temporário de 6 dígitos enviado por email, com validade de 15 minutos e uso único.
- **RN-13:** Se o email informado na recuperação de senha não existir no sistema, o sistema exibe a mesma mensagem de sucesso (proteção contra enumeração de emails).
- **RN-14:** Permissões do usuário são re-verificadas no banco a cada renovação de token.
- **RN-15:** Se o papel do usuário for alterado entre renovações, o novo token reflete as novas permissões imediatamente.
- **RN-16:** Se o usuário for desativado, o refresh token é invalidado na próxima tentativa de renovação.
- **RN-17:** Cada papel possui um layout/menu diferente determinado pelo papel presente no token decodificado no frontend.
- **RN-18:** Voluntários criados pelo Administrador da ONG também recebem email de confirmação/ativação.
- **RN-19:** O Administrador do Sistema é criado via seed e não possui fluxo de auto-registro.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

A tela de login é exibida como ponto de entrada da plataforma. O fundo é cinza claro com padrão sutil de paw prints e corações. No centro, um card branco com bordas arredondadas e sombra suave contém: logo (silhueta de gato laranja + texto "CatDog" em cinza escuro, separados por linha vertical fina), título "Bem vindo!", subtítulo "Digite os seus dados de acesso no campo abaixo", campos de email e senha, link "Esqueceu sua senha?", botão "Entrar" e link "Não tem uma conta? Cadastre-se".

#### Ações disponíveis

**Ação 1 — Login (Entrar)**

O usuário preenche email e senha e clica no botão "Entrar". O sistema valida as credenciais e o status da conta.

Regras condicionais:
- Se credenciais inválidas → exibe "E-mail ou senha incorretos."
- Se email não confirmado → exibe "Confirme seu e-mail para acessar a plataforma." com link para reenviar
- Se Administrador de ONG com ONG pendente → exibe "Sua ONG ainda está em análise. Você será notificado quando for aprovada."
- Se tudo válido → gera tokens de acesso e refresh, redireciona conforme papel:
  - Adotante → catálogo de animais disponíveis
  - Voluntário da ONG → painel de solicitações de adoção + menu lateral
  - Administrador da ONG → painel de solicitações de adoção + menu lateral
  - Administrador do Sistema → painel de ONGs cadastradas + menu lateral

**Ação 2 — Cadastro (Cadastre-se)**

O usuário clica em "Cadastre-se" e é direcionado à tela de registro. Por padrão, exibe formulário de Adotante (nome, email, senha, confirmação). Existe opção "Sou uma ONG" que expande o formulário com campos adicionais da ONG.

Regras condicionais:
- Se registro como Adotante com dados válidos → cria conta com email pendente, envia email de confirmação, exibe mensagem de sucesso
- Se registro como Administrador de ONG com dados válidos → cria conta + ONG com status pendente, envia email de confirmação, exibe mensagem sobre aprovação
- Se dados inválidos → exibe erros inline nos campos correspondentes

**Ação 3 — Esqueceu sua senha**

O usuário clica em "Esqueceu sua senha?" e é direcionado a uma tela onde informa seu email.

Regras condicionais:
- Se submete email (independente de existir ou não) → exibe "Enviamos um código de 6 dígitos para seu e-mail."
- Se informa código correto dentro de 15 min → é direcionado à tela de nova senha
- Se código inválido ou expirado → exibe mensagem de erro adequada
- Se define nova senha válida → atualiza senha e redireciona ao login

**Ação 4 — Toggle de visibilidade da senha**

O usuário clica no ícone de olho no campo de senha para alternar entre exibir e ocultar a senha digitada.

---

#### Validações e Restrições

- Campo "Nome" é obrigatório, aceita no mínimo 3 e no máximo 100 caracteres.
- Campo "Email" é obrigatório, deve ter formato de email válido, e ser único no sistema (case-insensitive).
- Campo "Senha" é obrigatório, aceita no mínimo 8 caracteres, deve conter ao menos 1 letra maiúscula e 1 número.
- Campo "Confirmar Senha" é obrigatório, deve ser idêntico ao campo "Senha".
- Campo "Nome da ONG" é obrigatório para registro de ONG, aceita no mínimo 3 e no máximo 150 caracteres.
- Campo "CNPJ" é obrigatório para registro de ONG, deve ter formato válido e ser único no sistema.
- Campo "Telefone da ONG" é obrigatório para registro de ONG, deve ter formato válido.
- Campo "Endereço da ONG" é obrigatório para registro de ONG.
- Campo "Código de recuperação" aceita exatamente 6 dígitos numéricos.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Login com credenciais inválidas | 'E-mail ou senha incorretos.' |
| Login com email não confirmado | 'Confirme seu e-mail para acessar a plataforma.' |
| Login com ONG pendente | 'Sua ONG ainda está em análise. Você será notificado quando for aprovada.' |
| Registro de Adotante com sucesso | 'Cadastro realizado! Verifique seu e-mail para ativar sua conta.' |
| Registro de Administrador de ONG com sucesso | 'Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação.' |
| Email já cadastrado | 'Este e-mail já está cadastrado.' |
| CNPJ já cadastrado | 'Este CNPJ já está cadastrado.' |
| Senhas não coincidem | 'As senhas não coincidem.' |
| Senha fraca | 'A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.' |
| Nome inválido | 'Informe seu nome completo.' |
| Email inválido | 'Informe um e-mail válido.' |
| Telefone inválido | 'Informe um telefone válido.' |
| Email confirmado com sucesso | 'E-mail confirmado com sucesso! Faça login para continuar.' |
| Link de confirmação expirado | 'Este link expirou. Clique abaixo para receber um novo.' |
| Link de confirmação já utilizado | 'Este link já foi utilizado.' |
| Código de recuperação enviado | 'Enviamos um código de 6 dígitos para seu e-mail.' |
| Código inválido | 'Código inválido.' |
| Código expirado | 'Código expirado. Solicite um novo.' |
| Senha alterada com sucesso | 'Senha alterada com sucesso!' |
| Sessão expirada | 'Sua sessão expirou. Faça login novamente.' |
| Acesso negado por permissão | 'Você não tem permissão para acessar esta página.' |

---

#### Integrações

| Sistema externo | O que é enviado | O que é recebido | Em caso de falha |
|---|---|---|---|
| Serviço de email | Template estilizado com link/código + dados do destinatário | Confirmação de envio | O registro não é bloqueado; o sistema exibe mensagem de sucesso e tenta reenvio via fila |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Segurança | Senhas devem ser armazenadas com hash seguro de custo computacional adequado | Hash irreversível, resistente a ataques de dicionário |
| RNF-02 | Segurança | Proteção contra enumeração de emails em todos os fluxos públicos | Mensagens genéricas que não revelam existência de conta |
| RNF-03 | Segurança | Links e códigos de confirmação devem ser imprevisíveis | Tokens gerados com aleatoriedade criptograficamente segura |
| RNF-04 | Segurança | Comunicação obrigatoriamente criptografada em produção | 100% das requisições via HTTPS |
| RNF-05 | Performance | O fluxo de login deve ser responsivo | Resposta em menos de 2 segundos para o usuário |
| RNF-06 | Confiabilidade | Falha no envio de email não deve bloquear o registro do usuário | Email enviado via processamento assíncrono com retentativas |
| RNF-07 | Segurança | Refresh tokens não devem ser acessíveis por scripts no navegador | Armazenamento seguro com proteção contra XSS |
| RNF-08 | Multi-tenant | Dados de cada ONG devem ser isolados | Usuário vinculado a no máximo uma ONG; sem acesso cruzado |

---

### O que Não Deve Ser Feito

- Esta feature não implementa login social (Google, Apple, Facebook).
- Esta feature não implementa autenticação de dois fatores (2FA).
- Esta feature não implementa a gestão completa de voluntários (cadastro/edição/desativação pelo Administrador da ONG) — apenas o fluxo de login do voluntário após criação.
- Esta feature não implementa a gestão completa dos dados da ONG — apenas os campos mínimos no registro.
- Esta feature não implementa "Manter conectado" (remember me).
- Esta feature não implementa bloqueio de conta por tentativas falhas de login.
- Esta feature não implementa invalidação imediata de sessão ativa — a alteração de permissões se aplica em até o tempo de vida do token de acesso.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Login com credenciais válidas (Adotante) | Email confirmado + senha correta | Redirecionamento ao catálogo de animais | Positivo |
| CT-02 | Login com credenciais válidas (Voluntário) | Email confirmado + senha correta | Redirecionamento ao painel de solicitações | Positivo |
| CT-03 | Login com credenciais válidas (Admin ONG) | Email confirmado + ONG aprovada + senha correta | Redirecionamento ao painel de solicitações | Positivo |
| CT-04 | Login com credenciais válidas (Admin Sistema) | Email confirmado + senha correta | Redirecionamento ao painel de ONGs | Positivo |
| CT-05 | Login com email incorreto | Email não cadastrado + qualquer senha | Mensagem "E-mail ou senha incorretos." | Negativo |
| CT-06 | Login com senha incorreta | Email correto + senha errada | Mensagem "E-mail ou senha incorretos." | Negativo |
| CT-07 | Login com email não confirmado | Email válido porém não confirmado | Mensagem de confirmação pendente | Negativo |
| CT-08 | Login com ONG pendente | Admin ONG com email confirmado, ONG pendente | Mensagem "ONG em análise" | Negativo |
| CT-09 | Registro de Adotante com dados válidos | Nome, email único, senha forte, confirmação | Conta criada + email enviado + mensagem de sucesso | Positivo |
| CT-10 | Registro com email duplicado | Email já existente no sistema | Erro "Este e-mail já está cadastrado." | Negativo |
| CT-11 | Registro com senha fraca | Senha com menos de 8 chars | Erro de validação de senha | Negativo |
| CT-12 | Registro com senhas divergentes | Senha ≠ Confirmação | Erro "As senhas não coincidem." | Negativo |
| CT-13 | Confirmação de email com link válido | Clique no link dentro de 24h | Email confirmado + redirecionamento ao login | Positivo |
| CT-14 | Confirmação de email com link expirado | Clique no link após 24h | Mensagem de expiração + opção de reenvio | Borda |
| CT-15 | Confirmação de email com link já usado | Clique em link já utilizado | Mensagem "link já utilizado" | Borda |
| CT-16 | Recuperação de senha com email válido | Email existente no sistema | Código enviado + mensagem genérica | Positivo |
| CT-17 | Recuperação de senha com email inexistente | Email não cadastrado | Mesma mensagem genérica (sem revelar) | Borda |
| CT-18 | Código de recuperação correto | Código válido dentro de 15 min | Direcionamento à tela de nova senha | Positivo |
| CT-19 | Código de recuperação expirado | Código após 15 min | Mensagem "Código expirado." | Borda |
| CT-20 | Renovação de token com papel alterado | Papel alterado pelo admin durante sessão | Novo token reflete novo papel | Positivo |
| CT-21 | Renovação de token com conta desativada | Conta desativada durante sessão | Refresh rejeitado + redirecionamento ao login | Negativo |
| CT-22 | Registro de Admin ONG com CNPJ duplicado | CNPJ já cadastrado | Erro "Este CNPJ já está cadastrado." | Negativo |
| CT-23 | Toggle de visibilidade da senha | Clique no ícone de olho | Alterna entre exibir/ocultar senha | Positivo |
| CT-24 | Acesso a rota sem permissão | Tentativa de acessar rota restrita | Redirecionamento para página de acesso negado | Negativo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O sistema exibe a tela de login com todos os elementos visuais descritos (logo, campos, botão, links) ao acessar a plataforma.
- [ ] CA-02: O sistema permite que Adotantes se registrem com nome, email, senha e confirmação de senha.
- [ ] CA-03: O sistema permite que Administradores de ONG se registrem com dados pessoais e dados mínimos da ONG.
- [ ] CA-04: O sistema envia email estilizado de confirmação com branding CatDog após registro bem-sucedido.
- [ ] CA-05: O sistema bloqueia login de usuários com email não confirmado, exibindo mensagem adequada.
- [ ] CA-06: O sistema bloqueia login de Administradores de ONG cuja ONG está pendente de aprovação.
- [ ] CA-07: O sistema redireciona cada papel para a página correta após login bem-sucedido.
- [ ] CA-08: O sistema exibe layout/menu diferenciado conforme o papel do usuário logado.
- [ ] CA-09: O sistema permite recuperação de senha via código de 6 dígitos com validade de 15 minutos.
- [ ] CA-10: O sistema renova tokens consultando permissões atuais do banco de dados.
- [ ] CA-11: O sistema invalida o refresh token quando o usuário é desativado.
- [ ] CA-12: O link de confirmação de email expira em 24 horas e é de uso único.
- [ ] CA-13: O sistema não revela se um email existe no sistema durante recuperação de senha.

**Regressão:**
- [ ] Nenhuma feature anterior afetada (esta é a primeira feature do módulo).

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Usuários que completam o registro | 0 | >80% dos que iniciam o formulário | Analytics de conversão do funil de registro |
| Usuários que confirmam email em até 24h | 0 | >70% dos registrados | Contagem de confirmações vs registros |
| Tempo médio para completar login | N/A | < 30 segundos | Analytics de tempo entre abertura da tela e redirecionamento |
| Taxa de recuperação de senha bem-sucedida | 0 | >90% dos que solicitam | Contagem de senhas alteradas vs códigos enviados |

---
