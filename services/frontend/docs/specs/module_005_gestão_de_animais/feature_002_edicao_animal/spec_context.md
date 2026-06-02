# FEATURE-002 — Edição de Dados do Animal

---

## Grupo 1 — Identificação

**Feature:** FEATURE-002 — Edição de Dados do Animal
**Módulo:** MODULE-005 — Gestão de Animais
**Status:** Rascunho
**Criado por:** Makuco Specify Agent — 2026-06-01
**Aprovado por:** _A preencher — YYYY-MM-DD_

---

## Objetivo da Feature

Após o cadastro inicial, as informações de um animal mudam com o tempo — peso, comportamento, saúde, novas fotos mais recentes. Voluntários precisam manter o catálogo atualizado para que adotantes vejam dados fidedignos. Esta feature permite a edição completa dos dados de animais (incluindo mídia), garantindo que o catálogo público reflita a realidade atual do animal, aumentando a confiança do adotante e a qualidade da experiência de adoção.

---

## Grupo 2 — Contexto

### Quem Acessa

| Perfil / Permissão | Nível de acesso | Observação |
|---|---|---|
| Voluntário da ONG | Escrita | Pode editar animais com status "Disponível" ou "Em Processo de Adoção" |
| Administrador da ONG | Total | Mesmas permissões do voluntário + pode inativar (soft delete) animais com status "Disponível" ou "Adotado" |

---

### Premissas

- O animal já foi cadastrado via FEATURE-001 e possui um registro no sistema.
- O usuário está autenticado e vinculado à mesma ONG do animal.
- A infraestrutura de armazenamento de mídia está disponível.
- Alterações são imediatamente refletidas no catálogo público.
- O sistema registra log de auditoria para toda edição realizada.

---

### Dependências

| Dependência | Tipo | Status | Impacto se não resolvida |
|---|---|---|---|
| FEATURE-001 (MODULE-005) — Cadastro de Animal | FEATURE | Resolvida | Sem cadastro, não há animal para editar |
| MODULE-002 — Autenticação e Permissões | FEATURE | Resolvida | Necessário para identificar perfil e ONG do usuário |
| Infraestrutura de armazenamento de mídia | Decisão técnica | Pendente | Atualização de fotos/vídeo depende de storage configurado |
| MODULE-002 — Controle de Permissões e Auditoria | FEATURE | Resolvida | Log de auditoria depende da infraestrutura de auditoria existente |

---

### Referências e Insumos

**Artefatos consultados:**
- `overview/glossary_context.md` — definições de status do animal e permissões por perfil
- `product/scope_features_context.md` — descrição da feature de edição e soft delete
- FEATURE-001 spec — estrutura de campos do animal

---

## Grupo 3 — Comportamento

### Histórias de Usuário

---

#### HU-01 — Editar dados textuais de animal disponível

O voluntário acessa a listagem interna de animais, seleciona um animal com status "Disponível" e escolhe "Editar". O sistema apresenta o formulário preenchido com os dados atuais. O voluntário altera os campos desejados e salva. Os dados são atualizados e a alteração é registrada em log de auditoria.

**Pode ser testada independentemente:** Sim — basta editar qualquer campo de um animal "Disponível" e verificar que o dado atualizado aparece no catálogo público e na listagem interna.

**Cenários de aceite:**

1. **Dado** um animal com status "Disponível", **quando** altero o peso de 5.0 para 6.5 kg e salvo, **então** o novo peso é exibido no catálogo público e o log registra a alteração.
2. **Dado** um animal com status "Disponível", **quando** altero o nome para vazio (campo obrigatório), **então** o sistema exibe mensagem de validação e não salva.
3. **Dado** um animal com status "Disponível", **quando** salvo sem alterar nenhum campo, **então** nenhum log de auditoria é gerado.

---

#### HU-02 — Editar animal em processo de adoção

O voluntário pode atualizar informações de um animal que está "Em Processo de Adoção" — por exemplo, atualizar peso antes da entrega ao tutor. Todos os campos são editáveis, seguindo as mesmas regras de validação do cadastro.

**Pode ser testada independentemente:** Sim — basta editar campos de um animal "Em Processo" e verificar que as alterações são salvas e registradas.

**Cenários de aceite:**

