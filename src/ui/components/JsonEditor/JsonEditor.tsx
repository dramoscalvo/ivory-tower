import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';
import { ValidationErrors } from './ValidationErrors';
import styles from './JsonEditor.module.css';

export type FontSize = 'xs' | 'sm' | 'base' | 'md' | 'lg';

const FONT_SIZES: FontSize[] = ['xs', 'sm', 'base', 'md', 'lg'];

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
  validationErrors: ValidationError[];
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

export function JsonEditor({ value, onChange, parseError, validationErrors, fontSize, onFontSizeChange }: JsonEditorProps) {
  const hasErrors = parseError !== null || validationErrors.length > 0;

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(value);
      const prettified = JSON.stringify(parsed, null, 2);
      onChange(prettified);
    } catch {
      // If JSON is invalid, do nothing - parse error is already shown
    }
  };

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
        </div>
        <button className={styles.prettifyButton} onClick={handlePrettify} title="Prettify JSON" type="button">
          {'{ }'}
        </button>
      </div>
      <textarea
        className={`${styles.textarea} ${hasErrors ? styles.hasErrors : ''}`}
        style={{ fontSize: `var(--font-${fontSize})` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Enter JSON..."
      />
      <ValidationErrors parseError={parseError} validationErrors={validationErrors} />
    </div>
  );
}
