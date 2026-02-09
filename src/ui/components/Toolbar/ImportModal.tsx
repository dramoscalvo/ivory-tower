import { forwardRef, useState } from 'react';
import { detectFormat } from '../../../diagram/infrastructure/formatDetector';
import { parseMermaidClassDiagram } from '../../../diagram/infrastructure/MermaidParser';
import { parsePlantUmlClassDiagram } from '../../../diagram/infrastructure/PlantUmlParser';
import type { DiagramFormat } from '../../../diagram/infrastructure/formatDetector';
import styles from './ImportModal.module.css';

interface ImportModalProps {
  onClose: () => void;
  onImport: (json: string) => void;
}

export const ImportModal = forwardRef<HTMLDialogElement, ImportModalProps>(
  function ImportModal({ onClose, onImport }, ref) {
    const [input, setInput] = useState('');
    const [format, setFormat] = useState<DiagramFormat | 'auto'>('auto');
    const [error, setError] = useState<string | null>(null);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    const handleImport = () => {
      setError(null);
      const trimmed = input.trim();
      if (!trimmed) {
        setError('Please paste diagram text');
        return;
      }

      const detectedFormat = format === 'auto' ? detectFormat(trimmed) : format;

      try {
        let diagram;
        switch (detectedFormat) {
          case 'mermaid':
            diagram = parseMermaidClassDiagram(trimmed);
            break;
          case 'plantuml':
            diagram = parsePlantUmlClassDiagram(trimmed);
            break;
          case 'json':
            // Validate it's parseable JSON
            JSON.parse(trimmed);
            onImport(trimmed);
            onClose();
            return;
          default:
            setError('Could not detect format. Please select Mermaid or PlantUML.');
            return;
        }

        if (diagram.entities.length === 0) {
          setError('No classes found in the diagram.');
          return;
        }

        const json = JSON.stringify(diagram, null, 2);
        onImport(json);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse diagram');
      }
    };

    return (
      <dialog
        ref={ref}
        className={styles.dialog}
        onClick={handleBackdropClick}
        onClose={onClose}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Import Diagram</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.formatSelector}>
            <label className={styles.label}>Format:</label>
            <select
              className={styles.select}
              value={format}
              onChange={(e) => setFormat(e.target.value as DiagramFormat | 'auto')}
            >
              <option value="auto">Auto-detect</option>
              <option value="mermaid">Mermaid</option>
              <option value="plantuml">PlantUML</option>
            </select>
          </div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste Mermaid or PlantUML class diagram here..."
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
  }
);
