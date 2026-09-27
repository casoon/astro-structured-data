---
title: Upgrading from 1.x
description: 2.0 validates strictly and fails the build instead of rendering invalid data. Most upgrades come down to fixing what the build reports.
order: 5
---

1. **Run a build.** Every invalid prop is reported with component, page and field (see
   [Validation](../validation/)). Unknown props and unknown integration options are errors
   now, too.
2. **Provide values that used to be invented:** `LocalBusinessSchema` and `OrganizationSchema`
   need a `name`, `JobPostingSchema` a `hiringOrganizationName` (each can also come from the
   configured defaults). `baseSalary` needs a `unit`. `employmentType`, `operatingSystem` and
   `applicationCategory` are no longer defaulted: set them explicitly where you relied on
   `'FULL_TIME'`, `'Web'` or `'DeveloperApplication'`.
3. **Graph mode:** keep exactly one `<SchemaGraph />` in the base layout. Its position no
   longer affects which schemas are included.
4. **Online events:** use `attendanceMode="Online"` with `onlineUrl` instead of a placeholder
   address.
5. **Options:** `defaultArticlePublisher` is `{ name, logo?: { url } }` and
   `defaultLocalBusiness` takes the `LocalBusinessSchema` props.
6. **Meta tags** now come from the middleware and are inserted into `<head>`; tags your layout
   already defines are kept. A workaround for meta tags ending up in `<body>` can go.

The full list of changes is in the [changelog](../../../changelog/).
