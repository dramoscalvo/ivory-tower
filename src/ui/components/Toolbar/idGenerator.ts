function slugify(text: string): string {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'item';
}

export function generateUniqueId(baseId: string, existingIds: Iterable<string>): string {
  const normalizedBase = slugify(baseId);
  const existing = new Set(existingIds);
  if (!existing.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  while (existing.has(`${normalizedBase}-${suffix}`)) {
    suffix++;
  }

  return `${normalizedBase}-${suffix}`;
}

export function buildEntityId(name: string, existingIds: Iterable<string>): string {
  return generateUniqueId(slugify(name), existingIds);
}

export function buildUseCaseId(name: string, existingIds: Iterable<string>): string {
  return generateUniqueId(`uc-${slugify(name)}`, existingIds);
}

export function buildEndpointId(
  method: string,
  path: string,
  existingIds: Iterable<string>,
): string {
  const normalizedPath = path.replace(/^\/+/, '').replace(/\//g, '-');
  return generateUniqueId(`ep-${slugify(method)}-${slugify(normalizedPath)}`, existingIds);
}

export function buildRelationshipId(
  type: string,
  sourceId: string,
  targetId: string,
  existingIds: Iterable<string>,
): string {
  return generateUniqueId(`r-${slugify(type)}-${slugify(sourceId)}-${slugify(targetId)}`, existingIds);
}

export function buildActorId(name: string, existingIds: Iterable<string>): string {
  return generateUniqueId(slugify(name), existingIds);
}

export function buildRuleId(
  type: string,
  entityRef: string,
  field: string | undefined,
  existingIds: Iterable<string>,
): string {
  const fieldSuffix = field ? `-${slugify(field)}` : '';
  return generateUniqueId(`rule-${slugify(type)}-${slugify(entityRef)}${fieldSuffix}`, existingIds);
}
