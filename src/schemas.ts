import { z } from 'zod';

export const logSchema = z.object({
  service_name: z.string().min(1),
  log_level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL']),
  message: z.string(),
  environment: z.string().optional().default('production'),
  timestamp: z.string().optional(),
}).passthrough();