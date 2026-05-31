import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Form, Input, InputNumber, Button, Space, Spin, Alert, Breadcrumb, Descriptions, message } from 'antd';
import { ongManagementService } from '~/services/ong-management.service';
import { useOngDetail } from '~/hooks/useOngDetail';
import { OngStatusBadge } from '~/components/ong-management/OngStatusBadge';
import type { UpdateOngData } from '~/types/ong-management.types';

const { Title } = Typography;
const { TextArea } = Input;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OngEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ong, loading, error } = useOngDetail(id!);
  const [form] = Form.useForm<UpdateOngData>();

  useEffect(() => {
    if (ong) {
      form.setFieldsValue({
        name: ong.name,
        cnpj: ong.cnpj,
        phone: ong.phone,
        address: ong.address,
        city: ong.city || undefined,
        state: ong.state || undefined,
        description: ong.description,
        mission: ong.mission || undefined,
        capacity: ong.capacity,
        instagram: ong.instagram || undefined,
        facebook: ong.facebook || undefined,
        whatsapp: ong.whatsapp || undefined,
      });
    }
  }, [ong, form]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !ong) {
    return <Alert type="error" message={error || 'ONG não encontrada.'} showIcon />;
  }

  async function handleFinish(values: UpdateOngData) {
    try {
      await ongManagementService.update(id!, values);
      message.success('Dados atualizados com sucesso.');
      navigate('/admin/ongs');
    } catch (err) {
      if (isConflictError(err)) {
        message.error('Os dados foram alterados por outro administrador. Recarregue a página.');
      } else {
        message.error('Erro ao salvar alterações. Tente novamente.');
      }
    }
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/admin/ongs')}>ONGs</a> },
          { title: ong.name },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {ong.name}
        </Title>
        <OngStatusBadge status={ong.status} />
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Cadastro">{formatDate(ong.created_at)}</Descriptions.Item>
        <Descriptions.Item label="Última atualização">{formatDate(ong.updated_at)}</Descriptions.Item>
        {ong.rejected_at && (
          <Descriptions.Item label="Rejeitada em">{formatDate(ong.rejected_at)}</Descriptions.Item>
        )}
        {ong.deactivated_at && (
          <Descriptions.Item label="Desativada em">{formatDate(ong.deactivated_at)}</Descriptions.Item>
        )}
      </Descriptions>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ maxWidth: 720 }}
      >
        <Form.Item
          name="name"
          label="Nome da ONG"
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 3, message: 'Mínimo 3 caracteres' },
            { max: 150, message: 'Máximo 150 caracteres' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="cnpj"
          label="CNPJ"
          rules={[
            { required: true, message: 'CNPJ é obrigatório' },
            { pattern: /^\d{14}$/, message: 'CNPJ deve ter 14 dígitos' },
          ]}
        >
          <Input maxLength={14} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Telefone"
          rules={[{ required: true, message: 'Telefone é obrigatório' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="address"
          label="Endereço"
          rules={[{ required: true, message: 'Endereço é obrigatório' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="city" label="Cidade">
          <Input />
        </Form.Item>

        <Form.Item
          name="state"
          label="Estado"
          rules={[{ max: 2, message: 'Use a sigla do estado (2 caracteres)' }]}
        >
          <Input maxLength={2} />
        </Form.Item>

        <Form.Item
          name="description"
          label="Descrição"
          rules={[
            { required: true, message: 'Descrição é obrigatória' },
            { min: 50, message: 'Mínimo 50 caracteres' },
            { max: 500, message: 'Máximo 500 caracteres' },
          ]}
        >
          <TextArea rows={4} showCount maxLength={500} />
        </Form.Item>

        <Form.Item
          name="mission"
          label="Missão"
          rules={[
            { min: 50, message: 'Mínimo 50 caracteres' },
            { max: 300, message: 'Máximo 300 caracteres' },
          ]}
        >
          <TextArea rows={3} showCount maxLength={300} />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Capacidade"
          rules={[
            { required: true, message: 'Capacidade é obrigatória' },
            { type: 'number', min: 1, message: 'Capacidade deve ser no mínimo 1' },
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="instagram"
          label="Instagram"
          rules={[
            {
              pattern: /instagram\.com/,
              message: 'URL deve conter instagram.com',
            },
          ]}
        >
          <Input placeholder="https://instagram.com/..." />
        </Form.Item>

        <Form.Item
          name="facebook"
          label="Facebook"
          rules={[
            {
              pattern: /facebook\.com/,
              message: 'URL deve conter facebook.com',
            },
          ]}
        >
          <Input placeholder="https://facebook.com/..." />
        </Form.Item>

        <Form.Item
          name="whatsapp"
          label="WhatsApp"
          rules={[
            {
              pattern: /^\d{10,11}$/,
              message: 'WhatsApp deve ter 10 ou 11 dígitos',
            },
          ]}
        >
          <Input placeholder="11999999999" maxLength={11} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Salvar Alterações
            </Button>
            <Button onClick={() => navigate('/admin/ongs')}>Cancelar</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

function isConflictError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { status?: number } }).response === 'object' &&
    (err as { response: { status: number } }).response.status === 409
  );
}
