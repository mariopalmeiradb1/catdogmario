import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdoptionRequestDetailPage } from '~/pages/ong/AdoptionRequestDetailPage';
import type { AdoptionRequestDetail } from '~/types/adoption-requests.types';

const mockFindById = vi.fn();
const mockApprove = vi.fn();
const mockReject = vi.fn();
const mockStartReview = vi.fn();

vi.mock('~/services/adoption-requests.service', () => ({
  adoptionRequestsService: {
    findById: (...args: unknown[]) => mockFindById(...args),
    approve: (...args: unknown[]) => mockApprove(...args),
    reject: (...args: unknown[]) => mockReject(...args),
    startReview: (...args: unknown[]) => mockStartReview(...args),
  },
}));

const baseMockDetail: AdoptionRequestDetail = {
  id: 'req-1',
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
    <MemoryRouter initialEntries={['/ong/adoption-requests/req-1']}>
      <Routes>
        <Route path="/ong/adoption-requests/:id" element={<AdoptionRequestDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdoptionRequestDetailPage - Actions', () => {
  it('should show 3 action buttons for pending request', async () => {
    mockFindById.mockResolvedValue({ ...baseMockDetail, status: 'pending' });

    renderPage();

    expect(await screen.findByText('Iniciar Análise')).toBeInTheDocument();
    expect(screen.getByText('Aprovar')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar')).toBeInTheDocument();
  });

  it('should show 2 action buttons for in_review request (no Iniciar Análise)', async () => {
    mockFindById.mockResolvedValue({ ...baseMockDetail, status: 'in_review' });

    renderPage();

    expect(await screen.findByText('Aprovar')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar')).toBeInTheDocument();
    expect(screen.queryByText('Iniciar Análise')).not.toBeInTheDocument();
  });

  it('should not render action buttons for approved request', async () => {
    mockFindById.mockResolvedValue({ ...baseMockDetail, status: 'approved' });

    renderPage();

    await screen.findByText('Detalhes do Pedido de Adoção');
    expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejeitar')).not.toBeInTheDocument();
    expect(screen.queryByText('Iniciar Análise')).not.toBeInTheDocument();
  });

  it('should not render action buttons for rejected request', async () => {
    mockFindById.mockResolvedValue({
      ...baseMockDetail,
      status: 'rejected',
      rejection_reason: 'Motivo teste da rejeição.',
    });

    renderPage();

    await screen.findByText('Detalhes do Pedido de Adoção');
    expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
    expect(screen.queryByText('Iniciar Análise')).not.toBeInTheDocument();
  });

  it('should call approve service when confirming approval', async () => {
    mockFindById.mockResolvedValue({ ...baseMockDetail, status: 'pending' });
    mockApprove.mockResolvedValue(undefined);

    renderPage();

    const approveBtn = await screen.findByText('Aprovar');
    fireEvent.click(approveBtn);

    const confirmBtn = await screen.findByText('Sim');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith('req-1');
    });
  });

  it('should open reject modal when clicking Rejeitar', async () => {
    mockFindById.mockResolvedValue({ ...baseMockDetail, status: 'pending' });

    renderPage();

    const rejectBtn = await screen.findByText('Rejeitar');
    fireEvent.click(rejectBtn);

    expect(await screen.findByText('Rejeitar Pedido de Adoção')).toBeInTheDocument();
  });
});
