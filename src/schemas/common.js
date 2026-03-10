import { z } from 'zod';
import { validateAadhaar } from '../utils/aadhaar';

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : value);
const toNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return value;
        return Number(trimmed);
    }
    return value;
};

export const requiredString = (label, min = 1, max = 200) =>
    z
        .string({ required_error: `${label} is required` })
        .trim()
        .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
        .max(max, `${label} must be at most ${max} characters`);

export const optionalString = (max = 500) =>
    z
        .string()
        .trim()
        .max(max, `Must be at most ${max} characters`)
        .optional()
        .or(z.literal(''));

export const emailSchema = z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase());

export const phoneSchema = z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .refine((value) => /^\d{10}$/.test(value.replace(/\D/g, '')), 'Phone number must be exactly 10 digits')
    .transform((value) => value.replace(/\D/g, ''));

export const aadhaarSchema = z
    .string({ required_error: 'Aadhaar number is required' })
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => validateAadhaar(value).isValid, {
        message: 'Enter a valid Aadhaar number'
    });

export const dateSchema = (label) =>
    z
        .string({ required_error: `${label} is required` })
        .trim()
        .min(1, `${label} is required`)
        .refine((value) => !Number.isNaN(Date.parse(value)), `${label} must be a valid date`);

export const positiveNumberFromInput = (label, min = 0.01) =>
    z.preprocess(
        toNumber,
        z
            .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a valid number` })
            .refine((value) => Number.isFinite(value), `${label} must be a valid number`)
            .min(min, `${label} must be greater than ${min === 0 ? 'or equal to 0' : 0}`)
    );

export const nonNegativeNumberFromInput = (label) =>
    z.preprocess(
        toNumber,
        z
            .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a valid number` })
            .refine((value) => Number.isFinite(value), `${label} must be a valid number`)
            .min(0, `${label} must be 0 or more`)
    );

export const positiveIntegerFromInput = (label, min = 1) =>
    z.preprocess(
        toNumber,
        z
            .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a valid number` })
            .int(`${label} must be a whole number`)
            .min(min, `${label} must be at least ${min}`)
    );

export const optionalUrlSchema = z
    .union([
        z.literal(''),
        z
            .string()
            .trim()
            .url('Enter a valid URL')
    ])
    .optional();

export const passwordSchema = z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include at least one symbol');

export const roomNumbersTextSchema = z
    .string({ required_error: 'Room numbers are required' })
    .trim()
    .min(1, 'Room numbers are required')
    .refine((value) => value.split(',').map((item) => item.trim()).filter(Boolean).length > 0, 'Add at least one room number')
    .refine((value) => {
        const rooms = value.split(',').map((item) => item.trim()).filter(Boolean);
        return new Set(rooms.map((room) => room.toLowerCase())).size === rooms.length;
    }, 'Room numbers must be unique');

export const sharingTypeSchema = z.enum(['1 sharing', '2 sharing', '3 sharing', '4 sharing']);

export const dayOfWeekSchema = z.enum([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
]);

export const normalizeTrimmedString = toTrimmedString;
