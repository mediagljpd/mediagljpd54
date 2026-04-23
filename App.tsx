
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Animation, Booking, AppSettings, AdminUser, CustomLegalPage } from './types';
import { AppContext } from './AppContext';
import { dataService } from './services/dataService';
import { db } from './services/firebase';
import { collection, onSnapshot, query, orderBy, writeBatch, doc, getDocs, where, limit } from 'firebase/firestore';
import BookingSystem from './components/BookingSystem';
import AdminPanel from './components/AdminPanel';

export function App() {
  const [view, setView] = useState<View>(View.HOME);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [selectedInfoPage, setSelectedInfoPage] = useState<CustomLegalPage | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  
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
    headerInfoText: "",
    headerInfoFontSize: "text-[10px]",
    headerInfoFontWeight: "font-normal",
    headerInfoFontStyle: "normal",
    headerInfoColor: "#6b7280",
    headerInfoWidth: 200,
    animators: [],
    legalNotice: `
      <h2>1. Présentation du site</h2>
      <p>En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :</p>
      <p><strong>Propriétaire</strong> : [Nom de l'établissement / Collectivité] – [Adresse complète]</p>
      <p><strong>Responsable publication</strong> : [Nom du responsable] – [Email de contact]</p>
      <p><strong>Webmaster</strong> : [Nom du webmaster] – [Email du webmaster]</p>
      <p><strong>Hébergeur</strong> : Netlify – 2325 3rd Street, Suite 296, San Francisco, California 94107</p>

      <h2>2. Conditions générales d’utilisation du site et des services proposés</h2>
      <p>L’utilisation du site implique l’acceptation pleine et entière des conditions générales d’utilisation ci-après décrites. Ces conditions d’utilisation sont susceptibles d’être modifiées ou complétées à tout moment.</p>

      <h2>3. Description des services fournis</h2>
      <p>Le site a pour objet de fournir une information concernant l’ensemble des activités de la structure et de permettre la réservation d'animations pédagogiques.</p>

      <h2>4. Propriété intellectuelle et contrefaçons</h2>
      <p>[Nom de l'établissement] est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels.</p>

      <h2>5. Limitations de responsabilité</h2>
      <p>[Nom de l'établissement] ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l’utilisateur, lors de l’accès au site.</p>
    `,
    privacyPolicy: `
      <h2>1. Gestion des données personnelles</h2>
      <p>En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et le Règlement Général sur la Protection des Données (RGPD : n° 2016-679).</p>

      <h2>2. Finalité des données collectées</h2>
      <p>Le site est susceptible de traiter tout ou partie des données :</p>
      <ul>
        <li>Pour permettre la navigation sur le site</li>
        <li>Pour prévenir et lutter contre la fraude informatique</li>
        <li>Pour améliorer la navigation sur le site</li>
        <li>Pour gérer les réservations d'animations (Nom, Email, Téléphone, École)</li>
      </ul>

      <h2>3. Droit d’accès, de rectification et d’opposition</h2>
      <p>Conformément à la réglementation européenne en vigueur, les Utilisateurs disposent des droits suivants :</p>
      <ul>
        <li>Droit d'accès (article 15 RGPD) et de rectification (article 16 RGPD)</li>
        <li>Droit à l'effacement (article 17 du RGPD)</li>
        <li>Droit de retirer à tout moment un consentement (article 13-2c RGPD)</li>
        <li>Droit à la limitation du traitement des données (article 18 RGPD)</li>
      </ul>
      <p>Pour exercer ces droits, contactez : [Email de contact DPO / Responsable]</p>

      <h2>4. Non-communication des données personnelles</h2>
      <p>Le site s’interdit de traiter, héberger ou transférer les Informations collectées sur ses Clients vers un pays situé en dehors de l’Union européenne ou reconnu comme « non adéquat » par la Commission européenne sans en informer préalablement le client.</p>
    `,
    cookiesPolicy: `
      <h2>1. Qu'est-ce qu'un cookie ?</h2>
      <p>Un « cookie » est un petit fichier d’information envoyé sur le navigateur de l’Utilisateur et enregistré au sein du terminal de l’Utilisateur. Ce fichier comprend des informations telles que le nom de domaine de l’Utilisateur, le fournisseur d’accès Internet de l’Utilisateur, le système d’exploitation de l’Utilisateur, ainsi que la date et l’heure d’accès.</p>

      <h2>2. Utilisation des cookies sur ce site</h2>
      <p>Ce site utilise des cookies strictement nécessaires à son bon fonctionnement :</p>
      <ul>
        <li><strong>Cookies de session</strong> : Pour maintenir votre connexion ou l'état de votre réservation en cours.</li>
        <li><strong>Cookies de sécurité</strong> : Pour prévenir les attaques malveillantes.</li>
      </ul>

      <h2>3. Cookies tiers</h2>
      <p>Ce site n'utilise pas de cookies publicitaires. Des cookies de mesure d'audience anonymes peuvent être utilisés pour améliorer l'expérience utilisateur.</p>

      <h2>4. Comment désactiver les cookies ?</h2>
      <p>L’Utilisateur peut configurer son navigateur pour qu’il lui permette de décider s’il souhaite ou non les accepter de manière à ce que des Cookies soient enregistrés dans le terminal ou, au contraire, qu’ils soient rejetés.</p>
    `,
  } as AppSettings);

  // 1. Chargement des paramètres (toujours actif)
  useEffect(() => {
    if (!db) {
        setSettingsLoaded(true);
        return;
    }

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppSettings;
        
        // Ensure legal templates have defaults if missing in DB
        const mergedData = { ...data };
        if (!mergedData.legalNotice) mergedData.legalNotice = settings.legalNotice;
        if (!mergedData.privacyPolicy) mergedData.privacyPolicy = settings.privacyPolicy;
        if (!mergedData.cookiesPolicy) mergedData.cookiesPolicy = settings.cookiesPolicy;

        setSettings(prev => ({...prev, ...mergedData}));
      }
      setSettingsLoaded(true);
    }, (err) => { 
      console.error("Erreur Snapshot Settings:", err); 
      setSettingsLoaded(true);
    });

    return () => unsubSettings();
  }, []);

  // 2. Chargement des données métier (filtré par année scolaire pour économiser les quotas)
  useEffect(() => {
    if (!db || !settingsLoaded) return;

    let animationsLoaded = false;
    let bookingsLoaded = false;

    const checkAllLoaded = () => {
        if (animationsLoaded && bookingsLoaded) {
            setIsDataLoading(false);
        }
    };

    // Chargement des animations (fixe)
    const qAnims = query(collection(db, "animations"), orderBy("order", "asc"));
    const unsubAnimations = onSnapshot(qAnims, (snapshot) => {
      setAnimations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Animation)));
      animationsLoaded = true;
      checkAllLoaded();
    }, (err) => { 
      console.error("Erreur Snapshot Animations:", err);
      animationsLoaded = true;
      checkAllLoaded();
    });

    // Filtre des réservations par année scolaire (OPTIMISATION CRITIQUE)
    // On ne récupère que les réservations de l'année scolaire active pour éviter de lire 
    // des milliers de vieux documents à chaque chargement.
    const [yearStart] = settings.activeYear.split('-').map(Number);
    const startDate = `${yearStart}-01-01`; // On prend large pour couvrir l'année
    const endDate = `${yearStart + 1}-12-31`;

    const qBookings = query(
        collection(db, "bookings"), 
        where("date", ">=", startDate), 
        where("date", "<=", endDate)
    );

    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      bookingsLoaded = true;
      checkAllLoaded();
    }, (err) => { 
      console.error("Erreur Snapshot Bookings filtré:", err); 
      // Si l'index n'est pas encore créé, on peut avoir une erreur, fallback sans filtre si nécessaire 
      // mais en production l'index sera là.
      bookingsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubAnimations(); unsubBookings();
    };
  }, [db, settingsLoaded, settings.activeYear]);

  // Auto-cleanup logic
  useEffect(() => {
    if (!db || !settings.autoCleanupEnabled) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();

    const targetMonth = settings.cleanupMonth ?? 7; // August
    const targetDay = settings.cleanupDay ?? 1;

    // Check if we should run cleanup
    // We run it if:
    // 1. We haven't run it this year yet (lastCleanupYear < currentYear)
    // 2. Today is >= the target date
    const shouldRun = (settings.lastCleanupYear || 0) < currentYear && 
                      (currentMonth > targetMonth || (currentMonth === targetMonth && currentDay >= targetDay));

    if (shouldRun) {
      const runCleanup = async () => {
        try {
          // Determine the school year to clean up
          // If we are in August 2026, we clean up "2025-2026"
          const prevYear = currentYear - 1;
          const schoolYearToClean = `${prevYear}-${currentYear}`;
          
          console.log(`Running auto-cleanup for school year: ${schoolYearToClean}`);

          const bookingsRef = collection(db, "bookings");
          // We don't have a schoolYear field on bookings, but we can filter by date
          // School year usually starts in Sept (month 8) and ends in June (month 5)
          // Oct 2025 to June 2026
          const startDate = `${prevYear}-08-01`; // Start of cleanup range
          const endDate = `${currentYear}-07-31`;   // End of cleanup range

          const q = query(
            bookingsRef, 
            where("date", ">=", startDate),
            where("date", "<=", endDate)
          );

          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            console.log("No bookings found for cleanup range.");
          } else {
            const batch = writeBatch(db);
            let count = 0;
            snapshot.docs.forEach((d) => {
              const data = d.data();
              // Only anonymize if not already anonymized
              if (data.teacherName !== "[Anonymisé]") {
                batch.update(d.ref, {
                  teacherName: "[Anonymisé]",
                  phoneNumber: "[Anonymisé]",
                  email: "[Anonymisé]"
                });
                count++;
              }
            });

            if (count > 0) {
              await batch.commit();
              console.log(`${count} bookings anonymized.`);
            }
          }

          // Update settings to mark cleanup as done for this year
          await dataService.saveSettings({
            ...settings,
            lastCleanupYear: currentYear
          });

        } catch (error) {
          console.error("Error during auto-cleanup:", error);
        }
      };

      runCleanup();
    }
  }, [db, settings]);

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
  
  const appContextValue = useMemo(() => ({
    animations,
    bookings,
    settings,
    currentUser,
    setCurrentUser,
    saveAnimation,
    removeAnimation,
    saveBooking,
    removeBooking,
    updateSettings,
    updateAnimationsOrder,
    updateBookings,
  }), [animations, bookings, settings, currentUser, saveAnimation, removeAnimation, saveBooking, removeBooking, updateSettings, updateAnimationsOrder, updateBookings]);

  const handleSelectAnimation = (animation: Animation) => {
    setSelectedAnimation(animation);
    setView(View.CALENDAR);
  };

  const handleBackToHome = () => {
    setSelectedAnimation(null);
    setSelectedInfoPage(null);
    setView(View.HOME);
    window.scrollTo(0, 0);
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  if (!settingsLoaded || isDataLoading) {
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
          <AdminPanel onLogout={() => { setIsAdmin(false); setCurrentUser(null); handleBackToHome(); }} />
        ) : (
          <BookingSystem 
            view={view}
            selectedAnimation={selectedAnimation}
            onSelectAnimation={handleSelectAnimation}
            onBackToHome={handleBackToHome}
            onNavigate={handleNavigate}
            onNavigateToAdmin={() => setView(View.ADMIN_LOGIN)}
            onAdminLogin={() => setIsAdmin(true)}
            selectedInfoPage={selectedInfoPage}
            onSelectInfoPage={setSelectedInfoPage}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}

