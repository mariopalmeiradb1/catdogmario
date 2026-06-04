import { useState, useContext } from 'react';
import { Typography, Table, Tag, Button, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useFollowUpList } from '~/hooks/useFollowUpList';
import { RegisterContactModal } from '~/components/RegisterContactModal';
import { EditContactModal } from '~/components/EditContactModal';
import { AuthContext } from '~/contexts/auth-context';
import type { FollowUpListItem, ReminderStatus } from '~/types/follow-up.types';

const { Title } = Typography;

const STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: 'blue',
  overdue: 'red',
  completed: 'green',
  cancelled: 'default',
};

const STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Pendente',
  overdue: 'Atrasado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function FollowUpListPage() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { data, total, loading, filters, updateFilters, refetch } = useFollowUpList();
  const [selectedReminder, setSelectedReminder] = useState<{
    id: string;
    animal_name: string;
    adopter_name: string;
    adoption_date: string;
  } | null>(null);
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    observation: string;
  } | null>(null);

  const columns = [
    {
      title: 'Animal',
      dataIndex: 'animal_name',
      key: 'animal_name',
    },
    {
      title: 'Tutor',
      dataIndex: 'adopter_name',
      key: 'adopter_name',
    },
    {
      title: 'Marco',
      dataIndex: 'reminder_number',
      key: 'reminder_number',
      render: (num: number) => `${num}º contato`,
    },
    {
      title: 'Data Prevista',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: ReminderStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: unknown, record: FollowUpListItem) => (
        <Space>
          {(record.status === 'pending' || record.status === 'overdue') && (
            <Button
              type="link"
              size="small"
              onClick={() =>
                setSelectedReminder({
                  id: record.id,
                  animal_name: record.animal_name,
                  adopter_name: record.adopter_name,
                  adoption_date: '',
                })
              }
            >
              Registrar Contato
            </Button>
          )}
          {record.status === 'completed' && record.contact_id && auth?.user?.role === 'ong_admin' && (
            <Button
              type="link"
              size="small"
              onClick={() =>
                setSelectedContact({
                  id: record.contact_id!,
                  observation: record.contact_observation || '',
                })
              }
            >
              Editar
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/ong/follow-up/timeline/${record.adoption_request_id}`)}
          >
            Timeline
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Acompanhamento Pós-Adoção
        </Title>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200 }}
          value={filters.status || 'all'}
          onChange={(value) => updateFilters({ status: value === 'all' ? undefined : value })}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendente' },
            { value: 'overdue', label: 'Atrasado' },
            { value: 'completed', label: 'Concluído' },
            { value: 'cancelled', label: 'Cancelado' },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total,
          onChange: (page, pageSize) => updateFilters({ page, limit: pageSize }),
        }}
      />

      <RegisterContactModal
        open={!!selectedReminder}
        reminder={selectedReminder}
        onSuccess={() => {
          setSelectedReminder(null);
          refetch();
        }}
        onCancel={() => setSelectedReminder(null)}
      />

      <EditContactModal
        open={!!selectedContact}
        contact={selectedContact}
        onSuccess={() => {
          setSelectedContact(null);
          refetch();
        }}
        onCancel={() => setSelectedContact(null)}
      />
    </div>
  );
}
