import { Typography, Form, Input, InputNumber, Button, Space, Spin, Tooltip, Select } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useOngEdit } from '~/hooks/useOngEdit';
import type { UpdateOngInput } from '~/types/ong-management.types';

const { Title } = Typography;
const { TextArea } = Input;

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ label: uf, value: uf }));

const READONLY_TOOLTIP = 'Este campo não pode ser alterado. Em caso de erro, entre em contato com o suporte.';

export function OngProfilePage() {
  const { form, ong, loading, submitting, isDirty, submit, resetForm, handleValuesChange } = useOngEdit();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ong) {
    return null;
  }

  function handleFinish(values: UpdateOngInput) {
    submit(values);
  }

  return (
    <div>
      <Title level={2}>Perfil da ONG</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        style={{ maxWidth: 720 }}
      >
        <Form.Item label={<ReadOnlyLabel text="Nome da ONG" />}>
          <Input value={ong.name} disabled />
        </Form.Item>

        <Form.Item label={<ReadOnlyLabel text="CNPJ" />}>
          <Input value={ong.cnpj} disabled />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Telefone"
          rules={[{ required: true, message: 'Telefone é obrigatório' }]}
        >
          <Input maxLength={11} />
        </Form.Item>

        <Form.Item
          name="address"
          label="Endereço"
          rules={[{ required: true, message: 'Endereço é obrigatório' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="city" label="Cidade">
          <Input maxLength={100} />
        </Form.Item>

        <Form.Item name="state" label="Estado">
          <Select options={UF_OPTIONS} allowClear placeholder="Selecione o estado" />
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
              validator: (_, value) => {
                if (!value || value.includes('instagram.com')) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Informe uma URL válida para Instagram'));
              },
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
              validator: (_, value) => {
                if (!value || value.includes('facebook.com')) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Informe uma URL válida para Facebook'));
              },
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
              validator: (_, value) => {
                if (!value || /^\d{10,11}$/.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('WhatsApp deve ter 10 ou 11 dígitos'));
              },
            },
          ]}
        >
          <Input placeholder="11999999999" maxLength={11} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" disabled={!isDirty} loading={submitting}>
              Salvar Alterações
            </Button>
            <Button onClick={resetForm} disabled={!isDirty}>
              Cancelar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

function ReadOnlyLabel({ text }: { text: string }) {
  return (
    <span>
      {text}{' '}
      <Tooltip title={READONLY_TOOLTIP}>
        <InfoCircleOutlined style={{ color: '#999' }} />
      </Tooltip>
    </span>
  );
}
