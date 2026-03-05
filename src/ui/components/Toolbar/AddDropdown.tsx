import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Dropdown.module.css';

interface AddDropdownProps {
  entityCount: number;
  onAddEntity: () => void;
  onAddActor: () => void;
  onAddRelationship: () => void;
  onAddUseCase: () => void;
  onAddEndpoint: () => void;
  onAddRule: () => void;
}

export function AddDropdown({
  entityCount,
  onAddEntity,
  onAddActor,
  onAddRelationship,
  onAddUseCase,
  onAddEndpoint,
  onAddRule,
}: AddDropdownProps) {
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
        className={styles.trigger}
        onClick={() => setOpen(prev => !prev)}
        type="button"
        aria-label={t('toolbar.addAction')}
        aria-expanded={open}
      >
        {t('toolbar.add')}
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
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddEntity)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.addEntity')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddActor)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.addActor')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddRelationship)}
            disabled={entityCount < 2}
            type="button"
            role="menuitem"
          >
            {t('toolbar.addRelationship')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddUseCase)}
            disabled={entityCount === 0}
            type="button"
            role="menuitem"
          >
            {t('toolbar.addUseCase')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddEndpoint)}
            type="button"
            role="menuitem"
          >
            {t('toolbar.addEndpoint')}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddRule)}
            disabled={entityCount === 0}
            type="button"
            role="menuitem"
          >
            {t('toolbar.addRule')}
          </button>
        </div>
      )}
    </div>
  );
}
