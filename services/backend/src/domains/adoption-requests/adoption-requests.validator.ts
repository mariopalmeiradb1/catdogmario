import { z } from 'zod';

export const createAdoptionRequestSchema = z.object({
  animal_id: z.string({ required_error: 'ID do animal é obrigatório.' }).uuid('ID do animal inválido.'),
});

export const listAdoptionRequestsQuerySchema = z.object({
  status: z
    .enum(['pending', 'in_review', 'approved', 'rejected', 'cancelled', 'completed', 'all'])
    .optional(),
  animal_id: z.string().uuid('ID do animal inválido.').optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const adoptionRequestIdParamSchema = z.object({
  id: z.string({ required_error: 'ID do pedido é obrigatório.' }).uuid('ID do pedido inválido.'),
});

export const rejectAdoptionRequestSchema = z.object({
  rejection_reason: z
    .string()
    .trim()
    .min(10, 'A justificativa deve ter pelo menos 10 caracteres.')
    .max(1000, 'A justificativa deve ter no máximo 1000 caracteres.'),
});
