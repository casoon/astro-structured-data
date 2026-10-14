/**
 * A minimal HTML tokenizer: it finds the real start and end tags of a document the way a
 * browser's tokenizer does (WHATWG HTML §13.2.5, as in the html5-parser crate), so that text in
 * comments, in `<script>`/`<style>` content or in `<title>`/`<textarea>` is never taken for a
 * tag. Only what the integration needs is modelled: tag names, attributes and the raw content
 * of text-only elements. No tree is built (no implied tags, no foreign-content rules), and
 * character references in attribute values are decoded for the common forms only.
 */

export interface StartTag {
  kind: 'start';
  /** Lower-case tag name. */
  name: string;
  /** Lower-case attribute names; the first occurrence of a name wins, as in browsers. */
  attrs: Record<string, string>;
  /** Offset of `<`. */
  start: number;
  /** Offset after `>`. */
  end: number;
  /** Raw content of text-only elements (script, style, title, textarea, …). */
  content?: string;
}

export interface EndTag {
  kind: 'end';
  name: string;
  start: number;
  end: number;
}

export type Tag = StartTag | EndTag;

// Elements whose content the tokenizer reads as text (§13.2.6.4.4 "in head", "in body").
// <noscript> is RAWTEXT with scripting enabled — what browsers and rendering crawlers do.
const RAW_TEXT = new Set(['style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'title', 'textarea']);

const ASCII_ALPHA = /[a-zA-Z]/;
const WHITESPACE = /[\t\n\f\r ]/;

/** Yields the start and end tags of `html` in document order. */
export function* tokenize(html: string): Generator<Tag> {
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) return;
    const next = html[lt + 1] ?? '';

    if (html.startsWith('<!--', lt)) {
      i = commentEnd(html, lt + 4);
    } else if (next === '!' || next === '?') {
      // DOCTYPE, CDATA outside foreign content and processing instructions: bogus comments.
      i = gtOrEof(html, lt + 2);
    } else if (next === '/') {
      const c = html[lt + 2] ?? '';
      if (ASCII_ALPHA.test(c)) {
        const tag = readTag(html, lt + 2);
        yield { kind: 'end', name: tag.name, start: lt, end: tag.end };
        i = tag.end;
      } else if (c === '>') {
        i = lt + 3; // "</>" is ignored
      } else {
        i = gtOrEof(html, lt + 2);
      }
    } else if (ASCII_ALPHA.test(next)) {
      const tag = readTag(html, lt + 1);
      const start: StartTag = { kind: 'start', name: tag.name, attrs: tag.attrs, start: lt, end: tag.end };
      if (tag.name === 'plaintext') {
        yield { ...start, content: html.slice(tag.end) };
        return;
      }
      if (tag.name === 'script' || RAW_TEXT.has(tag.name)) {
        const close = tag.name === 'script' ? scriptDataEnd(html, tag.end) : rawTextEnd(html, tag.end, tag.name);
        yield { ...start, content: html.slice(tag.end, close) };
        i = close; // the end tag itself is yielded by the next iteration
      } else {
        yield start;
        i = tag.end;
      }
    } else {
      i = lt + 1; // a lone "<" is text
    }
  }
}

/** Offset after the comment that starts at `i` (just after "<!--"). */
function commentEnd(html: string, i: number): number {
  if (html.startsWith('>', i)) return i + 1; // "<!-->"
  if (html.startsWith('->', i)) return i + 2; // "<!--->"
  const ends = [html.indexOf('-->', i), html.indexOf('--!>', i)].filter((n) => n !== -1);
  if (ends.length === 0) return html.length;
  const end = Math.min(...ends);
  return end + (html.startsWith('-->', end) ? 3 : 4);
}

function gtOrEof(html: string, i: number): number {
  const gt = html.indexOf('>', i);
  return gt === -1 ? html.length : gt + 1;
}

