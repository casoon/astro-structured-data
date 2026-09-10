import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as C from '../src/components/index.ts';
import { missingRecommended, validateRecommended, type SchemaType } from '../src/zod.ts';
import { address, render } from './helpers.ts';

const config = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('virtual:astro-structured-data/config', () => ({ getGlobalConfig: () => config.current }));

beforeEach(() => {
  config.current = { siteUrl: 'https://example.com', useGraph: false, generateMeta: false };
});

interface Case {
  name: string;
  component: any;
  type: SchemaType;
  minimal: Record<string, unknown>;
  /** Minimal props plus every recommended prop. */
  full: Record<string, unknown>;
}

const article = { title: 'Title', description: 'Description', datePublished: '2026-01-01', authorName: 'Ada' };
const event = { name: 'Meetup', startDate: '2026-05-01T18:00:00+02:00', locationName: 'Hall', locationAddress: address };
const job = { title: 'Developer', description: 'Build things', datePosted: '2026-01-01', hiringOrganizationName: 'ACME', jobLocation: address };
const product = { name: 'Gadget', description: 'A gadget', imageUrl: '/gadget.jpg' };
const recipe = { name: 'Cake', description: 'Tasty', imageUrl: '/cake.jpg', authorName: 'Ada', ingredients: ['Flour'], instructions: ['Bake'] };
const video = { name: 'Clip', description: 'A clip', thumbnailUrl: '/thumb.jpg', uploadDate: '2026-01-01', embedUrl: 'https://www.youtube.com/embed/x' };

const cases: Case[] = [
  {
    name: 'ArticleSchema', component: C.ArticleSchema, type: 'BlogPosting', minimal: article,
    full: { ...article, dateModified: '2026-01-02', imageUrl: '/img.jpg', publisherName: 'Pub', publisherLogo: '/logo.png' },
  },
  { name: 'AutoBreadcrumbSchema', component: C.AutoBreadcrumbSchema, type: 'BreadcrumbList', minimal: {}, full: {} },
  {
    name: 'BreadcrumbSchema', component: C.BreadcrumbSchema, type: 'BreadcrumbList',
    minimal: { items: [{ name: 'Home', url: '/' }] }, full: { items: [{ name: 'Home', url: '/' }] },
  },
  {
    name: 'CollectionPageSchema', component: C.CollectionPageSchema, type: 'CollectionPage',
    minimal: { name: 'Shop', description: 'All', products: [{ name: 'P', url: '/p' }] },
    full: { name: 'Shop', description: 'All', products: [{ name: 'P', url: '/p' }] },
  },
  {
    name: 'EventSchema', component: C.EventSchema, type: 'Event', minimal: event,
    full: {
      ...event, endDate: '2026-05-01T22:00:00+02:00', description: 'Talks', imageUrl: '/e.jpg',
      url: 'https://tickets.example.org/meetup', price: 0, priceCurrency: 'EUR', organizer: { name: 'Org' },
    },
  },
  {
    name: 'FAQSchema', component: C.FAQSchema, type: 'FAQPage',
    minimal: { questions: [{ question: 'Why?', answer: 'Because.' }] },
    full: { questions: [{ question: 'Why?', answer: 'Because.' }] },
  },
  {
    name: 'JobPostingSchema', component: C.JobPostingSchema, type: 'JobPosting', minimal: job,
    full: {
      ...job, validThrough: '2026-12-31', employmentType: 'FULL_TIME',
      baseSalary: { value: 50000, currency: 'EUR', unit: 'YEAR' }, identifier: { name: 'ACME', value: 'J-1' }, directApply: true,
    },
  },
  {
    name: 'LocalBusinessSchema', component: C.LocalBusinessSchema, type: 'LocalBusiness', minimal: { name: 'Shop' },
    full: {
      name: 'Shop', url: 'https://shop.example.org', imageUrl: '/shop.jpg', telephone: '+49 30 123', address,
      geo: { latitude: 52.5, longitude: 13.4 }, openingHours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-14:00'], sameAs: ['https://x.com/shop'],
    },
  },
  {
    name: 'OrganizationSchema', component: C.OrganizationSchema, type: 'Organization', minimal: { name: 'ACME' },
    full: { name: 'ACME', sameAs: ['https://x.com/acme'], telephone: '+49 30 123', email: 'info@acme.example', address },
  },
  {
    name: 'ProductSchema', component: C.ProductSchema, type: 'Product', minimal: product,
    full: { ...product, price: '19.99', priceCurrency: 'EUR', brand: 'Brand', sku: 'SKU-1', ratingValue: 4.5, reviewCount: 3 },
  },
  {
    name: 'ProfilePageSchema', component: C.ProfilePageSchema, type: 'ProfilePage', minimal: { name: 'Ada' },
    full: { name: 'Ada', description: 'Engineer', imageUrl: '/ada.jpg', sameAs: ['https://x.com/ada'] },
  },
  {
    name: 'RecipeSchema', component: C.RecipeSchema, type: 'Recipe', minimal: recipe,
    full: {
      ...recipe, prepTime: 'PT10M', cookTime: 'PT20M', recipeYield: 4, recipeCategory: 'Dessert',
      recipeCuisine: 'German', calories: 300, ratingValue: 4, reviewCount: 2,
    },
  },
  {
    name: 'SoftwareAppSchema', component: C.SoftwareAppSchema, type: 'SoftwareApplication', minimal: { name: 'App' },
    full: {
      name: 'App', description: 'Does things', url: 'https://app.example.org', operatingSystem: 'Web',
      applicationCategory: 'DeveloperApplication', price: 0, priceCurrency: 'EUR', ratingValue: 4, reviewCount: 10,
    },
  },
  {
    name: 'VideoSchema', component: C.VideoSchema, type: 'VideoObject', minimal: video,
    full: { ...video, duration: 'PT1M30S', contentUrl: '/clip.mp4', interactionCount: 5, publisher: { name: 'Pub' } },
  },
  {
    name: 'WebPageSchema', component: C.WebPageSchema, type: 'WebPage', minimal: { title: 'Page' },
    full: {
      title: 'Page', description: 'About', datePublished: '2026-01-01', dateModified: '2026-01-02',
      image: '/page.jpg', author: { name: 'Ada' },
    },
  },
  { name: 'WebSiteSchema', component: C.WebSiteSchema, type: 'WebSite', minimal: { name: 'Site' }, full: { name: 'Site' } },
];

