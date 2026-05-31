import { Form, Input, InputNumber, Button, Divider, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '~/services/auth.service';
import { nameRules, emailRules, passwordRules, cnpjRules, phoneRules, descriptionRules, capacityRules, stripMask } from '~/utils/validators';
import { AUTH_MESSAGES, VALIDATION_MESSAGES } from '~/utils/messages';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';

interface RegisterOngFormValues {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  ong_name: string;
  cnpj: string;
  phone: string;
  address: string;
  description: string;
  capacity: number;
}

export function RegisterOngForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values: RegisterOngFormValues) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        cnpj: stripMask(values.cnpj),
        phone: stripMask(values.phone),
      };
      await authService.registerOng(payload);
      message.success(AUTH_MESSAGES.REGISTER_ONG_SUCCESS);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const apiError = error.response?.data?.error;
      if (apiError?.code === 'EMAIL_ALREADY_EXISTS') {
        form.setFields([{ name: 'email', errors: [apiError.message] }]);
      } else if (apiError?.code === 'CNPJ_ALREADY_EXISTS') {
        form.setFields([{ name: 'cnpj', errors: [apiError.message] }]);
      } else {
        message.error(apiError?.message || 'Erro ao cadastrar.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
      <Form.Item name="name" rules={nameRules}>
        <Input placeholder="Nome do responsável" size="large" />
      </Form.Item>
      <Form.Item name="email" rules={emailRules}>
        <Input placeholder="E-mail institucional" size="large" />
      </Form.Item>
      <Form.Item name="password" rules={passwordRules}>
        <Input.Password placeholder="Senha" size="large" />
      </Form.Item>
      <Form.Item
        name="password_confirmation"
        dependencies={['password']}
        rules={[
          { required: true, message: VALIDATION_MESSAGES.REQUIRED },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(VALIDATION_MESSAGES.PASSWORDS_MISMATCH));
            },
          }),
        ]}
      >
        <Input.Password placeholder="Confirmar senha" size="large" />
      </Form.Item>

      <Divider>Dados da ONG</Divider>

      <Form.Item
        name="ong_name"
        rules={[
          { required: true, message: VALIDATION_MESSAGES.REQUIRED },
          { min: 3, message: 'Nome da ONG deve ter no mínimo 3 caracteres.' },
          { max: 150, message: 'Nome da ONG deve ter no máximo 150 caracteres.' },
        ]}
      >
        <Input placeholder="Nome da ONG" size="large" />
      </Form.Item>
      <Form.Item name="cnpj" rules={cnpjRules}>
        <Input placeholder="CNPJ (XX.XXX.XXX/XXXX-XX)" size="large" />
      </Form.Item>
      <Form.Item name="phone" rules={phoneRules}>
        <Input placeholder="Telefone (XX) XXXXX-XXXX" size="large" />
      </Form.Item>
      <Form.Item
        name="address"
        rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
      >
        <Input placeholder="Endereço" size="large" />
      </Form.Item>
      <Form.Item name="description" rules={descriptionRules}>
        <Input.TextArea
          placeholder="Descrição da ONG"
          rows={4}
          maxLength={500}
          showCount
        />
      </Form.Item>
      <Form.Item name="capacity" rules={capacityRules}>
        <InputNumber
          placeholder="Capacidade de animais"
          min={1}
          precision={0}
          style={{ width: '100%' }}
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Cadastrar ONG
        </Button>
      </Form.Item>
    </Form>
  );
}
