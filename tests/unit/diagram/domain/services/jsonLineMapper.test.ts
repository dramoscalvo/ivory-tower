import { describe, it, expect } from 'vitest';
import { findEntityLine } from '../../../../../src/diagram/domain/services/jsonLineMapper';

const PRETTIFIED_JSON = `{
  "title": "Test",
  "entities": [
    {
      "id": "user",
      "name": "User",
      "type": "class"
    },
    {
      "id": "admin",
      "name": "Admin",
      "type": "class"
    }
  ],
  "relationships": []
}`;

describe('findEntityLine', () => {
  it('finds "id": "user" in prettified JSON', () => {
    const line = findEntityLine(PRETTIFIED_JSON, 'user');
    expect(line).toBe(5);
  });

  it('finds entity in compact JSON', () => {
    const compact = '{"entities":[{"id":"user","name":"User","type":"class"}]}';
    const line = findEntityLine(compact, 'user');
    expect(line).toBe(1);
  });

  it('returns null for non-existent entity ID', () => {
    const line = findEntityLine(PRETTIFIED_JSON, 'nonexistent');
    expect(line).toBeNull();
  });

  it('handles entity IDs with special regex characters', () => {
    const json = '{\n  "id": "my.entity"\n}';
    const line = findEntityLine(json, 'my.entity');
    expect(line).toBe(2);
  });

  it('finds correct entity when multiple entities exist', () => {
    const line = findEntityLine(PRETTIFIED_JSON, 'admin');
    expect(line).toBe(10);
  });

  it('works with different whitespace around colon', () => {
    const json = '{\n  "id" : "spaced"\n}';
    const line = findEntityLine(json, 'spaced');
    expect(line).toBe(2);
  });
});
