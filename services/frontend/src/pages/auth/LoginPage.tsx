import { Typography } from 'antd';
import { Link, Navigate } from 'react-router-dom';
import { LoginForm } from '~/components/auth/LoginForm';
import { useAuth } from '~/hooks/useAuth';
import { getRoleHome } from '~/routes/role-home';

const { Title, Paragraph } = Typography;

export function LoginPage() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return (
    <>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '4px' }}>
        Bem vindo!
      </Title>
      <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
        Digite os seus dados de acesso no campo abaixo
      </Paragraph>
      <LoginForm />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Link to="/forgot-password">Esqueceu sua senha?</Link>
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span>Não tem uma conta? </span>
        <Link to="/register">Cadastre-se</Link>
      </div>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Link to="/catalog">Ver pets</Link>
      </div>
    </>
  );
}
