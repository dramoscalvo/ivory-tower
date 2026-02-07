import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';
import styles from './ValidationErrors.module.css';

interface ValidationErrorsProps {
  parseError: string | null;
  validationErrors: ValidationError[];
}

export function ValidationErrors({ parseError, validationErrors }: ValidationErrorsProps) {
  if (!parseError && validationErrors.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {parseError && (
        <div className={styles.error}>
          <span className={styles.label}>Parse Error:</span> {parseError}
        </div>
      )}
      {validationErrors.map((error, index) => (
        <div key={index} className={styles.error}>
          <span className={styles.path}>{error.path || 'root'}</span>: {error.message}
        </div>
      ))}
    </div>
  );
}
