import { z } from 'zod';
import { optionalUrlSchema, requiredString } from './common';

export const pgSchema = z.object({
    name: requiredString('PG name', 2, 80),
    address: requiredString('Address', 10, 300),
    mapLink: optionalUrlSchema
});
