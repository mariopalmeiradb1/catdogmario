# TASK-FULL-003 — Rotina Diária, Cancelamento por Devolução e Redistribuição

**Root**: `catdogmario/services/backend/` e `catdogmario/services/frontend/`
**Branch**: `feature/TASK-FULL-003-daily-routine-cancel-redistribute`
**Spec**: `.makuco/specs/module_009_acompanhamento_pós_adoção/feature_001_calendario_acompanhamento/spec_context.md`
**Part**: 3 of 5 — Automações de lembretes
**Generated**: `2026-06-03`

---

## Context

Completa as automações da FEATURE-001: rotina diária que detecta lembretes vencidos/atrasados e gera notificações, cancelamento automático quando animal é devolvido (status ≠ adopted), e redistribuição de lembretes ao desligar voluntário. Depende dos domínios `follow-up` e `notifications` já implementados (TASK-001 e TASK-002).

---

## Scope

**In:**
- Método `processDailyCheck()` no follow-up.service — marca overdue, gera notificações
- Endpoint `POST /follow-up/routine/daily-check` protegido por role `system_admin`
- Método `cancelRemindersByAnimal()` — cancela pendentes ao devolver animal
- Hook no `animal-management.service` para invocar cancelamento quando status sai de `adopted`
- Método `redistributeByVolunteer()` — redistribui lembretes ao desativar voluntário
- Hook no serviço de gerenciamento de voluntários (ong-management ou equivalente)
- Testes unitários de cada método
- Testes de integração da rotina e dos hooks

**Out:**
- Não implementar scheduler/cron interno (endpoint será chamado por cron externo)
- Não implementar fila de jobs
- Não modificar endpoints de notificações (TASK-001)
- Não modificar a listagem de lembretes (TASK-002)
- Não criar novas páginas no frontend (notificações já aparecem via sino implementado na TASK-001)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `modify` | `services/backend/src/domains/follow-up/follow-up.service.ts` | adicionar 3 métodos |
| `modify` | `services/backend/src/domains/follow-up/follow-up.repository.ts` | queries para automações |
| `modify` | `services/backend/src/domains/follow-up/follow-up.routes.ts` | endpoint rotina diária |
| `modify` | `services/backend/src/domains/follow-up/follow-up.controller.ts` | handler da rotina |
| `modify` | `services/backend/src/domains/follow-up/follow-up.validator.ts` | schema se necessário |
| `modify` | `services/backend/src/domains/animal-management/animal-management.service.ts` | hook cancelamento |
| `modify` | `services/backend/src/domains/ong-management/` (serviço de voluntários) | hook redistribuição |
| `create` | `services/backend/tests/unit/follow-up.daily-routine.spec.ts` | testes rotina |
| `create` | `services/backend/tests/unit/follow-up.cancel-redistribute.spec.ts` | testes automações |
| `create` | `services/backend/tests/integration/follow-up.automations.spec.ts` | testes integração |

---

## Implementation

### `follow-up.repository.ts` *(modify — adicionar métodos)*

**Novos métodos**:
- `findDueReminders(today: string)` — `WHERE status = 'pending' AND due_date <= today` (retorna com joins de animal, adopter, volunteer)
- `updateStatusBatch(ids: string[], newStatus: ReminderStatus, extra?: { cancellation_reason?: string }, trx?)` — UPDATE em lote
- `findPendingByAnimal(animalId, ongId)` — lembretes pending para um animal específico
- `findPendingByVolunteer(volunteerId, ongId)` — lembretes pending atribuídos a um voluntário
- `reassignVolunteer(reminderIds: string[], newVolunteerId: string, trx?)` — UPDATE assigned_volunteer_id
- `findActiveVolunteersForOng(ongId, excludeUserId: string)` — busca voluntários ativos da ONG (query em `users` com role = 'ong_volunteer' e status ativo, excluindo o que está sendo desligado)
- `findOngAdmin(ongId)` — busca admin da ONG (fallback para redistribuição)

### `follow-up.service.ts` *(modify — adicionar métodos)*

**Método `processDailyCheck()`**:
1. Buscar lembretes com `status = 'pending'` e `due_date <= hoje` via `findDueReminders(today)`
2. Separar em dois grupos:
   - `due_date === hoje` → notificação "Acompanhamento pós-adoção pendente"
   - `due_date < hoje` → marcar como `overdue` + notificação "Acompanhamento atrasado"
3. Para lembretes que mudam para `overdue`: `updateStatusBatch(ids, 'overdue')`
4. Gerar notificações via `notificationsService.createBulk()`:
   - Título: `'Acompanhamento pós-adoção pendente — {animal_name} / Tutor: {adopter_name}'` (due) ou `'Acompanhamento atrasado — {animal_name} / Tutor: {adopter_name}'` (overdue)
   - Destinatários: TODOS voluntários ativos + admins da ONG do lembrete
   - `type`: `'follow_up_due'` ou `'follow_up_overdue'`
   - `reference_entity`: `'follow_up_reminder'`, `reference_id`: id do lembrete
5. Lembretes já `overdue` em execuções anteriores: reemitir notificação diariamente (RN-10)
6. Registrar audit log: `follow_up.daily_check_processed` com metadata `{ processed: N, overdue: M }`
7. Retornar `{ processed: number, overdue_marked: number, notifications_sent: number }`

