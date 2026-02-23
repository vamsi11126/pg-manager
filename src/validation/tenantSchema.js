import { z } from 'zod';
import { validateAadhaar } from '../utils/aadhaar';

const requiredText = (label) =>
    z.string().trim().min(1, `${label} is required`);

const positiveNumberLike = (label) =>
    z
        .union([z.string(), z.number()])
        .transform((value) => Number(value))
        .refine((value) => Number.isFinite(value) && value > 0, `${label} must be greater than 0`);

const aadhaarSchema = z
    .string()
    .trim()
    .refine((value) => validateAadhaar(value).isValid, {
        message: 'Invalid Aadhaar number'
    });

export const tenantSchema = z.object({
    name: requiredText('Name'),
    phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    email: z.string().trim().email('Enter a valid email address'),
    profession: requiredText('Profession'),
    aadhar: aadhaarSchema,
    roomNumber: requiredText('Room number'),
    rent: positiveNumberLike('Rent'),
    advance: positiveNumberLike('Advance'),
    joiningDate: requiredText('Joining date'),
    withFood: z.boolean()
});

