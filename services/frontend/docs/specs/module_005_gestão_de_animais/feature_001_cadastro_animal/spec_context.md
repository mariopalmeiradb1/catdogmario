# FEATURE-001 — Cadastro de Animal

---

## Grupo 1 — Identificação

**Feature:** FEATURE-001 — Cadastro de Animal
**Módulo:** MODULE-005 — Gestão de Animais
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-06-01
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

Voluntários de ONGs precisam cadastrar animais resgatados de forma estruturada para que fiquem disponíveis no catálogo público. Atualmente, essas informações ficam dispersas em planilhas, redes sociais e anotações manuais, dificultando a visibilidade para adotantes. Esta feature permite que voluntários registrem todas as informações essenciais do animal (dados descritivos, fotos e vídeo) em um único ponto centralizado, garantindo que potenciais tutores possam conhecer os animais remotamente e tomar decisões informadas sem precisar visitar a ONG presencialmente.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário da ONG | Escrita | Pode criar novos cadastros de animais dentro da sua ONG |
| Administrador da ONG | Escrita | Mesmas permissões do voluntário para cadastro |

---

### Premissas

- O usuário está autenticado e vinculado a uma ONG aprovada.
- A infraestrutura de armazenamento de arquivos (fotos e vídeos) está disponível e configurada.
- O catálogo público (MODULE-003) já consome e exibe animais com status "Disponível".
- A lista de raças por espécie é gerenciável pelo Administrador da ONG (pré-configurada com opções padrão + opção "SRD").
- Cada ONG opera de forma isolada (multi-tenant) — o animal pertence exclusivamente à ONG do voluntário que o cadastrou.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| MODULE-002 — Autenticação e Permissões | FEATURE | Resolvida | Sem autenticação, não é possível identificar o voluntário e sua ONG |
| MODULE-004 — Gestão de ONGs (ONG aprovada) | FEATURE | Resolvida | Voluntário só pode cadastrar animais se vinculado a ONG com status "Aprovada" |
| Infraestrutura de armazenamento de mídia | Decisão técnica | Pendente | Upload de fotos e vídeo não pode ser implementado sem storage definido |
| MODULE-003 — Catálogo Público | FEATURE | Resolvida | O animal cadastrado deve aparecer imediatamente no catálogo |

---

### Referências e Insumos

**Artefatos consultados:**
- `overview/glossary_context.md` — definições de Animal/Pet, Voluntário, status "Disponível"
- `product/scope_features_context.md` — descrição macro da feature e módulo

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Cadastrar animal com dados obrigatórios

O voluntário acessa a área de gestão de animais da sua ONG e seleciona "Cadastrar novo animal". O sistema apresenta o formulário de cadastro com campos obrigatórios e opcionais. O voluntário preenche os campos obrigatórios (nome, espécie, raça, sexo, castração, temperamento e idade estimada), opcionalmente preenche os demais campos, e salva. O animal é criado com status "Disponível" e fica imediatamente visível no catálogo público.

**Pode ser testada independentemente:** Sim — basta um voluntário autenticado acessar o formulário, preencher os campos obrigatórios e verificar que o animal aparece na listagem interna e no catálogo público com status "Disponível".

**Cenários de aceite:**

1. **Dado** que estou autenticado como Voluntário de uma ONG aprovada, **quando** preencho todos os campos obrigatórios e salvo, **então** o animal é criado com status "Disponível" e aparece no catálogo público.
2. **Dado** que não preenchi o campo "nome" (obrigatório), **quando** tento salvar, **então** o sistema exibe mensagem de validação indicando o campo faltante e não permite salvar.
3. **Dado** que preenchi apenas os campos obrigatórios sem adicionar fotos, **quando** salvo, **então** o animal é criado normalmente e publicado no catálogo.

---

#### HU-02 — Upload de fotos e vídeo no cadastro

O voluntário, durante o cadastro de um animal, pode anexar até 3 fotos e 1 vídeo curto (até 30 segundos). O sistema valida formato, tamanho e quantidade, exibindo feedback de progresso durante o upload. Após salvar, as mídias ficam associadas ao animal e visíveis no catálogo público.

**Pode ser testada independentemente:** Sim — basta iniciar um cadastro, fazer upload de arquivos válidos e verificar que são exibidos na visualização detalhada do animal.

