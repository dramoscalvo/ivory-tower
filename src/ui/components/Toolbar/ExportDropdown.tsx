import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Dropdown.module.css';

interface ExportDropdownProps {
  canExport: boolean;
  onExportToon: () => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onExportMermaid: () => void;
}

export function ExportDropdown({
  canExport,
  onExportToon,
  onExportJson,
  onExportSvg,
  onExportMermaid,
}: ExportDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click — genuine side-effect (DOM event listener)
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (handler: () => void) => {
    setOpen(false);
    handler();
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`${styles.trigger} ${styles.triggerPrimary}`}
        onClick={() => setOpen(prev => !prev)}
        disabled={!canExport}
        type="button"
        aria-label={t('toolbar.export')}
        aria-expanded={open}
      >
        {t('toolbar.export')}
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          viewBox="0 0 10 6"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button
            className={`${styles.menuItem} ${styles.menuItemPrimary}`}
            onClick={() => handleItemClick(onExportToon)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.exportToon')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onExportJson)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.exportJson')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onExportSvg)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.exportSvg')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onExportMermaid)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.exportMermaid')}
          </button>
        </div>
      )}
    </div>
  );
}
