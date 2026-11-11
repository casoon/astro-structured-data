import { z } from 'zod';
import type { Product, AggregateOffer, Review } from 'schema-dts';
import { productZodSchema, structuredDataOptionsSchema } from '../zod.js';
import { buildReference, buildReferences } from '../utils/reference.js';

type Options = z.output<typeof structuredDataOptionsSchema>;

export type ProductData = z.output<typeof productZodSchema>;

export interface ProductContext {
  /** Absolute URL of the page the product is rendered on. */
  url: string;
  /** Site-wide defaults from the integration options. */
  config: Pick<Options, 'defaultBrand' | 'defaultShippingDetails' | 'defaultReturnPolicy'>;
}

/** Builds the schema.org Product from validated `<ProductSchema>` props. */
export function buildProduct(props: ProductData, { url: productUrl, config }: ProductContext): Product {
  const {
    id,
    isVariantOf,
    hasVariant,
    isRelatedTo,
    isSimilarTo,
    isAccessoryOrSparePartFor,
    isConsumableFor,
    name,
    description,
    imageUrl,
    price,
    priceCurrency,
    availability = 'InStock',
    offers,
    priceRange,
    brand,
    sku,
    gtin,
    ratingValue,
    reviewCount,
    reviews,
    shippingDetails,
    returnPolicy
  } = props;

  // 1. Resolve Shipping Details & Return Policy
  const finalShipping = shippingDetails ?? config.defaultShippingDetails;
  const finalReturn = returnPolicy ?? config.defaultReturnPolicy;

  const shippingObj = finalShipping ? {
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      ...(finalShipping as object)
    }
  } : {};

  const returnObj = finalReturn ? {
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      ...(finalReturn as object)
    }
  } : {};

  // Adds shipping/return info to an Offer; what the offer sets itself wins over these defaults.
  const decorateOffer = (offer: any) => ({
    '@type': 'Offer',
    ...shippingObj,
    ...returnObj,
    ...offer
  });

  // 2. Resolve Offers Structure (the schema allows at most one of offers / priceRange / price)
  let parsedOffers: any = undefined;

  if (offers) {
    if (Array.isArray(offers)) {
      parsedOffers = offers.map(o => decorateOffer(o));
    } else {
      parsedOffers = decorateOffer(offers);
    }
  } else if (priceRange) {
    const aggregateOffer = {
      '@type': 'AggregateOffer',
      lowPrice: priceRange.lowPrice,
      highPrice: priceRange.highPrice,
      priceCurrency: priceRange.priceCurrency,
      ...(priceRange.offerCount && { offerCount: priceRange.offerCount }),
      url: productUrl,
      ...shippingObj,
      ...returnObj
    } as AggregateOffer;
    parsedOffers = aggregateOffer;
  } else if (price !== undefined) {
    parsedOffers = decorateOffer({
      price,
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      url: productUrl,
    });
  }

  // 3. Resolve Brand (with config default fallback)
  let resolvedBrand: any = undefined;
  const activeBrand = brand ?? config.defaultBrand;
  if (activeBrand) {
    if (typeof activeBrand === 'string') {
      resolvedBrand = {
        '@type': 'Brand',
        name: activeBrand
      };
    } else {
      resolvedBrand = {
        '@type': 'Brand',
        ...(activeBrand as object)
      };
    }
  }

  // 4. Resolve Reviews
  let resolvedReviews: Review[] | undefined = undefined;
  if (reviews) {
    resolvedReviews = reviews.map(r => ({
      '@type': 'Review',
      author: {
        '@type': r.authorType || 'Person',
        name: r.authorName
      },
      ...(r.datePublished && { datePublished: r.datePublished }),
      reviewBody: r.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.ratingValue,
        bestRating: r.bestRating ?? 5
      }
    }) as Review);
  }

  // 5. Build Final Product Schema
  const productSchema: Product = {
    '@type': 'Product',
    ...(id && { '@id': id }),
    name,
    description,
    image: Array.isArray(imageUrl) ? imageUrl : [imageUrl],
    ...(parsedOffers && { offers: parsedOffers }),
    ...(resolvedBrand && { brand: resolvedBrand }),
    ...(sku && { sku }),
    ...(gtin && { gtin }),
    ...(ratingValue !== undefined && reviewCount !== undefined && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue,
        reviewCount,
      }
    }),
    ...(resolvedReviews && { review: resolvedReviews })
  };
  Object.assign(productSchema, {
    ...(isVariantOf && { isVariantOf: buildReference(isVariantOf, 'ProductGroup') }),
    ...(hasVariant && { hasVariant: hasVariant.map((part) => buildReference(part, 'Product')) }),
    ...(isRelatedTo && { isRelatedTo: buildReferences(isRelatedTo, 'Product') }),
    ...(isSimilarTo && { isSimilarTo: buildReferences(isSimilarTo, 'Product') }),
    ...(isAccessoryOrSparePartFor && { isAccessoryOrSparePartFor: buildReferences(isAccessoryOrSparePartFor, 'Product') }),
    ...(isConsumableFor && { isConsumableFor: buildReferences(isConsumableFor, 'Product') }),
  });
  return productSchema;
}
