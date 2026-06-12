import { z } from 'zod';

const dateOrStringSchema = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === 'string' ? val : val.toISOString()));

// 1. Article Schema Zod definition
export const articleZodSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().min(1, 'Description cannot be empty'),
  datePublished: dateOrStringSchema,
  dateModified: dateOrStringSchema.optional().describe('recommended'),
  authorName: z.union([z.string(), z.array(z.string())]),
  authorType: z.enum(['Person', 'Organization']).optional(),
  authorUrl: z.string().url().optional(),
  authorId: z.string().optional(),
  imageUrl: z.union([z.string(), z.array(z.string())]).optional().describe('recommended'),
  imageWidth: z.number().int().positive().optional(),
  imageHeight: z.number().int().positive().optional(),
  imageFormat: z.string().optional(),
  imageCaption: z.string().optional(),
  publisherName: z.string().optional().describe('recommended'),
  publisherLogo: z.string().optional().describe('recommended'),
  schemaType: z.enum(['Article', 'BlogPosting', 'NewsArticle']).optional(),
  inLanguage: z.string().optional(),
  articleSection: z.string().optional(),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
  wordCount: z.number().int().positive().optional(),
  readingTimeMinutes: z.number().int().positive().optional(),
  isAccessibleForFree: z.boolean().optional(),
  isPartOfHeadline: z.string().optional(),
  isPartOfUrl: z.string().optional(),
  seriesPosition: z.number().int().positive().optional(),
  hasPart: z.array(z.object({
    headline: z.string(),
    url: z.string(),
    position: z.number().int().positive().optional(),
  })).optional(),
});

// 2. FAQ Schema Zod definition
export const faqZodSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(1, 'Question cannot be empty'),
      answer: z.string().min(1, 'Answer cannot be empty'),
    })
  ),
});

// 3. Product Schema Zod definition
export const productZodSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty'),
  description: z.string().min(1, 'Product description cannot be empty'),
  imageUrl: z.union([z.string(), z.array(z.string())]),
  // Simple offer fields
  price: z.union([z.number(), z.string()]).optional().describe('recommended'),
  priceCurrency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional().describe('recommended'),
  availability: z.enum(['InStock', 'OutOfStock', 'PreOrder', 'OnlineOnly']).optional(),
  // Advanced offer structures
  offers: z.union([z.record(z.any()), z.array(z.record(z.any()))]).optional(),
  priceRange: z.object({
    lowPrice: z.union([z.string(), z.number()]),
    highPrice: z.union([z.string(), z.number()]),
    priceCurrency: z.string().length(3),
    offerCount: z.number().int().positive().optional(),
  }).optional(),
  // Identifiers & Brand
  brand: z.union([z.string(), z.record(z.any())]).optional().describe('recommended'),
  sku: z.string().optional().describe('recommended'),
  gtin: z.string().optional(),
  // Ratings & Reviews
  ratingValue: z.number().min(0).max(5).optional().describe('recommended'),
  reviewCount: z.number().int().nonnegative().optional().describe('recommended'),
  reviews: z.array(
    z.object({
      authorName: z.string(),
      authorType: z.enum(['Person', 'Organization']).optional(),
      datePublished: z.string().optional(),
      reviewBody: z.string(),
      ratingValue: z.number().min(0).max(5),
      bestRating: z.number().optional(),
    })
  ).optional(),
  // Shipping & Return Policy
  shippingDetails: z.record(z.any()).optional(),
  returnPolicy: z.record(z.any()).optional(),
});

