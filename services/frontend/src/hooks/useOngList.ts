import { useState, useEffect, useCallback } from 'react';
import { ongManagementService } from '~/services/ong-management.service';
import type { OngListItem, OngListFilters } from '~/types/ong-management.types';

interface UseOngListReturn {
  ongs: OngListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: OngListFilters;
  setFilters: (updates: Partial<OngListFilters>) => void;
  handlePageChange: (page: number, pageSize: number) => void;
  refetch: () => void;
}

const DEFAULT_FILTERS: OngListFilters = {
  page: 1,
  limit: 20,
};

export function useOngList(): UseOngListReturn {
  const [ongs, setOngs] = useState<OngListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<OngListFilters>(DEFAULT_FILTERS);

  const fetchOngs = useCallback(async (currentFilters: OngListFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ongManagementService.list(currentFilters);
      setOngs(response.data);
      setTotal(response.total);
    } catch {
      setError('Não foi possível carregar a lista de ONGs. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOngs(filters);
  }, [filters, fetchOngs]);

  const setFilters = useCallback((updates: Partial<OngListFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...updates,
      page: 'page' in updates ? updates.page! : 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setFiltersState((prev) => ({
      ...prev,
      page,
      limit: pageSize,
    }));
  }, []);

  const refetch = useCallback(() => {
    fetchOngs(filters);
  }, [filters, fetchOngs]);

  return { ongs, total, loading, error, filters, setFilters, handlePageChange, refetch };
}
