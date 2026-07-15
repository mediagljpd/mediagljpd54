
import { Animation, Booking, AppSettings } from '../types';
import { db, handleFirestoreError } from './firebase';
import { 
  collection, 
  setDoc, 
  doc, 
  deleteDoc,
  runTransaction
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
  
  saveBooking: async (booking: Booking, animatorName?: string, currentBookings?: Booking[], animations?: Animation[]) => {
    if (!db) return;
    const bookingRef = doc(db, "bookings", booking.id);
    const dayLocksRef = doc(db, "dayLocks", booking.date);
    
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Vérifier si la réservation existe déjà (mise à jour)
            const bookingSnap = await transaction.get(bookingRef);
            const isUpdate = bookingSnap.exists();
            const oldBooking = isUpdate ? (bookingSnap.data() as Booking) : null;
            
            // 2. Récupérer ou reconstruire les verrous du jour
            const dayLocksSnap = await transaction.get(dayLocksRef);
            let existingDayBookings: any[] = [];
            
            if (dayLocksSnap.exists()) {
                existingDayBookings = dayLocksSnap.data().bookings || [];
            } else if (currentBookings && animations) {
                const animMap = new Map<string, string>();
                animations.forEach(a => {
                    if (a.animator) animMap.set(a.id, a.animator);
                });
                // Reconstruction automatique
                existingDayBookings = currentBookings
                    .filter(b => b.date === booking.date)
                    .map(b => ({
                        id: b.id,
                        time: Number(b.time),
                        animator: animMap.get(b.animationId) || "",
                        animationId: b.animationId
                    }));
            }
            
            // 3. Exclure la réservation actuelle en cas de mise à jour pour éviter l'auto-conflit
            let filteredDayBookings = existingDayBookings;
            if (isUpdate) {
                filteredDayBookings = existingDayBookings.filter(b => b.id !== booking.id);
            }
            
            // 4. Contrôles de concurrence et d'intégrité
            // Conflit d'horaire exact
            const slotConflict = filteredDayBookings.find(b => Number(b.time) === Number(booking.time));
            if (slotConflict) {
                throw new Error("Ce créneau horaire est déjà réservé par un autre enseignant.");
            }
            
            // Limite d'après-midi (un seul atelier l'après-midi, soit à 14h soit à 15h)
            const timeVal = Number(booking.time);
            const isAfternoonSlot = timeVal === 14 || timeVal === 15;
            if (isAfternoonSlot) {
                const afternoonConflict = filteredDayBookings.find(b => Number(b.time) === 14 || Number(b.time) === 15);
                if (afternoonConflict) {
                    throw new Error("L'après-midi est déjà réservé par un autre enseignant.");
                }
            }
            
            // Conflit d'animateur (un animateur ne peut avoir qu'une animation par jour)
            if (animatorName && animatorName.trim() !== "") {
                const cleanAnimator = animatorName.trim().toLowerCase();
                const animatorConflict = filteredDayBookings.find(b => b.animator?.trim().toLowerCase() === cleanAnimator);
                if (animatorConflict) {
                    throw new Error(`L'animateur ${animatorName} a déjà une animation réservée ce jour-là.`);
                }
            }
            
            // 5. Mettre à jour les verrous de la date cible
            const newLockItem = {
                id: booking.id,
                time: Number(booking.time),
                animator: animatorName || "",
                animationId: booking.animationId
            };
            const updatedDayBookings = [...filteredDayBookings, newLockItem];
            transaction.set(dayLocksRef, { bookings: updatedDayBookings }, { merge: true });
            
            // 6. Nettoyer les verrous de l'ancienne date si la date a été modifiée
            if (isUpdate && oldBooking && oldBooking.date !== booking.date) {
                const oldDayLocksRef = doc(db, "dayLocks", oldBooking.date);
                const oldDayLocksSnap = await transaction.get(oldDayLocksRef);
                if (oldDayLocksSnap.exists()) {
                    const oldExisting = oldDayLocksSnap.data().bookings || [];
                    const updatedOldExisting = oldExisting.filter(b => b.id !== booking.id);
                    transaction.set(oldDayLocksRef, { bookings: updatedOldExisting }, { merge: true });
                }
            }
            
            // 7. Enregistrer le document de réservation
            transaction.set(bookingRef, booking, { merge: true });
        });
    } catch (e: any) {
        console.error("Erreur de transaction dans saveBooking:", e);
        handleFirestoreError(e, 'write', `bookings/${booking.id}`);
    }
  },

  saveBookings: async (bookings: Booking[], animations?: Animation[]) => {
    if (!db) return;
    try {
        const bookingsByDate: Record<string, Booking[]> = {};
        bookings.forEach(b => {
            if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
            bookingsByDate[b.date].push(b);
        });

        const animMap = new Map<string, string>();
        if (animations) {
            animations.forEach(a => {
                if (a.animator) animMap.set(a.id, a.animator);
            });
        }

        for (const [date, dateBookings] of Object.entries(bookingsByDate)) {
            const dayLocksRef = doc(db, "dayLocks", date);
            const lockItems = dateBookings.map(b => ({
                id: b.id,
                time: Number(b.time),
                animator: animMap.get(b.animationId) || "",
                animationId: b.animationId
            }));

            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(dayLocksRef);
                let existingLocks: any[] = [];
                if (snap.exists()) {
                    existingLocks = snap.data().bookings || [];
                }
                const existingIds = new Set(existingLocks.map(l => l.id));
                const newLocks = lockItems.filter(l => !existingIds.has(l.id));
                transaction.set(dayLocksRef, { bookings: [...existingLocks, ...newLocks] }, { merge: true });
            });
        }

        const promises = bookings.map(b => setDoc(doc(db, "bookings", b.id), b));
        await Promise.all(promises);
    } catch (e) {
        handleFirestoreError(e, 'write', 'bookings (batch)');
    }
  },
  
  removeBooking: async (id: string) => {
    if (!db) return;
    const bookingRef = doc(db, "bookings", id);
    try {
        await runTransaction(db, async (transaction) => {
            const bookingSnap = await transaction.get(bookingRef);
            if (bookingSnap.exists()) {
                const booking = bookingSnap.data() as Booking;
                const dayLocksRef = doc(db, "dayLocks", booking.date);
                const dayLocksSnap = await transaction.get(dayLocksRef);
                if (dayLocksSnap.exists()) {
                    const dayLocksData = dayLocksSnap.data();
                    const existingDayBookings: any[] = dayLocksData.bookings || [];
                    const updatedDayBookings = existingDayBookings.filter(b => b.id !== id);
                    transaction.set(dayLocksRef, { bookings: updatedDayBookings }, { merge: true });
                }
            }
            transaction.delete(bookingRef);
        });
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
