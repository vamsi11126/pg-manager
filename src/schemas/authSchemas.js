import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema, requiredString } from './common';

export const ownerLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
});

export const tenantLoginSchema = ownerLoginSchema;

export const guardianLoginSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(1, 'Password is required')
});

export const inviteAdminSchema = z.object({
    email: emailSchema
});

export const adminPasswordSchema = z
    .object({
        newPassword: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm your password')
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Passwords do not match'
    });

export const registerAdminSchema = z
    .object({
        name: requiredString('Full name', 2, 80),
        password: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm your password')
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Passwords do not match'
    });
