import { z } from 'zod';
import type { Brand, MerchantReturnPolicy, Offer, OfferShippingDetails } from 'schema-dts';

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** Non-empty text; whitespace-only values are rejected. */
const text = z.string().trim().min(1, 'Must not be empty');

/** Absolute http(s) URL. */
const httpUrl = z.url({ protocol: /^https?$/, error: 'Must be an absolute http(s) URL' });

/** Absolute http(s) URL or root-relative path. */
const link = z.union([httpUrl, z.string().regex(/^\/(?!\/)/)], {
  error: 'Must be an absolute http(s) URL or a root-relative path starting with "/"',
});

const isoDateString = z.union([z.iso.date(), z.iso.datetime({ offset: true, local: true })], {
  error: 'Must be an ISO 8601 date (YYYY-MM-DD) or date-time',
});

/** ISO 8601 date/date-time string or Date; always output as an ISO string. */
const dateOrStringSchema = z
  .union([isoDateString, z.date()])
  .transform((val) => (typeof val === 'string' ? val : val.toISOString()));

const isoDuration = z.iso.duration({ error: 'Must be an ISO 8601 duration like "PT1H30M"' });
const currency = z.string().regex(/^[A-Z]{3}$/, 'Must be an ISO 4217 currency code like "EUR"');
const priceValue = z.union([
  z.number().nonnegative(),
  z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric price like "19.99"'),
]);
const languageTag = z.string().regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/, 'Must be a BCP 47 language tag like "de" or "de-DE"');
const imageMimeType = z.string().regex(/^image\/[a-z0-9.+-]+$/i, 'Must be an image MIME type like "image/jpeg"');
const rating = z.number().min(0).max(5);
const positiveInt = z.number().int().positive();
const authorType = z.enum(['Person', 'Organization']);
const availability = z.enum(['InStock', 'OutOfStock', 'PreOrder', 'OnlineOnly']);
const oneOrMore = <T extends z.ZodType>(schema: T) => z.union([schema, z.array(schema).min(1)]);

const postalAddress = z.strictObject({
  streetAddress: text,
  addressLocality: text,
  addressRegion: text.optional(),
  postalCode: text,
  addressCountry: text,
});

const day = '(Mo|Tu|We|Th|Fr|Sa|Su)';
const dayRange = `${day}(-${day})?`;
const time = '([01]\\d|2[0-4]):[0-5]\\d';
const openingHoursSpec = z.string().regex(
  new RegExp(`^${dayRange}(,${dayRange})*( ${time}-${time})?$`),
  'Must use the schema.org format like "Mo-Fr 09:00-18:00"'
);

const isPlainObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);
/** Free-form schema.org object passed through to the output as-is. */
const schemaObject = <T>() => z.custom<T>(isPlainObject, { error: 'Must be an object' });

/**
 * Marks a prop as recommended. `output` is the schema.org property (dot path) the prop
 * produces — the single source for both `validateRecommended` and the build-time check.
 */
function recommended<T extends z.ZodType>(schema: T, output: string): T {
  return schema.meta({ recommended: output });
}

// ---------------------------------------------------------------------------
// Cross-field rules
// ---------------------------------------------------------------------------

type Data = Record<string, unknown>;

/** Either all of `fields` are set or none. */
function requireTogether(data: Data, ctx: z.RefinementCtx, fields: string[]) {
  const present = fields.filter((f) => data[f] !== undefined);
  if (present.length === 0 || present.length === fields.length) return;
  for (const field of fields.filter((f) => data[f] === undefined)) {
    ctx.addIssue({ code: 'custom', path: [field], message: `Required when "${present.join('", "')}" is set` });
  }
}

/** `dependents` may only be set when `field` is set. */
function requireWith(data: Data, ctx: z.RefinementCtx, field: string, dependents: string[]) {
  if (data[field] !== undefined) return;
  for (const dependent of dependents.filter((d) => data[d] !== undefined)) {
    ctx.addIssue({ code: 'custom', path: [dependent], message: `Only allowed together with "${field}"` });
  }
}

