import { useState } from 'react';
import { Modal, Form, DatePicker, Select, Input, message } from 'antd';
import dayjs from 'dayjs';
import { followUpService } from '~/services/follow-up.service';
import type { ContactStatus } from '~/types/follow-up.types';

const { TextArea } = Input;

interface ReminderInfo {
  id: string;
  animal_name: string;
  adopter_name: string;
  adoption_date: string;
}

interface RegisterContactModalProps {
  open: boolean;
  reminder: ReminderInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  { value: 'positive', label: 'Positivo' },
  { value: 'neutral', label: 'Neutro' },
  { value: 'negative', label: 'Negativo' },
  { value: 'no_response', label: 'Sem resposta' },
];

export function RegisterContactModal({ open, reminder, onSuccess, onCancel }: RegisterContactModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reminder) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      await followUpService.registerContact(reminder.id, {
        contact_date: values.contact_date.format('YYYY-MM-DD'),
        status: values.status as ContactStatus,
        observation: values.observation,
      });

      message.success('Contato registrado com sucesso');
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

  const adoptionDate = reminder?.adoption_date ? dayjs(reminder.adoption_date) : undefined;

  return (
    <Modal
      title={`Registrar Contato — ${reminder?.animal_name || ''}`}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Registrar"
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ contact_date: dayjs() }}>
        <Form.Item
          name="contact_date"
          label="Data do contato"
          rules={[{ required: true, message: 'A data do contato é obrigatória.' }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            disabledDate={(current) => {
              if (current.isAfter(dayjs(), 'day')) return true;
              if (adoptionDate && current.isBefore(adoptionDate, 'day')) return true;
              return false;
            }}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status do contato"
          rules={[{ required: true, message: 'O status é obrigatório.' }]}
        >
          <Select options={STATUS_OPTIONS} placeholder="Selecione o status" />
        </Form.Item>

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
