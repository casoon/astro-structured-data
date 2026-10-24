// Illustrates a search result from the JSON-LD an example produced, for the showcase's output
// panel. Build time only: the card is plain HTML, every value comes from the rendered schema.

type Item = Record<string, any>;

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const list = (value: unknown): any[] => (value === undefined || value === null ? [] : [value].flat());

const typesOf = (item: Item) => list(item['@type']).map(String);

// The wall-clock time as written in the ISO string, so the card does not depend on the build machine.
function wallClock(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!m) return undefined;
  const [, y, mo, d, h, mi] = m;
  return { date: new Date(Date.UTC(+y, +mo - 1, +d)), time: h ? `${h}:${mi}` : undefined };
}

function dateLabel(iso: unknown, withWeekday = false) {
  const clock = typeof iso === 'string' ? wallClock(iso) : undefined;
  if (!clock) return undefined;
  const label = clock.date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: withWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: withWeekday ? undefined : 'numeric',
  });
  return clock.time ? `${label}, ${clock.time}` : label;
}

function durationLabel(iso: unknown) {
  const m = typeof iso === 'string' ? /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso) : null;
  if (!m) return undefined;
  return [m[1] && `${m[1]} h`, m[2] && `${m[2]} min`].filter(Boolean).join(' ') || undefined;
}

const name = (value: any): string | undefined =>
  typeof value === 'string' ? value : value?.name;

const money = (price: unknown, currency: unknown) => {
  if (price === undefined || price === null) return undefined;
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const code = String(currency ?? '');
  const amount = Number(price);
  const shown = amount.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 });
  return `${symbols[code] ?? code + ' '}${shown}`;
};

const rating = (item: Item) => {
  const r = item.aggregateRating;
  if (!r?.ratingValue) return '';
  const value = Number(r.ratingValue);
  const stars = '★'.repeat(Math.floor(value)).padEnd(5, '☆');
  return `<p class="sd-rating"><span class="sd-stars" aria-hidden="true">${stars}</span><span>${esc(value)} (${esc(r.reviewCount ?? r.ratingCount ?? 0)} reviews)</span></p>`;
};

const meta = (parts: Array<string | undefined>) => {
  const shown = parts.filter(Boolean);
  return shown.length ? `<p class="sd-meta">${shown.map((p) => `<span>${esc(p)}</span>`).join('')}</p>` : '';
};

const text = (value: unknown) => (value ? `<p class="sd-text">${esc(value)}</p>` : '');

const result = (path: string, title: unknown, body: string) =>
  `<p class="sd-path">${esc(path)}</p><p class="sd-title">${esc(title)}</p>${body}`;

type Renderer = (item: Item) => string;

