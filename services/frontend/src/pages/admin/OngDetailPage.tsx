import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Descriptions, Button, Space, Spin, Alert, Breadcrumb } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useOngDetail } from '~/hooks/useOngDetail';
import { OngStatusBadge } from '~/components/ong-management/OngStatusBadge';
import { RejectModal } from '~/components/ong-management/RejectModal';
import { DeactivateConfirmModal } from '~/components/ong-management/DeactivateConfirmModal';
import type { OngStatus } from '~/types/ong-management.types';

const { Title } = Typography;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OngDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    ong,
    loading,
    error,
    actionLoading,
    markInReview,
    approve,
    reject,
    deactivate,
    reactivate,
  } = useOngDetail(id!);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !ong) {
    return <Alert type="error" message={error || 'ONG não encontrada.'} showIcon />;
  }

  async function handleRejectConfirm(reason?: string) {
    await reject(reason);
    setRejectModalOpen(false);
  }

  async function handleDeactivateConfirm() {
    await deactivate();
    setDeactivateModalOpen(false);
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/admin/ongs')}>ONGs</a> },
          { title: ong.name },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {ong.name}
        </Title>
        <OngStatusBadge status={ong.status} />
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="CNPJ">{ong.cnpj}</Descriptions.Item>
        <Descriptions.Item label="Telefone">{ong.phone}</Descriptions.Item>
        <Descriptions.Item label="Endereço">{ong.address}</Descriptions.Item>
        <Descriptions.Item label="Cidade">{ong.city || '—'}</Descriptions.Item>
        <Descriptions.Item label="Estado">{ong.state || '—'}</Descriptions.Item>
        <Descriptions.Item label="Capacidade">{ong.capacity} animais</Descriptions.Item>
        <Descriptions.Item label="Descrição" span={2}>
          {ong.description}
        </Descriptions.Item>
        {ong.mission && (
          <Descriptions.Item label="Missão" span={2}>
            {ong.mission}
          </Descriptions.Item>
        )}
        {ong.instagram && (
          <Descriptions.Item label="Instagram">{ong.instagram}</Descriptions.Item>
        )}
        {ong.facebook && (
          <Descriptions.Item label="Facebook">{ong.facebook}</Descriptions.Item>
        )}
        {ong.whatsapp && (
          <Descriptions.Item label="WhatsApp">{ong.whatsapp}</Descriptions.Item>
        )}
        <Descriptions.Item label="Cadastro">{formatDate(ong.created_at)}</Descriptions.Item>
        <Descriptions.Item label="Última atualização">
          {formatDate(ong.updated_at)}
        </Descriptions.Item>
        {ong.rejected_at && (
          <Descriptions.Item label="Rejeitada em">{formatDate(ong.rejected_at)}</Descriptions.Item>
        )}
        {ong.deactivated_at && (
          <Descriptions.Item label="Desativada em">
            {formatDate(ong.deactivated_at)}
          </Descriptions.Item>
        )}
      </Descriptions>

      <ActionButtons
        status={ong.status}
        actionLoading={actionLoading}
        onMarkInReview={markInReview}
        onApprove={approve}
        onReject={() => setRejectModalOpen(true)}
        onDeactivate={() => setDeactivateModalOpen(true)}
        onReactivate={reactivate}
        onEdit={() => navigate(`/admin/ongs/${ong.id}/edit`)}
      />

      <RejectModal
        open={rejectModalOpen}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModalOpen(false)}
        loading={actionLoading}
      />

      <DeactivateConfirmModal
        open={deactivateModalOpen}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateModalOpen(false)}
        loading={actionLoading}
      />
    </div>
  );
}

interface ActionButtonsProps {
  status: OngStatus;
  actionLoading: boolean;
  onMarkInReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onEdit: () => void;
}

function ActionButtons({
  status,
  actionLoading,
  onMarkInReview,
  onApprove,
  onReject,
  onDeactivate,
  onReactivate,
  onEdit,
}: ActionButtonsProps) {
  return (
    <Space wrap>
      {status === 'pending' && (
        <>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={onMarkInReview}
            loading={actionLoading}
          >
            Marcar Em Análise
          </Button>
          <Button
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            icon={<CheckCircleOutlined />}
            onClick={onApprove}
            loading={actionLoading}
          >
            Aprovar
          </Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={onReject} loading={actionLoading}>
            Rejeitar
          </Button>
        </>
      )}

      {status === 'in_review' && (
        <>
          <Button
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            icon={<CheckCircleOutlined />}
            onClick={onApprove}
            loading={actionLoading}
          >
            Aprovar
          </Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={onReject} loading={actionLoading}>
            Rejeitar
          </Button>
        </>
      )}

      {status === 'approved' && (
        <>
          <Button icon={<EditOutlined />} onClick={onEdit}>
            Editar Dados
          </Button>
          <Button
            danger
            icon={<StopOutlined />}
            onClick={onDeactivate}
            loading={actionLoading}
          >
            Desativar ONG
          </Button>
        </>
      )}

      {status === 'inactive' && (
        <Button
          type="primary"
          icon={<UndoOutlined />}
          onClick={onReactivate}
          loading={actionLoading}
        >
          Reativar ONG
        </Button>
      )}
    </Space>
  );
}
