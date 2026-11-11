/** Whether a schema.org offer object is an AggregateOffer (also inside an `@type` array). */
export function isAggregateOffer(offer: Record<string, any>): boolean {
  return ([] as unknown[]).concat(offer['@type']).includes('AggregateOffer');
}

/**
 * Price fields Google requires that an offer lacks. An Offer needs `price` and `priceCurrency`,
 * directly or in a `priceSpecification`; an AggregateOffer needs `lowPrice` and `priceCurrency`.
 */
export function missingOfferPrice(offer: Record<string, any>): string[] {
  if (isAggregateOffer(offer)) {
    return ['lowPrice', 'priceCurrency'].filter((field) => offer[field] == null);
  }
  const specs: any[] = ([] as unknown[]).concat(offer.priceSpecification ?? []);
  return ['price', 'priceCurrency'].filter(
    (field) => offer[field] == null && !specs.some((spec) => spec?.[field] != null)
  );
}