function atMostOne(data: Data, ctx: z.RefinementCtx, fields: string[]) {
  const present = fields.filter((f) => data[f] !== undefined);
  if (present.length > 1) {
    ctx.addIssue({ code: 'custom', path: [present[1]], message: `Use only one of "${fields.join('", "')}"` });
  }
}

/** `later` must not be before `earlier` (both ISO strings after parsing). */
function notBefore(data: Data, ctx: z.RefinementCtx, earlier: string, later: string) {
  const a = data[earlier];
  const b = data[later];
  if (typeof a === 'string' && typeof b === 'string' && Date.parse(b) < Date.parse(a)) {
    ctx.addIssue({ code: 'custom', path: [later], message: `Must not be before "${earlier}"` });
  }
}

const IMAGE_DETAIL_FIELDS = ['imageWidth', 'imageHeight', 'imageFormat', 'imageCaption'];

// ---------------------------------------------------------------------------
// Component schemas
// ---------------------------------------------------------------------------

// Sitemap hints accepted by every component (encoded as data-attributes, not JSON-LD).
export const sitemapShape = {
  changefreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).optional(),
  priority: z.number().min(0).max(1).optional(),
};
export type SitemapProps = z.input<z.ZodObject<typeof sitemapShape>>;

// 1. Article
export const articleZodSchema = z.object({
  title: text,
  description: text,
  datePublished: dateOrStringSchema,
  dateModified: recommended(dateOrStringSchema.optional(), 'dateModified'),
  authorName: oneOrMore(text),
  authorType: authorType.optional(),
  authorUrl: link.optional(),
  authorId: text.optional(),
  imageUrl: recommended(link.optional(), 'image'),
  imageWidth: positiveInt.optional(),
  imageHeight: positiveInt.optional(),
  imageFormat: imageMimeType.optional(),
  imageCaption: text.optional(),
  publisherName: recommended(text.optional(), 'publisher'),
  publisherLogo: recommended(link.optional(), 'publisher.logo'),
  schemaType: z.enum(['Article', 'BlogPosting', 'NewsArticle']).optional(),
  inLanguage: languageTag.optional(),
  articleSection: text.optional(),
  keywords: oneOrMore(text).optional(),
  wordCount: positiveInt.optional(),
  readingTimeMinutes: positiveInt.optional(),
  isAccessibleForFree: z.boolean().optional(),
  isPartOfHeadline: text.optional(),
  isPartOfUrl: link.optional(),
  seriesPosition: positiveInt.optional(),
  hasPart: z.array(z.strictObject({
    headline: text,
    url: link,
    position: positiveInt.optional(),
  })).min(1).optional(),
}).superRefine((data, ctx) => {
  requireWith(data, ctx, 'imageUrl', IMAGE_DETAIL_FIELDS);
  requireTogether(data, ctx, ['isPartOfHeadline', 'isPartOfUrl']);
  requireWith(data, ctx, 'isPartOfUrl', ['seriesPosition']);
  if (Array.isArray(data.authorName)) {
    for (const field of ['authorUrl', 'authorId'] as const) {
      if (data[field] !== undefined) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'Not supported with multiple authors' });
      }
    }
  }
  notBefore(data, ctx, 'datePublished', 'dateModified');
});

// 2. FAQ
export const faqZodSchema = z.object({
  questions: z.array(
    z.strictObject({
      question: text,
      answer: text,
    })
  ).min(1, 'At least one question is required'),
});

