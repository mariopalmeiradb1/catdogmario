import { useState } from 'react';
import { Table, Typography, Empty, Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  EditOutlined,
  StopOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useOngList } from '~/hooks/useOngList';
import { OngFilters } from '~/components/ong-management/OngFilters';
import { OngStatusBadge } from '~/components/ong-management/OngStatusBadge';
import { RejectModal } from '~/components/ong-management/RejectModal';
import { DeactivateConfirmModal } from '~/components/ong-management/DeactivateConfirmModal';
import { ongManagementService } from '~/services/ong-management.service';
import type { OngListItem } from '~/types/ong-management.types';

const { Title } = Typography;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function OngListPage() {
  const { ongs, total, loading, error, filters, setFilters, handlePageChange, refetch } = useOngList();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOngId, setRejectModalOngId] = useState<string | null>(null);
  const [deactivateModalOngId, setDeactivateModalOngId] = useState<string | null>(null);

  async function handleAction(ongId: string, action: () => Promise<{ message: string }>) {
    setActionLoading(ongId);
    try {
      const result = await action();
      message.success(result.message);
      refetch();
    } catch {
      message.error('Ocorreu um erro ao executar a ação. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectConfirm(reason?: string) {
    if (!rejectModalOngId) return;
    await handleAction(rejectModalOngId, () => ongManagementService.reject(rejectModalOngId, reason));
    setRejectModalOngId(null);
  }

  async function handleDeactivateConfirm() {
    if (!deactivateModalOngId) return;
    await handleAction(deactivateModalOngId, () => ongManagementService.deactivate(deactivateModalOngId));
    setDeactivateModalOngId(null);
  }

  const columns: ColumnsType<OngListItem> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'CNPJ',
      dataIndex: 'cnpj',
      key: 'cnpj',
    },
    {
      title: 'Cidade/UF',
      key: 'location',
      render: (_, record) => {
        if (record.city && record.state) return `${record.city}/${record.state}`;
        return record.city || record.state || '—';
      },
    },
    {
      title: 'Data Cadastro',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      defaultSortOrder: 'ascend',
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <OngStatusBadge status={status} />,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => {
        const isLoading = actionLoading === record.id;
        return (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            {record.status === 'pending' && (
              <>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  loading={isLoading}
                  onClick={() => handleAction(record.id, () => ongManagementService.markInReview(record.id))}
                >
                  Analisar
                </Button>
                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                  loading={isLoading}
                  onClick={() => handleAction(record.id, () => ongManagementService.approve(record.id))}
                >
                  Aprovar
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={isLoading}
                  onClick={() => setRejectModalOngId(record.id)}
                >
                  Rejeitar
                </Button>
              </>
            )}
            {record.status === 'in_review' && (
              <>
                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                  loading={isLoading}
                  onClick={() => handleAction(record.id, () => ongManagementService.approve(record.id))}
                >
                  Aprovar
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={isLoading}
                  onClick={() => setRejectModalOngId(record.id)}
                >
                  Rejeitar
                </Button>
              </>
            )}
            {record.status === 'approved' && (
              <>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/admin/ongs/${record.id}/edit`)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  loading={isLoading}
                  onClick={() => setDeactivateModalOngId(record.id)}
                >
                  Desativar
                </Button>
              </>
            )}
            {record.status === 'inactive' && (
              <Button
                size="small"
                type="primary"
                icon={<UndoOutlined />}
                loading={isLoading}
                onClick={() => handleAction(record.id, () => ongManagementService.reactivate(record.id))}
              >
                Reativar
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Gerenciar ONGs</Title>

      <OngFilters filters={filters} onFiltersChange={setFilters} />

      {error && <Typography.Text type="danger">{error}</Typography.Text>}

      <Table<OngListItem>
        columns={columns}
        dataSource={ongs}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <Empty description="Não há solicitações de cadastro pendentes no momento." />
          ),
        }}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total,
          onChange: handlePageChange,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
      />

      <RejectModal
        open={!!rejectModalOngId}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModalOngId(null)}
        loading={!!actionLoading}
      />

      <DeactivateConfirmModal
        open={!!deactivateModalOngId}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateModalOngId(null)}
        loading={!!actionLoading}
      />
    </div>
  );
}
