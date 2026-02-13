
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase directe
const firebaseConfig = {
  apiKey: "AIzaSyCOTstDsXsYpBfTr0FZoXI5EqhdKcUnoa0",
  authDomain: "class-workshop-booker.firebaseapp.com",
  projectId: "class-workshop-booker",
  storageBucket: "class-workshop-booker.firebasestorage.app",
  messagingSenderId: "1014586324544",
  appId: "1:1014586324544:web:34c368c013b766d81451a5"
};

let db: any = null;

try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
} catch (error) {
    console.error("Erreur critique lors de l'initialisation de Firebase Firestore:", error);
}

export { db };
