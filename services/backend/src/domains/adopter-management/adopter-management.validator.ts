import { z } from 'zod';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const createAdopterProfileSchema = z.object({
  full_name: z
    .string({ required_error: 'Nome completo é obrigatório.' })
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
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
  cep: z
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
  has_current_animals: z.boolean({ required_error: 'Informe se possui animais atualmente.' }),
  current_animals_description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .optional(),
  had_animals_before: z.boolean({ required_error: 'Informe se já teve animais antes.' }),
  previous_animals_description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .optional(),
});

export const updateAdopterProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.')
    .optional(),
  rg: z
    .string()
    .trim()
    .min(5, 'RG deve ter pelo menos 5 caracteres.')
    .max(20, 'RG deve ter no máximo 20 caracteres.')
    .optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato YYYY-MM-DD.')
    .optional(),
  phone: z
    .string()
    .trim()
    .min(10, 'Telefone deve ter pelo menos 10 caracteres.')
    .max(15, 'Telefone deve ter no máximo 15 caracteres.')
    .optional(),
  cep: z
    .string()
    .trim()
    .min(8, 'CEP deve ter 8 dígitos.')
    .max(9, 'CEP deve ter no máximo 9 caracteres.')
    .optional(),
  street: z
    .string()
    .trim()
    .min(3, 'Rua deve ter pelo menos 3 caracteres.')
    .max(200, 'Rua deve ter no máximo 200 caracteres.')
    .optional(),
  number: z
    .string()
    .trim()
    .min(1, 'Número é obrigatório.')
    .max(10, 'Número deve ter no máximo 10 caracteres.')
    .optional(),
  complement: z
    .string()
    .trim()
    .max(100, 'Complemento deve ter no máximo 100 caracteres.')
    .optional(),
  neighborhood: z
    .string()
    .trim()
    .min(2, 'Bairro deve ter pelo menos 2 caracteres.')
    .max(100, 'Bairro deve ter no máximo 100 caracteres.')
    .optional(),
  city: z
    .string()
    .trim()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres.')
    .max(100, 'Cidade deve ter no máximo 100 caracteres.')
    .optional(),
  state: z.enum(BRAZILIAN_STATES, {
    invalid_type_error: 'Estado inválido.',
  }).optional(),
  has_current_animals: z.boolean().optional(),
  current_animals_description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .optional(),
  had_animals_before: z.boolean().optional(),
  previous_animals_description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .optional(),
});

export const adopterIdParamSchema = z.object({
  id: z.string({ required_error: 'ID do adotante é obrigatório.' }).uuid('ID do adotante inválido.'),
});
