export interface GeneratedMeta {
  canonical?: string;
  description?: string;
  robots?: string;
  author?: string;
  readingTime?: string;
  alternates?: Array<{ href: string; hreflang: string }>;
  openGraph: Record<string, string | string[]>;
  twitter: Record<string, string>;
}

/** Absolute URL of a page on the configured site (never the dev/build server origin). */
export function pageUrl(pathname: string, siteUrl: string): string {
  return new URL(pathname, siteUrl).href;
}

// Schema types that may drive page-level meta tags, most page-specific first. Site-wide
// types (LocalBusiness, WebSite) come last so a global business/site schema in the layout
// never wins over the schema describing the actual page.
export const PRIMARY_META_TYPES = [
  'Article', 'BlogPosting', 'NewsArticle',
  'Product', 'ProductGroup',
  'Recipe',
  'VideoObject',
  'Event',
  'JobPosting',
  'SoftwareApplication', 'WebApplication', 'MobileApplication',
  'ProfilePage',
  'FAQPage',
  'ItemPage', 'AboutPage', 'ContactPage', 'CollectionPage',
  'WebPage',
  'LocalBusiness',
  'WebSite',
];

/** `@type` may be a single type or a list of types. */
export function typesOf(item: Record<string, any>): string[] {
  const type = item['@type'];
  if (Array.isArray(type)) return type.filter((t): t is string => typeof t === 'string');
  return typeof type === 'string' ? [type] : [];
}

const hasType = (item: Record<string, any>, ...types: string[]) => typesOf(item).some((t) => types.includes(t));

export function findPrimaryItem(items: Record<string, any>[]): Record<string, any> | undefined {
  for (const type of PRIMARY_META_TYPES) {
    const item = items.find((it) => hasType(it, type));
    if (item) return item;
  }
  return undefined;
}

// Types whose `url` is the URL of the page itself. For other types (Event, LocalBusiness,
// Product, ...) `url` points at the described thing, which may live on another site.
const PAGE_TYPES = ['WebPage', 'ItemPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ProfilePage', 'FAQPage'];

/**
 * The schemas describing the page itself (WebPage, FAQPage, …) — the source of page-level tags
 * (canonical, robots, hreflang alternates), whichever content schema drives title, description
 * and image. A page may have several; settings from each of them count.
 */