describe.each(cases)('$name', ({ name, component, type, minimal, full }) => {
  test('renders one JSON-LD block of the expected type and registers it', async () => {
    const locals: Record<string, any> = {};
    const { scripts } = await render(component, minimal, locals);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].data['@context']).toBe('https://schema.org');
    expect(scripts[0].data['@type']).toBe(type);
    expect(locals.structuredDataGraph.map((item: any) => item['@type'])).toEqual([type]);
  });

  test('passes sitemap props as data attributes, not as JSON-LD', async () => {
    const { scripts } = await render(component, { ...minimal, changefreq: 'weekly', priority: 0.7 });

    expect(scripts[0].attrs).toContain('data-sitemap-changefreq="weekly"');
    expect(scripts[0].attrs).toContain('data-sitemap-priority="0.7"');
    expect(scripts[0].data).not.toHaveProperty('changefreq');
    expect(scripts[0].data).not.toHaveProperty('priority');
  });

  test('renders no sitemap attributes without sitemap props', async () => {
    const { scripts } = await render(component, minimal);
    expect(scripts[0].attrs).toBe('');
  });

  test('ignores attributes Astro adds itself (scoped-style ids)', async () => {
    const { scripts } = await render(component, { ...minimal, 'data-astro-cid-kjarsomr': true });
    expect(scripts[0].data).not.toHaveProperty('data-astro-cid-kjarsomr');
  });

  test('rejects unknown props', async () => {
    await expect(render(component, { ...minimal, bogus: true })).rejects.toThrow(
      new RegExp(`<${name}> on /blog/post/ received invalid props[\\s\\S]*bogus`)
    );
  });

  test('rejects invalid sitemap props', async () => {
    await expect(render(component, { ...minimal, priority: 2 })).rejects.toThrow(/priority/);
    await expect(render(component, { ...minimal, changefreq: 'sometimes' })).rejects.toThrow(/changefreq/);
  });

  test('covers every recommended field when all recommended props are given', async () => {
    const { scripts } = await render(component, full);

    expect(validateRecommended(type, full)).toEqual([]);
    expect(missingRecommended(scripts[0].data)).toEqual([]);
  });
});