// 4. Local Business Schema Zod definition
export const localBusinessZodSchema = z.object({
  name: z.string().optional().describe('recommended'),
  url: z.string().url().optional().describe('recommended'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid image URL').optional().describe('recommended'),
  telephone: z.string().optional().describe('recommended'),
  email: z.string().email().optional(),
  priceRange: z.string().optional(),
  address: z.object({
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string().optional(),
    postalCode: z.string(),
    addressCountry: z.string(),
  }).optional().describe('recommended'),
  geo: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional().describe('recommended'),
  openingHours: z.array(z.string()).optional().describe('recommended'),
  sameAs: z.array(z.string().url()).optional().describe('recommended'),
});

// 5. Event Schema Zod definition
export const eventZodSchema = z.object({
  name: z.string().min(1, 'Event name cannot be empty'),
  startDate: dateOrStringSchema,
  endDate: dateOrStringSchema.optional().describe('recommended'),
  description: z.string().optional().describe('recommended'),
  imageUrl: z.union([z.string(), z.array(z.string())]).optional().describe('recommended'),
  url: z.string().url().optional().describe('recommended'),
  locationName: z.string(),
  locationAddress: z.object({
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string().optional(),
    postalCode: z.string(),
    addressCountry: z.string(),
  }),
  attendanceMode: z.enum(['Offline', 'Online', 'Mixed']).optional(),
  status: z.enum(['Scheduled', 'Cancelled', 'Postponed', 'Rescheduled']).optional(),
  price: z.union([z.number(), z.string()]).optional().describe('recommended'),
  priceCurrency: z.string().length(3).optional().describe('recommended'),
  availability: z.enum(['InStock', 'OutOfStock', 'PreOrder', 'OnlineOnly']).optional(),
  organizer: z.object({
    name: z.string(),
    url: z.string().url().optional(),
  }).optional().describe('recommended'),
  performer: z.object({
    name: z.string(),
    url: z.string().url().optional(),
  }).optional(),
});

// 6. Organization Schema Zod definition
export const organizationZodSchema = z.object({
  name: z.string().optional(),
  url: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  sameAs: z.array(z.string().url()).optional().describe('recommended'),
  telephone: z.string().optional().describe('recommended'),
  email: z.string().email().optional().describe('recommended'),
  address: z.object({
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string().optional(),
    postalCode: z.string(),
    addressCountry: z.string(),
  }).optional().describe('recommended'),
});

// 7. WebPage Schema Zod definition
export const webPageZodSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().optional().describe('recommended'),
  url: z.string().url().optional(),
  inLanguage: z.string().optional(),
  datePublished: z.string().optional().describe('recommended'),
  dateModified: z.string().optional().describe('recommended'),
  isAccessibleForFree: z.boolean().optional(),
  image: z.string().url().optional().describe('recommended'),
  imageWidth: z.number().int().positive().optional(),
  imageHeight: z.number().int().positive().optional(),
  imageFormat: z.string().optional(),
  imageCaption: z.string().optional(),
  author: z.object({
    name: z.string(),
    url: z.string().optional(),
    id: z.string().optional(),
    type: z.string().optional(),
  }).optional().describe('recommended'),
  publisher: z.object({
    name: z.string(),
    url: z.string().optional(),
    logo: z.string().optional(),
  }).optional(),
  robots: z.string().optional(),
  alternates: z.array(z.object({
    href: z.string(),
    hreflang: z.string(),
  })).optional(),
});

// 8. WebSite Schema Zod definition
export const webSiteZodSchema = z.object({
  name: z.string().min(1, 'Site name cannot be empty'),
  url: z.string().url().optional(),
  searchQueryInput: z.string().optional(),
});

// 9. ProfilePage Schema Zod definition
export const profilePageZodSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string().optional().describe('recommended'),
  imageUrl: z.string().url().optional().describe('recommended'),
  sameAs: z.array(z.string().url()).optional().describe('recommended'),
  publishingPrinciples: z.string().optional(),
});

// 10. JobPosting Schema Zod definition
const jobPostingBaseSchema = z.object({
  title: z.string().min(1, 'Job title cannot be empty'),
  description: z.string().min(1, 'Job description cannot be empty'),
  datePosted: z.string().min(1, 'Date posted cannot be empty'),
  validThrough: z.string().optional().describe('recommended'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'OTHER']).optional().describe('recommended'),
  hiringOrganizationName: z.string().optional().describe('recommended'),
  hiringOrganizationUrl: z.string().url().optional(),
  hiringOrganizationLogo: z.string().url().optional(),
  jobLocation: z.object({
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string().optional(),
    postalCode: z.string(),
    addressCountry: z.string(),
  }).optional(),
  baseSalary: z.object({
    value: z.union([z.number(), z.string()]),
    currency: z.string().length(3),
    unit: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']).optional(),
  }).optional().describe('recommended'),
  identifier: z.object({
    name: z.string(),
    value: z.string(),
  }).optional().describe('recommended'),
  directApply: z.boolean().optional().describe('recommended'),
  jobLocationType: z.literal('TELECOMMUTE').optional(),
  applicantLocationRequirements: z.union([z.string(), z.array(z.string())]).optional(),
});

export const jobPostingZodSchema = jobPostingBaseSchema.refine(
  (data) => data.jobLocation || data.applicantLocationRequirements,
  { message: 'Either jobLocation or applicantLocationRequirements is required by Google', path: ['jobLocation'] }
);

