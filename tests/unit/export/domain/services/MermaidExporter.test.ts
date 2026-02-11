import { describe, it, expect } from 'vitest';
import { formatAsMermaid } from '../../../../../src/export/domain/services/MermaidExporter';
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram';

function createDiagram(overrides: Partial<UMLDiagram> = {}): UMLDiagram {
  return {
    title: 'Test Diagram',
    entities: [],
    relationships: [],
    ...overrides,
  };
}

describe('formatAsMermaid', () => {
  describe('header', () => {
    it('generates classDiagram header with title', () => {
      const diagram = createDiagram({ title: 'My Architecture' });
      const result = formatAsMermaid(diagram);

      const lines = result.split('\n');
      expect(lines[0]).toBe('---');
      expect(lines[1]).toBe('title: My Architecture');
      expect(lines[2]).toBe('---');
      expect(lines[3]).toBe('classDiagram');
    });
  });

  describe('entity formatting', () => {
    it('formats class entity with attributes and methods', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
            attributes: [
              { name: 'id', type: { name: 'string' }, visibility: 'private' },
              { name: 'email', type: { name: 'string' }, visibility: 'public' },
            ],
            methods: [
              {
                name: 'setEmail',
                parameters: [{ name: 'email', type: { name: 'string' } }],
                returnType: { name: 'void' },
              },
            ],
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  class User {');
      expect(result).toContain('    -string id');
      expect(result).toContain('    +string email');
      expect(result).toContain('    +setEmail(string email) void');
      expect(result).toContain('  }');
    });

    it('formats interface entity with <<interface>> annotation', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'repo',
            name: 'Repository',
            type: 'interface',
            methods: [
              {
                name: 'findById',
                parameters: [{ name: 'id', type: { name: 'string' } }],
                returnType: { name: 'Entity' },
              },
            ],
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  class Repository {');
      expect(result).toContain('    <<interface>>');
      expect(result).toContain('    +findById(string id) Entity');
    });

    it('formats enum entity with <<enumeration>> annotation and values', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'status',
            name: 'Status',
            type: 'enum',
            values: ['ACTIVE', 'INACTIVE', 'PENDING'],
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  class Status {');
      expect(result).toContain('    <<enumeration>>');
      expect(result).toContain('    ACTIVE');
      expect(result).toContain('    INACTIVE');
      expect(result).toContain('    PENDING');
    });

    it('formats module entity with <<module>> annotation', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'utils',
            name: 'Utils',
            type: 'module',
            functions: [
              {
                name: 'validate',
                parameters: [{ name: 'input', type: { name: 'string' } }],
                returnType: { name: 'boolean' },
                isExported: true,
              },
            ],
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  class Utils {');
      expect(result).toContain('    <<module>>');
      expect(result).toContain('    +validate(string input) boolean');
    });

    it('formats abstract-class with <<abstract>> annotation', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'shape',
            name: 'Shape',
            type: 'abstract-class',
            attributes: [
              { name: 'color', type: { name: 'string' } },
            ],
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  class Shape {');
      expect(result).toContain('    <<abstract>>');
      expect(result).toContain('    +string color');
    });
  });

  describe('relationship formatting', () => {
    it('formats inheritance relationship with --|> arrow', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'child', name: 'Child', type: 'class' },
          { id: 'parent', name: 'Parent', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'inheritance',
            sourceId: 'child',
            targetId: 'parent',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  Child --|> Parent');
    });

    it('formats implementation relationship with ..|> arrow', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'impl', name: 'UserRepo', type: 'class' },
          { id: 'iface', name: 'Repository', type: 'interface' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'implementation',
            sourceId: 'impl',
            targetId: 'iface',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  UserRepo ..|> Repository');
    });

    it('formats composition with *-- arrow', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'order', name: 'Order', type: 'class' },
          { id: 'item', name: 'OrderItem', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'composition',
            sourceId: 'order',
            targetId: 'item',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  Order *-- OrderItem');
    });

    it('formats aggregation with o-- arrow', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'dept', name: 'Department', type: 'class' },
          { id: 'emp', name: 'Employee', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'aggregation',
            sourceId: 'dept',
            targetId: 'emp',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  Department o-- Employee');
    });

    it('formats dependency with ..> arrow', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'svc', name: 'Service', type: 'class' },
          { id: 'logger', name: 'Logger', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'dependency',
            sourceId: 'svc',
            targetId: 'logger',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  Service ..> Logger');
    });

    it('formats association with --> arrow', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'a', name: 'ClassA', type: 'class' },
          { id: 'b', name: 'ClassB', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'association',
            sourceId: 'a',
            targetId: 'b',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  ClassA --> ClassB');
    });

    it('includes relationship label as ": label"', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'a', name: 'ClassA', type: 'class' },
          { id: 'b', name: 'ClassB', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'association',
            sourceId: 'a',
            targetId: 'b',
            label: 'uses',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  ClassA --> ClassB : uses');
    });

    it('includes cardinality labels (sourceCardinality and targetCardinality)', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'order', name: 'Order', type: 'class' },
          { id: 'item', name: 'OrderItem', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'composition',
            sourceId: 'order',
            targetId: 'item',
            sourceCardinality: '1',
            targetCardinality: '1..*',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('  Order "1" *-- "1..*" OrderItem');
    });

    it('uses entity names (not ids) in relationship lines', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'entity-1', name: 'Customer', type: 'class' },
          { id: 'entity-2', name: 'Account', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'association',
            sourceId: 'entity-1',
            targetId: 'entity-2',
          },
        ],
      });
      const result = formatAsMermaid(diagram);

      expect(result).toContain('Customer');
      expect(result).toContain('Account');
      expect(result).not.toContain('entity-1');
      expect(result).not.toContain('entity-2');
    });
  });
});
