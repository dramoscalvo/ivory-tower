import type { UMLDiagram } from '../../../diagram/domain/models/UMLDiagram';
import type {
  Entity,
  Attribute,
  Method,
  Function as Fn,
  TypeDefinition,
} from '../../../diagram/domain/models/Entity';
import type { Relationship } from '../../../diagram/domain/models/Relationship';
import type { Project } from '../../../diagram/domain/models/Project';
import type { Actor } from '../../../diagram/domain/models/Actor';
import type { Endpoint } from '../../../diagram/domain/models/Endpoint';
import type { Rule } from '../../../diagram/domain/models/Rule';
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

function formatProject(project: Project): string[] {
  const lines: string[] = [];
  lines.push(`project{name,description,stack,conventions}:`);
  lines.push(`  ${escapeValue(project.name)},${project.description ? escapeValue(project.description) : ''}`);

  if (project.stack && Object.keys(project.stack).length > 0) {
    const entries = Object.entries(project.stack);
    lines.push(`    stack[${entries.length}]{key,value}:`);
    for (const [key, value] of entries) {
      lines.push(`      ${escapeValue(key)},${escapeValue(value)}`);
    }
  }

  if (project.conventions && Object.keys(project.conventions).length > 0) {
    const entries = Object.entries(project.conventions);
    lines.push(`    conventions[${entries.length}]{key,value}:`);
    for (const [key, value] of entries) {
      lines.push(`      ${escapeValue(key)},${escapeValue(value)}`);
    }
  }

  return lines;
}

function formatActors(actors: Actor[]): string[] {
  const lines: string[] = [];
  lines.push(`actors[${actors.length}]{id,name,description}:`);
  for (const actor of actors) {
    const description = actor.description ? escapeValue(actor.description) : '';
    lines.push(`  ${escapeValue(actor.id)},${escapeValue(actor.name)},${description}`);
  }
  return lines;
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
    lines.push(
      `      ${escapeValue(method.name)},${escapeValue(params)},${escapeValue(formatTypeRef(method.returnType))}`,
    );
  }
  return lines;
}