// 3. Product
const offerObject = schemaObject<Omit<Offer, '@context'>>();
export const productZodSchema = z.object({
  name: text,
  description: text,
  imageUrl: oneOrMore(link),
  // Simple offer fields
  price: recommended(priceValue.optional(), 'offers'),
  priceCurrency: recommended(currency.optional(), 'offers'),
  availability: availability.optional(),
  // Advanced offer structures
  offers: oneOrMore(offerObject).optional(),
  priceRange: z.strictObject({
    lowPrice: priceValue,
    highPrice: priceValue,
    priceCurrency: currency,
    offerCount: positiveInt.optional(),
  }).refine((range) => Number(range.lowPrice) <= Number(range.highPrice), {
    message: 'lowPrice must not exceed highPrice',
    path: ['lowPrice'],
  }).optional(),
  // Identifiers & Brand
  brand: recommended(z.union([text, schemaObject<Omit<Brand, '@context'>>()]).optional(), 'brand'),
  sku: recommended(text.optional(), 'sku'),
  gtin: z.string().regex(/^(\d{8}|\d{12,14})$/, 'Must be a GTIN-8, -12, -13 or -14').optional(),
  // Ratings & Reviews
  ratingValue: recommended(rating.optional(), 'aggregateRating'),
  reviewCount: recommended(positiveInt.optional(), 'aggregateRating'),
  reviews: z.array(
    z.strictObject({
      authorName: text,
      authorType: authorType.optional(),
      datePublished: dateOrStringSchema.optional(),
      reviewBody: text,
      ratingValue: z.number().min(0),
      bestRating: z.number().positive().optional(),
    }).refine((review) => review.ratingValue <= (review.bestRating ?? 5), {
      message: 'ratingValue must not exceed bestRating (default 5)',
      path: ['ratingValue'],
    })
  ).min(1).optional(),
  // Shipping & Return Policy
  shippingDetails: schemaObject<Record<string, unknown>>().optional(),
  returnPolicy: schemaObject<Record<string, unknown>>().optional(),
}).superRefine((data, ctx) => {
  atMostOne(data, ctx, ['offers', 'priceRange', 'price']);
  requireTogether(data, ctx, ['price', 'priceCurrency']);
  requireWith(data, ctx, 'price', ['availability']);
  requireTogether(data, ctx, ['ratingValue', 'reviewCount']);
});

