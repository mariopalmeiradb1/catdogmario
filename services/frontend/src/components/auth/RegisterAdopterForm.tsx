import { Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '~/services/auth.service';
import { nameRules, emailRules, passwordRules } from '~/utils/validators';
import { AUTH_MESSAGES, VALIDATION_MESSAGES } from '~/utils/messages';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';

interface RegisterAdopterFormValues {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function RegisterAdopterForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values: RegisterAdopterFormValues) {
    setLoading(true);
    try {
      await authService.registerAdopter(values);
      message.success(AUTH_MESSAGES.REGISTER_ADOPTER_SUCCESS);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const apiError = error.response?.data?.error;
      if (apiError?.code === 'EMAIL_ALREADY_EXISTS') {
        form.setFields([{ name: 'email', errors: [apiError.message] }]);
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
        <Input placeholder="Nome completo" size="large" />
      </Form.Item>
      <Form.Item name="email" rules={emailRules}>
        <Input placeholder="E-mail" size="large" />
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
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Cadastrar
        </Button>
      </Form.Item>
    </Form>
  );
}
