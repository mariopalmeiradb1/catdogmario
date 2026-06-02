# Alterações da Feature — RF-003 Atualização de Status do Animal

> **Como preencher:** registre aqui toda alteração realizada após a aprovação inicial da spec. Cada entrada deve descrever o que mudou, por que mudou e quem autorizou. Não edite entradas anteriores — apenas adicione novas.
> **Caminho:** `02-systems/{sistema}/specs/{modulo}/{feature}/changelog.md`

---

## Versão atual da spec

**Versão:** v1.0
**Spec original aprovada em:** _YYYY-MM-DD por Nome_
**Última alteração:** 2026-06-01

---

## Histórico de Alterações

---

### ALT-001 — Correção de qualidade na spec (iteração 1)

**Data:** 2026-06-01
**Solicitado por:** Validação automatizada de qualidade
**Realizado por:** Makuco Specify Agent
**Aprovado por:** _A preencher_

**O que mudou:**
RNF-04 utilizava jargão técnico ("race conditions") inadequado para especificação de negócio.

**Antes:** "O sistema deve prevenir race conditions em transições | Se dois eventos simultâneos tentam alterar o status, apenas um é aplicado e o outro recebe erro"
**Depois:** "O sistema deve garantir que ações simultâneas sobre o mesmo animal não causem estados inválidos | Se duas ações tentam alterar o status ao mesmo tempo, apenas uma é aplicada e a outra recebe erro informativo"

**Por que mudou:**
Item reprovado na validação de qualidade: "No implementation details leak into specification". O termo "race conditions" é jargão técnico.

**Impacto:**

| Área impactada | Descrição do impacto |
|---|---|
| Requisitos Não Funcionais | RNF-04 reescrito em linguagem de negócio |

**Seções da spec atualizadas:** Requisitos Não Funcionais (RNF-04)

---

> Adicione novas entradas seguindo o mesmo padrão. Nunca edite ou remova entradas anteriores.
