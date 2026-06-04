export interface GeneratedMeta {
  canonical?: string;
  description?: string;
  robots?: string;
  author?: string;
  readingTime?: string;
  alternates?: Array<{ href: string; hreflang: string }>;
  openGraph: Record<string, string | string[]>;
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

function getImageObject(val: any): { url: string; width?: number; height?: number; type?: string; alt?: string } | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return { url: val };
  if (Array.isArray(val)) return getImageObject(val[0]);
  if (typeof val === 'object') {
    const url = val.url || val.contentUrl;
    if (typeof url !== 'string') return undefined;
    const obj: { url: string; width?: number; height?: number; type?: string; alt?: string } = { url };
    if (val.width !== undefined) {
      const w = typeof val.width === 'object' ? val.width.value : val.width;
      if (w) obj.width = Number(w);
    }
    if (val.height !== undefined) {
      const h = typeof val.height === 'object' ? val.height.value : val.height;
      if (h) obj.height = Number(h);
    }
    if (val.caption && typeof val.caption === 'string') {
      obj.alt = val.caption;
    } else if (val.description && typeof val.description === 'string') {
      obj.alt = val.description;
    } else if (val.alt && typeof val.alt === 'string') {
      obj.alt = val.alt;
    }
    if (val.encodingFormat && typeof val.encodingFormat === 'string') {
      obj.type = val.encodingFormat;
    } else if (val.fileFormat && typeof val.fileFormat === 'string') {
      obj.type = val.fileFormat;
    }
    return obj;
  }
  return undefined;
}

function getAuthorName(author: any): string | undefined {
  if (!author) return undefined;
  if (typeof author === 'string') return author;
  if (Array.isArray(author)) return getAuthorName(author[0]);
  if (typeof author === 'object') return author.name;
  return undefined;
}

function getTwitterHandleFromSameAs(sameAs: any): string | undefined {
  if (typeof sameAs === 'string') {
    const match = sameAs.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
    if (match) return `@${match[1]}`;
  }
  if (Array.isArray(sameAs)) {
    for (const url of sameAs) {
      const handle = getTwitterHandleFromSameAs(url);
      if (handle) return handle;
    }
  }
  return undefined;
}

function resolveAbsUrl(url: string, siteUrl?: string): string {
  if (!url.startsWith('http') && siteUrl) {
    const base = siteUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }
  return url;
}

function resolveCanonical(item: Record<string, any>, canonicalUrl: string): string {
  if (item.mainEntityOfPage && typeof item.mainEntityOfPage === 'object' && item.mainEntityOfPage['@id']) {
    return item.mainEntityOfPage['@id'];
  }
  if (item.url && typeof item.url === 'string') return item.url;
  return canonicalUrl;
}

function extractReadingTime(item: Record<string, any>): string | undefined {
  if (item.readingTime !== undefined) return item.readingTime.toString();
  if (typeof item.timeRequired === 'string') {
    const match = item.timeRequired.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      const totalMinutes = hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
      if (totalMinutes > 0) return `${totalMinutes} min`;
    } else {
      return item.timeRequired;
    }
  }
  return undefined;
}

function extractRobots(item: Record<string, any>): string | undefined {
  if (typeof item.robots === 'string') return item.robots;
  if (item.noindex !== undefined || item.nofollow !== undefined) {
    const parts: string[] = [];
    if (item.noindex) parts.push('noindex');
    if (item.nofollow) parts.push('nofollow');
    if (parts.length > 0) return parts.join(', ');
  }
  return undefined;
}

