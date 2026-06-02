import { z } from 'zod';

const ALLOWED_TEMPERAMENTS = [
  'docile',
  'playful',
  'shy',
  'aggressive_with_animals',
  'independent',
  'needy',
  'other',
] as const;

export const createAnimalSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.'),
  species: z.enum(['dog', 'cat'], {
    required_error: 'Espécie é obrigatória.',
    invalid_type_error: 'Espécie deve ser "dog" ou "cat".',
  }),
  breed: z
    .string({ required_error: 'Raça é obrigatória.' })
    .trim()
    .min(1, 'Raça é obrigatória.')
    .max(100, 'Raça deve ter no máximo 100 caracteres.'),
  sex: z.enum(['male', 'female'], {
    required_error: 'Sexo é obrigatório.',
    invalid_type_error: 'Sexo deve ser "male" ou "female".',
  }),
  castration: z.enum(['yes', 'no', 'unknown'], {
    required_error: 'Castração é obrigatória.',
    invalid_type_error: 'Castração deve ser "yes", "no" ou "unknown".',
  }),
  temperament: z
    .array(
      z.enum(ALLOWED_TEMPERAMENTS, {
        invalid_type_error: 'Temperamento inválido.',
      }),
      { required_error: 'Temperamento é obrigatório.' },
    )
    .min(1, 'Selecione pelo menos um temperamento.'),
  estimated_age_category: z.enum(['puppy', 'young', 'adult', 'senior'], {
    required_error: 'Categoria de idade é obrigatória.',
    invalid_type_error: 'Categoria de idade deve ser "puppy", "young", "adult" ou "senior".',
  }),
  size: z
    .enum(['small', 'medium', 'large'], {
      invalid_type_error: 'Porte deve ser "small", "medium" ou "large".',
    })
    .optional()
    .nullable(),
  weight_kg: z
    .number({ invalid_type_error: 'Peso deve ser um número.' })
    .positive('Peso deve ser positivo.')
    .max(999.9, 'Peso deve ter no máximo 999.9 kg.')
    .optional()
    .nullable(),
  height_cm: z
    .number({ invalid_type_error: 'Altura deve ser um número.' })
    .int('Altura deve ser um número inteiro.')
    .positive('Altura deve ser positiva.')
    .optional()
    .nullable(),
  length_cm: z
    .number({ invalid_type_error: 'Comprimento deve ser um número.' })
    .int('Comprimento deve ser um número inteiro.')
    .positive('Comprimento deve ser positivo.')
    .optional()
    .nullable(),
  special_needs: z
    .boolean({ invalid_type_error: 'Necessidades especiais deve ser verdadeiro ou falso.' })
    .optional()
    .default(false),
  special_needs_description: z
    .string()
    .max(500, 'Descrição de necessidades especiais deve ter no máximo 500 caracteres.')
    .optional()
    .nullable(),
  rescue_observations: z
    .string()
    .max(1000, 'Observações de resgate deve ter no máximo 1000 caracteres.')
    .optional()
    .nullable(),
  general_observations: z
    .string()
    .max(1000, 'Observações gerais deve ter no máximo 1000 caracteres.')
    .optional()
    .nullable(),
});

export const updateAnimalSchema = createAnimalSchema.extend({
  updated_at: z.string({ required_error: 'Campo updated_at é obrigatório para controle de concorrência.' }),
});

export const listAnimalsQuerySchema = z.object({
  status: z
    .enum(['available', 'in_adoption_process', 'adopted', 'inactive', 'all'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const confirmAdoptionSchema = z.object({
  responsibility_term_number: z
    .string({ required_error: 'Informe o número do termo de responsabilidade para confirmar a adoção.' })
    .trim()
    .min(1, 'Informe o número do termo de responsabilidade para confirmar a adoção.')
    .max(100, 'Número do termo deve ter no máximo 100 caracteres.'),
});
