import { z } from 'zod';
import {
    positiveNumberFromInput,
    requiredString,
    roomNumbersTextSchema,
    sharingTypeSchema
} from './common';

const roomPhotoSchema = z.object({
    id: requiredString('Photo id', 1, 100),
    name: z.string().optional(),
    url: requiredString('Photo URL', 1, 100000)
});

export const roomCategorySchema = z.object({
    type: sharingTypeSchema,
    price: positiveNumberFromInput('Monthly price'),
    attachedBath: z.boolean(),
    isAC: z.boolean(),
    withFood: z.boolean(),
    floorName: requiredString('Floor level', 2, 40),
    roomNumbers: roomNumbersTextSchema,
    photos: z.array(roomPhotoSchema).optional()
});
