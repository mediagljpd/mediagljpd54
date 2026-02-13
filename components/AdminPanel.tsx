
import React, { useState, useRef, useEffect, useContext } from 'react';
import ManageAnimations from './admin/ManageAnimations';
import ManageCalendar from './admin/ManageCalendar';
import ViewBookings from './admin/ViewBookings';
import ManageJournal from './admin/ManageJournal';
import ManageSettings from './admin/ManageSettings';
import RecrePanel from './admin/RecrePanel';
import { AdminView } from './admin/types';
import { PaintBrushIcon, CalendarIcon, ListIcon, SparklesIcon, JournalIcon, CogIcon, CheckIcon, XIcon } from './Icons';
import { db } from '../services/firebase';
import { AppContext } from '../App';

// Main Admin Panel Component
const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState<AdminView>('animations');
    const [notification, setNotification] = useState<string | null>(null);
    const [dbStatus, setDbStatus] = useState<'connected' | 'error'>('connected');
    const { settings } = useContext(AppContext);
    const notificationTimer = useRef<number | null>(null);

    const showNotification = (message: string) => {
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
        }
        setNotification(message);
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
        return () => {
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
            }
        };
    }, []);

    const renderView = () => {
        const props = { showNotification };
        switch (activeView) {
            case 'animations': return <ManageAnimations {...props} />;
            case 'calendar': return <ManageCalendar {...props} />;
            case 'bookings': return <ViewBookings {...props} />;
            case 'recre': return <RecrePanel {...props} />;
            case 'journal': return <ManageJournal {...props} />;
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
                            <button onClick={onLogout} className="bg-red-500 text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-red-600 transition-colors">
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
                       <NavLink view="recre" label="Récré !" icon={<SparklesIcon className="w-6 h-6" />} />
                       <NavLink view="journal" label="Journal" icon={<JournalIcon className="w-6 h-6" />} />
                       <NavLink view="settings" label="Paramètres" icon={<CogIcon className="w-6 h-6" />} />
                    </nav>
                </div>
            </header>
            
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-screen-xl mx-auto">
                    {renderView()}
                </div>
            </main>
            
            {notification && (
                <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce">
                    ✓ {notification}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
