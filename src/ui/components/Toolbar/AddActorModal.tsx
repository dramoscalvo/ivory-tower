import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildActorId } from './idGenerator';
import styles from './QuickAddModal.module.css';

interface AddActorModalProps {
  existingActorIds: string[];
  onClose: () => void;
  onAdd: (actorJson: string) => void;
}

export const AddActorModal = forwardRef<HTMLDialogElement, AddActorModalProps>(function AddActorModal(
  { existingActorIds, onClose, onAdd },
  ref,
) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const actor: Record<string, unknown> = {
      id: buildActorId(trimmedName, existingActorIds),
      name: trimmedName,
    };

    const trimmedDescription = description.trim();
    if (trimmedDescription) {
      actor.description = trimmedDescription;
    }

    onAdd(JSON.stringify(actor, null, 2));
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t('addActorModal.title')}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('addActorModal.close')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>
        <div className={styles.field}>
          <label className={styles.label}>{t('addActorModal.nameLabel')}</label>
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('addActorModal.namePlaceholder')}
            autoFocus
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>{t('addActorModal.descriptionLabel')}</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('addActorModal.descriptionPlaceholder')}
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
            {t('addActorModal.addButton')}
          </button>
        </div>
      </div>
    </dialog>
  );
});
