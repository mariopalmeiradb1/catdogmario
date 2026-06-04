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

export const listAdopterHistoryQuerySchema = z.object({
  status: z
    .enum(['pending', 'in_review', 'approved', 'rejected', 'cancelled', 'completed', 'all'])
    .optional(),
  date_from: z.string().datetime({ message: 'Data inicial inválida.' }).optional(),
  date_to: z.string().datetime({ message: 'Data final inválida.' }).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const rejectAdoptionRequestSchema = z.object({
  rejection_reason: z
    .string()
    .trim()
    .min(10, 'A justificativa deve ter pelo menos 10 caracteres.')
    .max(1000, 'A justificativa deve ter no máximo 1000 caracteres.'),
});

export const scheduleVisitSchema = z.object({
  visit_date: z.string().datetime({ message: 'Data da visita inválida. Use formato ISO 8601.' }),
  notes: z.string().trim().max(500, 'As observações devem ter no máximo 500 caracteres.').optional(),
});

export const completeVisitSchema = z.object({
  completed_at: z.string().datetime({ message: 'Data de realização inválida. Use formato ISO 8601.' }),
  evaluation: z.enum(['positive', 'neutral', 'negative'], {
    errorMap: () => ({ message: 'A avaliação deve ser: positiva, neutra ou negativa.' }),
  }),
  observations: z.string().trim().max(2000, 'As observações devem ter no máximo 2000 caracteres.').optional(),
});

export const visitIdParamSchema = z.object({
  visitId: z.string({ required_error: 'ID da visita é obrigatório.' }).uuid('ID da visita inválido.'),
});
