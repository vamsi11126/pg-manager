import { z } from 'zod';
import { passwordSchema, phoneSchema, requiredString } from './common';

export const guardianSchema = z
    .object({
        guardianName: requiredString('Guardian name', 2, 80),
        phone: phoneSchema,
        password: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm the password')
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Passwords do not match'
    });
