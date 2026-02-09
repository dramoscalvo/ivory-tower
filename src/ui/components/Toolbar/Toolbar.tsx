import { useRef } from 'react';
import { useExport } from './useExport';
import { ShortcutsHelp } from './ShortcutsHelp';
import { ImportModal } from './ImportModal';
import type { Theme } from '../../hooks/useTheme';
import type { ShareStatus } from '../../hooks/useUrlSharing';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  json: string;
  hasValidDiagram: boolean;
  onLoadExample: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onShare: () => void;
  shareStatus: ShareStatus;
  onImport: (json: string) => void;
}

export function Toolbar({ json, hasValidDiagram, onLoadExample, theme, onToggleTheme, onShare, shareStatus, onImport }: ToolbarProps) {
  const { handleExport, canExport } = useExport(json, hasValidDiagram);
  const shortcutsRef = useRef<HTMLDialogElement>(null);
  const importRef = useRef<HTMLDialogElement>(null);

  const shareLabel = shareStatus === 'copied' ? 'Copied!' : shareStatus === 'error' ? 'Error' : 'Share';

  return (
    <div className={styles.toolbar}>
      <div className={styles.title}>
        <img src="/ivoryTower_1.png" alt="" className={styles.logo} />
        Ivory Tower
      </div>
      <div className={styles.actions}>
        <button
          className={styles.iconButton}
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          )}
        </button>
        <button
          className={styles.iconButton}
          onClick={() => shortcutsRef.current?.showModal()}
          title="Keyboard shortcuts"
          type="button"
          aria-label="Keyboard shortcuts"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
          </svg>
        </button>
        <button
          className={styles.button}
          onClick={() => importRef.current?.showModal()}
          type="button"
        >
          Import
        </button>
        <button className={styles.button} onClick={onLoadExample}>
          Load Example
        </button>
        <button
          className={styles.button}
          onClick={onShare}
          disabled={!hasValidDiagram}
          type="button"
        >
          {shareLabel}
        </button>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={handleExport}
          disabled={!canExport}
        >
          Export TOON
        </button>
      </div>
      <ShortcutsHelp
        ref={shortcutsRef}
        onClose={() => shortcutsRef.current?.close()}
      />
      <ImportModal
        ref={importRef}
        onClose={() => importRef.current?.close()}
        onImport={onImport}
      />
    </div>
  );
}
