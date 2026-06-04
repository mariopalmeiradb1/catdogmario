import { Typography, Button, Card, Descriptions, Tag, Spin, Alert, Timeline as AntTimeline } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useFollowUpTimeline } from '~/hooks/useFollowUpTimeline';
import type { ReminderStatus, ContactStatus } from '~/types/follow-up.types';

const { Title, Text, Paragraph } = Typography;

const REMINDER_STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: 'blue',
  overdue: 'red',
  completed: 'green',
  cancelled: 'default',
};

const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Pendente',
  overdue: 'Atrasado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const CONTACT_STATUS_COLORS: Record<ContactStatus, string> = {
  positive: 'green',
  neutral: 'blue',
  negative: 'orange',
  no_response: 'red',
};

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  positive: 'Positivo',
  neutral: 'Neutro',
  negative: 'Negativo',
  no_response: 'Sem resposta',
};

function getTimelineColor(reminderStatus: ReminderStatus, contactStatus?: ContactStatus | null): string {
  if (reminderStatus === 'completed') {
    if (contactStatus === 'positive') return 'green';
    if (contactStatus === 'negative') return 'orange';
    if (contactStatus === 'no_response') return 'red';
    return 'green';
  }
  if (reminderStatus === 'pending') return 'blue';
  if (reminderStatus === 'overdue') return 'red';
  return 'gray';
}

function getTimelineIcon(reminderStatus: ReminderStatus) {
  if (reminderStatus === 'completed') return <CheckCircleOutlined />;
  if (reminderStatus === 'pending') return <ClockCircleOutlined />;
  if (reminderStatus === 'overdue') return <ExclamationCircleOutlined />;
  return <CloseCircleOutlined />;
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate + 'T12:00:00');
  const today = new Date();
  const diffMs = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function FollowUpTimelinePage() {
  const { adoptionRequestId } = useParams<{ adoptionRequestId: string }>();
  const navigate = useNavigate();
  const { timeline, loading, error } = useFollowUpTimeline(adoptionRequestId);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Não foi possível carregar a timeline de acompanhamento." showIcon />
        <Button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
        <Title level={3} style={{ margin: 0 }}>
          Timeline de Acompanhamento
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Dados da Adoção</Title>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Animal">{timeline.animal_name}</Descriptions.Item>
          <Descriptions.Item label="Tutor">{timeline.adopter_name}</Descriptions.Item>
          <Descriptions.Item label="E-mail">{timeline.adopter_email}</Descriptions.Item>
          <Descriptions.Item label="Telefone">{timeline.adopter_phone || 'Não informado'}</Descriptions.Item>
          <Descriptions.Item label="Data de Adoção">
            {timeline.adoption_date
              ? new Date(timeline.adoption_date + 'T12:00:00').toLocaleDateString('pt-BR')
              : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {timeline.is_complete && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Acompanhamento Completo"
          description="Todos os marcos de acompanhamento foram concluídos com sucesso."
          style={{ marginBottom: 16 }}
        />
      )}

      {timeline.has_no_response_pattern && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Padrão de não-resposta detectado"
          description="Foram identificados 2 ou mais contatos consecutivos sem resposta do tutor."
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Title level={5}>Marcos de Acompanhamento</Title>
        <AntTimeline
          items={timeline.entries.map((entry) => ({
            color: getTimelineColor(entry.reminder_status, entry.contact?.status),
            dot: getTimelineIcon(entry.reminder_status),
            children: (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>
                    Marco {entry.reminder_number} —{' '}
                    {new Date(entry.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </Text>{' '}
                  <Tag color={REMINDER_STATUS_COLORS[entry.reminder_status]}>
                    {REMINDER_STATUS_LABELS[entry.reminder_status]}
                  </Tag>
                </div>

                {entry.contact ? (
                  <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Data do contato">
                        {new Date(entry.contact.contact_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={CONTACT_STATUS_COLORS[entry.contact.status]}>
                          {CONTACT_STATUS_LABELS[entry.contact.status]}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Observação">
                        <Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ margin: 0 }}>
                          {entry.contact.observation}
                        </Paragraph>
                      </Descriptions.Item>
                      <Descriptions.Item label="Registrado por">
                        {entry.contact.registered_by_name}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ) : (
                  <Text type="secondary">
                    {entry.reminder_status === 'overdue'
                      ? `Atrasado — ${getDaysOverdue(entry.due_date)} dias`
                      : 'Aguardando contato'}
                  </Text>
                )}
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