function extractAlternates(item: Record<string, any>): Array<{ href: string; hreflang: string }> | undefined {
  const alternates: Array<{ href: string; hreflang: string }> = [];
  if (Array.isArray(item.alternates)) {
    for (const alt of item.alternates) {
      if (alt && typeof alt === 'object' && alt.href && alt.hreflang) {
        alternates.push({ href: alt.href, hreflang: alt.hreflang });
      }
    }
  }
  if (item.workTranslation) {
    const addTranslation = (trans: any) => {
      if (trans && typeof trans === 'object' && trans.url && trans.inLanguage) {
        alternates.push({ href: trans.url, hreflang: trans.inLanguage });
      }
    };
    if (Array.isArray(item.workTranslation)) {
      item.workTranslation.forEach(addTranslation);
    } else {
      addTranslation(item.workTranslation);
    }
  }
  return alternates.length > 0 ? alternates : undefined;
}

function resolveImageTags(
  item: Record<string, any>,
  siteUrl: string | undefined,
  openGraph: Record<string, string | string[]>,
  twitter: Record<string, string>
): void {
  const imgObj = getImageObject(item.image || item.thumbnailUrl);
  if (!imgObj) return;
  const absImage = resolveAbsUrl(imgObj.url, siteUrl);
  openGraph['og:image'] = absImage;
  twitter['twitter:image'] = absImage;
  if (imgObj.width) openGraph['og:image:width'] = imgObj.width.toString();
  if (imgObj.height) openGraph['og:image:height'] = imgObj.height.toString();
  if (imgObj.type) openGraph['og:image:type'] = imgObj.type;
  if (imgObj.alt) {
    openGraph['og:image:alt'] = imgObj.alt;
    twitter['twitter:image:alt'] = imgObj.alt;
  }
}

function resolveSiteName(item: Record<string, any>, siteName?: string): string | undefined {
  if (siteName) return siteName;
  if (item.isPartOf && typeof item.isPartOf === 'object' && typeof item.isPartOf.name === 'string') {
    return item.isPartOf.name;
  }
  if (item.publisher && typeof item.publisher === 'object' && typeof item.publisher.name === 'string') {
    return item.publisher.name;
  }
  return undefined;
}

function resolveLocale(item: Record<string, any>, locale?: string): string | undefined {
  let resolved = locale;
  if (!resolved && item.inLanguage) {
    if (typeof item.inLanguage === 'string') {
      resolved = item.inLanguage;
    } else if (Array.isArray(item.inLanguage) && typeof item.inLanguage[0] === 'string') {
      resolved = item.inLanguage[0];
    }
  }
  if (resolved) {
    const match = resolved.match(/^([a-zA-Z]{2})[-_]([a-zA-Z]{2})$/);
    if (match) resolved = `${match[1].toLowerCase()}_${match[2].toUpperCase()}`;
  }
  return resolved;
}

function resolveTwitterCreator(item: Record<string, any>, twitterCreator?: string): string | undefined {
  if (twitterCreator) return twitterCreator;
  if (typeof item.author === 'object' && item.author) {
    if (item.author.twitter && typeof item.author.twitter === 'string') {
      return item.author.twitter.startsWith('@') ? item.author.twitter : `@${item.author.twitter}`;
    }
    if (item.author.sameAs) return getTwitterHandleFromSameAs(item.author.sameAs);
  }
  return undefined;
}

function resolveTwitterSite(item: Record<string, any>, twitterSite?: string): string | undefined {
  if (twitterSite) return twitterSite;
  if (item.publisher && typeof item.publisher === 'object') {
    if (item.publisher.twitter && typeof item.publisher.twitter === 'string') {
      return item.publisher.twitter.startsWith('@') ? item.publisher.twitter : `@${item.publisher.twitter}`;
    }
    if (item.publisher.sameAs) return getTwitterHandleFromSameAs(item.publisher.sameAs);
  }
  return undefined;
}