1. **Dado** um animal com status "Em Processo de Adoção", **quando** altero observações gerais e salvo, **então** os dados são atualizados e registrados em auditoria.
2. **Dado** um animal com status "Em Processo de Adoção", **quando** tento acessar a opção de exclusão (inativação), **então** a opção não está disponível.

---

#### HU-03 — Visualizar animal adotado (sem edição)

Quando um animal possui status "Adotado", suas informações são exibidas apenas em modo de visualização. A opção de edição não está disponível.

**Pode ser testada independentemente:** Sim — basta acessar um animal "Adotado" e verificar que não há botão de edição disponível.

**Cenários de aceite:**

1. **Dado** um animal com status "Adotado", **quando** acesso seus detalhes, **então** todos os campos são exibidos em modo leitura e não há botão "Editar".
2. **Dado** que sou Administrador da ONG e o animal está "Adotado", **quando** acesso seus detalhes, **então** também não há opção de editar (apenas de reverter status, coberto na FEATURE-003).

---

#### HU-04 — Atualizar mídia (fotos e vídeo)

O voluntário pode adicionar, remover ou substituir fotos e vídeo de um animal durante a edição, respeitando os mesmos limites do cadastro (3 fotos, 1 vídeo).

**Pode ser testada independentemente:** Sim — basta remover uma foto existente e adicionar outra, e verificar que a nova foto aparece no catálogo.

**Cenários de aceite:**

1. **Dado** um animal com 2 fotos, **quando** adiciono mais 1 foto válida, **então** o animal fica com 3 fotos.
2. **Dado** um animal com 3 fotos, **quando** tento adicionar mais 1 sem remover, **então** o sistema rejeita com mensagem de limite.
3. **Dado** um animal com 3 fotos, **quando** removo 1 foto, **então** o animal fica com 2 fotos e a foto removida não aparece mais no catálogo.
4. **Dado** um animal com 1 vídeo, **quando** substituo por outro vídeo válido, **então** o novo vídeo é exibido e o antigo é removido.
5. **Dado** um animal com 0 fotos após a edição, **quando** salvo, **então** o animal é salvo normalmente (0 fotos é permitido).

---

#### HU-05 — Inativar (soft delete) animal

O Administrador da ONG pode inativar um animal, removendo-o do catálogo público e da listagem padrão interna, mas preservando o registro histórico. Apenas animais com status "Disponível" ou "Adotado" podem ser inativados.

**Pode ser testada independentemente:** Sim — basta o Admin inativar um animal "Disponível" e verificar que ele desaparece do catálogo e da listagem padrão, mas aparece no filtro "inativos".

**Cenários de aceite:**

1. **Dado** que sou Administrador da ONG e o animal está "Disponível", **quando** executo a inativação, **então** o animal é removido do catálogo público e da listagem padrão.
2. **Dado** que sou Administrador da ONG e o animal está "Em Processo de Adoção", **quando** tento inativar, **então** a ação é bloqueada com mensagem explicativa.
3. **Dado** que sou Voluntário, **quando** visualizo animais na listagem, **então** não há opção de inativar.
4. **Dado** que sou Administrador e aplico filtro "inativos", **quando** a listagem carrega, **então** vejo os animais previamente inativados.

---

#### HU-06 — Visualizar log de auditoria

O Administrador da ONG pode visualizar o histórico de alterações de um animal: quem editou, quando e quais campos foram alterados.

**Pode ser testada independentemente:** Sim — basta editar um animal, depois acessar o log como Admin e verificar que a edição aparece registrada.

**Cenários de aceite:**

1. **Dado** que sou Administrador da ONG, **quando** acesso o histórico de um animal que foi editado, **então** vejo a lista de alterações com usuário, data/hora e campos alterados.
2. **Dado** que sou Voluntário, **quando** acesso os detalhes de um animal, **então** não vejo opção de visualizar log de auditoria.

---

### Regras de Negócio