// 4. Local Business (all fields optional — site-wide defaults can fill them in; the
// component requires a name after merging).
export const localBusinessZodSchema = z.object({
  name: text.optional(),
  url: recommended(httpUrl.optional(), 'url'),
  description: text.optional(),
  imageUrl: recommended(link.optional(), 'image'),
  telephone: recommended(text.optional(), 'telephone'),
  email: z.email().optional(),
  priceRange: text.optional(),
  address: recommended(postalAddress.optional(), 'address'),
  geo: recommended(z.strictObject({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(), 'geo'),
  openingHours: recommended(z.array(openingHoursSpec).min(1).optional(), 'openingHours'),
  sameAs: recommended(z.array(httpUrl).min(1).optional(), 'sameAs'),
});

// 5. Event
export const eventZodSchema = z.object({
  name: text,
  startDate: dateOrStringSchema,
  endDate: recommended(dateOrStringSchema.optional(), 'endDate'),
  description: recommended(text.optional(), 'description'),
  imageUrl: recommended(oneOrMore(link).optional(), 'image'),
  url: recommended(httpUrl.optional(), 'url'),
  // Physical venue (Offline/Mixed) and/or stream URL (Online/Mixed), see the rules below.
  locationName: text.optional(),
  locationAddress: postalAddress.optional(),
  onlineUrl: httpUrl.optional(),
  attendanceMode: z.enum(['Offline', 'Online', 'Mixed']).optional(),
  status: z.enum(['Scheduled', 'Cancelled', 'Postponed', 'Rescheduled']).optional(),
  price: recommended(priceValue.optional(), 'offers'),
  priceCurrency: recommended(currency.optional(), 'offers'),
  availability: availability.optional(),
  organizer: recommended(z.strictObject({
    name: text,
    url: httpUrl.optional(),
  }).optional(), 'organizer'),
  performer: z.strictObject({
    name: text,
    url: httpUrl.optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  // Offline events need a Place, Online events a VirtualLocation, Mixed events both.
  const mode = data.attendanceMode ?? 'Offline';
  const hasVenue = mode !== 'Online';
  const hasStream = mode !== 'Offline';
  for (const field of ['locationName', 'locationAddress'] as const) {
    if (hasVenue && data[field] === undefined) {
      ctx.addIssue({ code: 'custom', path: [field], message: `Required for ${mode} events` });
    }
    if (!hasVenue && data[field] !== undefined) {
      ctx.addIssue({ code: 'custom', path: [field], message: 'Not allowed for Online events (use onlineUrl, or attendanceMode "Mixed")' });
    }
  }
  if (hasStream && data.onlineUrl === undefined) {
    ctx.addIssue({ code: 'custom', path: ['onlineUrl'], message: `Required for ${mode} events` });
  }
  if (!hasStream && data.onlineUrl !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['onlineUrl'], message: 'Only allowed for attendanceMode "Online" or "Mixed"' });
  }
  requireTogether(data, ctx, ['price', 'priceCurrency']);
  requireWith(data, ctx, 'price', ['availability']);
  notBefore(data, ctx, 'startDate', 'endDate');
});

// 6. Organization (name falls back to `defaultArticlePublisher.name`)
export const organizationZodSchema = z.object({
  name: text.optional(),
  url: httpUrl.optional(),
  logoUrl: link.optional(),
  sameAs: recommended(z.array(httpUrl).min(1).optional(), 'sameAs'),
  telephone: recommended(text.optional(), 'telephone'),
  email: recommended(z.email().optional(), 'email'),
  address: recommended(postalAddress.optional(), 'address'),
});

// 7. WebPage
export const webPageZodSchema = z.object({
  title: text,
  description: recommended(text.optional(), 'description'),
  url: httpUrl.optional(),
  inLanguage: languageTag.optional(),
  datePublished: recommended(dateOrStringSchema.optional(), 'datePublished'),
  dateModified: recommended(dateOrStringSchema.optional(), 'dateModified'),
  isAccessibleForFree: z.boolean().optional(),
  image: recommended(link.optional(), 'image'),
  imageWidth: positiveInt.optional(),
  imageHeight: positiveInt.optional(),
  imageFormat: imageMimeType.optional(),
  imageCaption: text.optional(),
  author: recommended(z.strictObject({
    name: text,
    url: link.optional(),
    id: text.optional(),
    type: authorType.optional(),
  }).optional(), 'author'),
  publisher: z.strictObject({
    name: text,
    url: httpUrl.optional(),
    logo: link.optional(),
  }).optional(),
  robots: z.string().regex(
    /^[a-z-]+(:[\w-]+)?(\s*,\s*[a-z-]+(:[\w-]+)?)*$/i,
    'Must be a comma-separated list of robots directives like "noindex, nofollow"'
  ).optional(),
  alternates: z.array(z.strictObject({
    href: httpUrl,
    hreflang: z.union([languageTag, z.literal('x-default')]),
  })).min(1).optional(),
}).superRefine((data, ctx) => {
  requireWith(data, ctx, 'image', IMAGE_DETAIL_FIELDS);
  notBefore(data, ctx, 'datePublished', 'dateModified');
});

// 8. WebSite
export const webSiteZodSchema = z.object({
  name: text,
  url: httpUrl.optional(),
  searchQueryInput: z.string().regex(/^[A-Za-z0-9_-]+$/, 'Must be a query parameter name like "q"').optional(),
});

// 9. ProfilePage
export const profilePageZodSchema = z.object({
  name: text,
  description: recommended(text.optional(), 'mainEntity.description'),
  imageUrl: recommended(link.optional(), 'mainEntity.image'),
  sameAs: recommended(z.array(httpUrl).min(1).optional(), 'mainEntity.sameAs'),
  publishingPrinciples: link.optional(),
});

// 10. JobPosting (hiring organization falls back to `defaultArticlePublisher`)
const employmentType = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'OTHER']);
export const jobPostingZodSchema = z.object({
  title: text,
  description: text,
  datePosted: dateOrStringSchema,
  validThrough: recommended(dateOrStringSchema.optional(), 'validThrough'),
  employmentType: recommended(employmentType.optional(), 'employmentType'),
  hiringOrganizationName: text.optional(),
  hiringOrganizationUrl: httpUrl.optional(),
  hiringOrganizationLogo: link.optional(),
  jobLocation: postalAddress.optional(),
  baseSalary: recommended(z.strictObject({
    value: z.union([
      z.number().positive(),
      z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric amount like "50000"'),
    ]),
    currency,
    unit: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']),
  }).optional(), 'baseSalary'),
  identifier: recommended(z.strictObject({
    name: text,
    value: text,
  }).optional(), 'identifier'),
  directApply: recommended(z.boolean().optional(), 'directApply'),
  jobLocationType: z.literal('TELECOMMUTE').optional(),
  applicantLocationRequirements: oneOrMore(text).optional(),
}).superRefine((data, ctx) => {
  const remote = data.jobLocationType === 'TELECOMMUTE';
  if (!data.jobLocation && !remote) {
    ctx.addIssue({ code: 'custom', path: ['jobLocation'], message: 'Required unless jobLocationType is "TELECOMMUTE"' });
  }
  if (remote && !data.applicantLocationRequirements) {
    ctx.addIssue({ code: 'custom', path: ['applicantLocationRequirements'], message: 'Required for remote jobs (jobLocationType "TELECOMMUTE")' });
  }
  if (!remote && data.applicantLocationRequirements) {
    ctx.addIssue({ code: 'custom', path: ['applicantLocationRequirements'], message: 'Only allowed for remote jobs (jobLocationType "TELECOMMUTE")' });
  }
  notBefore(data, ctx, 'datePosted', 'validThrough');
});

