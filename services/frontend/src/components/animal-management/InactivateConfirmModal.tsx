import { Modal } from 'antd';

interface InactivateConfirmModalProps {
  open: boolean;
  animalName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function InactivateConfirmModal({
  open,
  animalName,
  onConfirm,
  onCancel,
  loading,
}: InactivateConfirmModalProps) {
  return (
    <Modal
      title="Inativar Animal"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Inativar"
      okButtonProps={{ danger: true, loading }}
      cancelText="Cancelar"
      cancelButtonProps={{ disabled: loading }}
    >
      <p>
        Tem certeza que deseja inativar <strong>{animalName}</strong>? O animal não aparecerá
        mais no catálogo público e não poderá ser editado enquanto estiver inativo.
      </p>
    </Modal>
  );
}
