# Alterações da Feature — RF-004 Desativação/Inativação de ONG

> **Como preencher:** registre aqui toda alteração realizada após a aprovação inicial da spec. Cada entrada deve descrever o que mudou, por que mudou e quem autorizou. Não edite entradas anteriores — apenas adicione novas.
> **Caminho:** `.makuco/specs/module_004_gestão_de_ongs/feature_004_desativacao_ong/changelog_context.md`

---

## Versão atual da spec

**Versão:** v1.0
**Spec original aprovada em:** _A preencher_
**Última alteração:** 2026-05-31

---

## Histórico de Alterações

### ALT-001 — Correção de qualidade na spec (iteração 1)

**Data:** 2026-05-31
**Solicitado por:** Validação automatizada de qualidade
**Realizado por:** Makuco Specify Agent
**Aprovado por:** _A preencher_

**O que mudou:**
Removidas referências técnicas "ong_id" e "soft-delete" das seções Premissas e O que Não Deve Ser Feito.

**Antes:** "Animais possuem vínculo com a ONG (campo ong_id) e o catálogo público filtra por status da ONG" e "apenas soft-delete via status".
**Depois:** "Animais possuem vínculo com a ONG e o catálogo público exibe apenas animais de ONGs ativas" e "apenas inativação via mudança de status".

**Por que mudou:**
Itens reprovados na validação de qualidade: "No implementation details leak into specification". Os termos "ong_id" e "soft-delete" são detalhes de implementação.

**Impacto:**

| Área impactada | Descrição do impacto |
|---|---|
| Premissas | Removido termo técnico "ong_id" |
| O que Não Deve Ser Feito | Substituído "soft-delete" por linguagem de negócio |

**Seções da spec atualizadas:** Premissas, O que Não Deve Ser Feito

---

> Adicione novas entradas acima desta nota, seguindo o modelo ALT-NNN.