const renderers: Record<string, Renderer> = {
  Article: (a) =>
    result(
      'example.com › blog',
      a.headline,
      meta([dateLabel(a.datePublished), name(a.author), durationLabel(a.timeRequired) && `${durationLabel(a.timeRequired)} read`]) +
        text(a.description)
    ),

  Product: (p) => {
    const offer = list(p.offers)[0] ?? {};
    const stock = /OutOfStock/.test(offer.availability ?? '') ? 'Out of stock' : offer.availability ? 'In stock' : undefined;
    return result(
      'example.com › shop',
      [p.name, name(p.brand)].filter(Boolean).join(' – '),
      rating(p) + meta([money(offer.price, offer.priceCurrency), stock]) + text(p.description)
    );
  },

  Recipe: (r) => {
    const steps = list(r.recipeInstructions).length;
    const ingredients = list(r.recipeIngredient);
    return result(
      'example.com › recipes',
      r.name,
      rating(r) +
        meta([
          durationLabel(r.prepTime) && `Prep ${durationLabel(r.prepTime)}`,
          durationLabel(r.cookTime) && `Cook ${durationLabel(r.cookTime)}`,
          list(r.recipeYield)[0],
        ]) +
        text(r.description) +
        (ingredients.length
          ? `<p class="sd-text sd-muted">Ingredients: ${esc(ingredients.slice(0, 4).join(', '))}${ingredients.length > 4 ? ', …' : ''}</p>`
          : '') +
        (steps ? `<p class="sd-text sd-muted">${steps} steps</p>` : '')
    );
  },

  FAQPage: (f) =>
    `<p class="sd-path">example.com › faq</p><ul class="sd-faq">${list(f.mainEntity)
      .map(
        (q) =>
          `<li><details><summary>${esc(q.name)}</summary><p>${esc(q.acceptedAnswer?.text)}</p></details></li>`
      )
      .join('')}</ul>`,

  Event: (e) => {
    const clock = typeof e.startDate === 'string' ? wallClock(e.startDate) : undefined;
    const month = clock?.date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }) ?? '';
    const day = clock ? String(clock.date.getUTCDate()) : '';
    const places = list(e.location).map((l) =>
      l['@type'] === 'VirtualLocation' ? 'Online' : (l.name ?? name(l.address))
    );
    const free = list(e.offers).some((o) => Number(o.price) === 0) ? 'Free' : undefined;
    return `<div class="sd-event"><div class="sd-datebox"><span>${esc(month)}</span><strong>${esc(day)}</strong></div><div><p class="sd-title">${esc(e.name)}</p>${meta([clock?.time, ...places, free])}${text(e.description)}</div></div>`;
  },

  JobPosting: (j) => {
    const remote = j.jobLocationType === 'TELECOMMUTE';
    const salary = j.baseSalary?.value;
    const pay = salary
      ? `${money(salary.value ?? salary.minValue, j.baseSalary.currency)} / ${String(salary.unitText ?? 'YEAR').toLowerCase()}`
      : undefined;
    return result(
      'example.com › jobs',
      j.title,
      meta([name(j.hiringOrganization), remote ? 'Remote' : name(j.jobLocation?.address), String(j.employmentType ?? '').replace('_', ' ') || undefined, pay])
    );
  },

  LocalBusiness: (b) => {
    const a = b.address;
    const address = a ? [a.streetAddress, [a.postalCode, a.addressLocality].filter(Boolean).join(' ')].filter(Boolean).join(', ') : undefined;
    return result(
      'example.com › contact',
      b.name,
      meta([b.telephone, address]) + meta([list(b.openingHours).join(' · ') || undefined])
    );
  },

  BreadcrumbList: (b) =>
    `<p class="sd-trail">${list(b.itemListElement)
      .sort((x, y) => x.position - y.position)
      .map((i) => esc(i.name))
      .join(' › ')}</p>`,
};

renderers.BlogPosting = renderers.Article;
renderers.NewsArticle = renderers.Article;

/** The search result illustration for the first item of a known type, or `undefined`. */
export function previewHtml(jsonLd: unknown[]): string | undefined {
  const items = jsonLd.flatMap((entry) => ((entry as Item)['@graph'] ? (entry as Item)['@graph'] : [entry])) as Item[];
  for (const item of items) {
    const type = typesOf(item).find((t) => t in renderers);
    if (type) return `<div class="sd-preview" role="group" aria-label="Search result illustration">${renderers[type](item)}</div>`;
  }
  return undefined;
}

/** Styles for the card; uses the theme's colour tokens. Included once per output. */
export const previewStyles = `<style>
.sd-preview{padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--bg-deep)}
.sd-preview p{margin:0}
.sd-path{color:var(--muted);font-size:13px}
.sd-title{margin:4px 0 8px!important;color:var(--accent);font-size:19px;font-weight:500;line-height:1.3}
.sd-meta{display:flex;flex-wrap:wrap;gap:4px 0;color:var(--muted);font-size:13.5px}
.sd-meta>span+span::before{content:'·';margin:0 8px}
.sd-meta+.sd-meta{margin-top:2px}
.sd-rating{display:flex;gap:6px;margin-bottom:2px!important;color:var(--muted);font-size:13.5px}
.sd-stars{color:var(--brand);letter-spacing:1px}
.sd-text{margin-top:8px!important;font-size:14.5px}
.sd-muted{color:var(--muted);font-size:13.5px}
.sd-trail{color:var(--accent);font-size:14px}
.sd-faq{display:flex;flex-direction:column;gap:6px;margin:10px 0 0;padding:0;list-style:none}
.sd-faq details{border:1px solid var(--border);border-radius:8px;background:var(--surface)}
.sd-faq summary{padding:10px 12px;color:var(--heading);font-size:14.5px;cursor:pointer}
.sd-faq details p{padding:0 12px 12px;font-size:14px}
.sd-event{display:flex;gap:14px;align-items:flex-start}
.sd-datebox{display:flex;flex-direction:column;align-items:center;min-width:52px;padding:6px 8px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);line-height:1.2}
.sd-datebox span{color:var(--accent);font-size:12px;text-transform:uppercase}
.sd-datebox strong{color:var(--heading);font-size:20px}
.sd-json{margin-top:14px;border-radius:12px;background:var(--term-bg);color:var(--term-text)}
.sd-json pre{margin:0;padding:16px;overflow:auto;font-size:12.5px;line-height:1.8}
</style>`;
