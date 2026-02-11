import { forwardRef, useState } from 'react';
import type { EntityType } from '../../../diagram/domain/models/Entity';
import styles from './QuickAddModal.module.css';

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'class', label: 'Class' },
  { value: 'interface', label: 'Interface' },
  { value: 'abstract-class', label: 'Abstract Class' },
  { value: 'module', label: 'Module' },
  { value: 'type', label: 'Type' },
  { value: 'enum', label: 'Enum' },
];

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

interface AddEntityModalProps {
  onClose: () => void;
  onAdd: (entityJson: string) => void;
}

export const AddEntityModal = forwardRef<HTMLDialogElement, AddEntityModalProps>(
  function AddEntityModal({ onClose, onAdd }, ref) {
    const [name, setName] = useState('');
    const [type, setType] = useState<EntityType>('class');
    const [description, setDescription] = useState('');

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const entity: Record<string, unknown> = {
        id: toKebabCase(trimmedName),
        name: trimmedName,
        type,
      };

      if (description.trim()) {
        entity.description = description.trim();
      }

      if (type === 'enum') {
        entity.values = ['VALUE_1', 'VALUE_2'];
      } else if (type === 'class' || type === 'abstract-class' || type === 'interface') {
        entity.attributes = [];
        entity.methods = [];
      } else if (type === 'module') {
        entity.functions = [];
      }

      onAdd(JSON.stringify(entity, null, 2));
      setName('');
      setType('class');
      setDescription('');
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>Add Entity</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. UserAccount"
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              <select
                className={styles.select}
                value={type}
                onChange={e => setType(e.target.value as EntityType)}
              >
                {ENTITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this entity represent?"
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
              Add Entity
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
