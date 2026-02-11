import { describe, it, expect } from 'vitest';
import { validateCompleteness } from '../../../../../src/diagram/domain/services/CompletenessValidator';
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram';
import type { Entity } from '../../../../../src/diagram/domain/models/Entity';
import type { Relationship } from '../../../../../src/diagram/domain/models/Relationship';
import type { UseCase } from '../../../../../src/usecase/domain/models/UseCase';
import type { Endpoint } from '../../../../../src/diagram/domain/models/Endpoint';

function makeEntity(overrides: Partial<Entity> & { id: string; name: string }): Entity {
  return { type: 'class', ...overrides };
}

function makeRelationship(
  overrides: Partial<Relationship> & { sourceId: string; targetId: string },
): Relationship {
  return { id: `rel-${overrides.sourceId}-${overrides.targetId}`, type: 'association', ...overrides };
}

function makeUseCase(
  overrides: Partial<UseCase> & { id: string; name: string; entityRef: string },
): UseCase {
  return { scenarios: [], ...overrides };
}

function makeEndpoint(
  overrides: Partial<Endpoint> & { id: string; method: Endpoint['method']; path: string },
): Endpoint {
  return { ...overrides };
}

function makeDiagram(overrides: Partial<UMLDiagram> = {}): UMLDiagram {
  return {
    title: 'Test',
    entities: [],
    relationships: [],
    ...overrides,
  };
}

