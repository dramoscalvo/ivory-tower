import { describe, it, expect } from 'vitest';
import { validateUseCases } from '../../../../../src/usecase/domain/services/UseCaseValidator';

function createEntity(id: string, methods: string[] = []) {
  return {
    id,
    name: id,
    type: 'class' as const,
    methods: methods.map(m => ({
      name: m,
      parameters: [],
      returnType: { name: 'void' },
    })),
  };
}

function createUseCase(overrides = {}) {
  return {
    id: 'uc-1',
    name: 'Test Use Case',
    entityRef: 'entity-1',
    scenarios: [
      {
        name: 'Test Scenario',
        steps: [{ keyword: 'Given' as const, text: 'something' }],
      },
    ],
    ...overrides,
  };
}

describe('validateUseCases', () => {
  describe('actorRef validation', () => {
    it('valid actorRef passes when actor exists', () => {
      const entities = [createEntity('entity-1')];
      const actorIds = new Set(['actor-1']);
      const useCases = [createUseCase({ actorRef: 'actor-1' })];

      const errors = validateUseCases(useCases, entities, actorIds);
      const actorErrors = errors.filter(e => e.path.includes('actorRef'));
      expect(actorErrors).toHaveLength(0);
    });

    it('returns error when actorRef references non-existent actor', () => {
      const entities = [createEntity('entity-1')];
      const actorIds = new Set(['actor-1']);
      const useCases = [createUseCase({ actorRef: 'missing-actor' })];

      const errors = validateUseCases(useCases, entities, actorIds);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'useCases[0].actorRef',
          message: 'Actor "missing-actor" not found',
        }),
      );
    });

    it('allows actorRef to be omitted', () => {
      const entities = [createEntity('entity-1')];
      const actorIds = new Set(['actor-1']);
      const useCases = [createUseCase()];

      const errors = validateUseCases(useCases, entities, actorIds);
      const actorErrors = errors.filter(e => e.path.includes('actorRef'));
      expect(actorErrors).toHaveLength(0);
    });

    it('does not validate actorRef when no actorIds provided (backwards compat)', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ actorRef: 'any-actor' })];

      const errors = validateUseCases(useCases, entities);
      const actorErrors = errors.filter(e => e.path.includes('actorRef'));
      expect(actorErrors).toHaveLength(0);
    });

    it('does not validate actorRef when actorIds set is empty', () => {
      const entities = [createEntity('entity-1')];
      const actorIds = new Set<string>();
      const useCases = [createUseCase({ actorRef: 'any-actor' })];

      const errors = validateUseCases(useCases, entities, actorIds);
      const actorErrors = errors.filter(e => e.path.includes('actorRef'));
      expect(actorErrors).toHaveLength(0);
    });
  });

  describe('preconditions validation', () => {
    it('valid preconditions array passes', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ preconditions: ['User is logged in'] })];

      const errors = validateUseCases(useCases, entities);
      const preErrors = errors.filter(e => e.path.includes('preconditions'));
      expect(preErrors).toHaveLength(0);
    });

    it('returns error when preconditions is not an array', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ preconditions: 'not an array' })];

      const errors = validateUseCases(useCases, entities);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'useCases[0].preconditions',
          message: 'Preconditions must be an array of strings',
        }),
      );
    });

    it('returns error when precondition is empty string', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ preconditions: [''] })];

      const errors = validateUseCases(useCases, entities);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'useCases[0].preconditions[0]',
          message: 'Precondition must be a non-empty string',
        }),
      );
    });

    it('allows preconditions to be omitted', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase()];

      const errors = validateUseCases(useCases, entities);
      const preErrors = errors.filter(e => e.path.includes('preconditions'));
      expect(preErrors).toHaveLength(0);
    });
  });

  describe('postconditions validation', () => {
    it('valid postconditions array passes', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ postconditions: ['Order is created'] })];

      const errors = validateUseCases(useCases, entities);
      const postErrors = errors.filter(e => e.path.includes('postconditions'));
      expect(postErrors).toHaveLength(0);
    });

    it('returns error when postconditions is not an array', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ postconditions: 'not an array' })];

      const errors = validateUseCases(useCases, entities);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'useCases[0].postconditions',
          message: 'Postconditions must be an array of strings',
        }),
      );
    });

    it('returns error when postcondition is empty string', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase({ postconditions: [''] })];

      const errors = validateUseCases(useCases, entities);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'useCases[0].postconditions[0]',
          message: 'Postcondition must be a non-empty string',
        }),
      );
    });

    it('allows postconditions to be omitted', () => {
      const entities = [createEntity('entity-1')];
      const useCases = [createUseCase()];

      const errors = validateUseCases(useCases, entities);
      const postErrors = errors.filter(e => e.path.includes('postconditions'));
      expect(postErrors).toHaveLength(0);
    });
  });
});
