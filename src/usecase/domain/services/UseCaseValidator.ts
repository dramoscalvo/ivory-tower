import type { UseCase, GherkinKeyword } from '../models/UseCase';
import type { Entity } from '../../../diagram/domain/models/Entity';
import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';

const VALID_GHERKIN_KEYWORDS: GherkinKeyword[] = ['Given', 'When', 'Then', 'And', 'But'];

function getMethodNames(entity: Entity): string[] {
  const names: string[] = [];
  if (entity.methods) {
    names.push(...entity.methods.map(m => m.name));
  }
  if (entity.functions) {
    names.push(...entity.functions.map(f => f.name));
  }
  return names;
}

export function validateUseCases(useCases: UseCase[], entities: Entity[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityMap = new Map(entities.map(e => [e.id, e]));

  useCases.forEach((useCase, index) => {
    const prefix = `useCases[${index}]`;

    if (!useCase.id || typeof useCase.id !== 'string') {
      errors.push({ path: `${prefix}.id`, message: 'Use case must have a string id' });
    }

    if (!useCase.name || typeof useCase.name !== 'string') {
      errors.push({ path: `${prefix}.name`, message: 'Use case must have a string name' });
    }

    if (!useCase.entityRef || typeof useCase.entityRef !== 'string') {
      errors.push({ path: `${prefix}.entityRef`, message: 'Use case must have a string entityRef' });
    } else {
      const entity = entityMap.get(useCase.entityRef);
      if (!entity) {
        errors.push({
          path: `${prefix}.entityRef`,
          message: `Entity "${useCase.entityRef}" not found`,
        });
      } else if (useCase.methodRef) {
        const methodNames = getMethodNames(entity);
        if (!methodNames.includes(useCase.methodRef)) {
          errors.push({
            path: `${prefix}.methodRef`,
            message: `Method "${useCase.methodRef}" not found in entity "${useCase.entityRef}"`,
          });
        }
      }
    }

    if (!Array.isArray(useCase.scenarios) || useCase.scenarios.length === 0) {
      errors.push({
        path: `${prefix}.scenarios`,
        message: 'Use case must have at least one scenario',
      });
    } else {
      useCase.scenarios.forEach((scenario, scenarioIndex) => {
        const scenarioPrefix = `${prefix}.scenarios[${scenarioIndex}]`;

        if (!scenario.name || typeof scenario.name !== 'string') {
          errors.push({
            path: `${scenarioPrefix}.name`,
            message: 'Scenario must have a string name',
          });
        }

        if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
          errors.push({
            path: `${scenarioPrefix}.steps`,
            message: 'Scenario must have at least one step',
          });
        } else {
          scenario.steps.forEach((step, stepIndex) => {
            const stepPrefix = `${scenarioPrefix}.steps[${stepIndex}]`;

            if (!VALID_GHERKIN_KEYWORDS.includes(step.keyword)) {
              errors.push({
                path: `${stepPrefix}.keyword`,
                message: `Invalid Gherkin keyword "${step.keyword}". Must be one of: ${VALID_GHERKIN_KEYWORDS.join(', ')}`,
              });
            }

            if (!step.text || typeof step.text !== 'string' || step.text.trim() === '') {
              errors.push({
                path: `${stepPrefix}.text`,
                message: 'Step must have non-empty text',
              });
            }
          });
        }
      });
    }
  });

  return errors;
}
