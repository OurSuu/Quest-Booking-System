'use client';

import { Booking } from '@/types';
import styles from './DayDetailModal.module.css';

interface Props {
  dateStr: string;
  bookings: Booking[];
  onClose: () => void;
  onNewBooking: () => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  canBook: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return `${weekday}, ${month} ${day}, ${year}`;
}

export default function DayDetailModal({ dateStr, bookings, onClose, onNewBooking, onEdit, onDelete, canBook }: Props) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Decorative top */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.title}>📜 Quest Log</h2>
            <p className={styles.dateLabel}>{formatDate(dateStr)}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {bookings.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🗺️</span>
              <p>No quests scheduled for this day.</p>
              <p className={styles.emptySubtext}>The map is blank... dare to write your fate?</p>
            </div>
          ) : (
            <div className={styles.questList}>
              {bookings.map(booking => (
                <div key={booking.id} className={styles.questItem}>
                  <div className={styles.questInfo}>
                    <div className={styles.questTime}>
                      <span className={styles.timeIcon}>⏳</span>
                      {booking.time_slot}
                    </div>
                    <div className={styles.questName}>
                      <span className={styles.nameIcon}>⚔</span>
                      {booking.group_name}
                    </div>
                  </div>
                  <div className={styles.questActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => onEdit(booking)}
                      title="Rewrite Fate"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteQuestBtn}
                      onClick={() => onDelete(booking)}
                      title="Cancel Quest"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {canBook && (
          <div className={styles.footer}>
            <button className={styles.newQuestBtn} onClick={onNewBooking}>
              ✦ Register New Quest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
