import { describe, it, expect } from 'vitest';
import { detectFormat } from '../../../../src/diagram/infrastructure/formatDetector';

describe('detectFormat', () => {
  it('input starting with { → json', () => {
    expect(detectFormat('{"title": "test"}')).toBe('json');
  });

  it('input starting with [ → json', () => {
    expect(detectFormat('[{"id": "a"}]')).toBe('json');
  });

  it('input containing classDiagram → mermaid', () => {
    expect(detectFormat('classDiagram\nclass User')).toBe('mermaid');
  });

  it('input containing @startuml → plantuml', () => {
    expect(detectFormat('@startuml\nclass User\n@enduml')).toBe('plantuml');
  });

  it('empty/whitespace input → unknown', () => {
    expect(detectFormat('')).toBe('unknown');
    expect(detectFormat('   ')).toBe('unknown');
  });

  it('random text → unknown', () => {
    expect(detectFormat('hello world')).toBe('unknown');
  });

  it('input starting with # TOON → toon', () => {
    expect(detectFormat('# TOON\ntitle: My App')).toBe('toon');
  });

  it('input with title: line → toon', () => {
    expect(detectFormat('title: My Diagram\nentities[')).toBe('toon');
  });

  it('title: must be at start of line → toon', () => {
    expect(detectFormat('some preamble\ntitle: Test')).toBe('toon');
  });
});
