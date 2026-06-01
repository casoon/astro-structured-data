export interface GeneratedMeta {
  canonical?: string;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  sitemapAttrs: Record<string, string>;
}

function getFirstString(val: any): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    const first = val[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.url) return first.url;
  }
  if (val && typeof val === 'object' && val.url) return val.url;
  return undefined;
}

function getAuthorName(author: any): string | undefined {
  if (!author) return undefined;
  if (typeof author === 'string') return author;
  if (Array.isArray(author)) {
    const first = author[0];
    return getAuthorName(first);
  }
  if (typeof author === 'object') {
    return author.name;
  }
  return undefined;
}

export function generateMetaTags(
  item: Record<string, any>,
  context: { siteUrl?: string; canonicalUrl: string }
): GeneratedMeta {
  const type = item['@type'];
  const title = item.headline || item.name;
  const description = item.description;
  const image = getFirstString(item.image);
  
  // Resolve canonical URL from the schema itself (e.g. mainEntityOfPage.@id) or context URL
  let canonical = context.canonicalUrl;
  if (item.mainEntityOfPage && typeof item.mainEntityOfPage === 'object' && item.mainEntityOfPage['@id']) {
    canonical = item.mainEntityOfPage['@id'];
  } else if (item.url && typeof item.url === 'string') {
    canonical = item.url;
  }

  // Resolve absolute image URL if needed
  let absImage = image;
  if (absImage && !absImage.startsWith('http') && context.siteUrl) {
    const base = context.siteUrl.replace(/\/$/, '');
    const path = absImage.startsWith('/') ? absImage : `/${absImage}`;
    absImage = `${base}${path}`;
  }

  const openGraph: Record<string, string> = {};
  const twitter: Record<string, string> = {};

  if (title) {
    openGraph['og:title'] = title;
    twitter['twitter:title'] = title;
  }

  if (description) {
    openGraph['og:description'] = description;
    twitter['twitter:description'] = description;
  }

  if (canonical) {
    openGraph['og:url'] = canonical;
  }

  if (absImage) {
    openGraph['og:image'] = absImage;
    twitter['twitter:image'] = absImage;
  }

  // Set card type
  twitter['twitter:card'] = absImage ? 'summary_large_image' : 'summary';

  // Specific mappings for Article schema
  if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
    openGraph['og:type'] = 'article';
    
    if (item.datePublished) {
      openGraph['article:published_time'] = typeof item.datePublished === 'string'
        ? item.datePublished
        : new Date(item.datePublished).toISOString();
    }
    
    const author = getAuthorName(item.author);
    if (author) {
      openGraph['article:author'] = author;
    }
  } else {
    openGraph['og:type'] = 'website';
  }

  const sitemapAttrs: Record<string, string> = {};
  if (item.changefreq) {
    sitemapAttrs['data-sitemap-changefreq'] = item.changefreq;
  }
  if (item.priority !== undefined) {
    sitemapAttrs['data-sitemap-priority'] = item.priority.toString();
  }

  return {
    canonical,
    openGraph,
    twitter,
    sitemapAttrs
  };
}
