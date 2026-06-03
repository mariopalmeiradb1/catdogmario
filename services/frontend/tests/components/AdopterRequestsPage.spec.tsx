import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdopterRequestsPage } from '~/pages/adopter/AdopterRequestsPage';
import type { AdopterRequestListItem } from '~/types/adoption-requests.types';

const mockCancelRequest = vi.fn();
const mockUpdateFilters = vi.fn();

const mockData: AdopterRequestListItem[] = [
  {
    id: 'req-1',
    animal_name: 'Rex',
    animal_species: 'dog',
    animal_photo_url: null,
    animal_breed: null,
    ong_name: 'ONG Teste',
    status: 'pending',
    rejection_reason: null,
    created_at: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'req-2',
    animal_name: 'Mia',
    animal_species: 'cat',
    animal_photo_url: null,
    animal_breed: null,
    ong_name: 'ONG Gatos',
    status: 'approved',
    rejection_reason: null,
    created_at: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'req-3',
    animal_name: 'Luna',
    animal_species: 'dog',
    animal_photo_url: null,
    animal_breed: null,
    ong_name: 'ONG Dogs',
    status: 'rejected',
    rejection_reason: 'Perfil incompatível com o animal.',
    created_at: '2024-01-05T00:00:00.000Z',
  },
];

let mockHookReturn: {
  data: AdopterRequestListItem[];
  total: number;
  loading: boolean;
  filters: { page?: number; limit?: number };
  updateFilters: ReturnType<typeof vi.fn>;
  cancelRequest: ReturnType<typeof vi.fn>;
  fetchRequests: ReturnType<typeof vi.fn>;
};

vi.mock('~/hooks/useAdopterRequests', () => ({
  useAdopterRequests: () => mockHookReturn,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdopterRequestsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHookReturn = {
    data: mockData,
    total: 3,
    loading: false,
    filters: { page: 1, limit: 20 },
    updateFilters: mockUpdateFilters,
    cancelRequest: mockCancelRequest,
    fetchRequests: vi.fn(),
  };
});

describe('AdopterRequestsPage', () => {
  it('should render table with adoption requests', () => {
    renderPage();

    expect(screen.getByText('Meus Pedidos de Adoção')).toBeInTheDocument();
    expect(screen.getByText('Rex (Cachorro)')).toBeInTheDocument();
    expect(screen.getByText('Mia (Gato)')).toBeInTheDocument();
    expect(screen.getByText('ONG Teste')).toBeInTheDocument();
    expect(screen.getByText('ONG Gatos')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockHookReturn = { ...mockHookReturn, data: [], loading: true };
    renderPage();

    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('should show cancel button only for pending and in_review', () => {
    renderPage();

    const cancelButtons = screen.getAllByText('Cancelar');
    expect(cancelButtons).toHaveLength(1);
  });

  it('should not show cancel button for approved requests', () => {
    mockHookReturn = {
      ...mockHookReturn,
      data: [{ ...mockData[1] }],
    };
    renderPage();

    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
  });

  it('should show rejection reason tooltip for rejected status', () => {
    renderPage();

    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });
});
