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
  // Normalize whitespace
  const trimmed = arrow.trim();
  if (trimmed.includes('<|--')) return 'inheritance';
  if (trimmed.includes('<|..')) return 'implementation';
  if (trimmed.includes('*--')) return 'composition';
  if (trimmed.includes('o--')) return 'aggregation';
  if (trimmed.includes('-->')) return 'dependency';
  if (trimmed.includes('--')) return 'association';
  return null;
}

export function parseMermaidClassDiagram(input: string): UMLDiagram {
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const entityMap = new Map<string, Entity>();
  const lines = input.split('\n').map(l => l.trim());

  let currentEntity: Entity | null = null;
  let relCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and classDiagram keyword
    if (!line || line === 'classDiagram') continue;

    // End of class block
    if (line === '}' && currentEntity) {
      entities.push(currentEntity);
      entityMap.set(currentEntity.name, currentEntity);
      currentEntity = null;
      continue;
    }

    // Class block start: "class Name {"
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
        // Single-line class declaration without body
        entities.push(currentEntity);
        entityMap.set(currentEntity.name, currentEntity);
        currentEntity = null;
      }
      continue;
    }

    // Inside a class block
    if (currentEntity) {
      // Annotation: <<interface>>, <<abstract>>
      const annotationMatch = line.match(/^<<(\w+)>>$/);
      if (annotationMatch) {
        const annotation = annotationMatch[1].toLowerCase();
        if (annotation === 'interface') currentEntity.type = 'interface';
        else if (annotation === 'abstract') currentEntity.type = 'abstract-class';
        continue;
      }

      // Method: [+/-/#]name(params) returnType
      const methodMatch = line.match(/^([+\-#])?\s*(\w+)\s*\(([^)]*)\)\s*:?\s*(.*)$/);
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

    // Relationship: A <|-- B, A --> B : label
    const relMatch = line.match(/^(\w+)\s+([\w<|.*o>-]+)\s+(\w+)\s*(?::\s*(.+))?$/);
    if (relMatch) {
      const [, source, arrow, target, label] = relMatch;
      const relType = parseRelationshipArrow(arrow);
      if (relType) {
        // Ensure both entities exist
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

        // For <|-- and <|.., the arrow points from target to source
        // (target inherits from / implements source)
        // But in Mermaid, "A <|-- B" means B inherits A (A is parent)
        // In our model, sourceId is the child, targetId is the parent
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

  // Handle unclosed entity
  if (currentEntity) {
    entities.push(currentEntity);
  }

  return {
    title: 'Imported Diagram',
    entities,
    relationships,
  };
}