describe('output safety', () => {
  test('escapes content that would close the script block', async () => {
    const title = '</script><script>alert(1)</script>';
    const { html, scripts } = await render(C.ArticleSchema, { ...article, title });

    expect(html).not.toContain('<script>alert(1)');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].data.headline).toBe(title);
  });

  test('builds page URLs from siteUrl, not from the request origin', async () => {
    const { scripts } = await render(C.ArticleSchema, article);
    expect(scripts[0].data.mainEntityOfPage['@id']).toBe('https://example.com/blog/post/');

    const webPage = await render(C.WebPageSchema, { title: 'Page' });
    expect(webPage.scripts[0].data.url).toBe('https://example.com/blog/post/');
  });

  test('accepts Date objects and outputs ISO strings', async () => {
    const { scripts } = await render(C.ArticleSchema, { ...article, datePublished: new Date('2026-01-02T10:00:00Z') });
    expect(scripts[0].data.datePublished).toBe('2026-01-02T10:00:00.000Z');
  });

  test('keeps meta-only WebPage fields out of the JSON-LD but on the registered item', async () => {
    const locals: Record<string, any> = {};
    const alternates = [{ href: 'https://example.com/en/post/', hreflang: 'en' }];
    const { scripts } = await render(C.WebPageSchema, { title: 'Page', robots: 'noindex, nofollow', alternates }, locals);

    expect(scripts[0].data).not.toHaveProperty('robots');
    expect(scripts[0].data).not.toHaveProperty('alternates');
    expect(locals.structuredDataGraph[0]).toMatchObject({ robots: 'noindex, nofollow', alternates });
  });

  test('SchemaGraph renders nothing in inline mode', async () => {
    const locals: Record<string, any> = {};
    await render(C.ArticleSchema, article, locals);
    const { html } = await render(C.SchemaGraph, {}, locals);
    expect(html.trim()).toBe('');
  });
});

describe('no fabricated or dropped data', () => {
  test('Article omits the publisher instead of emitting an empty name', async () => {
    const { scripts } = await render(C.ArticleSchema, article);
    expect(scripts[0].data).not.toHaveProperty('publisher');
  });

  test('Article uses defaultArticlePublisher', async () => {
    config.current.defaultArticlePublisher = { name: 'Pub', logo: { url: '/logo.png' } };
    const { scripts } = await render(C.ArticleSchema, article);
    expect(scripts[0].data.publisher).toEqual({ '@type': 'Organization', name: 'Pub', logo: { '@type': 'ImageObject', url: '/logo.png' } });
  });

  test('Article rejects a publisher logo without a publisher name', async () => {
    await expect(render(C.ArticleSchema, { ...article, publisherLogo: '/logo.png' })).rejects.toThrow(/publisherLogo/);
  });

  test('Organization requires a name and never emits an empty logo', async () => {
    await expect(render(C.OrganizationSchema, {})).rejects.toThrow(/Missing organization name/);
    const { scripts } = await render(C.OrganizationSchema, { name: 'ACME' });
    expect(scripts[0].data).not.toHaveProperty('logo');
    expect(scripts[0].data.url).toBe('https://example.com');
  });

  test('LocalBusiness requires a name (prop or default)', async () => {
    await expect(render(C.LocalBusinessSchema, {})).rejects.toThrow(/Missing business name/);
    config.current.defaultLocalBusiness = { name: 'Default Shop', telephone: '+49 30 1' };
    const { scripts } = await render(C.LocalBusinessSchema, {});
    expect(scripts[0].data).toMatchObject({ name: 'Default Shop', telephone: '+49 30 1' });
  });

  test('JobPosting does not invent employmentType and requires a hiring organization', async () => {
    const { scripts } = await render(C.JobPostingSchema, job);
    expect(scripts[0].data).not.toHaveProperty('employmentType');
    const { hiringOrganizationName: _, ...withoutOrg } = job;
    await expect(render(C.JobPostingSchema, withoutOrg)).rejects.toThrow(/Missing hiring organization/);
  });

  test('SoftwareApp does not invent operatingSystem or applicationCategory', async () => {
    const { scripts } = await render(C.SoftwareAppSchema, { name: 'App' });
    expect(scripts[0].data).not.toHaveProperty('operatingSystem');
    expect(scripts[0].data).not.toHaveProperty('applicationCategory');
  });

  test('Event keeps a price of 0 (free event)', async () => {
    const { scripts } = await render(C.EventSchema, { ...event, price: 0, priceCurrency: 'EUR' });
    expect(scripts[0].data.offers).toMatchObject({ price: 0, priceCurrency: 'EUR', url: 'https://example.com/blog/post/' });
  });

  test('Product keeps a rating of 0', async () => {
    const { scripts } = await render(C.ProductSchema, { ...product, ratingValue: 0, reviewCount: 1 });
    expect(scripts[0].data.aggregateRating).toMatchObject({ ratingValue: 0, reviewCount: 1 });
  });
});