// 11. SoftwareApp
export const softwareAppZodSchema = z.object({
  name: text,
  description: recommended(text.optional(), 'description'),
  url: recommended(httpUrl.optional(), 'url'),
  operatingSystem: recommended(text.optional(), 'operatingSystem'),
  applicationCategory: recommended(text.optional(), 'applicationCategory'),
  price: recommended(priceValue.optional(), 'offers'),
  priceCurrency: recommended(currency.optional(), 'offers'),
  ratingValue: recommended(rating.optional(), 'aggregateRating'),
  reviewCount: recommended(positiveInt.optional(), 'aggregateRating'),
}).superRefine((data, ctx) => {
  requireTogether(data, ctx, ['price', 'priceCurrency']);
  requireTogether(data, ctx, ['ratingValue', 'reviewCount']);
});

// 12. CollectionPage
export const collectionPageZodSchema = z.object({
  name: text,
  description: text,
  products: z.array(z.strictObject({
    name: text,
    url: link,
    price: priceValue.optional(),
    priceCurrency: currency.optional(),
    imageUrl: link.optional(),
  }).superRefine((product, ctx) => requireTogether(product, ctx, ['price', 'priceCurrency'])))
    .min(1, 'At least one product is required'),
});

// 13. Breadcrumb
export const breadcrumbZodSchema = z.object({
  items: z.array(z.strictObject({
    name: text,
    url: link,
  })).min(1, 'At least one breadcrumb item is required'),
});

// 14. AutoBreadcrumb
export const autoBreadcrumbZodSchema = z.object({
  labels: z.record(z.string(), text).optional(),
  homeLabel: text.optional(),
  ignoreSegments: z.array(text).optional(),
  prependBreadcrumbs: z.array(z.strictObject({
    name: text,
    url: link,
  })).optional(),
  appendBreadcrumbs: z.array(z.strictObject({
    name: text,
    url: link,
  })).optional(),
});

