# FEATURE-003 — Gerenciamento de Dados da ONG

---

## Grupo 1 — Identificação

**Feature:** FEATURE-003 — Gerenciamento de Dados da ONG
**Módulo:** MODULE-004 — Gestão de ONGs
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-05-31
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

Permite ao Administrador da ONG manter os dados cadastrais da organização atualizados de forma autônoma, sem depender de suporte externo. Protege campos críticos (Nome e CNPJ) de alteração acidental ou indevida, enquanto oferece liberdade para atualizar informações operacionais e de apresentação. Essa feature entrega autonomia à ONG e confiabilidade aos dados da plataforma.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Administrador da ONG | Escrita (campos editáveis) | Edita todos os campos exceto Nome e CNPJ |
| Administrador do Sistema | Total | Pode editar qualquer campo, incluindo Nome e CNPJ, em casos especiais |

---

### Premissas

- A ONG já está com status "Aprovada" e o Administrador da ONG já possui acesso ao sistema.
- As validações de formato e obrigatoriedade seguem as mesmas regras estabelecidas na FEATURE-001 (Cadastro de ONG).
- A tela de perfil da ONG já está disponível (criada na FEATURE-001).
- Alterações refletem imediatamente no sistema sem necessidade de nova aprovação.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 (módulo 004) — Cadastro de ONG | FEATURE | Resolvida | Sem dados iniciais para editar |
| FEATURE-002 (módulo 004) — Aprovação de ONG | FEATURE | Resolvida | ONG precisa estar aprovada para acessar edição |
| Infraestrutura de armazenamento de arquivos | Decisão técnica | Pendente | Upload/remoção de fotos não funciona |

---

### Referências e Insumos

**Artefatos consultados:**
- overview/glossary_context.md — termos: Administrador da ONG, Administrador do Sistema
- product/scope_features_context.md — descrição da feature "Gerenciamento de Dados da ONG"
- specs/module_004_gestão_de_ongs/feature_001_cadastro_ong/spec_context.md — validações e regras dos campos

**Tabelas de banco de dados:** ongs

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Editar dados cadastrais da minha ONG

Como Administrador da ONG, quero editar os dados cadastrais da minha organização (exceto Nome e CNPJ), para que as informações exibidas na plataforma estejam sempre atualizadas.

**Pode ser testada independentemente:** Sim. Ao acessar a tela de edição, o Admin da ONG pode alterar campos editáveis e salvá-los com validação em tempo real.

**Cenários de aceite:**

1. **Dado** que o Admin da ONG acessa a tela de edição, **quando** visualiza o formulário, **então** os campos Nome e CNPJ aparecem como somente leitura e os demais campos estão editáveis.
2. **Dado** que o Admin alterou um ou mais campos com dados válidos, **quando** clica em "Salvar Alterações", **então** os dados são atualizados imediatamente e a mensagem "Dados atualizados com sucesso." é exibida.
3. **Dado** que o Admin informou um telefone em formato inválido, **quando** tenta salvar, **então** o sistema exibe o erro de validação no campo e não salva.
4. **Dado** que o Admin não alterou nenhum campo, **quando** visualiza o botão "Salvar", **então** este está desabilitado.
5. **Dado** que o Admin clica em "Cancelar", **quando** havia alterações não salvas, **então** o sistema descarta as alterações e volta ao estado anterior.

---

#### HU-02 — Atualizar fotos e redes sociais da ONG

Como Administrador da ONG, quero atualizar fotos e links de redes sociais da minha organização, para que o perfil da ONG seja mais atrativo para potenciais adotantes.

**Pode ser testada independentemente:** Sim. Upload de fotos e preenchimento de redes sociais funcionam isoladamente na tela de edição de perfil.

**Cenários de aceite:**

1. **Dado** que o Admin da ONG está na tela de edição, **quando** faz upload de uma foto em formato JPG/PNG com até 5MB, **então** a foto é adicionada ao perfil com sucesso e o preview é exibido.
2. **Dado** que o Admin tenta fazer upload de arquivo em formato PDF, **quando** seleciona o arquivo, **então** o sistema exibe "Formato não permitido. Apenas JPG e PNG são aceitos" e rejeita o arquivo.
3. **Dado** que o Admin já possui 5 fotos, **quando** tenta adicionar mais uma, **então** o sistema exibe "Limite máximo de 5 fotos atingido".
4. **Dado** que o Admin informa uma URL de Instagram válida (contendo "instagram.com"), **quando** salva, **então** o link é armazenado com sucesso.
5. **Dado** que o Admin informa uma URL de Instagram inválida, **quando** tenta salvar, **então** o sistema exibe "Informe uma URL válida para Instagram".

---

#### HU-03 — Corrigir dados críticos de uma ONG (Admin do Sistema)

