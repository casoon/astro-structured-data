// Types the toolbar has content checks for; anything else is shown as "Not checked", never "Valid".
export const CHECKED_TYPES = new Set([
  'Article', 'BlogPosting', 'NewsArticle', 'FAQPage', 'Product', 'CollectionPage', 'BreadcrumbList',
  'LocalBusiness', 'Event', 'Organization', 'WebSite', 'ProfilePage', 'JobPosting', 'SoftwareApplication',
  'Recipe', 'VideoObject',
]);

/** The type to check and preview: for an `@type` array the first one the toolbar knows. */
export function primaryType(value: unknown): string | undefined {
  const types = (Array.isArray(value) ? value : [value]).filter((t): t is string => typeof t === 'string');
  return types.find((t) => CHECKED_TYPES.has(t)) ?? types[0];
}

/** Content checks per schema type; returns human-readable warnings for the panel. */
export function collectWarnings(data: any, isGraphMember: boolean): string[] {
  const warnings: string[] = [];
  if (!isGraphMember && !data['@context']) {
    warnings.push("Missing '@context' property (should be 'https://schema.org')");
  }

  // Type specific checks
  const schemaType = primaryType(data['@type']);
  if (schemaType === 'Article' || schemaType === 'BlogPosting' || schemaType === 'NewsArticle') {
    // Google defines no required Article properties, only recommended ones.
    if (!data.headline) warnings.push("Missing 'headline' (recommended by Google for Articles)");
    if (!data.author) warnings.push("Missing 'author' (recommended by Google for Articles)");
    if (!data.image) warnings.push("Missing 'image' (recommended by Google for Articles)");
    if (!data.datePublished) warnings.push("Missing 'datePublished' (recommended by Google for Articles)");
  } else if (schemaType === 'FAQPage') {
    if (!data.mainEntity || !Array.isArray(data.mainEntity) || data.mainEntity.length === 0) {
      warnings.push("FAQPage must have a non-empty 'mainEntity' list of Questions");
    } else {
      data.mainEntity.forEach((q: any, i: number) => {
        if (!q.name) warnings.push(`Question #${i + 1} is missing 'name' (the question text)`);
        if (!q.acceptedAnswer || !q.acceptedAnswer.text) warnings.push(`Question #${i + 1} is missing 'acceptedAnswer.text' (the answer)`);
      });
    }
  } else if (schemaType === 'Product') {
    if (!data.name) warnings.push("Missing 'name'");
    if (!data.image) warnings.push("Missing 'image' (Google requires this for Products)");
    if (!data.offers) {
      warnings.push("Missing 'offers' (recommended for Google Rich Results)");
    } else {
      const validateSingleOffer = (offer: any, prefix = "") => {
        if (offer.price === undefined) warnings.push(`${prefix}Offer is missing 'price'`);
        if (!offer.priceCurrency) warnings.push(`${prefix}Offer is missing 'priceCurrency'`);
        if (!offer.shippingDetails) warnings.push(`${prefix}Offer is missing 'shippingDetails' (recommended for Google Merchant Listings)`);
        if (!offer.hasMerchantReturnPolicy) warnings.push(`${prefix}Offer is missing 'hasMerchantReturnPolicy' (recommended for Google Merchant Listings)`);
      };

      if (Array.isArray(data.offers)) {
        data.offers.forEach((o: any, idx: number) => {
          validateSingleOffer(o, `Offer #${idx + 1} `);
        });
      } else if (data.offers['@type'] === 'AggregateOffer') {
        if (data.offers.lowPrice === undefined) warnings.push("AggregateOffer is missing 'lowPrice'");
        if (data.offers.highPrice === undefined) warnings.push("AggregateOffer is missing 'highPrice'");
        if (!data.offers.priceCurrency) warnings.push("AggregateOffer is missing 'priceCurrency'");
      } else {
        validateSingleOffer(data.offers);
      }
    }
  } else if (schemaType === 'CollectionPage') {
    if (!data.name) warnings.push("Missing collection 'name'");
    if (!data.mainEntity) {
      warnings.push("CollectionPage should have a 'mainEntity' pointing to an ItemList");
    } else if (data.mainEntity['@type'] !== 'ItemList') {
      warnings.push("CollectionPage mainEntity must be of type 'ItemList'");
    } else {
      const list = data.mainEntity;
      if (!list.itemListElement || !Array.isArray(list.itemListElement) || list.itemListElement.length === 0) {
        warnings.push("CollectionPage ItemList must have non-empty 'itemListElement' list of Products");
      } else {
        list.itemListElement.forEach((el: any, i: number) => {
          if (el['@type'] !== 'ListItem') warnings.push(`Item #${i + 1} in collection list is not a 'ListItem'`);
          if (!el.item || el.item['@type'] !== 'Product') warnings.push(`ListItem #${i + 1} in collection does not point to a 'Product'`);
        });
      }
    }
  } else if (schemaType === 'BreadcrumbList') {
    if (!data.itemListElement || !Array.isArray(data.itemListElement) || data.itemListElement.length === 0) {
      warnings.push("BreadcrumbList must have 'itemListElement' containing ListItems");
    } else {
      data.itemListElement.forEach((item: any, i: number) => {
        if (!item.position) warnings.push(`Breadcrumb item #${i + 1} is missing 'position'`);
        if (!item.name) warnings.push(`Breadcrumb item #${i + 1} is missing 'name'`);
        if (!item.item) warnings.push(`Breadcrumb item #${i + 1} is missing 'item' (the URL)`);
      });
    }
  } else if (schemaType === 'LocalBusiness') {
    if (!data.name) warnings.push("Missing business 'name'");
    if (!data.address) warnings.push("Missing business 'address'");
  } else if (schemaType === 'Event') {
    if (!data.name) warnings.push("Missing event 'name'");
    if (!data.startDate) warnings.push("Missing event 'startDate'");
    if (!data.location) warnings.push("Missing event 'location'");
  } else if (schemaType === 'Organization') {
    if (!data.name) warnings.push("Missing organization 'name'");
  } else if (schemaType === 'WebSite') {
    if (!data.name) warnings.push("Missing website 'name'");
    if (!data.url) warnings.push("Missing website 'url'");
  } else if (schemaType === 'ProfilePage') {
    if (!data.mainEntity) warnings.push("ProfilePage must specify 'mainEntity' (Person)");
    else if (data.mainEntity['@type'] !== 'Person') warnings.push("ProfilePage mainEntity must be of type 'Person'");
  } else if (schemaType === 'JobPosting') {
    if (!data.title) warnings.push("Missing job 'title'");
    if (!data.description) warnings.push("Missing job 'description'");
    if (!data.datePosted) warnings.push("Missing job 'datePosted'");
    if (!data.hiringOrganization) warnings.push("Missing job 'hiringOrganization'");
    if (!data.jobLocation && data.jobLocationType !== 'TELECOMMUTE') {
      warnings.push("Missing job 'jobLocation' (or jobLocationType 'TELECOMMUTE' for remote jobs)");
    }
  } else if (schemaType === 'SoftwareApplication') {
    if (!data.name) warnings.push("Missing software 'name'");
    if (!data.operatingSystem) warnings.push("Missing software 'operatingSystem'");
    if (!data.applicationCategory) warnings.push("Missing software 'applicationCategory'");
  } else if (schemaType === 'Recipe') {
    if (!data.name) warnings.push("Missing recipe 'name'");
    if (!data.description) warnings.push("Missing recipe 'description'");
    if (!data.recipeIngredient || !Array.isArray(data.recipeIngredient) || data.recipeIngredient.length === 0) {
      warnings.push("Recipe must have at least one ingredient under 'recipeIngredient'");
    }
    if (!data.recipeInstructions) {
      warnings.push("Recipe must have 'recipeInstructions'");
    }
  } else if (schemaType === 'VideoObject') {
    if (!data.name) warnings.push("Missing video 'name'");
    if (!data.description) warnings.push("Missing video 'description'");
    if (!data.thumbnailUrl && !data.thumbnail) warnings.push("Missing video 'thumbnailUrl'");
    if (!data.uploadDate) warnings.push("Missing video 'uploadDate'");
  }

  return warnings;
}
