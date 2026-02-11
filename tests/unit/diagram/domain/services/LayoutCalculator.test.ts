import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../../../../../src/diagram/domain/services/LayoutCalculator';
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram';

function createMinimalEntity(id: string, name: string) {
  return { id, name, type: 'class' as const };
}

function createDiagram(
  entities: UMLDiagram['entities'],
  relationships: UMLDiagram['relationships'] = [],
): UMLDiagram {
  return { title: 'Test', entities, relationships };
}

describe('calculateLayout', () => {
  describe('entity sizing', () => {
    it('returns minimum width for small entity names', () => {
      const diagram = createDiagram([createMinimalEntity('a', 'A')]);
      const layout = calculateLayout(diagram);

      expect(layout.entities[0].size.width).toBeGreaterThanOrEqual(120);
    });

    it('increases width for longer entity names', () => {
      const shortDiagram = createDiagram([createMinimalEntity('a', 'A')]);
      const longDiagram = createDiagram([
        createMinimalEntity('b', 'VeryLongEntityNameThatExceedsMinimum'),
      ]);

      const shortLayout = calculateLayout(shortDiagram);
      const longLayout = calculateLayout(longDiagram);

      expect(longLayout.entities[0].size.width).toBeGreaterThan(shortLayout.entities[0].size.width);
    });

    it('increases height for entities with more members', () => {
      const noMembersDiagram = createDiagram([createMinimalEntity('a', 'A')]);
      const withMembersDiagram = createDiagram([
        {
          id: 'b',
          name: 'B',
          type: 'class',
          attributes: [
            { name: 'x', type: { name: 'number' } },
            { name: 'y', type: { name: 'number' } },
            { name: 'z', type: { name: 'number' } },
          ],
        },
      ]);

      const noMembersLayout = calculateLayout(noMembersDiagram);
      const withMembersLayout = calculateLayout(withMembersDiagram);

      expect(withMembersLayout.entities[0].size.height).toBeGreaterThan(
        noMembersLayout.entities[0].size.height,
      );
    });
  });

  describe('entity positioning', () => {
    it('positions first entity with margin from origin', () => {
      const diagram = createDiagram([createMinimalEntity('a', 'A')]);
      const layout = calculateLayout(diagram);

      expect(layout.entities[0].position.x).toBeGreaterThan(0);
      expect(layout.entities[0].position.y).toBeGreaterThan(0);
    });

    it('positions entities in a grid with 3 columns', () => {
      const diagram = createDiagram([
        createMinimalEntity('a', 'A'),
        createMinimalEntity('b', 'B'),
        createMinimalEntity('c', 'C'),
        createMinimalEntity('d', 'D'),
      ]);
      const layout = calculateLayout(diagram);

      // First three should be in first row
      expect(layout.entities[0].position.y).toBe(layout.entities[1].position.y);
      expect(layout.entities[1].position.y).toBe(layout.entities[2].position.y);

      // Fourth should be in second row
      expect(layout.entities[3].position.y).toBeGreaterThan(layout.entities[0].position.y);
    });

    it('maintains horizontal ordering within rows', () => {
      const diagram = createDiagram([
        createMinimalEntity('a', 'A'),
        createMinimalEntity('b', 'B'),
        createMinimalEntity('c', 'C'),
      ]);
      const layout = calculateLayout(diagram);

      expect(layout.entities[1].position.x).toBeGreaterThan(layout.entities[0].position.x);
      expect(layout.entities[2].position.x).toBeGreaterThan(layout.entities[1].position.x);
    });
  });

  describe('relationship connections', () => {
    it('creates connection points for valid relationships', () => {
      const diagram = createDiagram(
        [createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')],
        [{ id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'b' }],
      );
      const layout = calculateLayout(diagram);

      expect(layout.relationships).toHaveLength(1);
      expect(layout.relationships[0].source).toHaveProperty('x');
      expect(layout.relationships[0].source).toHaveProperty('y');
      expect(layout.relationships[0].source).toHaveProperty('side');
      expect(layout.relationships[0].target).toHaveProperty('x');
      expect(layout.relationships[0].target).toHaveProperty('y');
      expect(layout.relationships[0].target).toHaveProperty('side');
    });

    it('uses horizontal connection for entities on same row', () => {
      const diagram = createDiagram(
        [createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')],
        [{ id: 'r1', type: 'association', sourceId: 'a', targetId: 'b' }],
      );
      const layout = calculateLayout(diagram);

      expect(layout.relationships[0].source.side).toBe('right');
      expect(layout.relationships[0].target.side).toBe('left');
    });

    it('uses vertical connection for entities on different rows', () => {
      const diagram = createDiagram(
        [
          createMinimalEntity('a', 'A'),
          createMinimalEntity('b', 'B'),
          createMinimalEntity('c', 'C'),
          createMinimalEntity('d', 'D'),
        ],
        [{ id: 'r1', type: 'association', sourceId: 'a', targetId: 'd' }],
      );
      const layout = calculateLayout(diagram);

      // a is top-left, d is second row first column
      // They should connect vertically
      expect(['top', 'bottom']).toContain(layout.relationships[0].source.side);
      expect(['top', 'bottom']).toContain(layout.relationships[0].target.side);
    });
  });

  describe('enum entity sizing', () => {
    it('increases height for entities with values (enum values count as members)', () => {
      const noValuesDiagram = createDiagram([createMinimalEntity('a', 'A')]);
      const withValuesDiagram = createDiagram([
        {
          id: 'status',
          name: 'Status',
          type: 'enum' as const,
          values: ['PENDING', 'ACTIVE', 'CLOSED'],
        },
      ]);

      const noValuesLayout = calculateLayout(noValuesDiagram);
      const withValuesLayout = calculateLayout(withValuesDiagram);

      expect(withValuesLayout.entities[0].size.height).toBeGreaterThanOrEqual(
        noValuesLayout.entities[0].size.height,
      );
    });

    it('adjusts width for long enum value names', () => {
      const shortValuesDiagram = createDiagram([
        {
          id: 'short',
          name: 'Short',
          type: 'enum' as const,
          values: ['A', 'B'],
        },
      ]);
      const longValuesDiagram = createDiagram([
        {
          id: 'long',
          name: 'Long',
          type: 'enum' as const,
          values: ['VERY_LONG_ENUM_VALUE_NAME_THAT_EXCEEDS_MINIMUM_WIDTH'],
        },
      ]);

      const shortLayout = calculateLayout(shortValuesDiagram);
      const longLayout = calculateLayout(longValuesDiagram);

      expect(longLayout.entities[0].size.width).toBeGreaterThanOrEqual(
        shortLayout.entities[0].size.width,
      );
    });
  });

  describe('bounds calculation', () => {
    it('calculates bounds encompassing all entities', () => {
      const diagram = createDiagram([createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')]);
      const layout = calculateLayout(diagram);

      const lastEntity = layout.entities[layout.entities.length - 1];
      expect(layout.bounds.width).toBeGreaterThan(lastEntity.position.x + lastEntity.size.width);
      expect(layout.bounds.height).toBeGreaterThan(lastEntity.position.y + lastEntity.size.height);
    });
  });
});