// 11. SoftwareApp Schema Zod definition
export const softwareAppZodSchema = z.object({
  name: z.string().min(1, 'App name cannot be empty'),
  description: z.string().optional().describe('recommended'),
  url: z.string().url().optional().describe('recommended'),
  operatingSystem: z.string().optional().describe('recommended'),
  applicationCategory: z.string().optional().describe('recommended'),
  price: z.union([z.string(), z.number()]).optional().describe('recommended'),
  priceCurrency: z.string().length(3).optional().describe('recommended'),
  ratingValue: z.number().min(0).max(5).optional().describe('recommended'),
  reviewCount: z.number().int().nonnegative().optional().describe('recommended'),
});

// 12. CollectionPage Schema Zod definition
export const collectionPageZodSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string().min(1, 'Description cannot be empty'),
  products: z.array(z.object({
    name: z.string(),
    url: z.string(),
    price: z.union([z.number(), z.string()]).optional(),
    priceCurrency: z.string().optional(),
    imageUrl: z.string().optional(),
  })).min(1, 'At least one product is required'),
});

// 13. Breadcrumb Schema Zod definition
export const breadcrumbZodSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).min(1, 'At least one breadcrumb item is required'),
});

// 14. AutoBreadcrumb Schema Zod definition
export const autoBreadcrumbZodSchema = z.object({
  labels: z.record(z.string()).optional(),
  homeLabel: z.string().optional(),
  ignoreSegments: z.array(z.string()).optional(),
  prependBreadcrumbs: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
  appendBreadcrumbs: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
});

// 15. Recipe Schema Zod definition
export const recipeZodSchema = z.object({
  name: z.string().min(1, 'Recipe name cannot be empty'),
  description: z.string().min(1, 'Recipe description cannot be empty'),
  imageUrl: z.union([z.string(), z.array(z.string())]),
  authorName: z.union([z.string(), z.array(z.string())]),
  authorType: z.enum(['Person', 'Organization']).optional(),
  prepTime: z.string().optional().describe('recommended'),
  cookTime: z.string().optional().describe('recommended'),
  totalTime: z.string().optional(),
  recipeYield: z.union([z.string(), z.number()]).optional().describe('recommended'),
  recipeCategory: z.string().optional().describe('recommended'),
  recipeCuisine: z.string().optional().describe('recommended'),
  calories: z.union([z.number(), z.string()]).optional().describe('recommended'),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  instructions: z.union([
    z.array(z.string()).min(1, 'At least one instruction is required'),
    z.array(
      z.object({
        text: z.string().min(1, 'Instruction text cannot be empty'),
        name: z.string().optional(),
        imageUrl: z.string().optional(),
        url: z.string().optional(),
      })
    ).min(1, 'At least one instruction is required')
  ]),
  ratingValue: z.number().min(0).max(5).optional().describe('recommended'),
  reviewCount: z.number().int().nonnegative().optional(),
  datePublished: dateOrStringSchema.optional(),
});

// 16. Video Schema Zod definition
const videoBaseSchema = z.object({
  name: z.string().min(1, 'Video name cannot be empty'),
  description: z.string().min(1, 'Video description cannot be empty'),
  thumbnailUrl: z.union([z.string(), z.array(z.string())]),
  uploadDate: dateOrStringSchema,
  duration: z.string().optional().describe('recommended'),
  contentUrl: z.string().optional().describe('recommended'),
  embedUrl: z.string().optional().describe('recommended'),
  interactionCount: z.union([z.number(), z.string()]).optional().describe('recommended'),
  expires: dateOrStringSchema.optional(),
  publisher: z.object({
    name: z.string(),
    logoUrl: z.string().url().optional(),
  }).optional().describe('recommended'),
});

export const videoZodSchema = videoBaseSchema.refine(
  (data) => data.contentUrl || data.embedUrl,
  { message: 'Either contentUrl or embedUrl is required for Google video indexing', path: ['contentUrl'] }
);

// validateRecommended utility
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
  JobPosting: jobPostingBaseSchema,
  SoftwareApplication: softwareAppZodSchema,
  CollectionPage: collectionPageZodSchema,
  BreadcrumbList: breadcrumbZodSchema,
  Recipe: recipeZodSchema,
  VideoObject: videoBaseSchema,
} as const;

export type SchemaType = keyof typeof schemaMap;

export function validateRecommended(
  type: SchemaType,
  data: Record<string, unknown>
): RecommendedWarning[] {
  const schema = schemaMap[type];
  const warnings: RecommendedWarning[] = [];

  for (const [key, fieldSchema] of Object.entries(schema.shape)) {
    const description = (fieldSchema as any)._def?.description;
    if (description === 'recommended' && (!(key in data) || data[key] == null)) {
      warnings.push({
        field: key,
        message: `${type} should include "${key}" for better search engine presentation`,
      });
    }
  }

  return warnings;
}
