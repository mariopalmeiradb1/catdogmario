import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from '~/pages/auth/LoginPage';
import { AuthContext, type AuthContextValue } from '~/contexts/AuthContext';

function renderWithProviders(authValue?: Partial<AuthContextValue>) {
  const defaultAuth: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...authValue,
  };

  return render(
    <AuthContext.Provider value={defaultAuth}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('LoginPage', () => {
  it('should render login form with email and password fields', () => {
    renderWithProviders();

    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithProviders();

    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument();
  });

  it('should call login on form submit', async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined);
    renderWithProviders({ login: loginMock });

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('E-mail'), 'test@email.com');
    await user.type(screen.getByPlaceholderText('Senha'), 'Test@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await vi.waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@email.com', 'Test@123');
    });
  });
});
