import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Result, Button, Form, Input, message, Spin } from 'antd';
import { authService } from '~/services/auth.service';
import { AUTH_MESSAGES } from '~/utils/messages';
import { AxiosError } from 'axios';
import type { ApiError } from '~/types/api.types';

const { Paragraph } = Typography;

type ConfirmState = 'loading' | 'success' | 'error';

export function ConfirmEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ConfirmState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setState('error');
        setErrorMessage('Token inválido.');
        return;
      }
      try {
        await authService.confirmEmail(token);
        setState('success');
      } catch (err) {
        const error = err as AxiosError<ApiError>;
        const apiError = error.response?.data?.error;
        setErrorMessage(apiError?.message || 'Erro ao confirmar e-mail.');
        if (apiError?.code === 'TOKEN_EXPIRED') {
          setShowResend(true);
        }
        setState('error');
      }
    }
    confirm();
  }, [token]);

  async function handleResend(values: { email: string }) {
    setResending(true);
    try {
      await authService.resendConfirmation(values.email);
      message.success(AUTH_MESSAGES.RESEND_CONFIRMATION_SUCCESS);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      message.error(error.response?.data?.error?.message || 'Erro ao reenviar.');
    } finally {
      setResending(false);
    }
  }

  if (state === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: '16px' }}>Confirmando seu e-mail...</Paragraph>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <Result
        status="success"
        title={AUTH_MESSAGES.CONFIRM_EMAIL_SUCCESS}
        extra={
          <Link to="/login">
            <Button type="primary">Ir para login</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Result
      status="error"
      title="Erro na confirmação"
      subTitle={errorMessage}
      extra={
        <>
          {showResend && (
            <Form layout="inline" onFinish={handleResend} style={{ marginBottom: '16px' }}>
              <Form.Item
                name="email"
                rules={[{ required: true, type: 'email', message: 'E-mail inválido' }]}
              >
                <Input placeholder="Seu e-mail" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={resending}>
                  Reenviar confirmação
                </Button>
              </Form.Item>
            </Form>
          )}
          <Link to="/login">
            <Button>Voltar ao login</Button>
          </Link>
        </>
      }
    />
  );
}
