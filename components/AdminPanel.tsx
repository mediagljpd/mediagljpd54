
import React, { useState, useRef, useEffect, useContext } from 'react';
import ManageAnimations from './admin/ManageAnimations';
import ManageCalendar from './admin/ManageCalendar';
import ViewBookings from './admin/ViewBookings';
import ManageSettings from './admin/ManageSettings';
import { AdminView } from './admin/types';
import { PaintBrushIcon, CalendarIcon, ListIcon, CogIcon, CheckIcon, XIcon, ShieldCheckIcon, DownloadIcon } from './Icons';
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { AppContext } from '../AppContext';

// Main Admin Panel Component
const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState<AdminView>('animations');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [dbStatus, setDbStatus] = useState<'connected' | 'error'>('connected');
    const [showBackupAlert, setShowBackupAlert] = useState(false);
    const { settings, currentUser } = useContext(AppContext);
    const notificationTimer = useRef<number | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
        }
        setNotification({ message, type });
        notificationTimer.current = window.setTimeout(() => {
            setNotification(null);
            notificationTimer.current = null;
        }, 3000);
    };
    
    useEffect(() => {
        // Vérification simple de la connectivité DB
        if (!db) {
            setDbStatus('error');
        }

        // Vérification de la date du dernier export (pour les admins)
        if (currentUser?.role === 'admin') {
            const lastExport = settings.lastExportDate;
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            if (!lastExport || new Date(lastExport) < oneMonthAgo) {
                const dismissed = sessionStorage.getItem('backup_alert_dismissed');
                if (!dismissed) {
                    setShowBackupAlert(true);
                }
            }
        }

        return () => {
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
            }
        };
    }, [currentUser, settings.lastExportDate]);

    const renderView = () => {
        const props = { showNotification };
        switch (activeView) {
            case 'animations': return <ManageAnimations {...props} />;
            case 'calendar': return <ManageCalendar {...props} />;
            case 'bookings': return <ViewBookings {...props} />;
            case 'settings': return <ManageSettings {...props} />;
            default: return <ManageAnimations {...props} />;
        }
    };

    const NavLink: React.FC<{ view: AdminView; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                activeView === view
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
        >
            <span className="mr-3">{icon}</span>
            {label}
        </button>
    );

    const handleLogout = async () => {
        try {
            await signOut(auth);
            onLogout();
        } catch (err) {
            console.error("Logout error:", err);
            onLogout();
        }
    };

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            <header className="bg-white shadow-sm z-30 px-6 py-4 flex-shrink-0">
                <div className="max-w-screen-xl mx-auto">
                    <div className="relative flex justify-center items-center">
                        <div className="absolute left-0 flex items-center gap-2">
                             <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                 dbStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                             }`}>
                                 {dbStatus === 'connected' ? (
                                     <><CheckIcon className="w-3 h-3" /> Connecté</>
                                 ) : (
                                     <><XIcon className="w-3 h-3" /> Erreur Base</>
                                 )}
                             </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-blue-600 whitespace-nowrap">Administration</h1>
                        
                        <div className="absolute right-0 flex items-center gap-4">
                            <span className="hidden md:block text-xs text-gray-500 font-medium">Année : {settings.activeYear}</span>
                            <button onClick={handleLogout} className="bg-red-500 text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-red-600 transition-colors">
                                Déconnexion
                            </button>
                        </div>
                    </div>

                    {dbStatus === 'error' && (
                        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs text-center">
                            Attention : La base de données est inaccessible. Vérifiez vos <strong>Règles de sécurité Firestore</strong> dans la console Google Firebase.
                        </div>
                    )}

                    <nav className="flex items-center justify-center flex-wrap gap-3 mt-4">
                       <NavLink view="animations" label="Animations" icon={<PaintBrushIcon className="w-6 h-6" />} />
                       <NavLink view="calendar" label="Calendrier" icon={<CalendarIcon className="w-6 h-6" />} />
                       <NavLink view="bookings" label="Réservations" icon={<ListIcon className="w-6 h-6" />} />
                       {(currentUser?.role === 'admin' || currentUser?.permissions.canModifySettings) && (
                           <NavLink view="settings" label="Paramètres" icon={<CogIcon className="w-6 h-6" />} />
                       )}
                    </nav>
                </div>
            </header>
            
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-screen-xl mx-auto">
                    {renderView()}
                </div>
            </main>
            
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce text-white ${
                    notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
                }`}>
                    {notification.type === 'success' ? '✓' : '✕'} {notification.message}
                </div>
            )}

            {/* Backup Reminder Modal */}
            {showBackupAlert && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-amber-500 p-6 flex flex-col items-center text-white">
                            <div className="bg-white/20 p-4 rounded-full mb-4">
                                <ShieldCheckIcon className="w-12 h-12" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Sécurité des données</h2>
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Sauvegarde recommandée</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Votre dernier export de données date de plus d'un mois (ou n'a jamais été effectué). 
                                Pour éviter toute perte accidentelle, il est conseillé de réaliser un export régulier.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setActiveView('settings');
                                        setShowBackupAlert(false);
                                        sessionStorage.setItem('backup_alert_dismissed', 'true');
                                    }}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                                >
                                    <CogIcon className="w-5 h-5" />
                                    Aller aux paramètres
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBackupAlert(false);
                                        sessionStorage.setItem('backup_alert_dismissed', 'true');
                                    }}
                                    className="w-full py-3 text-gray-500 text-sm font-medium hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
