import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ownerId: z.string().uuid(),
  status: z.enum(['planning', 'in-progress', 'completed', 'on-hold']),
  startDate: z.date(),
  endDate: z.date().optional(),
  budget: z.number().positive().optional(),
  tags: z.array(z.string()).optional()
});

export type Project = z.infer<typeof ProjectSchema>;
