import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { followUpService } from '~/services/follow-up.service';
import type { FollowUpListItem, FollowUpListFilters } from '~/types/follow-up.types';

export function useFollowUpList() {
  const [data, setData] = useState<FollowUpListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FollowUpListFilters>({ page: 1, limit: 20 });

  const fetchList = useCallback(async (currentFilters: FollowUpListFilters) => {
    setLoading(true);
    try {
      const response = await followUpService.list(currentFilters);
      setData(response.data);
      setTotal(response.pagination.total);
    } catch {
      message.error('Erro ao carregar acompanhamentos.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(filters);
  }, [filters, fetchList]);

  function updateFilters(updates: Partial<FollowUpListFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 'page' in updates ? updates.page : 1 }));
  }

  function refetch() {
    fetchList(filters);
  }

  return { data, total, loading, filters, updateFilters, refetch };
}
