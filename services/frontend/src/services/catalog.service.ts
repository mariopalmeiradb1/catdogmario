import axios from 'axios';
import { env } from '~/config/env';
import type { CatalogAnimalDetail, CatalogQueryParams, CatalogResponse } from '~/types/catalog.types';

const catalogApi = axios.create({
  baseURL: env.VITE_API_URL,
});

export async function getAnimals(
  params: CatalogQueryParams,
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  const cleanParams: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== null) {
      cleanParams[key] = value;
    }
  }

  const { data } = await catalogApi.get<CatalogResponse>('/catalog', {
    params: cleanParams,
    signal,
  });

  return data;
}

export async function getAnimalDetail(
  id: string,
  signal?: AbortSignal,
): Promise<CatalogAnimalDetail> {
  const { data } = await catalogApi.get<{ data: CatalogAnimalDetail }>(`/catalog/${id}`, {
    signal,
  });

  return data.data;
}
