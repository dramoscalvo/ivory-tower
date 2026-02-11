import { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

interface AddDropdownProps {
  entityCount: number;
  onAddEntity: () => void;
  onAddRelationship: () => void;
  onAddUseCase: () => void;
  onAddEndpoint: () => void;
}

export function AddDropdown({
  entityCount,
  onAddEntity,
  onAddRelationship,
  onAddUseCase,
  onAddEndpoint,
}: AddDropdownProps) {
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
        aria-label="Add"
        aria-expanded={open}
      >
        + Add
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          viewBox="0 0 10 6"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
            + Entity
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddRelationship)}
            disabled={entityCount < 2}
            type="button"
            role="menuitem"
          >
            + Relationship
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddUseCase)}
            disabled={entityCount === 0}
            type="button"
            role="menuitem"
          >
            + Use Case
          </button>
          <button
            className={styles.menuItem}
            onClick={() => handleItemClick(onAddEndpoint)}
            type="button"
            role="menuitem"
          >
            + Endpoint
          </button>
        </div>
      )}
    </div>
  );
}
