import { Form, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '~/services/auth.service';
import { passwordRules } from '~/utils/validators';
import { AUTH_MESSAGES, VALIDATION_MESSAGES } from '~/utils/messages';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';
import { PasswordInput } from '~/components/ui/PasswordInput';

interface ResetPasswordFormProps {
  resetToken: string;
}

export function ResetPasswordForm({ resetToken }: ResetPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values: { password: string; password_confirmation: string }) {
    setLoading(true);
    try {
      await authService.resetPassword({
        reset_token: resetToken,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      message.success(AUTH_MESSAGES.RESET_PASSWORD_SUCCESS);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error?.message || 'Erro ao redefinir senha.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
      <Form.Item name="password" rules={passwordRules}>
        <PasswordInput placeholder="Nova senha" size="large" />
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
        <PasswordInput placeholder="Confirmar nova senha" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Redefinir senha
        </Button>
      </Form.Item>
    </Form>
  );
}
