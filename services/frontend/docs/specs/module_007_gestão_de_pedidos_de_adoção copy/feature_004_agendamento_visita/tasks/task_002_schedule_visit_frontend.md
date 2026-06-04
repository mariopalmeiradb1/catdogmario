# TASK-FRONTEND-009 — Agendamento de Visita (Frontend)

**Root**: `services/frontend/`
**Branch**: `feature/TASK-FRONTEND-009-schedule-visit-ui`
**Spec**: `.makuco/specs/module_007_gestão_de_pedidos_de_adoção/feature_004_agendamento_visita/spec_context.md`
**Part**: 2 of 2 — Frontend
**Generated**: `2026-06-03`

---

## Context

Adicionar a interface de agendamento de visita na página de detalhe do pedido de adoção (visão ONG). O voluntário/admin visualiza um botão "Agendar Visita" quando o pedido está elegível, abre um modal com DatePicker e campo de observações, e submete para o endpoint `POST /adoption-requests/:id/schedule-visit` criado no TASK-BACKEND-009.

---

## Scope

**In:**
- Modal de agendamento com DatePicker e campo de observações
- Integração com o endpoint backend (service + types)
- Botão "Agendar Visita" na página de detalhe do pedido
- Feedback de sucesso/erro via `message` do Ant Design

**Out:**
- Backend (TASK-BACKEND-009 — já implementado)
- Página de listagem de visitas (feature futura)
- Cancelamento ou reagendamento de visita
- Testes (task separada)
- Registro de visita realizada (FEATURE-005)

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/components/adoption-management/ScheduleVisitModal.tsx` | modal de agendamento |
| `modify` | `src/types/adoption-requests.types.ts` | tipos de visita |
| `modify` | `src/services/adoption-requests.service.ts` | método scheduleVisit |
| `modify` | `src/pages/ong/AdoptionRequestDetailPage.tsx` | integrar botão + modal |

---

## Implementation

### `ScheduleVisitModal.tsx` *(create)*

**Reference pattern**: `src/components/adoption-management/RejectRequestModal.tsx`
**Differences from reference**:
- Props: `{ open: boolean; onClose: () => void; onConfirm: (visitDate: string, notes?: string) => Promise<void>; loading: boolean }`
- Em vez de `Input.TextArea` para reason, usa:
  1. `DatePicker` do Ant Design com `showTime={{ format: 'HH:mm' }}`, `format="DD/MM/YYYY HH:mm"`, `disabledDate` (bloqueia passado, > 30 dias, domingos), `disabledTime` (bloqueia horas fora de 08-17)
  2. `Input.TextArea` para notes (opcional, max 500 chars, placeholder "Observações para o agendamento...")
- Validação de 24h mínimas: no `onChange` do DatePicker, verificar se a data selecionada tem ao menos 24h de antecedência. Se não, exibir helper text vermelho "A data deve ter no mínimo 24h de antecedência." e desabilitar OK
- `okText`: "Agendar Visita"
- `okType`: "primary" (não danger)
- No `handleConfirm`: converter a data para ISO 8601 UTC (`dayjs.utc().toISOString()`) antes de passar ao `onConfirm`
- Modal title: "Agendar Visita"
- Importar `dayjs` (já disponível via Ant Design)
- `disabledDate`: `(current) => current < dayjs().add(24, 'hour') || current > dayjs().add(30, 'day') || current.day() === 0`
- `disabledTime`: retornar `disabledHours: () => [0,1,2,3,4,5,6,7,18,19,20,21,22,23]`

---

### `adoption-requests.types.ts` *(modify)*

**Reference pattern**: interface `AdoptionRequestCreatedResponse` no mesmo arquivo
**Additions**:
```typescript
export interface ScheduleVisitInput {
  visit_date: string;
  notes?: string;
}

