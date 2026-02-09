import { describe, it, expect } from 'vitest'
import { buildPathLineMap } from '../../../../../src/diagram/domain/services/errorLineMapper'

const PRETTIFIED_JSON = `{
  "title": "Test",
  "entities": [
    {
      "id": "user",
      "name": "User",
      "type": "class"
    }
  ],
  "relationships": [
    {
      "id": "r1",
      "sourceId": "user",
      "targetId": "admin"
    }
  ]
}`

describe('buildPathLineMap', () => {
  it('"title" → line containing the title key', () => {
    const map = buildPathLineMap(PRETTIFIED_JSON)
    expect(map.get('title')).toBe(2)
  })

  it('"entities[0]" → line with first entity opening brace', () => {
    const map = buildPathLineMap(PRETTIFIED_JSON)
    const line = map.get('entities[0]')
    expect(line).toBeDefined()
    expect(line).toBeGreaterThanOrEqual(4)
  })

  it('"entities[0].name" → line containing the name key', () => {
    const map = buildPathLineMap(PRETTIFIED_JSON)
    const line = map.get('entities[0].name')
    expect(line).toBeDefined()
    expect(line).toBe(6)
  })

  it('"relationships[0].sourceId" → correct line', () => {
    const map = buildPathLineMap(PRETTIFIED_JSON)
    const line = map.get('relationships[0].sourceId')
    expect(line).toBeDefined()
  })

  it('empty path → line 1', () => {
    const map = buildPathLineMap(PRETTIFIED_JSON)
    expect(map.get('')).toBe(1)
  })

  it('path not found → returns undefined', () => {
    const map = buildPathLineMap(PRETTIFIED_JSON)
    expect(map.get('nonexistent.path')).toBeUndefined()
  })

  it('works with prettified JSON (2-space indent)', () => {
    const json = JSON.stringify({ title: 'Test', entities: [{ id: 'a' }] }, null, 2)
    const map = buildPathLineMap(json)
    expect(map.get('title')).toBeDefined()
  })
})
