import { describe, it, expect } from 'vitest';
import { calculateHierarchicalLayout } from '../../../../../src/diagram/domain/services/HierarchicalLayoutCalculator';
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram';

function createMinimalEntity(
  id: string,
  name: string,
  type: 'class' | 'interface' | 'abstract-class' = 'class',
) {
  return { id, name, type };
}

function createDiagram(
  entities: UMLDiagram['entities'],
  relationships: UMLDiagram['relationships'] = [],
): UMLDiagram {
  return { title: 'Test', entities, relationships };
}

describe('calculateHierarchicalLayout', () => {
  it('single entity: positioned with valid bounds', () => {
    const diagram = createDiagram([createMinimalEntity('a', 'A')]);
    const layout = calculateHierarchicalLayout(diagram);

    expect(layout.entities).toHaveLength(1);
    expect(layout.entities[0].position.x).toBeGreaterThan(0);
    expect(layout.entities[0].position.y).toBeGreaterThan(0);
    expect(layout.bounds.width).toBeGreaterThan(0);
    expect(layout.bounds.height).toBeGreaterThan(0);
  });

  it('two entities with inheritance: parent above child', () => {
    const diagram = createDiagram(
      [createMinimalEntity('child', 'Child'), createMinimalEntity('parent', 'Parent')],
      [{ id: 'r1', type: 'inheritance', sourceId: 'child', targetId: 'parent' }],
    );
    const layout = calculateHierarchicalLayout(diagram);

    const parentLayout = layout.entities.find(e => e.entity.id === 'parent')!;
    const childLayout = layout.entities.find(e => e.entity.id === 'child')!;

    expect(parentLayout.position.y).toBeLessThan(childLayout.position.y);
  });

  it('interface + implementing class: interface above class', () => {
    const diagram = createDiagram(
      [
        createMinimalEntity('impl', 'MyClass'),
        createMinimalEntity('iface', 'MyInterface', 'interface'),
      ],
      [{ id: 'r1', type: 'implementation', sourceId: 'impl', targetId: 'iface' }],
    );
    const layout = calculateHierarchicalLayout(diagram);

    const ifaceLayout = layout.entities.find(e => e.entity.id === 'iface')!;
    const implLayout = layout.entities.find(e => e.entity.id === 'impl')!;

    expect(ifaceLayout.position.y).toBeLessThan(implLayout.position.y);
  });

  it('chain of 3: C at top, A at bottom, B in middle', () => {
    const diagram = createDiagram(
      [createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B'), createMinimalEntity('c', 'C')],
      [
        { id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'b' },
        { id: 'r2', type: 'inheritance', sourceId: 'b', targetId: 'c' },
      ],
    );
    const layout = calculateHierarchicalLayout(diagram);

    const aLayout = layout.entities.find(e => e.entity.id === 'a')!;
    const bLayout = layout.entities.find(e => e.entity.id === 'b')!;
    const cLayout = layout.entities.find(e => e.entity.id === 'c')!;

    expect(cLayout.position.y).toBeLessThan(bLayout.position.y);
    expect(bLayout.position.y).toBeLessThan(aLayout.position.y);
  });

  it('siblings placed side by side at same Y', () => {
    const diagram = createDiagram(
      [
        createMinimalEntity('parent', 'Parent'),
        createMinimalEntity('child1', 'Child1'),
        createMinimalEntity('child2', 'Child2'),
      ],
      [
        { id: 'r1', type: 'inheritance', sourceId: 'child1', targetId: 'parent' },
        { id: 'r2', type: 'inheritance', sourceId: 'child2', targetId: 'parent' },
      ],
    );
    const layout = calculateHierarchicalLayout(diagram);

    const child1Layout = layout.entities.find(e => e.entity.id === 'child1')!;
    const child2Layout = layout.entities.find(e => e.entity.id === 'child2')!;

    expect(child1Layout.position.y).toBe(child2Layout.position.y);
  });

  it('disconnected entities: still positioned', () => {
    const diagram = createDiagram(
      [
        createMinimalEntity('parent', 'Parent'),
        createMinimalEntity('child', 'Child'),
        createMinimalEntity('lonely', 'Lonely'),
      ],
      [{ id: 'r1', type: 'inheritance', sourceId: 'child', targetId: 'parent' }],
    );
    const layout = calculateHierarchicalLayout(diagram);

    expect(layout.entities).toHaveLength(3);
    const lonelyLayout = layout.entities.find(e => e.entity.id === 'lonely')!;
    expect(lonelyLayout.position.x).toBeGreaterThan(0);
    expect(lonelyLayout.position.y).toBeGreaterThan(0);
  });

  it('diagram with no relationships: all entities laid out', () => {
    const diagram = createDiagram([
      createMinimalEntity('a', 'A'),
      createMinimalEntity('b', 'B'),
      createMinimalEntity('c', 'C'),
    ]);
    const layout = calculateHierarchicalLayout(diagram);

    expect(layout.entities).toHaveLength(3);
    for (const entity of layout.entities) {
      expect(entity.size.width).toBeGreaterThan(0);
      expect(entity.size.height).toBeGreaterThan(0);
    }
  });

  it('cycle detection: A inherits B, B inherits A — valid layout without infinite loop', () => {
    const diagram = createDiagram(
      [createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')],
      [
        { id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'b' },
        { id: 'r2', type: 'inheritance', sourceId: 'b', targetId: 'a' },
      ],
    );
    const layout = calculateHierarchicalLayout(diagram);

    expect(layout.entities).toHaveLength(2);
    expect(layout.bounds.width).toBeGreaterThan(0);
    expect(layout.bounds.height).toBeGreaterThan(0);
  });

  it('non-hierarchy relationships do not force parent-child Y ordering', () => {
    const diagram = createDiagram(
      [createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')],
      [{ id: 'r1', type: 'association', sourceId: 'a', targetId: 'b' }],
    );
    const layout = calculateHierarchicalLayout(diagram);

    // Both are disconnected from hierarchy, placed in grid
    // No specific Y ordering enforced
    expect(layout.entities).toHaveLength(2);
  });

  it('entity sizes are correct', () => {
    const diagram = createDiagram([
      {
        id: 'a',
        name: 'A',
        type: 'class',
        attributes: [{ name: 'x', type: { name: 'number' } }],
      },
    ]);
    const layout = calculateHierarchicalLayout(diagram);

    expect(layout.entities[0].size.width).toBeGreaterThanOrEqual(120);
    expect(layout.entities[0].size.height).toBeGreaterThan(32); // header + 1 member
  });

  it('bounds encompass all entities', () => {
    const diagram = createDiagram([createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')]);
    const layout = calculateHierarchicalLayout(diagram);

    for (const entity of layout.entities) {
      expect(layout.bounds.width).toBeGreaterThan(entity.position.x + entity.size.width);
      expect(layout.bounds.height).toBeGreaterThan(entity.position.y + entity.size.height);
    }
  });

  it('connection points generated for all relationships', () => {
    const diagram = createDiagram(
      [createMinimalEntity('a', 'A'), createMinimalEntity('b', 'B')],
      [{ id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'b' }],
    );
    const layout = calculateHierarchicalLayout(diagram);

    expect(layout.relationships).toHaveLength(1);
    expect(layout.relationships[0].source).toHaveProperty('x');
    expect(layout.relationships[0].source).toHaveProperty('y');
    expect(layout.relationships[0].target).toHaveProperty('x');
    expect(layout.relationships[0].target).toHaveProperty('y');
  });
});
