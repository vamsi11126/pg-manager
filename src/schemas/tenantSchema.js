import { z } from 'zod';
import {
    aadhaarSchema,
    dateSchema,
    emailSchema,
    optionalString,
    phoneSchema,
    positiveNumberFromInput,
    requiredString
} from './common';

export const tenantSchema = z.object({
    name: requiredString('Full name', 2, 80),
    phone: phoneSchema,
    email: emailSchema,
    profession: requiredString('Profession', 2, 80),
    aadhar: aadhaarSchema,
    pgId: optionalString(100),
    roomNumber: requiredString('Room number', 1, 20),
    rent: positiveNumberFromInput('Monthly rent'),
    advance: positiveNumberFromInput('Advance amount'),
    joiningDate: dateSchema('Joining date'),
    withFood: z.boolean(),
    newPassword: z.union([z.literal(''), optionalString(100)]).optional()
});