function buildArticleOpenGraph(
  item: Record<string, any>,
  twitterCreator: string | undefined,
  openGraph: Record<string, string | string[]>,
  twitter: Record<string, string>
): void {
  openGraph['og:type'] = 'article';
  if (item.datePublished) {
    openGraph['article:published_time'] = typeof item.datePublished === 'string'
      ? item.datePublished
      : new Date(item.datePublished).toISOString();
  }
  if (item.dateModified) {
    openGraph['article:modified_time'] = typeof item.dateModified === 'string'
      ? item.dateModified
      : new Date(item.dateModified).toISOString();
  }
  const articleAuthor = getAuthorName(item.author);
  if (articleAuthor) openGraph['article:author'] = articleAuthor;
  if (item.articleSection) {
    if (typeof item.articleSection === 'string') {
      openGraph['article:section'] = item.articleSection;
    } else if (Array.isArray(item.articleSection)) {
      openGraph['article:section'] = item.articleSection.filter((s: any) => typeof s === 'string');
    }
  }
  if (item.keywords) {
    let tags: string[] = [];
    if (typeof item.keywords === 'string') {
      tags = item.keywords.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (Array.isArray(item.keywords)) {
      tags = item.keywords.filter((t: any) => typeof t === 'string');
    }
    if (tags.length > 0) openGraph['article:tag'] = tags;
  }
  const creator = resolveTwitterCreator(item, twitterCreator);
  if (creator) twitter['twitter:creator'] = creator;
}

function buildVideoOpenGraph(
  item: Record<string, any>,
  siteUrl: string | undefined,
  openGraph: Record<string, string | string[]>
): void {
  openGraph['og:type'] = 'video.other';
  const videoUrl = item.contentUrl || item.embedUrl;
  if (videoUrl) {
    const absVideo = resolveAbsUrl(videoUrl, siteUrl);
    openGraph['og:video'] = absVideo;
    if (item.embedUrl) openGraph['og:video:secure_url'] = absVideo;
  }
  if (item.duration) {
    const match = item.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds > 0) openGraph['video:duration'] = totalSeconds.toString();
    }
  }
}

function extractSitemapAttrs(item: Record<string, any>): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (item.changefreq) attrs['data-sitemap-changefreq'] = item.changefreq;
  if (item.priority !== undefined) attrs['data-sitemap-priority'] = item.priority.toString();
  return attrs;
}

export function generateMetaTags(
  item: Record<string, any>,
  context: {
    siteUrl?: string;
    canonicalUrl: string;
    siteName?: string;
    locale?: string;
    twitterSite?: string;
    twitterCreator?: string;
  }
): GeneratedMeta {
  const type = item['@type'];
  const title = item.headline || item.name;

  const openGraph: Record<string, string | string[]> = {};
  const twitter: Record<string, string> = {};

  if (title) {
    openGraph['og:title'] = title;
    twitter['twitter:title'] = title;
  }
  if (item.description) {
    openGraph['og:description'] = item.description;
    twitter['twitter:description'] = item.description;
  }

  const canonical = resolveCanonical(item, context.canonicalUrl);
  openGraph['og:url'] = canonical;

  resolveImageTags(item, context.siteUrl, openGraph, twitter);
  twitter['twitter:card'] = openGraph['og:image'] ? 'summary_large_image' : 'summary';

  const siteName = resolveSiteName(item, context.siteName);
  if (siteName) openGraph['og:site_name'] = siteName;

  const locale = resolveLocale(item, context.locale);
  if (locale) openGraph['og:locale'] = locale;

  if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
    buildArticleOpenGraph(item, context.twitterCreator, openGraph, twitter);
  } else if (type === 'VideoObject') {
    buildVideoOpenGraph(item, context.siteUrl, openGraph);
  } else {
    openGraph['og:type'] = 'website';
  }

  const twitterSite = resolveTwitterSite(item, context.twitterSite);
  if (twitterSite) twitter['twitter:site'] = twitterSite;

  return {
    canonical,
    description: item.description,
    robots: extractRobots(item),
    author: getAuthorName(item.author),
    readingTime: extractReadingTime(item),
    alternates: extractAlternates(item),
    openGraph,
    twitter,
    sitemapAttrs: extractSitemapAttrs(item),
  };
}
