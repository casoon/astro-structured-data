---
title: RecipeSchema
description: Outputs a Recipe with ingredients, steps, times, nutrition and rating; use it on recipe pages.
order: 7
---

`RecipeSchema` describes one recipe. It outputs a [`Recipe`](https://schema.org/Recipe) with
[`HowToStep`](https://schema.org/HowToStep) instructions and targets Google's
[recipe rich result](https://developers.google.com/search/docs/appearance/structured-data/recipe)
(image, rating, cooking time and calories in search results and recipe carousels).

## Usage

A recipe page rendered from a content collection:

```yaml
# src/content/recipes/chocolate-chip-cookies.md (frontmatter)
title: Classic Chocolate Chip Cookies
description: Crispy edges, chewy and soft in the center.
images:
  - /images/recipes/cookies-1x1.jpg
  - /images/recipes/cookies-4x3.jpg
  - /images/recipes/cookies-16x9.jpg
author: Baker Bob
published: 2026-02-14
prepTime: PT15M
cookTime: PT10M
totalTime: PT25M
servings: 12
category: Dessert
cuisine: American
calories: 220
ingredients:
  - 200 g butter
  - 150 g brown sugar
  - 2 eggs
  - 300 g flour
  - 200 g chocolate chips
steps:
  - name: Preheat
    text: Preheat the oven to 190 °C.
  - name: Make the dough
    text: Mix butter, sugar and eggs. Fold in the flour and chocolate chips.
  - name: Bake
    text: Place balls of dough on a tray and bake for 10 minutes.
    imageUrl: /images/recipes/cookies-bake.jpg
    url: /recipes/chocolate-chip-cookies/#bake
rating: 4.9
ratingCount: 45
```

```astro
---
// src/pages/recipes/[slug].astro
import { getCollection } from 'astro:content';
import { RecipeSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const recipes = await getCollection('recipes');
  return recipes.map((recipe) => ({ params: { slug: recipe.id }, props: { recipe } }));
}

const { data } = Astro.props.recipe;
---
<RecipeSchema
  name={data.title}
  description={data.description}
  imageUrl={data.images}
  authorName={data.author}
  datePublished={data.published}
  prepTime={data.prepTime}
  cookTime={data.cookTime}
  totalTime={data.totalTime}
  recipeYield={data.servings}
  recipeCategory={data.category}
  recipeCuisine={data.cuisine}
  calories={data.calories}
  ingredients={data.ingredients}
  instructions={data.steps}
  ratingValue={data.rating}
  reviewCount={data.ratingCount}
/>
```

`published` is a `Date` here (an unquoted YAML date with `z.coerce.date()` or `z.date()` in the
collection schema), so it is output as an ISO date-time in UTC. Pass a string to keep
`2026-02-14` as written.

## Output

On `/recipes/chocolate-chip-cookies/`:

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Classic Chocolate Chip Cookies",
  "description": "Crispy edges, chewy and soft in the center.",
  "image": [
    "/images/recipes/cookies-1x1.jpg",
    "/images/recipes/cookies-4x3.jpg",
    "/images/recipes/cookies-16x9.jpg"
  ],
  "author": {
    "@type": "Person",
    "name": "Baker Bob"
  },
  "recipeIngredient": [
    "200 g butter",
    "150 g brown sugar",
    "2 eggs",
    "300 g flour",
    "200 g chocolate chips"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": "Preheat the oven to 190 °C.",
      "name": "Preheat"
    },
    {
      "@type": "HowToStep",
      "text": "Mix butter, sugar and eggs. Fold in the flour and chocolate chips.",
      "name": "Make the dough"
    },
    {
      "@type": "HowToStep",
      "text": "Place balls of dough on a tray and bake for 10 minutes.",
      "name": "Bake",
      "image": "/images/recipes/cookies-bake.jpg",
      "url": "/recipes/chocolate-chip-cookies/#bake"
    }
  ],
  "prepTime": "PT15M",
  "cookTime": "PT10M",
  "totalTime": "PT25M",
  "recipeYield": "12",
  "recipeCategory": "Dessert",
  "recipeCuisine": "American",
  "datePublished": "2026-02-14T00:00:00.000Z",
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "220 calories"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "45"
  }
}
```

- Every instruction becomes a `HowToStep`; `imageUrl` of a step is output as `image`.
- `recipeYield` is output as a string.
- `calories` becomes `NutritionInformation` with the unit `calories` appended.
- `ratingValue` and `reviewCount` are output as strings in the `AggregateRating`.
- `imageUrl` is always output as an array. Google recommends images in 16:9, 4:3 and 1:1.
  Root-relative paths are written as given.

## Simple instructions

Instructions can also be plain strings. This example also uses an organisation as author and
a yield with a unit:

```astro
<RecipeSchema
  name="Basic vinaigrette"
  description="A dressing for green salads."
  imageUrl="/images/recipes/vinaigrette.jpg"
  authorName="Example Kitchen"
  authorType="Organization"
  recipeYield="4 servings"
  calories="90 calories"
  ingredients={['3 tbsp olive oil', '1 tbsp white wine vinegar', '1 tsp mustard', 'Salt and pepper']}
  instructions={['Whisk vinegar, mustard, salt and pepper.', 'Whisk in the oil slowly.']}
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Basic vinaigrette",
  "description": "A dressing for green salads.",
  "image": [
    "/images/recipes/vinaigrette.jpg"
  ],
  "author": {
    "@type": "Organization",
    "name": "Example Kitchen"
  },
  "recipeIngredient": [
    "3 tbsp olive oil",
    "1 tbsp white wine vinegar",
    "1 tsp mustard",
    "Salt and pepper"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": "Whisk vinegar, mustard, salt and pepper."
    },
    {
      "@type": "HowToStep",
      "text": "Whisk in the oil slowly."
    }
  ],
  "recipeYield": "4 servings",
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "90 calories"
  }
}
```

A `calories` string that already contains `calories` is output unchanged; any other value
gets ` calories` appended (`220` → `"220 calories"`).

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Recipe name |
| `description` | `string` | Yes | – | Short description |
| `imageUrl` | `string \| string[]` (URL or `/path`) | Yes | – | Image(s) of the finished dish, output as an array |
| `authorName` | `string \| string[]` | Yes | – | One author name or several |
| `authorType` | `'Person' \| 'Organization'` | No | `'Person'` | `@type` of every author |
| `authorId` | `string` | No | – | Output as the author's `@id`; single author only |
| `datePublished` | `string \| Date` | No | – | Publication date, ISO 8601 |
| `prepTime` | `string` (ISO 8601 duration) | No (recommended) | – | Preparation time, e.g. `'PT15M'` |
| `cookTime` | `string` (ISO 8601 duration) | No (recommended) | – | Cooking time, e.g. `'PT1H30M'` |
| `totalTime` | `string` (ISO 8601 duration) | No | – | Total time |
| `recipeYield` | `string \| number` | No (recommended) | – | Servings or yield, e.g. `12` or `'4 servings'`; a number must be positive |
| `recipeCategory` | `string` | No (recommended) | – | e.g. `'Dessert'` |
| `recipeCuisine` | `string` | No (recommended) | – | e.g. `'Italian'` |
| `calories` | `number \| string` | No (recommended) | – | Calories per serving, output as `nutrition.calories`; a number must not be negative |
| `ingredients` | `string[]` | Yes | – | Ingredients, at least one; output as `recipeIngredient` |
| `instructions` | `string[] \| Step[]` | Yes | – | Steps, at least one; output as `recipeInstructions` |
| `ratingValue` | `number` (0–5) | No (recommended) | – | Average rating |
| `reviewCount` | `number` (positive integer) | No (recommended) | – | Number of ratings |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

A `Step` object:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | `string` | Yes | Instruction text |
| `name` | `string` | No | Short name of the step |
| `imageUrl` | `string` (URL or `/path`) | No | Image of the step, output as `image` |
| `url` | `string` (URL or `/path`) | No | Link to the step, usually an anchor on the page |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. A step allows no
other properties.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- `ingredients` and `instructions` need at least one entry each. `instructions` is either a
  list of strings or a list of step objects, not a mix of both.
- `ratingValue` and `reviewCount` are set together or not at all.
- Durations are ISO 8601 (`PT15M`, `PT1H30M`).
- Text fields and list entries must not be empty.

The component uses no integration options. Recommended fields (`prepTime`, `cookTime`,
`recipeYield`, `recipeCategory`, `recipeCuisine`, `nutrition`, `aggregateRating`) are reported
after the build when missing, unless `warnOnMissingRecommended` is off.
