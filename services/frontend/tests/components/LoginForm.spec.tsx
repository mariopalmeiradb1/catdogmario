import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '~/components/auth/LoginForm';
import { AuthContext, type AuthContextValue } from '~/contexts/AuthContext';

function renderLoginForm(authValue?: Partial<AuthContextValue>) {
  const defaultAuth: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    mustChangePassword: false,
    setMustChangePassword: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    ...authValue,
  };

  return render(
    <AuthContext.Provider value={defaultAuth}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('LoginForm', () => {
  it('should render email and password inputs', () => {
    renderLoginForm();

    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
  });

  it('should have a submit button', () => {
    renderLoginForm();

    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    renderLoginForm();
    const user = userEvent.setup();

    const passwordInput = screen.getByPlaceholderText('Senha');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleIcon = passwordInput.closest('.ant-input-password')?.querySelector('.ant-input-suffix');
    if (toggleIcon) {
      await user.click(toggleIcon);
    }
  });

  it('should show validation when fields are empty', async () => {
    renderLoginForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await vi.waitFor(() => {
      expect(screen.getAllByText('Campo obrigatório.')).toHaveLength(2);
    });
  });
});
