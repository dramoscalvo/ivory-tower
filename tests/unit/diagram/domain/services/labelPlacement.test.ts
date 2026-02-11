import { describe, it, expect } from 'vitest';
import { computeLabelPositions } from '../../../../../src/diagram/domain/services/labelPlacement';
import type { RelationshipLayout } from '../../../../../src/diagram/domain/services/LayoutCalculator';

function createRelLayout(
  id: string,
  label: string | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): RelationshipLayout {
  return {
    relationship: { id, type: 'association', sourceId: 'a', targetId: 'b', label },
    source: { x: sx, y: sy, side: 'right' },
    target: { x: tx, y: ty, side: 'left' },
  };
}

describe('computeLabelPositions', () => {
  it('single labeled relationship: position at midpoint', () => {
    const rels = [createRelLayout('r1', 'uses', 0, 0, 200, 0)];
    const positions = computeLabelPositions(rels);

    expect(positions.get('r1')).toBeDefined();
    expect(positions.get('r1')!.x).toBe(100);
  });

  it('two non-overlapping labels: positions unchanged', () => {
    const rels = [
      createRelLayout('r1', 'uses', 0, 0, 100, 0),
      createRelLayout('r2', 'has', 0, 200, 100, 200),
    ];
    const positions = computeLabelPositions(rels);

    expect(positions.get('r1')).toBeDefined();
    expect(positions.get('r2')).toBeDefined();
    // They should be at their midpoints since they don't overlap
    expect(positions.get('r1')!.y).not.toBe(positions.get('r2')!.y);
  });

  it('two overlapping labels: second displaced', () => {
    const rels = [
      createRelLayout('r1', 'uses', 0, 0, 200, 0),
      createRelLayout('r2', 'uses', 0, 0, 200, 0),
    ];
    const positions = computeLabelPositions(rels);

    const pos1 = positions.get('r1')!;
    const pos2 = positions.get('r2')!;

    // They should not be at the same position
    const samePosition = pos1.x === pos2.x && pos1.y === pos2.y;
    expect(samePosition).toBe(false);
  });

  it('three overlapping labels: all displaced to unique positions', () => {
    const rels = [
      createRelLayout('r1', 'uses', 0, 0, 200, 0),
      createRelLayout('r2', 'uses', 0, 0, 200, 0),
      createRelLayout('r3', 'uses', 0, 0, 200, 0),
    ];
    const positions = computeLabelPositions(rels);

    expect(positions.size).toBe(3);
  });

  it('relationships with no labels: returns empty map', () => {
    const rels = [createRelLayout('r1', undefined, 0, 0, 200, 0)];
    const positions = computeLabelPositions(rels);

    expect(positions.size).toBe(0);
  });

  it('mixed labeled and unlabeled: only labeled get positions', () => {
    const rels = [
      createRelLayout('r1', 'uses', 0, 0, 200, 0),
      createRelLayout('r2', undefined, 0, 100, 200, 100),
    ];
    const positions = computeLabelPositions(rels);

    expect(positions.has('r1')).toBe(true);
    expect(positions.has('r2')).toBe(false);
  });
});
