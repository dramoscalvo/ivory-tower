import { describe, it, expect } from 'vitest'
import { validateDiagram } from '../../../../../src/diagram/domain/services/DiagramValidator'

describe('validateDiagram', () => {
  describe('diagram structure', () => {
    it('returns error when diagram is not an object', () => {
      const errors = validateDiagram(null)
      expect(errors).toContainEqual(
        expect.objectContaining({ message: 'Diagram must be an object' })
      )
    })

    it('returns error when title is missing', () => {
      const errors = validateDiagram({ entities: [], relationships: [] })
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'title', message: 'Diagram must have a string title' })
      )
    })

    it('returns error when entities array is missing', () => {
      const errors = validateDiagram({ title: 'Test', relationships: [] })
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities', message: 'Diagram must have an entities array' })
      )
    })

    it('returns error when relationships array is missing', () => {
      const errors = validateDiagram({ title: 'Test', entities: [] })
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'relationships', message: 'Diagram must have a relationships array' })
      )
    })

    it('returns no errors for valid empty diagram', () => {
      const errors = validateDiagram({ title: 'Test', entities: [], relationships: [] })
      expect(errors).toHaveLength(0)
    })
  })

  describe('entity validation', () => {
    it('returns error when entity has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [{ name: 'Foo', type: 'class' }],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].id' })
      )
    })

    it('returns error when entity has no name', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'foo', type: 'class' }],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].name' })
      )
    })

    it('returns error when entity has invalid type', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'foo', name: 'Foo', type: 'invalid' }],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].type' })
      )
    })

    it('accepts all valid entity types', () => {
      const validTypes = ['class', 'interface', 'module', 'type', 'abstract-class']
      for (const type of validTypes) {
        const diagram = {
          title: 'Test',
          entities: [{ id: 'foo', name: 'Foo', type }],
          relationships: [],
        }
        const errors = validateDiagram(diagram)
        const typeErrors = errors.filter(e => e.path === 'entities[0].type')
        expect(typeErrors).toHaveLength(0)
      }
    })

    it('validates attributes have name and type', () => {
      const diagram = {
        title: 'Test',
        entities: [{
          id: 'foo',
          name: 'Foo',
          type: 'class',
          attributes: [{ visibility: 'public' }],
        }],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].attributes[0].name' })
      )
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].attributes[0].type' })
      )
    })

    it('validates methods have required fields', () => {
      const diagram = {
        title: 'Test',
        entities: [{
          id: 'foo',
          name: 'Foo',
          type: 'class',
          methods: [{}],
        }],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].methods[0].name' })
      )
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].methods[0].parameters' })
      )
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'entities[0].methods[0].returnType' })
      )
    })

    it('returns no errors for valid entity with all fields', () => {
      const diagram = {
        title: 'Test',
        entities: [{
          id: 'user',
          name: 'User',
          type: 'class',
          attributes: [{ name: 'id', type: { name: 'string' }, visibility: 'private' }],
          methods: [{
            name: 'getName',
            parameters: [],
            returnType: { name: 'string' },
          }],
        }],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toHaveLength(0)
    })
  })

  describe('duplicate detection', () => {
    it('detects duplicate entity ids', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'foo', name: 'Foo', type: 'class' },
          { id: 'foo', name: 'Bar', type: 'class' },
        ],
        relationships: [],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'entities',
          message: expect.stringContaining('Duplicate entity ids'),
        })
      )
    })
  })

  describe('relationship validation', () => {
    it('returns error when relationship has no id', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [{ type: 'inheritance', sourceId: 'a', targetId: 'b' }],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'relationships[0].id' })
      )
    })

    it('returns error when relationship has invalid type', () => {
      const diagram = {
        title: 'Test',
        entities: [
          { id: 'a', name: 'A', type: 'class' },
          { id: 'b', name: 'B', type: 'class' },
        ],
        relationships: [{ id: 'r1', type: 'invalid', sourceId: 'a', targetId: 'b' }],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'relationships[0].type' })
      )
    })

    it('accepts all valid relationship types', () => {
      const validTypes = ['inheritance', 'implementation', 'composition', 'aggregation', 'dependency', 'association']
      for (const type of validTypes) {
        const diagram = {
          title: 'Test',
          entities: [
            { id: 'a', name: 'A', type: 'class' },
            { id: 'b', name: 'B', type: 'class' },
          ],
          relationships: [{ id: 'r1', type, sourceId: 'a', targetId: 'b' }],
        }
        const errors = validateDiagram(diagram)
        const typeErrors = errors.filter(e => e.path === 'relationships[0].type')
        expect(typeErrors).toHaveLength(0)
      }
    })

    it('returns error when sourceId references non-existent entity', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'missing', targetId: 'a' }],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'relationships[0].sourceId',
          message: expect.stringContaining('not found'),
        })
      )
    })

    it('returns error when targetId references non-existent entity', () => {
      const diagram = {
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'missing' }],
      }
      const errors = validateDiagram(diagram)
      expect(errors).toContainEqual(
        expect.objectContaining({
          path: 'relationships[0].targetId',
          message: expect.stringContaining('not found'),
        })
      )
    })
  })
})