export function findPageItems(items: Record<string, any>[]): Record<string, any>[] {
  return items.filter((it) => hasType(it, ...PAGE_TYPES));
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Meta descriptions are plain text; some schema fields (e.g. JobPosting.description) may contain HTML. */
function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim();
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

/** Profile URLs of the authors — what Open Graph's `article:author` expects, not names. */
function getAuthorUrls(author: any): string[] {
  return (Array.isArray(author) ? author : [author])
    .map((a) => (a && typeof a === 'object' ? a.url : undefined))
    .filter((url): url is string => typeof url === 'string');
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

/** Resolves like a browser: "/img.jpg" against the origin, "img.jpg" against the site path. */
function resolveAbsUrl(url: string, siteUrl?: string): string {
  return siteUrl ? new URL(url, siteUrl).href : url;
}

function resolveCanonical(item: Record<string, any>, pageItems: Record<string, any>[], canonicalUrl: string): string {
  const pageUrl = pageItems.find((page) => page !== item && typeof page.url === 'string')?.url;
  if (pageUrl) return pageUrl;
  if (item.mainEntityOfPage && typeof item.mainEntityOfPage === 'object' && item.mainEntityOfPage['@id']) {
    return item.mainEntityOfPage['@id'];
  }
  if (hasType(item, ...PAGE_TYPES) && typeof item.url === 'string') return item.url;
  return canonicalUrl;
}

const DURATION_RE = /^P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;

/**
 * Seconds of an ISO 8601 duration with weeks, days and time parts (`PT1H30M`, `P1DT1H`).
 * Years and months have no fixed length, so durations using them give `undefined`.
 */
function durationSeconds(duration: string): number | undefined {
  const match = duration.match(DURATION_RE);
  if (!match) return undefined;
  const [weeks, days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0));
  return Math.round(weeks * 604800 + days * 86400 + hours * 3600 + minutes * 60 + seconds);
}

function extractReadingTime(item: Record<string, any>): string | undefined {
  if (item.readingTime !== undefined) return item.readingTime.toString();
  if (typeof item.timeRequired === 'string') {
    const seconds = durationSeconds(item.timeRequired);
    if (seconds === undefined) return item.timeRequired;
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes > 0) return `${totalMinutes} min`;
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

/** All robots directives set on the page; conflicting ones are all kept, crawlers apply the most restrictive. */
function mergeRobots(values: Array<string | undefined>): string | undefined {
  const directives = new Set(values.flatMap((value) => value?.split(',').map((d) => d.trim()).filter(Boolean) ?? []));
  return directives.size > 0 ? [...directives].join(', ') : undefined;
}

/** One alternate per hreflang; the first schema setting a language wins. */
function mergeAlternates(lists: Array<Array<{ href: string; hreflang: string }> | undefined>) {
  const byLang = new Map<string, { href: string; hreflang: string }>();
  for (const alt of lists.flat()) {
    if (alt && !byLang.has(alt.hreflang.toLowerCase())) byLang.set(alt.hreflang.toLowerCase(), alt);
  }
  return byLang.size > 0 ? [...byLang.values()] : undefined;
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
  siteUrl: string | undefined,
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
  const authorUrls = getAuthorUrls(item.author).map((url) => resolveAbsUrl(url, siteUrl));
  if (authorUrls.length > 0) openGraph['article:author'] = authorUrls;
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
  if (typeof item.duration === 'string') {
    const totalSeconds = durationSeconds(item.duration);
    if (totalSeconds) openGraph['video:duration'] = totalSeconds.toString();
  }
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
  },
  /** Schemas describing the page itself (see `findPageItems`). */
  pageItems: Record<string, any>[] = []
): GeneratedMeta {
  // A ProfilePage describes its person in `mainEntity`; a JobPosting names itself via `title`.
  const subject = hasType(item, 'ProfilePage') && item.mainEntity && typeof item.mainEntity === 'object' ? item.mainEntity : item;
  const title: string | undefined = subject.headline ?? subject.name ?? (hasType(item, 'JobPosting') ? subject.title : undefined);
  const description = typeof subject.description === 'string' ? toPlainText(subject.description) || undefined : undefined;

  const openGraph: Record<string, string | string[]> = {};
  const twitter: Record<string, string> = {};

  if (title) {
    openGraph['og:title'] = title;
    twitter['twitter:title'] = title;
  }
  if (description) {
    openGraph['og:description'] = description;
    twitter['twitter:description'] = description;
  }

  const canonical = resolveCanonical(item, pageItems, context.canonicalUrl);
  openGraph['og:url'] = canonical;

  resolveImageTags(subject, context.siteUrl, openGraph, twitter);
  twitter['twitter:card'] = openGraph['og:image'] ? 'summary_large_image' : 'summary';

  const siteName = resolveSiteName(item, context.siteName);
  if (siteName) openGraph['og:site_name'] = siteName;

  const locale = resolveLocale(item, context.locale);
  if (locale) openGraph['og:locale'] = locale;

  if (hasType(item, 'Article', 'BlogPosting', 'NewsArticle')) {
    buildArticleOpenGraph(item, context.siteUrl, context.twitterCreator, openGraph, twitter);
  } else if (hasType(item, 'VideoObject')) {
    buildVideoOpenGraph(item, context.siteUrl, openGraph);
  } else {
    openGraph['og:type'] = 'website';
  }

  const twitterSite = resolveTwitterSite(item, context.twitterSite);
  if (twitterSite) twitter['twitter:site'] = twitterSite;

  return {
    canonical,
    description,
    robots: mergeRobots([item, ...pageItems].map(extractRobots)),
    author: getAuthorName(item.author),
    readingTime: extractReadingTime(item),
    alternates: mergeAlternates([...pageItems, item].map(extractAlternates)),
    openGraph,
    twitter,
  };
}
