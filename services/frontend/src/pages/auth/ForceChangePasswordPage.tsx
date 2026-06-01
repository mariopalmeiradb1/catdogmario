import { Form, Button, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authService } from '~/services/auth.service';
import { passwordRules } from '~/utils/validators';
import { VALIDATION_MESSAGES, VOLUNTEER_MESSAGES } from '~/utils/messages';
import { PasswordInput } from '~/components/ui/PasswordInput';
import { useAuth } from '~/hooks/useAuth';
import { getRoleHome } from '~/routes/role-home';
import type { ApiError } from '~/types/api.types';
import type { AuthContextValue } from '~/contexts/AuthContext';
import type { ChangePasswordInput } from '~/types/volunteer.types';

const { Title, Paragraph } = Typography;

type AuthContextWithPasswordReset = AuthContextValue & {
  setMustChangePassword?: (value: boolean) => void;
};

export function ForceChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth() as AuthContextWithPasswordReset;
  const { user } = auth;

  async function handleSubmit(values: ChangePasswordInput) {
    setLoading(true);
    try {
      await authService.changePassword(values);
      message.success(VOLUNTEER_MESSAGES.CHANGE_PASSWORD_SUCCESS);
      auth.setMustChangePassword?.(false);
      if (user) {
        navigate(getRoleHome(user.role), { replace: true });
      }
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error?.message || 'Erro ao alterar senha.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
        Alteração de Senha Obrigatória
      </Title>
      <Paragraph style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
        Por segurança, você deve alterar sua senha antes de continuar.
      </Paragraph>
      <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          name="current_password"
          label="Senha Atual"
          rules={[{ required: true, message: VALIDATION_MESSAGES.REQUIRED }]}
        >
          <PasswordInput placeholder="Senha atual" size="large" />
        </Form.Item>
        <Form.Item name="new_password" label="Nova Senha" rules={passwordRules}>
          <PasswordInput placeholder="Nova senha" size="large" />
        </Form.Item>
        <Form.Item
          name="new_password_confirmation"
          label="Confirmar Nova Senha"
          dependencies={['new_password']}
          rules={[
            { required: true, message: VALIDATION_MESSAGES.REQUIRED },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(VALIDATION_MESSAGES.PASSWORDS_MISMATCH),
                );
              },
            }),
          ]}
        >
          <PasswordInput placeholder="Confirmar nova senha" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Alterar Senha
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
