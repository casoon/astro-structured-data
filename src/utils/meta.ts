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
  if (typeof val === 'string') {
    return { url: val };
  }
  if (Array.isArray(val)) {
    const first = val[0];
    return getImageObject(first);
  }
  if (typeof val === 'object') {
    const url = val.url || val.contentUrl;
    if (typeof url === 'string') {
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
  }
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
  const description = item.description;
  
  // Resolve canonical URL from the schema itself (e.g. mainEntityOfPage.@id) or context URL
  let canonical = context.canonicalUrl;
  if (item.mainEntityOfPage && typeof item.mainEntityOfPage === 'object' && item.mainEntityOfPage['@id']) {
    canonical = item.mainEntityOfPage['@id'];
  } else if (item.url && typeof item.url === 'string') {
    canonical = item.url;
  }

  // Extract author
  const author = getAuthorName(item.author);

  // Extract reading time (non-standard)
  let readingTime: string | undefined = undefined;
  if (item.readingTime !== undefined) {
    readingTime = item.readingTime.toString();
  } else if (typeof item.timeRequired === 'string') {
    const match = item.timeRequired.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      const totalMinutes = hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
      if (totalMinutes > 0) {
        readingTime = `${totalMinutes} min`;
      }
    } else {
      readingTime = item.timeRequired;
    }
  }

  // Resolve robots metadata
  let robots: string | undefined = undefined;
  if (typeof item.robots === 'string') {
    robots = item.robots;
  } else if (item.noindex !== undefined || item.nofollow !== undefined) {
    const parts: string[] = [];
    if (item.noindex) parts.push('noindex');
    if (item.nofollow) parts.push('nofollow');
    if (parts.length > 0) {
      robots = parts.join(', ');
    }
  }

  // Resolve canonical alternates (hreflang)
  const alternates: Array<{ href: string; hreflang: string }> = [];
  if (Array.isArray(item.alternates)) {
    for (const alt of item.alternates) {
      if (alt && typeof alt === 'object' && alt.href && alt.hreflang) {
        alternates.push({ href: alt.href, hreflang: alt.hreflang });
      }
    }
  }
  if (item.workTranslation) {
    const processTranslation = (trans: any) => {
      if (trans && typeof trans === 'object' && trans.url && trans.inLanguage) {
        alternates.push({ href: trans.url, hreflang: trans.inLanguage });
      }
    };
    if (Array.isArray(item.workTranslation)) {
      item.workTranslation.forEach(processTranslation);
    } else {
      processTranslation(item.workTranslation);
    }
  }

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

  if (canonical) {
    openGraph['og:url'] = canonical;
  }

  // Resolve image metadata
  const imgObj = getImageObject(item.image || item.thumbnailUrl);
  let absImage = imgObj?.url;
  if (absImage && !absImage.startsWith('http') && context.siteUrl) {
    const base = context.siteUrl.replace(/\/$/, '');
    const path = absImage.startsWith('/') ? absImage : `/${absImage}`;
    absImage = `${base}${path}`;
  }

  if (absImage) {
    openGraph['og:image'] = absImage;
    twitter['twitter:image'] = absImage;

    if (imgObj?.width) {
      openGraph['og:image:width'] = imgObj.width.toString();
    }
    if (imgObj?.height) {
      openGraph['og:image:height'] = imgObj.height.toString();
    }
    if (imgObj?.type) {
      openGraph['og:image:type'] = imgObj.type;
    }
    if (imgObj?.alt) {
      openGraph['og:image:alt'] = imgObj.alt;
      twitter['twitter:image:alt'] = imgObj.alt;
    }
  }

  // Set card type
  twitter['twitter:card'] = absImage ? 'summary_large_image' : 'summary';

  // Site name
  let siteName = context.siteName;
  if (!siteName) {
    if (item.isPartOf && typeof item.isPartOf === 'object' && typeof item.isPartOf.name === 'string') {
      siteName = item.isPartOf.name;
    }
    if (!siteName && item.publisher && typeof item.publisher === 'object' && typeof item.publisher.name === 'string') {
      siteName = item.publisher.name;
    }
  }
  if (siteName) {
    openGraph['og:site_name'] = siteName;
  }

  // Locale
  let locale = context.locale;
  if (!locale && item.inLanguage) {
    if (typeof item.inLanguage === 'string') {
      locale = item.inLanguage;
    } else if (Array.isArray(item.inLanguage) && typeof item.inLanguage[0] === 'string') {
      locale = item.inLanguage[0];
    }
  }
  if (locale) {
    if (typeof locale === 'string') {
      const match = locale.match(/^([a-zA-Z]{2})[-_]([a-zA-Z]{2})$/);
      if (match) {
        locale = `${match[1].toLowerCase()}_${match[2].toUpperCase()}`;
      }
    }
    openGraph['og:locale'] = locale;
  }

  // Specific mappings for Article schema
  if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
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
    
    const author = getAuthorName(item.author);
    if (author) {
      openGraph['article:author'] = author;
    }

    // Article section
    if (item.articleSection) {
      if (typeof item.articleSection === 'string') {
        openGraph['article:section'] = item.articleSection;
      } else if (Array.isArray(item.articleSection)) {
        openGraph['article:section'] = item.articleSection.filter(s => typeof s === 'string');
      }
    }

    // Article tag (keywords)
    if (item.keywords) {
      let tags: string[] = [];
      if (typeof item.keywords === 'string') {
        tags = item.keywords.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(item.keywords)) {
        tags = item.keywords.filter(t => typeof t === 'string');
      }
      if (tags.length > 0) {
        openGraph['article:tag'] = tags;
      }
    }

    // Twitter creator
    let twitterCreator = context.twitterCreator;
    if (!twitterCreator && item.author) {
      const getTwitterHandleFromSameAs = (sameAs: any): string | undefined => {
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
      };
      
      if (typeof item.author === 'object') {
        if (item.author.twitter && typeof item.author.twitter === 'string') {
          twitterCreator = item.author.twitter.startsWith('@') ? item.author.twitter : `@${item.author.twitter}`;
        } else if (item.author.sameAs) {
          const handle = getTwitterHandleFromSameAs(item.author.sameAs);
          if (handle) twitterCreator = handle;
        }
      }
    }
    if (twitterCreator) {
      twitter['twitter:creator'] = twitterCreator;
    }
  } else if (type === 'VideoObject') {
    openGraph['og:type'] = 'video.other';
    const videoUrl = item.contentUrl || item.embedUrl;
    if (videoUrl) {
      let absVideo = videoUrl;
      if (absVideo && !absVideo.startsWith('http') && context.siteUrl) {
        const base = context.siteUrl.replace(/\/$/, '');
        const path = absVideo.startsWith('/') ? absVideo : `/${absVideo}`;
        absVideo = `${base}${path}`;
      }
      openGraph['og:video'] = absVideo;
      if (item.embedUrl) {
        openGraph['og:video:secure_url'] = absVideo;
      }
    }
    if (item.duration) {
      const match = item.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
      if (match) {
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        if (totalSeconds > 0) {
          openGraph['video:duration'] = totalSeconds.toString();
        }
      }
    }
  } else {
    openGraph['og:type'] = 'website';
  }

  // Twitter site
  let twitterSite = context.twitterSite;
  if (!twitterSite) {
    const getTwitterHandleFromSameAs = (sameAs: any): string | undefined => {
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
    };
    
    if (item.publisher && typeof item.publisher === 'object') {
      if (item.publisher.twitter && typeof item.publisher.twitter === 'string') {
        twitterSite = item.publisher.twitter.startsWith('@') ? item.publisher.twitter : `@${item.publisher.twitter}`;
      } else if (item.publisher.sameAs) {
        const handle = getTwitterHandleFromSameAs(item.publisher.sameAs);
        if (handle) twitterSite = handle;
      }
    }
  }
  if (twitterSite) {
    twitter['twitter:site'] = twitterSite;
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
    description,
    robots,
    author,
    readingTime,
    alternates: alternates.length > 0 ? alternates : undefined,
    openGraph,
    twitter,
    sitemapAttrs
  };
}