- **RN-01:** Animais com status "Disponível" ou "Em Processo de Adoção" podem ser editados por Voluntários e Administradores da ONG.
- **RN-02:** Animais com status "Adotado" não podem ser editados — apenas visualizados.
- **RN-03:** A inativação (soft delete) é permitida apenas para o Administrador da ONG e somente quando o status é "Disponível" ou "Adotado".
- **RN-04:** Não é permitido inativar um animal com status "Em Processo de Adoção".
- **RN-05:** Animal inativado não aparece no catálogo público nem na listagem padrão interna; é acessível apenas via filtro "inativos".
- **RN-06:** Na edição de mídia, o voluntário pode adicionar, remover ou substituir fotos individualmente, respeitando o limite de 3 fotos e 1 vídeo.
- **RN-07:** Após edição, o animal pode ter 0 fotos (não há mínimo obrigatório de mídia).
- **RN-08:** Toda edição gera registro de auditoria contendo: usuário, data/hora e campos alterados. Este log é visível apenas para Administrador da ONG e Administrador do Sistema.
- **RN-09:** Se nenhum campo foi alterado, nenhum registro de auditoria é gerado ao salvar.
- **RN-10:** As validações de campos na edição são idênticas às do cadastro (FEATURE-001).

---

### Requisitos Funcionais

#### O que o sistema exibe ao ser acessado

Ao acessar a edição de um animal, o sistema apresenta o formulário preenchido com todos os dados atuais do animal (mesmos campos do cadastro) e as mídias já associadas. A disponibilidade de ações depende do status:

| Status do animal | Ações disponíveis |
|---|---|
| Disponível | Editar campos, atualizar mídia, inativar (apenas Admin) |
| Em Processo de Adoção | Editar campos, atualizar mídia |
| Adotado | Apenas visualizar (nenhuma ação de edição) |
| Inativo | Apenas visualizar via filtro "inativos" |

#### Ações disponíveis

**Ação 1 — Salvar alterações**

O voluntário edita campos e/ou mídia e aciona "Salvar". O sistema valida as alterações com as mesmas regras do cadastro e persiste os dados atualizados. Se houve mudança, um registro de auditoria é criado.

Regras condicionais:
- Se todos os campos editados passam nas validações → dados atualizados e log gerado.
- Se há campos obrigatórios apagados → sistema exibe mensagem de erro e não salva.
- Se nenhum campo foi alterado → sistema salva sem gerar log de auditoria.

**Ação 2 — Inativar animal (apenas Admin da ONG)**

O Administrador da ONG seleciona "Inativar" em um animal. O sistema solicita confirmação antes de executar.

Regras condicionais:
- Se status = "Disponível" ou "Adotado" → confirmação exibida; se confirmado, animal é inativado.
- Se status = "Em Processo de Adoção" → ação bloqueada com mensagem explicativa.
- Se perfil = Voluntário → botão de inativação não é exibido.

---

#### Validações e Restrições

- Todas as validações de campos são idênticas às definidas na FEATURE-001.
- A opção de edição não é exibida para animais com status "Adotado".
- A opção de inativação não é exibida para Voluntários.
- A opção de inativação é bloqueada para animais com status "Em Processo de Adoção".
- Limite de mídia: máximo 3 fotos e 1 vídeo, com mesmas restrições de formato e tamanho da FEATURE-001.

---

#### Mensagens ao Usuário

| Condição | Mensagem |
|---|---|
| Edição salva com sucesso | 'Dados do animal atualizados com sucesso.' |
| Tentativa de editar animal adotado | Não aplicável — opção de edição não é exibida |
| Tentativa de inativar animal em processo | 'Não é possível inativar um animal que está em processo de adoção. Aguarde a conclusão ou cancelamento do processo.' |
| Confirmação de inativação | 'Deseja realmente inativar este animal? Ele será removido do catálogo público.' |
| Inativação concluída | 'Animal inativado com sucesso. O registro foi preservado no histórico.' |
| Campo obrigatório apagado | 'Preencha o campo [nome do campo] para continuar.' |

---

### Requisitos Não Funcionais

| ID | Tipo | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Desempenho | A edição deve carregar os dados atuais do animal rapidamente | Formulário preenchido em menos de 3 segundos |
| RNF-02 | Rastreabilidade | Toda edição deve gerar log de auditoria | 100% das alterações são registradas com usuário, data e campos |
| RNF-03 | Segurança | Isolamento multi-tenant em todas as operações | Nenhum voluntário pode editar animal de outra ONG |
| RNF-04 | Integridade | Edições concorrentes não devem corromper dados | Se dois voluntários editam o mesmo animal, o segundo recebe alerta de conflito |

---

### O que Não Deve Ser Feito