describe('validateCompleteness', () => {
  describe('fully covered diagram', () => {
    it('returns empty array when all entities, use cases, and endpoints are connected', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({
            id: 'User',
            name: 'User',
            methods: [{ name: 'login', parameters: [], returnType: { name: 'void' } }],
          }),
          makeEntity({ id: 'Order', name: 'Order' }),
        ],
        relationships: [makeRelationship({ sourceId: 'User', targetId: 'Order' })],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User', methodRef: 'login' }),
          makeUseCase({ id: 'uc2', name: 'Place Order', entityRef: 'Order' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'POST', path: '/orders', useCaseRef: 'uc2' }),
        ],
      });

      const warnings = validateCompleteness(diagram);

      expect(warnings).toHaveLength(0);
    });

    it('returns empty array for empty entities', () => {
      const diagram = makeDiagram({ entities: [], relationships: [] });

      const warnings = validateCompleteness(diagram);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('diagram with only entities and relationships', () => {
    it('warns about uncovered entities but not orphans when relationships exist', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({ id: 'A', name: 'Alpha' }),
          makeEntity({ id: 'B', name: 'Beta' }),
        ],
        relationships: [makeRelationship({ sourceId: 'A', targetId: 'B' })],
      });

      const warnings = validateCompleteness(diagram);

      expect(warnings).toEqual([
        expect.objectContaining({ category: 'uncovered-entity', entityId: 'A' }),
        expect.objectContaining({ category: 'uncovered-entity', entityId: 'B' }),
      ]);
    });
  });

  describe('uncovered-entity', () => {
    it('warns when an entity has no use cases referencing it', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({ id: 'User', name: 'User' }),
          makeEntity({ id: 'Order', name: 'Order' }),
        ],
        relationships: [makeRelationship({ sourceId: 'User', targetId: 'Order' })],
        useCases: [makeUseCase({ id: 'uc1', name: 'Place Order', entityRef: 'Order' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/orders', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const uncovered = warnings.filter(w => w.category === 'uncovered-entity');

      expect(uncovered).toHaveLength(1);
      expect(uncovered[0]).toEqual(
        expect.objectContaining({
          category: 'uncovered-entity',
          entityId: 'User',
          message: 'Entity "User" has no use cases',
        }),
      );
    });

    it('does not warn when all entities are referenced by use cases', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const uncovered = warnings.filter(w => w.category === 'uncovered-entity');

      expect(uncovered).toHaveLength(0);
    });
  });

  describe('unreferenced-method', () => {
    it('warns when a method is not referenced by any use case', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({
            id: 'User',
            name: 'User',
            methods: [
              { name: 'login', parameters: [], returnType: { name: 'void' } },
              { name: 'logout', parameters: [], returnType: { name: 'void' } },
            ],
          }),
        ],
        relationships: [],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User', methodRef: 'login' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const unreferenced = warnings.filter(w => w.category === 'unreferenced-method');

      expect(unreferenced).toHaveLength(1);
      expect(unreferenced[0]).toEqual(
        expect.objectContaining({
          category: 'unreferenced-method',
          entityId: 'User',
          message: 'Method "User.logout" is not referenced by any use case',
        }),
      );
    });

    it('warns for all unreferenced methods across multiple entities', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({
            id: 'User',
            name: 'User',
            methods: [{ name: 'login', parameters: [], returnType: { name: 'void' } }],
          }),
          makeEntity({
            id: 'Order',
            name: 'Order',
            methods: [{ name: 'cancel', parameters: [], returnType: { name: 'void' } }],
          }),
        ],
        relationships: [makeRelationship({ sourceId: 'User', targetId: 'Order' })],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User', methodRef: 'login' }),
          makeUseCase({ id: 'uc2', name: 'View Order', entityRef: 'Order' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'GET', path: '/orders', useCaseRef: 'uc2' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const unreferenced = warnings.filter(w => w.category === 'unreferenced-method');

      expect(unreferenced).toHaveLength(1);
      expect(unreferenced[0]).toEqual(
        expect.objectContaining({
          entityId: 'Order',
          message: 'Method "Order.cancel" is not referenced by any use case',
        }),
      );
    });

    it('does not warn for entities without methods', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const unreferenced = warnings.filter(w => w.category === 'unreferenced-method');

      expect(unreferenced).toHaveLength(0);
    });

    it('does not warn when all methods are referenced', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({
            id: 'User',
            name: 'User',
            methods: [
              { name: 'login', parameters: [], returnType: { name: 'void' } },
              { name: 'logout', parameters: [], returnType: { name: 'void' } },
            ],
          }),
        ],
        relationships: [],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User', methodRef: 'login' }),
          makeUseCase({ id: 'uc2', name: 'Logout', entityRef: 'User', methodRef: 'logout' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'POST', path: '/logout', useCaseRef: 'uc2' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const unreferenced = warnings.filter(w => w.category === 'unreferenced-method');

      expect(unreferenced).toHaveLength(0);
    });
  });

  describe('usecase-no-endpoint', () => {
    it('warns when a use case has no endpoint referencing it', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' }),
          makeUseCase({ id: 'uc2', name: 'Register', entityRef: 'User' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const noEndpoint = warnings.filter(w => w.category === 'usecase-no-endpoint');

      expect(noEndpoint).toHaveLength(1);
      expect(noEndpoint[0]).toEqual(
        expect.objectContaining({
          category: 'usecase-no-endpoint',
          entityId: 'User',
          message: 'Use case "Register" has no endpoint',
        }),
      );
    });

    it('does not warn when all use cases have endpoints', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const noEndpoint = warnings.filter(w => w.category === 'usecase-no-endpoint');

      expect(noEndpoint).toHaveLength(0);
    });

    it('does not warn when there are no use cases', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
      });

      const warnings = validateCompleteness(diagram);
      const noEndpoint = warnings.filter(w => w.category === 'usecase-no-endpoint');

      expect(noEndpoint).toHaveLength(0);
    });
  });

  describe('endpoint-no-usecase', () => {
    it('warns when an endpoint has no useCaseRef', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'GET', path: '/health' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const noUseCase = warnings.filter(w => w.category === 'endpoint-no-usecase');

      expect(noUseCase).toHaveLength(1);
      expect(noUseCase[0]).toEqual(
        expect.objectContaining({
          category: 'endpoint-no-usecase',
          message: 'Endpoint "GET /health" has no use case reference',
        }),
      );
    });

    it('does not include entityId in endpoint-no-usecase warnings', () => {
      const diagram = makeDiagram({
        entities: [],
        relationships: [],
        endpoints: [makeEndpoint({ id: 'ep1', method: 'DELETE', path: '/cache' })],
      });

      const warnings = validateCompleteness(diagram);
      const noUseCase = warnings.filter(w => w.category === 'endpoint-no-usecase');

      expect(noUseCase).toHaveLength(1);
      expect(noUseCase[0].entityId).toBeUndefined();
    });

    it('does not warn when all endpoints have useCaseRef', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const noUseCase = warnings.filter(w => w.category === 'endpoint-no-usecase');

      expect(noUseCase).toHaveLength(0);
    });

    it('does not warn when there are no endpoints', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
      });

      const warnings = validateCompleteness(diagram);
      const noUseCase = warnings.filter(w => w.category === 'endpoint-no-usecase');

      expect(noUseCase).toHaveLength(0);
    });
  });

  describe('orphan-entity', () => {
    it('warns when an entity has no relationships and more than one entity exists', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({ id: 'User', name: 'User' }),
          makeEntity({ id: 'Order', name: 'Order' }),
          makeEntity({ id: 'Orphan', name: 'Orphan' }),
        ],
        relationships: [makeRelationship({ sourceId: 'User', targetId: 'Order' })],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' }),
          makeUseCase({ id: 'uc2', name: 'Place Order', entityRef: 'Order' }),
          makeUseCase({ id: 'uc3', name: 'Do Thing', entityRef: 'Orphan' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'POST', path: '/orders', useCaseRef: 'uc2' }),
          makeEndpoint({ id: 'ep3', method: 'POST', path: '/things', useCaseRef: 'uc3' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const orphans = warnings.filter(w => w.category === 'orphan-entity');

      expect(orphans).toHaveLength(1);
      expect(orphans[0]).toEqual(
        expect.objectContaining({
          category: 'orphan-entity',
          entityId: 'Orphan',
          message: 'Entity "Orphan" has no relationships',
        }),
      );
    });

    it('does not warn when there is only one entity', () => {
      const diagram = makeDiagram({
        entities: [makeEntity({ id: 'User', name: 'User' })],
        relationships: [],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'POST', path: '/login', useCaseRef: 'uc1' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const orphans = warnings.filter(w => w.category === 'orphan-entity');

      expect(orphans).toHaveLength(0);
    });

    it('does not warn when entity is a relationship target', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({ id: 'A', name: 'Alpha' }),
          makeEntity({ id: 'B', name: 'Beta' }),
        ],
        relationships: [makeRelationship({ sourceId: 'A', targetId: 'B' })],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'UC A', entityRef: 'A' }),
          makeUseCase({ id: 'uc2', name: 'UC B', entityRef: 'B' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'GET', path: '/a', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'GET', path: '/b', useCaseRef: 'uc2' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const orphans = warnings.filter(w => w.category === 'orphan-entity');

      expect(orphans).toHaveLength(0);
    });

    it('identifies multiple orphan entities', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({ id: 'A', name: 'Alpha' }),
          makeEntity({ id: 'B', name: 'Beta' }),
          makeEntity({ id: 'C', name: 'Charlie' }),
        ],
        relationships: [],
        useCases: [
          makeUseCase({ id: 'uc1', name: 'UC A', entityRef: 'A' }),
          makeUseCase({ id: 'uc2', name: 'UC B', entityRef: 'B' }),
          makeUseCase({ id: 'uc3', name: 'UC C', entityRef: 'C' }),
        ],
        endpoints: [
          makeEndpoint({ id: 'ep1', method: 'GET', path: '/a', useCaseRef: 'uc1' }),
          makeEndpoint({ id: 'ep2', method: 'GET', path: '/b', useCaseRef: 'uc2' }),
          makeEndpoint({ id: 'ep3', method: 'GET', path: '/c', useCaseRef: 'uc3' }),
        ],
      });

      const warnings = validateCompleteness(diagram);
      const orphans = warnings.filter(w => w.category === 'orphan-entity');

      expect(orphans).toHaveLength(3);
      expect(orphans.map(w => w.entityId)).toEqual(['A', 'B', 'C']);
    });
  });

  describe('combined warnings', () => {
    it('returns warnings from multiple categories simultaneously', () => {
      const diagram = makeDiagram({
        entities: [
          makeEntity({
            id: 'User',
            name: 'User',
            methods: [{ name: 'login', parameters: [], returnType: { name: 'void' } }],
          }),
          makeEntity({ id: 'Uncovered', name: 'Uncovered' }),
          makeEntity({ id: 'Orphan', name: 'Orphan' }),
        ],
        relationships: [makeRelationship({ sourceId: 'User', targetId: 'Uncovered' })],
        useCases: [makeUseCase({ id: 'uc1', name: 'Login', entityRef: 'User' })],
        endpoints: [makeEndpoint({ id: 'ep1', method: 'GET', path: '/status' })],
      });

      const warnings = validateCompleteness(diagram);
      const categories = new Set(warnings.map(w => w.category));

      expect(categories).toContain('uncovered-entity');
      expect(categories).toContain('unreferenced-method');
      expect(categories).toContain('usecase-no-endpoint');
      expect(categories).toContain('endpoint-no-usecase');
      expect(categories).toContain('orphan-entity');
    });
  });
});
