import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['admin', 'user', 'manager']),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  isActive: z.boolean().default(true)
});

export type User = z.infer<typeof UserSchema>;
