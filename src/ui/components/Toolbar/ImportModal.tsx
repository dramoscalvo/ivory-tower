import { forwardRef, useState, useRef } from 'react';
import { detectFormat } from '../../../diagram/infrastructure/formatDetector';
import { parseMermaidClassDiagram } from '../../../diagram/infrastructure/MermaidParser';
import { parsePlantUmlClassDiagram } from '../../../diagram/infrastructure/PlantUmlParser';
import { parseToon } from '../../../diagram/infrastructure/ToonParser';
import type { DiagramFormat } from '../../../diagram/infrastructure/formatDetector';
import styles from './ImportModal.module.css';

interface ImportModalProps {
  onClose: () => void;
  onImport: (json: string) => void;
}

function processContent(content: string, format: DiagramFormat | 'auto'): string {
  const trimmed = content.trim();
  const detectedFormat = format === 'auto' ? detectFormat(trimmed) : format;

  switch (detectedFormat) {
    case 'mermaid': {
      const diagram = parseMermaidClassDiagram(trimmed);
      if (diagram.entities.length === 0) {
        throw new Error('No classes found in the diagram.');
      }
      return JSON.stringify(diagram, null, 2);
    }
    case 'plantuml': {
      const diagram = parsePlantUmlClassDiagram(trimmed);
      if (diagram.entities.length === 0) {
        throw new Error('No classes found in the diagram.');
      }
      return JSON.stringify(diagram, null, 2);
    }
    case 'toon': {
      const diagram = parseToon(trimmed);
      return JSON.stringify(diagram, null, 2);
    }
    case 'json':
      JSON.parse(trimmed);
      return trimmed;
    default:
      throw new Error('Could not detect format. Please select a format manually.');
  }
}

export const ImportModal = forwardRef<HTMLDialogElement, ImportModalProps>(function ImportModal(
  { onClose, onImport },
  ref,
) {
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
      setError('Please paste diagram text or upload a file');
      return;
    }

    try {
      const json = processContent(trimmed, format);
      onImport(json);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse diagram');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setError('Failed to read file');
        return;
      }

      // Auto-detect format from extension
      let fileFormat: DiagramFormat | 'auto' = 'auto';
      if (file.name.endsWith('.json')) fileFormat = 'json';
      else if (file.name.endsWith('.toon')) fileFormat = 'toon';

      try {
        const json = processContent(content, fileFormat);
        onImport(json);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.readAsText(file);

    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
      <header className={styles.header}>
        <h2 className={styles.title}>Import Diagram</h2>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
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
            aria-label="Upload file"
          />
          <button
            type="button"
            className={styles.fileButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            Upload File
          </button>
          <span className={styles.fileHint}>.json, .toon, .mmd, .puml</span>
        </div>
        <div className={styles.divider}>
          <span className={styles.dividerText}>or paste below</span>
        </div>
        <div className={styles.formatSelector}>
          <label className={styles.label}>Format:</label>
          <select
            className={styles.select}
            value={format}
            onChange={e => setFormat(e.target.value as DiagramFormat | 'auto')}
          >
            <option value="auto">Auto-detect</option>
            <option value="json">JSON</option>
            <option value="toon">TOON</option>
            <option value="mermaid">Mermaid</option>
            <option value="plantuml">PlantUML</option>
          </select>
        </div>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste Mermaid, PlantUML, JSON, or TOON diagram here..."
          rows={12}
          spellCheck={false}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.importButton} onClick={handleImport} type="button">
          Import
        </button>
      </div>
    </dialog>
  );
});
