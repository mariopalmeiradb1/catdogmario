import { useState } from 'react';
import { Table, Typography, Button, Space, Badge, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useVolunteerList } from '~/hooks/useVolunteerList';
import { VolunteerFilters } from '~/components/volunteer/VolunteerFilters';
import { volunteerService } from '~/services/volunteer.service';
import { useAuth } from '~/hooks/useAuth';
import type { VolunteerListItem } from '~/types/volunteer.types';
import { VOLUNTEER_MESSAGES } from '~/utils/messages';

const { Title } = Typography;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function maskCpf(cpfLast4: string): string {
  return `***.***.***.${cpfLast4}`;
}

export function VolunteerListPage() {
  const { volunteers, total, loading, filters, setFilters, handlePageChange, refetch } =
    useVolunteerList();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleAction(
    volunteerId: string,
    action: () => Promise<{ message: string }>,
    successMsg: string,
  ) {
    setActionLoading(volunteerId);
    try {
      await action();
      message.success(successMsg);
      refetch();
    } catch {
      message.error('Ocorreu um erro ao executar a ação. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  }

  function confirmDeactivate(volunteer: VolunteerListItem) {
    Modal.confirm({
      title: 'Desativar Voluntário',
      content: VOLUNTEER_MESSAGES.CONFIRM_DEACTIVATE,
      okText: 'Desativar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () =>
        handleAction(
          volunteer.id,
          () => volunteerService.deactivate(volunteer.id),
          VOLUNTEER_MESSAGES.DEACTIVATE_SUCCESS,
        ),
    });
  }

  function confirmReactivate(volunteer: VolunteerListItem) {
    Modal.confirm({
      title: 'Reativar Voluntário',
      content: VOLUNTEER_MESSAGES.CONFIRM_REACTIVATE,
      okText: 'Reativar',
      cancelText: 'Cancelar',
      onOk: () =>
        handleAction(
          volunteer.id,
          () => volunteerService.reactivate(volunteer.id),
          VOLUNTEER_MESSAGES.REACTIVATE_SUCCESS,
        ),
    });
  }

  function confirmRemove(volunteer: VolunteerListItem) {
    Modal.confirm({
      title: 'Remover Voluntário',
      content: VOLUNTEER_MESSAGES.CONFIRM_REMOVE,
      okText: 'Remover',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () =>
        handleAction(
          volunteer.id,
          () => volunteerService.remove(volunteer.id),
          VOLUNTEER_MESSAGES.REMOVE_SUCCESS,
        ),
    });
  }

  const columns: ColumnsType<VolunteerListItem> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Telefone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'CPF',
      dataIndex: 'cpf_last4',
      key: 'cpf_last4',
      render: (cpf_last4: string) => maskCpf(cpf_last4),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) =>
        isActive ? (
          <Badge status="success" text="Ativo" />
        ) : (
          <Badge status="error" text="Inativo" />
        ),
    },
    {
      title: 'Data de Cadastro',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => {
        const isLoading = actionLoading === record.id;
        const isSelf = user?.id === record.id;

        return (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              onClick={() => navigate(`/ong/volunteers/${record.id}/edit`)}
            >
              Editar
            </Button>
            {record.is_active && (
              <Button
                size="small"
                danger
                loading={isLoading}
                onClick={() => confirmDeactivate(record)}
              >
                Desativar
              </Button>
            )}
            {!record.is_active && (
              <Button
                size="small"
                loading={isLoading}
                onClick={() => confirmReactivate(record)}
              >
                Reativar
              </Button>
            )}
            {!isSelf && (
              <Button
                size="small"
                danger
                loading={isLoading}
                onClick={() => confirmRemove(record)}
              >
                Remover
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Voluntários
        </Title>
        <Space>
          <Button onClick={() => navigate('/ong/audit-logs')}>Log de Auditoria</Button>
          <Button type="primary" onClick={() => navigate('/ong/volunteers/create')}>
            Cadastrar Voluntário
          </Button>
        </Space>
      </div>

      <VolunteerFilters filters={filters} onFiltersChange={setFilters} />

      <Table
        dataSource={volunteers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: filters.page,
          pageSize: filters.limit,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `Total: ${t} voluntários`,
        }}
        locale={{ emptyText: 'Nenhum voluntário encontrado.' }}
      />
    </div>
  );
}