**Método `cancelRemindersByAnimal(animalId: string, ongId: string, userId: string, trx?: Knex.Transaction)`**:
1. Buscar lembretes pendentes/overdue do animal: `findPendingByAnimal(animalId, ongId)`
2. Se nenhum encontrado, retornar silenciosamente
3. `updateStatusBatch(ids, 'cancelled', { cancellation_reason: 'Devolução do animal' }, trx)`
4. Registrar audit log: `follow_up.reminders_cancelled` com metadata `{ animal_id, reason: 'animal_returned', count }`

**Método `redistributeByVolunteer(volunteerId: string, ongId: string, adminUserId: string)`**:
1. Buscar lembretes pendentes/overdue do voluntário: `findPendingByVolunteer(volunteerId, ongId)`
2. Se nenhum encontrado, retornar silenciosamente
3. Buscar voluntários ativos da ONG (excluindo o desligado): `findActiveVolunteersForOng(ongId, volunteerId)`
4. Se nenhum voluntário ativo encontrado: buscar admin via `findOngAdmin(ongId)`
5. Seleção do novo responsável: voluntário com menos lembretes pendentes (round-robin simples)
6. `reassignVolunteer(reminderIds, newVolunteerId, trx)`
7. Gerar notificação para o novo responsável: `'Você recebeu {N} acompanhamentos pendentes transferidos'`
   - `type`: `'reminders_redistributed'`
8. Registrar audit log: `follow_up.reminders_redistributed` com metadata `{ from: volunteerId, to: newVolunteerId, count }`

### `follow-up.routes.ts` *(modify)*

**Adicionar**:
- `POST /routine/daily-check` → authenticate + authorize(['system_admin']) → controller.processDailyCheck

### `follow-up.controller.ts` *(modify)*

**Adicionar** método `processDailyCheck`:
- Chama `followUpService.processDailyCheck()`
- Response: `200` com `{ processed, overdue_marked, notifications_sent }`

### Hook em `animal-management.service.ts` *(modify)*

**Localizar**: método que atualiza status do animal (ex: `updateAnimal` ou `updateStatus`)
**Adicionar condição**: se status anterior era `adopted` e novo status é diferente de `adopted`:
```typescript
import { followUpService } from '~/domains/follow-up/follow-up.service';
// Dentro da condição de mudança de status:
if (previousStatus === 'adopted' && newStatus !== 'adopted') {
  await followUpService.cancelRemindersByAnimal(animalId, ongId, userId, trx);
}
```

### Hook em serviço de voluntários *(modify)*

**Localizar**: método que desativa voluntário (buscar por `deactivate`, `disable`, ou mudança de status do usuário para inativo dentro de ong-management)
**Adicionar**: após desativar o voluntário, chamar:
```typescript
import { followUpService } from '~/domains/follow-up/follow-up.service';
await followUpService.redistributeByVolunteer(volunteerId, ongId, adminUserId);
```

---

## Acceptance Criteria

- [ ] **Given** lembrete com `due_date = hoje` e `status = pending`, **When** `processDailyCheck()` executa, **Then** notificação `follow_up_due` criada para todos voluntários/admins da ONG.
- [ ] **Given** lembrete com `due_date < hoje` e `status = pending`, **When** `processDailyCheck()` executa, **Then** status muda para `overdue` + notificação `follow_up_overdue` criada.
- [ ] **Given** lembrete já `overdue`, **When** `processDailyCheck()` executa novamente no dia seguinte, **Then** nova notificação `follow_up_overdue` reemitida (RN-10).
- [ ] **Given** lembrete com `status = completed`, **When** `processDailyCheck()` executa, **Then** lembrete ignorado, sem notificação.
- [ ] **Given** animal com status `adopted` e 2 lembretes `pending`, **When** animal devolvido (status → outro), **Then** 2 lembretes → `cancelled` com motivo "Devolução do animal".
- [ ] **Given** animal devolvido com lembrete já `completed`, **When** devolução processada, **Then** lembrete `completed` permanece inalterado.
- [ ] **Given** voluntário com 3 lembretes `pending` desligado, **When** desativação processada, **Then** 3 lembretes redistribuídos para voluntário ativo com menos carga.
- [ ] **Given** ONG sem outros voluntários ativos, **When** único voluntário desligado, **Then** lembretes atribuídos ao admin da ONG.
- [ ] **Given** redistribuição realizada, **When** novo responsável acessa notificações, **Then** notificação `reminders_redistributed` presente.
- [ ] **Given** endpoint `POST /follow-up/routine/daily-check`, **When** chamado por `ong_volunteer`, **Then** retorna 403.
- [ ] **Given** endpoint `POST /follow-up/routine/daily-check`, **When** chamado por `system_admin`, **Then** executa e retorna 200 com contadores.

---

## API Notes

- **POST** `/api/v1/follow-up/routine/daily-check` — Auth: `system_admin` only. Response: `200 { processed: number, overdue_marked: number, notifications_sent: number }`. Idempotente (pode ser chamado múltiplas vezes no mesmo dia sem efeitos adversos em lembretes já overdue).

---

## Authorization

- `system_admin` → único role que pode acionar a rotina diária via endpoint.
- Cancelamento e redistribuição são chamados internamente (service-to-service) — não expostos como endpoints públicos.

---

## Dependencies

- **Requires**: TASK-FULL-001 (notifications.service.createBulk), TASK-FULL-002 (domínio follow-up, tabelas, repository base).
- **Blocks**: Nenhum diretamente (TASK-004 e TASK-005 dependem de TASK-002, não desta).
