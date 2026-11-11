import { z } from 'zod';
import { articleZodSchema, structuredDataOptionsSchema } from '../zod.js';
import { fail } from '../utils/validate.js';
import { buildReference, buildReferences } from '../utils/reference.js';

type Options = z.output<typeof structuredDataOptionsSchema>;

export type ArticleData = z.output<typeof articleZodSchema>;

export interface ArticleContext {
  /** Absolute URL of the page the article is rendered on (its `mainEntityOfPage`). */
  url: string;
  /** Pathname of the page, for error messages. */
  page: string;
  /** Site-wide defaults from the integration options. */
  config: Pick<Options, 'defaultArticlePublisher'>;
}

/** Builds the schema.org Article (or subtype) from validated `<ArticleSchema>` props. Throws on an incomplete publisher. */
export function buildArticle(props: ArticleData, { url, page, config }: ArticleContext): Record<string, any> {
  const {
    id,
    title,
    description,
    datePublished,
    dateModified,
    authorName,
    authorType = 'Person',
    authorUrl,
    authorId,
    imageUrl,
    imageWidth,
    imageHeight,
    imageFormat,
    imageCaption,
    publisherName,
    publisherLogo,
    publisherId,
    schemaType = 'BlogPosting',
    inLanguage,
    articleSection,
    keywords,
    wordCount,
    readingTimeMinutes,
    isAccessibleForFree = true,
    isPartOfHeadline,
    isPartOfUrl,
    isPartOf,
    seriesPosition,
    hasPart,
  } = props;

  const resolvedPublisherName = publisherName ?? config.defaultArticlePublisher?.name;
  const resolvedPublisherLogo = publisherLogo ?? config.defaultArticlePublisher?.logo?.url;
  // The default @id only belongs to the default publisher, not to one named via props.
  const resolvedPublisherId = publisherId ?? (publisherName ? undefined : config.defaultArticlePublisher?.id);
  if (resolvedPublisherLogo && !resolvedPublisherName) {
    fail('ArticleSchema', page, '"publisherLogo" needs a publisher name (publisherName prop or defaultArticlePublisher.name)');
  }
  if (publisherId && !resolvedPublisherName) {
    fail('ArticleSchema', page, '"publisherId" needs a publisher name (publisherName prop or defaultArticlePublisher.name)');
  }

  const buildAuthor = (name: string) => ({
    '@type': authorType,
    name,
    ...(authorId ? { '@id': authorId } : {}),
    ...(authorUrl ? { url: authorUrl } : {}),
  });

  const articleSchema: Record<string, any> = {
    '@type': schemaType,
    ...(id ? { '@id': id } : {}),
    headline: title,
    description,
    datePublished,
    dateModified: dateModified ?? datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: Array.isArray(authorName)
      ? authorName.map(buildAuthor)
      : buildAuthor(authorName),
    isAccessibleForFree,
  };

  if (resolvedPublisherName) {
    articleSchema.publisher = {
      '@type': 'Organization',
      name: resolvedPublisherName,
      ...(resolvedPublisherId ? { '@id': resolvedPublisherId } : {}),
      ...(resolvedPublisherLogo
        ? { logo: { '@type': 'ImageObject', url: resolvedPublisherLogo } }
        : {}),
    };
  }

  if (imageUrl) {
    articleSchema.image = {
      '@type': 'ImageObject',
      url: imageUrl,
      ...(imageWidth ? { width: imageWidth } : {}),
      ...(imageHeight ? { height: imageHeight } : {}),
      ...(imageFormat ? { encodingFormat: imageFormat } : {}),
      ...(imageCaption ? { caption: imageCaption } : {}),
    };
  }

  if (inLanguage) articleSchema.inLanguage = inLanguage;
  if (articleSection) articleSchema.articleSection = articleSection;

  if (keywords) {
    articleSchema.keywords = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  }

  if (wordCount) articleSchema.wordCount = wordCount;
  if (readingTimeMinutes) articleSchema.timeRequired = `PT${readingTimeMinutes}M`;

  if (isPartOf) {
    articleSchema.isPartOf = buildReferences(isPartOf, schemaType);
  } else if (isPartOfHeadline && isPartOfUrl) {
    articleSchema.isPartOf = buildReference({ headline: isPartOfHeadline, url: isPartOfUrl }, schemaType);
  }
  if (articleSchema.isPartOf && seriesPosition !== undefined) articleSchema.position = seriesPosition;

  if (hasPart) articleSchema.hasPart = hasPart.map((part) => buildReference(part, schemaType));

  return articleSchema;
}
