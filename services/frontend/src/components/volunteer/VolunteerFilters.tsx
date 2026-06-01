import { Row, Col, Select, Input } from 'antd';
import type { VolunteerListFilters } from '~/types/volunteer.types';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

interface VolunteerFiltersProps {
  filters: VolunteerListFilters;
  onFiltersChange: (updates: Partial<VolunteerListFilters>) => void;
}

export function VolunteerFilters({ filters, onFiltersChange }: VolunteerFiltersProps) {
  function handleStatusChange(value: string) {
    onFiltersChange({
      status: (value || undefined) as 'active' | 'inactive' | undefined,
    });
  }

  function handleSearch(value: string) {
    onFiltersChange({ search: value || undefined });
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={16} md={16}>
        <Input.Search
          placeholder="Buscar por nome, e-mail ou CPF"
          defaultValue={filters.search || ''}
          onSearch={handleSearch}
          allowClear
        />
      </Col>
      <Col xs={24} sm={8} md={8}>
        <Select
          style={{ width: '100%' }}
          placeholder="Status"
          value={filters.status || ''}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
          allowClear
          onClear={() => handleStatusChange('')}
        />
      </Col>
    </Row>
  );
}
