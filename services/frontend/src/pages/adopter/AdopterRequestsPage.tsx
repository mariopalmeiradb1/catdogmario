import { Typography, Table, Select, Tag, Space, Button, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAdopterRequests } from '~/hooks/useAdopterRequests';
import type { AdopterRequestListItem, AdoptionRequestStatus } from '~/types/adoption-requests.types';

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

const CANCELLABLE_STATUSES: AdoptionRequestStatus[] = ['pending', 'in_review'];

const statusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_review', label: 'Em Análise' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Concluído' },
];

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
};

export function AdopterRequestsPage() {
  const { data, total, loading, filters, updateFilters, cancelRequest } = useAdopterRequests();

  const columns: ColumnsType<AdopterRequestListItem> = [
    {
      title: 'Animal',
      key: 'animal',
      render: (_, record) => (
        <span>
          {record.animal_name} ({SPECIES_LABELS[record.animal_species] || record.animal_species})
        </span>
      ),
    },
    {
      title: 'ONG',
      dataIndex: 'ong_name',
      key: 'ong_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: AdoptionRequestStatus, record) => {
        const tag = <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</Tag>;
        if (value === 'rejected' && record.rejection_reason) {
          return <Tooltip title={record.rejection_reason}>{tag}</Tooltip>;
        }
        return tag;
      },
    },
    {
      title: 'Data do Pedido',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => {
        if (!CANCELLABLE_STATUSES.includes(record.status)) return null;

        return (
          <Popconfirm
            title="Cancelar pedido"
            description="Tem certeza que deseja cancelar este pedido de adoção?"
            onConfirm={() => cancelRequest(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button type="link" danger>
              Cancelar
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Meus Pedidos de Adoção
      </Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          defaultValue=""
          options={statusFilterOptions}
          onChange={(value) =>
            updateFilters({ status: (value || undefined) as AdoptionRequestStatus | undefined })
          }
          style={{ width: 200 }}
        />
      </Space>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total,
          onChange: (page, pageSize) => updateFilters({ page, limit: pageSize }),
          showTotal: (t) => `Total: ${t} pedidos`,
        }}
      />
    </div>
  );
}
