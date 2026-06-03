import { List, Tag, Avatar, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { AdopterRequestListItem, AdoptionRequestStatus } from '~/types/adoption-requests.types';

const { Text } = Typography;

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

interface AdoptionHistoryListProps {
  data: AdopterRequestListItem[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
}

export function AdoptionHistoryList({
  data,
  loading,
  total,
  page,
  limit,
  onPageChange,
  hasFilters,
}: AdoptionHistoryListProps) {
  const navigate = useNavigate();

  if (!loading && data.length === 0 && hasFilters) {
    return <Empty description="Nenhum pedido encontrado com os filtros selecionados." />;
  }

  return (
    <List
      loading={loading}
      itemLayout="horizontal"
      dataSource={data}
      pagination={{
        current: page,
        pageSize: limit,
        total,
        onChange: onPageChange,
        showTotal: (t) => `Total: ${t} pedidos`,
      }}
      renderItem={(item) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/adopter/history/${item.id}`)}
        >
          <List.Item.Meta
            avatar={
              <Avatar
                src={item.animal_photo_url}
                shape="square"
                size={48}
              >
                {item.animal_name.charAt(0)}
              </Avatar>
            }
            title={
              <span>
                {item.animal_name}{' '}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({SPECIES_LABELS[item.animal_species] || item.animal_species}
                  {item.animal_breed ? ` - ${item.animal_breed}` : ''})
                </Text>
              </span>
            }
            description={
              <span>
                {item.ong_name} &middot;{' '}
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </span>
            }
          />
          <Tag color={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status]}</Tag>
        </List.Item>
      )}
    />
  );
}
