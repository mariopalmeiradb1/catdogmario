import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { adoptionRequestsService } from '~/services/adoption-requests.service';
import type {
  AdopterRequestListItem,
  AdopterRequestFilters,
  AdopterRequestDetail,
} from '~/types/adoption-requests.types';

export function useAdoptionHistory() {
  const [data, setData] = useState<AdopterRequestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AdopterRequestFilters>({ page: 1, limit: 10 });

  const fetchHistory = useCallback(async (currentFilters: AdopterRequestFilters) => {
    setLoading(true);
    try {
      const response = await adoptionRequestsService.listMine(currentFilters);
      setData(response.data);
      setTotal(response.pagination.total);
    } catch {
      message.error('Erro ao carregar histórico de adoções.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(filters);
  }, [filters, fetchHistory]);

  function updateFilters(updates: Partial<AdopterRequestFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 'page' in updates ? updates.page : 1 }));
  }

  function clearFilters() {
    setFilters({ page: 1, limit: 10 });
  }

  return { data, total, loading, filters, updateFilters, clearFilters };
}

export function useAdoptionHistoryDetail(id: string | undefined) {
  const [detail, setDetail] = useState<AdopterRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(false);

    adoptionRequestsService
      .findMineById(id)
      .then((data) => setDetail(data))
      .catch(() => {
        setError(true);
        message.error('Erro ao carregar detalhes do pedido.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { detail, loading, error };
}
