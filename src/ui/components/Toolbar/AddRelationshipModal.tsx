import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RelationshipType, Cardinality } from '../../../diagram/domain/models/Relationship';
import styles from './QuickAddModal.module.css';

interface EntityOption {
  id: string;
  name: string;
}

interface AddRelationshipModalProps {
  entities: EntityOption[];
  onClose: () => void;
  onAdd: (relationshipJson: string) => void;
}

export const AddRelationshipModal = forwardRef<HTMLDialogElement, AddRelationshipModalProps>(
  function AddRelationshipModal({ entities, onClose, onAdd }, ref) {
    const { t } = useTranslation();
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [type, setType] = useState<RelationshipType>('association');
    const [label, setLabel] = useState('');
    const [sourceCardinality, setSourceCardinality] = useState<'' | Cardinality>('');
    const [targetCardinality, setTargetCardinality] = useState<'' | Cardinality>('');

    const relationshipTypes: { value: RelationshipType; label: string }[] = [
      { value: 'association', label: t('addRelationshipModal.typeAssociation') },
      { value: 'dependency', label: t('addRelationshipModal.typeDependency') },
      { value: 'inheritance', label: t('addRelationshipModal.typeInheritance') },
      { value: 'implementation', label: t('addRelationshipModal.typeImplementation') },
      { value: 'composition', label: t('addRelationshipModal.typeComposition') },
      { value: 'aggregation', label: t('addRelationshipModal.typeAggregation') },
    ];

    const cardinalityOptions: { value: '' | Cardinality; label: string }[] = [
      { value: '', label: t('addRelationshipModal.cardinalityNone') },
      { value: '1', label: '1' },
      { value: '0..1', label: '0..1' },
      { value: '1..*', label: '1..*' },
      { value: '*', label: '*' },
      { value: '0..*', label: '0..*' },
    ];

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
      if (!sourceId || !targetId) return;

      const relationship: Record<string, unknown> = {
        id: `r-${sourceId}-${targetId}`,
        type,
        sourceId,
        targetId,
      };

      if (label.trim()) {
        relationship.label = label.trim();
      }
      if (sourceCardinality) {
        relationship.sourceCardinality = sourceCardinality;
      }
      if (targetCardinality) {
        relationship.targetCardinality = targetCardinality;
      }

      onAdd(JSON.stringify(relationship, null, 2));
      setSourceId('');
      setTargetId('');
      setType('association');
      setLabel('');
      setSourceCardinality('');
      setTargetCardinality('');
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('addRelationshipModal.title')}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('addRelationshipModal.close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addRelationshipModal.sourceLabel')}</label>
              <select
                className={styles.select}
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
              >
                <option value="">{t('addRelationshipModal.selectEntity')}</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('addRelationshipModal.targetLabel')}</label>
              <select
                className={styles.select}
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
              >
                <option value="">{t('addRelationshipModal.selectEntity')}</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addRelationshipModal.typeLabel')}</label>
              <select
                className={styles.select}
                value={type}
                onChange={e => setType(e.target.value as RelationshipType)}
              >
                {relationshipTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('addRelationshipModal.labelLabel')}</label>
              <input
                className={styles.input}
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={t('addRelationshipModal.labelPlaceholder')}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                {t('addRelationshipModal.sourceCardinalityLabel')}
              </label>
              <select
                className={styles.select}
                value={sourceCardinality}
                onChange={e => setSourceCardinality(e.target.value as '' | Cardinality)}
              >
                {cardinalityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                {t('addRelationshipModal.targetCardinalityLabel')}
              </label>
              <select
                className={styles.select}
                value={targetCardinality}
                onChange={e => setTargetCardinality(e.target.value as '' | Cardinality)}
              >
                {cardinalityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!sourceId || !targetId}
            >
              {t('addRelationshipModal.addButton')}
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
