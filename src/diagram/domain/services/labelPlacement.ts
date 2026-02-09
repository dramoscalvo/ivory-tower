import type { RelationshipLayout } from './LayoutCalculator';

const CHAR_WIDTH = 7;
const LABEL_HEIGHT = 16;
const DISPLACEMENT = 20;
const MAX_ITERATIONS = 10;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
}

export function computeLabelPositions(
  relationships: RelationshipLayout[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const rects = new Map<string, Rect>();

  // Initialize with midpoints
  for (const rel of relationships) {
    if (!rel.relationship.label) continue;

    const midX = (rel.source.x + rel.target.x) / 2;
    const midY = (rel.source.y + rel.target.y) / 2 - 8;
    const labelWidth = rel.relationship.label.length * CHAR_WIDTH;

    positions.set(rel.relationship.id, { x: midX, y: midY });
    rects.set(rel.relationship.id, {
      x: midX - labelWidth / 2,
      y: midY - LABEL_HEIGHT / 2,
      width: labelWidth,
      height: LABEL_HEIGHT,
    });
  }

  const ids = Array.from(positions.keys());

  // Iterative displacement
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let hasOverlap = false;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const rectA = rects.get(ids[i])!;
        const rectB = rects.get(ids[j])!;

        if (rectsOverlap(rectA, rectB)) {
          hasOverlap = true;

          // Find the relationship to determine perpendicular direction
          const rel = relationships.find(r => r.relationship.id === ids[j])!;
          const dx = rel.target.x - rel.source.x;
          const dy = rel.target.y - rel.source.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;

          // Perpendicular direction
          const perpX = -dy / len;
          const perpY = dx / len;

          // Displace the second label
          const pos = positions.get(ids[j])!;
          pos.x += perpX * DISPLACEMENT;
          pos.y += perpY * DISPLACEMENT;

          const labelWidth = rects.get(ids[j])!.width;
          rects.set(ids[j], {
            x: pos.x - labelWidth / 2,
            y: pos.y - LABEL_HEIGHT / 2,
            width: labelWidth,
            height: LABEL_HEIGHT,
          });
        }
      }
    }

    if (!hasOverlap) break;
  }

  return positions;
}
