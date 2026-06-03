import { Typography, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { AdopterRegistrationForm } from '~/components/adopter-management/AdopterRegistrationForm';
import { useAdopterProfile } from '~/hooks/useAdopterProfile';

const { Title, Paragraph } = Typography;

export function AdopterRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasProfile, isLoading } = useAdopterProfile();

  useEffect(() => {
    if (!isLoading && hasProfile) {
      const redirect = searchParams.get('redirect') || '/catalog';
      navigate(redirect, { replace: true });
    }
  }, [hasProfile, isLoading, navigate, searchParams]);

  function handleSuccess() {
    const redirect = searchParams.get('redirect') || '/catalog';
    navigate(redirect, { replace: true });
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2}>Cadastro de Adotante</Title>
      <Paragraph type="secondary" style={{ marginBottom: 32 }}>
        Para prosseguir com o pedido de adoção, precisamos de algumas informações sobre você.
        Preencha o formulário abaixo com seus dados pessoais.
      </Paragraph>

      <AdopterRegistrationForm onSuccess={handleSuccess} />
    </div>
  );
}
