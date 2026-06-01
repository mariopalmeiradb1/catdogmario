import { useState, useEffect, useCallback } from 'react';
import { volunteerService } from '~/services/volunteer.service';
import type { VolunteerListItem, VolunteerListFilters } from '~/types/volunteer.types';

interface UseVolunteerListReturn {
  volunteers: VolunteerListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: VolunteerListFilters;
  setFilters: (updates: Partial<VolunteerListFilters>) => void;
  handlePageChange: (page: number, pageSize: number) => void;
  refetch: () => void;
}

const DEFAULT_FILTERS: VolunteerListFilters = {
  page: 1,
  limit: 20,
};

export function useVolunteerList(): UseVolunteerListReturn {
  const [volunteers, setVolunteers] = useState<VolunteerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<VolunteerListFilters>(DEFAULT_FILTERS);

  const fetchVolunteers = useCallback(async (currentFilters: VolunteerListFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await volunteerService.list(currentFilters);
      setVolunteers(response.data);
      setTotal(response.total);
    } catch {
      setError('Não foi possível carregar a lista de voluntários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolunteers(filters);
  }, [filters, fetchVolunteers]);

  const setFilters = useCallback((updates: Partial<VolunteerListFilters>) => {
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
    fetchVolunteers(filters);
  }, [filters, fetchVolunteers]);

  return { volunteers, total, loading, error, filters, setFilters, handlePageChange, refetch };
}
