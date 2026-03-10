import { z } from 'zod';
import { optionalString, positiveNumberFromInput, requiredString } from './common';

export const paymentTicketSchema = z.object({
    ticketType: requiredString('Bill type', 2, 20),
    ticketAmount: positiveNumberFromInput('Amount'),
    ticketNote: optionalString(120)
});
