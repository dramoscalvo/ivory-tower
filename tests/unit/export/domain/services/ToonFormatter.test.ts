import { describe, it, expect } from 'vitest';
import { formatAsToon } from '../../../../../src/export/domain/services/ToonFormatter';
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram';

function createDiagram(overrides: Partial<UMLDiagram> = {}): UMLDiagram {
  return {
    title: 'Test Diagram',
    entities: [],
    relationships: [],
    ...overrides,
  };
}

describe('formatAsToon', () => {
  describe('title formatting', () => {
    it('includes title at the start', () => {
      const diagram = createDiagram({ title: 'My System' });
      const result = formatAsToon(diagram);

      expect(result).toContain('title: My System');
    });
  });

  describe('entity formatting', () => {
    it('formats entity with basic fields', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('entities[1]{id,name,type,description}:');
      expect(result).toContain('user,User,class,');
    });

    it('includes entity description when present', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
            description: 'A user entity',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('A user entity');
    });

    it('formats attributes with visibility', () => {
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
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('attributes[2]{name,type,visibility}:');
      expect(result).toContain('id,string,private');
      expect(result).toContain('email,string,public');
    });

    it('formats methods with parameters', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
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
      const result = formatAsToon(diagram);

      expect(result).toContain('methods[1]{name,params,returnType}:');
      expect(result).toContain('setEmail,email:string,void');
    });

    it('formats functions with export status', () => {
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
      const result = formatAsToon(diagram);

      expect(result).toContain('functions[1]{name,params,returnType,exported}:');
      expect(result).toContain('validate,input:string,boolean,true');
    });

    it('formats type definitions', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'types',
            name: 'Types',
            type: 'module',
            types: [
              {
                name: 'UserId',
                definition: 'string',
                isExported: true,
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('types[1]{name,definition,exported}:');
      expect(result).toContain('UserId,string,true');
    });
  });

  describe('relationship formatting', () => {
    it('formats relationship with all fields', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'inheritance',
            sourceId: 'a',
            targetId: 'b',
            label: 'extends',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('relationships[1]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}:');
      expect(result).toContain('r1,inheritance,a,b,extends,,');
    });

    it('handles missing label', () => {
      const diagram = createDiagram({
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
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('r1,association,a,b,');
    });

    it('includes sourceCardinality and targetCardinality in output', () => {
      const diagram = createDiagram({
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
            label: 'has',
            sourceCardinality: '1',
            targetCardinality: '0..*',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain(
        'relationships[1]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}:',
      );
      expect(result).toContain('r1,association,a,b,has,1,0..*');
    });

    it('outputs empty cardinality fields when not provided', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'inheritance',
            sourceId: 'a',
            targetId: 'b',
            label: 'extends',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain(
        'relationships[1]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}:',
      );
      // 7-field row: last two fields are empty
      expect(result).toContain('r1,inheritance,a,b,extends,,');
    });
  });

  describe('value escaping', () => {
    it('escapes values with commas', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'test',
            name: 'Test',
            type: 'class',
            description: 'Has, comma',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('"Has, comma"');
    });

    it('escapes values with quotes', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'test',
            name: 'Test',
            type: 'class',
            description: 'Has "quotes"',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('"Has ""quotes"""');
    });

    it('escapes values with newlines', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'test',
            name: 'Test',
            type: 'class',
            description: 'Has\nnewline',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('"Has\nnewline"');
    });
  });

  describe('project formatting', () => {
    it('includes project section with name', () => {
      const diagram = createDiagram({
        project: { name: 'My Project' },
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('project{name,description,stack,conventions}:');
      expect(result).toContain('My Project');
    });

    it('includes project description', () => {
      const diagram = createDiagram({
        project: { name: 'My Project', description: 'A great project' },
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('A great project');
    });

    it('formats project stack entries', () => {
      const diagram = createDiagram({
        project: {
          name: 'My Project',
          stack: { language: 'TypeScript', framework: 'React' },
        },
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('stack[2]{key,value}:');
      expect(result).toContain('language,TypeScript');
      expect(result).toContain('framework,React');
    });

    it('formats project conventions entries', () => {
      const diagram = createDiagram({
        project: {
          name: 'My Project',
          conventions: { naming: 'camelCase', testing: 'vitest' },
        },
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('conventions[2]{key,value}:');
      expect(result).toContain('naming,camelCase');
      expect(result).toContain('testing,vitest');
    });

    it('omits project section when not present', () => {
      const diagram = createDiagram();
      const result = formatAsToon(diagram);

      expect(result).not.toContain('project{');
    });
  });

  describe('actors formatting', () => {
    it('formats actors with id, name, description', () => {
      const diagram = createDiagram({
        actors: [
          { id: 'user', name: 'End User', description: 'A regular user' },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('actors[1]{id,name,description}:');
      expect(result).toContain('user,End User,A regular user');
    });

    it('omits actors section when not present or empty', () => {
      const diagram = createDiagram();
      const result = formatAsToon(diagram);

      expect(result).not.toContain('actors[');
    });
  });

  describe('enum entity formatting', () => {
    it('formats enum values section', () => {
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
      const result = formatAsToon(diagram);

      expect(result).toContain('values[3]:');
      expect(result).toContain('ACTIVE');
      expect(result).toContain('INACTIVE');
      expect(result).toContain('PENDING');
    });

    it('does not include values section for non-enum entities', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).not.toContain('values[');
    });
  });

  describe('use case enrichments', () => {
    it('includes actorRef in use case header', () => {
      const diagram = createDiagram({
        entities: [{ id: 'svc', name: 'Service', type: 'class' }],
        useCases: [
          {
            id: 'uc-1',
            name: 'Login',
            entityRef: 'svc',
            actorRef: 'user',
            scenarios: [
              {
                name: 'Happy path',
                steps: [{ keyword: 'Given' as const, text: 'a user' }],
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('useCases[1]{id,name,entityRef,methodRef,description,actorRef}:');
      expect(result).toMatch(/uc-1,Login,svc,,,user/);
    });

    it('formats preconditions section', () => {
      const diagram = createDiagram({
        entities: [{ id: 'svc', name: 'Service', type: 'class' }],
        useCases: [
          {
            id: 'uc-1',
            name: 'Login',
            entityRef: 'svc',
            preconditions: ['User is registered', 'User has credentials'],
            scenarios: [
              {
                name: 'Happy path',
                steps: [{ keyword: 'Given' as const, text: 'a user' }],
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('preconditions[2]:');
      expect(result).toContain('User is registered');
      expect(result).toContain('User has credentials');
    });

    it('formats postconditions section', () => {
      const diagram = createDiagram({
        entities: [{ id: 'svc', name: 'Service', type: 'class' }],
        useCases: [
          {
            id: 'uc-1',
            name: 'Login',
            entityRef: 'svc',
            postconditions: ['User is authenticated'],
            scenarios: [
              {
                name: 'Happy path',
                steps: [{ keyword: 'Given' as const, text: 'a user' }],
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('postconditions[1]:');
      expect(result).toContain('User is authenticated');
    });

    it('omits actorRef when not present', () => {
      const diagram = createDiagram({
        entities: [{ id: 'svc', name: 'Service', type: 'class' }],
        useCases: [
          {
            id: 'uc-1',
            name: 'Login',
            entityRef: 'svc',
            scenarios: [
              {
                name: 'Happy path',
                steps: [{ keyword: 'Given' as const, text: 'a user' }],
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      // The actorRef field should be empty (trailing comma with nothing after)
      expect(result).toMatch(/uc-1,Login,svc,,,$/m);
    });
  });

  describe('generic types', () => {
    it('formats type with generics', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'list',
            name: 'List',
            type: 'class',
            attributes: [
              {
                name: 'items',
                type: { name: 'Array', generics: [{ name: 'T' }] },
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('Array<T>');
    });

    it('formats type with multiple generics', () => {
      const diagram = createDiagram({
        entities: [
          {
            id: 'map',
            name: 'Map',
            type: 'class',
            attributes: [
              {
                name: 'data',
                type: { name: 'Map', generics: [{ name: 'string' }, { name: 'number' }] },
              },
            ],
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('Map<string,number>');
    });
  });

  describe('TOON header', () => {
    it('output starts with TOON header line', () => {
      const diagram = createDiagram();
      const result = formatAsToon(diagram);

      expect(result).toMatch(/^# TOON — Terse Object-Oriented Notation/);
    });

    it('contains format description comments', () => {
      const diagram = createDiagram();
      const result = formatAsToon(diagram);

      expect(result).toContain('# Format: section[count]{fields}: followed by indented CSV rows');
      expect(result).toContain('# Nested sections use deeper indentation');
      expect(result).toContain('# Commas/quotes in values are escaped with CSV rules (double-quote wrapping)');
    });

    it('contains title after header', () => {
      const diagram = createDiagram({ title: 'My Architecture' });
      const result = formatAsToon(diagram);

      const lines = result.split('\n');
      const titleLineIndex = lines.findIndex(line => line.startsWith('title:'));
      expect(titleLineIndex).toBeGreaterThan(0);
      expect(lines[titleLineIndex]).toBe('title: My Architecture');
    });
  });

  describe('endpoint formatting', () => {
    it('formats endpoint section header', () => {
      const diagram = createDiagram({
        endpoints: [
          {
            id: 'create-user',
            method: 'POST' as const,
            path: '/api/users',
            summary: 'Create a user',
            auth: 'public' as const,
            useCaseRef: 'uc-1',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('endpoints[1]{id,method,path,summary,auth,useCaseRef}:');
    });

    it('formats endpoint with all fields', () => {
      const diagram = createDiagram({
        endpoints: [
          {
            id: 'create-user',
            method: 'POST' as const,
            path: '/api/users',
            summary: 'Create a user',
            auth: 'public' as const,
            useCaseRef: 'uc-1',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('create-user,POST,/api/users,Create a user,public,uc-1');
    });

    it('formats endpoint with requestBody section', () => {
      const diagram = createDiagram({
        endpoints: [
          {
            id: 'create-user',
            method: 'POST' as const,
            path: '/api/users',
            requestBody: { entityRef: 'user', fields: ['email', 'name'] },
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('requestBody{entityRef,fields}:');
      expect(result).toContain('user,email;name');
    });

    it('formats endpoint with response section', () => {
      const diagram = createDiagram({
        endpoints: [
          {
            id: 'create-user',
            method: 'POST' as const,
            path: '/api/users',
            response: { entityRef: 'user', fields: ['id', 'email'] },
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('response{entityRef,fields}:');
      expect(result).toContain('user,id;email');
    });

    it('formats multiple endpoints with correct count', () => {
      const diagram = createDiagram({
        endpoints: [
          {
            id: 'create-user',
            method: 'POST' as const,
            path: '/api/users',
          },
          {
            id: 'get-user',
            method: 'GET' as const,
            path: '/api/users/:id',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('endpoints[2]{id,method,path,summary,auth,useCaseRef}:');
    });

    it('omits endpoints section when empty', () => {
      const diagram = createDiagram({ endpoints: [] });
      const result = formatAsToon(diagram);

      expect(result).not.toContain('endpoints[');
    });
  });

  describe('rule formatting', () => {
    it('formats rules section header', () => {
      const diagram = createDiagram({
        rules: [
          {
            id: 'email-unique',
            entityRef: 'user',
            field: 'email',
            type: 'unique' as const,
            description: 'Email must be unique',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('rules[1]{id,entityRef,field,type,description}:');
    });

    it('formats rule with all fields', () => {
      const diagram = createDiagram({
        rules: [
          {
            id: 'email-unique',
            entityRef: 'user',
            field: 'email',
            type: 'unique' as const,
            description: 'Email must be unique',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('email-unique,user,email,unique,Email must be unique');
    });

    it('formats rule without field', () => {
      const diagram = createDiagram({
        rules: [
          {
            id: 'age-positive',
            entityRef: 'user',
            type: 'validation' as const,
            description: 'Age must be positive',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('age-positive,user,,validation,Age must be positive');
    });

    it('formats multiple rules with correct count', () => {
      const diagram = createDiagram({
        rules: [
          {
            id: 'email-unique',
            entityRef: 'user',
            field: 'email',
            type: 'unique' as const,
            description: 'Email must be unique',
          },
          {
            id: 'age-positive',
            entityRef: 'user',
            field: 'age',
            type: 'validation' as const,
            description: 'Age must be positive',
          },
        ],
      });
      const result = formatAsToon(diagram);

      expect(result).toContain('rules[2]{id,entityRef,field,type,description}:');
    });

    it('omits rules section when empty', () => {
      const diagram = createDiagram({ rules: [] });
      const result = formatAsToon(diagram);

      expect(result).not.toContain('rules[');
    });
  });
});
