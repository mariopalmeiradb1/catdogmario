# Alterações da Feature — RF-001 Cadastro de ONG (Complemento)

> **Como preencher:** registre aqui toda alteração realizada após a aprovação inicial da spec. Cada entrada deve descrever o que mudou, por que mudou e quem autorizou. Não edite entradas anteriores — apenas adicione novas.
> **Caminho:** `.makuco/specs/module_004_gestão_de_ongs/feature_001_cadastro_ong/changelog_context.md`

---

## Versão atual da spec

**Versão:** v1.0
**Spec original aprovada em:** _A preencher_
**Última alteração:** 2026-05-30

---

## Histórico de Alterações

### ALT-001 — Correção de qualidade na spec (iteração 1)

**Data:** 2026-05-30
**Solicitado por:** Validação automatizada de qualidade
**Realizado por:** Makuco Specify Agent
**Aprovado por:** _A preencher_

**O que mudou:**
Removida menção ao termo técnico "object storage" nas seções Premissas e Dependências.

**Antes:** "A infraestrutura de armazenamento de arquivos (object storage) estará disponível" e "Infraestrutura de object storage" na tabela de dependências.
**Depois:** "A infraestrutura de armazenamento de arquivos estará disponível" e "Infraestrutura de armazenamento de arquivos" na tabela de dependências.

**Por que mudou:**
Item reprovado na validação de qualidade: "No implementation details leak into specification". O termo "object storage" é tecnologia-específica.

**Impacto:**

| Área impactada | Descrição do impacto |
|---|---|
| Premissas | Removido termo técnico "object storage" |
| Dependências | Renomeada dependência para linguagem agnóstica |

**Seções da spec atualizadas:** Premissas, Dependências

---

> Adicione novas entradas acima desta nota, seguindo o modelo ALT-NNN.
