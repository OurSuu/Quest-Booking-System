export interface Booking {
  id: number;
  date: string;
  time_slot: string;
  group_name: string;
  created_at: string;
}

export const TIME_SLOTS = ['13:00–19:00', '21:30–01:30'] as const;

export type TimeSlot = typeof TIME_SLOTS[number];

export const MAX_SLOT_CAPACITY = 1;