- Esta feature não altera o status do animal entre "Disponível", "Em Processo" e "Adotado" — isso é escopo da FEATURE-003.
- Esta feature não permite reativação de animais inativados (escopo futuro).
- Esta feature não realiza exclusão física de registros — apenas inativação (soft delete).
- Esta feature não implementa ficha médica ou histórico de vacinação.
- Esta feature não gerencia a lista de raças disponíveis.

---

## Grupo 4 — Validação

### Casos de Teste

| ID | Cenário | Entrada | Resultado esperado | Tipo |
|---|---|---|---|---|
| CT-01 | Editar campo de animal disponível | Alterar peso de 5.0 para 6.5 | Peso atualizado, log gerado | Positivo |
| CT-02 | Editar animal em processo | Alterar observações gerais | Dados atualizados, log gerado | Positivo |
| CT-03 | Tentar editar animal adotado | Acessar detalhes de animal "Adotado" | Opção de edição indisponível | Negativo |
| CT-04 | Adicionar foto respeitando limite | Animal com 2 fotos + adicionar 1 | Aceito, animal fica com 3 fotos | Positivo |
| CT-05 | Exceder limite de fotos | Animal com 3 fotos + adicionar 1 | Rejeitado com mensagem | Negativo |
| CT-06 | Remover todas as fotos | Animal com 2 fotos, remover ambas | Aceito, animal fica com 0 fotos | Borda |
| CT-07 | Inativar animal disponível (Admin) | Admin inativa animal "Disponível" | Animal inativado, removido do catálogo | Positivo |
| CT-08 | Tentar inativar animal em processo (Admin) | Admin tenta inativar animal "Em Processo" | Ação bloqueada com mensagem | Negativo |
| CT-09 | Voluntário tenta inativar | Voluntário visualiza animal | Opção de inativação não visível | Negativo |
| CT-10 | Salvar sem alterações | Abrir edição e salvar sem mudar nada | Salvo sem log de auditoria | Borda |
| CT-11 | Visualizar log de auditoria (Admin) | Admin acessa histórico | Lista de alterações exibida | Positivo |
| CT-12 | Voluntário tenta ver auditoria | Voluntário acessa detalhes | Opção de auditoria não visível | Negativo |
| CT-13 | Isolamento multi-tenant | Voluntário tenta acessar animal de outra ONG | Acesso negado | Negativo |

---

### Critérios de Aceite

**Comportamento e entrega:**
- [ ] CA-01: Voluntários podem editar todos os campos de animais com status "Disponível" ou "Em Processo de Adoção".
- [ ] CA-02: Animais com status "Adotado" são exibidos apenas em modo leitura, sem opção de edição.
- [ ] CA-03: O sistema registra log de auditoria para toda edição com usuário, data/hora e campos alterados.
- [ ] CA-04: Apenas o Administrador da ONG pode inativar animais, e apenas quando o status é "Disponível" ou "Adotado".
- [ ] CA-05: Animais inativados não aparecem no catálogo público nem na listagem padrão.
- [ ] CA-06: O Administrador da ONG pode visualizar o log de auditoria; Voluntários não.
- [ ] CA-07: Edição de mídia respeita limites de 3 fotos e 1 vídeo com mesmas validações do cadastro.

**Regressão:**
- [ ] MODULE-003 (Catálogo Público) — alterações em dados/mídia devem refletir imediatamente no catálogo.
- [ ] FEATURE-001 (Cadastro de Animal) — validações de campos devem ser consistentes entre cadastro e edição.

**Qualidade de código (SonarQube):**
- [ ] Quality Gate aprovado sem bloqueadores
- [ ] Cobertura de testes: mínimo de 80% nas classes alteradas
- [ ] Zero issues de segurança (Severity: Blocker ou Critical)

---

### Critério de Sucesso da Feature

| Métrica | Baseline atual | Meta após entrega | Como será medida |
|---|---|---|---|
| Percentual de animais com dados atualizados no último mês | 0 | > 60% dos animais ativos têm ao menos 1 edição/mês | Contagem de edições por animal por mês |
| Tempo entre mudança real e atualização no sistema | N/A (sem controle) | < 24 horas | Diferença entre data de edição e data do evento registrado em observações |

---

## Grupo 5 — Estimativa

> Preencha após o escopo completo estar definido e revisado.

**Use Points gerados:** _Número estimado_
**Estimativa de custo:** _Valor estimado ou faixa_