Como Administrador do Sistema, quero poder editar qualquer campo de uma ONG (incluindo Nome e CNPJ) em casos especiais, para que erros cadastrais possam ser corrigidos sem necessidade de novo cadastro.

**Pode ser testada independentemente:** Sim. Na tela de detalhes de uma ONG no painel administrativo, o Admin do Sistema pode editar todos os campos.

**Cenários de aceite:**

1. **Dado** que o Admin do Sistema está na tela de detalhes de uma ONG aprovada, **quando** clica em "Editar Dados", **então** todos os campos estão editáveis, incluindo Nome e CNPJ.
2. **Dado** que o Admin do Sistema altera o CNPJ para um já existente em outra ONG, **quando** tenta salvar, **então** o sistema rejeita com mensagem "CNPJ já cadastrado em outra organização".
3. **Dado** que o Admin do Sistema salva alterações válidas, **quando** o processo finaliza, **então** os dados são atualizados imediatamente e a mensagem de sucesso é exibida.

---

### Regras de Negócio

- **RN-01:** Apenas o Administrador da ONG pode editar os dados da sua organização.
- **RN-02:** O Administrador do Sistema pode editar dados de qualquer ONG (incluindo Nome e CNPJ) em casos especiais de correção.
- **RN-03:** Campos fixos para o Administrador da ONG: Nome e CNPJ. Estes são exibidos como somente leitura.
- **RN-04:** Campos editáveis pelo Administrador da ONG: Telefone, Endereço (logradouro, número, complemento, bairro, cidade, estado, CEP), E-mail institucional, Descrição, Missão, Capacidade, Fotos, Redes Sociais (Instagram, Facebook, WhatsApp).
- **RN-05:** As validações de formato e obrigatoriedade seguem as mesmas regras da FEATURE-001.
- **RN-06:** Alterações refletem imediatamente no sistema sem necessidade de nova aprovação.
- **RN-07:** Não há limite de alterações por período.
- **RN-08:** O CNPJ deve ser único no sistema — edição pelo Admin do Sistema não pode gerar duplicidade.
- **RN-09:** Fotos devem respeitar: formatos JPG e PNG, máximo 5MB por arquivo, máximo 5 fotos por ONG.

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

**Tela de edição de dados da ONG** (Admin da ONG):
- Formulário com todos os campos da ONG
- Campos Nome e CNPJ como somente leitura, com indicação visual de que são fixos e tooltip explicativo
- Campos editáveis com validação em tempo real (mesmas regras do cadastro)
- Contador de caracteres nos campos Descrição e Missão
- Seção de upload de fotos com preview e contador ("X/5 fotos")
- Seção de redes sociais (Instagram, Facebook, WhatsApp)
- Botão "Salvar Alterações" — só ativo quando há mudanças
- Botão "Cancelar" — descarta alterações e volta ao estado anterior

**Tela de edição pelo Admin do Sistema** (painel administrativo):
- Na tela de detalhes de uma ONG aprovada, botão "Editar Dados"
- Ao clicar, todos os campos ficam editáveis (incluindo Nome e CNPJ)
- Mesmas validações se aplicam

#### Ações disponíveis

**Ação 1 — Salvar alterações (Admin da ONG)**

O Administrador da ONG altera campos editáveis e clica em "Salvar Alterações".

Regras condicionais:
- Se todos os campos preenchidos são válidos → dados salvos, mensagem de sucesso
- Se algum campo preenchido é inválido → dados não são salvos, erros exibidos nos campos correspondentes
- Se nenhum campo foi alterado → botão "Salvar" desabilitado

**Ação 2 — Cancelar edição**

O Administrador da ONG clica em "Cancelar".

Regras condicionais:
- Se havia alterações não salvas → alterações descartadas, formulário volta ao estado anterior
- Se não havia alterações → retorna à tela anterior

**Ação 3 — Editar dados (Admin do Sistema)**

O Administrador do Sistema clica em "Editar Dados" na tela de detalhes de uma ONG.

Regras condicionais:
- Se ONG está com status "Aprovada" → todos os campos editáveis, incluindo Nome e CNPJ
- Se CNPJ alterado já existe em outra ONG → erro de duplicidade exibido, dados não salvos

---

#### Validações e Restrições

