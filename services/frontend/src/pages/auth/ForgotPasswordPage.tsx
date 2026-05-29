import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from '~/components/auth/ForgotPasswordForm';

const { Title } = Typography;

export function ForgotPasswordPage() {
  return (
    <>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Recuperar senha
      </Title>
      <ForgotPasswordForm />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Link to="/login">Voltar ao login</Link>
      </div>
    </>
  );
}
