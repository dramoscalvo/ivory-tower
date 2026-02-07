import { describe, it, expect } from 'vitest'
import { formatAsToon } from '../../../../../src/export/domain/services/ToonFormatter'
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram'

function createDiagram(overrides: Partial<UMLDiagram> = {}): UMLDiagram {
  return {
    title: 'Test Diagram',
    entities: [],
    relationships: [],
    ...overrides,
  }
}

describe('formatAsToon', () => {
  describe('title formatting', () => {
    it('includes title at the start', () => {
      const diagram = createDiagram({ title: 'My System' })
      const result = formatAsToon(diagram)

      expect(result).toMatch(/^title: My System/)
    })
  })

  describe('entity formatting', () => {
    it('formats entity with basic fields', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'user',
          name: 'User',
          type: 'class',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('entities[1]{id,name,type,description}:')
      expect(result).toContain('user,User,class,')
    })

    it('includes entity description when present', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'user',
          name: 'User',
          type: 'class',
          description: 'A user entity',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('A user entity')
    })

    it('formats attributes with visibility', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'user',
          name: 'User',
          type: 'class',
          attributes: [
            { name: 'id', type: { name: 'string' }, visibility: 'private' },
            { name: 'email', type: { name: 'string' }, visibility: 'public' },
          ],
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('attributes[2]{name,type,visibility}:')
      expect(result).toContain('id,string,private')
      expect(result).toContain('email,string,public')
    })

    it('formats methods with parameters', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'user',
          name: 'User',
          type: 'class',
          methods: [{
            name: 'setEmail',
            parameters: [{ name: 'email', type: { name: 'string' } }],
            returnType: { name: 'void' },
          }],
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('methods[1]{name,params,returnType}:')
      expect(result).toContain('setEmail,email:string,void')
    })

    it('formats functions with export status', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'utils',
          name: 'Utils',
          type: 'module',
          functions: [{
            name: 'validate',
            parameters: [{ name: 'input', type: { name: 'string' } }],
            returnType: { name: 'boolean' },
            isExported: true,
          }],
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('functions[1]{name,params,returnType,exported}:')
      expect(result).toContain('validate,input:string,boolean,true')
    })

    it('formats type definitions', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'types',
          name: 'Types',
          type: 'module',
          types: [{
            name: 'UserId',
            definition: 'string',
            isExported: true,
          }],
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('types[1]{name,definition,exported}:')
      expect(result).toContain('UserId,string,true')
    })
  })

  describe('relationship formatting', () => {
    it('formats relationship with all fields', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [{
          id: 'r1',
          type: 'inheritance',
          sourceId: 'a',
          targetId: 'b',
          label: 'extends',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('relationships[1]{id,type,sourceId,targetId,label}:')
      expect(result).toContain('r1,inheritance,a,b,extends')
    })

    it('handles missing label', () => {
      const diagram = createDiagram({
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [{
          id: 'r1',
          type: 'association',
          sourceId: 'a',
          targetId: 'b',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('r1,association,a,b,')
    })
  })

  describe('value escaping', () => {
    it('escapes values with commas', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'test',
          name: 'Test',
          type: 'class',
          description: 'Has, comma',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('"Has, comma"')
    })

    it('escapes values with quotes', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'test',
          name: 'Test',
          type: 'class',
          description: 'Has "quotes"',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('"Has ""quotes"""')
    })

    it('escapes values with newlines', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'test',
          name: 'Test',
          type: 'class',
          description: 'Has\nnewline',
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('"Has\nnewline"')
    })
  })

  describe('generic types', () => {
    it('formats type with generics', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'list',
          name: 'List',
          type: 'class',
          attributes: [{
            name: 'items',
            type: { name: 'Array', generics: [{ name: 'T' }] },
          }],
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('Array<T>')
    })

    it('formats type with multiple generics', () => {
      const diagram = createDiagram({
        entities: [{
          id: 'map',
          name: 'Map',
          type: 'class',
          attributes: [{
            name: 'data',
            type: { name: 'Map', generics: [{ name: 'string' }, { name: 'number' }] },
          }],
        }],
      })
      const result = formatAsToon(diagram)

      expect(result).toContain('Map<string,number>')
    })
  })
})
