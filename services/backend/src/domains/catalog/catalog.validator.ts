import { z } from 'zod';

export const catalogQuerySchema = z.object({
  search: z.string().max(100).optional(),
  species: z.enum(['dog', 'cat']).optional(),
  breed: z.string().max(100).optional(),
  age: z.coerce.number().int().positive().optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  sex: z.enum(['male', 'female']).optional(),
  temperament: z.string().max(100).optional(),
  special_needs: z
    .enum(['true'])
    .optional()
    .transform((v) => (v === 'true' ? true : undefined)),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
