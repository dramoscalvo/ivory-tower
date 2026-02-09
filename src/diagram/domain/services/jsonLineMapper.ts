/**
 * Find the line number (1-based) of an entity's "id" field in a JSON string.
 */
export function findEntityLine(json: string, entityId: string): number | null {
  const escapedId = entityId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`"id"\\s*:\\s*"${escapedId}"`);
  const lines = json.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return i + 1; // 1-based line number
    }
  }

  return null;
}
