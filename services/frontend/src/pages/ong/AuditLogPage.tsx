import { useEffect, useState, useCallback } from 'react';
import { Table, Typography, Row, Col, Input, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { auditLogService } from '~/services/audit-log.service';
import type { AuditLogEntry, AuditLogFilters } from '~/types/volunteer.types';
import type { PaginatedResponse } from '~/types/shared.types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ACTION_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'volunteer.create', label: 'Criar' },
  { value: 'volunteer.update', label: 'Editar' },
  { value: 'volunteer.deactivate', label: 'Desativar' },
  { value: 'volunteer.reactivate', label: 'Reativar' },
  { value: 'volunteer.remove', label: 'Remover' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas as entidades' },
  { value: 'volunteer', label: 'Voluntário' },
];

const DEFAULT_FILTERS: AuditLogFilters = {
  page: 1,
  limit: 20,
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function AuditLogPage() {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFiltersState] = useState<AuditLogFilters>(DEFAULT_FILTERS);

  const fetchLogs = useCallback(async (currentFilters: AuditLogFilters) => {
    setLoading(true);
    try {
      const response: PaginatedResponse<AuditLogEntry> =
        await auditLogService.list(currentFilters);
      setData(response.data);
      setTotal(response.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filters);
  }, [filters, fetchLogs]);

  function setFilters(updates: Partial<AuditLogFilters>) {
    setFiltersState((prev) => ({
      ...prev,
      ...updates,
      page: 'page' in updates ? (updates.page ?? 1) : 1,
    }));
  }

  function handleDateRangeChange(dates: [Dayjs | null, Dayjs | null] | null) {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({ date_from: undefined, date_to: undefined });
    }
  }

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: 'Data/Hora',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Voluntário',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Ação',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Entidade',
      dataIndex: 'entity',
      key: 'entity',
    },
    {
      title: 'ID Entidade',
      dataIndex: 'entity_id',
      key: 'entity_id',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Log de Auditoria
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Filtrar por voluntário (nome)"
            allowClear
            onChange={(e) => setFilters({ user_id: e.target.value || undefined })}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Tipo de ação"
            defaultValue=""
            options={ACTION_OPTIONS}
            onChange={(value: string) => setFilters({ action: value || undefined })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Entidade"
            defaultValue=""
            options={ENTITY_OPTIONS}
            onChange={(value: string) => setFilters({ entity: value || undefined })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['Data início', 'Data fim']}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
          />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: filters.page,
          pageSize: filters.limit,
          onChange: (page, pageSize) => setFilters({ page, limit: pageSize }),
          showSizeChanger: true,
          showTotal: (t) => `Total: ${t} registros`,
        }}
        locale={{ emptyText: 'Nenhum registro encontrado.' }}
      />
    </div>
  );
}
