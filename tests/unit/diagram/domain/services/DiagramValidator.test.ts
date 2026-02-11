import { describe, it, expect } from 'vitest';
import { validateDiagram } from '../../../../../src/diagram/domain/services/DiagramValidator';

describe('validateDiagram', () => {
  describe('diagram structure', () => {
    it('returns error when diagram is not an object', () => {
      const errors = validateDiagram(null);
      expect(errors).toContainEqual(
        expect.objectContaining({ message: 'Diagram must be an object' }),
      );
    });

    it('returns error when title is missing', () => {
      const errors = validateDiagram({ entities: [], relationships: [] });
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'title', message: 'Diagram must have a string title' }),
      );
    });

    it('returns error when entities array is missing', () => {
      const errors = validateDiagram({ title: 'Test', relationships: [] });
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities',
          message: 'Diagram must have an entities array',
        }),
      );
    });

    it('returns error when relationships array is missing', () => {
      const errors = validateDiagram({ title: 'Test', entities: [] });
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'relationships',
          message: 'Diagram must have a relationships array',
        }),
      );
    });

    it('returns no errors for valid empty diagram', () => {
      const errors = validateDiagram({ title: 'Test', entities: [], relationships: [] });
      expect(errors).toHaveLength(0);
    });
  });

  describe('entity validation', () => {
    it('returns error when entity has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [{ name: 'Foo', type: 'class' }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(expect.objectContaining({ path: 'entities[0].id' }));
    });

    it('returns error when entity has no name', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'foo', type: 'class' }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(expect.objectContaining({ path: 'entities[0].name' }));
    });

    it('returns error when entity has invalid type', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'foo', name: 'Foo', type: 'invalid' }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(expect.objectContaining({ path: 'entities[0].type' }));
    });

    it('accepts all valid entity types', () => {
      const validTypes = ['class', 'interface', 'module', 'type', 'abstract-class', 'enum'];
      for (const type of validTypes) {
        const diagram = {
          title: 'Test',
          entities: [{ id: 'foo', name: 'Foo', type }],
          relationships: [],
        };
        const errors = validateDiagram(diagram);
        const typeErrors = errors.filter(e => e.path === 'entities[0].type');
        expect(typeErrors).toHaveLength(0);
      }
    });

    it('validates attributes have name and type', () => {
      const diagram = {
        title: 'Test',
        entities: [
          {
            id: 'foo',
            name: 'Foo',
            type: 'class',
            attributes: [{ visibility: 'public' }],
          },
        ],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].attributes[0].name' }),
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].attributes[0].type' }),
      );
    });

    it('validates methods have required fields', () => {
      const diagram = {
        title: 'Test',
        entities: [
          {
            id: 'foo',
            name: 'Foo',
            type: 'class',
            methods: [{}],
          },
        ],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].methods[0].name' }),
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].methods[0].parameters' }),
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].methods[0].returnType' }),
      );
    });

    it('returns no errors for valid entity with all fields', () => {
      const diagram = {
        title: 'Test',
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
            attributes: [{ name: 'id', type: { name: 'string' }, visibility: 'private' }],
            methods: [
              {
                name: 'getName',
                parameters: [],
                returnType: { name: 'string' },
              },
            ],
          },
        ],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toHaveLength(0);
    });
  });

  describe('duplicate detection', () => {
    it('detects duplicate entity ids', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'foo', name: 'Foo', type: 'class' },
          { id: 'foo', name: 'Bar', type: 'class' },
        ],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities',
          message: expect.stringContaining('Duplicate entity ids'),
        }),
      );
    });
  });

  describe('relationship validation', () => {
    it('returns error when relationship has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [{ type: 'inheritance', sourceId: 'a', targetId: 'b' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(expect.objectContaining({ path: 'relationships[0].id' }));
    });

    it('returns error when relationship has invalid type', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [{ id: 'r1', type: 'invalid', sourceId: 'a', targetId: 'b' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(expect.objectContaining({ path: 'relationships[0].type' }));
    });

    it('accepts all valid relationship types', () => {
      const validTypes = [
        'inheritance',
        'implementation',
        'composition',
        'aggregation',
        'dependency',
        'association',
      ];
      for (const type of validTypes) {
        const diagram = {
          title: 'Test',
          entities: [
            { id: 'a', name: 'A', type: 'class' },
            { id: 'b', name: 'B', type: 'class' },
          ],
          relationships: [{ id: 'r1', type, sourceId: 'a', targetId: 'b' }],
        };
        const errors = validateDiagram(diagram);
        const typeErrors = errors.filter(e => e.path === 'relationships[0].type');
        expect(typeErrors).toHaveLength(0);
      }
    });

    it('returns error when sourceId references non-existent entity', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'missing', targetId: 'a' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'relationships[0].sourceId',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('returns error when targetId references non-existent entity', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'missing' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'relationships[0].targetId',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    describe('relationship cardinality', () => {
      it('valid diagram with sourceCardinality and targetCardinality passes validation', () => {
        const diagram = {
          title: 'Test',
          entities: [
            { id: 'a', name: 'A', type: 'class' },
            { id: 'b', name: 'B', type: 'class' },
          ],
          relationships: [
            {
              id: 'r1',
              type: 'association',
              sourceId: 'a',
              targetId: 'b',
              sourceCardinality: '1',
              targetCardinality: '0..*',
            },
          ],
        };
        const errors = validateDiagram(diagram);
        const cardinalityErrors = errors.filter(
          e =>
            e.path.includes('sourceCardinality') || e.path.includes('targetCardinality'),
        );
        expect(cardinalityErrors).toHaveLength(0);
      });

      it('returns error when sourceCardinality is invalid', () => {
        const diagram = {
          title: 'Test',
          entities: [
            { id: 'a', name: 'A', type: 'class' },
            { id: 'b', name: 'B', type: 'class' },
          ],
          relationships: [
            {
              id: 'r1',
              type: 'association',
              sourceId: 'a',
              targetId: 'b',
              sourceCardinality: 'many',
            },
          ],
        };
        const errors = validateDiagram(diagram);
        expect(errors).toContainEqual(
          expect.objectContaining({
            path: 'relationships[0].sourceCardinality',
            message: expect.stringContaining('sourceCardinality'),
          }),
        );
      });

      it('returns error when targetCardinality is invalid', () => {
        const diagram = {
          title: 'Test',
          entities: [
            { id: 'a', name: 'A', type: 'class' },
            { id: 'b', name: 'B', type: 'class' },
          ],
          relationships: [
            {
              id: 'r1',
              type: 'association',
              sourceId: 'a',
              targetId: 'b',
              targetCardinality: 'many',
            },
          ],
        };
        const errors = validateDiagram(diagram);
        expect(errors).toContainEqual(
          expect.objectContaining({
            path: 'relationships[0].targetCardinality',
            message: expect.stringContaining('targetCardinality'),
          }),
        );
      });

      it('accepts all valid cardinality values', () => {
        const validCardinalities = ['1', '0..1', '1..*', '*', '0..*'];
        for (const cardinality of validCardinalities) {
          const diagram = {
            title: 'Test',
            entities: [
              { id: 'a', name: 'A', type: 'class' },
              { id: 'b', name: 'B', type: 'class' },
            ],
            relationships: [
              {
                id: 'r1',
                type: 'association',
                sourceId: 'a',
                targetId: 'b',
                sourceCardinality: cardinality,
                targetCardinality: cardinality,
              },
            ],
          };
          const errors = validateDiagram(diagram);
          const cardinalityErrors = errors.filter(
            e =>
              e.path.includes('sourceCardinality') || e.path.includes('targetCardinality'),
          );
          expect(cardinalityErrors).toHaveLength(0);
        }
      });

      it('no cardinality (undefined) is valid for backward compatibility', () => {
        const diagram = {
          title: 'Test',
          entities: [
            { id: 'a', name: 'A', type: 'class' },
            { id: 'b', name: 'B', type: 'class' },
          ],
          relationships: [
            { id: 'r1', type: 'association', sourceId: 'a', targetId: 'b' },
          ],
        };
        const errors = validateDiagram(diagram);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('project metadata validation', () => {
    it('valid project metadata passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        project: { name: 'My Project' },
      };
      const errors = validateDiagram(diagram);
      const projectErrors = errors.filter(e => e.path.startsWith('project'));
      expect(projectErrors).toHaveLength(0);
    });

    it('returns error when project is not an object', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        project: 'not an object',
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'project', message: 'Project must be an object' }),
      );
    });

    it('returns error when project.name is missing', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        project: { description: 'No name here' },
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'project.name',
          message: 'Project must have a string name',
        }),
      );
    });

    it('returns error when project.stack is not an object', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        project: { name: 'Test', stack: 'not an object' },
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'project.stack',
          message: 'Project stack must be an object',
        }),
      );
    });

    it('returns error when project.conventions is not an object', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        project: { name: 'Test', conventions: 42 },
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'project.conventions',
          message: 'Project conventions must be an object',
        }),
      );
    });

    it('optional project (diagram without project still valid)', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toHaveLength(0);
    });
  });

  describe('actors validation', () => {
    it('valid actors array passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        actors: [{ id: 'user', name: 'User' }],
      };
      const errors = validateDiagram(diagram);
      const actorErrors = errors.filter(e => e.path.startsWith('actors'));
      expect(actorErrors).toHaveLength(0);
    });

    it('returns error when actor has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        actors: [{ name: 'User' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'actors[0].id',
          message: 'Actor must have a string id',
        }),
      );
    });

    it('returns error when actor has no name', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        actors: [{ id: 'user' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'actors[0].name',
          message: 'Actor must have a string name',
        }),
      );
    });

    it('detects duplicate actor ids', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        actors: [
          { id: 'user', name: 'User' },
          { id: 'user', name: 'Another User' },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'actors',
          message: expect.stringContaining('Duplicate actor ids'),
        }),
      );
    });

    it('optional actors (diagram without actors still valid)', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toHaveLength(0);
    });

    it('accepts actors as empty array', () => {
      const diagram = {
        title: 'Test',
        entities: [],
        relationships: [],
        actors: [],
      };
      const errors = validateDiagram(diagram);
      const actorErrors = errors.filter(e => e.path.startsWith('actors'));
      expect(actorErrors).toHaveLength(0);
    });
  });

  describe('enum entity validation', () => {
    it('returns error when enum entity has no values', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'status', name: 'Status', type: 'enum' }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities[0].values',
          message: 'Enum entity must have a non-empty values array',
        }),
      );
    });

    it('returns error when enum entity has empty values array', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'status', name: 'Status', type: 'enum', values: [] }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities[0].values',
          message: 'Enum entity must have a non-empty values array',
        }),
      );
    });

    it('returns error when enum value is not a string', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'status', name: 'Status', type: 'enum', values: [42] }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities[0].values[0]',
          message: 'Enum value must be a non-empty string',
        }),
      );
    });

    it('returns error when enum value is empty string', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'status', name: 'Status', type: 'enum', values: [''] }],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities[0].values[0]',
          message: 'Enum value must be a non-empty string',
        }),
      );
    });

    it('valid enum entity with values passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'status', name: 'Status', type: 'enum', values: ['ACTIVE', 'INACTIVE'] },
        ],
        relationships: [],
      };
      const errors = validateDiagram(diagram);
      const enumErrors = errors.filter(e => e.path.includes('values'));
      expect(enumErrors).toHaveLength(0);
    });
  });

  describe('endpoint validation', () => {
    const userEntity = {
      id: 'user',
      name: 'User',
      type: 'class',
      attributes: [
        { name: 'email', type: { name: 'string' } },
        { name: 'name', type: { name: 'string' } },
      ],
    };

    it('valid endpoint passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          { id: 'createUser', method: 'POST', path: '/api/users', auth: 'public' },
        ],
      };
      const errors = validateDiagram(diagram);
      const endpointErrors = errors.filter(e => e.path.startsWith('endpoints'));
      expect(endpointErrors).toHaveLength(0);
    });

    it('returns error when endpoint has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [{ method: 'POST', path: '/api/users' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].id',
          message: expect.stringContaining('id'),
        }),
      );
    });

    it('returns error when endpoint has invalid method', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [{ id: 'ep1', method: 'INVALID', path: '/api/users' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].method',
          message: expect.stringContaining('method'),
        }),
      );
    });

    it('returns error when endpoint has no path', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [{ id: 'ep1', method: 'GET' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].path',
          message: expect.stringContaining('path'),
        }),
      );
    });

    it('returns error when endpoint has invalid auth', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          { id: 'ep1', method: 'GET', path: '/api/users', auth: 'superuser' },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].auth',
          message: expect.stringContaining('auth'),
        }),
      );
    });

    it('accepts all valid auth values', () => {
      const validAuthTypes = ['public', 'authenticated', 'admin'];
      for (const auth of validAuthTypes) {
        const diagram = {
          title: 'Test',
          entities: [userEntity],
          relationships: [],
          endpoints: [{ id: 'ep1', method: 'GET', path: '/api/users', auth }],
        };
        const errors = validateDiagram(diagram);
        const authErrors = errors.filter(e => e.path === 'endpoints[0].auth');
        expect(authErrors).toHaveLength(0);
      }
    });

    it('detects duplicate endpoint ids', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          { id: 'ep1', method: 'GET', path: '/api/users' },
          { id: 'ep1', method: 'POST', path: '/api/users' },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints',
          message: expect.stringContaining('Duplicate endpoint ids'),
        }),
      );
    });

    it('returns error when requestBody references non-existent entity', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/api/users',
            requestBody: { entityRef: 'nonExistent' },
          },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].requestBody.entityRef',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('returns error when requestBody field does not exist on entity', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/api/users',
            requestBody: { entityRef: 'user', fields: ['nonExistentField'] },
          },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].requestBody.fields[0]',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('valid response with entityRef passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/api/users',
            response: { entityRef: 'user' },
          },
        ],
      };
      const errors = validateDiagram(diagram);
      const responseErrors = errors.filter(e => e.path.startsWith('endpoints[0].response'));
      expect(responseErrors).toHaveLength(0);
    });

    it('returns error when useCaseRef references non-existent use case', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        useCases: [
          {
            id: 'uc1',
            name: 'Create User',
            description: 'Creates a new user',
            actorRefs: [],
            entityRefs: ['user'],
          },
        ],
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/api/users',
            useCaseRef: 'nonExistent',
          },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints[0].useCaseRef',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('returns error when endpoints is not an array', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: 'not an array',
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'endpoints',
          message: 'Endpoints must be an array',
        }),
      );
    });

    it('requestBody fields that exist on entity pass validation', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/api/users',
            requestBody: { entityRef: 'user', fields: ['email', 'name'] },
          },
        ],
      };
      const errors = validateDiagram(diagram);
      const fieldErrors = errors.filter(e => e.path.startsWith('endpoints[0].requestBody.fields'));
      expect(fieldErrors).toHaveLength(0);
    });
  });

  describe('rule validation', () => {
    const userEntity = {
      id: 'user',
      name: 'User',
      type: 'class',
      attributes: [
        { name: 'email', type: { name: 'string' } },
        { name: 'name', type: { name: 'string' } },
      ],
    };

    it('valid rule passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          {
            id: 'r1',
            entityRef: 'user',
            type: 'unique',
            description: 'Email must be unique',
          },
        ],
      };
      const errors = validateDiagram(diagram);
      const ruleErrors = errors.filter(e => e.path.startsWith('rules'));
      expect(ruleErrors).toHaveLength(0);
    });

    it('returns error when rule has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          { entityRef: 'user', type: 'unique', description: 'Email must be unique' },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules[0].id',
          message: expect.stringContaining('id'),
        }),
      );
    });

    it('returns error when rule has invalid type', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          {
            id: 'r1',
            entityRef: 'user',
            type: 'invalid',
            description: 'Some rule',
          },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules[0].type',
          message: expect.stringContaining('type'),
        }),
      );
    });

    it('returns error when rule has no description', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [{ id: 'r1', entityRef: 'user', type: 'unique' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules[0].description',
          message: expect.stringContaining('description'),
        }),
      );
    });

    it('returns error when rule has no entityRef', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [{ id: 'r1', type: 'unique', description: 'Some rule' }],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules[0].entityRef',
          message: expect.stringContaining('entityRef'),
        }),
      );
    });

    it('returns error when rule references non-existent entity', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          {
            id: 'r1',
            entityRef: 'nonExistent',
            type: 'unique',
            description: 'Some rule',
          },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules[0].entityRef',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('returns error when rule field does not exist on entity', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          {
            id: 'r1',
            entityRef: 'user',
            type: 'unique',
            description: 'Some rule',
            field: 'nonExistentField',
          },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules[0].field',
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('valid field on entity passes validation', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          {
            id: 'r1',
            entityRef: 'user',
            type: 'unique',
            description: 'Email must be unique',
            field: 'email',
          },
        ],
      };
      const errors = validateDiagram(diagram);
      const fieldErrors = errors.filter(e => e.path === 'rules[0].field');
      expect(fieldErrors).toHaveLength(0);
    });

    it('detects duplicate rule ids', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: [
          { id: 'r1', entityRef: 'user', type: 'unique', description: 'Rule one' },
          { id: 'r1', entityRef: 'user', type: 'validation', description: 'Rule two' },
        ],
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules',
          message: expect.stringContaining('Duplicate rule ids'),
        }),
      );
    });

    it('returns error when rules is not an array', () => {
      const diagram = {
        title: 'Test',
        entities: [userEntity],
        relationships: [],
        rules: 'not an array',
      };
      const errors = validateDiagram(diagram);
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'rules',
          message: 'Rules must be an array',
        }),
      );
    });
  });
});
