import { forwardRef, useState } from 'react';
import type { HttpMethod, AuthType } from '../../../diagram/domain/models/Endpoint';
import styles from './QuickAddModal.module.css';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'authenticated', label: 'Authenticated' },
  { value: 'admin', label: 'Admin' },
];

interface UseCaseOption {
  id: string;
  name: string;
}

interface AddEndpointModalProps {
  useCases: UseCaseOption[];
  onClose: () => void;
  onAdd: (endpointJson: string) => void;
}

function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase();
}

export const AddEndpointModal = forwardRef<HTMLDialogElement, AddEndpointModalProps>(
  function AddEndpointModal({ useCases, onClose, onAdd }, ref) {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [path, setPath] = useState('');
    const [summary, setSummary] = useState('');
    const [auth, setAuth] = useState<AuthType>('authenticated');
    const [useCaseRef, setUseCaseRef] = useState('');

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
      const trimmedPath = path.trim();
      if (!trimmedPath) return;

      const endpoint: Record<string, unknown> = {
        id: `ep-${toKebabCase(trimmedPath.replace(/^\/api\//, ''))}`,
        method,
        path: trimmedPath,
      };

      if (summary.trim()) endpoint.summary = summary.trim();
      endpoint.auth = auth;
      if (useCaseRef) endpoint.useCaseRef = useCaseRef;

      onAdd(JSON.stringify(endpoint, null, 2));
      setMethod('GET');
      setPath('');
      setSummary('');
      setAuth('authenticated');
      setUseCaseRef('');
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>Add Endpoint</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Method</label>
              <select
                className={styles.select}
                value={method}
                onChange={e => setMethod(e.target.value as HttpMethod)}
              >
                {HTTP_METHODS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field} style={{ flex: 2 }}>
              <label className={styles.label}>Path</label>
              <input
                className={styles.input}
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="/api/users"
                autoFocus
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Summary (optional)</label>
            <input
              className={styles.input}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="e.g. List all users"
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Auth</label>
              <select
                className={styles.select}
                value={auth}
                onChange={e => setAuth(e.target.value as AuthType)}
              >
                {AUTH_TYPES.map(a => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            {useCases.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>Use Case (optional)</label>
                <select
                  className={styles.select}
                  value={useCaseRef}
                  onChange={e => setUseCaseRef(e.target.value)}
                >
                  <option value="">None</option>
                  {useCases.map(uc => (
                    <option key={uc.id} value={uc.id}>
                      {uc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!path.trim()}
            >
              Add Endpoint
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