/** Reads a tag name and its attributes from `i` (the first letter of the name) up to and including `>`. */
function readTag(html: string, i: number): { name: string; attrs: Record<string, string>; end: number } {
  let name = '';
  while (i < html.length && !WHITESPACE.test(html[i]) && html[i] !== '/' && html[i] !== '>') name += html[i++];
  const attrs: Record<string, string> = {};

  while (i < html.length) {
    // Before attribute name: whitespace and "/" (self-closing flags are irrelevant here).
    while (i < html.length && (WHITESPACE.test(html[i]) || html[i] === '/')) i++;
    if (i >= html.length) break;
    if (html[i] === '>') return { name: name.toLowerCase(), attrs, end: i + 1 };

    // Attribute name; a leading "=" belongs to the name.
    let attrName = html[i++];
    while (i < html.length && !WHITESPACE.test(html[i]) && !'/>='.includes(html[i])) attrName += html[i++];
    while (i < html.length && WHITESPACE.test(html[i])) i++;

    let value = '';
    if (html[i] === '=') {
      i++;
      while (i < html.length && WHITESPACE.test(html[i])) i++;
      const quote = html[i];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        value = html.slice(i + 1, close === -1 ? html.length : close);
        i = close === -1 ? html.length : close + 1;
      } else {
        while (i < html.length && !WHITESPACE.test(html[i]) && html[i] !== '>') value += html[i++];
      }
    }
    const key = attrName.toLowerCase();
    if (!(key in attrs)) attrs[key] = decodeCharacterReferences(value);
  }
  return { name: name.toLowerCase(), attrs, end: html.length };
}

/** Whether an end tag named `name` (any case) starts at `i`, followed by whitespace, "/" or ">". */
function isEndTag(html: string, i: number, name: string): boolean {
  if (!html.startsWith('</', i) || html.slice(i + 2, i + 2 + name.length).toLowerCase() !== name) return false;
  const after = html[i + 2 + name.length] ?? '';
  return WHITESPACE.test(after) || after === '/' || after === '>';
}

/** Offset of the end tag closing a RAWTEXT/RCDATA element, or the end of input. */
function rawTextEnd(html: string, i: number, name: string): number {
  for (let lt = html.indexOf('</', i); lt !== -1; lt = html.indexOf('</', lt + 2)) {
    if (isEndTag(html, lt, name)) return lt;
  }
  return html.length;
}

/** Whether `<script` (any case) starts at `i`, followed by whitespace, "/" or ">". */
function isScriptOpen(html: string, i: number): boolean {
  if (html.slice(i, i + 7).toLowerCase() !== '<script') return false;
  const after = html[i + 7] ?? '';
  return WHITESPACE.test(after) || after === '/' || after === '>';
}

/**
 * Offset of the `</script>` closing script data (§13.2.5.4 ff.): inside "<!--" a nested
 * "<script" switches to the double-escaped state, where "</script" does not end the element.
 */
function scriptDataEnd(html: string, i: number): number {
  let state: 'data' | 'escaped' | 'double' = 'data';
  while (i < html.length) {
    // In both escaped states, ">" right after two dashes returns to plain script data; the
    // dashes may be those of "<!--" itself ("<!-->").
    if (state !== 'data' && html[i] === '>' && html[i - 1] === '-' && html[i - 2] === '-') {
      state = 'data';
      i++;
      continue;
    }
    if (state === 'data') {
      if (html.startsWith('<!--', i)) {
        state = 'escaped';
        i += 4;
        continue;
      }
      if (isEndTag(html, i, 'script')) return i;
    } else if (state === 'escaped') {
      if (isEndTag(html, i, 'script')) return i;
      if (isScriptOpen(html, i)) {
        state = 'double';
        i += 7;
        continue;
      }
    } else {
      if (isEndTag(html, i, 'script')) {
        state = 'escaped';
        i += 8;
        continue;
      }
    }
    i++;
  }
  return html.length;
}

const NAMED_REFERENCES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Out-of-range and NUL code points become U+FFFD, as in browsers. */
function codePoint(n: number): string {
  return n === 0 || n > 0x10ffff ? '\ufffd' : String.fromCodePoint(n);
}

function decodeCharacterReferences(value: string): string {
  return value.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));?/g, (match, dec, hex, named) => {
    if (dec) return codePoint(Number(dec));
    if (hex) return codePoint(parseInt(hex, 16));
    return NAMED_REFERENCES[named] ?? match;
  });
}
