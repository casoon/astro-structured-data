---
title: FAQSchema
description: Outputs a FAQPage with Question and Answer items, for pages that list questions with their answers.
order: 9
---

`FAQSchema` produces a [`FAQPage`](https://schema.org/FAQPage) whose `mainEntity` is a list of
[`Question`](https://schema.org/Question) items, each with an `acceptedAnswer` of type
[`Answer`](https://schema.org/Answer). Use it on a page whose main content is a list of
questions and answers.

Google retired FAQ rich results in May 2026, so the markup no longer produces an FAQ display in
Google Search. It is still valid schema.org markup that other consumers can read, and the Dev
Toolbar notes the retirement in its FAQ preview. Google's former FAQ documentation now
redirects to the announcement in [Google Search
updates](https://developers.google.com/search/updates#removing-faq-rich-result).

## Example

```astro
---
// src/pages/faq.astro
import Layout from '../layouts/Layout.astro';
import { FAQSchema } from '@casoon/astro-structured-data/components';

const faqs = [
  { question: 'Which Astro versions are supported?', answer: 'Astro 5, 6 and 7.' },
  {
    question: 'Does it work with SSR?',
    answer: 'Yes. Static builds, the dev server and on-demand rendering produce the same output.',
  },
];
---
<Layout title="FAQ">
  <h1>FAQ</h1>
  {faqs.map(({ question, answer }) => (
    <details>
      <summary>{question}</summary>
      <p>{answer}</p>
    </details>
  ))}
  <FAQSchema questions={faqs} />
</Layout>
```

Keeping the questions in one array, as above, renders the visible text and the structured data
from the same source, so they cannot drift apart.

## Output

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Which Astro versions are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Astro 5, 6 and 7."
      }
    },
    {
      "@type": "Question",
      "name": "Does it work with SSR?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Static builds, the dev server and on-demand rendering produce the same output."
      }
    }
  ]
}
```

## Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | No | – | Output as the FAQ page's `@id`, so other nodes can reference it |
| `questions` | `{ question: string; answer: string }[]` | Yes | – | The question and answer pairs, in display order. `question` becomes the Question's `name`, `answer` the Answer's `text`. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

## Rules

- `questions` needs at least one entry ("At least one question is required").
- `question` and `answer` must not be empty or whitespace only. Other keys in an entry are
  rejected.
- The answer text is output as given. It may contain HTML; the JSON-LD output is escaped so it
  cannot close the `<script>` block.
- FAQPage has no recommended fields, so the build report never warns about it.

## Meta tags

With `generateMeta: true` a FAQPage can be the page's primary schema, but it has no title,
description or image to offer. On its own, the page above only gets the canonical link,
`og:url`, `og:type` and `twitter:card`. A `WebPageSchema` next to it does not change that,
because FAQPage ranks before WebPage as primary schema; set title and description tags in the
layout yourself (tags the page defines are kept). `robots` and `hreflang` settings from a
`WebPageSchema` on the same page still apply. See [Meta tags and sitemap
hints](../../guides/meta-tags/).
