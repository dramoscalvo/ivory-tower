import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildUseCaseId } from './idGenerator';
import styles from './QuickAddModal.module.css';

interface EntityOption {
  id: string;
  name: string;
  methods?: { name: string }[];
  functions?: { name: string }[];
}

interface ActorOption {
  id: string;
  name: string;
}

interface AddUseCaseModalProps {
  entities: EntityOption[];
  actors: ActorOption[];
  existingUseCaseIds: string[];
  onClose: () => void;
  onAdd: (useCaseJson: string) => void;
}

interface ScenarioDraft {
  name: string;
  given: string;
  when: string;
  then: string;
}

export const AddUseCaseModal = forwardRef<HTMLDialogElement, AddUseCaseModalProps>(
  function AddUseCaseModal({ entities, actors, existingUseCaseIds, onClose, onAdd }, ref) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [entityRef, setEntityRef] = useState('');
    const [methodRef, setMethodRef] = useState('');
    const [actorRef, setActorRef] = useState('');
    const [description, setDescription] = useState('');
    const [preconditionsText, setPreconditionsText] = useState('');
    const [postconditionsText, setPostconditionsText] = useState('');
    const [scenarios, setScenarios] = useState<ScenarioDraft[]>([
      {
        name: t('addUseCaseModal.scenarioName'),
        given: t('addUseCaseModal.stepGiven'),
        when: t('addUseCaseModal.stepWhenDefault'),
        then: t('addUseCaseModal.stepThen'),
      },
    ]);

    const selectedEntity = entities.find(e => e.id === entityRef);
    const memberNames = [
      ...(selectedEntity?.methods ?? []).map(method => method.name),
      ...(selectedEntity?.functions ?? []).map(fn => fn.name),
    ];

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const parseConditions = (rawText: string): string[] =>
      rawText
        .split('\n')
        .map(condition => condition.trim())
        .filter(Boolean);

    const updateScenario = (
      index: number,
      field: keyof ScenarioDraft,
      value: string,
    ) => {
      setScenarios(prev =>
        prev.map((scenario, scenarioIndex) =>
          scenarioIndex === index ? { ...scenario, [field]: value } : scenario,
        ),
      );
    };

    const addScenario = () => {
      setScenarios(prev => [
        ...prev,
        {
          name: `${t('addUseCaseModal.scenarioName')} ${prev.length + 1}`,
          given: t('addUseCaseModal.stepGiven'),
          when: t('addUseCaseModal.stepWhenDefault'),
          then: t('addUseCaseModal.stepThen'),
        },
      ]);
    };

    const removeScenario = (index: number) => {
      setScenarios(prev => prev.filter((_, scenarioIndex) => scenarioIndex !== index));
    };

    const handleSubmit = () => {
      const trimmedName = name.trim();
      if (!trimmedName || !entityRef) return;

      const useCase: Record<string, unknown> = {
        id: buildUseCaseId(trimmedName, existingUseCaseIds),
        name: trimmedName,
        entityRef,
        scenarios: scenarios.map(scenario => ({
          name: scenario.name.trim() || t('addUseCaseModal.scenarioName'),
          steps: [
            { keyword: 'Given', text: scenario.given.trim() || t('addUseCaseModal.stepGiven') },
            {
              keyword: 'When',
              text:
                scenario.when.trim() ||
                t('addUseCaseModal.stepWhen', { name: trimmedName }),
            },
            { keyword: 'Then', text: scenario.then.trim() || t('addUseCaseModal.stepThen') },
          ],
        })),
      };

      if (methodRef) useCase.methodRef = methodRef;
      if (actorRef) useCase.actorRef = actorRef;
      if (description.trim()) useCase.description = description.trim();
      const preconditions = parseConditions(preconditionsText);
      if (preconditions.length > 0) useCase.preconditions = preconditions;
      const postconditions = parseConditions(postconditionsText);
      if (postconditions.length > 0) useCase.postconditions = postconditions;

      onAdd(JSON.stringify(useCase, null, 2));
      setName('');
      setEntityRef('');
      setMethodRef('');
      setActorRef('');
      setDescription('');
      setPreconditionsText('');
      setPostconditionsText('');
      setScenarios([
        {
          name: t('addUseCaseModal.scenarioName'),
          given: t('addUseCaseModal.stepGiven'),
          when: t('addUseCaseModal.stepWhenDefault'),
          then: t('addUseCaseModal.stepThen'),
        },
      ]);
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('addUseCaseModal.title')}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('addUseCaseModal.close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>{t('addUseCaseModal.nameLabel')}</label>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('addUseCaseModal.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('addUseCaseModal.entityLabel')}</label>
              <select
                className={styles.select}
                value={entityRef}
                onChange={e => {
                  setEntityRef(e.target.value);
                  setMethodRef('');
                }}
              >
                <option value="">{t('addUseCaseModal.selectEntity')}</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('addUseCaseModal.methodLabel')}</label>
              <select
                className={styles.select}
                value={methodRef}
                onChange={e => setMethodRef(e.target.value)}
                disabled={memberNames.length === 0}
              >
                <option value="">{t('addUseCaseModal.noneOption')}</option>
                {memberNames.map(memberName => (
                  <option key={memberName} value={memberName}>
                    {memberName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {actors.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>{t('addUseCaseModal.actorLabel')}</label>
              <select
                className={styles.select}
                value={actorRef}
                onChange={e => setActorRef(e.target.value)}
              >
                <option value="">{t('addUseCaseModal.noneOption')}</option>
                {actors.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>{t('addUseCaseModal.descriptionLabel')}</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('addUseCaseModal.descriptionPlaceholder')}
              rows={2}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('addUseCaseModal.preconditionsLabel')}</label>
            <textarea
              className={styles.textarea}
              value={preconditionsText}
              onChange={e => setPreconditionsText(e.target.value)}
              placeholder={t('addUseCaseModal.conditionsPlaceholder')}
              rows={2}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('addUseCaseModal.postconditionsLabel')}</label>
            <textarea
              className={styles.textarea}
              value={postconditionsText}
              onChange={e => setPostconditionsText(e.target.value)}
              placeholder={t('addUseCaseModal.conditionsPlaceholder')}
              rows={2}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.sectionHeaderRow}>
              <label className={styles.label}>{t('addUseCaseModal.scenariosLabel')}</label>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={addScenario}
              >
                {t('addUseCaseModal.addScenario')}
              </button>
            </div>
            <div className={styles.scenarioList}>
              {scenarios.map((scenario, index) => (
                <div key={index} className={styles.scenarioCard}>
                  <div className={styles.scenarioHeader}>
                    <input
                      className={styles.input}
                      value={scenario.name}
                      onChange={e => updateScenario(index, 'name', e.target.value)}
                      placeholder={t('addUseCaseModal.scenarioName')}
                    />
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => removeScenario(index)}
                      disabled={scenarios.length === 1}
                      aria-label={t('addUseCaseModal.removeScenario')}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    className={styles.input}
                    value={scenario.given}
                    onChange={e => updateScenario(index, 'given', e.target.value)}
                    placeholder={t('addUseCaseModal.stepGiven')}
                  />
                  <input
                    className={styles.input}
                    value={scenario.when}
                    onChange={e => updateScenario(index, 'when', e.target.value)}
                    placeholder={
                      name.trim()
                        ? t('addUseCaseModal.stepWhen', { name: name.trim() })
                        : t('addUseCaseModal.stepWhenDefault')
                    }
                  />
                  <input
                    className={styles.input}
                    value={scenario.then}
                    onChange={e => updateScenario(index, 'then', e.target.value)}
                    placeholder={t('addUseCaseModal.stepThen')}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!name.trim() || !entityRef}
            >
              {t('addUseCaseModal.addButton')}
            </button>
          </div>
        </div>
      </dialog>
    );
  },
);
