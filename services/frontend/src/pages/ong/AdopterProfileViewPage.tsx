import { Typography, Spin, Alert, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdopterProfileById } from '~/hooks/useAdopterProfile';
import { AdopterProfileView } from '~/components/adopter-management/AdopterProfileView';

const { Title } = Typography;

export function AdopterProfileViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isLoading, error } = useAdopterProfileById(id!);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <Alert type="error" message={error || 'Perfil não encontrado.'} showIcon />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
          Voltar
        </Button>
      </div>
      <Title level={2} style={{ marginBottom: 24 }}>Perfil do Adotante</Title>
      <AdopterProfileView profile={profile} />
    </div>
  );
}
