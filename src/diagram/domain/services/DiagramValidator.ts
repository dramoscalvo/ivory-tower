import type { Entity, EntityType } from '../models/Entity';
import type { Relationship, RelationshipType, Cardinality } from '../models/Relationship';
import type { Actor } from '../models/Actor';
import type { Endpoint, HttpMethod, AuthType } from '../models/Endpoint';
import type { Rule, RuleType } from '../models/Rule';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import { validateUseCases } from '../../../usecase/domain/services/UseCaseValidator';

export interface ValidationError {
  path: string;
  message: string;
}

const VALID_ENTITY_TYPES: EntityType[] = [
  'class',
  'interface',
  'module',
  'type',
  'abstract-class',
  'enum',
];
const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  'inheritance',
  'implementation',
  'composition',
  'aggregation',
  'dependency',
  'association',
];

function validateProject(project: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof project !== 'object' || project === null) {
    errors.push({ path: 'project', message: 'Project must be an object' });
    return errors;
  }

  const p = project as Record<string, unknown>;

  if (!p.name || typeof p.name !== 'string') {
    errors.push({ path: 'project.name', message: 'Project must have a string name' });
  }

  if (p.stack !== undefined) {
    if (typeof p.stack !== 'object' || p.stack === null) {
      errors.push({ path: 'project.stack', message: 'Project stack must be an object' });
    }
  }

  if (p.conventions !== undefined) {
    if (typeof p.conventions !== 'object' || p.conventions === null) {
      errors.push({
        path: 'project.conventions',
        message: 'Project conventions must be an object',
      });
    }
  }

  return errors;
}

