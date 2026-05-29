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
      .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Informe um CNPJ válido (XX.XXX.XXX/XXXX-XX).'),
    phone: z
      .string({ required_error: 'Informe um telefone válido.' })
      .min(1, 'Informe um telefone válido.'),
    address: z
      .string({ required_error: 'Informe o endereço.' })
      .min(1, 'Informe o endereço.'),
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
