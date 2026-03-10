import { z } from 'zod';
import { nonNegativeNumberFromInput, positiveNumberFromInput } from './common';

export const electricityRateSchema = z.object({
    eBillRate: positiveNumberFromInput('Rate per unit')
});

export const electricityInitialReadingSchema = z.object({
    initialReading: nonNegativeNumberFromInput('Initial reading')
});

export const electricityCurrentReadingSchema = z.object({
    currentReading: positiveNumberFromInput('Current reading')
});