describe('event locations', () => {
  const stream = 'https://stream.example.org/live';
  const online = { name: 'Webinar', startDate: '2026-05-01T18:00:00+02:00', attendanceMode: 'Online', onlineUrl: stream };

  test('offline events have a Place', async () => {
    const { scripts } = await render(C.EventSchema, event);
    expect(scripts[0].data.location).toEqual({
      '@type': 'Place',
      name: 'Hall',
      address: { '@type': 'PostalAddress', ...address },
    });
    expect(scripts[0].data.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
  });

  test('online events have a VirtualLocation and no invented address', async () => {
    const { scripts } = await render(C.EventSchema, online);
    expect(scripts[0].data.location).toEqual({ '@type': 'VirtualLocation', url: stream });
    expect(scripts[0].data.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
  });

  test('mixed events have both', async () => {
    const { scripts } = await render(C.EventSchema, { ...event, attendanceMode: 'Mixed', onlineUrl: stream });
    expect(scripts[0].data.location.map((l: any) => l['@type'])).toEqual(['Place', 'VirtualLocation']);
    expect(scripts[0].data.location[1]).toEqual({ '@type': 'VirtualLocation', url: stream });
    expect(scripts[0].data.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode');
  });

  test.each([
    ['online event with a venue', { ...online, locationName: 'Hall', locationAddress: address }, /locationName[\s\S]*Not allowed for Online events/],
    ['online event without onlineUrl', { ...online, onlineUrl: undefined }, /onlineUrl[\s\S]*Required for Online events|Required for Online events[\s\S]*onlineUrl/],
    ['offline event with onlineUrl', { ...event, onlineUrl: stream }, /onlineUrl/],
    ['offline event without venue', { name: 'Meetup', startDate: '2026-05-01' }, /locationName/],
    ['mixed event without venue', { ...online, attendanceMode: 'Mixed' }, /locationAddress/],
    ['mixed event without onlineUrl', { ...event, attendanceMode: 'Mixed' }, /onlineUrl/],
    ['stream URL that is not http(s)', { ...online, onlineUrl: 'rtmp://stream.example.org/live' }, /onlineUrl/],
  ])('rejects %s', async (_label, props, message) => {
    await expect(render(C.EventSchema, props)).rejects.toThrow(message);
  });
});

describe('invalid data fails the build', () => {
  const invalid: Array<[string, any, Record<string, unknown>, RegExp]> = [
    ['non-ISO date', C.ArticleSchema, { ...article, datePublished: '01.02.2026' }, /datePublished/],
    ['empty title', C.ArticleSchema, { ...article, title: '   ' }, /title/],
    ['image details without image', C.ArticleSchema, { ...article, imageWidth: 800 }, /imageWidth/],
    ['author URL with several authors', C.ArticleSchema, { ...article, authorName: ['A', 'B'], authorUrl: '/a' }, /authorUrl/],
    ['modified before published', C.ArticleSchema, { ...article, dateModified: '2025-12-31' }, /dateModified/],
    ['relative URL without leading slash', C.ArticleSchema, { ...article, imageUrl: 'img.jpg' }, /imageUrl/],
    ['javascript: URL', C.EventSchema, { ...event, url: 'javascript:alert(1)' }, /url/],
    ['lower-case currency', C.EventSchema, { ...event, price: 10, priceCurrency: 'eur' }, /priceCurrency/],
    ['price without currency', C.EventSchema, { ...event, price: 10 }, /priceCurrency/],
    ['end before start', C.EventSchema, { ...event, endDate: '2026-04-30' }, /endDate/],
    ['offers and price together', C.ProductSchema, { ...product, offers: { price: 1 }, price: 1, priceCurrency: 'EUR' }, /offers/],
    ['availability without price', C.ProductSchema, { ...product, availability: 'InStock' }, /availability/],
    ['rating without review count', C.RecipeSchema, { ...recipe, ratingValue: 4 }, /reviewCount/],
    ['non-ISO duration', C.RecipeSchema, { ...recipe, prepTime: '30 min' }, /prepTime/],
    ['salary without unit', C.JobPostingSchema, { ...job, baseSalary: { value: 50000, currency: 'EUR' } }, /unit/],
    ['remote job without applicant location', C.JobPostingSchema, { ...job, jobLocation: undefined, jobLocationType: 'TELECOMMUTE' }, /applicantLocationRequirements/],
    ['video without content or embed URL', C.VideoSchema, { ...video, embedUrl: undefined }, /contentUrl/],
    ['opening hours in free text', C.LocalBusinessSchema, { name: 'Shop', openingHours: ['weekdays'] }, /openingHours/],
    ['empty FAQ', C.FAQSchema, { questions: [] }, /questions/],
    ['breadcrumb without name', C.BreadcrumbSchema, { items: [{ url: '/' }] }, /name/],
    ['unknown nested key', C.EventSchema, { ...event, organizer: { name: 'O', website: 'https://o.example' } }, /website/],
  ];

  test.each(invalid)('%s', async (_label, component, props, message) => {
    await expect(render(component, props)).rejects.toThrow(message);
  });

  test('Schema requires an @type', async () => {
    await expect(render(C.Schema, { item: { name: 'x' } })).rejects.toThrow(/@type/);
  });

  test('Schema rejects sitemap hints that disagree between item and props', async () => {
    await expect(render(C.Schema, { item: { '@type': 'Thing', changefreq: 'daily' }, changefreq: 'weekly' }))
      .rejects.toThrow(/Conflicting sitemap changefreq/);
  });
});
