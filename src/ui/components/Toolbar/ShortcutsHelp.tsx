import { forwardRef } from 'react';
import styles from './ShortcutsHelp.module.css';

interface ShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'Ctrl+Z', description: 'Undo' },
  { keys: 'Ctrl+Shift+Z / Ctrl+Y', description: 'Redo' },
  { keys: 'Ctrl+Shift+F', description: 'Prettify JSON' },
  { keys: 'Ctrl+Shift+E', description: 'Export diagram' },
  { keys: 'Escape', description: 'Fit diagram to view' },
];

export const ShortcutsHelp = forwardRef<HTMLDialogElement, ShortcutsHelpProps>(
  function ShortcutsHelp({ onClose }, ref) {
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>Keyboard Shortcuts</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <table className={styles.table}>
            <tbody>
              {SHORTCUTS.map(shortcut => (
                <tr key={shortcut.keys}>
                  <td className={styles.keys}>
                    {shortcut.keys.split(' / ').map((key, i) => (
                      <span key={i}>
                        {i > 0 && <span className={styles.separator}>/</span>}
                        <kbd className={styles.kbd}>{key}</kbd>
                      </span>
                    ))}
                  </td>
                  <td className={styles.description}>{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </dialog>
    );
  },
);
