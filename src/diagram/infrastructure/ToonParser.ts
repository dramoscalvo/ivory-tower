import type { UMLDiagram } from '../domain/models/UMLDiagram';
import type {
  Entity,
  EntityType,
  Attribute,
  Method,
  Function as Fn,
  TypeDefinition,
  Visibility,
} from '../domain/models/Entity';
import type { Relationship, RelationshipType, Cardinality } from '../domain/models/Relationship';
import type { Project } from '../domain/models/Project';
import type { Actor } from '../domain/models/Actor';
import type { Endpoint, HttpMethod, AuthType, EndpointBody } from '../domain/models/Endpoint';
import type { Rule, RuleType } from '../domain/models/Rule';
import type { UseCase, Scenario, GherkinKeyword } from '../../usecase/domain/models/UseCase';

function parseCSVValues(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else if (char === '"') {
        inQuotes = false;
        i++;
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        values.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }
  values.push(current);
  return values;
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function parseTypeRef(typeStr: string): { name: string; generics?: { name: string }[] } {
  const genericMatch = typeStr.match(/^(\w+)<(.+)>$/);
  if (genericMatch) {
    const generics = genericMatch[2].split(',').map(g => ({ name: g.trim() }));
    return { name: genericMatch[1], generics };
  }
  return { name: typeStr };
}

function parseAttributes(lines: string[], startIdx: number): { attributes: Attribute[]; nextIdx: number } {
  const attributes: Attribute[] = [];
  let i = startIdx;

  while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
    const values = parseCSVValues(lines[i].trim());
    if (values.length >= 2) {
      const vis = (values[2] ?? 'public') as Visibility;
      attributes.push({
        name: values[0],
        type: parseTypeRef(values[1]),
        ...(vis !== 'public' ? { visibility: vis } : { visibility: vis }),
      });
    }
    i++;
  }

  return { attributes, nextIdx: i };
}

function parseMethods(lines: string[], startIdx: number): { methods: Method[]; nextIdx: number } {
  const methods: Method[] = [];
  let i = startIdx;

  while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
    const values = parseCSVValues(lines[i].trim());
    if (values.length >= 3) {
      const params = values[1]
        ? values[1].split(';').map(p => {
            const [name, type] = p.split(':');
            return { name: name?.trim() ?? '', type: parseTypeRef(type?.trim() ?? 'unknown') };
          })
        : [];
      methods.push({
        name: values[0],
        parameters: params,
        returnType: parseTypeRef(values[2]),
      });
    }
    i++;
  }

  return { methods, nextIdx: i };
}

function parseFunctions(lines: string[], startIdx: number): { functions: Fn[]; nextIdx: number } {
  const functions: Fn[] = [];
  let i = startIdx;

  while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
    const values = parseCSVValues(lines[i].trim());
    if (values.length >= 3) {
      const params = values[1]
        ? values[1].split(';').map(p => {
            const [name, type] = p.split(':');
            return { name: name?.trim() ?? '', type: parseTypeRef(type?.trim() ?? 'unknown') };
          })
        : [];
      functions.push({
        name: values[0],
        parameters: params,
        returnType: parseTypeRef(values[2]),
        isExported: values[3] === 'true',
      });
    }
    i++;
  }

  return { functions, nextIdx: i };
}

function parseTypes(lines: string[], startIdx: number): { types: TypeDefinition[]; nextIdx: number } {
  const types: TypeDefinition[] = [];
  let i = startIdx;

  while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
    const values = parseCSVValues(lines[i].trim());
    if (values.length >= 2) {
      types.push({
        name: values[0],
        definition: values[1],
        isExported: values[2] === 'true',
      });
    }
    i++;
  }

  return { types, nextIdx: i };
}

function parseValues(lines: string[], startIdx: number): { values: string[]; nextIdx: number } {
  const values: string[] = [];
  let i = startIdx;

  while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
    values.push(lines[i].trim());
    i++;
  }

  return { values, nextIdx: i };
}

function parseSimpleList(lines: string[], startIdx: number, indent: number): { items: string[]; nextIdx: number } {
  const items: string[] = [];
  let i = startIdx;

  while (i < lines.length && getIndentLevel(lines[i]) >= indent) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.includes('{') && !trimmed.endsWith(':')) {
      items.push(trimmed);
    } else {
      break;
    }
    i++;
  }

  return { items, nextIdx: i };
}

