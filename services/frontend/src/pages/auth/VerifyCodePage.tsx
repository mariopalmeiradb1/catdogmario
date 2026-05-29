import { Typography } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';
import { VerifyCodeForm } from '~/components/auth/VerifyCodeForm';

const { Title, Paragraph } = Typography;

export function VerifyCodePage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '4px' }}>
        Verificar código
      </Title>
      <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
        Digite o código de 6 dígitos enviado para {email}
      </Paragraph>
      <VerifyCodeForm email={email} />
    </>
  );
}
