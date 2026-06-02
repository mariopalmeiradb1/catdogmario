import { useState, useRef, useCallback } from 'react';
import { AxiosError } from 'axios';
import { getAnimalDetail } from '~/services/catalog.service';
import type { CatalogAnimalDetail } from '~/types/catalog.types';
import type { ApiError } from '~/types/api.types';

interface UseAnimalDetailReturn {
  data: CatalogAnimalDetail | null;
  loading: boolean;
  error: string | null;
  fetchDetail: (id: string) => void;
  reset: () => void;
}

export function useAnimalDetail(): UseAnimalDetailReturn {
  const [data, setData] = useState<CatalogAnimalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback((id: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setData(null);

    getAnimalDetail(id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const axiosError = err as AxiosError<ApiError>;
        const msg =
          axiosError.response?.data?.error?.message ||
          'Não foi possível carregar os detalhes do animal. Tente novamente.';
        setError(msg);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, fetchDetail, reset };
}
