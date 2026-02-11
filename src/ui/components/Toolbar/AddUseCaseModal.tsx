import { forwardRef, useState } from 'react';
import styles from './QuickAddModal.module.css';

interface EntityOption {
  id: string;
  name: string;
  methods?: { name: string }[];
}

interface ActorOption {
  id: string;
  name: string;
}

interface AddUseCaseModalProps {
  entities: EntityOption[];
  actors: ActorOption[];
  onClose: () => void;
  onAdd: (useCaseJson: string) => void;
}

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export const AddUseCaseModal = forwardRef<HTMLDialogElement, AddUseCaseModalProps>(
  function AddUseCaseModal({ entities, actors, onClose, onAdd }, ref) {
    const [name, setName] = useState('');
    const [entityRef, setEntityRef] = useState('');
    const [methodRef, setMethodRef] = useState('');
    const [actorRef, setActorRef] = useState('');
    const [description, setDescription] = useState('');

    const selectedEntity = entities.find(e => e.id === entityRef);
    const methods = selectedEntity?.methods ?? [];

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
      const trimmedName = name.trim();
      if (!trimmedName || !entityRef) return;

      const useCase: Record<string, unknown> = {
        id: `uc-${toKebabCase(trimmedName)}`,
        name: trimmedName,
        entityRef,
        scenarios: [
          {
            name: 'Happy path',
            steps: [
              { keyword: 'Given', text: 'the preconditions are met' },
              { keyword: 'When', text: `${trimmedName} is performed` },
              { keyword: 'Then', text: 'the expected outcome occurs' },
            ],
          },
        ],
      };

      if (methodRef) useCase.methodRef = methodRef;
      if (actorRef) useCase.actorRef = actorRef;
      if (description.trim()) useCase.description = description.trim();

      onAdd(JSON.stringify(useCase, null, 2));
      setName('');
      setEntityRef('');
      setMethodRef('');
      setActorRef('');
      setDescription('');
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>Add Use Case</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Update User Email"
              autoFocus
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Entity</label>
              <select
                className={styles.select}
                value={entityRef}
                onChange={e => {
                  setEntityRef(e.target.value);
                  setMethodRef('');
                }}
              >
                <option value="">Select entity...</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Method (optional)</label>
              <select
                className={styles.select}
                value={methodRef}
                onChange={e => setMethodRef(e.target.value)}
                disabled={methods.length === 0}
              >
                <option value="">None</option>
                {methods.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {actors.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Actor (optional)</label>
              <select
                className={styles.select}
                value={actorRef}
                onChange={e => setActorRef(e.target.value)}
              >
                <option value="">None</option>
                {actors.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Description (optional)</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this use case test?"
              rows={2}
            />
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!name.trim() || !entityRef}
            >
              Add Use Case
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
