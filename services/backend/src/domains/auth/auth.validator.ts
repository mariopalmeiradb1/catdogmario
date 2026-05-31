import { z } from 'zod';

const passwordSchema = z
  .string({ required_error: 'Senha é obrigatória.' })
  .min(8, 'A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.')
  .regex(/[A-Z]/, 'A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.')
  .regex(/[0-9]/, 'A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.');

export const registerAdopterSchema = z
  .object({
    name: z
      .string({ required_error: 'Informe seu nome completo.' })
      .min(3, 'Informe seu nome completo.')
      .max(100, 'O nome deve ter no máximo 100 caracteres.'),
    email: z
      .string({ required_error: 'Informe um e-mail válido.' })
      .email('Informe um e-mail válido.'),
    password: passwordSchema,
    password_confirmation: z.string({ required_error: 'Confirme sua senha.' }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não coincidem.',
    path: ['password_confirmation'],
  });

export const registerOngSchema = z
  .object({
    name: z
      .string({ required_error: 'Informe seu nome completo.' })
      .min(3, 'Informe seu nome completo.')
      .max(100, 'O nome deve ter no máximo 100 caracteres.'),
    email: z
      .string({ required_error: 'Informe um e-mail válido.' })
      .email('Informe um e-mail válido.'),
    password: passwordSchema,
    password_confirmation: z.string({ required_error: 'Confirme sua senha.' }),
    ong_name: z
      .string({ required_error: 'Informe o nome da ONG.' })
      .min(3, 'O nome da ONG deve ter no mínimo 3 caracteres.')
      .max(150, 'O nome da ONG deve ter no máximo 150 caracteres.'),
    cnpj: z
      .string({ required_error: 'Informe o CNPJ.' })
      .transform((val) => val.replace(/\D/g, ''))
      .pipe(z.string().length(14, 'CNPJ deve ter 14 dígitos.')),
    phone: z
      .string({ required_error: 'Informe um telefone válido.' })
      .transform((val) => val.replace(/\D/g, ''))
      .pipe(z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos.').max(11, 'Telefone deve ter no máximo 11 dígitos.')),
    address: z
      .string({ required_error: 'Informe o endereço.' })
      .min(1, 'Informe o endereço.'),
    description: z
      .string({ required_error: 'Descrição é obrigatória (mínimo 50 caracteres).' })
      .trim()
      .min(50, 'Descrição deve ter no mínimo 50 caracteres.')
      .max(500, 'Descrição deve ter no máximo 500 caracteres.'),
    capacity: z
      .number({
        required_error: 'Capacidade deve ser um número inteiro maior que zero.',
        invalid_type_error: 'Capacidade deve ser um número inteiro maior que zero.',
      })
      .int('Capacidade deve ser um número inteiro maior que zero.')
      .min(1, 'Capacidade deve ser um número inteiro maior que zero.'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não coincidem.',
    path: ['password_confirmation'],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Informe um e-mail válido.' })
    .email('Informe um e-mail válido.'),
  password: z
    .string({ required_error: 'Informe sua senha.' })
    .min(1, 'Informe sua senha.'),
});

export const confirmEmailSchema = z.object({
  token: z.string({ required_error: 'Token é obrigatório.' }).min(1, 'Token é obrigatório.'),
});

export const resendConfirmationSchema = z.object({
  email: z
    .string({ required_error: 'Informe um e-mail válido.' })
    .email('Informe um e-mail válido.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Informe um e-mail válido.' })
    .email('Informe um e-mail válido.'),
});

export const verifyResetCodeSchema = z.object({
  email: z
    .string({ required_error: 'Informe um e-mail válido.' })
    .email('Informe um e-mail válido.'),
  code: z
    .string({ required_error: 'Informe o código.' })
    .length(6, 'O código deve ter 6 dígitos.')
    .regex(/^\d{6}$/, 'O código deve conter apenas números.'),
});

export const resetPasswordSchema = z
  .object({
    reset_token: z.string({ required_error: 'Token é obrigatório.' }).min(1, 'Token é obrigatório.'),
    password: passwordSchema,
    password_confirmation: z.string({ required_error: 'Confirme sua senha.' }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não coincidem.',
    path: ['password_confirmation'],
  });
