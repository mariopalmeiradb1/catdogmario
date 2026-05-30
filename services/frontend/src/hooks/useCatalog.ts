import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAnimals } from '~/services/catalog.service';
import { PAGE_SIZE } from '~/components/catalog/catalog.constants';
import type { CatalogAnimal, CatalogFilters } from '~/types/catalog.types';

interface UseCatalogReturn {
  animals: CatalogAnimal[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  filters: CatalogFilters;
  setFilters: (updates: Partial<CatalogFilters>) => void;
  loadMore: () => void;
  retry: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

function parseFiltersFromParams(params: URLSearchParams): CatalogFilters {
  const filters: CatalogFilters = {};
  const search = params.get('search');
  const species = params.get('species');
  const breed = params.get('breed');
  const age = params.get('age');
  const size = params.get('size');
  const sex = params.get('sex');
  const temperament = params.get('temperament');
  const specialNeeds = params.get('special_needs');

  if (search) filters.search = search;
  if (species === 'dog' || species === 'cat') filters.species = species;
  if (breed) filters.breed = breed;
  if (age && Number(age) > 0) filters.age = Number(age);
  if (size === 'small' || size === 'medium' || size === 'large') filters.size = size;
  if (sex === 'male' || sex === 'female') filters.sex = sex;
  if (temperament) filters.temperament = temperament;
  if (specialNeeds === 'true') filters.special_needs = true;

  return filters;
}

function filtersToParams(filters: CatalogFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.search) params.search = filters.search;
  if (filters.species) params.species = filters.species;
  if (filters.breed) params.breed = filters.breed;
  if (filters.age) params.age = String(filters.age);
  if (filters.size) params.size = filters.size;
  if (filters.sex) params.sex = filters.sex;
  if (filters.temperament) params.temperament = filters.temperament;
  if (filters.special_needs) params.special_needs = 'true';

  return params;
}

export function useCatalog(): UseCatalogReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [animals, setAnimals] = useState<CatalogAnimal[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<CatalogFilters>(() =>
    parseFiltersFromParams(searchParams),
  );

  const cursorRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);

  const fetchAnimals = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (isLoadingRef.current) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      isLoadingRef.current = true;

      try {
        const response = await getAnimals(
          { ...filters, cursor: cursor || undefined, limit: PAGE_SIZE },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setAnimals((prev) => (append ? [...prev, ...response.data] : response.data));
        setHasMore(response.pagination.has_more);
        cursorRef.current = response.pagination.next_cursor;
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Não foi possível carregar os animais. Tente novamente em alguns instantes.');
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    cursorRef.current = null;
    setAnimals([]);
    setHasMore(true);
    fetchAnimals(null, false);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchAnimals]);

  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true });
  }, [filters, setSearchParams]);

  const setFilters = useCallback(
    (updates: Partial<CatalogFilters>) => {
      setFiltersState((prev) => {
        const next = { ...prev, ...updates };

        if ('species' in updates && updates.species !== prev.species) {
          delete next.breed;
        }

        for (const key of Object.keys(next) as Array<keyof CatalogFilters>) {
          if (next[key] === undefined || next[key] === '') {
            delete next[key];
          }
        }

        return next;
      });
    },
    [],
  );

  const setSearchFilter = useCallback(
    (search: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        setFilters({ search: search || undefined });
      }, 600);
    },
    [setFilters],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingRef.current) return;
    fetchAnimals(cursorRef.current, true);
  }, [hasMore, fetchAnimals]);

  const retry = useCallback(() => {
    cursorRef.current = null;
    setAnimals([]);
    setHasMore(true);
    setError(null);
    fetchAnimals(null, false);
  }, [fetchAnimals]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
            loadMore();
          }
        },
        { threshold: 0.1 },
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadMore],
  );

  return {
    animals,
    loading,
    hasMore,
    error,
    filters,
    setFilters: (updates: Partial<CatalogFilters>) => {
      if ('search' in updates) {
        setSearchFilter(updates.search || '');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { search: _search, ...rest } = updates;
        if (Object.keys(rest).length > 0) {
          setFilters(rest);
        }
      } else {
        setFilters(updates);
      }
    },
    loadMore,
    retry,
    sentinelRef,
  };
}
