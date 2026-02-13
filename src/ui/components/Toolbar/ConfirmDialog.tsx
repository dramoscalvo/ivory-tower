import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmDialog = forwardRef<HTMLDialogElement, ConfirmDialogProps>(
  function ConfirmDialog({ onClose, onConfirm, title, message }, ref) {
    const { t } = useTranslation();
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    const handleConfirm = () => {
      onConfirm();
      onClose();
    };

    return (
      <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </header>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            {t('confirmDialog.cancel')}
          </button>
          <button type="button" className={styles.confirmButton} onClick={handleConfirm}>
            {t('confirmDialog.confirm')}
          </button>
        </div>
      </dialog>
    );
  },
);
