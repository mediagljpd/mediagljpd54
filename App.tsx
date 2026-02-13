
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Animation, Booking, AppSettings, ChangelogEntry } from './types';
import { dataService } from './services/dataService';
import { db } from './services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import BookingSystem from './components/BookingSystem';
import AdminPanel from './components/AdminPanel';

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

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.HOME);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    homepageTitle: "Réservez votre animation de classe",
    homepageSubtitle: "Choisissez une animation pour voir les créneaux disponibles",
    homepageBgColor: "#f8fafc",
    headerBgColor: "#ffffff",
    titleFontSize: "text-2xl",
    activeYear: "2025-2026",
    holidays: [],
    adminEmail: "",
    footerContent: "",
    animators: [],
  } as AppSettings);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    if (!db) {
        setIsLoading(false);
        return;
    }

    let loadingCount = 4;
    const decrementLoading = () => {
        loadingCount--;
        if (loadingCount <= 0) setIsLoading(false);
    };

    // Note: Si orderBy("order") ne renvoie rien, c'est que vos documents n'ont pas encore ce champ.
    // Une fois que vous aurez réorganisé vos animations une fois en Admin, tout rentrera dans l'ordre.
    const qAnims = query(collection(db, "animations"), orderBy("order", "asc"));
    const unsubAnimations = onSnapshot(qAnims, (snapshot) => {
      let anims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Animation));
      
      // Si la requête ordonnée est vide mais que la collection ne l'est pas (cas de la transition),
      // on pourrait faire une requête simple, mais le plus simple est de gérer les données en Admin.
      setAnimations(anims);
      decrementLoading();
    }, (err) => { 
      console.error("Erreur Snapshot Animations (Trié):", err);
      // Fallback simple si l'index n'est pas encore créé ou champ manquant
      onSnapshot(collection(db, "animations"), (s) => {
          setAnimations(s.docs.map(d => ({ id: d.id, ...d.data() } as Animation)));
          decrementLoading();
      });
    });

    const unsubBookings = onSnapshot(collection(db, "bookings"), (snapshot) => {
      const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(books);
      decrementLoading();
    }, (err) => { console.error("Erreur Snapshot Bookings:", err); decrementLoading(); });

    const unsubSettings = onSnapshot(collection(db, "settings"), (snapshot) => {
      const globalSettings = snapshot.docs.find(doc => doc.id === "global");
      if (globalSettings) setSettings(prev => ({...prev, ...globalSettings.data()}));
      decrementLoading();
    }, (err) => { console.error("Erreur Snapshot Settings:", err); decrementLoading(); });

    const qChangelog = query(collection(db, "changelog"), orderBy("date", "desc"));
    const unsubChangelog = onSnapshot(qChangelog, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangelogEntry));
      setChangelog(logs);
      decrementLoading();
    }, (err) => { console.error("Erreur Snapshot Changelog:", err); decrementLoading(); });

    return () => {
      unsubAnimations(); unsubBookings(); unsubSettings(); unsubChangelog();
    };
  }, []);

  const saveAnimation = useCallback(async (animation: Animation) => {
    await dataService.saveAnimation(animation);
  }, []);

  const removeAnimation = useCallback(async (animationId: string) => {
    await dataService.removeAnimation(animationId);
  }, []);

  const updateAnimationsOrder = useCallback((newAnimations: Animation[]) => {
    const orderedAnims = newAnimations.map((anim, index) => ({
        ...anim,
        order: index
    }));
    
    setAnimations(orderedAnims);
    
    // Sauvegarde persistante de l'ordre
    orderedAnims.forEach(anim => dataService.saveAnimation(anim));
  }, []);

  const saveBooking = useCallback(async (booking: Booking) => {
    await dataService.saveBooking(booking);
  }, []);

  const removeBooking = useCallback(async (bookingId: string) => {
    await dataService.removeBooking(bookingId);
  }, []);

  const updateBookings = useCallback((newBookings: Booking[]) => {
    setBookings(newBookings);
    if (db) dataService.saveBookings(newBookings);
  }, []);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await dataService.saveSettings(newSettings);
  }, []);

  const saveChangelogEntry = useCallback(async (entry: ChangelogEntry) => {
    await dataService.saveChangelogEntry(entry);
  }, []);

  const removeChangelogEntry = useCallback(async (entryId: string) => {
    await dataService.removeChangelogEntry(entryId);
  }, []);
  
  const appContextValue = useMemo(() => ({
    animations,
    bookings,
    settings,
    changelog,
    saveAnimation,
    removeAnimation,
    saveBooking,
    removeBooking,
    updateSettings,
    saveChangelogEntry,
    removeChangelogEntry,
    updateAnimationsOrder,
    updateBookings,
  }), [animations, bookings, settings, changelog, saveAnimation, removeAnimation, saveBooking, removeBooking, updateSettings, saveChangelogEntry, removeChangelogEntry, updateAnimationsOrder, updateBookings]);

  const handleSelectAnimation = (animation: Animation) => {
    setSelectedAnimation(animation);
    setView(View.CALENDAR);
  };

  const handleBackToHome = () => {
    setSelectedAnimation(null);
    setView(View.HOME);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Initialisation des données...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="min-h-screen">
        {isAdmin ? (
          <AdminPanel onLogout={() => { setIsAdmin(false); handleBackToHome(); }} />
        ) : (
          <BookingSystem 
            view={view}
            selectedAnimation={selectedAnimation}
            onSelectAnimation={handleSelectAnimation}
            onBackToHome={handleBackToHome}
            onNavigateToAdmin={() => setView(View.ADMIN_LOGIN)}
            onAdminLogin={() => setIsAdmin(true)}
          />
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
