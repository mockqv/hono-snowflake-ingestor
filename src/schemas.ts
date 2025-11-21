import { z } from 'zod';

/**
 * Zod schema for validating incoming log data.
 * This ensures that ingested logs conform to a defined structure,
 * providing type safety and data integrity.
 *
 * It uses `.passthrough()` to allow additional, unvalidated fields
 * to be present in the incoming data without causing validation errors.
 */
export const logSchema = z.object({
  service_name: z.string().min(1),
  log_level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL']),
  message: z.string(),
  environment: z.string().optional().default('production'),
  timestamp: z.string().optional(),
}).passthrough();