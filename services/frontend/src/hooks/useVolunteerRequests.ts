import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { adoptionRequestsService } from '~/services/adoption-requests.service';
import type { VolunteerRequestListItem, VolunteerRequestFilters } from '~/types/adoption-requests.types';

export function useVolunteerRequests() {
  const [data, setData] = useState<VolunteerRequestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<VolunteerRequestFilters>({ page: 1, limit: 20 });

  const fetchRequests = useCallback(async (currentFilters: VolunteerRequestFilters) => {
    setLoading(true);
    try {
      const response = await adoptionRequestsService.list(currentFilters);
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

  function updateFilters(updates: Partial<VolunteerRequestFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 'page' in updates ? updates.page : 1 }));
  }

  return { data, total, loading, filters, updateFilters, fetchRequests, setFilters };
}
