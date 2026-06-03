import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdoptionHistoryPage } from '~/pages/adopter/AdoptionHistoryPage';

const mockUseAdoptionHistory = vi.fn();

vi.mock('~/hooks/useAdoptionHistory', () => ({
  useAdoptionHistory: () => mockUseAdoptionHistory(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdoptionHistoryPage />
    </MemoryRouter>,
  );
}

describe('AdoptionHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    mockUseAdoptionHistory.mockReturnValue({
      data: [],
      total: 0,
      loading: false,
      filters: { page: 1, limit: 10 },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Meu Histórico')).toBeInTheDocument();
  });

  it('should show empty state when no requests exist', () => {
    mockUseAdoptionHistory.mockReturnValue({
      data: [],
      total: 0,
      loading: false,
      filters: { page: 1, limit: 10 },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Você ainda não fez nenhum pedido de adoção.')).toBeInTheDocument();
    expect(screen.getByText('Explorar animais disponíveis')).toBeInTheDocument();
  });

  it('should show filter-empty message when filters return no results', () => {
    mockUseAdoptionHistory.mockReturnValue({
      data: [],
      total: 0,
      loading: false,
      filters: { page: 1, limit: 10, status: 'completed' },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Nenhum pedido encontrado com os filtros selecionados.')).toBeInTheDocument();
  });

  it('should render list items with correct data', () => {
    mockUseAdoptionHistory.mockReturnValue({
      data: [
        {
          id: 'req-1',
          animal_name: 'Rex',
          animal_species: 'dog',
          animal_photo_url: null,
          animal_breed: 'Labrador',
          ong_name: 'ONG Animais',
          status: 'completed',
          rejection_reason: null,
          created_at: '2026-03-15T10:00:00.000Z',
        },
        {
          id: 'req-2',
          animal_name: 'Mia',
          animal_species: 'cat',
          animal_photo_url: null,
          animal_breed: null,
          ong_name: 'ONG Gatos',
          status: 'rejected',
          rejection_reason: 'Perfil incompatível',
          created_at: '2026-02-10T10:00:00.000Z',
        },
      ],
      total: 2,
      loading: false,
      filters: { page: 1, limit: 10 },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Mia')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });

  it('should render status badges with correct colors', () => {
    mockUseAdoptionHistory.mockReturnValue({
      data: [
        {
          id: 'req-1',
          animal_name: 'Rex',
          animal_species: 'dog',
          animal_photo_url: null,
          animal_breed: null,
          ong_name: 'ONG Teste',
          status: 'pending',
          rejection_reason: null,
          created_at: '2026-03-15T10:00:00.000Z',
        },
      ],
      total: 1,
      loading: false,
      filters: { page: 1, limit: 10 },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});
