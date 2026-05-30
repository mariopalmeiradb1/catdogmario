import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/hooks/useAuth';
import { emailRules } from '~/utils/validators';
import { VALIDATION_MESSAGES } from '~/utils/messages';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';
import { getRoleHome } from '~/routes/role-home';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values: LoginFormValues) {
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error?.message || 'Erro ao fazer login.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    navigate(getRoleHome(user.role), { replace: true });
    return null;
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
      <Form.Item name="email" rules={emailRules}>
        <Input prefix={<MailOutlined />} placeholder="E-mail" size="large" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Senha" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Entrar
        </Button>
      </Form.Item>
    </Form>
  );
}
