import { describe, it, expect } from 'vitest'
import { parseJson } from '../../../../src/diagram/infrastructure/JsonParser'

describe('parseJson', () => {
  describe('success cases', () => {
    it('parses valid JSON and returns diagram', () => {
      const json = JSON.stringify({
        title: 'Test',
        entities: [],
        relationships: [],
      })

      const result = parseJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.diagram.title).toBe('Test')
      }
    })

    it('preserves all diagram properties', () => {
      const diagram = {
        title: 'Complex Diagram',
        entities: [
          { id: 'user', name: 'User', type: 'class' },
        ],
        relationships: [
          { id: 'r1', type: 'inheritance', sourceId: 'user', targetId: 'user' },
        ],
      }
      const json = JSON.stringify(diagram)

      const result = parseJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.diagram.entities).toHaveLength(1)
        expect(result.diagram.relationships).toHaveLength(1)
      }
    })
  })

  describe('error cases', () => {
    it('returns error for empty string', () => {
      const result = parseJson('')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Empty input')
      }
    })

    it('returns error for whitespace-only string', () => {
      const result = parseJson('   \n\t  ')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Empty input')
      }
    })

    it('returns error for invalid JSON syntax', () => {
      const result = parseJson('{ invalid json }')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error for unclosed brackets', () => {
      const result = parseJson('{ "title": "test"')

      expect(result.success).toBe(false)
    })

    it('returns error for trailing comma', () => {
      const result = parseJson('{ "title": "test", }')

      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles JSON with unicode characters', () => {
      const json = JSON.stringify({
        title: 'Test with émojis 🎉',
        entities: [],
        relationships: [],
      })

      const result = parseJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.diagram.title).toContain('🎉')
      }
    })

    it('handles deeply nested JSON', () => {
      const json = JSON.stringify({
        title: 'Nested',
        entities: [{
          id: 'a',
          name: 'A',
          type: 'class',
          attributes: [{
            name: 'field',
            type: {
              name: 'Map',
              generics: [{ name: 'string' }, { name: 'List', generics: [{ name: 'number' }] }],
            },
          }],
        }],
        relationships: [],
      })

      const result = parseJson(json)

      expect(result.success).toBe(true)
    })
  })
})
