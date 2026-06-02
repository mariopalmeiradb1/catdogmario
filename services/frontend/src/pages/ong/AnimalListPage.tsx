import { useEffect, useState, useCallback } from 'react';
import { Typography, Button, Table, Input, Select, Tag, Space, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { animalManagementService } from '~/services/animal-management.service';
import type { AnimalListItem, AnimalListFilters, Species, AnimalStatus } from '~/types/animal-management.types';

const { Title } = Typography;

const STATUS_COLORS: Record<AnimalStatus, string> = {
  available: 'green',
  adopted: 'blue',
  in_adoption_process: 'orange',
  inactive: 'default',
};

const STATUS_LABELS: Record<AnimalStatus, string> = {
  available: 'Disponível',
  adopted: 'Adotado',
  in_adoption_process: 'Em processo de adoção',
  inactive: 'Inativo',
};

const speciesFilterOptions = [
  { value: '', label: 'Todas as espécies' },
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
];

const statusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'available', label: 'Disponível' },
  { value: 'adopted', label: 'Adotado' },
  { value: 'in_adoption_process', label: 'Em processo de adoção' },
  { value: 'inactive', label: 'Inativo' },
];

export function AnimalListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnimalListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AnimalListFilters>({ page: 1, limit: 20 });

  const fetchAnimals = useCallback(async (currentFilters: AnimalListFilters) => {
    setLoading(true);
    try {
      const response = await animalManagementService.list(currentFilters);
      setData(response.data);
      setTotal(response.pagination.total);
    } catch {
      message.error('Erro ao carregar lista de animais.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals(filters);
  }, [filters, fetchAnimals]);

  function updateFilters(updates: Partial<AnimalListFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 'page' in updates ? updates.page : 1 }));
  }

  const columns: ColumnsType<AnimalListItem> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Espécie',
      dataIndex: 'species',
      key: 'species',
      render: (value: Species) => (value === 'dog' ? 'Cachorro' : 'Gato'),
    },
    {
      title: 'Raça',
      dataIndex: 'breed',
      key: 'breed',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: AnimalStatus) => (
        <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</Tag>
      ),
    },
    {
      title: 'Cadastro',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/ong/animals/${record.id}`)}
          >
            Ver
          </Button>
          {record.status !== 'inactive' && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/ong/animals/${record.id}/edit`)}
            >
              Editar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Animais
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ong/animals/create')}>
          Cadastrar Animal
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Buscar por nome ou raça"
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => updateFilters({ search: e.target.value || undefined })}
          style={{ width: 250 }}
        />
        <Select
          defaultValue=""
          options={speciesFilterOptions}
          onChange={(value) => updateFilters({ species: (value || undefined) as Species | undefined })}
          style={{ width: 160 }}
        />
        <Select
          defaultValue=""
          options={statusFilterOptions}
          onChange={(value) => updateFilters({ status: (value || undefined) as AnimalStatus | undefined })}
          style={{ width: 160 }}
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
          showTotal: (t) => `Total: ${t} animais`,
        }}
      />
    </div>
  );
}
