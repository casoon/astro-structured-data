declare module 'virtual:astro-structured-data/config' {
  import type { StructuredDataOptions } from './index.js';
  export function getGlobalConfig(): StructuredDataOptions;
}
