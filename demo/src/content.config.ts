import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// @ts-ignore
import { articleZodSchema } from 'astro-structured-data/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: articleZodSchema,
});

export const collections = { blog };
