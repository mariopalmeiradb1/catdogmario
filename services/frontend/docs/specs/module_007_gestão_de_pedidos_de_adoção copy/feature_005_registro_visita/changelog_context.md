# Alterações da Feature — RF-005 Registro de Visita Realizada

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
1. CT-08 continha referência ao framework "Zod" no resultado esperado.
2. Campo `observations` nas validações mencionava "sanitizado contra XSS" (terminologia técnica).

**Antes:** CT-08: "Erro 422 (Zod)"; Validações: "sanitizado contra XSS"
**Depois:** CT-08: "Erro 422, mensagem de validação"; Validações: "conteúdo textual puro (sem marcação ou código executável)"

**Por que mudou:**
Itens reprovados na validação de qualidade — especificações não devem conter referências a frameworks ou jargão técnico de segurança.

**Impacto:**

| Área impactada | Descrição do impacto |
|---|---|
| Casos de Teste | CT-08 reformulado sem referência a framework |
| Validações e Restrições | Campo observations reformulado para linguagem de negócio |

**Seções da spec atualizadas:** Casos de Teste, Validações e Restrições

---

> Adicione novas entradas seguindo o mesmo padrão. Nunca edite ou remova entradas anteriores.
