import type { UMLDiagram } from '../models/UMLDiagram';

export type WarningCategory =
  | 'uncovered-entity'
  | 'unreferenced-method'
  | 'usecase-no-endpoint'
  | 'endpoint-no-usecase'
  | 'orphan-entity';

export interface CompletenessWarning {
  category: WarningCategory;
  entityId?: string;
  message: string;
}

export function validateCompleteness(diagram: UMLDiagram): CompletenessWarning[] {
  const warnings: CompletenessWarning[] = [];

  const useCases = diagram.useCases ?? [];
  const endpoints = diagram.endpoints ?? [];
  const relationships = diagram.relationships;

  // Entities referenced by use cases
  const entitiesCoveredByUseCases = new Set(useCases.map(uc => uc.entityRef));

  // Entities without use cases
  for (const entity of diagram.entities) {
    if (!entitiesCoveredByUseCases.has(entity.id)) {
      warnings.push({
        category: 'uncovered-entity',
        entityId: entity.id,
        message: `Entity "${entity.name}" has no use cases`,
      });
    }
  }

  // Methods not referenced by any use case
  const referencedMethods = new Map<string, Set<string>>();
  for (const uc of useCases) {
    if (uc.methodRef) {
      if (!referencedMethods.has(uc.entityRef)) {
        referencedMethods.set(uc.entityRef, new Set());
      }
      referencedMethods.get(uc.entityRef)!.add(uc.methodRef);
    }
  }

  for (const entity of diagram.entities) {
    if (!entity.methods) continue;
    const referenced = referencedMethods.get(entity.id) ?? new Set();
    for (const method of entity.methods) {
      if (!referenced.has(method.name)) {
        warnings.push({
          category: 'unreferenced-method',
          entityId: entity.id,
          message: `Method "${entity.name}.${method.name}" is not referenced by any use case`,
        });
      }
    }
  }

  // Use cases without endpoints
  const useCaseIdsWithEndpoints = new Set(
    endpoints.filter(ep => ep.useCaseRef).map(ep => ep.useCaseRef!),
  );
  for (const uc of useCases) {
    if (!useCaseIdsWithEndpoints.has(uc.id)) {
      warnings.push({
        category: 'usecase-no-endpoint',
        entityId: uc.entityRef,
        message: `Use case "${uc.name}" has no endpoint`,
      });
    }
  }

  // Endpoints without use cases
  for (const ep of endpoints) {
    if (!ep.useCaseRef) {
      warnings.push({
        category: 'endpoint-no-usecase',
        message: `Endpoint "${ep.method} ${ep.path}" has no use case reference`,
      });
    }
  }

  // Entities with no relationships (orphans)
  const connectedEntities = new Set<string>();
  for (const rel of relationships) {
    connectedEntities.add(rel.sourceId);
    connectedEntities.add(rel.targetId);
  }

  for (const entity of diagram.entities) {
    if (!connectedEntities.has(entity.id) && diagram.entities.length > 1) {
      warnings.push({
        category: 'orphan-entity',
        entityId: entity.id,
        message: `Entity "${entity.name}" has no relationships`,
      });
    }
  }

  return warnings;
}
