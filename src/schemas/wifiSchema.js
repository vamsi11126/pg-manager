import { z } from 'zod';
import { dateSchema, nonNegativeNumberFromInput, requiredString } from './common';

export const wifiSchema = z.object({
    floorName: requiredString('Floor name', 2, 40),
    username: requiredString('Username', 2, 80),
    password: requiredString('Password', 4, 80),
    amount: nonNegativeNumberFromInput('Monthly amount'),
    dueDate: dateSchema('Due date')
});
