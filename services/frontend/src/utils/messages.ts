export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  REGISTER_ADOPTER_SUCCESS:
    'Cadastro realizado! Verifique seu e-mail para ativar sua conta.',
  REGISTER_ONG_SUCCESS:
    'Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação.',
  CONFIRM_EMAIL_SUCCESS: 'E-mail confirmado com sucesso! Faça login para continuar.',
  FORGOT_PASSWORD_SENT:
    'Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos para redefinição.',
  RESET_PASSWORD_SUCCESS: 'Senha alterada com sucesso!',
  RESEND_CONFIRMATION_SUCCESS: 'E-mail de confirmação reenviado.',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso.',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
};

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Campo obrigatório.',
  EMAIL_INVALID: 'E-mail inválido.',
  PASSWORD_WEAK: 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um número.',
  PASSWORDS_MISMATCH: 'As senhas não coincidem.',
  NAME_MIN: 'Nome deve ter no mínimo 3 caracteres.',
  NAME_MAX: 'Nome deve ter no máximo 100 caracteres.',
  CNPJ_INVALID: 'CNPJ inválido.',
  PHONE_INVALID: 'Telefone inválido.',
  DESCRIPTION_REQUIRED: 'Descrição é obrigatória (mínimo 50 caracteres).',
  DESCRIPTION_MIN: 'Descrição deve ter no mínimo 50 caracteres.',
  DESCRIPTION_MAX: 'Descrição deve ter no máximo 500 caracteres.',
  CAPACITY_INVALID: 'Capacidade deve ser um número inteiro maior que zero.',
};
