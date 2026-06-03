import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimalDetailModal } from '~/components/catalog/AnimalDetailModal';
import type { CatalogAnimalDetail } from '~/types/catalog.types';

const mockFetchDetail = vi.fn();
const mockReset = vi.fn();
const mockNavigate = vi.fn();

const mockAnimalData: CatalogAnimalDetail = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Rex',
  species: 'dog',
  breed: 'Labrador',
  sex: 'male',
  castration: 'yes',
  temperament: ['dócil'],
  estimated_age_months: 36,
  estimated_age_category: 'adult',
  size: 'large',
  weight_kg: 30,
  height_cm: 60,
  length_cm: 80,
  special_needs: false,
  special_needs_description: null,
  rescue_observations: null,
  general_observations: null,
  status: 'available',
  media: [],
  ong: {
    name: 'ONG Teste',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 99999-9999',
  },
};

vi.mock('~/hooks/useAnimalDetail', () => ({
  useAnimalDetail: () => ({
    data: mockHookReturn.data,
    loading: mockHookReturn.loading,
    error: mockHookReturn.error,
    fetchDetail: mockFetchDetail,
    reset: mockReset,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

let mockAuthReturn: {
  user: { name: string; role: string } | null;
  isAuthenticated: boolean;
};

vi.mock('~/hooks/useAuth', () => ({
  useAuth: () => mockAuthReturn,
}));

vi.mock('~/services/adoption-requests.service', () => ({
  adoptionRequestsService: {
    create: vi.fn(),
  },
}));

let mockHookReturn: {
  data: CatalogAnimalDetail | null;
  loading: boolean;
  error: string | null;
};

beforeEach(() => {
  mockHookReturn = { data: null, loading: false, error: null };
  mockAuthReturn = { user: null, isAuthenticated: false };
  vi.clearAllMocks();
});

describe('AnimalDetailModal - Adoption Button', () => {
  it('should show adoption button for unauthenticated user', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };
    mockAuthReturn = { user: null, isAuthenticated: false };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByText('Solicitar Adoção')).toBeInTheDocument();
  });

  it('should show enabled adoption button for adopter', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };
    mockAuthReturn = { user: { name: 'João', role: 'adopter' }, isAuthenticated: true };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    const button = screen.getByText('Solicitar Adoção');
    expect(button).toBeInTheDocument();
    expect(button.closest('button')).not.toBeDisabled();
  });

  it('should not show adoption button for volunteer', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };
    mockAuthReturn = { user: { name: 'Vol', role: 'ong_volunteer' }, isAuthenticated: true };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.queryByText('Solicitar Adoção')).not.toBeInTheDocument();
  });

  it('should show disabled queue button for in_adoption_process', () => {
    mockHookReturn = {
      data: { ...mockAnimalData, status: 'in_adoption_process' },
      loading: false,
      error: null,
    };
    mockAuthReturn = { user: { name: 'João', role: 'adopter' }, isAuthenticated: true };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByText('Este animal já está em processo de adoção.')).toBeInTheDocument();
    const queueBtn = screen.getByText('Entrar na fila de espera');
    expect(queueBtn.closest('button')).toBeDisabled();
  });
});
