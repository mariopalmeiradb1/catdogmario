# Alterações da Feature — RF-004 Agendamento de Visita

> **Como preencher:** registre aqui toda alteração realizada após a aprovação inicial da spec. Cada entrada deve descrever o que mudou, por que mudou e quem autorizou. Não edite entradas anteriores — apenas adicione novas.

---

## Versão atual da spec

**Versão:** _v1.0_
**Spec original aprovada em:** _A preencher_
**Última alteração:** _2026-06-03_

---

## Histórico de Alterações

### ALT-001 — Correção de qualidade na spec (iteração 1)

**Data:** 2026-06-03
**Solicitado por:** Validação automatizada de qualidade
**Realizado por:** Makuco Specify Agent
**Aprovado por:** _A preencher_

**O que mudou:**
RNF-02 continha detalhe de implementação ("SELECT FOR UPDATE no animal dentro da transação").

**Antes:** "Race conditions devem ser tratadas com lock pessimista | SELECT FOR UPDATE no animal dentro da transação"
**Depois:** "Race conditions devem ser tratadas para garantir exclusividade | Apenas uma visita ativa por animal, tentativas concorrentes rejeitadas"

**Por que mudou:**
Item reprovado na validação de qualidade — especificações não devem conter detalhes de implementação.

**Impacto:**

| Área impactada | Descrição do impacto |
|---|---|
| Requisitos Não Funcionais | RNF-02 reformulado para linguagem de resultado |

**Seções da spec atualizadas:** Requisitos Não Funcionais

---

> Adicione novas entradas seguindo o mesmo padrão. Nunca edite ou remova entradas anteriores.
