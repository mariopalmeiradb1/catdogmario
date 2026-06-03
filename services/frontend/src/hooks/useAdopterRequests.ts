import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { adoptionRequestsService } from '~/services/adoption-requests.service';
import type { AdopterRequestListItem, AdopterRequestFilters } from '~/types/adoption-requests.types';

export function useAdopterRequests() {
  const [data, setData] = useState<AdopterRequestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AdopterRequestFilters>({ page: 1, limit: 20 });

  const fetchRequests = useCallback(async (currentFilters: AdopterRequestFilters) => {
    setLoading(true);
    try {
      const response = await adoptionRequestsService.listMine(currentFilters);
      setData(response.data);
      setTotal(response.pagination.total);
    } catch {
      message.error('Erro ao carregar pedidos de adoção.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(filters);
  }, [filters, fetchRequests]);

  async function cancelRequest(id: string) {
    try {
      await adoptionRequestsService.cancel(id);
      message.success('Pedido cancelado.');
      fetchRequests(filters);
    } catch {
      message.error('Erro ao cancelar pedido.');
    }
  }

  function updateFilters(updates: Partial<AdopterRequestFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 'page' in updates ? updates.page : 1 }));
  }

  return { data, total, loading, filters, updateFilters, cancelRequest, fetchRequests };
}
