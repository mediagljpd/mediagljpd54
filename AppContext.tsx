
import React from 'react';
import { Animation, Booking, AppSettings, ChangelogEntry } from './types';

export const AppContext = React.createContext<{
  animations: Animation[];
  bookings: Booking[];
  settings: AppSettings;
  changelog: ChangelogEntry[];
  saveAnimation: (animation: Animation) => Promise<void>;
  removeAnimation: (animationId: string) => Promise<void>;
  saveBooking: (booking: Booking) => Promise<void>;
  removeBooking: (bookingId: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  saveChangelogEntry: (entry: ChangelogEntry) => Promise<void>;
  removeChangelogEntry: (entryId: string) => Promise<void>;
  updateAnimationsOrder: (animations: Animation[]) => void;
  updateBookings: (bookings: Booking[]) => void;
}>({
  animations: [],
  bookings: [],
  settings: {} as AppSettings,
  changelog: [],
  saveAnimation: async () => {},
  removeAnimation: async () => {},
  saveBooking: async () => {},
  removeBooking: async () => {},
  updateSettings: async () => {},
  saveChangelogEntry: async () => {},
  removeChangelogEntry: async () => {},
  updateAnimationsOrder: () => {},
  updateBookings: () => {},
});
