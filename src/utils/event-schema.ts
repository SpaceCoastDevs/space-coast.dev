import { z } from 'astro/zod';

export const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }).optional(),
  attendanceMode: z.enum(['inPerson', 'online', 'mixed']).default('inPerson'),
  location: z
    .object({
      name: z.string().min(1),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      postalCode: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  organizer: z.object({
    name: z.string().min(1),
    url: z.string().url(),
  }),
  sourceUrl: z.string().url(),
  calendarId: z.string().min(1).optional(),
  sourceIdentity: z
    .object({
      provider: z.enum(['meetup', 'eventbrite', 'luma']),
      id: z.string().min(1),
    })
    .optional(),
  imageUrl: z.union([z.string().url(), z.string().startsWith('/')]).optional(),
  cost: z
    .object({
      type: z.enum(['free', 'paid']),
      amount: z.number().nonnegative().optional(),
      maximumAmount: z.number().nonnegative().optional(),
      currency: z.string().length(3).optional(),
    })
    .optional(),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  featured: z.boolean().optional(),
});
