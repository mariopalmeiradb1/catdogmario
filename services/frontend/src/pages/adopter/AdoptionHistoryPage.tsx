import { Typography, Empty, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useAdoptionHistory } from '~/hooks/useAdoptionHistory';
import { AdoptionHistoryFilters } from '~/components/adopter-management/AdoptionHistoryFilters';
import { AdoptionHistoryList } from '~/components/adopter-management/AdoptionHistoryList';

const { Title } = Typography;

export function AdoptionHistoryPage() {
  const { data, total, loading, filters, updateFilters, clearFilters } = useAdoptionHistory();

  const hasFilters = !!(filters.status || filters.date_from || filters.date_to);

  if (!loading && data.length === 0 && !hasFilters) {
    return (
      <div>
        <Title level={3} style={{ marginBottom: 24 }}>Meu Histórico</Title>
        <Empty description="Você ainda não fez nenhum pedido de adoção.">
          <Link to="/catalog">
            <Button type="primary">Explorar animais disponíveis</Button>
          </Link>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Meu Histórico</Title>

      <AdoptionHistoryFilters
        filters={filters}
        onFilterChange={updateFilters}
        onClear={clearFilters}
      />

      <AdoptionHistoryList
        data={data}
        loading={loading}
        total={total}
        page={filters.page || 1}
        limit={filters.limit || 10}
        onPageChange={(page) => updateFilters({ page })}
        hasFilters={hasFilters}
      />
    </div>
  );
}
