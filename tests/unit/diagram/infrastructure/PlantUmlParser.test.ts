import { describe, it, expect } from 'vitest'
import { parsePlantUmlClassDiagram } from '../../../../src/diagram/infrastructure/PlantUmlParser'

describe('parsePlantUmlClassDiagram', () => {
  it('parses class with members', () => {
    const input = `@startuml
class User {
  +name : String
  +getName() : String
}
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)

    expect(diagram.entities).toHaveLength(1)
    expect(diagram.entities[0].name).toBe('User')
    expect(diagram.entities[0].attributes).toHaveLength(1)
    expect(diagram.entities[0].methods).toHaveLength(1)
  })

  it('parses interface keyword → entity type interface', () => {
    const input = `@startuml
interface IAuth {
  +authenticate() : boolean
}
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)
    expect(diagram.entities[0].type).toBe('interface')
  })

  it('parses abstract class keyword → entity type abstract-class', () => {
    const input = `@startuml
abstract class Shape {
  +draw() : void
}
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)
    expect(diagram.entities[0].type).toBe('abstract-class')
  })

  it('parses title keyword → sets diagram title', () => {
    const input = `@startuml
title My System
class A
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)
    expect(diagram.title).toBe('My System')
  })

  it('parses inheritance relationship arrows', () => {
    const input = `@startuml
class A
class B
A <|-- B
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)
    expect(diagram.relationships[0].type).toBe('inheritance')
  })

  it('ignores content outside @startuml/@enduml', () => {
    const input = `some random text
@startuml
class A
@enduml
more random text`
    const diagram = parsePlantUmlClassDiagram(input)
    expect(diagram.entities).toHaveLength(1)
    expect(diagram.entities[0].name).toBe('A')
  })

  it('handles classes declared without body', () => {
    const input = `@startuml
class Foo
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)
    expect(diagram.entities).toHaveLength(1)
    expect(diagram.entities[0].name).toBe('Foo')
  })

  it('maps member visibility prefixes correctly', () => {
    const input = `@startuml
class User {
  +publicAttr : String
  -privateAttr : String
  #protectedAttr : String
}
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)
    const attrs = diagram.entities[0].attributes!

    expect(attrs[0].visibility).toBe('public')
    expect(attrs[1].visibility).toBe('private')
    expect(attrs[2].visibility).toBe('protected')
  })

  it('produces valid UMLDiagram structure', () => {
    const input = `@startuml
class A
class B
A <|-- B
@enduml`
    const diagram = parsePlantUmlClassDiagram(input)

    expect(diagram).toHaveProperty('title')
    expect(diagram).toHaveProperty('entities')
    expect(diagram).toHaveProperty('relationships')
    expect(Array.isArray(diagram.entities)).toBe(true)
    expect(Array.isArray(diagram.relationships)).toBe(true)
  })
})
