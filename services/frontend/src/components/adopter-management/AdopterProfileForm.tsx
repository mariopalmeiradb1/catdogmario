import { Form, Input, Button, Select, DatePicker, Radio, Row, Col, Space } from 'antd';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import type { AdopterProfile, UpdateAdopterProfileInput } from '~/types/adopter-management.types';

const { TextArea } = Input;

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface AdopterProfileFormProps {
  profile: AdopterProfile;
  editing: boolean;
  loading: boolean;
  onSubmit: (data: UpdateAdopterProfileInput) => void;
  onCancel: () => void;
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function AdopterProfileForm({ profile, editing, loading, onSubmit, onCancel }: AdopterProfileFormProps) {
  const [form] = Form.useForm();
  const hasCurrentAnimals = Form.useWatch('has_current_animals', form);
  const hadAnimalsBefore = Form.useWatch('had_animals_before', form);

  useEffect(() => {
    form.setFieldsValue({
      ...profile,
      birth_date: dayjs(profile.birth_date),
      complement: profile.complement || '',
      current_animals_description: profile.current_animals_description || '',
      previous_animals_description: profile.previous_animals_description || '',
    });
  }, [profile, form]);

  function handleSubmit(values: Record<string, unknown>) {
    const birthDate = (values.birth_date as { format: (f: string) => string }).format('YYYY-MM-DD');

    const payload: UpdateAdopterProfileInput = {
      full_name: values.full_name as string,
      rg: values.rg as string,
      birth_date: birthDate,
      phone: (values.phone as string).replace(/\D/g, ''),
      cep: (values.cep as string).replace(/\D/g, ''),
      street: values.street as string,
      number: values.number as string,
      complement: (values.complement as string) || undefined,
      neighborhood: values.neighborhood as string,
      city: values.city as string,
      state: values.state as string,
      has_current_animals: values.has_current_animals as boolean,
      current_animals_description: (values.current_animals_description as string) || undefined,
      had_animals_before: values.had_animals_before as boolean,
      previous_animals_description: (values.previous_animals_description as string) || undefined,
    };

    onSubmit(payload);
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
      disabled={!editing}
    >
      <Form.Item label="E-mail">
        <Input disabled value={profile.cpf ? `(e-mail vinculado à conta)` : ''} />
      </Form.Item>

      <Form.Item label="CPF">
        <Input disabled value={profile.cpf} style={{ backgroundColor: '#f5f5f5' }} />
      </Form.Item>

      <Form.Item
        name="full_name"
        label="Nome completo"
        rules={[
          { required: true, message: 'Nome completo é obrigatório.' },
          { min: 3, message: 'Nome deve ter pelo menos 3 caracteres.' },
          { max: 150, message: 'Nome deve ter no máximo 150 caracteres.' },
        ]}
      >
        <Input placeholder="Nome completo" size="large" />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="rg"
            label="RG"
            rules={[
              { required: true, message: 'RG é obrigatório.' },
              { min: 5, message: 'RG deve ter pelo menos 5 caracteres.' },
            ]}
          >
            <Input placeholder="RG" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="birth_date"
            label="Data de nascimento"
            rules={[
              { required: true, message: 'Data de nascimento é obrigatória.' },
              {
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const dateStr = value.format('YYYY-MM-DD');
                  if (calculateAge(dateStr) < 18) {
                    return Promise.reject(new Error('É necessário ter 18 anos ou mais.'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/AAAA" size="large" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="phone"
        label="Telefone"
        rules={[
          { required: true, message: 'Telefone é obrigatório.' },
          { min: 10, message: 'Telefone deve ter pelo menos 10 dígitos.' },
        ]}
      >
        <Input placeholder="(99) 99999-9999" size="large" maxLength={15} />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="cep" label="CEP" rules={[{ required: true, message: 'CEP é obrigatório.' }]}>
            <Input placeholder="00000-000" size="large" maxLength={9} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="street" label="Rua" rules={[{ required: true, message: 'Rua é obrigatória.' }]}>
            <Input placeholder="Rua, Avenida..." size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item name="number" label="Número" rules={[{ required: true, message: 'Obrigatório.' }]}>
            <Input placeholder="Nº" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="complement" label="Complemento">
            <Input placeholder="Apto, Bloco..." size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="neighborhood" label="Bairro" rules={[{ required: true, message: 'Obrigatório.' }]}>
            <Input placeholder="Bairro" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="city" label="Cidade" rules={[{ required: true, message: 'Obrigatória.' }]}>
            <Input placeholder="Cidade" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="state" label="Estado" rules={[{ required: true, message: 'Obrigatório.' }]}>
        <Select
          placeholder="Selecione o estado"
          size="large"
          options={BRAZILIAN_STATES.map((uf) => ({ label: uf, value: uf }))}
        />
      </Form.Item>

      <Form.Item name="has_current_animals" label="Possui animais atualmente?">
        <Radio.Group>
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
      </Form.Item>

      {hasCurrentAnimals && (
        <Form.Item name="current_animals_description" label="Quais e quantos animais possui?">
          <TextArea rows={3} placeholder="Descreva os animais que possui" maxLength={500} />
        </Form.Item>
      )}

      <Form.Item name="had_animals_before" label="Já teve animais antes?">
        <Radio.Group>
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
      </Form.Item>

      {hadAnimalsBefore && (
        <Form.Item name="previous_animals_description" label="Quais animais já teve?">
          <TextArea rows={3} placeholder="Descreva os animais que já teve" maxLength={500} />
        </Form.Item>
      )}

      {editing && (
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              Salvar alterações
            </Button>
            <Button size="large" onClick={onCancel}>
              Cancelar
            </Button>
          </Space>
        </Form.Item>
      )}
    </Form>
  );
}
