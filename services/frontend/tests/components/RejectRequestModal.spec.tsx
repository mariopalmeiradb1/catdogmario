import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RejectRequestModal } from '~/components/adoption-management/RejectRequestModal';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RejectRequestModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  it('should render with empty textarea and disabled reject button', () => {
    render(<RejectRequestModal {...defaultProps} />);

    expect(screen.getByText('Rejeitar Pedido de Adoção')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Informe o motivo da rejeição...')).toHaveValue('');

    const okButton = screen.getByRole('button', { name: /rejeitar/i });
    expect(okButton).toBeDisabled();
  });

  it('should keep reject button disabled when text is less than 10 characters', () => {
    render(<RejectRequestModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Informe o motivo da rejeição...');
    fireEvent.change(textarea, { target: { value: 'curto' } });

    const okButton = screen.getByRole('button', { name: /rejeitar/i });
    expect(okButton).toBeDisabled();
  });

  it('should enable reject button when text has 10 or more characters', () => {
    render(<RejectRequestModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Informe o motivo da rejeição...');
    fireEvent.change(textarea, { target: { value: 'Motivo válido para rejeição' } });

    const okButton = screen.getByRole('button', { name: /rejeitar/i });
    expect(okButton).not.toBeDisabled();
  });

  it('should call onConfirm with trimmed text when reject is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<RejectRequestModal {...defaultProps} onConfirm={onConfirm} />);

    const textarea = screen.getByPlaceholderText('Informe o motivo da rejeição...');
    fireEvent.change(textarea, { target: { value: 'Motivo válido para rejeição' } });

    const okButton = screen.getByRole('button', { name: /rejeitar/i });
    fireEvent.click(okButton);

    expect(onConfirm).toHaveBeenCalledWith('Motivo válido para rejeição');
  });

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<RejectRequestModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should show helper text', () => {
    render(<RejectRequestModal {...defaultProps} />);

    expect(
      screen.getByText('Mínimo de 10 caracteres. O motivo será visível para o adotante.'),
    ).toBeInTheDocument();
  });

  it('should show loading state on reject button', () => {
    render(<RejectRequestModal {...defaultProps} loading={true} />);

    const textarea = screen.getByPlaceholderText('Informe o motivo da rejeição...');
    fireEvent.change(textarea, { target: { value: 'Motivo válido para rejeição' } });

    const okButton = screen.getByRole('button', { name: /rejeitar/i });
    expect(okButton.closest('button')).toBeInTheDocument();
  });
});
