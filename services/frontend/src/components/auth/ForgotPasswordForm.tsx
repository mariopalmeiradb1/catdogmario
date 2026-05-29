import { Form, Input, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '~/services/auth.service';
import { emailRules } from '~/utils/validators';
import { AUTH_MESSAGES } from '~/utils/messages';

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(values: { email: string }) {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      message.success(AUTH_MESSAGES.FORGOT_PASSWORD_SENT);
      navigate('/verify-code', { state: { email: values.email } });
    } catch {
      message.success(AUTH_MESSAGES.FORGOT_PASSWORD_SENT);
      navigate('/verify-code', { state: { email: values.email } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
      <Form.Item name="email" rules={emailRules}>
        <Input prefix={<MailOutlined />} placeholder="E-mail cadastrado" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Enviar código
        </Button>
      </Form.Item>
    </Form>
  );
}
