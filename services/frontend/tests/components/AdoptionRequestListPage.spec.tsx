import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdoptionRequestListPage } from '~/pages/ong/AdoptionRequestListPage';
import type { VolunteerRequestListItem } from '~/types/adoption-requests.types';

const mockUpdateFilters = vi.fn();
const mockSetFilters = vi.fn();

const mockData: VolunteerRequestListItem[] = [
  {
    id: 'req-v1',
    animal_name: 'Rex',
    animal_species: 'dog',
    adopter_name: 'João Silva',
    status: 'pending',
    created_at: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'req-v2',
    animal_name: 'Mia',
    animal_species: 'cat',
    adopter_name: 'Maria Souza',
    status: 'approved',
    created_at: '2024-01-10T00:00:00.000Z',
  },
];

let mockHookReturn: {
  data: VolunteerRequestListItem[];
  total: number;
  loading: boolean;
  filters: { page?: number; limit?: number };
  updateFilters: ReturnType<typeof vi.fn>;
  fetchRequests: ReturnType<typeof vi.fn>;
  setFilters: ReturnType<typeof vi.fn>;
};

vi.mock('~/hooks/useVolunteerRequests', () => ({
  useVolunteerRequests: () => mockHookReturn,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdoptionRequestListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHookReturn = {
    data: mockData,
    total: 2,
    loading: false,
    filters: { page: 1, limit: 20 },
    updateFilters: mockUpdateFilters,
    fetchRequests: vi.fn(),
    setFilters: mockSetFilters,
  };
});

describe('AdoptionRequestListPage', () => {
  it('should render table with adoption requests', () => {
    renderPage();

    expect(screen.getByText('Pedidos de Adoção')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('Rex (Cachorro)')).toBeInTheDocument();
    expect(screen.getByText('Mia (Gato)')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockHookReturn = { ...mockHookReturn, data: [], loading: true };
    renderPage();

    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('should show view button for each request', () => {
    renderPage();

    const viewButtons = screen.getAllByText('Ver');
    expect(viewButtons).toHaveLength(2);
  });
});
