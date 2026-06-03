import { Form, Input, Button, Select, DatePicker, Radio, message, Row, Col } from 'antd';
import { useState } from 'react';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';
import type { CreateAdopterProfileInput } from '~/types/adopter-management.types';
import { useAuth } from '~/hooks/useAuth';

const { TextArea } = Input;

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface AdopterRegistrationFormProps {
  onSuccess: () => void;
}

function validateCpfAlgorithm(cpf: string): boolean {
  const sanitized = cpf.replace(/\D/g, '');
  if (sanitized.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(sanitized)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(sanitized.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(sanitized.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(sanitized.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(sanitized.charAt(10))) return false;

  return true;
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

export function AdopterRegistrationForm({ onSuccess }: AdopterRegistrationFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const hasCurrentAnimals = Form.useWatch('has_current_animals', form);
  const hadAnimalsBefore = Form.useWatch('had_animals_before', form);

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    try {
      const { adopterManagementService } = await import('~/services/adopter-management.service');

      const birthDate = (values.birth_date as { format: (f: string) => string }).format('YYYY-MM-DD');

      const payload: CreateAdopterProfileInput = {
        full_name: values.full_name as string,
        cpf: (values.cpf as string).replace(/\D/g, ''),
        rg: values.rg as string,
        birth_date: birthDate,
        phone: (values.phone as string).replace(/\D/g, ''),
        cep: (values.cep as string).replace(/\D/g, ''),
        street: values.street as string,
        number: values.number as string,
        complement: values.complement as string | undefined,
        neighborhood: values.neighborhood as string,
        city: values.city as string,
        state: values.state as string,
        has_current_animals: values.has_current_animals as boolean,
        current_animals_description: values.current_animals_description as string | undefined,
        had_animals_before: values.had_animals_before as boolean,
        previous_animals_description: values.previous_animals_description as string | undefined,
      };

      await adopterManagementService.createProfile(payload);
      message.success('Perfil de adotante cadastrado com sucesso!');
      onSuccess();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const apiError = error.response?.data?.error;

      if (apiError?.code === 'CPF_ALREADY_REGISTERED') {
        form.setFields([{ name: 'cpf', errors: [apiError.message] }]);
      } else if (apiError?.code === 'INVALID_CPF') {
        form.setFields([{ name: 'cpf', errors: [apiError.message] }]);
      } else if (apiError?.code === 'UNDERAGE_ADOPTER') {
        form.setFields([{ name: 'birth_date', errors: [apiError.message] }]);
      } else if (apiError?.code === 'ADOPTER_PROFILE_ALREADY_EXISTS') {
        message.error(apiError.message);
      } else {
        message.error(apiError?.message || 'Erro ao cadastrar perfil.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
      initialValues={{
        has_current_animals: false,
        had_animals_before: false,
      }}
    >
      <Form.Item label="E-mail">
        <Input value={user?.email} disabled size="large" />
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
            name="cpf"
            label="CPF"
            rules={[
              { required: true, message: 'CPF é obrigatório.' },
              {
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const sanitized = value.replace(/\D/g, '');
                  if (sanitized.length !== 11) {
                    return Promise.reject(new Error('CPF deve ter 11 dígitos.'));
                  }
                  if (!validateCpfAlgorithm(sanitized)) {
                    return Promise.reject(new Error('CPF inválido.'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="000.000.000-00" size="large" maxLength={14} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="rg"
            label="RG"
            rules={[
              { required: true, message: 'RG é obrigatório.' },
              { min: 5, message: 'RG deve ter pelo menos 5 caracteres.' },
              { max: 20, message: 'RG deve ter no máximo 20 caracteres.' },
            ]}
          >
            <Input placeholder="RG" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
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
                    return Promise.reject(new Error('É necessário ter 18 anos ou mais para adotar.'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="DD/MM/AAAA"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
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
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name="cep"
            label="CEP"
            rules={[
              { required: true, message: 'CEP é obrigatório.' },
            ]}
          >
            <Input placeholder="00000-000" size="large" maxLength={9} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="street"
            label="Rua"
            rules={[
              { required: true, message: 'Rua é obrigatória.' },
              { min: 3, message: 'Rua deve ter pelo menos 3 caracteres.' },
            ]}
          >
            <Input placeholder="Rua, Avenida..." size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item
            name="number"
            label="Número"
            rules={[{ required: true, message: 'Número é obrigatório.' }]}
          >
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
          <Form.Item
            name="neighborhood"
            label="Bairro"
            rules={[{ required: true, message: 'Bairro é obrigatório.' }]}
          >
            <Input placeholder="Bairro" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="city"
            label="Cidade"
            rules={[{ required: true, message: 'Cidade é obrigatória.' }]}
          >
            <Input placeholder="Cidade" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="state"
        label="Estado"
        rules={[{ required: true, message: 'Estado é obrigatório.' }]}
      >
        <Select
          placeholder="Selecione o estado"
          size="large"
          options={BRAZILIAN_STATES.map((uf) => ({ label: uf, value: uf }))}
        />
      </Form.Item>

      <Form.Item
        name="has_current_animals"
        label="Possui animais atualmente?"
        rules={[{ required: true, message: 'Este campo é obrigatório.' }]}
      >
        <Radio.Group>
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
      </Form.Item>

      {hasCurrentAnimals && (
        <Form.Item
          name="current_animals_description"
          label="Quais e quantos animais possui?"
          rules={[{ max: 500, message: 'Máximo 500 caracteres.' }]}
        >
          <TextArea rows={3} placeholder="Descreva os animais que possui atualmente" maxLength={500} />
        </Form.Item>
      )}

      <Form.Item
        name="had_animals_before"
        label="Já teve animais antes?"
        rules={[{ required: true, message: 'Este campo é obrigatório.' }]}
      >
        <Radio.Group>
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
      </Form.Item>

      {hadAnimalsBefore && (
        <Form.Item
          name="previous_animals_description"
          label="Quais animais já teve?"
          rules={[{ max: 500, message: 'Máximo 500 caracteres.' }]}
        >
          <TextArea rows={3} placeholder="Descreva os animais que já teve" maxLength={500} />
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Cadastrar e continuar
        </Button>
      </Form.Item>
    </Form>
  );
}
