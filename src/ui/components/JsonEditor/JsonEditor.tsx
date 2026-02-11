import { forwardRef, useRef, useImperativeHandle } from 'react';
import { CodeEditor } from './CodeEditor';
import { ValidationErrors } from './ValidationErrors';
import type { CodeEditorHandle } from './CodeEditor';
import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';
import styles from './JsonEditor.module.css';

export type FontSize = 'xs' | 'sm' | 'base' | 'md' | 'lg';

const FONT_SIZES: FontSize[] = ['xs', 'sm', 'base', 'md', 'lg'];

export interface JsonEditorHandle {
  scrollToLine(line: number): void;
  focus(): void;
  prettify(): void;
}

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
  validationErrors: ValidationError[];
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  vimMode: boolean;
  onVimModeChange: (enabled: boolean) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  highlightedLines?: number[];
  onErrorClick?: (line: number) => void;
}

export const JsonEditor = forwardRef<JsonEditorHandle, JsonEditorProps>(function JsonEditor(
  {
    value,
    onChange,
    parseError,
    validationErrors,
    fontSize,
    onFontSizeChange,
    vimMode,
    onVimModeChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    highlightedLines,
    onErrorClick,
  },
  ref,
) {
  const codeEditorRef = useRef<CodeEditorHandle>(null);

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(value);
      const prettified = JSON.stringify(parsed, null, 2);
      onChange(prettified);
    } catch {
      // If JSON is invalid, do nothing - parse error is already shown
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToLine(line: number) {
      codeEditorRef.current?.scrollToLine(line);
    },
    focus() {
      codeEditorRef.current?.focus();
    },
    prettify() {
      handlePrettify();
    },
  }));

  const currentIndex = FONT_SIZES.indexOf(fontSize);

  const handleDecreaseFontSize = () => {
    if (currentIndex > 0) {
      onFontSizeChange(FONT_SIZES[currentIndex - 1]);
    }
  };

  const handleIncreaseFontSize = () => {
    if (currentIndex < FONT_SIZES.length - 1) {
      onFontSizeChange(FONT_SIZES[currentIndex + 1]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.editorHeader}>
        <div className={styles.fontControls}>
          <button
            className={styles.fontButton}
            onClick={handleDecreaseFontSize}
            disabled={currentIndex === 0}
            title="Decrease font size"
            type="button"
            aria-label="Decrease font size"
          >
            A−
          </button>
          <button
            className={styles.fontButton}
            onClick={handleIncreaseFontSize}
            disabled={currentIndex === FONT_SIZES.length - 1}
            title="Increase font size"
            type="button"
            aria-label="Increase font size"
          >
            A+
          </button>
          <button
            className={`${styles.fontButton} ${vimMode ? styles.vimActive : ''}`}
            onClick={() => onVimModeChange(!vimMode)}
            title={vimMode ? 'Disable Vim mode' : 'Enable Vim mode'}
            type="button"
            aria-label="Toggle Vim mode"
            aria-pressed={vimMode}
          >
            Vim
          </button>
        </div>
        <div className={styles.headerActions}>
          {onUndo && (
            <button
              className={styles.fontButton}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              type="button"
              aria-label="Undo"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
              </svg>
            </button>
          )}
          {onRedo && (
            <button
              className={styles.fontButton}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              type="button"
              aria-label="Redo"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.06-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
              </svg>
            </button>
          )}
          <button
            className={styles.prettifyButton}
            onClick={handlePrettify}
            title="Prettify JSON (Ctrl+Shift+F)"
            type="button"
          >
            {'{ }'}
          </button>
        </div>
      </div>
      <CodeEditor
        ref={codeEditorRef}
        value={value}
        onUpdate={onChange}
        fontSize={`var(--font-${fontSize})`}
        highlightedLines={highlightedLines}
        vimMode={vimMode}
      />
      <ValidationErrors
        parseError={parseError}
        validationErrors={validationErrors}
        onErrorClick={onErrorClick}
      />
    </div>
  );
});