- Telefone: formato válido (DDD + número, 10 ou 11 dígitos numéricos).
- E-mail institucional: formato válido de e-mail (RFC 5322).
- Capacidade: inteiro positivo ≥ 1.
- Descrição: obrigatória, mínimo 50 caracteres, máximo 500 caracteres.
- Missão: opcional, quando preenchida mínimo 50 caracteres, máximo 300 caracteres.
- Instagram: quando preenchido, deve ser URL válida contendo "instagram.com".
- Facebook: quando preenchido, deve ser URL válida contendo "facebook.com".
- WhatsApp: quando preenchido, deve conter apenas dígitos, entre 10 e 11 caracteres.
- Fotos: JPG e PNG, máximo 5MB por arquivo, máximo 5 fotos por ONG.
- CNPJ (Admin do Sistema): deve ser único no sistema.
- Campos Nome e CNPJ: exibidos como read-only para Admin da ONG.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Dados salvos com sucesso | 'Dados atualizados com sucesso.' |
| Erro de validação genérico | 'Verifique os campos destacados e corrija os erros.' |
| Campo fixo (tooltip) | 'Este campo não pode ser alterado. Em caso de erro, entre em contato com o suporte.' |
| CNPJ duplicado (Admin Sistema) | 'CNPJ já cadastrado em outra organização.' |
| Upload formato inválido | 'Formato não permitido. Apenas JPG e PNG são aceitos.' |
| Upload excede tamanho | 'Arquivo excede o tamanho máximo de 5MB.' |
| Limite de fotos atingido | 'Limite máximo de 5 fotos atingido.' |
| Instagram URL inválida | 'Informe uma URL válida para Instagram.' |
| Facebook URL inválida | 'Informe uma URL válida para Facebook.' |
| WhatsApp formato inválido | 'Informe um número de WhatsApp válido com DDD (10-11 dígitos).' |
| Descrição < 50 caracteres | 'Descrição deve ter no mínimo 50 caracteres.' |
| Capacidade inválida | 'Capacidade deve ser um número inteiro maior que zero.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Usabilidade | Validações devem ocorrer em tempo real no cliente | Usuário vê erros antes de clicar em "Salvar" |
| RNF-02 | Segurança | Todas as validações devem ser replicadas no servidor | Nenhum dado inválido é persistido mesmo com bypass do cliente |
| RNF-03 | Responsividade | A tela de edição deve funcionar em dispositivos mobile | Formulário utilizável em telas ≥ 320px de largura |

---

### O que Não Deve Ser Feito

- Esta feature não implementa auditoria ou log de alterações.
- Esta feature não implementa versionamento de dados (histórico de valores anteriores).
- Esta feature não exige aprovação de alterações pelo Administrador do Sistema.
- Esta feature não implementa limite de edições por período.
- Esta feature não re-confirma e-mail institucional quando alterado.
- Esta feature não implementa edição/crop de imagem no upload.
- Esta feature não implementa reordenação de fotos nem definição de foto principal.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Admin ONG edita telefone válido | Telefone "11988887777" | Dado salvo com sucesso | Positivo |
| CT-02 | Admin ONG tenta editar Nome | Campo Nome | Campo exibido como read-only, não editável | Positivo |
| CT-03 | Admin ONG tenta editar CNPJ | Campo CNPJ | Campo exibido como read-only, não editável | Positivo |
| CT-04 | Admin ONG salva sem alterações | Nenhuma alteração feita | Botão "Salvar" desabilitado | Borda |
| CT-05 | Admin ONG informa descrição com 49 chars | Texto com 49 caracteres | Erro de validação exibido | Borda |
| CT-06 | Admin ONG informa capacidade zero | Capacidade = 0 | Erro "número inteiro maior que zero" | Negativo |
| CT-07 | Admin ONG faz upload de foto PNG 4MB | Arquivo PNG, 4MB | Upload aceito, preview exibido | Positivo |
| CT-08 | Admin ONG faz upload de arquivo GIF | Arquivo GIF, 2MB | Erro de formato, arquivo rejeitado | Negativo |
| CT-09 | Admin ONG tenta 6ª foto | 5 fotos existentes | Erro de limite atingido | Borda |
| CT-10 | Admin Sistema edita CNPJ válido e único | CNPJ novo não existente | Dado salvo com sucesso | Positivo |
| CT-11 | Admin Sistema edita CNPJ duplicado | CNPJ já existente | Erro de duplicidade | Negativo |
| CT-12 | Admin ONG clica em Cancelar com alterações | Campos alterados não salvos | Alterações descartadas, estado anterior restaurado | Positivo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O Admin da ONG consegue editar campos permitidos e salvar com validação.
- [ ] CA-02: Os campos Nome e CNPJ são exibidos como somente leitura para o Admin da ONG.
- [ ] CA-03: O Admin do Sistema consegue editar qualquer campo de uma ONG, incluindo Nome e CNPJ.
- [ ] CA-04: Alterações refletem imediatamente sem necessidade de reaprovação.
- [ ] CA-05: Upload de fotos respeita formatos, tamanho e limite de quantidade.

**Regressão:**
- [ ] FEATURE-001 (módulo 004) — validações de campos devem ser consistentes com as do cadastro.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| ONGs com perfil completo (todos os campos preenchidos) | 0% | >50% das ONGs aprovadas com perfil 100% preenchido | Razão de campos opcionais preenchidos / total de campos |
| Chamados de suporte para alteração de dados | N/A | Zero chamados para edição de campos editáveis | Contagem de tickets de suporte relacionados |

---
