import { z } from 'zod';

export const updateOngSchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos.').max(11, 'Telefone deve ter no máximo 11 dígitos.'))
    .optional(),
  address: z
    .string()
    .min(1, 'Informe o endereço.')
    .optional(),
  city: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres.')
    .optional(),
  state: z
    .string()
    .length(2, 'Use a sigla do estado (2 caracteres).')
    .optional(),
  description: z
    .string()
    .trim()
    .min(50, 'Descrição deve ter no mínimo 50 caracteres.')
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .optional(),
  mission: z
    .string()
    .trim()
    .min(50, 'Missão deve ter no mínimo 50 caracteres.')
    .max(300, 'Missão deve ter no máximo 300 caracteres.')
    .nullable()
    .optional(),
  capacity: z
    .number({ invalid_type_error: 'Capacidade deve ser um número inteiro maior que zero.' })
    .int('Capacidade deve ser um número inteiro maior que zero.')
    .min(1, 'Capacidade deve ser um número inteiro maior que zero.')
    .optional(),
  instagram: z
    .string()
    .refine((val) => val === '' || val.includes('instagram.com'), {
      message: 'Informe uma URL válida para Instagram.',
    })
    .nullable()
    .optional(),
  facebook: z
    .string()
    .refine((val) => val === '' || val.includes('facebook.com'), {
      message: 'Informe uma URL válida para Facebook.',
    })
    .nullable()
    .optional(),
  whatsapp: z
    .string()
    .refine((val) => val === '' || /^\d{10,11}$/.test(val), {
      message: 'WhatsApp deve ter 10 ou 11 dígitos numéricos.',
    })
    .nullable()
    .optional(),
});

export const updateOngAdminSchema = updateOngSchema.extend({
  name: z
    .string()
    .min(3, 'O nome da ONG deve ter no mínimo 3 caracteres.')
    .max(150, 'O nome da ONG deve ter no máximo 150 caracteres.')
    .optional(),
  cnpj: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().length(14, 'CNPJ deve ter 14 dígitos.'))
    .optional(),
});
