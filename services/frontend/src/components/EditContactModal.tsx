import { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { followUpService } from '~/services/follow-up.service';

const { TextArea } = Input;

interface ContactInfo {
  id: string;
  observation: string;
}

interface EditContactModalProps {
  open: boolean;
  contact: ContactInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditContactModal({ open, contact, onSuccess, onCancel }: EditContactModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contact && open) {
      form.setFieldsValue({ observation: contact.observation });
    }
  }, [contact, open, form]);

  async function handleSubmit() {
    if (!contact) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      await followUpService.editContact(contact.id, { observation: values.observation });

      message.success('Registro atualizado com sucesso');
      form.resetFields();
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      if (axiosError.response?.data?.error?.message) {
        message.error(axiosError.response.data.error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    form.resetFields();
    onCancel();
  }

  return (
    <Modal
      title="Editar Observação do Contato"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Salvar"
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="observation"
          label="Observação"
          rules={[
            { required: true, message: 'A observação é obrigatória.' },
            { min: 10, message: 'A observação deve ter no mínimo 10 caracteres.' },
            { max: 1000, message: 'A observação deve ter no máximo 1000 caracteres.' },
          ]}
        >
          <TextArea
            rows={4}
            maxLength={1000}
            showCount
            placeholder="Descreva o resultado do contato..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
