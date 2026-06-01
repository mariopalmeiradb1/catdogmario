import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Alert, Spin } from 'antd';
import { volunteerService } from '~/services/volunteer.service';
import { VolunteerForm } from '~/components/volunteer/VolunteerForm';
import type { VolunteerDetail } from '~/types/volunteer.types';

const { Title } = Typography;

export function VolunteerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState<VolunteerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVolunteer() {
      if (!id) return;
      try {
        const data = await volunteerService.getDetail(id);
        setVolunteer(data);
      } catch {
        setError('Voluntário não encontrado ou você não tem permissão para acessá-lo.');
      } finally {
        setLoading(false);
      }
    }
    fetchVolunteer();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !volunteer) {
    return (
      <div>
        <Alert type="error" message={error || 'Voluntário não encontrado.'} showIcon />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/ong/volunteers')}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button onClick={() => navigate('/ong/volunteers')}>Voltar</Button>
        <Title level={3} style={{ margin: 0 }}>
          Editar Voluntário — {volunteer.name}
        </Title>
      </div>
      <VolunteerForm
        mode="edit"
        initialValues={volunteer}
        onSuccess={() => navigate('/ong/volunteers')}
      />
    </div>
  );
}
