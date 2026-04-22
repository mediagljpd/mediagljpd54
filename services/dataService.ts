
import { Animation, Booking, AppSettings } from '../types';
import { db, handleFirestoreError } from './firebase';
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
        handleFirestoreError(e, 'write', `animations/${animation.id}`);
    }
  },

  removeAnimation: async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "animations", id));
    } catch (e) {
        handleFirestoreError(e, 'delete', `animations/${id}`);
    }
  },
  
  saveBooking: async (booking: Booking) => {
    if (!db) return;
    try {
        await setDoc(doc(db, "bookings", booking.id), booking);
    } catch (e) {
        handleFirestoreError(e, 'write', `bookings/${booking.id}`);
    }
  },

  saveBookings: async (bookings: Booking[]) => {
    if (!db) return;
    try {
        const promises = bookings.map(b => setDoc(doc(db, "bookings", b.id), b));
        await Promise.all(promises);
    } catch (e) {
        handleFirestoreError(e, 'write', 'bookings (batch)');
    }
  },
  
  removeBooking: async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "bookings", id));
    } catch (e) {
        handleFirestoreError(e, 'delete', `bookings/${id}`);
    }
  },

  saveSettings: async (settings: AppSettings) => {
    if (!db) return;
    try {
        console.log("Saving settings to Firestore...", settings);
        await setDoc(doc(db, "settings", "global"), settings);
        console.log("Settings saved successfully.");
    } catch (e) {
        handleFirestoreError(e, 'write', 'settings/global');
    }
  },
  
  addAdmin: async (uid: string, email: string) => {
    if (!db) return;
    try {
        await setDoc(doc(db, "admins", uid), { email, role: 'admin' });
    } catch (e) {
        handleFirestoreError(e, 'write', `admins/${uid}`);
    }
  }
};
