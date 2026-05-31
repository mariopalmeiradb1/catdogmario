import { useState } from 'react';
import { Modal, Input } from 'antd';

const { TextArea } = Input;

interface RejectModalProps {
  open: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export function RejectModal({ open, onConfirm, onCancel, loading }: RejectModalProps) {
  const [reason, setReason] = useState('');

  function handleConfirm() {
    onConfirm(reason.trim() || undefined);
  }

  function handleCancel() {
    setReason('');
    onCancel();
  }

  function handleAfterClose() {
    setReason('');
  }

  return (
    <Modal
      title="Rejeitar ONG"
      open={open}
      onOk={handleConfirm}
      onCancel={handleCancel}
      afterClose={handleAfterClose}
      okText="Rejeitar ONG"
      okButtonProps={{ danger: true, loading }}
      cancelText="Cancelar"
      cancelButtonProps={{ disabled: loading }}
    >
      <p>Tem certeza que deseja rejeitar esta ONG? Esta ação não pode ser desfeita.</p>
      <TextArea
        placeholder="Motivo da rejeição (opcional, máx. 500 caracteres)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        showCount
        rows={4}
        disabled={loading}
      />
    </Modal>
  );
}
