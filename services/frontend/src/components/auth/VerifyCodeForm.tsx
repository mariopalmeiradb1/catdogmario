import { Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '~/services/auth.service';
import { VALIDATION_MESSAGES } from '~/utils/messages';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';

interface VerifyCodeFormProps {
  email: string;
}

export function VerifyCodeForm({ email }: VerifyCodeFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values: { code: string }) {
    setLoading(true);
    try {
      const { reset_token } = await authService.verifyResetCode(email, values.code);
      navigate('/reset-password', { state: { reset_token } });
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error?.message || 'Código inválido ou expirado.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
      <Form.Item
        name="code"
        rules={[
          { required: true, message: VALIDATION_MESSAGES.REQUIRED },
          { len: 6, message: 'O código deve ter 6 dígitos.' },
        ]}
      >
        <Input placeholder="Código de 6 dígitos" size="large" maxLength={6} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Verificar código
        </Button>
      </Form.Item>
    </Form>
  );
}
