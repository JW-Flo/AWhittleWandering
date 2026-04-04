import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().positive().optional()
});

export type Task = z.infer<typeof TaskSchema>;
