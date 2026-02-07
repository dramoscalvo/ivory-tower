import { forwardRef } from 'react';
import styles from './AboutModal.module.css';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal = forwardRef<HTMLDialogElement, AboutModalProps>(
  function AboutModal({ onClose }, ref) {
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
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
          <h2 className={styles.title}>About</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>
          <p>
            Ivory Tower is a React application built with TypeScript and Vite.
          </p>
          <p>
            Explore, experiment, and build with modern web technologies.
          </p>
        </div>
      </dialog>
    );
  }
);