// 15. Recipe
export const recipeZodSchema = z.object({
  name: text,
  description: text,
  imageUrl: oneOrMore(link),
  authorName: oneOrMore(text),
  authorType: authorType.optional(),
  prepTime: recommended(isoDuration.optional(), 'prepTime'),
  cookTime: recommended(isoDuration.optional(), 'cookTime'),
  totalTime: isoDuration.optional(),
  recipeYield: recommended(z.union([text, z.number().positive()]).optional(), 'recipeYield'),
  recipeCategory: recommended(text.optional(), 'recipeCategory'),
  recipeCuisine: recommended(text.optional(), 'recipeCuisine'),
  calories: recommended(z.union([z.number().nonnegative(), text]).optional(), 'nutrition'),
  ingredients: z.array(text).min(1, 'At least one ingredient is required'),
  instructions: z.union([
    z.array(text).min(1, 'At least one instruction is required'),
    z.array(
      z.strictObject({
        text,
        name: text.optional(),
        imageUrl: link.optional(),
        url: link.optional(),
      })
    ).min(1, 'At least one instruction is required'),
  ]),
  ratingValue: recommended(rating.optional(), 'aggregateRating'),
  reviewCount: recommended(positiveInt.optional(), 'aggregateRating'),
  datePublished: dateOrStringSchema.optional(),
}).superRefine((data, ctx) => {
  requireTogether(data, ctx, ['ratingValue', 'reviewCount']);
});

// 16. Video
export const videoZodSchema = z.object({
  name: text,
  description: text,
  thumbnailUrl: oneOrMore(link),
  uploadDate: dateOrStringSchema,
  duration: recommended(isoDuration.optional(), 'duration'),
  contentUrl: recommended(link.optional(), 'contentUrl'),
  embedUrl: recommended(link.optional(), 'embedUrl'),
  interactionCount: recommended(z.union([
    z.number().int().nonnegative(),
    z.string().regex(/^\d+$/, 'Must be a whole number'),
  ]).optional(), 'interactionStatistic'),
  expires: dateOrStringSchema.optional(),
  publisher: recommended(z.strictObject({
    name: text,
    logoUrl: link.optional(),
  }).optional(), 'publisher'),
}).superRefine((data, ctx) => {
  if (!data.contentUrl && !data.embedUrl) {
    ctx.addIssue({ code: 'custom', path: ['contentUrl'], message: 'Either contentUrl or embedUrl is required for Google video indexing' });
  }
  notBefore(data, ctx, 'uploadDate', 'expires');
});

// Component prop types (the components use these, so props and validation cannot drift apart).
export type ArticleProps = z.input<typeof articleZodSchema> & SitemapProps;
export type FAQProps = z.input<typeof faqZodSchema> & SitemapProps;
export type ProductProps = z.input<typeof productZodSchema> & SitemapProps;
export type LocalBusinessProps = z.input<typeof localBusinessZodSchema> & SitemapProps;
export type EventProps = z.input<typeof eventZodSchema> & SitemapProps;
export type OrganizationProps = z.input<typeof organizationZodSchema> & SitemapProps;
export type WebPageProps = z.input<typeof webPageZodSchema> & SitemapProps;
export type WebSiteProps = z.input<typeof webSiteZodSchema> & SitemapProps;
export type ProfilePageProps = z.input<typeof profilePageZodSchema> & SitemapProps;
export type JobPostingProps = z.input<typeof jobPostingZodSchema> & SitemapProps;
export type SoftwareAppProps = z.input<typeof softwareAppZodSchema> & SitemapProps;
export type CollectionPageProps = z.input<typeof collectionPageZodSchema> & SitemapProps;
export type BreadcrumbProps = z.input<typeof breadcrumbZodSchema> & SitemapProps;
export type AutoBreadcrumbProps = z.input<typeof autoBreadcrumbZodSchema> & SitemapProps;
export type RecipeProps = z.input<typeof recipeZodSchema> & SitemapProps;
export type VideoProps = z.input<typeof videoZodSchema> & SitemapProps;

// ---------------------------------------------------------------------------
// Integration options
// ---------------------------------------------------------------------------

