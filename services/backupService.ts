
import { collection, getDocs, writeBatch, doc, query } from 'firebase/firestore';
import { db } from './firebase';
import { AppSettings, Booking, Animation } from '../types';

export interface AppBackup {
    version: string;
    timestamp: string;
    data: {
        settings: AppSettings | null;
        bookings: Booking[];
        animations: Animation[];
    }
}

export const backupService = {
    /**
     * Export all app data to a JSON object
     */
    exportData: async (): Promise<AppBackup | null> => {
        if (!db) return null;

        try {
            // Fetch everything
            const settingsSnap = await getDocs(collection(db, "settings"));
            const bookingsSnap = await getDocs(collection(db, "bookings"));
            const animationsSnap = await getDocs(collection(db, "animations"));

            const settings = settingsSnap.docs.find(d => d.id === 'global')?.data() as AppSettings || null;
            const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
            const animations = animationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Animation));

            return {
                version: "1.0",
                timestamp: new Date().toISOString(),
                data: {
                    settings,
                    bookings,
                    animations
                }
            };
        } catch (error) {
            console.error("Erreur lors de l'export des données:", error);
            throw error;
        }
    },

    /**
     * Restore app data from a backup object
     * WARNING: This overwrites or adds data. It does NOT delete existing data that is NOT in the backup.
     * To do a full clean restoration, we would need to delete target collections first.
     */
    restoreData: async (backup: AppBackup, progressCallback?: (msg: string) => void): Promise<void> => {
        if (!db) throw new Error("Base de données indisponible");

        const batch = writeBatch(db);
        const { settings, bookings, animations } = backup.data;

        // 1. Restore Settings
        if (settings) {
            progressCallback?.("Restauration des paramètres...");
            batch.set(doc(db, "settings", "global"), settings);
        }

        // 2. Restore Animations
        if (animations && animations.length > 0) {
            progressCallback?.(`Restauration de ${animations.length} animations...`);
            animations.forEach(anim => {
                const { id, ...data } = anim;
                batch.set(doc(db, "animations", id), data);
            });
        }

        // Commiting first batch for performance and size limits (max 500 writes per batch in Firestore)
        // Note: we might have more than 500 bookings.
        await batch.commit();

        // 4. Restore Bookings (can be many, so we use batches of 400)
        if (bookings && bookings.length > 0) {
            const chunks = [];
            for (let i = 0; i < bookings.length; i += 400) {
                chunks.push(bookings.slice(i, i + 400));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                progressCallback?.(`Restauration des réservations (tranche ${i + 1}/${chunks.length})...`);
                const bBatch = writeBatch(db);
                chunk.forEach(booking => {
                    const { id, ...data } = booking;
                    bBatch.set(doc(db, "bookings", id), data);
                });
                await bBatch.commit();
            }
        }
        
        progressCallback?.("Restauration terminée avec succès !");
    },

    downloadBackup: (backup: AppBackup) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `backup_anim_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
};