function formatFunctions(functions: Fn[]): string[] {
  const lines: string[] = [];
  lines.push(`    functions[${functions.length}]{name,params,returnType,exported}:`);
  for (const fn of functions) {
    const params = fn.parameters.map(p => `${p.name}:${formatTypeRef(p.type)}`).join(';');
    const exported = fn.isExported ? 'true' : 'false';
    lines.push(
      `      ${escapeValue(fn.name)},${escapeValue(params)},${escapeValue(formatTypeRef(fn.returnType))},${exported}`,
    );
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

function formatValues(values: string[]): string[] {
  const lines: string[] = [];
  lines.push(`    values[${values.length}]:`);
  for (const value of values) {
    lines.push(`      ${escapeValue(value)}`);
  }
  return lines;
}

function formatEntity(entity: Entity): string[] {
  const lines: string[] = [];
  const description = entity.description ? escapeValue(entity.description) : '';
  lines.push(
    `  ${escapeValue(entity.id)},${escapeValue(entity.name)},${entity.type},${description}`,
  );

  if (entity.values && entity.values.length > 0) {
    lines.push(...formatValues(entity.values));
  }

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
  const srcCard = rel.sourceCardinality ?? '';
  const tgtCard = rel.targetCardinality ?? '';
  return `  ${escapeValue(rel.id)},${rel.type},${escapeValue(rel.sourceId)},${escapeValue(rel.targetId)},${label},${srcCard},${tgtCard}`;
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
  const actorRef = useCase.actorRef ? escapeValue(useCase.actorRef) : '';
  lines.push(
    `  ${escapeValue(useCase.id)},${escapeValue(useCase.name)},${escapeValue(useCase.entityRef)},${methodRef},${description},${actorRef}`,
  );

  if (useCase.preconditions && useCase.preconditions.length > 0) {
    lines.push(`    preconditions[${useCase.preconditions.length}]:`);
    for (const condition of useCase.preconditions) {
      lines.push(`      ${escapeValue(condition)}`);
    }
  }

  if (useCase.postconditions && useCase.postconditions.length > 0) {
    lines.push(`    postconditions[${useCase.postconditions.length}]:`);
    for (const condition of useCase.postconditions) {
      lines.push(`      ${escapeValue(condition)}`);
    }
  }

  lines.push(`    scenarios[${useCase.scenarios.length}]{name}:`);
  for (const scenario of useCase.scenarios) {
    lines.push(...formatScenario(scenario));
  }
  return lines;
}

function formatEndpointBody(body: { entityRef: string; fields?: string[] }): string {
  const fields = body.fields ? body.fields.join(';') : '';
  return `${escapeValue(body.entityRef)},${escapeValue(fields)}`;
}

function formatEndpoint(endpoint: Endpoint): string[] {
  const lines: string[] = [];
  const summary = endpoint.summary ? escapeValue(endpoint.summary) : '';
  const auth = endpoint.auth ?? '';
  const useCaseRef = endpoint.useCaseRef ? escapeValue(endpoint.useCaseRef) : '';
  lines.push(
    `  ${escapeValue(endpoint.id)},${endpoint.method},${escapeValue(endpoint.path)},${summary},${auth},${useCaseRef}`,
  );

  if (endpoint.requestBody) {
    lines.push(`    requestBody{entityRef,fields}:`);
    lines.push(`      ${formatEndpointBody(endpoint.requestBody)}`);
  }

  if (endpoint.response) {
    lines.push(`    response{entityRef,fields}:`);
    lines.push(`      ${formatEndpointBody(endpoint.response)}`);
  }

  return lines;
}

function formatEndpoints(endpoints: Endpoint[]): string[] {
  const lines: string[] = [];
  lines.push(`endpoints[${endpoints.length}]{id,method,path,summary,auth,useCaseRef}:`);
  for (const endpoint of endpoints) {
    lines.push(...formatEndpoint(endpoint));
  }
  return lines;
}

function formatRule(rule: Rule): string {
  const field = rule.field ? escapeValue(rule.field) : '';
  return `  ${escapeValue(rule.id)},${escapeValue(rule.entityRef)},${field},${rule.type},${escapeValue(rule.description)}`;
}

function formatRules(rules: Rule[]): string[] {
  const lines: string[] = [];
  lines.push(`rules[${rules.length}]{id,entityRef,field,type,description}:`);
  for (const rule of rules) {
    lines.push(formatRule(rule));
  }
  return lines;
}

function formatUseCases(useCases: UseCase[]): string[] {
  const lines: string[] = [];
  lines.push(`useCases[${useCases.length}]{id,name,entityRef,methodRef,description,actorRef}:`);
  for (const useCase of useCases) {
    lines.push(...formatUseCase(useCase));
  }
  return lines;
}

const TOON_HEADER = [
  '# TOON — Terse Object-Oriented Notation',
  '# Format: section[count]{fields}: followed by indented CSV rows',
  '# Nested sections use deeper indentation',
  '# Commas/quotes in values are escaped with CSV rules (double-quote wrapping)',
  '',
].join('\n');

export function formatAsToon(diagram: UMLDiagram): string {
  const lines: string[] = [];

  lines.push(TOON_HEADER);
  lines.push(`title: ${diagram.title}`);
  lines.push('');

  if (diagram.project) {
    lines.push(...formatProject(diagram.project));
    lines.push('');
  }

  if (diagram.actors && diagram.actors.length > 0) {
    lines.push(...formatActors(diagram.actors));
    lines.push('');
  }

  if (diagram.entities.length > 0) {
    lines.push(`entities[${diagram.entities.length}]{id,name,type,description}:`);
    for (const entity of diagram.entities) {
      lines.push(...formatEntity(entity));
    }
    lines.push('');
  }

  if (diagram.relationships.length > 0) {
    lines.push(`relationships[${diagram.relationships.length}]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}:`);
    for (const rel of diagram.relationships) {
      lines.push(formatRelationship(rel));
    }
    lines.push('');
  }

  if (diagram.endpoints && diagram.endpoints.length > 0) {
    lines.push(...formatEndpoints(diagram.endpoints));
    lines.push('');
  }

  if (diagram.rules && diagram.rules.length > 0) {
    lines.push(...formatRules(diagram.rules));
    lines.push('');
  }

  if (diagram.useCases && diagram.useCases.length > 0) {
    lines.push(...formatUseCases(diagram.useCases));
  }

  return lines.join('\n');
}
