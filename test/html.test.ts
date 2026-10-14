import { expect, test } from 'vitest';
import { tokenize, type Tag } from '../src/utils/html.ts';

const tags = (html: string) => [...tokenize(html)].map((t: Tag) => (t.kind === 'end' ? `/${t.name}` : t.name));

test('reads start and end tags with attributes in every quoting style', () => {
  const [meta] = [...tokenize(`<META Name='robots' content="no&amp;index" data-x=1 data-x=2 hidden>`)];
  expect(meta).toMatchObject({ kind: 'start', name: 'meta', attrs: { name: 'robots', content: 'no&index', 'data-x': '1', hidden: '' } });
});

test('a ">" inside a quoted attribute value does not end the tag', () => {
  expect(tags('<meta content="a > b"><link rel="x">')).toEqual(['meta', 'link']);
});

test('skips comments, including the short and incorrectly closed forms', () => {
  expect(tags('<!-- <meta name="a"> --><!--><p><!---><b><!-- x --!><i>')).toEqual(['p', 'b', 'i']);
  // Doctype, processing instructions and CDATA (outside SVG/MathML) are bogus comments up to the first ">".
  expect(tags('<!DOCTYPE html><?xml x?><![CDATA[x]]><br>')).toEqual(['br']);
});

test('script content is not tokenized, whatever it contains', () => {
  const html = `<script>const s = "</head><meta name='robots'>"; if (a<b) {}</script><meta name="real">`;
  const list = [...tokenize(html)];
  expect(list.map((t) => t.name)).toEqual(['script', 'script', 'meta']);
  expect((list[0] as any).content).toBe(`const s = "</head><meta name='robots'>"; if (a<b) {}`);
});

test('script data escapes: "<script" inside "<!--" needs its own "</script>"', () => {
  const html = '<script><!-- document.write("<script>x()</script>") --></script><p>';
  const list = [...tokenize(html)];
  expect(list.map((t) => t.name)).toEqual(['script', 'script', 'p']);
  expect((list[0] as any).content).toBe('<!-- document.write("<script>x()</script>") -->');
  // "<!-->" leaves the escaped state at once, so the next "</script>" ends the element.
  expect(tags('<script><!--></script><p>')).toEqual(['script', '/script', 'p']);
});

test('RAWTEXT and RCDATA elements end only at their own end tag', () => {
  expect(tags('<title>a </head> <meta></title><style>p{} </style ><textarea><link></TEXTAREA><b>'))
    .toEqual(['title', '/title', 'style', '/style', 'textarea', '/textarea', 'b']);
  expect(tags('<title></titles></title>')).toEqual(['title', '/title']);
});

test('a lone "<" and "</>" are text', () => {
  expect(tags('a < b </> c <1 <a>')).toEqual(['a']);
});

test('unterminated constructs run to the end of input', () => {
  expect(tags('<script>never closed <meta>')).toEqual(['script']);
  expect(tags('<!-- open <meta>')).toEqual([]);
  expect(tags('<meta content="open')).toEqual(['meta']);
});

test('out-of-range character references become U+FFFD', () => {
  const [tag] = [...tokenize('<a title="&#x110000;&#0;&#65;">')];
  expect((tag as any).attrs.title).toBe('��A');
});
