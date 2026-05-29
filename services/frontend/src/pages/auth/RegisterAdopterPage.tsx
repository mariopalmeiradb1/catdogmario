import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RegisterAdopterForm } from '~/components/auth/RegisterAdopterForm';

const { Title } = Typography;

export function RegisterAdopterPage() {
  return (
    <>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Criar conta
      </Title>
      <RegisterAdopterForm />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span>Já tem uma conta? </span>
        <Link to="/login">Faça login</Link>
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <Link to="/register/ong">Sou uma ONG</Link>
      </div>
    </>
  );
}
