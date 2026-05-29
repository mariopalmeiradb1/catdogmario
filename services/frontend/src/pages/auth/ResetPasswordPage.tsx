import { Typography } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';
import { ResetPasswordForm } from '~/components/auth/ResetPasswordForm';

const { Title } = Typography;

export function ResetPasswordPage() {
  const location = useLocation();
  const resetToken = (location.state as { reset_token?: string })?.reset_token;

  if (!resetToken) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Redefinir senha
      </Title>
      <ResetPasswordForm resetToken={resetToken} />
    </>
  );
}
