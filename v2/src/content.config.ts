import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/post' }),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        updated: z.coerce.date().optional(),
        categories: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
        image: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        toc: z.boolean().default(true),
        comments: z.boolean().default(true),
    }),
});

export const collections = { posts };
