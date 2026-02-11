import { describe, it, expect } from 'vitest';
import { parseToon } from '../../../../src/diagram/infrastructure/ToonParser';
import { formatAsToon } from '../../../../src/export/domain/services/ToonFormatter';
import type { UMLDiagram } from '../../../../src/diagram/domain/models/UMLDiagram';

describe('parseToon', () => {
  describe('title parsing', () => {
    it('parses title from title: line', () => {
      const input = `title: My Diagram`;
      const diagram = parseToon(input);

      expect(diagram.title).toBe('My Diagram');
    });

    it('returns empty string for title when no title line', () => {
      const input = `entities[1]{id,name,type,description}:
  user,User,class,`;
      const diagram = parseToon(input);

      expect(diagram.title).toBe('');
    });
  });

  describe('project parsing', () => {
    it('parses project name and description', () => {
      const input = `title: Test

project{name,description,stack,conventions}:
  MyProject,A sample project`;
      const diagram = parseToon(input);

      expect(diagram.project).toBeDefined();
      expect(diagram.project!.name).toBe('MyProject');
      expect(diagram.project!.description).toBe('A sample project');
    });

    it('parses project with stack entries', () => {
      const input = `title: Test

project{name,description,stack,conventions}:
  MyProject,A sample project
    stack[2]{key,value}:
      language,TypeScript
      framework,React`;
      const diagram = parseToon(input);

      expect(diagram.project).toBeDefined();
      expect(diagram.project!.stack).toEqual({
        language: 'TypeScript',
        framework: 'React',
      });
    });

    it('parses project with conventions entries', () => {
      const input = `title: Test

project{name,description,stack,conventions}:
  MyProject,A sample project
    conventions[2]{key,value}:
      naming,camelCase
      components,functional`;
      const diagram = parseToon(input);

      expect(diagram.project).toBeDefined();
      expect(diagram.project!.conventions).toEqual({
        naming: 'camelCase',
        components: 'functional',
      });
    });

    it('returns undefined project when no project section', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  user,User,class,`;
      const diagram = parseToon(input);

      expect(diagram.project).toBeUndefined();
    });
  });

  describe('actor parsing', () => {
    it('parses actors with id, name, description', () => {
      const input = `title: Test

actors[2]{id,name,description}:
  admin,Admin,System administrator
  user,User,Regular user`;
      const diagram = parseToon(input);

      expect(diagram.actors).toHaveLength(2);
      expect(diagram.actors![0]).toEqual({
        id: 'admin',
        name: 'Admin',
        description: 'System administrator',
      });
      expect(diagram.actors![1]).toEqual({
        id: 'user',
        name: 'User',
        description: 'Regular user',
      });
    });

    it('returns empty actors when no actors section', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  user,User,class,`;
      const diagram = parseToon(input);

      expect(diagram.actors).toBeUndefined();
    });
  });

  describe('entity parsing', () => {
    it('parses entity with id, name, type', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  user,User,class,`;
      const diagram = parseToon(input);

      expect(diagram.entities).toHaveLength(1);
      expect(diagram.entities[0].id).toBe('user');
      expect(diagram.entities[0].name).toBe('User');
      expect(diagram.entities[0].type).toBe('class');
    });

    it('parses entity with description', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  user,User,class,A user entity`;
      const diagram = parseToon(input);

      expect(diagram.entities[0].description).toBe('A user entity');
    });

    it('parses entity with attributes (name, type, visibility)', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  user,User,class,A user entity
    attributes[2]{name,type,visibility}:
      email,string,public
      password,string,private`;
      const diagram = parseToon(input);

      const attrs = diagram.entities[0].attributes!;
      expect(attrs).toHaveLength(2);
      expect(attrs[0]).toEqual({
        name: 'email',
        type: { name: 'string' },
        visibility: 'public',
      });
      expect(attrs[1]).toEqual({
        name: 'password',
        type: { name: 'string' },
        visibility: 'private',
      });
    });

    it('parses entity with methods (name, params, returnType)', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  user,User,class,
    methods[2]{name,params,returnType}:
      getName,,string
      setEmail,email:string,void`;
      const diagram = parseToon(input);

      const methods = diagram.entities[0].methods!;
      expect(methods).toHaveLength(2);
      expect(methods[0].name).toBe('getName');
      expect(methods[0].parameters).toEqual([]);
      expect(methods[0].returnType).toEqual({ name: 'string' });
      expect(methods[1].name).toBe('setEmail');
      expect(methods[1].parameters).toEqual([
        { name: 'email', type: { name: 'string' } },
      ]);
      expect(methods[1].returnType).toEqual({ name: 'void' });
    });

    it('parses entity with functions (name, params, returnType, isExported)', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  utils,Utils,module,
    functions[2]{name,params,returnType,exported}:
      formatDate,date:Date,string,true
      helperFn,,void,false`;
      const diagram = parseToon(input);

      const functions = diagram.entities[0].functions!;
      expect(functions).toHaveLength(2);
      expect(functions[0].name).toBe('formatDate');
      expect(functions[0].parameters).toEqual([
        { name: 'date', type: { name: 'Date' } },
      ]);
      expect(functions[0].returnType).toEqual({ name: 'string' });
      expect(functions[0].isExported).toBe(true);
      expect(functions[1].name).toBe('helperFn');
      expect(functions[1].parameters).toEqual([]);
      expect(functions[1].isExported).toBe(false);
    });

    it('parses entity with types (name, definition, isExported)', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  utils,Utils,module,
    types[2]{name,definition,exported}:
      UserId,string,true
      Config,Record<string; unknown>,false`;
      const diagram = parseToon(input);

      const types = diagram.entities[0].types!;
      expect(types).toHaveLength(2);
      expect(types[0]).toEqual({
        name: 'UserId',
        definition: 'string',
        isExported: true,
      });
      expect(types[1]).toEqual({
        name: 'Config',
        definition: 'Record<string; unknown>',
        isExported: false,
      });
    });

    it('parses enum entity with values', () => {
      const input = `title: Test

entities[1]{id,name,type,description}:
  status,Status,enum,Order status
    values[3]:
      pending
      active
      cancelled`;
      const diagram = parseToon(input);

      expect(diagram.entities[0].type).toBe('enum');
      expect(diagram.entities[0].values).toEqual(['pending', 'active', 'cancelled']);
    });
  });

  describe('relationship parsing', () => {
    it('parses relationship with id, type, sourceId, targetId', () => {
      const input = `title: Test

entities[2]{id,name,type,description}:
  user,User,class,
  order,Order,class,

relationships[1]{id,type,sourceId,targetId,label}:
  r1,association,user,order,`;
      const diagram = parseToon(input);

      expect(diagram.relationships).toHaveLength(1);
      expect(diagram.relationships[0].id).toBe('r1');
      expect(diagram.relationships[0].type).toBe('association');
      expect(diagram.relationships[0].sourceId).toBe('user');
      expect(diagram.relationships[0].targetId).toBe('order');
    });

    it('parses relationship with label', () => {
      const input = `title: Test

entities[2]{id,name,type,description}:
  user,User,class,
  order,Order,class,

relationships[1]{id,type,sourceId,targetId,label}:
  r1,association,user,order,places`;
      const diagram = parseToon(input);

      expect(diagram.relationships[0].label).toBe('places');
    });

    it('parses sourceCardinality and targetCardinality from relationship rows', () => {
      const input = `title: Test

entities[2]{id,name,type,description}:
  user,User,class,
  order,Order,class,

relationships[1]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}:
  r1,association,user,order,places,1,0..*`;
      const diagram = parseToon(input);

      expect(diagram.relationships).toHaveLength(1);
      expect(diagram.relationships[0].sourceCardinality).toBe('1');
      expect(diagram.relationships[0].targetCardinality).toBe('0..*');
    });

    it('parses relationships without cardinality fields (backward compat)', () => {
      const input = `title: Test

entities[2]{id,name,type,description}:
  user,User,class,
  order,Order,class,

relationships[1]{id,type,sourceId,targetId,label}:
  r1,composition,user,order,owns`;
      const diagram = parseToon(input);

      expect(diagram.relationships).toHaveLength(1);
      expect(diagram.relationships[0].id).toBe('r1');
      expect(diagram.relationships[0].type).toBe('composition');
      expect(diagram.relationships[0].label).toBe('owns');
      expect(diagram.relationships[0].sourceCardinality).toBeUndefined();
      expect(diagram.relationships[0].targetCardinality).toBeUndefined();
    });
  });

  describe('endpoint parsing', () => {
    it('parses endpoint header (id, method, path, summary, auth, useCaseRef)', () => {
      const input = `title: Test

endpoints[1]{id,method,path,summary,auth,useCaseRef}:
  create-user,POST,/api/users,Create a user,public,uc-1`;
      const diagram = parseToon(input);

      expect(diagram.endpoints).toHaveLength(1);
      const endpoint = diagram.endpoints![0];
      expect(endpoint.id).toBe('create-user');
      expect(endpoint.method).toBe('POST');
      expect(endpoint.path).toBe('/api/users');
      expect(endpoint.summary).toBe('Create a user');
      expect(endpoint.auth).toBe('public');
      expect(endpoint.useCaseRef).toBe('uc-1');
    });

    it('parses endpoint with requestBody (entityRef, fields)', () => {
      const input = `title: Test

endpoints[1]{id,method,path,summary,auth,useCaseRef}:
  create-user,POST,/api/users,Create a user,public,uc-1
    requestBody{entityRef,fields}:
      user,email;name`;
      const diagram = parseToon(input);

      const endpoint = diagram.endpoints![0];
      expect(endpoint.requestBody).toBeDefined();
      expect(endpoint.requestBody!.entityRef).toBe('user');
      expect(endpoint.requestBody!.fields).toEqual(['email', 'name']);
    });

    it('parses endpoint with response', () => {
      const input = `title: Test

endpoints[1]{id,method,path,summary,auth,useCaseRef}:
  create-user,POST,/api/users,Create a user,public,uc-1
    response{entityRef,fields}:
      user,id;email;name`;
      const diagram = parseToon(input);

      const endpoint = diagram.endpoints![0];
      expect(endpoint.response).toBeDefined();
      expect(endpoint.response!.entityRef).toBe('user');
      expect(endpoint.response!.fields).toEqual(['id', 'email', 'name']);
    });

    it('parses multiple endpoints', () => {
      const input = `title: Test

endpoints[2]{id,method,path,summary,auth,useCaseRef}:
  create-user,POST,/api/users,Create a user,public,uc-1
    requestBody{entityRef,fields}:
      user,email;name
    response{entityRef,fields}:
      user,id;email
  get-user,GET,/api/users/:id,Get a user,authenticated,uc-2`;
      const diagram = parseToon(input);

      expect(diagram.endpoints).toHaveLength(2);
      expect(diagram.endpoints![0].id).toBe('create-user');
      expect(diagram.endpoints![0].requestBody).toBeDefined();
      expect(diagram.endpoints![0].response).toBeDefined();
      expect(diagram.endpoints![1].id).toBe('get-user');
      expect(diagram.endpoints![1].method).toBe('GET');
      expect(diagram.endpoints![1].auth).toBe('authenticated');
    });
  });

  describe('rule parsing', () => {
    it('parses rule with all fields (id, entityRef, field, type, description)', () => {
      const input = `title: Test

rules[1]{id,entityRef,field,type,description}:
  email-unique,user,email,unique,Email must be unique`;
      const diagram = parseToon(input);

      expect(diagram.rules).toHaveLength(1);
      const rule = diagram.rules![0];
      expect(rule.id).toBe('email-unique');
      expect(rule.entityRef).toBe('user');
      expect(rule.field).toBe('email');
      expect(rule.type).toBe('unique');
      expect(rule.description).toBe('Email must be unique');
    });

    it('parses rule without field', () => {
      const input = `title: Test

rules[1]{id,entityRef,field,type,description}:
  valid-order,order,,invariant,Order must have items`;
      const diagram = parseToon(input);

      const rule = diagram.rules![0];
      expect(rule.id).toBe('valid-order');
      expect(rule.entityRef).toBe('order');
      expect(rule.field).toBeUndefined();
      expect(rule.type).toBe('invariant');
      expect(rule.description).toBe('Order must have items');
    });

    it('parses multiple rules', () => {
      const input = `title: Test

rules[2]{id,entityRef,field,type,description}:
  email-unique,user,email,unique,Email must be unique
  age-valid,user,age,validation,Age must be positive`;
      const diagram = parseToon(input);

      expect(diagram.rules).toHaveLength(2);
      expect(diagram.rules![0].id).toBe('email-unique');
      expect(diagram.rules![1].id).toBe('age-valid');
      expect(diagram.rules![1].type).toBe('validation');
      expect(diagram.rules![1].description).toBe('Age must be positive');
    });
  });

  describe('use case parsing', () => {
    it('parses use case with id, name, entityRef', () => {
      const input = `title: Test

useCases[1]{id,name,entityRef,methodRef,description,actorRef}:
  uc-1,Create User,user,,,
    scenarios[0]{name}:`;
      const diagram = parseToon(input);

      expect(diagram.useCases).toHaveLength(1);
      const uc = diagram.useCases![0];
      expect(uc.id).toBe('uc-1');
      expect(uc.name).toBe('Create User');
      expect(uc.entityRef).toBe('user');
    });

    it('parses use case with methodRef, description, actorRef', () => {
      const input = `title: Test

useCases[1]{id,name,entityRef,methodRef,description,actorRef}:
  uc-1,Create User,user,createUser,Creates a new user,admin
    scenarios[0]{name}:`;
      const diagram = parseToon(input);

      const uc = diagram.useCases![0];
      expect(uc.methodRef).toBe('createUser');
      expect(uc.description).toBe('Creates a new user');
      expect(uc.actorRef).toBe('admin');
    });

    it('parses use case with preconditions and postconditions', () => {
      const input = `title: Test

useCases[1]{id,name,entityRef,methodRef,description,actorRef}:
  uc-1,Create User,user,,,
    preconditions[2]:
      User is authenticated
      User has admin role
    postconditions[1]:
      New user exists in the system
    scenarios[0]{name}:`;
      const diagram = parseToon(input);

      const uc = diagram.useCases![0];
      expect(uc.preconditions).toEqual([
        'User is authenticated',
        'User has admin role',
      ]);
      expect(uc.postconditions).toEqual([
        'New user exists in the system',
      ]);
    });

    it('parses use case with scenarios and steps', () => {
      const input = `title: Test

useCases[1]{id,name,entityRef,methodRef,description,actorRef}:
  uc-1,Create User,user,,,
    scenarios[1]{name}:
        Happy path
          steps[3]{keyword,text}:
            Given,the user is on the registration page
            When,the user submits valid data
            Then,a new user account is created`;
      const diagram = parseToon(input);

      const uc = diagram.useCases![0];
      expect(uc.scenarios).toHaveLength(1);
      expect(uc.scenarios[0].name).toBe('Happy path');
      expect(uc.scenarios[0].steps).toHaveLength(3);
      expect(uc.scenarios[0].steps[0]).toEqual({
        keyword: 'Given',
        text: 'the user is on the registration page',
      });
      expect(uc.scenarios[0].steps[1]).toEqual({
        keyword: 'When',
        text: 'the user submits valid data',
      });
      expect(uc.scenarios[0].steps[2]).toEqual({
        keyword: 'Then',
        text: 'a new user account is created',
      });
    });
  });

  describe('round-trip', () => {
    it('formats a diagram to TOON then parses it back with matching fields', () => {
      const original: UMLDiagram = {
        title: 'Round Trip Test',
        project: {
          name: 'TestProject',
          description: 'A test project',
          stack: { language: 'TypeScript', runtime: 'Node.js' },
          conventions: { naming: 'camelCase' },
        },
        actors: [
          { id: 'admin', name: 'Admin', description: 'System administrator' },
        ],
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
            description: 'A user entity',
            attributes: [
              { name: 'email', type: { name: 'string' }, visibility: 'public' },
              { name: 'password', type: { name: 'string' }, visibility: 'private' },
            ],
            methods: [
              {
                name: 'getName',
                parameters: [],
                returnType: { name: 'string' },
              },
              {
                name: 'setEmail',
                parameters: [{ name: 'email', type: { name: 'string' } }],
                returnType: { name: 'void' },
              },
            ],
          },
          {
            id: 'status',
            name: 'Status',
            type: 'enum',
            values: ['active', 'inactive'],
          },
        ],
        relationships: [
          {
            id: 'r1',
            type: 'association',
            sourceId: 'user',
            targetId: 'status',
            label: 'has',
          },
        ],
        endpoints: [
          {
            id: 'create-user',
            method: 'POST',
            path: '/api/users',
            summary: 'Create a user',
            auth: 'public',
            useCaseRef: 'uc-1',
            requestBody: { entityRef: 'user', fields: ['email', 'password'] },
            response: { entityRef: 'user', fields: ['id', 'email'] },
          },
        ],
        rules: [
          {
            id: 'email-unique',
            entityRef: 'user',
            field: 'email',
            type: 'unique',
            description: 'Email must be unique',
          },
        ],
        useCases: [
          {
            id: 'uc-1',
            name: 'Create User',
            entityRef: 'user',
            methodRef: 'createUser',
            description: 'Creates a new user account',
            actorRef: 'admin',
            preconditions: ['User is authenticated'],
            postconditions: ['New user exists'],
            scenarios: [
              {
                name: 'Happy path',
                steps: [
                  { keyword: 'Given', text: 'admin is logged in' },
                  { keyword: 'When', text: 'admin submits user data' },
                  { keyword: 'Then', text: 'user is created' },
                ],
              },
            ],
          },
        ],
      };

      const toonString = formatAsToon(original);
      const parsed = parseToon(toonString);

      // Title
      expect(parsed.title).toBe(original.title);

      // Project
      expect(parsed.project).toBeDefined();
      expect(parsed.project!.name).toBe(original.project!.name);
      expect(parsed.project!.description).toBe(original.project!.description);
      expect(parsed.project!.stack).toEqual(original.project!.stack);
      expect(parsed.project!.conventions).toEqual(original.project!.conventions);

      // Actors
      expect(parsed.actors).toHaveLength(1);
      expect(parsed.actors![0]).toEqual(original.actors![0]);

      // Entities
      expect(parsed.entities).toHaveLength(2);
      expect(parsed.entities[0].id).toBe('user');
      expect(parsed.entities[0].name).toBe('User');
      expect(parsed.entities[0].type).toBe('class');
      expect(parsed.entities[0].description).toBe('A user entity');
      expect(parsed.entities[0].attributes).toHaveLength(2);
      expect(parsed.entities[0].attributes![0].name).toBe('email');
      expect(parsed.entities[0].attributes![0].visibility).toBe('public');
      expect(parsed.entities[0].attributes![1].visibility).toBe('private');
      expect(parsed.entities[0].methods).toHaveLength(2);
      expect(parsed.entities[0].methods![0].name).toBe('getName');
      expect(parsed.entities[0].methods![1].parameters).toHaveLength(1);
      expect(parsed.entities[1].id).toBe('status');
      expect(parsed.entities[1].type).toBe('enum');
      expect(parsed.entities[1].values).toEqual(['active', 'inactive']);

      // Relationships
      expect(parsed.relationships).toHaveLength(1);
      expect(parsed.relationships[0].id).toBe('r1');
      expect(parsed.relationships[0].type).toBe('association');
      expect(parsed.relationships[0].sourceId).toBe('user');
      expect(parsed.relationships[0].targetId).toBe('status');
      expect(parsed.relationships[0].label).toBe('has');

      // Endpoints
      expect(parsed.endpoints).toHaveLength(1);
      expect(parsed.endpoints![0].id).toBe('create-user');
      expect(parsed.endpoints![0].method).toBe('POST');
      expect(parsed.endpoints![0].path).toBe('/api/users');
      expect(parsed.endpoints![0].requestBody!.entityRef).toBe('user');
      expect(parsed.endpoints![0].requestBody!.fields).toEqual(['email', 'password']);
      expect(parsed.endpoints![0].response!.entityRef).toBe('user');
      expect(parsed.endpoints![0].response!.fields).toEqual(['id', 'email']);

      // Rules
      expect(parsed.rules).toHaveLength(1);
      expect(parsed.rules![0].id).toBe('email-unique');
      expect(parsed.rules![0].field).toBe('email');
      expect(parsed.rules![0].type).toBe('unique');
      expect(parsed.rules![0].description).toBe('Email must be unique');

      // Use Cases
      expect(parsed.useCases).toHaveLength(1);
      expect(parsed.useCases![0].id).toBe('uc-1');
      expect(parsed.useCases![0].name).toBe('Create User');
      expect(parsed.useCases![0].entityRef).toBe('user');
      expect(parsed.useCases![0].methodRef).toBe('createUser');
      expect(parsed.useCases![0].description).toBe('Creates a new user account');
      expect(parsed.useCases![0].actorRef).toBe('admin');
      expect(parsed.useCases![0].preconditions).toEqual(['User is authenticated']);
      expect(parsed.useCases![0].postconditions).toEqual(['New user exists']);
      expect(parsed.useCases![0].scenarios).toHaveLength(1);
      expect(parsed.useCases![0].scenarios[0].name).toBe('Happy path');
      expect(parsed.useCases![0].scenarios[0].steps).toHaveLength(3);
    });
  });
});
