import { Trans, useTranslation } from 'react-i18next';
import { UseCaseCard } from './UseCaseCard';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import type { Entity } from '../../../diagram/domain/models/Entity';
import type { Actor } from '../../../diagram/domain/models/Actor';
import styles from './UseCasePanel.module.css';

interface UseCasePanelProps {
  useCases: UseCase[];
  entities: Entity[];
  actors?: Actor[];
}

export function UseCasePanel({ useCases, entities, actors }: UseCasePanelProps) {
  const { t } = useTranslation();
  const entityMap = new Map(entities.map(e => [e.id, e]));
  const actorMap = new Map((actors ?? []).map(a => [a.id, a]));

  if (useCases.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t('useCasePanel.emptyTitle')}</p>
          <p className={styles.emptyDescription}>
            <Trans i18nKey="useCasePanel.emptyDescription" components={{ code: <code /> }} />
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
              {!entity && <span className={styles.warning}> {t('useCaseCard.notFound')}</span>}
            </h2>
            {entityUseCases.map(useCase => (
              <UseCaseCard
                key={useCase.id}
                useCase={useCase}
                entity={entity}
                actor={useCase.actorRef ? actorMap.get(useCase.actorRef) : undefined}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
