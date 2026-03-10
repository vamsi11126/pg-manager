import { z } from 'zod';
import { emailSchema, phoneSchema, requiredString } from './common';

export const visitRequestSchema = z.object({
    name: requiredString('Name', 2, 80),
    email: emailSchema,
    phone: phoneSchema
});
