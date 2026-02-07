import { UseCaseCard } from './UseCaseCard';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import type { Entity } from '../../../diagram/domain/models/Entity';
import styles from './UseCasePanel.module.css';

interface UseCasePanelProps {
  useCases: UseCase[];
  entities: Entity[];
}

export function UseCasePanel({ useCases, entities }: UseCasePanelProps) {
  const entityMap = new Map(entities.map(e => [e.id, e]));

  if (useCases.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No use cases defined</p>
          <p className={styles.emptyDescription}>
            Add a <code>useCases</code> array to your JSON to define Gherkin-style test specifications.
          </p>
        </div>
      </div>
    );
  }

  const groupedByEntity = useCases.reduce<Map<string, UseCase[]>>((acc, useCase) => {
    const group = acc.get(useCase.entityRef) ?? [];
    group.push(useCase);
    acc.set(useCase.entityRef, group);
    return acc;
  }, new Map());

  return (
    <div className={styles.panel}>
      {Array.from(groupedByEntity.entries()).map(([entityRef, entityUseCases]) => {
        const entity = entityMap.get(entityRef);
        return (
          <section key={entityRef} className={styles.entityGroup}>
            <h2 className={styles.entityGroupTitle}>
              {entity ? entity.name : entityRef}
              {!entity && <span className={styles.warning}> (entity not found)</span>}
            </h2>
            {entityUseCases.map(useCase => (
              <UseCaseCard
                key={useCase.id}
                useCase={useCase}
                entity={entity}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
