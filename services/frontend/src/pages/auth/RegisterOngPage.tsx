import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RegisterOngForm } from '~/components/auth/RegisterOngForm';

const { Title } = Typography;

export function RegisterOngPage() {
  return (
    <>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Cadastrar ONG
      </Title>
      <RegisterOngForm />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Link to="/register">Voltar para cadastro pessoal</Link>
      </div>
    </>
  );
}