**Cenários de aceite:**

1. **Dado** que estou no formulário de cadastro, **quando** faço upload de 3 fotos JPEG de até 5MB cada e 1 vídeo MP4 de 25 segundos, **então** os arquivos são aceitos e associados ao animal.
2. **Dado** que já adicionei 3 fotos, **quando** tento adicionar uma 4ª foto, **então** o sistema rejeita com mensagem informando o limite de 3 fotos.
3. **Dado** que tento enviar um vídeo de 45 segundos, **quando** o upload é processado, **então** o sistema rejeita com mensagem informando o limite de 30 segundos.
4. **Dado** que tento enviar uma foto de 8MB, **quando** o upload é processado, **então** o sistema rejeita com mensagem informando o limite de 5MB por foto.
5. **Dado** que tento enviar um arquivo em formato GIF, **quando** o upload é processado, **então** o sistema rejeita com mensagem informando os formatos aceitos (JPEG, PNG).

---

#### HU-03 — Alerta de duplicidade

Ao cadastrar um animal, se já existir outro animal na mesma ONG com a mesma combinação de nome + espécie + raça, o sistema exibe um alerta informativo ao voluntário. O alerta não bloqueia o cadastro — apenas informa para evitar duplicações acidentais.

**Pode ser testada independentemente:** Sim — basta cadastrar dois animais com mesmos nome, espécie e raça e verificar que o alerta aparece no segundo cadastro sem impedir a conclusão.

**Cenários de aceite:**

1. **Dado** que já existe "Rex" (Cachorro, Labrador) cadastrado na minha ONG, **quando** preencho nome "Rex", espécie "Cachorro" e raça "Labrador" em um novo cadastro, **então** o sistema exibe alerta informando que já existe animal com mesmas características.
2. **Dado** que o alerta de duplicidade é exibido, **quando** confirmo que desejo prosseguir, **então** o cadastro é concluído normalmente.
3. **Dado** que "Rex" (Cachorro, Labrador) existe em outra ONG (não na minha), **quando** cadastro "Rex" (Cachorro, Labrador) na minha ONG, **então** nenhum alerta é exibido.

---

### Regras de Negócio

- **RN-01:** Todo animal cadastrado recebe automaticamente o status "Disponível".
- **RN-02:** Um animal pertence a exatamente uma ONG (tenant). Não há compartilhamento entre ONGs.
- **RN-03:** O limite de upload é de no máximo 3 fotos (JPEG ou PNG, até 5MB cada) e 1 vídeo (MP4, resolução mínima 720p, duração máxima de 30 segundos, até 50MB).
- **RN-04:** Nenhuma foto é obrigatória para concluir o cadastro.
- **RN-05:** Se já existir animal com mesma combinação de nome + espécie + raça na mesma ONG, o sistema exibe alerta informativo sem bloquear o cadastro.
- **RN-06:** A lista de raças é segmentada por espécie (gato/cachorro) e inclui a opção "SRD" (Sem Raça Definida). A lista é gerenciável pelo Administrador da ONG.
- **RN-07:** O campo "temperamento" permite seleção múltipla a partir de opções pré-definidas, com possibilidade de informar "outro".

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Ao acessar a funcionalidade de cadastro, o sistema apresenta um formulário com os seguintes campos organizados:

| Campo | Tipo | Obrigatório | Regras |
|---|---|:---:|---|
| Nome | Texto | Sim | Máximo 100 caracteres |
| Espécie | Seleção única | Sim | Gato / Cachorro |
| Raça | Seleção por espécie | Sim | Lista filtrada pela espécie selecionada + opção "SRD" |
| Sexo | Seleção única | Sim | Macho / Fêmea |
| Castração | Seleção única | Sim | Sim / Não / Desconhecido |
| Temperamento | Seleção múltipla | Sim | Opções pré-definidas (dócil, brincalhão, tímido, agressivo com outros animais, independente, carente) + campo "outro" |
| Idade estimada | Seleção única | Sim | Filhote (0–1 ano) / Jovem (1–3 anos) / Adulto (3–7 anos) / Idoso (7+ anos) |
| Peso | Decimal (kg) | Não | 1 casa decimal, valor positivo |
| Altura | Inteiro (cm) | Não | Valor positivo |
| Comprimento | Inteiro (cm) | Não | Valor positivo |
| Necessidades especiais | Texto livre | Não | Máximo 500 caracteres |
| Observações do resgate | Texto livre | Não | Máximo 1000 caracteres |
| Observações gerais | Texto livre | Não | Máximo 1000 caracteres |
| Fotos | Upload de arquivo | Não | Até 3 fotos, JPEG/PNG, máx 5MB cada |
| Vídeo | Upload de arquivo | Não | 1 vídeo, MP4, 720p mín, até 30s, máx 50MB |

