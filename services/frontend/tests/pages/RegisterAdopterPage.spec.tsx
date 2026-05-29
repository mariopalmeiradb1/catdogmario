import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { RegisterAdopterPage } from '~/pages/auth/RegisterAdopterPage';
import { AuthContext, type AuthContextValue } from '~/contexts/AuthContext';

vi.mock('~/services/auth.service', () => ({
  authService: {
    registerAdopter: vi.fn().mockResolvedValue({ message: 'Sucesso' }),
  },
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  setLogoutCallback: vi.fn(),
}));

function renderWithProviders() {
  const defaultAuth: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={defaultAuth}>
      <MemoryRouter>
        <RegisterAdopterPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RegisterAdopterPage', () => {
  it('should render all registration fields', () => {
    renderWithProviders();

    expect(screen.getByPlaceholderText('Nome completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirmar senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithProviders();

    expect(screen.getByText('Faça login')).toBeInTheDocument();
    expect(screen.getByText('Sou uma ONG')).toBeInTheDocument();
  });

  it('should show validation error for mismatched passwords', async () => {
    renderWithProviders();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Nome completo'), 'João Silva');
    await user.type(screen.getByPlaceholderText('E-mail'), 'joao@email.com');
    await user.type(screen.getByPlaceholderText('Senha'), 'Test@123');
    await user.type(screen.getByPlaceholderText('Confirmar senha'), 'Different@1');
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await vi.waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
    });
  });
});
