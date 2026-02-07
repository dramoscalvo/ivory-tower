import type { UMLDiagram } from '../../../diagram/domain/models/UMLDiagram';
import type { Entity, Attribute, Method, Function as Fn, TypeDefinition } from '../../../diagram/domain/models/Entity';
import type { Relationship } from '../../../diagram/domain/models/Relationship';
import type { UseCase, Scenario, GherkinStep } from '../../../usecase/domain/models/UseCase';

function escapeValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatTypeRef(type: { name: string; generics?: { name: string }[] }): string {
  if (type.generics && type.generics.length > 0) {
    const generics = type.generics.map(g => g.name).join(',');
    return `${type.name}<${generics}>`;
  }
  return type.name;
}

function formatAttributes(attributes: Attribute[]): string[] {
  const lines: string[] = [];
  lines.push(`    attributes[${attributes.length}]{name,type,visibility}:`);
  for (const attr of attributes) {
    const vis = attr.visibility ?? 'public';
    lines.push(`      ${escapeValue(attr.name)},${escapeValue(formatTypeRef(attr.type))},${vis}`);
  }
  return lines;
}

function formatMethods(methods: Method[]): string[] {
  const lines: string[] = [];
  lines.push(`    methods[${methods.length}]{name,params,returnType}:`);
  for (const method of methods) {
    const params = method.parameters.map(p => `${p.name}:${formatTypeRef(p.type)}`).join(';');
    lines.push(`      ${escapeValue(method.name)},${escapeValue(params)},${escapeValue(formatTypeRef(method.returnType))}`);
  }
  return lines;
}

function formatFunctions(functions: Fn[]): string[] {
  const lines: string[] = [];
  lines.push(`    functions[${functions.length}]{name,params,returnType,exported}:`);
  for (const fn of functions) {
    const params = fn.parameters.map(p => `${p.name}:${formatTypeRef(p.type)}`).join(';');
    const exported = fn.isExported ? 'true' : 'false';
    lines.push(`      ${escapeValue(fn.name)},${escapeValue(params)},${escapeValue(formatTypeRef(fn.returnType))},${exported}`);
  }
  return lines;
}

function formatTypes(types: TypeDefinition[]): string[] {
  const lines: string[] = [];
  lines.push(`    types[${types.length}]{name,definition,exported}:`);
  for (const t of types) {
    const exported = t.isExported ? 'true' : 'false';
    lines.push(`      ${escapeValue(t.name)},${escapeValue(t.definition)},${exported}`);
  }
  return lines;
}

function formatEntity(entity: Entity): string[] {
  const lines: string[] = [];
  const description = entity.description ? escapeValue(entity.description) : '';
  lines.push(`  ${escapeValue(entity.id)},${escapeValue(entity.name)},${entity.type},${description}`);

  if (entity.attributes && entity.attributes.length > 0) {
    lines.push(...formatAttributes(entity.attributes));
  }

  if (entity.methods && entity.methods.length > 0) {
    lines.push(...formatMethods(entity.methods));
  }

  if (entity.functions && entity.functions.length > 0) {
    lines.push(...formatFunctions(entity.functions));
  }

  if (entity.types && entity.types.length > 0) {
    lines.push(...formatTypes(entity.types));
  }

  return lines;
}

function formatRelationship(rel: Relationship): string {
  const label = rel.label ? escapeValue(rel.label) : '';
  return `  ${escapeValue(rel.id)},${rel.type},${escapeValue(rel.sourceId)},${escapeValue(rel.targetId)},${label}`;
}

function formatStep(step: GherkinStep): string {
  return `            ${step.keyword},${escapeValue(step.text)}`;
}

function formatScenario(scenario: Scenario): string[] {
  const lines: string[] = [];
  lines.push(`        ${escapeValue(scenario.name)}`);
  lines.push(`          steps[${scenario.steps.length}]{keyword,text}:`);
  for (const step of scenario.steps) {
    lines.push(formatStep(step));
  }
  return lines;
}

function formatUseCase(useCase: UseCase): string[] {
  const lines: string[] = [];
  const methodRef = useCase.methodRef ? escapeValue(useCase.methodRef) : '';
  const description = useCase.description ? escapeValue(useCase.description) : '';
  lines.push(`  ${escapeValue(useCase.id)},${escapeValue(useCase.name)},${escapeValue(useCase.entityRef)},${methodRef},${description}`);
  lines.push(`    scenarios[${useCase.scenarios.length}]{name}:`);
  for (const scenario of useCase.scenarios) {
    lines.push(...formatScenario(scenario));
  }
  return lines;
}

function formatUseCases(useCases: UseCase[]): string[] {
  const lines: string[] = [];
  lines.push(`useCases[${useCases.length}]{id,name,entityRef,methodRef,description}:`);
  for (const useCase of useCases) {
    lines.push(...formatUseCase(useCase));
  }
  return lines;
}

export function formatAsToon(diagram: UMLDiagram): string {
  const lines: string[] = [];

  lines.push(`title: ${diagram.title}`);
  lines.push('');

  if (diagram.entities.length > 0) {
    lines.push(`entities[${diagram.entities.length}]{id,name,type,description}:`);
    for (const entity of diagram.entities) {
      lines.push(...formatEntity(entity));
    }
    lines.push('');
  }

  if (diagram.relationships.length > 0) {
    lines.push(`relationships[${diagram.relationships.length}]{id,type,sourceId,targetId,label}:`);
    for (const rel of diagram.relationships) {
      lines.push(formatRelationship(rel));
    }
    lines.push('');
  }

  if (diagram.useCases && diagram.useCases.length > 0) {
    lines.push(...formatUseCases(diagram.useCases));
  }

  return lines.join('\n');
}
