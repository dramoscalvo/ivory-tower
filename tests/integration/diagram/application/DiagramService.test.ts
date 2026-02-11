import { describe, it, expect } from 'vitest';
import { DiagramService } from '../../../../src/diagram/application/DiagramService';

const VALID_DIAGRAM_JSON = JSON.stringify({
  title: 'Test System',
  entities: [
    { id: 'user', name: 'User', type: 'class' },
    { id: 'admin', name: 'Admin', type: 'class' },
  ],
  relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'admin', targetId: 'user' }],
});

describe('DiagramService', () => {
  const service = new DiagramService();

  describe('processDiagram', () => {
    it('returns layout for valid diagram JSON', () => {
      const result = service.processDiagram(VALID_DIAGRAM_JSON);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.layout.entities).toHaveLength(2);
        expect(result.layout.relationships).toHaveLength(1);
        expect(result.layout.bounds).toBeDefined();
      }
    });

    it('returns parse error for invalid JSON', () => {
      const result = service.processDiagram('{ invalid }');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.parseError).toBeTruthy();
        expect(result.validationErrors).toBeUndefined();
      }
    });

    it('returns validation errors for valid JSON with invalid structure', () => {
      const invalidStructure = JSON.stringify({
        title: 'Test',
        entities: [{ name: 'Missing ID', type: 'class' }],
        relationships: [],
      });

      const result = service.processDiagram(invalidStructure);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.parseError).toBeUndefined();
        expect(result.validationErrors).toBeDefined();
        expect(result.validationErrors!.length).toBeGreaterThan(0);
      }
    });

    it('returns validation errors for relationship referencing non-existent entity', () => {
      const invalidRef = JSON.stringify({
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'missing' }],
      });

      const result = service.processDiagram(invalidRef);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors).toBeDefined();
        expect(result.validationErrors!.some(e => e.message.includes('not found'))).toBe(true);
      }
    });

    it('calculates entity positions in the layout', () => {
      const result = service.processDiagram(VALID_DIAGRAM_JSON);

      expect(result.success).toBe(true);
      if (result.success) {
        for (const entity of result.layout.entities) {
          expect(entity.position.x).toBeGreaterThan(0);
          expect(entity.position.y).toBeGreaterThan(0);
          expect(entity.size.width).toBeGreaterThan(0);
          expect(entity.size.height).toBeGreaterThan(0);
        }
      }
    });

    it('calculates relationship connection points', () => {
      const result = service.processDiagram(VALID_DIAGRAM_JSON);

      expect(result.success).toBe(true);
      if (result.success) {
        const rel = result.layout.relationships[0];
        expect(rel.source.x).toBeDefined();
        expect(rel.source.y).toBeDefined();
        expect(rel.source.side).toBeDefined();
        expect(rel.target.x).toBeDefined();
        expect(rel.target.y).toBeDefined();
        expect(rel.target.side).toBeDefined();
      }
    });
  });

  describe('getDiagram', () => {
    it('returns parsed diagram for valid JSON', () => {
      const diagram = service.getDiagram(VALID_DIAGRAM_JSON);

      expect(diagram).not.toBeNull();
      expect(diagram!.title).toBe('Test System');
      expect(diagram!.entities).toHaveLength(2);
    });

    it('returns null for invalid JSON', () => {
      const diagram = service.getDiagram('{ invalid }');

      expect(diagram).toBeNull();
    });

    it('returns null for valid JSON with invalid structure', () => {
      const invalidStructure = JSON.stringify({
        title: 'Test',
        entities: [{ name: 'Missing ID', type: 'class' }],
        relationships: [],
      });

      const diagram = service.getDiagram(invalidStructure);

      expect(diagram).toBeNull();
    });
  });

  describe('Phase 1: project metadata and actors', () => {
    it('processes diagram with project metadata', () => {
      const json = JSON.stringify({
        title: 'Test',
        project: {
          name: 'My App',
          stack: { language: 'TypeScript' },
          conventions: { architecture: 'hexagonal' },
        },
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.layout.diagram.project?.name).toBe('My App');
      }
    });

    it('processes diagram with actors', () => {
      const json = JSON.stringify({
        title: 'Test',
        actors: [{ id: 'user', name: 'End User', description: 'A regular user' }],
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.layout.diagram.actors).toHaveLength(1);
        expect(result.layout.diagram.actors![0].name).toBe('End User');
      }
    });

    it('returns validation error for invalid project metadata', () => {
      const json = JSON.stringify({
        title: 'Test',
        project: { description: 'Missing name' },
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors).toBeDefined();
        expect(result.validationErrors!.some(e => e.path === 'project.name')).toBe(true);
      }
    });
  });

  describe('Phase 1: enum entities', () => {
    it('processes diagram with enum entity', () => {
      const json = JSON.stringify({
        title: 'Test',
        entities: [
          {
            id: 'status',
            name: 'Status',
            type: 'enum',
            values: ['ACTIVE', 'INACTIVE'],
          },
        ],
        relationships: [],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.layout.entities).toHaveLength(1);
        expect(result.layout.entities[0].entity.type).toBe('enum');
        expect(result.layout.entities[0].entity.values).toEqual(['ACTIVE', 'INACTIVE']);
      }
    });

    it('rejects enum entity without values', () => {
      const json = JSON.stringify({
        title: 'Test',
        entities: [{ id: 'status', name: 'Status', type: 'enum' }],
        relationships: [],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(false);
    });
  });

  describe('Phase 1: enriched use cases', () => {
    it('processes diagram with actorRef on use cases', () => {
      const json = JSON.stringify({
        title: 'Test',
        actors: [{ id: 'user', name: 'End User' }],
        entities: [
          {
            id: 'a',
            name: 'A',
            type: 'class',
            methods: [{ name: 'doThing', parameters: [], returnType: { name: 'void' } }],
          },
        ],
        relationships: [],
        useCases: [
          {
            id: 'uc-1',
            name: 'Do Thing',
            entityRef: 'a',
            methodRef: 'doThing',
            actorRef: 'user',
            preconditions: ['User is logged in'],
            postconditions: ['Thing is done'],
            scenarios: [
              {
                name: 'Happy path',
                steps: [{ keyword: 'Given', text: 'a user' }],
              },
            ],
          },
        ],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(true);
      if (result.success) {
        const uc = result.layout.diagram.useCases![0];
        expect(uc.actorRef).toBe('user');
        expect(uc.preconditions).toEqual(['User is logged in']);
        expect(uc.postconditions).toEqual(['Thing is done']);
      }
    });

    it('rejects use case with invalid actorRef', () => {
      const json = JSON.stringify({
        title: 'Test',
        actors: [{ id: 'admin', name: 'Admin' }],
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [],
        useCases: [
          {
            id: 'uc-1',
            name: 'Do Thing',
            entityRef: 'a',
            actorRef: 'nonexistent',
            scenarios: [
              {
                name: 'Test',
                steps: [{ keyword: 'Given', text: 'something' }],
              },
            ],
          },
        ],
      });

      const result = service.processDiagram(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors!.some(e => e.message.includes('Actor'))).toBe(true);
      }
    });
  });
});
