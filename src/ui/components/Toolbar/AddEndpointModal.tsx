import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HttpMethod, AuthType } from '../../../diagram/domain/models/Endpoint';
import { buildEndpointId } from './idGenerator';
import styles from './QuickAddModal.module.css';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface UseCaseOption {
  id: string;
  name: string;
}

interface EntityOption {
  id: string;
  name: string;
  fieldNames: string[];
}

interface AddEndpointModalProps {
  useCases: UseCaseOption[];
  entities: EntityOption[];
  existingEndpointIds: string[];
  onClose: () => void;
  onAdd: (endpointJson: string) => void;
}

export const AddEndpointModal = forwardRef<HTMLDialogElement, AddEndpointModalProps>(
  function AddEndpointModal({ useCases, entities, existingEndpointIds, onClose, onAdd }, ref) {
    const { t } = useTranslation();
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [path, setPath] = useState('');
    const [summary, setSummary] = useState('');
    const [auth, setAuth] = useState<AuthType>('authenticated');
    const [useCaseRef, setUseCaseRef] = useState('');
    const [requestEntityRef, setRequestEntityRef] = useState('');
    const [responseEntityRef, setResponseEntityRef] = useState('');
    const [requestFields, setRequestFields] = useState<string[]>([]);
    const [responseFields, setResponseFields] = useState<string[]>([]);

    const requestEntity = entities.find(entity => entity.id === requestEntityRef);
    const responseEntity = entities.find(entity => entity.id === responseEntityRef);

    const authTypes: { value: AuthType; label: string }[] = [
      { value: 'public', label: t('addEndpointModal.authPublic') },
      { value: 'authenticated', label: t('addEndpointModal.authAuthenticated') },
      { value: 'admin', label: t('addEndpointModal.authAdmin') },
    ];

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
      const trimmedPath = path.trim();
      if (!trimmedPath) return;

      const endpoint: Record<string, unknown> = {
        id: buildEndpointId(method, trimmedPath, existingEndpointIds),
        method,
        path: trimmedPath,
      };

      if (summary.trim()) endpoint.summary = summary.trim();
      endpoint.auth = auth;
      if (useCaseRef) endpoint.useCaseRef = useCaseRef;
      if (requestEntityRef) {
        endpoint.requestBody = {
          entityRef: requestEntityRef,
          ...(requestFields.length > 0 ? { fields: requestFields } : {}),
        };
      }
      if (responseEntityRef) {
        endpoint.response = {
          entityRef: responseEntityRef,
          ...(responseFields.length > 0 ? { fields: responseFields } : {}),
        };
      }

      onAdd(JSON.stringify(endpoint, null, 2));
      setMethod('GET');
      setPath('');
      setSummary('');
      setAuth('authenticated');
      setUseCaseRef('');
      setRequestEntityRef('');
      setResponseEntityRef('');
      setRequestFields([]);
      setResponseFields([]);
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('addEndpointModal.title')}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('addEndpointModal.close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addEndpointModal.methodLabel')}</label>
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
              <label className={styles.label}>{t('addEndpointModal.pathLabel')}</label>
              <input
                className={styles.input}
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder={t('addEndpointModal.pathPlaceholder')}
                autoFocus
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('addEndpointModal.summaryLabel')}</label>
            <input
              className={styles.input}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder={t('addEndpointModal.summaryPlaceholder')}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addEndpointModal.authLabel')}</label>
              <select
                className={styles.select}
                value={auth}
                onChange={e => setAuth(e.target.value as AuthType)}
              >
                {authTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {useCases.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>{t('addEndpointModal.useCaseLabel')}</label>
                <select
                  className={styles.select}
                  value={useCaseRef}
                  onChange={e => setUseCaseRef(e.target.value)}
                >
                  <option value="">{t('addEndpointModal.noneOption')}</option>
                  {useCases.map(uc => (
                    <option key={uc.id} value={uc.id}>
                      {uc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addEndpointModal.requestEntityLabel')}</label>
              <select
                className={styles.select}
                value={requestEntityRef}
                onChange={e => {
                  setRequestEntityRef(e.target.value);
                  setRequestFields([]);
                }}
              >
                <option value="">{t('addEndpointModal.noneOption')}</option>
                {entities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('addEndpointModal.responseEntityLabel')}</label>
              <select
                className={styles.select}
                value={responseEntityRef}
                onChange={e => {
                  setResponseEntityRef(e.target.value);
                  setResponseFields([]);
                }}
              >
                <option value="">{t('addEndpointModal.noneOption')}</option>
                {entities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(requestEntityRef || responseEntityRef) && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{t('addEndpointModal.requestFieldsLabel')}</label>
                <select
                  className={styles.select}
                  multiple
                  value={requestFields}
                  onChange={e => {
                    const values = Array.from(e.target.selectedOptions).map(option => option.value);
                    setRequestFields(values);
                  }}
                  size={Math.min(Math.max(requestEntity?.fieldNames.length ?? 1, 1), 5)}
                  disabled={!requestEntityRef || (requestEntity?.fieldNames.length ?? 0) === 0}
                >
                  {(requestEntity?.fieldNames ?? []).map(fieldName => (
                    <option key={fieldName} value={fieldName}>
                      {fieldName}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('addEndpointModal.responseFieldsLabel')}</label>
                <select
                  className={styles.select}
                  multiple
                  value={responseFields}
                  onChange={e => {
                    const values = Array.from(e.target.selectedOptions).map(option => option.value);
                    setResponseFields(values);
                  }}
                  size={Math.min(Math.max(responseEntity?.fieldNames.length ?? 1, 1), 5)}
                  disabled={!responseEntityRef || (responseEntity?.fieldNames.length ?? 0) === 0}
                >
                  {(responseEntity?.fieldNames ?? []).map(fieldName => (
                    <option key={fieldName} value={fieldName}>
                      {fieldName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!path.trim()}
            >
              {t('addEndpointModal.addButton')}
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