#### Ações disponíveis

**Ação 1 — Salvar cadastro**

O voluntário preenche os campos e aciona "Salvar". O sistema valida campos obrigatórios e restrições, processa os uploads de mídia e cria o registro do animal com status "Disponível".

Regras condicionais:
- Se todos os campos obrigatórios estão preenchidos e as validações passam → animal é criado e publicado no catálogo.
- Se há campos obrigatórios não preenchidos → sistema destaca os campos com erro e exibe mensagem.
- Se há duplicidade detectada (nome + espécie + raça) → sistema exibe alerta informativo, voluntário pode prosseguir ou corrigir.

**Ação 2 — Cancelar cadastro**

O voluntário pode cancelar o cadastro a qualquer momento. O sistema descarta os dados preenchidos e retorna à listagem de animais.

Regras condicionais:
- Se há dados preenchidos no formulário → sistema solicita confirmação antes de descartar.
- Se o formulário está vazio → retorna diretamente sem confirmação.

---

#### Validações e Restrições

- Nome é obrigatório e aceita no máximo 100 caracteres.
- Espécie é obrigatória — apenas "Gato" ou "Cachorro".
- Raça é obrigatória — lista filtrada conforme espécie selecionada.
- Sexo é obrigatório — apenas "Macho" ou "Fêmea".
- Castração é obrigatória — "Sim", "Não" ou "Desconhecido".
- Temperamento é obrigatório — ao menos uma opção deve ser selecionada.
- Idade estimada é obrigatória — uma das 4 faixas.
- Peso (se informado) deve ser positivo com no máximo 1 casa decimal.
- Altura e comprimento (se informados) devem ser inteiros positivos.
- Necessidades especiais aceita no máximo 500 caracteres.
- Observações do resgate e observações gerais aceitam no máximo 1000 caracteres cada.
- Fotos: máximo 3 arquivos, formatos JPEG/PNG, até 5MB cada.
- Vídeo: máximo 1 arquivo, formato MP4, resolução mínima 720p, duração máxima 30 segundos, até 50MB.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Campo obrigatório não preenchido | 'Preencha o campo [nome do campo] para continuar.' |
| Limite de fotos excedido | 'O limite é de 3 fotos por animal. Remova uma foto antes de adicionar outra.' |
| Formato de foto inválido | 'Formato não aceito. Envie fotos nos formatos JPEG ou PNG.' |
| Foto acima do tamanho permitido | 'A foto excede o limite de 5MB. Reduza o tamanho e tente novamente.' |
| Vídeo acima da duração | 'O vídeo excede o limite de 30 segundos.' |
| Vídeo acima do tamanho | 'O vídeo excede o limite de 50MB.' |
| Formato de vídeo inválido | 'Formato não aceito. Envie vídeos no formato MP4.' |
| Duplicidade detectada | 'Já existe um animal com o mesmo nome, espécie e raça cadastrado nesta ONG. Deseja prosseguir mesmo assim?' |
| Cadastro concluído com sucesso | 'Animal cadastrado com sucesso! Já está disponível no catálogo.' |
| Cancelamento com dados preenchidos | 'Você tem dados não salvos. Deseja realmente sair e descartar as informações?' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | O formulário de cadastro deve carregar em tempo aceitável | Carregamento completo em menos de 3 segundos |
| RNF-02 | Usabilidade | Upload de mídia deve exibir feedback visual de progresso | Barra de progresso visível durante upload de cada arquivo |
| RNF-03 | Segurança | Isolamento multi-tenant em todas as operações | Nenhum dado de uma ONG é acessível por outra — validação em todas as queries |
| RNF-04 | Disponibilidade | Falha no upload de mídia não deve impedir o salvamento dos dados textuais | Se o upload falhar, dados textuais são salvos e o sistema informa que a mídia pode ser adicionada depois |

