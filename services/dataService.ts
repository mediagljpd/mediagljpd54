
import { Animation, Booking, AppSettings, ChangelogEntry } from '../types';
import { db } from './firebase';
import { 
  collection, 
  setDoc, 
  doc, 
  deleteDoc
} from "firebase/firestore";

export const dataService = {
  saveAnimation: async (animation: Animation) => {
    if (!db) return;
    try {
        await setDoc(doc(db, "animations", animation.id), animation);
    } catch (e) {
        console.error("Erreur saveAnimation:", e);
        throw e;
    }
  },

  removeAnimation: async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "animations", id));
    } catch (e) {
        console.error("Erreur removeAnimation:", e);
        throw e;
    }
  },
  
  saveBooking: async (booking: Booking) => {
    if (!db) return;
    try {
        await setDoc(doc(db, "bookings", booking.id), booking);
    } catch (e) {
        console.error("Erreur saveBooking:", e);
        throw e;
    }
  },

  saveBookings: async (bookings: Booking[]) => {
    if (!db) return;
    try {
        const promises = bookings.map(b => setDoc(doc(db, "bookings", b.id), b));
        await Promise.all(promises);
    } catch (e) {
        console.error("Erreur saveBookings (mass):", e);
        throw e;
    }
  },
  
  removeBooking: async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "bookings", id));
    } catch (e) {
        console.error("Erreur removeBooking:", e);
        throw e;
    }
  },

  saveSettings: async (settings: AppSettings) => {
    if (!db) return;
    try {
        await setDoc(doc(db, "settings", "global"), settings);
    } catch (e) {
        console.error("Erreur saveSettings:", e);
        throw e;
    }
  },

  saveChangelogEntry: async (entry: ChangelogEntry) => {
    if (!db) return;
    try {
        await setDoc(doc(db, "changelog", entry.id), entry);
    } catch (e) {
        console.error("Erreur saveChangelogEntry:", e);
        throw e;
    }
  },

  removeChangelogEntry: async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "changelog", id));
    } catch (e) {
        console.error("Erreur removeChangelogEntry:", e);
        throw e;
    }
  }
};
