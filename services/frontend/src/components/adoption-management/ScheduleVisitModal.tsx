import { useState } from 'react';
import { Modal, Input, DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

interface ScheduleVisitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (visitDate: string, notes?: string) => Promise<void>;
  loading: boolean;
}

const MAX_NOTES_LENGTH = 500;
const MIN_HOURS_AHEAD = 24;
const MAX_DAYS_AHEAD = 30;

function disabledDate(current: Dayjs): boolean {
  return (
    current.isBefore(dayjs().add(MIN_HOURS_AHEAD, 'hour'), 'day') ||
    current.isAfter(dayjs().add(MAX_DAYS_AHEAD, 'day'), 'day') ||
    current.day() === 0
  );
}

function disabledTime() {
  return {
    disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 18, 19, 20, 21, 22, 23],
  };
}

export function ScheduleVisitModal({ open, onClose, onConfirm, loading }: ScheduleVisitModalProps) {
  const [visitDate, setVisitDate] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState('');

  const isMinHoursValid = visitDate ? visitDate.isAfter(dayjs().add(MIN_HOURS_AHEAD, 'hour')) : false;
  const isValid = visitDate !== null && isMinHoursValid;

  function handleClose() {
    setVisitDate(null);
    setNotes('');
    onClose();
  }

  async function handleConfirm() {
    if (!visitDate) return;
    const isoDate = visitDate.utc().toISOString();
    const trimmedNotes = notes.trim() || undefined;
    await onConfirm(isoDate, trimmedNotes);
    setVisitDate(null);
    setNotes('');
  }

  return (
    <Modal
      title="Agendar Visita"
      open={open}
      onCancel={handleClose}
      okText="Agendar Visita"
      okButtonProps={{ disabled: !isValid, loading }}
      cancelButtonProps={{ disabled: loading }}
      onOk={handleConfirm}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Data e Hora da Visita</label>
        <DatePicker
          showTime={{ format: 'HH:mm' }}
          format="DD/MM/YYYY HH:mm"
          disabledDate={disabledDate}
          disabledTime={disabledTime}
          value={visitDate}
          onChange={(value) => setVisitDate(value)}
          style={{ width: '100%' }}
          placeholder="Selecione a data e hora"
        />
        {visitDate && !isMinHoursValid && (
          <div style={{ marginTop: 4, color: '#ff4d4f', fontSize: 12 }}>
            A data deve ter no mínimo 24h de antecedência.
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Observações (opcional)</label>
        <Input.TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações para o agendamento..."
          maxLength={MAX_NOTES_LENGTH}
          rows={3}
          showCount
        />
      </div>
    </Modal>
  );
}
