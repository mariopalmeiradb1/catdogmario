import { useEffect, useState, useCallback } from 'react';
import { Modal, Table, Typography, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { auditLogService } from '~/services/audit-log.service';
import type { AuditLogEntry, AuditLogFilters } from '~/types/volunteer.types';
import type { PaginatedResponse } from '~/types/shared.types';

const { Text } = Typography;

interface AnimalAuditLogModalProps {
  open: boolean;
  animalId: string;
  animalName: string;
  onClose: () => void;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function AnimalAuditLogModal({ open, animalId, animalName, onClose }: AnimalAuditLogModalProps) {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const filters: AuditLogFilters = {
        entity: 'animal',
        page: currentPage,
        limit: 10,
      };
      const response: PaginatedResponse<AuditLogEntry> = await auditLogService.list(filters);
      const filtered = response.data.filter((entry) => entry.entity_id === animalId);
      setData(filtered);
      setTotal(response.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    if (open && animalId) {
      fetchLogs(page);
    }
  }, [open, animalId, page, fetchLogs]);

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: 'Data/Hora',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDateTime(value),
      width: 180,
    },
    {
      title: 'Usuário',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Ação',
      dataIndex: 'action',
      key: 'action',
    },
  ];

  return (
    <Modal
      title={`Histórico de Alterações - ${animalName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {data.length === 0 && !loading ? (
        <Empty description="Nenhum registro de auditoria encontrado." />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          footer={() => (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Exibindo registros de alterações do animal.
            </Text>
          )}
        />
      )}
    </Modal>
  );
}