export function parseToon(input: string): UMLDiagram {
  const lines = input.split('\n');
  let title = '';
  let project: Project | undefined;
  const actors: Actor[] = [];
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const endpoints: Endpoint[] = [];
  const rules: Rule[] = [];
  const useCases: UseCase[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed === '' || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    // Title
    if (trimmed.startsWith('title:')) {
      title = trimmed.substring(6).trim();
      i++;
      continue;
    }

    // Project section
    if (trimmed.startsWith('project{') || trimmed.startsWith('project:')) {
      i++;
      if (i < lines.length) {
        const values = parseCSVValues(lines[i].trim());
        project = { name: values[0] ?? '' };
        if (values[1]) project.description = values[1];
        i++;

        // Parse stack and conventions
        while (i < lines.length && getIndentLevel(lines[i]) >= 4) {
          const subTrimmed = lines[i].trim();
          if (subTrimmed.startsWith('stack[') || subTrimmed.startsWith('stack{')) {
            i++;
            project.stack = {};
            while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
              const kv = parseCSVValues(lines[i].trim());
              if (kv.length >= 2) project.stack[kv[0]] = kv[1];
              i++;
            }
          } else if (subTrimmed.startsWith('conventions[') || subTrimmed.startsWith('conventions{')) {
            i++;
            project.conventions = {};
            while (i < lines.length && getIndentLevel(lines[i]) >= 6) {
              const kv = parseCSVValues(lines[i].trim());
              if (kv.length >= 2) project.conventions[kv[0]] = kv[1];
              i++;
            }
          } else {
            i++;
          }
        }
      }
      continue;
    }

    // Actors section
    if (trimmed.startsWith('actors[')) {
      i++;
      while (i < lines.length && getIndentLevel(lines[i]) >= 2) {
        const values = parseCSVValues(lines[i].trim());
        if (values.length >= 2) {
          const actor: Actor = { id: values[0], name: values[1] };
          if (values[2]) actor.description = values[2];
          actors.push(actor);
        }
        i++;
      }
      continue;
    }

    // Entities section
    if (trimmed.startsWith('entities[')) {
      i++;
      while (i < lines.length && getIndentLevel(lines[i]) >= 2) {
        if (getIndentLevel(lines[i]) > 2) {
          // Sub-section of current entity (attributes, methods, etc.)
          const subTrimmed = lines[i].trim();
          const currentEntity = entities[entities.length - 1];

          if (subTrimmed.startsWith('values[')) {
            i++;
            const result = parseValues(lines, i);
            if (currentEntity) currentEntity.values = result.values;
            i = result.nextIdx;
          } else if (subTrimmed.startsWith('attributes[')) {
            i++;
            const result = parseAttributes(lines, i);
            if (currentEntity) currentEntity.attributes = result.attributes;
            i = result.nextIdx;
          } else if (subTrimmed.startsWith('methods[')) {
            i++;
            const result = parseMethods(lines, i);
            if (currentEntity) currentEntity.methods = result.methods;
            i = result.nextIdx;
          } else if (subTrimmed.startsWith('functions[')) {
            i++;
            const result = parseFunctions(lines, i);
            if (currentEntity) currentEntity.functions = result.functions;
            i = result.nextIdx;
          } else if (subTrimmed.startsWith('types[')) {
            i++;
            const result = parseTypes(lines, i);
            if (currentEntity) currentEntity.types = result.types;
            i = result.nextIdx;
          } else {
            i++;
          }
        } else {
          // Entity header line
          const values = parseCSVValues(lines[i].trim());
          if (values.length >= 3) {
            const entity: Entity = {
              id: values[0],
              name: values[1],
              type: values[2] as EntityType,
            };
            if (values[3]) entity.description = values[3];
            entities.push(entity);
          }
          i++;
        }
      }
      continue;
    }

    // Relationships section
    if (trimmed.startsWith('relationships[')) {
      i++;
      while (i < lines.length && getIndentLevel(lines[i]) >= 2) {
        const values = parseCSVValues(lines[i].trim());
        if (values.length >= 4) {
          const rel: Relationship = {
            id: values[0],
            type: values[1] as RelationshipType,
            sourceId: values[2],
            targetId: values[3],
          };
          if (values[4]) rel.label = values[4];
          if (values[5]) rel.sourceCardinality = values[5] as Cardinality;
          if (values[6]) rel.targetCardinality = values[6] as Cardinality;
          relationships.push(rel);
        }
        i++;
      }
      continue;
    }

    // Endpoints section
    if (trimmed.startsWith('endpoints[')) {
      i++;
      while (i < lines.length && getIndentLevel(lines[i]) >= 2) {
        if (getIndentLevel(lines[i]) > 2) {
          // Sub-section of current endpoint (requestBody, response)
          const subTrimmed = lines[i].trim();
          const currentEndpoint = endpoints[endpoints.length - 1];

          if (subTrimmed.startsWith('requestBody{') || subTrimmed.startsWith('requestBody:')) {
            i++;
            if (i < lines.length && currentEndpoint) {
              const bv = parseCSVValues(lines[i].trim());
              const body: EndpointBody = { entityRef: bv[0] };
              if (bv[1]) body.fields = bv[1].split(';').filter(Boolean);
              currentEndpoint.requestBody = body;
              i++;
            }
          } else if (subTrimmed.startsWith('response{') || subTrimmed.startsWith('response:')) {
            i++;
            if (i < lines.length && currentEndpoint) {
              const bv = parseCSVValues(lines[i].trim());
              const body: EndpointBody = { entityRef: bv[0] };
              if (bv[1]) body.fields = bv[1].split(';').filter(Boolean);
              currentEndpoint.response = body;
              i++;
            }
          } else {
            i++;
          }
        } else {
          // Endpoint header line
          const values = parseCSVValues(lines[i].trim());
          if (values.length >= 3) {
            const endpoint: Endpoint = {
              id: values[0],
              method: values[1] as HttpMethod,
              path: values[2],
            };
            if (values[3]) endpoint.summary = values[3];
            if (values[4]) endpoint.auth = values[4] as AuthType;
            if (values[5]) endpoint.useCaseRef = values[5];
            endpoints.push(endpoint);
          }
          i++;
        }
      }
      continue;
    }

    // Rules section
    if (trimmed.startsWith('rules[')) {
      i++;
      while (i < lines.length && getIndentLevel(lines[i]) >= 2) {
        const values = parseCSVValues(lines[i].trim());
        if (values.length >= 4) {
          const rule: Rule = {
            id: values[0],
            entityRef: values[1],
            type: values[3] as RuleType,
            description: values[4] ?? '',
          };
          if (values[2]) rule.field = values[2];
          rules.push(rule);
        }
        i++;
      }
      continue;
    }

    // Use cases section
    if (trimmed.startsWith('useCases[')) {
      i++;
      while (i < lines.length && getIndentLevel(lines[i]) >= 2) {
        const indent = getIndentLevel(lines[i]);

        if (indent === 2) {
          // Use case header line
          const values = parseCSVValues(lines[i].trim());
          if (values.length >= 3) {
            const useCase: UseCase = {
              id: values[0],
              name: values[1],
              entityRef: values[2],
              scenarios: [],
            };
            if (values[3]) useCase.methodRef = values[3];
            if (values[4]) useCase.description = values[4];
            if (values[5]) useCase.actorRef = values[5];
            useCases.push(useCase);
          }
          i++;
        } else {
          // Sub-sections of current use case
          const subTrimmed = lines[i].trim();
          const currentUC = useCases[useCases.length - 1];

          if (subTrimmed.startsWith('preconditions[')) {
            i++;
            const result = parseSimpleList(lines, i, 6);
            if (currentUC) currentUC.preconditions = result.items;
            i = result.nextIdx;
          } else if (subTrimmed.startsWith('postconditions[')) {
            i++;
            const result = parseSimpleList(lines, i, 6);
            if (currentUC) currentUC.postconditions = result.items;
            i = result.nextIdx;
          } else if (subTrimmed.startsWith('scenarios[')) {
            i++;
            // Parse scenarios
            while (i < lines.length && getIndentLevel(lines[i]) >= 8) {
              if (getIndentLevel(lines[i]) === 8) {
                // Scenario name
                const scenarioName = lines[i].trim();
                const scenario: Scenario = { name: scenarioName, steps: [] };
                if (currentUC) currentUC.scenarios.push(scenario);
                i++;
              } else if (lines[i].trim().startsWith('steps[')) {
                i++;
                // Parse steps
                while (i < lines.length && getIndentLevel(lines[i]) >= 12) {
                  const stepValues = parseCSVValues(lines[i].trim());
                  if (stepValues.length >= 2 && currentUC) {
                    const currentScenario = currentUC.scenarios[currentUC.scenarios.length - 1];
                    if (currentScenario) {
                      currentScenario.steps.push({
                        keyword: stepValues[0] as GherkinKeyword,
                        text: stepValues[1],
                      });
                    }
                  }
                  i++;
                }
              } else {
                i++;
              }
            }
          } else {
            i++;
          }
        }
      }
      continue;
    }

    // Unknown line, skip
    i++;
  }

  const diagram: UMLDiagram = { title, entities, relationships };
  if (project) diagram.project = project;
  if (actors.length > 0) diagram.actors = actors;
  if (endpoints.length > 0) diagram.endpoints = endpoints;
  if (rules.length > 0) diagram.rules = rules;
  if (useCases.length > 0) diagram.useCases = useCases;

  return diagram;
}
