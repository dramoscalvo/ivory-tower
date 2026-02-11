import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportService } from '../../../../src/export/application/ExportService';
import type { UMLDiagram } from '../../../../src/diagram/domain/models/UMLDiagram';

// Mock the file downloader to prevent actual file downloads
vi.mock('../../../../src/export/infrastructure/FileDownloader', () => ({
  downloadFile: vi.fn(),
}));

import { downloadFile } from '../../../../src/export/infrastructure/FileDownloader';

const mockDownloadFile = vi.mocked(downloadFile);

function createTestDiagram(): UMLDiagram {
  return {
    title: 'Test System',
    entities: [
      {
        id: 'user',
        name: 'User',
        type: 'class',
        description: 'A user entity',
        attributes: [{ name: 'id', type: { name: 'string' }, visibility: 'private' }],
        methods: [{ name: 'getName', parameters: [], returnType: { name: 'string' } }],
      },
    ],
    relationships: [],
  };
}

describe('ExportService', () => {
  const service = new ExportService();

  beforeEach(() => {
    mockDownloadFile.mockClear();
  });

  describe('getAsToon', () => {
    it('returns TOON formatted string', () => {
      const diagram = createTestDiagram();
      const result = service.getAsToon(diagram);

      expect(result).toContain('title: Test System');
      expect(result).toContain('entities[1]');
      expect(result).toContain('user,User,class');
    });

    it('includes all entity details', () => {
      const diagram = createTestDiagram();
      const result = service.getAsToon(diagram);

      expect(result).toContain('attributes[1]');
      expect(result).toContain('id,string,private');
      expect(result).toContain('methods[1]');
      expect(result).toContain('getName');
    });

    it('handles empty diagram', () => {
      const diagram: UMLDiagram = {
        title: 'Empty',
        entities: [],
        relationships: [],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('title: Empty');
      expect(result).not.toContain('entities[');
    });
  });

  describe('exportAsToon', () => {
    it('calls downloadFile with correct content', () => {
      const diagram = createTestDiagram();
      service.exportAsToon(diagram);

      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
      const [content] = mockDownloadFile.mock.calls[0];
      expect(content).toContain('title: Test System');
    });

    it('generates filename from diagram title', () => {
      const diagram = createTestDiagram();
      service.exportAsToon(diagram);

      const [, filename] = mockDownloadFile.mock.calls[0];
      expect(filename).toBe('test-system.toon');
    });

    it('converts spaces to hyphens in filename', () => {
      const diagram: UMLDiagram = {
        title: 'My Complex System Name',
        entities: [],
        relationships: [],
      };
      service.exportAsToon(diagram);

      const [, filename] = mockDownloadFile.mock.calls[0];
      expect(filename).toBe('my-complex-system-name.toon');
    });

    it('uses text/plain mime type', () => {
      const diagram = createTestDiagram();
      service.exportAsToon(diagram);

      const [, , mimeType] = mockDownloadFile.mock.calls[0];
      expect(mimeType).toBe('text/plain');
    });
  });

  describe('Phase 1: TOON export with new sections', () => {
    it('includes project metadata in TOON output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        project: {
          name: 'My App',
          description: 'A test app',
          stack: { language: 'TypeScript', framework: 'Express' },
          conventions: { api: 'REST' },
        },
        entities: [],
        relationships: [],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('project{name,description,stack,conventions}:');
      expect(result).toContain('My App');
      expect(result).toContain('stack[2]{key,value}:');
      expect(result).toContain('language,TypeScript');
      expect(result).toContain('conventions[1]{key,value}:');
      expect(result).toContain('api,REST');
    });

    it('includes actors in TOON output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        actors: [
          { id: 'user', name: 'End User', description: 'A regular user' },
          { id: 'admin', name: 'Admin' },
        ],
        entities: [],
        relationships: [],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('actors[2]{id,name,description}:');
      expect(result).toContain('user,End User,A regular user');
      expect(result).toContain('admin,Admin,');
    });

    it('includes enum values in TOON output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        entities: [
          {
            id: 'status',
            name: 'OrderStatus',
            type: 'enum',
            values: ['PENDING', 'SHIPPED', 'DELIVERED'],
          },
        ],
        relationships: [],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('status,OrderStatus,enum,');
      expect(result).toContain('values[3]:');
      expect(result).toContain('PENDING');
      expect(result).toContain('SHIPPED');
      expect(result).toContain('DELIVERED');
    });

    it('includes use case enrichments in TOON output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [],
        useCases: [
          {
            id: 'uc-1',
            name: 'Do Thing',
            entityRef: 'a',
            actorRef: 'user',
            preconditions: ['Logged in', 'Has permission'],
            postconditions: ['Thing is done'],
            scenarios: [
              {
                name: 'Happy path',
                steps: [{ keyword: 'Given', text: 'a user' }],
              },
            ],
          },
        ],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('useCases[1]{id,name,entityRef,methodRef,description,actorRef}:');
      expect(result).toContain(',user');
      expect(result).toContain('preconditions[2]:');
      expect(result).toContain('Logged in');
      expect(result).toContain('Has permission');
      expect(result).toContain('postconditions[1]:');
      expect(result).toContain('Thing is done');
    });
  });

  describe('Phase 2: JSON export', () => {
    it('exports JSON with correct filename and mime type', () => {
      const diagram = createTestDiagram();
      service.exportAsJson(diagram);

      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
      const [content, filename, mimeType] = mockDownloadFile.mock.calls[0];
      expect(filename).toBe('test-system.json');
      expect(mimeType).toBe('application/json');
      expect(JSON.parse(content)).toEqual(diagram);
    });

    it('getAsJson returns valid JSON string', () => {
      const diagram = createTestDiagram();
      const result = service.getAsJson(diagram);
      const parsed = JSON.parse(result);

      expect(parsed.title).toBe('Test System');
      expect(parsed.entities).toHaveLength(1);
      expect(parsed.entities[0].id).toBe('user');
    });

    it('getAsJson includes all diagram sections', () => {
      const diagram: UMLDiagram = {
        title: 'Full',
        project: { name: 'App' },
        actors: [{ id: 'u', name: 'User' }],
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
            attributes: [{ name: 'email', type: { name: 'string' } }],
          },
        ],
        relationships: [],
        endpoints: [
          { id: 'ep-1', method: 'GET', path: '/api/users' },
        ],
        rules: [
          { id: 'r-1', entityRef: 'user', type: 'unique', description: 'Unique email' },
        ],
        useCases: [
          { id: 'uc-1', name: 'Get Users', entityRef: 'user', scenarios: [] },
        ],
      };
      const result = JSON.parse(service.getAsJson(diagram));

      expect(result.project.name).toBe('App');
      expect(result.actors).toHaveLength(1);
      expect(result.endpoints).toHaveLength(1);
      expect(result.rules).toHaveLength(1);
      expect(result.useCases).toHaveLength(1);
    });
  });

  describe('Phase 2: TOON export with endpoints and rules', () => {
    it('includes endpoints in TOON output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        entities: [
          {
            id: 'user',
            name: 'User',
            type: 'class',
            attributes: [{ name: 'email', type: { name: 'string' } }],
          },
        ],
        relationships: [],
        endpoints: [
          {
            id: 'create-user',
            method: 'POST',
            path: '/api/users',
            summary: 'Create a user',
            auth: 'public',
            requestBody: { entityRef: 'user', fields: ['email'] },
          },
        ],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('endpoints[1]{id,method,path,summary,auth,useCaseRef}:');
      expect(result).toContain('create-user,POST,/api/users,Create a user,public,');
      expect(result).toContain('requestBody{entityRef,fields}:');
      expect(result).toContain('user,email');
    });

    it('includes rules in TOON output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        entities: [{ id: 'user', name: 'User', type: 'class' }],
        relationships: [],
        rules: [
          {
            id: 'email-unique',
            entityRef: 'user',
            field: 'email',
            type: 'unique',
            description: 'Email must be unique',
          },
        ],
      };
      const result = service.getAsToon(diagram);

      expect(result).toContain('rules[1]{id,entityRef,field,type,description}:');
      expect(result).toContain('email-unique,user,email,unique,Email must be unique');
    });

    it('includes TOON header in output', () => {
      const diagram: UMLDiagram = {
        title: 'Test',
        entities: [],
        relationships: [],
      };
      const result = service.getAsToon(diagram);

      expect(result).toMatch(/^# TOON/);
      expect(result).toContain('Terse Object-Oriented Notation');
    });
  });
});
