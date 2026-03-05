import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RuleType } from '../../../diagram/domain/models/Rule';
import { buildRuleId } from './idGenerator';
import styles from './QuickAddModal.module.css';

interface EntityOption {
  id: string;
  name: string;
  fieldNames: string[];
}

interface AddRuleModalProps {
  entities: EntityOption[];
  existingRuleIds: string[];
  onClose: () => void;
  onAdd: (ruleJson: string) => void;
}

export const AddRuleModal = forwardRef<HTMLDialogElement, AddRuleModalProps>(function AddRuleModal(
  { entities, existingRuleIds, onClose, onAdd },
  ref,
) {
  const { t } = useTranslation();
  const [entityRef, setEntityRef] = useState('');
  const [field, setField] = useState('');
  const [type, setType] = useState<RuleType>('validation');
  const [description, setDescription] = useState('');

  const selectedEntity = entities.find(entity => entity.id === entityRef);
  const fields = selectedEntity?.fieldNames ?? [];

  const ruleTypes: { value: RuleType; label: string }[] = [
    { value: 'validation', label: t('addRuleModal.typeValidation') },
    { value: 'constraint', label: t('addRuleModal.typeConstraint') },
    { value: 'unique', label: t('addRuleModal.typeUnique') },
    { value: 'invariant', label: t('addRuleModal.typeInvariant') },
  ];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = () => {
    const trimmedDescription = description.trim();
    if (!entityRef || !trimmedDescription) return;

    const rule: Record<string, unknown> = {
      id: buildRuleId(type, entityRef, field || undefined, existingRuleIds),
      entityRef,
      type,
      description: trimmedDescription,
    };

    if (field) {
      rule.field = field;
    }

    onAdd(JSON.stringify(rule, null, 2));
    setEntityRef('');
    setField('');
    setType('validation');
    setDescription('');
    onClose();
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t('addRuleModal.title')}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('addRuleModal.close')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>{t('addRuleModal.entityLabel')}</label>
            <select
              className={styles.select}
              value={entityRef}
              onChange={e => {
                setEntityRef(e.target.value);
                setField('');
              }}
            >
              <option value="">{t('addRuleModal.selectEntity')}</option>
              {entities.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('addRuleModal.typeLabel')}</label>
            <select
              className={styles.select}
              value={type}
              onChange={e => setType(e.target.value as RuleType)}
            >
              {ruleTypes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>{t('addRuleModal.fieldLabel')}</label>
          <select
            className={styles.select}
            value={field}
            onChange={e => setField(e.target.value)}
            disabled={fields.length === 0}
          >
            <option value="">{t('addRuleModal.noneOption')}</option>
            {fields.map(fieldName => (
              <option key={fieldName} value={fieldName}>
                {fieldName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>{t('addRuleModal.descriptionLabel')}</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('addRuleModal.descriptionPlaceholder')}
            rows={3}
          />
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!entityRef || !description.trim()}
          >
            {t('addRuleModal.addButton')}
          </button>
        </div>
      </div>
    </dialog>
  );
});
