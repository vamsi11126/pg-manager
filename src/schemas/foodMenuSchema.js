import { z } from 'zod';
import { dayOfWeekSchema, nonNegativeNumberFromInput, requiredString } from './common';

export const foodMenuDaySchema = z.object({
    day: dayOfWeekSchema,
    breakfast: requiredString('Breakfast', 2, 120),
    lunch: requiredString('Lunch', 2, 120),
    dinner: requiredString('Dinner', 2, 120)
});

export const foodMenuSchema = z.object({
    foodAmount: nonNegativeNumberFromInput('Monthly food amount'),
    foodMenu: z.array(foodMenuDaySchema).length(7, 'Weekly menu must contain 7 days')
});
