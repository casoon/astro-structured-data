---
title: Graph mode
description: Merge all schemas of a page into one @graph block.
order: 3
---

By default every component writes its own JSON-LD block. With `useGraph: true`, all schemas of
a page are combined into a single block with an `@graph` array:

```js
structuredData({ useGraph: true })
```

Place `<SchemaGraph />` once in your base layout where the block should appear, for example at
the end of `<body>`:

```astro
---
import { SchemaGraph } from '@casoon/astro-structured-data/components';
---
<body>
  <slot />
  <SchemaGraph />
</body>
```

`<SchemaGraph />` only marks the position. The `@graph` is filled in by the integration's
middleware after the whole page has rendered, so schema components can sit anywhere: before or
after it, and in components that await data. Schemas are collected per page path, so nothing
leaks from one page into the next during a static build.

A page with schemas but without `<SchemaGraph />`, or with more than one, fails the build
instead of silently losing data. Without `useGraph`, `<SchemaGraph />` renders nothing.
