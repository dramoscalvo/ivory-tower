import { describe, it, expect } from 'vitest';
import { parseMermaidClassDiagram } from '../../../../src/diagram/infrastructure/MermaidParser';

describe('parseMermaidClassDiagram', () => {
  it('parses single class with attributes and methods', () => {
    const input = `classDiagram
class User {
  +name : String
  +getName() String
}`;
    const diagram = parseMermaidClassDiagram(input);

    expect(diagram.entities).toHaveLength(1);
    expect(diagram.entities[0].name).toBe('User');
    expect(diagram.entities[0].attributes).toHaveLength(1);
    expect(diagram.entities[0].methods).toHaveLength(1);
  });

  it('maps +/-/# to public/private/protected visibility', () => {
    const input = `classDiagram
class User {
  +publicAttr : String
  -privateAttr : String
  #protectedAttr : String
}`;
    const diagram = parseMermaidClassDiagram(input);
    const attrs = diagram.entities[0].attributes!;

    expect(attrs[0].visibility).toBe('public');
    expect(attrs[1].visibility).toBe('private');
    expect(attrs[2].visibility).toBe('protected');
  });

  it('parses <<interface>> annotation', () => {
    const input = `classDiagram
class IAuth {
  <<interface>>
  +authenticate() boolean
}`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.entities[0].type).toBe('interface');
  });

  it('parses <<abstract>> annotation', () => {
    const input = `classDiagram
class Shape {
  <<abstract>>
  +draw() void
}`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.entities[0].type).toBe('abstract-class');
  });

  it('parses A <|-- B → inheritance (B inherits A)', () => {
    const input = `classDiagram
class A
class B
A <|-- B`;
    const diagram = parseMermaidClassDiagram(input);

    expect(diagram.relationships).toHaveLength(1);
    expect(diagram.relationships[0].type).toBe('inheritance');
    // B is the child (sourceId), A is the parent (targetId)
    const bEntity = diagram.entities.find(e => e.name === 'B')!;
    const aEntity = diagram.entities.find(e => e.name === 'A')!;
    expect(diagram.relationships[0].sourceId).toBe(bEntity.id);
    expect(diagram.relationships[0].targetId).toBe(aEntity.id);
  });

  it('parses A <|.. B → implementation', () => {
    const input = `classDiagram
class A
class B
A <|.. B`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.relationships[0].type).toBe('implementation');
  });

  it('parses A *-- B → composition', () => {
    const input = `classDiagram
class A
class B
A *-- B`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.relationships[0].type).toBe('composition');
  });

  it('parses A o-- B → aggregation', () => {
    const input = `classDiagram
class A
class B
A o-- B`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.relationships[0].type).toBe('aggregation');
  });

  it('parses A --> B → dependency', () => {
    const input = `classDiagram
class A
class B
A --> B`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.relationships[0].type).toBe('dependency');
  });

  it('parses A -- B : label → association with label', () => {
    const input = `classDiagram
class A
class B
A -- B : uses`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.relationships[0].type).toBe('association');
    expect(diagram.relationships[0].label).toBe('uses');
  });

  it('generates unique entity IDs from class names', () => {
    const input = `classDiagram
class MyClass
class OtherClass`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.entities[0].id).toBe('myclass');
    expect(diagram.entities[1].id).toBe('otherclass');
  });

  it('handles empty class (no members)', () => {
    const input = `classDiagram
class Empty`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.entities).toHaveLength(1);
    expect(diagram.entities[0].name).toBe('Empty');
  });

  it('returns diagram with title "Imported Diagram"', () => {
    const input = `classDiagram
class A`;
    const diagram = parseMermaidClassDiagram(input);
    expect(diagram.title).toBe('Imported Diagram');
  });

  it('produces valid UMLDiagram structure', () => {
    const input = `classDiagram
class User {
  +name : String
}
class Admin
Admin <|-- User`;
    const diagram = parseMermaidClassDiagram(input);

    expect(diagram).toHaveProperty('title');
    expect(diagram).toHaveProperty('entities');
    expect(diagram).toHaveProperty('relationships');
    expect(Array.isArray(diagram.entities)).toBe(true);
    expect(Array.isArray(diagram.relationships)).toBe(true);
  });
});
