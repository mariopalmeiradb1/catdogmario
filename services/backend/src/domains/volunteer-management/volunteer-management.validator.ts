import { z } from 'zod';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const createVolunteerSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.'),
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .trim()
    .email('E-mail inválido.')
    .max(255, 'E-mail deve ter no máximo 255 caracteres.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .max(128, 'Senha deve ter no máximo 128 caracteres.'),
  password_confirmation: z
    .string({ required_error: 'Confirmação de senha é obrigatória.' }),
  cpf: z
    .string({ required_error: 'CPF é obrigatório.' })
    .trim()
    .min(11, 'CPF deve ter pelo menos 11 caracteres.')
    .max(14, 'CPF deve ter no máximo 14 caracteres.'),
  rg: z
    .string({ required_error: 'RG é obrigatório.' })
    .trim()
    .min(5, 'RG deve ter pelo menos 5 caracteres.')
    .max(20, 'RG deve ter no máximo 20 caracteres.'),
  birth_date: z
    .string({ required_error: 'Data de nascimento é obrigatória.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato YYYY-MM-DD.'),
  phone: z
    .string({ required_error: 'Telefone é obrigatório.' })
    .trim()
    .min(10, 'Telefone deve ter pelo menos 10 caracteres.')
    .max(15, 'Telefone deve ter no máximo 15 caracteres.'),
  zip_code: z
    .string({ required_error: 'CEP é obrigatório.' })
    .trim()
    .min(8, 'CEP deve ter 8 dígitos.')
    .max(9, 'CEP deve ter no máximo 9 caracteres.'),
  street: z
    .string({ required_error: 'Rua é obrigatória.' })
    .trim()
    .min(3, 'Rua deve ter pelo menos 3 caracteres.')
    .max(200, 'Rua deve ter no máximo 200 caracteres.'),
  number: z
    .string({ required_error: 'Número é obrigatório.' })
    .trim()
    .min(1, 'Número é obrigatório.')
    .max(10, 'Número deve ter no máximo 10 caracteres.'),
  complement: z
    .string()
    .trim()
    .max(100, 'Complemento deve ter no máximo 100 caracteres.')
    .nullable()
    .optional(),
  neighborhood: z
    .string({ required_error: 'Bairro é obrigatório.' })
    .trim()
    .min(2, 'Bairro deve ter pelo menos 2 caracteres.')
    .max(100, 'Bairro deve ter no máximo 100 caracteres.'),
  city: z
    .string({ required_error: 'Cidade é obrigatória.' })
    .trim()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres.')
    .max(100, 'Cidade deve ter no máximo 100 caracteres.'),
  state: z.enum(BRAZILIAN_STATES, {
    required_error: 'Estado é obrigatório.',
    invalid_type_error: 'Estado inválido.',
  }),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Senhas não coincidem.',
  path: ['password_confirmation'],
});

export const updateVolunteerSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  rg: z.string().trim().min(5).max(20).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido.').optional(),
  phone: z.string().trim().min(10).max(15).optional(),
  zip_code: z.string().trim().min(8).max(9).optional(),
  street: z.string().trim().min(3).max(200).optional(),
  number: z.string().trim().min(1).max(10).optional(),
  complement: z.string().trim().max(100).nullable().optional(),
  neighborhood: z.string().trim().min(2).max(100).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  state: z.enum(BRAZILIAN_STATES).optional(),
});

export const volunteerIdParamSchema = z.object({
  id: z.string({ required_error: 'ID do voluntário é obrigatório.' }).uuid('ID do voluntário inválido.'),
});

export const volunteerListQuerySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
