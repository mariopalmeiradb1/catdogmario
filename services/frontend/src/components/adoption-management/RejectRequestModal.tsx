import { useState } from 'react';
import { Modal, Input } from 'antd';

interface RejectRequestModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading: boolean;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

export function RejectRequestModal({ open, onClose, onConfirm, loading }: RejectRequestModalProps) {
  const [reason, setReason] = useState('');

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length >= MIN_REASON_LENGTH;

  function handleClose() {
    setReason('');
    onClose();
  }

  async function handleConfirm() {
    await onConfirm(trimmedReason);
    setReason('');
  }

  return (
    <Modal
      title="Rejeitar Pedido de Adoção"
      open={open}
      onCancel={handleClose}
      okText="Rejeitar"
      okType="danger"
      okButtonProps={{ disabled: !isValid, loading }}
      cancelButtonProps={{ disabled: loading }}
      onOk={handleConfirm}
      destroyOnHidden
    >
      <Input.TextArea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Informe o motivo da rejeição..."
        maxLength={MAX_REASON_LENGTH}
        rows={4}
        showCount
      />
      <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
        Mínimo de 10 caracteres. O motivo será visível para o adotante.
      </div>
    </Modal>
  );
}
