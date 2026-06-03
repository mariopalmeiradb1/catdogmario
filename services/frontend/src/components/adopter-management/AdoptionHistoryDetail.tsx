import { Descriptions, Tag, Button, Avatar, Typography, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdoptionHistoryDetail } from '~/hooks/useAdoptionHistory';
import type { AdoptionRequestStatus } from '~/types/adoption-requests.types';

const { Title } = Typography;

const STATUS_COLORS: Record<AdoptionRequestStatus, string> = {
  pending: 'orange',
  in_review: 'blue',
  approved: 'geekblue',
  rejected: 'red',
  cancelled: 'default',
  completed: 'green',
};

const STATUS_LABELS: Record<AdoptionRequestStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em Análise',
  approved: 'Em andamento',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
};

export function AdoptionHistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useAdoptionHistoryDetail(id);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  if (error || !detail) {
    return (
      <Result
        status="404"
        title="Pedido não encontrado"
        subTitle="Não foi possível encontrar este pedido de adoção."
        extra={
          <Button onClick={() => navigate('/adopter/history')}>
            Voltar ao histórico
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/adopter/history')}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Voltar ao histórico
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar
          src={detail.animal_photo_url}
          shape="square"
          size={64}
        >
          {detail.animal_name.charAt(0)}
        </Avatar>
        <div>
          <Title level={4} style={{ margin: 0 }}>{detail.animal_name}</Title>
          <Tag color={STATUS_COLORS[detail.status]}>{STATUS_LABELS[detail.status]}</Tag>
        </div>
      </div>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Espécie">
          {SPECIES_LABELS[detail.animal_species] || detail.animal_species}
        </Descriptions.Item>
        {detail.animal_breed && (
          <Descriptions.Item label="Raça">{detail.animal_breed}</Descriptions.Item>
        )}
        <Descriptions.Item label="ONG">{detail.ong_name}</Descriptions.Item>
        <Descriptions.Item label="Data do pedido">
          {new Date(detail.created_at).toLocaleDateString('pt-BR')}
        </Descriptions.Item>
        <Descriptions.Item label="Última atualização">
          {new Date(detail.updated_at).toLocaleDateString('pt-BR')}
        </Descriptions.Item>
        {detail.status === 'completed' && detail.completed_at && (
          <Descriptions.Item label="Data de conclusão">
            {new Date(detail.completed_at).toLocaleDateString('pt-BR')}
          </Descriptions.Item>
        )}
        {detail.status === 'rejected' && detail.rejection_reason && (
          <Descriptions.Item label="Motivo da rejeição">
            {detail.rejection_reason}
          </Descriptions.Item>
        )}
        {detail.status === 'cancelled' && detail.cancellation_reason && (
          <Descriptions.Item label="Motivo do cancelamento">
            {detail.cancellation_reason}
          </Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
}
