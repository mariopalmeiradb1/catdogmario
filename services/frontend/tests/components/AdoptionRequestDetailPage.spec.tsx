import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdoptionRequestDetailPage } from '~/pages/ong/AdoptionRequestDetailPage';
import type { AdoptionRequestDetail } from '~/types/adoption-requests.types';

const mockFindById = vi.fn();

vi.mock('~/services/adoption-requests.service', () => ({
  adoptionRequestsService: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

const mockDetail: AdoptionRequestDetail = {
  id: 'req-detail-1',
  animal_id: 'animal-1',
  animal_name: 'Rex',
  animal_species: 'dog',
  animal_breed: 'Labrador',
  adopter_id: 'adopter-1',
  adopter_name: 'João Silva',
  adopter_email: 'joao@test.com',
  ong_id: 'ong-1',
  status: 'pending',
  rejection_reason: null,
  cancelled_by: null,
  cancellation_reason: null,
  created_at: '2024-01-15T10:00:00.000Z',
  updated_at: '2024-01-15T10:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ong/adoption-requests/req-detail-1']}>
      <Routes>
        <Route path="/ong/adoption-requests/:id" element={<AdoptionRequestDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdoptionRequestDetailPage', () => {
  it('should render request details', async () => {
    mockFindById.mockResolvedValue(mockDetail);

    renderPage();

    expect(await screen.findByText('Detalhes do Pedido de Adoção')).toBeInTheDocument();
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@test.com')).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();
  });

  it('should show rejection reason when present', async () => {
    mockFindById.mockResolvedValue({
      ...mockDetail,
      status: 'rejected',
      rejection_reason: 'Perfil não compatível.',
    });

    renderPage();

    expect(await screen.findByText('Motivo da Rejeição')).toBeInTheDocument();
    expect(screen.getByText('Perfil não compatível.')).toBeInTheDocument();
  });

  it('should show system cancellation alert', async () => {
    mockFindById.mockResolvedValue({
      ...mockDetail,
      status: 'cancelled',
      cancelled_by: 'system',
    });

    renderPage();

    expect(await screen.findByText('Pedido cancelado pelo sistema')).toBeInTheDocument();
  });

  it('should show adopter cancellation alert', async () => {
    mockFindById.mockResolvedValue({
      ...mockDetail,
      status: 'cancelled',
      cancelled_by: 'adopter',
    });

    renderPage();

    expect(await screen.findByText('Cancelado pelo adotante')).toBeInTheDocument();
  });

  it('should render back button', async () => {
    mockFindById.mockResolvedValue(mockDetail);

    renderPage();

    expect(await screen.findByText('Voltar')).toBeInTheDocument();
  });
});
