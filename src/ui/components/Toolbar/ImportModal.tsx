import { forwardRef, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { detectFormat } from '../../../diagram/infrastructure/formatDetector';
import { parseMermaidClassDiagram } from '../../../diagram/infrastructure/MermaidParser';
import { parsePlantUmlClassDiagram } from '../../../diagram/infrastructure/PlantUmlParser';
import { parseToon } from '../../../diagram/infrastructure/ToonParser';
import type { DiagramFormat } from '../../../diagram/infrastructure/formatDetector';
import styles from './ImportModal.module.css';

type ImportSourceFormat = Exclude<DiagramFormat, 'unknown'>;

export interface ImportResult {
  architectureJson: string;
  useCasesJson: string | null;
  sourceFormat: ImportSourceFormat;
}

interface ImportModalProps {
  onClose: () => void;
  onImport: (payload: ImportResult) => void;
}

function splitImportedDiagram(rawDiagram: unknown, t: (key: string) => string): ImportResult {
  if (typeof rawDiagram !== 'object' || rawDiagram === null || Array.isArray(rawDiagram)) {
    throw new Error(t('importModal.errorJsonObject'));
  }

  const diagram = rawDiagram as Record<string, unknown>;
  const useCases = diagram.useCases;
  const architectureData = { ...diagram };
  delete architectureData.useCases;

  return {
    architectureJson: JSON.stringify(architectureData, null, 2),
    useCasesJson: Array.isArray(useCases) ? JSON.stringify(useCases, null, 2) : null,
    sourceFormat: 'json',
  };
}

function processContent(content: string, format: DiagramFormat | 'auto', t: (key: string) => string): ImportResult {
  const trimmed = content.trim();
  const detected = format === 'auto' ? detectFormat(trimmed) : format;

  if (detected === 'unknown') {
    throw new Error(t('importModal.errorDetect'));
  }

  switch (detected) {
    case 'mermaid': {
      const diagram = parseMermaidClassDiagram(trimmed);
      if (diagram.entities.length === 0) {
        throw new Error(t('importModal.errorNoClasses'));
      }
      return {
        architectureJson: JSON.stringify(diagram, null, 2),
        useCasesJson: null,
        sourceFormat: 'mermaid',
      };
    }
    case 'plantuml': {
      const diagram = parsePlantUmlClassDiagram(trimmed);
      if (diagram.entities.length === 0) {
        throw new Error(t('importModal.errorNoClasses'));
      }
      return {
        architectureJson: JSON.stringify(diagram, null, 2),
        useCasesJson: null,
        sourceFormat: 'plantuml',
      };
    }
    case 'toon': {
      const diagram = parseToon(trimmed);
      const split = splitImportedDiagram(diagram, t);
      return { ...split, sourceFormat: 'toon' };
    }
    case 'json': {
      const parsed = JSON.parse(trimmed);
      return splitImportedDiagram(parsed, t);
    }
  }
}

export const ImportModal = forwardRef<HTMLDialogElement, ImportModalProps>(function ImportModal(
  { onClose, onImport },
  ref,
) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<DiagramFormat | 'auto'>('auto');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImport = () => {
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) {
      setError(t('importModal.errorEmpty'));
      return;
    }

    try {
      const payload = processContent(trimmed, format, t);
      onImport(payload);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('importModal.errorParse'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) {
        setError(t('importModal.errorRead'));
        return;
      }

      // Auto-detect format from extension
      let fileFormat: DiagramFormat | 'auto' = 'auto';
      if (file.name.endsWith('.json')) fileFormat = 'json';
      else if (file.name.endsWith('.toon')) fileFormat = 'toon';
      else if (file.name.endsWith('.mmd')) fileFormat = 'mermaid';
      else if (file.name.endsWith('.puml')) fileFormat = 'plantuml';

      try {
        const payload = processContent(content, fileFormat, t);
        onImport(payload);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('importModal.errorParse'));
      }
    };
    reader.readAsText(file);

    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t('importModal.title')}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('importModal.close')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>
        <div className={styles.fileSection}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.toon,.mmd,.puml"
            onChange={handleFileChange}
            className={styles.fileInput}
            aria-label={t('importModal.uploadFile')}
          />
          <button
            type="button"
            className={styles.fileButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            {t('importModal.uploadFile')}
          </button>
          <span className={styles.fileHint}>{t('importModal.fileHint')}</span>
        </div>
        <div className={styles.divider}>
          <span className={styles.dividerText}>{t('importModal.divider')}</span>
        </div>
        <div className={styles.formatSelector}>
          <label className={styles.label}>{t('importModal.formatLabel')}</label>
          <select
            className={styles.select}
            value={format}
            onChange={e => setFormat(e.target.value as DiagramFormat | 'auto')}
          >
            <option value="auto">{t('importModal.autoDetect')}</option>
            <option value="json">{t('importModal.formatJson')}</option>
            <option value="toon">{t('importModal.formatToon')}</option>
            <option value="mermaid">{t('importModal.formatMermaid')}</option>
            <option value="plantuml">{t('importModal.formatPlantUml')}</option>
          </select>
        </div>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('importModal.placeholder')}
          rows={12}
          spellCheck={false}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.importButton} onClick={handleImport} type="button">
          {t('importModal.importButton')}
        </button>
      </div>
    </dialog>
  );
});
