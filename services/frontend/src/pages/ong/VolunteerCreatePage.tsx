import { Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { VolunteerForm } from '~/components/volunteer/VolunteerForm';

const { Title } = Typography;

export function VolunteerCreatePage() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button onClick={() => navigate('/ong/volunteers')}>Voltar</Button>
        <Title level={3} style={{ margin: 0 }}>
          Cadastrar Voluntário
        </Title>
      </div>
      <VolunteerForm mode="create" onSuccess={() => navigate('/ong/volunteers')} />
    </div>
  );
}
