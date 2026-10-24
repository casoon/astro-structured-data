/** A link to another node: by `@id` and/or `url`, with a free `@type` (falls back to the caller's default). */
export type Reference = {
  type?: string;
  id?: string;
  name?: string;
  headline?: string;
  url?: string;
  position?: number;
};

export function buildReference(ref: Reference, defaultType: string) {
  return {
    '@type': ref.type ?? defaultType,
    ...(ref.id ? { '@id': ref.id } : {}),
    ...(ref.name ? { name: ref.name } : {}),
    ...(ref.headline ? { headline: ref.headline } : {}),
    ...(ref.url ? { url: ref.url } : {}),
    ...(ref.position !== undefined ? { position: ref.position } : {}),
  };
}

/** One reference stays an object, several become an array. */
export function buildReferences(value: Reference | Reference[], defaultType: string) {
  return Array.isArray(value)
    ? value.map((ref) => buildReference(ref, defaultType))
    : buildReference(value, defaultType);
}
