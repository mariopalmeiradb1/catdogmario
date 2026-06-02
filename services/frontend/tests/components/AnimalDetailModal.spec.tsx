import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimalDetailModal } from '~/components/catalog/AnimalDetailModal';
import type { CatalogAnimalDetail } from '~/types/catalog.types';

const mockFetchDetail = vi.fn();
const mockReset = vi.fn();

const mockAnimalData: CatalogAnimalDetail = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Rex',
  species: 'dog',
  breed: 'Labrador',
  sex: 'male',
  castration: 'yes',
  temperament: ['dócil', 'brincalhão'],
  estimated_age_months: 36,
  estimated_age_category: 'adult',
  size: 'large',
  weight_kg: 30,
  height_cm: 60,
  length_cm: 80,
  special_needs: false,
  special_needs_description: null,
  rescue_observations: null,
  general_observations: 'Animal saudável e vacinado.',
  status: 'available',
  media: [
    {
      id: 'media-1',
      type: 'photo',
      url: 'https://example.com/photo.jpg',
      mime_type: 'image/jpeg',
      sort_order: 1,
    },
  ],
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

let mockHookReturn: {
  data: CatalogAnimalDetail | null;
  loading: boolean;
  error: string | null;
};

beforeEach(() => {
  mockHookReturn = { data: null, loading: false, error: null };
  vi.clearAllMocks();
});

describe('AnimalDetailModal', () => {
  it('should not render when animalId is null', () => {
    render(<AnimalDetailModal animalId={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render modal when animalId is provided', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should call fetchDetail when animalId changes to non-null', () => {
    mockHookReturn = { data: null, loading: true, error: null };

    render(<AnimalDetailModal animalId="abc-123" onClose={vi.fn()} />);

    expect(mockFetchDetail).toHaveBeenCalledWith('abc-123');
  });

  it('should display loading skeleton during fetch', () => {
    mockHookReturn = { data: null, loading: true, error: null };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Rex')).not.toBeInTheDocument();
  });

  it('should display error state when fetch fails', () => {
    mockHookReturn = { data: null, loading: false, error: 'Erro de rede' };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByText('Erro ao carregar detalhes')).toBeInTheDocument();
    expect(screen.getByText('Erro de rede')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('should display all sections with complete data', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Cachorro')).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();
    expect(screen.getByText('Macho')).toBeInTheDocument();
    expect(screen.getByText('Adulto')).toBeInTheDocument();
    expect(screen.getByText('Grande')).toBeInTheDocument();
    expect(screen.getByText('dócil')).toBeInTheDocument();
    expect(screen.getByText('brincalhão')).toBeInTheDocument();
    expect(screen.getByText('30 kg')).toBeInTheDocument();
    expect(screen.getByText('60 cm')).toBeInTheDocument();
    expect(screen.getByText('80 cm')).toBeInTheDocument();
    expect(screen.getByText('ONG Teste')).toBeInTheDocument();
    expect(screen.getByText('São Paulo/SP')).toBeInTheDocument();
    expect(screen.getByText('Animal saudável e vacinado.')).toBeInTheDocument();
  });

  it('should omit special needs section when special_needs is false', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.queryByText('Necessidades Especiais')).not.toBeInTheDocument();
  });

  it('should show special needs section when special_needs is true', () => {
    mockHookReturn = {
      data: {
        ...mockAnimalData,
        special_needs: true,
        special_needs_description: 'Precisa de medicação diária.',
      },
      loading: false,
      error: null,
    };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByText('Necessidades Especiais')).toBeInTheDocument();
    expect(screen.getByText('Precisa de medicação diária.')).toBeInTheDocument();
  });

  it('should omit temperament section when array is empty', () => {
    mockHookReturn = {
      data: { ...mockAnimalData, temperament: [] },
      loading: false,
      error: null,
    };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.queryByText('Temperamento')).not.toBeInTheDocument();
  });

  it('should omit physical info when all values are null', () => {
    mockHookReturn = {
      data: { ...mockAnimalData, weight_kg: null, height_cm: null, length_cm: null },
      loading: false,
      error: null,
    };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.queryByText('Informações Físicas')).not.toBeInTheDocument();
  });

  it('should show disabled "Solicitar Adoção" button for available status', () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    const button = screen.getByRole('button', { name: /solicitar adoção/i });
    expect(button).toBeDisabled();
  });

  it('should show warning and disabled "Entrar na fila" for in_adoption_process', () => {
    mockHookReturn = {
      data: { ...mockAnimalData, status: 'in_adoption_process' },
      loading: false,
      error: null,
    };

    render(<AnimalDetailModal animalId="123" onClose={vi.fn()} />);

    expect(screen.getByText('Este animal já está em processo de adoção.')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /entrar na fila de espera/i });
    expect(button).toBeDisabled();
  });

  it('should call onClose and reset when modal is closed', async () => {
    mockHookReturn = { data: mockAnimalData, loading: false, error: null };
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<AnimalDetailModal animalId="123" onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
    });
  });
});
