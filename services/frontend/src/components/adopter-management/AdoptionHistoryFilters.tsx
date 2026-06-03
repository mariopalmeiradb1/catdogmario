import { Select, DatePicker, Button, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import type { AdopterRequestFilters, AdoptionRequestStatus } from '~/types/adoption-requests.types';

const { RangePicker } = DatePicker;

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_review', label: 'Em Análise' },
  { value: 'approved', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'rejected', label: 'Rejeitado' },
];

interface AdoptionHistoryFiltersProps {
  filters: AdopterRequestFilters;
  onFilterChange: (updates: Partial<AdopterRequestFilters>) => void;
  onClear: () => void;
}

export function AdoptionHistoryFilters({ filters, onFilterChange, onClear }: AdoptionHistoryFiltersProps) {
  function handleStatusChange(value: string) {
    onFilterChange({ status: (value || undefined) as AdoptionRequestStatus | undefined });
  }

  function handleDateChange(dates: [Dayjs | null, Dayjs | null] | null) {
    if (dates && dates[0] && dates[1]) {
      onFilterChange({
        date_from: dates[0].startOf('day').toISOString(),
        date_to: dates[1].endOf('day').toISOString(),
      });
    } else {
      onFilterChange({ date_from: undefined, date_to: undefined });
    }
  }

  return (
    <Space style={{ marginBottom: 16 }} wrap>
      <Select
        value={filters.status || ''}
        options={statusOptions}
        onChange={handleStatusChange}
        style={{ width: 200 }}
        placeholder="Filtrar por status"
      />
      <RangePicker
        format="DD/MM/YYYY"
        onChange={handleDateChange}
        placeholder={['Data inicial', 'Data final']}
      />
      <Button onClick={onClear}>Limpar filtros</Button>
    </Space>
  );
}
