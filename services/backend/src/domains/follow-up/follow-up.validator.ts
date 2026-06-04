import { z } from 'zod';

export const registerContactSchema = z.object({
  contact_date: z
    .string({ required_error: 'A data do contato é obrigatória.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD.'),
  status: z.enum(['positive', 'neutral', 'negative', 'no_response'], {
    errorMap: () => ({ message: 'O status deve ser: positive, neutral, negative ou no_response.' }),
  }),
  observation: z
    .string({ required_error: 'A observação é obrigatória.' })
    .min(10, 'A observação deve ter no mínimo 10 caracteres.')
    .max(1000, 'A observação deve ter no máximo 1000 caracteres.'),
});

export const editContactSchema = z.object({
  observation: z
    .string({ required_error: 'A observação é obrigatória.' })
    .min(10, 'A observação deve ter no mínimo 10 caracteres.')
    .max(1000, 'A observação deve ter no máximo 1000 caracteres.'),
});

export const reminderIdParamSchema = z.object({
  id: z.string({ required_error: 'ID do lembrete é obrigatório.' }).uuid('ID do lembrete inválido.'),
});

export const contactIdParamSchema = z.object({
  id: z.string({ required_error: 'ID do contato é obrigatório.' }).uuid('ID do contato inválido.'),
});

export const adoptionRequestIdParamSchema = z.object({
  adoptionRequestId: z
    .string({ required_error: 'ID do pedido de adoção é obrigatório.' })
    .uuid('ID do pedido de adoção inválido.'),
});

export const followUpListQuerySchema = z.object({
  status: z.enum(['pending', 'overdue', 'completed', 'cancelled', 'all']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
