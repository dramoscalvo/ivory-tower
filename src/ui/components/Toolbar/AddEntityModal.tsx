import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EntityType } from '../../../diagram/domain/models/Entity';
import { buildEntityId } from './idGenerator';
import styles from './QuickAddModal.module.css';

interface AddEntityModalProps {
  existingEntityIds: string[];
  onClose: () => void;
  onAdd: (entityJson: string) => void;
}

export const AddEntityModal = forwardRef<HTMLDialogElement, AddEntityModalProps>(
  function AddEntityModal({ existingEntityIds, onClose, onAdd }, ref) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [type, setType] = useState<EntityType>('class');
    const [description, setDescription] = useState('');
    const [enumValues, setEnumValues] = useState('VALUE_1, VALUE_2');
    const [includeStarterMembers, setIncludeStarterMembers] = useState(false);

    const entityTypes: { value: EntityType; label: string }[] = [
      { value: 'class', label: t('addEntityModal.typeClass') },
      { value: 'interface', label: t('addEntityModal.typeInterface') },
      { value: 'abstract-class', label: t('addEntityModal.typeAbstractClass') },
      { value: 'module', label: t('addEntityModal.typeModule') },
      { value: 'type', label: t('addEntityModal.typeType') },
      { value: 'enum', label: t('addEntityModal.typeEnum') },
    ];

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const entity: Record<string, unknown> = {
        id: buildEntityId(trimmedName, existingEntityIds),
        name: trimmedName,
        type,
      };

      if (description.trim()) {
        entity.description = description.trim();
      }

      if (type === 'enum') {
        const parsedValues = enumValues
          .split(/[\n,]+/)
          .map(value => value.trim())
          .filter(Boolean);
        entity.values = parsedValues.length > 0 ? parsedValues : ['VALUE_1', 'VALUE_2'];
      } else if (type === 'class' || type === 'abstract-class' || type === 'interface') {
        entity.attributes = includeStarterMembers
          ? [{ name: 'id', type: { name: 'string' }, visibility: 'private' }]
          : [];
        entity.methods = includeStarterMembers
          ? [{ name: 'execute', parameters: [], returnType: { name: 'void' }, visibility: 'public' }]
          : [];
      } else if (type === 'module') {
        entity.functions = includeStarterMembers
          ? [{ name: 'run', parameters: [], returnType: { name: 'void' }, isExported: true }]
          : [];
      } else if (type === 'type') {
        entity.types = includeStarterMembers
          ? [{ name: 'Value', definition: '{ id: string }', isExported: true }]
          : [];
      }

      onAdd(JSON.stringify(entity, null, 2));
      setName('');
      setType('class');
      setDescription('');
      setEnumValues('VALUE_1, VALUE_2');
      setIncludeStarterMembers(false);
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('addEntityModal.title')}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('addEntityModal.close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addEntityModal.nameLabel')}</label>
              <input
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('addEntityModal.namePlaceholder')}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('addEntityModal.typeLabel')}</label>
              <select
                className={styles.select}
                value={type}
                onChange={e => {
                  setType(e.target.value as EntityType);
                  setIncludeStarterMembers(false);
                }}
              >
                {entityTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {type === 'enum' ? (
            <div className={styles.field}>
              <label className={styles.label}>{t('addEntityModal.valuesLabel')}</label>
              <textarea
                className={styles.textarea}
                value={enumValues}
                onChange={e => setEnumValues(e.target.value)}
                placeholder={t('addEntityModal.valuesPlaceholder')}
                rows={2}
              />
            </div>
          ) : (
            <label className={styles.checkboxRow}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={includeStarterMembers}
                onChange={e => setIncludeStarterMembers(e.target.checked)}
              />
              {t('addEntityModal.includeStarterMembers')}
            </label>
          )}
          <div className={styles.field}>
            <label className={styles.label}>{t('addEntityModal.descriptionLabel')}</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('addEntityModal.descriptionPlaceholder')}
              rows={2}
            />
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              {t('addEntityModal.addButton')}
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
