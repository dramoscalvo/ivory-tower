import { describe, it, expect } from 'vitest'
import { DiagramService } from '../../../../src/diagram/application/DiagramService'

const VALID_DIAGRAM_JSON = JSON.stringify({
  title: 'Test System',
  entities: [
    { id: 'user', name: 'User', type: 'class' },
    { id: 'admin', name: 'Admin', type: 'class' },
  ],
  relationships: [
    { id: 'r1', type: 'inheritance', sourceId: 'admin', targetId: 'user' },
  ],
})

describe('DiagramService', () => {
  const service = new DiagramService()

  describe('processDiagram', () => {
    it('returns layout for valid diagram JSON', () => {
      const result = service.processDiagram(VALID_DIAGRAM_JSON)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.layout.entities).toHaveLength(2)
        expect(result.layout.relationships).toHaveLength(1)
        expect(result.layout.bounds).toBeDefined()
      }
    })

    it('returns parse error for invalid JSON', () => {
      const result = service.processDiagram('{ invalid }')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.parseError).toBeTruthy()
        expect(result.validationErrors).toBeUndefined()
      }
    })

    it('returns validation errors for valid JSON with invalid structure', () => {
      const invalidStructure = JSON.stringify({
        title: 'Test',
        entities: [{ name: 'Missing ID', type: 'class' }],
        relationships: [],
      })

      const result = service.processDiagram(invalidStructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.parseError).toBeUndefined()
        expect(result.validationErrors).toBeDefined()
        expect(result.validationErrors!.length).toBeGreaterThan(0)
      }
    })

    it('returns validation errors for relationship referencing non-existent entity', () => {
      const invalidRef = JSON.stringify({
        title: 'Test',
        entities: [{ id: 'a', name: 'A', type: 'class' }],
        relationships: [{ id: 'r1', type: 'inheritance', sourceId: 'a', targetId: 'missing' }],
      })

      const result = service.processDiagram(invalidRef)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.validationErrors).toBeDefined()
        expect(result.validationErrors!.some(e => e.message.includes('not found'))).toBe(true)
      }
    })

    it('calculates entity positions in the layout', () => {
      const result = service.processDiagram(VALID_DIAGRAM_JSON)

      expect(result.success).toBe(true)
      if (result.success) {
        for (const entity of result.layout.entities) {
          expect(entity.position.x).toBeGreaterThan(0)
          expect(entity.position.y).toBeGreaterThan(0)
          expect(entity.size.width).toBeGreaterThan(0)
          expect(entity.size.height).toBeGreaterThan(0)
        }
      }
    })

    it('calculates relationship connection points', () => {
      const result = service.processDiagram(VALID_DIAGRAM_JSON)

      expect(result.success).toBe(true)
      if (result.success) {
        const rel = result.layout.relationships[0]
        expect(rel.source.x).toBeDefined()
        expect(rel.source.y).toBeDefined()
        expect(rel.source.side).toBeDefined()
        expect(rel.target.x).toBeDefined()
        expect(rel.target.y).toBeDefined()
        expect(rel.target.side).toBeDefined()
      }
    })
  })

  describe('getDiagram', () => {
    it('returns parsed diagram for valid JSON', () => {
      const diagram = service.getDiagram(VALID_DIAGRAM_JSON)

      expect(diagram).not.toBeNull()
      expect(diagram!.title).toBe('Test System')
      expect(diagram!.entities).toHaveLength(2)
    })

    it('returns null for invalid JSON', () => {
      const diagram = service.getDiagram('{ invalid }')

      expect(diagram).toBeNull()
    })

    it('returns null for valid JSON with invalid structure', () => {
      const invalidStructure = JSON.stringify({
        title: 'Test',
        entities: [{ name: 'Missing ID', type: 'class' }],
        relationships: [],
      })

      const diagram = service.getDiagram(invalidStructure)

      expect(diagram).toBeNull()
    })
  })
})
