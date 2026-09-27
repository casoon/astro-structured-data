import { ansiToHtml } from '@casoon/pages-theme/ansi';
import type { ShowcaseExample } from '@casoon/pages-theme/showcase';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { errorToAnsi, jsonToAnsi, renderExample } from './render';

// The example files live in ../examples; each is rendered here at build time by the package.
const sources = import.meta.glob<string>('../../examples/*.astro', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const components = import.meta.glob<AstroComponentFactory>('../../examples/*.astro', {
  import: 'default',
  eager: true,
});

const meta = [
  {
    slug: 'blog-post',
    title: 'Blog post',
    tags: ['BlogPosting', 'ArticleSchema'],
    description:
      'The reading time becomes an ISO 8601 duration, keywords a list, and mainEntityOfPage the page URL built from siteUrl.',
  },
  {
    slug: 'product',
    title: 'Product with offer and rating',
    tags: ['Product', 'ProductSchema'],
    description: 'A simple price becomes an Offer, rating value and count an AggregateRating.',
  },
  {
    slug: 'online-event',
    title: 'Online event',
    tags: ['Event', 'VirtualLocation', 'EventSchema'],
    description: 'With attendanceMode="Online" the stream URL is output as a VirtualLocation, as Google requires.',
  },
  {
    slug: 'remote-job',
    title: 'Remote job posting',
    tags: ['JobPosting', 'JobPostingSchema'],
    description: 'Fully remote positions use jobLocationType and applicantLocationRequirements instead of an address.',
  },
  {
    slug: 'local-business',
    title: 'Local business',
    tags: ['LocalBusiness', 'LocalBusinessSchema'],
    description: 'Address, coordinates and opening hours of a shop.',
  },
  {
    slug: 'recipe',
    title: 'Recipe',
    tags: ['Recipe', 'RecipeSchema'],
    description: 'Instruction steps with names become HowToStep items; durations stay ISO 8601.',
  },
  {
    slug: 'faq',
    title: 'FAQ page',
    tags: ['FAQPage', 'FAQSchema'],
    description: 'Question and answer pairs as a FAQPage with Question and Answer items.',
  },
  {
    slug: 'auto-breadcrumbs',
    title: 'Breadcrumbs from the URL',
    tags: ['BreadcrumbList', 'AutoBreadcrumbSchema'],
    description: 'Rendered on /en/blog/my-post/: the language prefix is skipped, segments get labels.',
    path: '/en/blog/my-post/',
  },
  {
    slug: 'invalid-event',
    title: 'Invalid props fail the build',
    tags: ['validation', 'EventSchema'],
    description:
      'A date that is not ISO 8601 and a currency that is not ISO 4217: the component throws with page, component and fields instead of rendering.',
    path: '/events/meetup/',
  },
];

export const examples: ShowcaseExample[] = await Promise.all(
  meta.map(async ({ path = '/', ...example }) => {
    const key = `../../examples/${example.slug}.astro`;
    const result = await renderExample(components[key], path);
    const ansi = result.ok ? result.jsonLd.map(jsonToAnsi).join('\n\n') : errorToAnsi(result.error);
    return {
      ...example,
      file: `examples/${example.slug}.astro`,
      input: { code: sources[key], lang: 'astro' },
      output: { html: ansiToHtml(ansi), kind: 'terminal' as const },
    };
  })
);
