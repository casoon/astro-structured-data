import { z } from 'zod';

// Helper to transform Date objects to ISO string representation
const dateOrStringSchema = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === 'string' ? val : val.toISOString()));

// 1. Article Schema Zod definition
export const articleZodSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().min(1, 'Description cannot be empty'),
  datePublished: dateOrStringSchema,
  dateModified: dateOrStringSchema.optional(),
  authorName: z.union([z.string(), z.array(z.string())]),
  authorType: z.enum(['Person', 'Organization']).optional(),
  imageUrl: z.union([z.string(), z.array(z.string())]),
  publisherName: z.string().optional(),
  publisherLogo: z.string().optional(),
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
  price: z.union([z.number(), z.string()]).optional(),
  priceCurrency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional(),
  availability: z.enum(['InStock', 'OutOfStock', 'PreOrder', 'OnlineOnly']).optional(),
  brand: z.union([z.string(), z.any()]).optional(),
  sku: z.string().optional(),
  gtin: z.string().optional(),
  ratingValue: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
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
});

// 4. Local Business Schema Zod definition
export const localBusinessZodSchema = z.object({
  name: z.string().optional(),
  imageUrl: z.string().url('Must be a valid image URL').optional(),
  telephone: z.string().optional(),
  priceRange: z.string().optional(),
  address: z.object({
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string().optional(),
    postalCode: z.string(),
    addressCountry: z.string(),
  }).optional(),
  geo: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  openingHours: z.array(z.string()).optional(),
});

// 5. Event Schema Zod definition
export const eventZodSchema = z.object({
  name: z.string().min(1, 'Event name cannot be empty'),
  startDate: dateOrStringSchema,
  endDate: dateOrStringSchema.optional(),
  description: z.string().optional(),
  imageUrl: z.union([z.string(), z.array(z.string())]).optional(),
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
  price: z.union([z.number(), z.string()]).optional(),
  priceCurrency: z.string().length(3).optional(),
  availability: z.enum(['InStock', 'OutOfStock', 'PreOrder', 'OnlineOnly']).optional(),
});
