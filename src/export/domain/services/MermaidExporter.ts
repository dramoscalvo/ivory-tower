import type { UMLDiagram } from '../../../diagram/domain/models/UMLDiagram';
import type { Entity } from '../../../diagram/domain/models/Entity';

function formatVisibility(visibility?: string): string {
  switch (visibility) {
    case 'private':
      return '-';
    case 'protected':
      return '#';
    default:
      return '+';
  }
}

function formatTypeRef(type: { name: string; generics?: { name: string }[] }): string {
  if (type.generics && type.generics.length > 0) {
    return `${type.name}~${type.generics.map(g => g.name).join(',')}~`;
  }
  return type.name;
}

function formatEntity(entity: Entity): string[] {
  const lines: string[] = [];

  // Class declaration with annotation for non-class types
  if (entity.type === 'interface') {
    lines.push(`  class ${entity.name} {`);
    lines.push(`    <<interface>>`);
  } else if (entity.type === 'abstract-class') {
    lines.push(`  class ${entity.name} {`);
    lines.push(`    <<abstract>>`);
  } else if (entity.type === 'enum') {
    lines.push(`  class ${entity.name} {`);
    lines.push(`    <<enumeration>>`);
  } else if (entity.type === 'module') {
    lines.push(`  class ${entity.name} {`);
    lines.push(`    <<module>>`);
  } else if (entity.type === 'type') {
    lines.push(`  class ${entity.name} {`);
    lines.push(`    <<type>>`);
  } else {
    lines.push(`  class ${entity.name} {`);
  }

  // Values (enum)
  if (entity.values) {
    for (const value of entity.values) {
      lines.push(`    ${value}`);
    }
  }

  // Attributes
  if (entity.attributes) {
    for (const attr of entity.attributes) {
      const vis = formatVisibility(attr.visibility);
      lines.push(`    ${vis}${formatTypeRef(attr.type)} ${attr.name}`);
    }
  }

  // Methods
  if (entity.methods) {
    for (const method of entity.methods) {
      const vis = formatVisibility();
      const params = method.parameters.map(p => `${formatTypeRef(p.type)} ${p.name}`).join(', ');
      lines.push(`    ${vis}${method.name}(${params}) ${formatTypeRef(method.returnType)}`);
    }
  }

  // Functions (module)
  if (entity.functions) {
    for (const fn of entity.functions) {
      const vis = fn.isExported ? '+' : '-';
      const params = fn.parameters.map(p => `${formatTypeRef(p.type)} ${p.name}`).join(', ');
      lines.push(`    ${vis}${fn.name}(${params}) ${formatTypeRef(fn.returnType)}`);
    }
  }

  lines.push('  }');
  return lines;
}

export function formatAsMermaid(diagram: UMLDiagram): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`title: ${diagram.title}`);
  lines.push('---');
  lines.push('classDiagram');

  // Entity ID → name mapping for relationship references
  const idToName = new Map<string, string>();
  for (const entity of diagram.entities) {
    idToName.set(entity.id, entity.name);
  }

  // Entities
  for (const entity of diagram.entities) {
    lines.push(...formatEntity(entity));
  }

  // Relationships (using entity names, not ids — Mermaid uses class names)
  for (const rel of diagram.relationships) {
    const sourceName = idToName.get(rel.sourceId) ?? rel.sourceId;
    const targetName = idToName.get(rel.targetId) ?? rel.targetId;

    const srcCard = rel.sourceCardinality ? `"${rel.sourceCardinality}" ` : '';
    const tgtCard = rel.targetCardinality ? ` "${rel.targetCardinality}"` : '';

    let arrow: string;
    switch (rel.type) {
      case 'inheritance':
        arrow = '--|>';
        break;
      case 'implementation':
        arrow = '..|>';
        break;
      case 'composition':
        arrow = '*--';
        break;
      case 'aggregation':
        arrow = 'o--';
        break;
      case 'dependency':
        arrow = '..>';
        break;
      case 'association':
      default:
        arrow = '-->';
        break;
    }

    const label = rel.label ? ` : ${rel.label}` : '';
    lines.push(`  ${sourceName} ${srcCard}${arrow}${tgtCard} ${targetName}${label}`);
  }

  return lines.join('\n');
}
