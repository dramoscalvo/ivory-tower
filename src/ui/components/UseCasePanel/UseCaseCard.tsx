import { useTranslation } from 'react-i18next';
import { ScenarioView } from './ScenarioView';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import type { Entity } from '../../../diagram/domain/models/Entity';
import type { Actor } from '../../../diagram/domain/models/Actor';
import styles from './UseCasePanel.module.css';

interface UseCaseCardProps {
  useCase: UseCase;
  entity: Entity | undefined;
  actor?: Actor;
}

export function UseCaseCard({ useCase, entity, actor }: UseCaseCardProps) {
  const { t } = useTranslation();
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{useCase.name}</h3>
        <div className={styles.cardMeta}>
          <span className={styles.entityRef}>
            {entity ? entity.name : useCase.entityRef}
            {!entity && <span className={styles.warning}> {t('useCaseCard.notFound')}</span>}
          </span>
          {useCase.methodRef && <span className={styles.methodRef}>.{useCase.methodRef}()</span>}
          {actor && (
            <span className={styles.actorRef}>
              {' '}
              {t('useCaseCard.byActor', { actor: actor.name })}
            </span>
          )}
          {useCase.actorRef && !actor && (
            <span className={styles.actorRef}>
              {' '}
              {t('useCaseCard.byActor', { actor: useCase.actorRef })}
            </span>
          )}
        </div>
      </header>
      {useCase.description && <p className={styles.cardDescription}>{useCase.description}</p>}
      {useCase.preconditions && useCase.preconditions.length > 0 && (
        <div className={styles.conditions}>
          <h4 className={styles.conditionsLabel}>{t('useCaseCard.preconditions')}</h4>
          <ul className={styles.conditionsList}>
            {useCase.preconditions.map((condition, index) => (
              <li key={index} className={styles.conditionItem}>
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.scenarios}>
        {useCase.scenarios.map((scenario, index) => (
          <ScenarioView key={index} scenario={scenario} />
        ))}
      </div>
      {useCase.postconditions && useCase.postconditions.length > 0 && (
        <div className={styles.conditions}>
          <h4 className={styles.conditionsLabel}>{t('useCaseCard.postconditions')}</h4>
          <ul className={styles.conditionsList}>
            {useCase.postconditions.map((condition, index) => (
              <li key={index} className={styles.conditionItem}>
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