function validateActors(actors: unknown[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const actorIds = new Set<string>();
  const duplicateIds: string[] = [];

  actors.forEach((actor, index) => {
    const prefix = `actors[${index}]`;
    const a = actor as Actor;

    if (!a.id || typeof a.id !== 'string') {
      errors.push({ path: `${prefix}.id`, message: 'Actor must have a string id' });
    } else {
      if (actorIds.has(a.id)) {
        duplicateIds.push(a.id);
      }
      actorIds.add(a.id);
    }

    if (!a.name || typeof a.name !== 'string') {
      errors.push({ path: `${prefix}.name`, message: 'Actor must have a string name' });
    }
  });

  if (duplicateIds.length > 0) {
    errors.push({ path: 'actors', message: `Duplicate actor ids: ${duplicateIds.join(', ')}` });
  }

  return errors;
}

function validateEntity(entity: Entity, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `entities[${index}]`;

  if (!entity.id || typeof entity.id !== 'string') {
    errors.push({ path: `${prefix}.id`, message: 'Entity must have a string id' });
  }

  if (!entity.name || typeof entity.name !== 'string') {
    errors.push({ path: `${prefix}.name`, message: 'Entity must have a string name' });
  }

  if (!entity.type || !VALID_ENTITY_TYPES.includes(entity.type)) {
    errors.push({
      path: `${prefix}.type`,
      message: `Entity type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
    });
  }

  if (entity.type === 'enum') {
    if (!Array.isArray(entity.values) || entity.values.length === 0) {
      errors.push({
        path: `${prefix}.values`,
        message: 'Enum entity must have a non-empty values array',
      });
    } else {
      entity.values.forEach((value, i) => {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push({
            path: `${prefix}.values[${i}]`,
            message: 'Enum value must be a non-empty string',
          });
        }
      });
    }
  }

  if (entity.generics && !Array.isArray(entity.generics)) {
    errors.push({ path: `${prefix}.generics`, message: 'Generics must be an array of strings' });
  }

  if (entity.attributes) {
    if (!Array.isArray(entity.attributes)) {
      errors.push({ path: `${prefix}.attributes`, message: 'Attributes must be an array' });
    } else {
      entity.attributes.forEach((attr, i) => {
        if (!attr.name) {
          errors.push({
            path: `${prefix}.attributes[${i}].name`,
            message: 'Attribute must have a name',
          });
        }
        if (!attr.type || !attr.type.name) {
          errors.push({
            path: `${prefix}.attributes[${i}].type`,
            message: 'Attribute must have a type with name',
          });
        }
      });
    }
  }

  if (entity.methods) {
    if (!Array.isArray(entity.methods)) {
      errors.push({ path: `${prefix}.methods`, message: 'Methods must be an array' });
    } else {
      entity.methods.forEach((method, i) => {
        if (!method.name) {
          errors.push({ path: `${prefix}.methods[${i}].name`, message: 'Method must have a name' });
        }
        if (!Array.isArray(method.parameters)) {
          errors.push({
            path: `${prefix}.methods[${i}].parameters`,
            message: 'Method must have parameters array',
          });
        }
        if (!method.returnType || !method.returnType.name) {
          errors.push({
            path: `${prefix}.methods[${i}].returnType`,
            message: 'Method must have a returnType with name',
          });
        }
      });
    }
  }

  if (entity.functions) {
    if (!Array.isArray(entity.functions)) {
      errors.push({ path: `${prefix}.functions`, message: 'Functions must be an array' });
    } else {
      entity.functions.forEach((fn, i) => {
        if (!fn.name) {
          errors.push({
            path: `${prefix}.functions[${i}].name`,
            message: 'Function must have a name',
          });
        }
        if (!Array.isArray(fn.parameters)) {
          errors.push({
            path: `${prefix}.functions[${i}].parameters`,
            message: 'Function must have parameters array',
          });
        }
        if (!fn.returnType || !fn.returnType.name) {
          errors.push({
            path: `${prefix}.functions[${i}].returnType`,
            message: 'Function must have a returnType with name',
          });
        }
      });
    }
  }

  return errors;
}

function validateRelationship(
  relationship: Relationship,
  index: number,
  entityIds: Set<string>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `relationships[${index}]`;

  if (!relationship.id || typeof relationship.id !== 'string') {
    errors.push({ path: `${prefix}.id`, message: 'Relationship must have a string id' });
  }

  if (!relationship.type || !VALID_RELATIONSHIP_TYPES.includes(relationship.type)) {
    errors.push({
      path: `${prefix}.type`,
      message: `Relationship type must be one of: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
    });
  }

  if (!relationship.sourceId || typeof relationship.sourceId !== 'string') {
    errors.push({
      path: `${prefix}.sourceId`,
      message: 'Relationship must have a string sourceId',
    });
  } else if (!entityIds.has(relationship.sourceId)) {
    errors.push({
      path: `${prefix}.sourceId`,
      message: `Source entity "${relationship.sourceId}" not found`,
    });
  }

  if (!relationship.targetId || typeof relationship.targetId !== 'string') {
    errors.push({
      path: `${prefix}.targetId`,
      message: 'Relationship must have a string targetId',
    });
  } else if (!entityIds.has(relationship.targetId)) {
    errors.push({
      path: `${prefix}.targetId`,
      message: `Target entity "${relationship.targetId}" not found`,
    });
  }

  if (
    relationship.sourceCardinality !== undefined &&
    !VALID_CARDINALITIES.includes(relationship.sourceCardinality)
  ) {
    errors.push({
      path: `${prefix}.sourceCardinality`,
      message: `sourceCardinality must be one of: ${VALID_CARDINALITIES.join(', ')}`,
    });
  }

  if (
    relationship.targetCardinality !== undefined &&
    !VALID_CARDINALITIES.includes(relationship.targetCardinality)
  ) {
    errors.push({
      path: `${prefix}.targetCardinality`,
      message: `targetCardinality must be one of: ${VALID_CARDINALITIES.join(', ')}`,
    });
  }

  return errors;
}

const VALID_CARDINALITIES: Cardinality[] = ['1', '0..1', '1..*', '*', '0..*'];
const VALID_HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const VALID_AUTH_TYPES: AuthType[] = ['public', 'authenticated', 'admin'];
const VALID_RULE_TYPES: RuleType[] = ['unique', 'invariant', 'validation', 'constraint'];

function getEntityFieldNames(entity: Entity): string[] {
  const names: string[] = [];
  if (entity.attributes) {
    names.push(...entity.attributes.map(a => a.name));
  }
  if (entity.values) {
    names.push(...entity.values);
  }
  return names;
}

function validateEndpointBody(
  body: unknown,
  prefix: string,
  entityMap: Map<string, Entity>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (!b.entityRef || typeof b.entityRef !== 'string') {
    errors.push({ path: `${prefix}.entityRef`, message: 'Body must have a string entityRef' });
  } else {
    const entity = entityMap.get(b.entityRef as string);
    if (!entity) {
      errors.push({
        path: `${prefix}.entityRef`,
        message: `Entity "${b.entityRef}" not found`,
      });
    } else if (Array.isArray(b.fields)) {
      const fieldNames = getEntityFieldNames(entity);
      (b.fields as string[]).forEach((field, i) => {
        if (!fieldNames.includes(field)) {
          errors.push({
            path: `${prefix}.fields[${i}]`,
            message: `Field "${field}" not found in entity "${b.entityRef}"`,
          });
        }
      });
    }
  }

  return errors;
}

function validateEndpoints(
  endpoints: unknown[],
  entityMap: Map<string, Entity>,
  useCaseIds: Set<string>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const endpointIds = new Set<string>();
  const duplicateIds: string[] = [];

  endpoints.forEach((endpoint, index) => {
    const prefix = `endpoints[${index}]`;
    const ep = endpoint as Endpoint;

    if (!ep.id || typeof ep.id !== 'string') {
      errors.push({ path: `${prefix}.id`, message: 'Endpoint must have a string id' });
    } else {
      if (endpointIds.has(ep.id)) {
        duplicateIds.push(ep.id);
      }
      endpointIds.add(ep.id);
    }

    if (!ep.method || !VALID_HTTP_METHODS.includes(ep.method)) {
      errors.push({
        path: `${prefix}.method`,
        message: `Endpoint method must be one of: ${VALID_HTTP_METHODS.join(', ')}`,
      });
    }

    if (!ep.path || typeof ep.path !== 'string') {
      errors.push({ path: `${prefix}.path`, message: 'Endpoint must have a string path' });
    }

    if (ep.auth !== undefined && !VALID_AUTH_TYPES.includes(ep.auth)) {
      errors.push({
        path: `${prefix}.auth`,
        message: `Endpoint auth must be one of: ${VALID_AUTH_TYPES.join(', ')}`,
      });
    }

    if (ep.requestBody !== undefined) {
      if (typeof ep.requestBody !== 'object' || ep.requestBody === null) {
        errors.push({
          path: `${prefix}.requestBody`,
          message: 'requestBody must be an object',
        });
      } else {
        errors.push(...validateEndpointBody(ep.requestBody, `${prefix}.requestBody`, entityMap));
      }
    }

    if (ep.response !== undefined) {
      if (typeof ep.response !== 'object' || ep.response === null) {
        errors.push({ path: `${prefix}.response`, message: 'response must be an object' });
      } else {
        errors.push(...validateEndpointBody(ep.response, `${prefix}.response`, entityMap));
      }
    }

    if (ep.useCaseRef !== undefined) {
      if (typeof ep.useCaseRef !== 'string') {
        errors.push({
          path: `${prefix}.useCaseRef`,
          message: 'useCaseRef must be a string',
        });
      } else if (useCaseIds.size > 0 && !useCaseIds.has(ep.useCaseRef)) {
        errors.push({
          path: `${prefix}.useCaseRef`,
          message: `Use case "${ep.useCaseRef}" not found`,
        });
      }
    }
  });

  if (duplicateIds.length > 0) {
    errors.push({
      path: 'endpoints',
      message: `Duplicate endpoint ids: ${duplicateIds.join(', ')}`,
    });
  }

  return errors;
}

function validateRules(
  rules: unknown[],
  entityMap: Map<string, Entity>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const ruleIds = new Set<string>();
  const duplicateIds: string[] = [];

  rules.forEach((rule, index) => {
    const prefix = `rules[${index}]`;
    const r = rule as Rule;

    if (!r.id || typeof r.id !== 'string') {
      errors.push({ path: `${prefix}.id`, message: 'Rule must have a string id' });
    } else {
      if (ruleIds.has(r.id)) {
        duplicateIds.push(r.id);
      }
      ruleIds.add(r.id);
    }

    if (!r.type || !VALID_RULE_TYPES.includes(r.type)) {
      errors.push({
        path: `${prefix}.type`,
        message: `Rule type must be one of: ${VALID_RULE_TYPES.join(', ')}`,
      });
    }

    if (!r.description || typeof r.description !== 'string') {
      errors.push({
        path: `${prefix}.description`,
        message: 'Rule must have a string description',
      });
    }

    if (!r.entityRef || typeof r.entityRef !== 'string') {
      errors.push({ path: `${prefix}.entityRef`, message: 'Rule must have a string entityRef' });
    } else {
      const entity = entityMap.get(r.entityRef);
      if (!entity) {
        errors.push({
          path: `${prefix}.entityRef`,
          message: `Entity "${r.entityRef}" not found`,
        });
      } else if (r.field) {
        const fieldNames = getEntityFieldNames(entity);
        if (!fieldNames.includes(r.field)) {
          errors.push({
            path: `${prefix}.field`,
            message: `Field "${r.field}" not found in entity "${r.entityRef}"`,
          });
        }
      }
    }
  });

  if (duplicateIds.length > 0) {
    errors.push({ path: 'rules', message: `Duplicate rule ids: ${duplicateIds.join(', ')}` });
  }

  return errors;
}

export function validateDiagram(diagram: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!diagram || typeof diagram !== 'object') {
    errors.push({ path: '', message: 'Diagram must be an object' });
    return errors;
  }

  const d = diagram as Record<string, unknown>;

  if (!d.title || typeof d.title !== 'string') {
    errors.push({ path: 'title', message: 'Diagram must have a string title' });
  }

  if (d.project !== undefined) {
    const projectErrors = validateProject(d.project);
    errors.push(...projectErrors);
  }

  const actorIds = new Set<string>();
  if (d.actors !== undefined) {
    if (!Array.isArray(d.actors)) {
      errors.push({ path: 'actors', message: 'Actors must be an array' });
    } else {
      const actorErrors = validateActors(d.actors);
      errors.push(...actorErrors);
      for (const actor of d.actors as Actor[]) {
        if (actor.id) actorIds.add(actor.id);
      }
    }
  }

  if (!Array.isArray(d.entities)) {
    errors.push({ path: 'entities', message: 'Diagram must have an entities array' });
    return errors;
  }

  if (!Array.isArray(d.relationships)) {
    errors.push({ path: 'relationships', message: 'Diagram must have a relationships array' });
  }

  const entityIds = new Set<string>();
  const duplicateIds: string[] = [];

  (d.entities as Entity[]).forEach((entity, index) => {
    const entityErrors = validateEntity(entity, index);
    errors.push(...entityErrors);

    if (entity.id) {
      if (entityIds.has(entity.id)) {
        duplicateIds.push(entity.id);
      }
      entityIds.add(entity.id);
    }
  });

  if (duplicateIds.length > 0) {
    errors.push({ path: 'entities', message: `Duplicate entity ids: ${duplicateIds.join(', ')}` });
  }

  if (Array.isArray(d.relationships)) {
    (d.relationships as Relationship[]).forEach((relationship, index) => {
      const relationshipErrors = validateRelationship(relationship, index, entityIds);
      errors.push(...relationshipErrors);
    });
  }

  const useCaseIds = new Set<string>();
  if (Array.isArray(d.useCases) && d.useCases.length > 0) {
    const useCaseErrors = validateUseCases(
      d.useCases as UseCase[],
      d.entities as Entity[],
      actorIds,
    );
    errors.push(...useCaseErrors);
    for (const uc of d.useCases as UseCase[]) {
      if (uc.id) useCaseIds.add(uc.id);
    }
  }

  const entityMap = new Map((d.entities as Entity[]).map(e => [e.id, e]));

  if (d.endpoints !== undefined) {
    if (!Array.isArray(d.endpoints)) {
      errors.push({ path: 'endpoints', message: 'Endpoints must be an array' });
    } else if (d.endpoints.length > 0) {
      const endpointErrors = validateEndpoints(d.endpoints, entityMap, useCaseIds);
      errors.push(...endpointErrors);
    }
  }

  if (d.rules !== undefined) {
    if (!Array.isArray(d.rules)) {
      errors.push({ path: 'rules', message: 'Rules must be an array' });
    } else if (d.rules.length > 0) {
      const ruleErrors = validateRules(d.rules, entityMap);
      errors.push(...ruleErrors);
    }
  }

  return errors;
}
