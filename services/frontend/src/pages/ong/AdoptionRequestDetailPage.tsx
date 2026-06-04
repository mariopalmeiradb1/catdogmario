import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Card, Descriptions, Tag, Spin, Alert, message, Popconfirm } from 'antd';
import { CalendarOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { adoptionRequestsService } from '~/services/adoption-requests.service';
import { RejectRequestModal } from '~/components/adoption-management/RejectRequestModal';
import { ScheduleVisitModal } from '~/components/adoption-management/ScheduleVisitModal';
import type { AdoptionRequestDetail, AdoptionRequestStatus } from '~/types/adoption-requests.types';

const { Title } = Typography;

const STATUS_COLORS: Record<AdoptionRequestStatus, string> = {
  pending: 'orange',
  in_review: 'blue',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
  completed: 'purple',
};

const STATUS_LABELS: Record<AdoptionRequestStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
};

export function AdoptionRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdoptionRequestDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await adoptionRequestsService.findById(id);
      setDetail(data);
    } catch {
      message.error('Erro ao carregar detalhes do pedido.');
      navigate('/ong/adoption-requests');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleStartReview() {
    if (!id) return;
    setActionLoading(true);
    try {
      await adoptionRequestsService.startReview(id);
      message.success('Pedido movido para análise.');
      await fetchDetail();
    } catch {
      message.error('Erro ao processar ação. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!id) return;
    setActionLoading(true);
    try {
      await adoptionRequestsService.approve(id);
      message.success('Pedido aprovado.');
      await fetchDetail();
    } catch {
      message.error('Erro ao processar ação. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(reason: string) {
    if (!id) return;
    setActionLoading(true);
    try {
      await adoptionRequestsService.reject(id, reason);
      message.success('Pedido rejeitado.');
      setRejectModalOpen(false);
      await fetchDetail();
    } catch {
      message.error('Erro ao processar ação. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleScheduleVisit(visitDate: string, notes?: string) {
    if (!id) return;
    setActionLoading(true);
    try {
      await adoptionRequestsService.scheduleVisit(id, { visit_date: visitDate, notes });
      message.success('Visita agendada com sucesso!');
      setScheduleModalOpen(false);
      await fetchDetail();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      message.error(axiosError.response?.data?.error?.message || 'Erro ao agendar visita.');
    } finally {
      setActionLoading(false);
    }
  }

  const showActions = detail?.status === 'pending' || detail?.status === 'in_review';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button onClick={() => navigate('/ong/adoption-requests')}>Voltar</Button>
        <Title level={3} style={{ margin: 0 }}>
          Detalhes do Pedido de Adoção
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Informações do Pedido</Title>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Status">
            <Tag color={STATUS_COLORS[detail.status]}>{STATUS_LABELS[detail.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Data do Pedido">
            {new Date(detail.created_at).toLocaleString('pt-BR')}
          </Descriptions.Item>
          <Descriptions.Item label="Última Atualização">
            {new Date(detail.updated_at).toLocaleString('pt-BR')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Animal</Title>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Nome">
            <Button type="link" onClick={() => navigate(`/ong/animals/${detail.animal_id}`)} style={{ padding: 0 }}>
              {detail.animal_name}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Espécie">
            {SPECIES_LABELS[detail.animal_species] || detail.animal_species}
          </Descriptions.Item>
          <Descriptions.Item label="Raça">{detail.animal_breed}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Adotante</Title>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Nome">{detail.adopter_name}</Descriptions.Item>
          <Descriptions.Item label="E-mail">{detail.adopter_email}</Descriptions.Item>
        </Descriptions>
      </Card>

      {detail.rejection_reason && detail.status === 'rejected' && (
        <Alert
          type="error"
          showIcon
          message="Motivo da Rejeição"
          description={detail.rejection_reason}
          style={{ marginBottom: 16 }}
        />
      )}

      {detail.cancelled_by === 'system' && (
        <Alert
          type="info"
          showIcon
          message="Pedido cancelado pelo sistema"
          description="Este pedido foi cancelado automaticamente pelo sistema."
          style={{ marginBottom: 16 }}
        />
      )}

      {detail.cancelled_by === 'adopter' && (
        <Alert
          type="warning"
          showIcon
          message="Cancelado pelo adotante"
          description="Este pedido foi cancelado pelo próprio adotante."
          style={{ marginBottom: 16 }}
        />
      )}

      {detail.status === 'completed' && (
        <Card style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/ong/follow-up/timeline/${detail.id}`)}
          >
            Ver Acompanhamento
          </Button>
        </Card>
      )}

      {showActions && (
        <Card style={{ marginBottom: 16 }}>
          <Title level={5}>Ações</Title>
          <div style={{ display: 'flex', gap: 8 }}>
            {detail.status === 'pending' && (
              <Popconfirm
                title="Deseja iniciar a análise deste pedido?"
                onConfirm={handleStartReview}
                okText="Sim"
                cancelText="Não"
              >
                <Button loading={actionLoading}>Iniciar Análise</Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Deseja aprovar este pedido?"
              onConfirm={handleApprove}
              okText="Sim"
              cancelText="Não"
            >
              <Button type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} loading={actionLoading}>
                Aprovar
              </Button>
            </Popconfirm>
            <Button danger loading={actionLoading} onClick={() => setRejectModalOpen(true)}>
              Rejeitar
            </Button>
            <Button type="primary" icon={<CalendarOutlined />} loading={actionLoading} onClick={() => setScheduleModalOpen(true)}>
              Agendar Visita
            </Button>
          </div>
        </Card>
      )}

      <RejectRequestModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        loading={actionLoading}
      />

      <ScheduleVisitModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleScheduleVisit}
        loading={actionLoading}
      />
    </div>
  );
}
