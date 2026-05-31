import { Tag } from 'antd';
import type { OngStatus } from '~/types/ong-management.types';

const colorMap: Record<OngStatus, string> = {
  pending: 'orange',
  in_review: 'blue',
  approved: 'green',
  rejected: 'red',
  inactive: 'default',
};

const labelMap: Record<OngStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em Análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  inactive: 'Inativa',
};

interface OngStatusBadgeProps {
  status: OngStatus;
}

export function OngStatusBadge({ status }: OngStatusBadgeProps) {
  return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
}
