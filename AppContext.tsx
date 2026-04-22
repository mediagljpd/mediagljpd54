
import React from 'react';
import { Animation, Booking, AppSettings, AdminUser } from './types';

export const AppContext = React.createContext<{
  animations: Animation[];
  bookings: Booking[];
  settings: AppSettings;
  currentUser: AdminUser | null;
  setCurrentUser: (user: AdminUser | null) => void;
  saveAnimation: (animation: Animation) => Promise<void>;
  removeAnimation: (animationId: string) => Promise<void>;
  saveBooking: (booking: Booking) => Promise<void>;
  removeBooking: (bookingId: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  updateAnimationsOrder: (animations: Animation[]) => void;
  updateBookings: (bookings: Booking[]) => void;
}>({
  animations: [],
  bookings: [],
  settings: {} as AppSettings,
  currentUser: null,
  setCurrentUser: () => {},
  saveAnimation: async () => {},
  removeAnimation: async () => {},
  saveBooking: async () => {},
  removeBooking: async () => {},
  updateSettings: async () => {},
  updateAnimationsOrder: () => {},
  updateBookings: () => {},
});