---

### O que Não Deve Ser Feito

- Esta feature não realiza edição de animais já cadastrados — isso é escopo da FEATURE-002.
- Esta feature não gerencia o status do animal após o cadastro — isso é escopo da FEATURE-003.
- Esta feature não inclui exclusão/inativação de animais.
- Esta feature não implementa ficha médica, histórico de vacinação ou informações veterinárias.
- Esta feature não envia notificações (e-mail, push) sobre o novo cadastro.
- Esta feature não gerencia a lista de raças — isso é responsabilidade do Administrador da ONG em funcionalidade separada.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Cadastro com todos os campos obrigatórios | Nome, espécie, raça, sexo, castração, temperamento, idade estimada preenchidos | Animal criado com status "Disponível" | Positivo |
| CT-02 | Cadastro sem foto nem vídeo | Apenas campos obrigatórios preenchidos, sem mídia | Animal criado normalmente | Positivo |
| CT-03 | Cadastro com 3 fotos e 1 vídeo | Campos + 3 JPEG válidos + 1 MP4 de 20s | Animal criado com mídias associadas | Positivo |
| CT-04 | Tentativa de upload de 4ª foto | 3 fotos já adicionadas + tentativa de 4ª | Sistema rejeita com mensagem de limite | Negativo |
| CT-05 | Foto com tamanho superior a 5MB | Upload de JPEG de 7MB | Sistema rejeita com mensagem de tamanho | Negativo |
| CT-06 | Vídeo com duração superior a 30s | Upload de MP4 de 45 segundos | Sistema rejeita com mensagem de duração | Negativo |
| CT-07 | Formato de arquivo inválido | Upload de arquivo .GIF como foto | Sistema rejeita com mensagem de formato | Negativo |
| CT-08 | Campo obrigatório faltante | Formulário sem campo "espécie" | Sistema não salva e destaca campo com erro | Negativo |
| CT-09 | Peso com valor negativo | Peso = -2.5 | Sistema rejeita valor negativo | Negativo |
| CT-10 | Alerta de duplicidade | Cadastrar animal com nome+espécie+raça já existentes na ONG | Alerta informativo exibido, cadastro permitido | Borda |
| CT-11 | Duplicidade em ONG diferente | Nome+espécie+raça existem em outra ONG | Nenhum alerta exibido | Borda |
| CT-12 | Isolamento multi-tenant | Voluntário da ONG A cadastra animal | Animal visível apenas para ONG A na listagem interna | Positivo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: O sistema permite cadastrar um animal preenchendo todos os campos obrigatórios sem adicionar fotos.
- [ ] CA-02: O animal cadastrado aparece imediatamente no catálogo público com status "Disponível".
- [ ] CA-03: O sistema aceita upload de até 3 fotos (JPEG/PNG, máx 5MB cada) e 1 vídeo (MP4, até 30s, máx 50MB).
- [ ] CA-04: O sistema rejeita uploads que excedam limites de quantidade, tamanho ou formato com mensagem clara.
- [ ] CA-05: O sistema exibe alerta informativo (sem bloquear) quando detecta duplicidade de nome + espécie + raça na mesma ONG.
- [ ] CA-06: O sistema valida campos obrigatórios e exibe mensagens de erro específicas por campo.
- [ ] CA-07: Voluntários de uma ONG não visualizam nem acessam animais de outra ONG.

**Regressão:**
- [ ] MODULE-003 (Catálogo Público) — novo animal deve aparecer corretamente na listagem e na visualização detalhada.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Animais cadastrados por ONG por mês | 0 (sem sistema) | > 10 por ONG ativa | Contagem de registros criados por mês por tenant |
| Taxa de conclusão do formulário de cadastro | 0 | > 85% dos formulários iniciados são concluídos | Ratio entre formulários iniciados e salvos com sucesso |
| Tempo médio de cadastro | N/A (manual em planilha) | < 5 minutos por animal | Diferença entre início e conclusão do cadastro |

---

## Grupo 5 — Estimativa

> Preencha após o escopo completo estar definido e revisado.

**Use Points gerados:** _Número estimado_
**Estimativa de custo:** _Valor estimado ou faixa_
