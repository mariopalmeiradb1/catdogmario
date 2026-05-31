import { Modal } from 'antd';

interface DeactivateConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function DeactivateConfirmModal({
  open,
  onConfirm,
  onCancel,
  loading,
}: DeactivateConfirmModalProps) {
  return (
    <Modal
      title="Desativar ONG"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Desativar ONG"
      okButtonProps={{ danger: true, loading }}
      cancelText="Cancelar"
      cancelButtonProps={{ disabled: loading }}
    >
      <p>
        Tem certeza que deseja desativar esta ONG? Esta ação bloqueará o acesso de todos os
        usuários vinculados.
      </p>
    </Modal>
  );
}
