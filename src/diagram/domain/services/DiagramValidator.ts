import type { Entity, EntityType } from '../models/Entity';
import type { Relationship, RelationshipType } from '../models/Relationship';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import { validateUseCases } from '../../../usecase/domain/services/UseCaseValidator';

export interface ValidationError {
  path: string;
  message: string;
}

const VALID_ENTITY_TYPES: EntityType[] = ['class', 'interface', 'module', 'type', 'abstract-class'];
const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  'inheritance',
  'implementation',
  'composition',
  'aggregation',
  'dependency',
  'association',
];

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

  if (entity.generics && !Array.isArray(entity.generics)) {
    errors.push({ path: `${prefix}.generics`, message: 'Generics must be an array of strings' });
  }

  if (entity.attributes) {
    if (!Array.isArray(entity.attributes)) {
      errors.push({ path: `${prefix}.attributes`, message: 'Attributes must be an array' });
    } else {
      entity.attributes.forEach((attr, i) => {
        if (!attr.name) {
          errors.push({ path: `${prefix}.attributes[${i}].name`, message: 'Attribute must have a name' });
        }
        if (!attr.type || !attr.type.name) {
          errors.push({ path: `${prefix}.attributes[${i}].type`, message: 'Attribute must have a type with name' });
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
          errors.push({ path: `${prefix}.methods[${i}].parameters`, message: 'Method must have parameters array' });
        }
        if (!method.returnType || !method.returnType.name) {
          errors.push({ path: `${prefix}.methods[${i}].returnType`, message: 'Method must have a returnType with name' });
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
          errors.push({ path: `${prefix}.functions[${i}].name`, message: 'Function must have a name' });
        }
        if (!Array.isArray(fn.parameters)) {
          errors.push({ path: `${prefix}.functions[${i}].parameters`, message: 'Function must have parameters array' });
        }
        if (!fn.returnType || !fn.returnType.name) {
          errors.push({ path: `${prefix}.functions[${i}].returnType`, message: 'Function must have a returnType with name' });
        }
      });
    }
  }

  return errors;
}

function validateRelationship(
  relationship: Relationship,
  index: number,
  entityIds: Set<string>
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
    errors.push({ path: `${prefix}.sourceId`, message: 'Relationship must have a string sourceId' });
  } else if (!entityIds.has(relationship.sourceId)) {
    errors.push({ path: `${prefix}.sourceId`, message: `Source entity "${relationship.sourceId}" not found` });
  }

  if (!relationship.targetId || typeof relationship.targetId !== 'string') {
    errors.push({ path: `${prefix}.targetId`, message: 'Relationship must have a string targetId' });
  } else if (!entityIds.has(relationship.targetId)) {
    errors.push({ path: `${prefix}.targetId`, message: `Target entity "${relationship.targetId}" not found` });
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

  if (Array.isArray(d.useCases) && d.useCases.length > 0) {
    const useCaseErrors = validateUseCases(d.useCases as UseCase[], d.entities as Entity[]);
    errors.push(...useCaseErrors);
  }

  return errors;
}