export const structuredDataOptionsSchema = z.strictObject({
  siteUrl: httpUrl.optional(),
  useGraph: z.boolean().optional(),
  generateMeta: z.boolean().optional(),
  siteName: text.optional(),
  locale: z.string().regex(/^[a-z]{2}[-_][A-Z]{2}$/, 'Must be a locale like "de_DE"').optional(),
  twitterSite: z.string().regex(/^@\w{1,15}$/, 'Must be a handle like "@example"').optional(),
  twitterCreator: z.string().regex(/^@\w{1,15}$/, 'Must be a handle like "@example"').optional(),
  warnOnMissingRecommended: z.boolean().optional(),
  defaultLocalBusiness: localBusinessZodSchema.strict().optional(),
  defaultArticlePublisher: z.strictObject({
    name: text,
    logo: z.strictObject({ url: link }).optional(),
  }).optional(),
  defaultBrand: z.union([text, schemaObject<Omit<Brand, '@context' | '@type'>>()]).optional(),
  defaultShippingDetails: schemaObject<Omit<OfferShippingDetails, '@context' | '@type'>>().optional(),
  defaultReturnPolicy: schemaObject<Omit<MerchantReturnPolicy, '@context' | '@type'>>().optional(),
});

export type StructuredDataOptions = z.input<typeof structuredDataOptionsSchema>;

// ---------------------------------------------------------------------------
// Recommended fields
// ---------------------------------------------------------------------------

export interface RecommendedWarning {
  field: string;
  message: string;
}

// Keys use schema.org @type names for consistency with JSON-LD output.
// Article, BlogPosting, NewsArticle all share the same schema.
const schemaMap = {
  Article: articleZodSchema,
  BlogPosting: articleZodSchema,
  NewsArticle: articleZodSchema,
  FAQPage: faqZodSchema,
  Product: productZodSchema,
  LocalBusiness: localBusinessZodSchema,
  Event: eventZodSchema,
  Organization: organizationZodSchema,
  WebPage: webPageZodSchema,
  WebSite: webSiteZodSchema,
  ProfilePage: profilePageZodSchema,
  JobPosting: jobPostingZodSchema,
  SoftwareApplication: softwareAppZodSchema,
  CollectionPage: collectionPageZodSchema,
  BreadcrumbList: breadcrumbZodSchema,
  Recipe: recipeZodSchema,
  VideoObject: videoZodSchema,
} as const;

export type SchemaType = keyof typeof schemaMap;

function recommendedEntries(schema: z.ZodObject): Array<{ prop: string; output: string }> {
  return Object.entries(schema.shape).flatMap(([prop, field]) => {
    const output = z.globalRegistry.get(field as z.ZodType)?.recommended;
    return typeof output === 'string' ? [{ prop, output }] : [];
  });
}

/** Recommended schema.org properties (dot paths) per @type, derived from the component schemas. */
export const RECOMMENDED_FIELDS: Record<string, string[]> = Object.fromEntries(
  Object.entries(schemaMap)
    .map(([type, schema]): [string, string[]] => [type, [...new Set(recommendedEntries(schema).map((e) => e.output))]])
    .filter(([, fields]) => fields.length > 0)
);

function hasPath(item: Record<string, any>, path: string): boolean {
  let value: any = item;
  for (const key of path.split('.')) {
    if (value == null) return false;
    value = value[key];
  }
  return value != null;
}

/** Recommended schema.org properties missing on a JSON-LD item (empty for types without any). */
export function missingRecommended(item: Record<string, any>): string[] {
  return (RECOMMENDED_FIELDS[item['@type']] ?? []).filter((path) => !hasPath(item, path));
}

export function validateRecommended(
  type: SchemaType,
  data: Record<string, unknown>
): RecommendedWarning[] {
  return recommendedEntries(schemaMap[type])
    .filter(({ prop }) => data[prop] == null)
    .map(({ prop }) => ({
      field: prop,
      message: `${type} should include "${prop}" for better search engine presentation`,
    }));
}
