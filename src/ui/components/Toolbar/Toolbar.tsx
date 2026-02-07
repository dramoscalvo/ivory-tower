import { useExport } from './useExport';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  json: string;
  hasValidDiagram: boolean;
  onLoadExample: () => void;
}

export function Toolbar({ json, hasValidDiagram, onLoadExample }: ToolbarProps) {
  const { handleExport, canExport } = useExport(json, hasValidDiagram);

  return (
    <div className={styles.toolbar}>
      <div className={styles.title}>
        <img src="/ivoryTower_1.png" alt="" className={styles.logo} />
        Ivory Tower
      </div>
      <div className={styles.actions}>
        <button className={styles.button} onClick={onLoadExample}>
          Load Example
        </button>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={handleExport}
          disabled={!canExport}
        >
          Export TOON
        </button>
      </div>
    </div>
  );
}
