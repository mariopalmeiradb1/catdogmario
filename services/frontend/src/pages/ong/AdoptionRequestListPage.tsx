import { useEffect } from 'react';
import { Typography, Table, Select, Tag, Space, Button, Alert } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useVolunteerRequests } from '~/hooks/useVolunteerRequests';
import type { VolunteerRequestListItem, AdoptionRequestStatus } from '~/types/adoption-requests.types';

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

const statusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_review', label: 'Em Análise' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Concluído' },
];

export function AdoptionRequestListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const animalIdParam = searchParams.get('animal_id');
  const { data, total, loading, filters, updateFilters, setFilters } = useVolunteerRequests();

  useEffect(() => {
    if (animalIdParam) {
      setFilters((prev) => ({ ...prev, animal_id: animalIdParam, page: 1 }));
    }
  }, [animalIdParam, setFilters]);

  const columns: ColumnsType<VolunteerRequestListItem> = [
    {
      title: 'Adotante',
      dataIndex: 'adopter_name',
      key: 'adopter_name',
    },
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: AdoptionRequestStatus) => (
        <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</Tag>
      ),
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
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/ong/adoption-requests/${record.id}`)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Pedidos de Adoção
      </Title>

      {animalIdParam && (
        <Alert
          type="info"
          message={`Mostrando pedidos filtrados por animal`}
          closable
          onClose={() => {
            navigate('/ong/adoption-requests', { replace: true });
            setFilters((prev) => {
              const rest = { ...prev };
              delete rest.animal_id;
              return { ...rest, page: 1 };
            });
          }}
          style={{ marginBottom: 16 }}
        />
      )}

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
