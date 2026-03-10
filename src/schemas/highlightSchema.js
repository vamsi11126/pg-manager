import { z } from 'zod';
import { optionalString } from './common';

export const highlightSchema = z.object({
    facilities: z.array(z.string().trim().min(2, 'Facility name must be at least 2 characters').max(40, 'Facility name must be at most 40 characters')).max(30, 'You can add up to 30 facilities'),
    neighborhoodDetails: optionalString(500),
    landingQr: z.string().optional().or(z.literal('')),
    galleryPhotos: z.array(z.object({
        id: z.string(),
        name: z.string().optional(),
        url: z.string()
    })).optional()
});

export const facilitySchema = z.object({
    facility: z.string().trim().min(2, 'Facility name must be at least 2 characters').max(40, 'Facility name must be at most 40 characters')
});
