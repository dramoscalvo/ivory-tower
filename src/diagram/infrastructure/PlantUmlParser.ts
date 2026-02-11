import type { UMLDiagram } from '../domain/models/UMLDiagram';
import type { Entity, Visibility, Attribute, Method } from '../domain/models/Entity';
import type { Relationship, RelationshipType } from '../domain/models/Relationship';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseVisibility(prefix: string): Visibility | undefined {
  switch (prefix) {
    case '+':
      return 'public';
    case '-':
      return 'private';
    case '#':
      return 'protected';
    default:
      return undefined;
  }
}

function parseRelationshipArrow(arrow: string): RelationshipType | null {
  const trimmed = arrow.trim();
  if (trimmed.includes('<|--')) return 'inheritance';
  if (trimmed.includes('<|..')) return 'implementation';
  if (trimmed.includes('*--')) return 'composition';
  if (trimmed.includes('o--')) return 'aggregation';
  if (trimmed.includes('-->')) return 'dependency';
  if (trimmed.includes('..>')) return 'dependency';
  if (trimmed.includes('--')) return 'association';
  return null;
}

export function parsePlantUmlClassDiagram(input: string): UMLDiagram {
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const entityMap = new Map<string, Entity>();
  let title = 'Imported Diagram';
  let relCounter = 0;

  // Extract content between @startuml and @enduml
  const startMatch = input.indexOf('@startuml');
  const endMatch = input.indexOf('@enduml');
  const content =
    startMatch !== -1 ? input.substring(startMatch, endMatch !== -1 ? endMatch : undefined) : input;

  const lines = content.split('\n').map(l => l.trim());
  let currentEntity: Entity | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line || line === '@startuml' || line === '@enduml') continue;

    // Title
    const titleMatch = line.match(/^title\s+(.+)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    // End of class block
    if (line === '}' && currentEntity) {
      entities.push(currentEntity);
      entityMap.set(currentEntity.name, currentEntity);
      currentEntity = null;
      continue;
    }

    // Interface: "interface Name {"
    const ifaceMatch = line.match(/^interface\s+(\w+)\s*\{?\s*$/);
    if (ifaceMatch) {
      const name = ifaceMatch[1];
      currentEntity = {
        id: slugify(name),
        name,
        type: 'interface',
        attributes: [],
        methods: [],
      };
      if (!line.includes('{')) {
        entities.push(currentEntity);
        entityMap.set(currentEntity.name, currentEntity);
        currentEntity = null;
      }
      continue;
    }

    // Abstract class: "abstract class Name {"
    const abstractMatch = line.match(/^abstract\s+class\s+(\w+)\s*\{?\s*$/);
    if (abstractMatch) {
      const name = abstractMatch[1];
      currentEntity = {
        id: slugify(name),
        name,
        type: 'abstract-class',
        attributes: [],
        methods: [],
      };
      if (!line.includes('{')) {
        entities.push(currentEntity);
        entityMap.set(currentEntity.name, currentEntity);
        currentEntity = null;
      }
      continue;
    }

    // Regular class: "class Name {"
    const classMatch = line.match(/^class\s+(\w+)\s*\{?\s*$/);
    if (classMatch) {
      const name = classMatch[1];
      currentEntity = {
        id: slugify(name),
        name,
        type: 'class',
        attributes: [],
        methods: [],
      };
      if (!line.includes('{')) {
        entities.push(currentEntity);
        entityMap.set(currentEntity.name, currentEntity);
        currentEntity = null;
      }
      continue;
    }

    // Inside a class block
    if (currentEntity) {
      // Method: [+/-/#]name(params) : returnType
      const methodMatch = line.match(/^([+\-#])?\s*(\w+)\s*\(([^)]*)\)\s*(?::\s*(.*))?$/);
      if (methodMatch) {
        const [, vis, name, params, ret] = methodMatch;
        const method: Method = {
          name,
          parameters: params
            ? params
                .split(',')
                .map(p => {
                  const parts = p.trim().split(/\s*:\s*/);
                  return { name: parts[0] || 'arg', type: { name: parts[1] || 'void' } };
                })
                .filter(p => p.name)
            : [],
          returnType: { name: ret?.trim() || 'void' },
          visibility: parseVisibility(vis),
        };
        if (!currentEntity.methods) currentEntity.methods = [];
        currentEntity.methods.push(method);
        continue;
      }

      // Attribute: [+/-/#]name : type
      const attrMatch = line.match(/^([+\-#])?\s*(\w+)\s*:\s*(.+)$/);
      if (attrMatch) {
        const [, vis, name, type] = attrMatch;
        const attr: Attribute = {
          name,
          type: { name: type.trim() },
          visibility: parseVisibility(vis),
        };
        if (!currentEntity.attributes) currentEntity.attributes = [];
        currentEntity.attributes.push(attr);
        continue;
      }
    }

    // Relationship: A <|-- B
    const relMatch = line.match(/^(\w+)\s+([\w<|.*o>-]+)\s+(\w+)\s*(?::\s*(.+))?$/);
    if (relMatch) {
      const [, source, arrow, target, label] = relMatch;
      const relType = parseRelationshipArrow(arrow);
      if (relType) {
        for (const name of [source, target]) {
          if (!entityMap.has(name)) {
            const entity: Entity = {
              id: slugify(name),
              name,
              type: 'class',
            };
            entities.push(entity);
            entityMap.set(name, entity);
          }
        }

        relCounter++;
        const sourceEntity = entityMap.get(source)!;
        const targetEntity = entityMap.get(target)!;

        let rel: Relationship;
        if (relType === 'inheritance' || relType === 'implementation') {
          rel = {
            id: `r${relCounter}`,
            type: relType,
            sourceId: targetEntity.id,
            targetId: sourceEntity.id,
            label: label?.trim(),
          };
        } else {
          rel = {
            id: `r${relCounter}`,
            type: relType,
            sourceId: sourceEntity.id,
            targetId: targetEntity.id,
            label: label?.trim(),
          };
        }
        relationships.push(rel);
      }
    }
  }

  if (currentEntity) {
    entities.push(currentEntity);
  }

  return { title, entities, relationships };
}
