'use client';

import styles from './ConfirmModal.module.css';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, loading }: Props) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Retreat
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={loading}>
            {loading ? 'Cancelling...' : 'Cancel Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
