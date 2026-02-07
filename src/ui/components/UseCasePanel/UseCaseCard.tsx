import { ScenarioView } from './ScenarioView';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import type { Entity } from '../../../diagram/domain/models/Entity';
import styles from './UseCasePanel.module.css';

interface UseCaseCardProps {
  useCase: UseCase;
  entity: Entity | undefined;
}

export function UseCaseCard({ useCase, entity }: UseCaseCardProps) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{useCase.name}</h3>
        <div className={styles.cardMeta}>
          <span className={styles.entityRef}>
            {entity ? entity.name : useCase.entityRef}
            {!entity && <span className={styles.warning}> (not found)</span>}
          </span>
          {useCase.methodRef && (
            <span className={styles.methodRef}>.{useCase.methodRef}()</span>
          )}
        </div>
      </header>
      {useCase.description && (
        <p className={styles.cardDescription}>{useCase.description}</p>
      )}
      <div className={styles.scenarios}>
        {useCase.scenarios.map((scenario, index) => (
          <ScenarioView key={index} scenario={scenario} />
        ))}
      </div>
    </article>
  );
}
