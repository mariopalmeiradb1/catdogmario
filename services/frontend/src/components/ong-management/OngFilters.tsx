import { Row, Col, Select, Input, DatePicker } from 'antd';
import type { OngListFilters, OngStatus } from '~/types/ong-management.types';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const STATUS_OPTIONS: { value: OngStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_review', label: 'Em Análise' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'rejected', label: 'Rejeitada' },
  { value: 'inactive', label: 'Inativa' },
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

interface OngFiltersProps {
  filters: OngListFilters;
  onFiltersChange: (filters: Partial<OngListFilters>) => void;
}

export function OngFilters({ filters, onFiltersChange }: OngFiltersProps) {
  function handleStatusChange(value: string) {
    onFiltersChange({ status: (value || undefined) as OngStatus | undefined });
  }

  function handleStateChange(value: string) {
    onFiltersChange({ state: value || undefined });
  }

  function handleCityChange(value: string) {
    onFiltersChange({ city: value || undefined });
  }

  function handleDateRangeChange(dates: [Dayjs | null, Dayjs | null] | null) {
    if (dates && dates[0] && dates[1]) {
      onFiltersChange({
        dateFrom: dates[0].format('YYYY-MM-DD'),
        dateTo: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      onFiltersChange({ dateFrom: undefined, dateTo: undefined });
    }
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
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
      <Col xs={24} sm={12} md={6}>
        <Select
          style={{ width: '100%' }}
          placeholder="Estado"
          value={filters.state || undefined}
          onChange={handleStateChange}
          allowClear
          showSearch
        >
          {BRAZILIAN_STATES.map((uf) => (
            <Select.Option key={uf} value={uf}>
              {uf}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Cidade"
          value={filters.city || ''}
          onChange={(e) => handleCityChange(e.target.value)}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <RangePicker
          style={{ width: '100%' }}
          placeholder={['Data início', 'Data fim']}
          onChange={handleDateRangeChange}
          format="DD/MM/YYYY"
        />
      </Col>
    </Row>
  );
}