export interface ScheduleVisitResponse {
  id: string;
  adoption_request_id: string;
  animal_name: string;
  visit_date: string;
  status: 'scheduled';
  created_at: string;
}
```

---

### `adoption-requests.service.ts` *(modify)*

**Reference pattern**: método `reject` no mesmo arquivo (PATCH com body)
**Addition**:
```typescript
async scheduleVisit(id: string, input: ScheduleVisitInput): Promise<ScheduleVisitResponse> {
  const { data } = await api.post<{ data: ScheduleVisitResponse }>(`/${id}/schedule-visit`, input);
  return data.data;
},
```
- Importar `ScheduleVisitInput` e `ScheduleVisitResponse` dos types

---

### `AdoptionRequestDetailPage.tsx` *(modify)*

**Reference pattern**: integração do `RejectRequestModal` no mesmo arquivo
**Changes**:
- Adicionar state: `const [scheduleModalOpen, setScheduleModalOpen] = useState(false)`
- Adicionar handler `handleScheduleVisit`:
  ```
  async (visitDate: string, notes?: string) => {
    await adoptionRequestsService.scheduleVisit(id!, { visit_date: visitDate, notes });
    message.success('Visita agendada com sucesso!');
    setScheduleModalOpen(false);
    fetchDetail(); // refresh para ver novo status
  }
  ```
  - Wrap em try/catch com `message.error(err.response?.data?.error?.message || 'Erro ao agendar visita.')`
- Adicionar botão "Agendar Visita" no bloco de ações (`showActions`):
  - Condição de exibição: `detail.status === 'pending' || detail.status === 'in_review'`
  - `<Button type="primary" icon={<CalendarOutlined />} onClick={() => setScheduleModalOpen(true)}>Agendar Visita</Button>`
  - Importar `CalendarOutlined` de `@ant-design/icons`
- Renderizar `<ScheduleVisitModal>` após o bloco de ações:
  - `open={scheduleModalOpen}`
  - `onClose={() => setScheduleModalOpen(false)}`
  - `onConfirm={handleScheduleVisit}`
  - `loading={actionLoading}` (reusar state existente)

---

## Acceptance Criteria

- [ ] **Given** pedido com status `pending` ou `in_review`, **When** voluntário abre a página de detalhe, **Then** botão "Agendar Visita" é exibido com ícone de calendário
- [ ] **Given** pedido com status `approved`/`rejected`/`cancelled`/`completed`, **When** voluntário abre a página de detalhe, **Then** botão "Agendar Visita" NÃO aparece no DOM
- [ ] **Given** botão clicado, **When** modal abre, **Then** DatePicker bloqueia datas no passado, domingos e horários fora de 08-17
- [ ] **Given** data válida (+48h, seg-sáb 08-17) selecionada, **When** voluntário confirma, **Then** requisição POST enviada com ISO 8601, modal fecha, success message exibida, página recarrega mostrando status `approved`
- [ ] **Given** backend retorna erro 409 (animal indisponível), **When** resposta chega, **Then** `message.error` exibe a mensagem do backend
- [ ] **Given** backend retorna erro 422 (validação), **When** resposta chega, **Then** `message.error` exibe a mensagem específica do backend
- [ ] **Given** data com menos de 24h de antecedência selecionada no DatePicker, **When** selecionada, **Then** botão OK permanece desabilitado (validação frontend)
- [ ] **Given** campo notes preenchido com > 500 caracteres, **When** digitado, **Then** TextArea impede digitação além do limite (`maxLength`)

---

## API Notes

- **Endpoint**: `POST /adoption-requests/:id/schedule-visit`
- **Input**: `{ visit_date: string (ISO 8601 UTC), notes?: string }`
- **Success**: `201` — `{ data: { id, adoption_request_id, animal_name, visit_date, status, created_at } }`
- **Errors**: `404` — pedido não encontrado; `409` — animal indisponível (message no body); `422` — validação (message no body); `403` — sem permissão

---

## Dependencies

- **Requires**: TASK-BACKEND-009 (endpoint `POST /:id/schedule-visit` funcional)
- **Blocks**: nenhum
