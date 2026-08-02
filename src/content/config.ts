import { z, defineCollection } from 'astro:content';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

const eventCollection = defineCollection({
  type: 'data',
  schema: z.object({
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
    imageUrl: z.string().url().optional(),
    cost: z
      .object({
        type: z.enum(['free', 'paid']),
        amount: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      })
      .optional(),
    description: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
  }),
});

export const collections = {
  post: postCollection,
  event: eventCollection,
};
