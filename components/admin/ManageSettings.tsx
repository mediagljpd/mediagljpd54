
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { AppSettings } from '../../types';
import { AdminSubComponentProps } from './types';
import { storageService } from '../../services/storageService';
import { PaintBrushIcon, CogIcon, BellIcon, CalendarDaysIcon, PlusCircleIcon, PencilIcon, CheckIcon, XIcon, TrashIcon, DatabaseIcon, MapPinIcon, AcademicCapIcon, BuildingLibraryIcon, ListIcon, UserGroupIcon, JournalIcon, SortAscIcon, SortDescIcon } from '../Icons';
import * as XLSX from 'xlsx';
import { validatePassword } from '../../utils/validators';
import PasswordPolicy from './PasswordPolicy';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import ManageUsers from './ManageUsers';
import ManageStats from './ManageStats';

type SettingsTab = 'design' | 'rules' | 'data' | 'stats' | 'users' | 'footer' | 'security' | 'pages';

const ManageSettings: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings } = useContext(AppContext);

    const [formState, setFormState] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('design');
    
    // States for password and identity change workflow
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSecurityUnlocked, setIsSecurityUnlocked] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityError, setSecurityError] = useState<string | null>(null);

    // States for image uploads
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // State for editing legal pages
    const [editingLegalPage, setEditingLegalPage] = useState<'legalNotice' | 'privacyPolicy' | 'cookiesPolicy' | null>(null);

    // State for info pages
    const [editingInfoPageId, setEditingInfoPageId] = useState<string | null>(null);

    // Temp state for new time slot input
    const [newSlotTime, setNewSlotTime] = useState<string>('');

    useEffect(() => {
        // Migration/Defaults for new fields
        const migSettings = { ...settings };
        if (migSettings.bookingLeadTime === undefined) migSettings.bookingLeadTime = 14;
        if (!migSettings.allowedDays) migSettings.allowedDays = [2, 4];
        if (!migSettings.availableTimeSlots) migSettings.availableTimeSlots = [9, 10, 14, 15];
        
        if (!migSettings.classLevels) migSettings.classLevels = ['PS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
        if (!migSettings.communes) migSettings.communes = [];
        if (!migSettings.schools) migSettings.schools = [];
        
        // Ensure Monday (1) is removed if it was previously selected
        if (migSettings.allowedDays.includes(1)) {
            migSettings.allowedDays = migSettings.allowedDays.filter(d => d !== 1);
        }
        
        if (migSettings.autoCleanupEnabled === undefined) migSettings.autoCleanupEnabled = false;
        if (migSettings.cleanupDay === undefined) migSettings.cleanupDay = 1;
        if (migSettings.cleanupMonth === undefined) migSettings.cleanupMonth = 7; // August (0-indexed)
        if (!migSettings.infoPages) migSettings.infoPages = [];
        
        setFormState(migSettings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState({ ...formState, [name]: value });
    };

    const handleToggleDay = (day: number) => {
        const currentDays = [...(formState.allowedDays || [])];
        if (currentDays.includes(day)) {
            setFormState({ ...formState, allowedDays: currentDays.filter(d => d !== day) });
        } else {
            setFormState({ ...formState, allowedDays: [...currentDays, day].sort() });
        }
    };

    const handleAddTimeSlot = () => {
        const time = parseInt(newSlotTime);
        if (isNaN(time) || time < 0 || time > 23) {
            alert("Veuillez entrer une heure valide (0-23).");
            return;
        }
        if (formState.availableTimeSlots.includes(time)) {
            alert("Ce créneau existe déjà.");
            return;
        }
        setFormState({
            ...formState,
            availableTimeSlots: [...formState.availableTimeSlots, time].sort((a, b) => a - b)
        });
        setNewSlotTime('');
    };

    const handleRemoveTimeSlot = (time: number) => {
        setFormState({
            ...formState,
            availableTimeSlots: formState.availableTimeSlots.filter(t => t !== time)
        });
    };

    const handleAddFooterLink = () => {
        const newLink = { id: Date.now().toString(), label: 'Nouveau lien', url: '' };
        setFormState({
            ...formState,
            footerLinks: [...(formState.footerLinks || []), newLink]
        });
    };

    const handleRemoveFooterLink = (id: string) => {
        setFormState({
            ...formState,
            footerLinks: (formState.footerLinks || []).filter(l => l.id !== id)
        });
    };

    const handleUpdateFooterLink = (id: string, field: 'label' | 'url' | 'content', value: string) => {
        setFormState({
            ...formState,
            footerLinks: (formState.footerLinks || []).map(l => l.id === id ? { ...l, [field]: value } : l)
        });
    };

    const handleUpdateEstablishmentInfo = (field: string, value: string) => {
        setFormState({
            ...formState,
            establishmentInfo: {
                ...(formState.establishmentInfo || { name: '', address: '', phone: '', email: '' }),
                [field]: value
            }
        });
    };

    // Class Levels Handlers
    const handleAddClassLevel = (level: string) => {
        if (!level || (formState.classLevels || []).includes(level)) return;
        setFormState({
            ...formState,
            classLevels: [...(formState.classLevels || []), level]
        });
    };

    const handleRemoveClassLevel = (level: string) => {
        setFormState({
            ...formState,
            classLevels: (formState.classLevels || []).filter(l => l !== level)
        });
    };

    // Communes Handlers
    const handleAddCommune = () => {
        const newCommune = { id: Date.now().toString(), name: 'Nouvelle Commune', postalCode: '' };
        setFormState({
            ...formState,
            communes: [...(formState.communes || []), newCommune]
        });
    };

    const handleUpdateCommune = (id: string, field: string, value: string) => {
        setFormState({
            ...formState,
            communes: (formState.communes || []).map(c => c.id === id ? { ...c, [field]: value } : c)
        });
    };

    const handleRemoveCommune = (id: string) => {
        setFormState({
            ...formState,
            communes: (formState.communes || []).filter(c => c.id !== id),
            schools: (formState.schools || []).filter(s => s.communeId !== id)
        });
    };

    // Schools Handlers
    const handleAddSchool = (communeId: string) => {
        const newSchool = { id: Date.now().toString(), name: 'Nouvelle École', address: '', communeId };
        setFormState({
            ...formState,
            schools: [...(formState.schools || []), newSchool]
        });
    };

    const handleUpdateSchool = (id: string, field: string, value: string) => {
        setFormState({
            ...formState,
            schools: (formState.schools || []).map(s => s.id === id ? { ...s, [field]: value } : s)
        });
    };

    const handleRemoveSchool = (id: string) => {
        setFormState({
            ...formState,
            schools: (formState.schools || []).filter(s => s.id !== id)
        });
    };

    // Info Pages Handlers
    const handleAddInfoPage = () => {
        const newPage = { id: Date.now().toString(), title: 'Nouvelle page', content: 'Contenu de la page...', slug: 'nouvelle-page' };
        setFormState({
            ...formState,
            infoPages: [...(formState.infoPages || []), newPage]
        });
        setEditingInfoPageId(newPage.id);
    };

    const handleUpdateInfoPage = (id: string, field: 'title' | 'content', value: string) => {
        setFormState({
            ...formState,
            infoPages: (formState.infoPages || []).map(p => {
                if (p.id === id) {
                    const newTitle = field === 'title' ? value : p.title;
                    const slug = newTitle.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                        .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric with -
                        .replace(/-+/g, '-') // remove double -
                        .replace(/^-|-$/g, ''); // remove leading/trailing -
                    return { ...p, [field]: value, slug };
                }
                return p;
            })
        });
    };

    const handleRemoveInfoPage = (id: string) => {
        setFormState({
            ...formState,
            infoPages: (formState.infoPages || []).filter(p => p.id !== id)
        });
        if (editingInfoPageId === id) {
            setEditingInfoPageId(null);
        }
    };

    const handleMoveInfoPage = (id: string, direction: 'up' | 'down') => {
        const pages = [...(formState.infoPages || [])];
        const index = pages.findIndex(p => p.id === id);
        if (index === -1) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pages.length) return;
        
        const [removed] = pages.splice(index, 1);
        pages.splice(newIndex, 0, removed);
        
        setFormState({ ...formState, infoPages: pages });
    };

    // Excel Import Handlers
    const handleImportCommunes = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target?.result;
                const wb = XLSX.read(dataBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const findValue = (row: any, keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const key of keys) {
                        const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === key.toLowerCase());
                        if (foundKey) return row[foundKey];
                    }
                    return '';
                };

                const importedCommunes = data.map((row, index) => {
                    const rawValue = findValue(row, ['Communes', 'Commune', 'Nom', 'name', 'Ville']);
                    let name = String(rawValue || '').trim();
                    let postalCode = '';

                    // Try to parse "City (PostalCode)"
                    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
                    if (match) {
                        name = match[1].trim();
                        postalCode = match[2].trim();
                    }

                    return {
                        id: `imported-commune-${Date.now()}-${index}`,
                        name: name,
                        postalCode: postalCode
                    };
                }).filter(c => c.name);

                if (importedCommunes.length === 0 && data.length > 0) {
                    console.log("Data sample:", data[0]);
                    showNotification("Aucune donnée valide trouvée. Vérifiez que la colonne s'appelle bien 'Communes'.", "error");
                } else if (data.length === 0) {
                    showNotification("Le fichier semble vide.", "error");
                } else {
                    setFormState(prev => ({
                        ...prev,
                        communes: [...(prev.communes || []), ...importedCommunes]
                    }));
                    showNotification(`${importedCommunes.length} communes importées.`);
                }
            } catch (error) {
                console.error("Erreur import communes:", error);
                showNotification("Erreur lors de la lecture du fichier Excel.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportSchools = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target?.result;
                const wb = XLSX.read(dataBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const findValue = (row: any, keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const key of keys) {
                        const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === key.toLowerCase());
                        if (foundKey) return row[foundKey];
                    }
                    return '';
                };

                const importedSchools = data.map((row, index) => {
                    const schoolName = String(findValue(row, ['Ecoles', 'Ecole', 'Nom', 'name']) || '').trim();
                    const communeName = String(findValue(row, ['Communes', 'Commune', 'commune', 'Ville']) || '').trim();
                    const address = String(findValue(row, ['Adresses', 'Adresse', 'address']) || '').trim();
                    
                    const commune = (formState.communes || []).find(c => 
                        c.name.trim().toLowerCase() === communeName.toLowerCase() || 
                        `${c.name.trim()} (${c.postalCode.trim()})`.toLowerCase() === communeName.toLowerCase()
                    );
                    
                    return {
                        id: `imported-school-${Date.now()}-${index}`,
                        name: schoolName,
                        address: address,
                        communeId: commune?.id || ''
                    };
                }).filter(s => s.name);

                if (importedSchools.length === 0 && data.length > 0) {
                    console.log("Data sample:", data[0]);
                    showNotification("Aucune donnée valide trouvée. Vérifiez que les colonnes s'appellent 'Ecoles', 'Communes' et 'Adresses'.", "error");
                } else if (data.length === 0) {
                    showNotification("Le fichier semble vide.", "error");
                } else {
                    setFormState(prev => ({
                        ...prev,
                        schools: [...(prev.schools || []), ...importedSchools]
                    }));
                    showNotification(`${importedSchools.length} écoles importées.`);
                }
            } catch (error) {
                console.error("Erreur import écoles:", error);
                showNotification("Erreur lors de la lecture du fichier Excel.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUnlockSecurity = () => {
        if (!oldPassword) {
            setSecurityError("Veuillez saisir votre mot de passe actuel.");
            return;
        }
        if (oldPassword === settings.adminPassword) {
            setIsSecurityUnlocked(true);
            setSecurityError(null);
            showNotification("Accès déverrouillé. Vous pouvez maintenant modifier vos identifiants.");
        } else {
            setSecurityError("Mot de passe incorrect.");
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityError(null);

        const identityChanged = 
            formState.adminUsername !== settings.adminUsername || 
            formState.adminEmail !== settings.adminEmail;

        // Si modification d'identifiants ou de mot de passe, vérification du mot de passe actuel
        if (identityChanged || isChangingPassword) {
            if (!oldPassword) {
                setSecurityError("Le mot de passe actuel est requis pour modifier vos identifiants ou votre mot de passe.");
                setActiveTab('security');
                return;
            }
            if (oldPassword !== settings.adminPassword) {
                setSecurityError("Le mot de passe actuel est incorrect.");
                setActiveTab('security');
                return;
            }

            if (isChangingPassword) {
                const complexityError = validatePassword(newPassword);
                if (complexityError) {
                    setSecurityError(complexityError);
                    setActiveTab('security');
                    return;
                }
                if (newPassword !== confirmPassword) {
                    setSecurityError("Les nouveaux mots de passe ne correspondent pas.");
                    setActiveTab('security');
                    return;
                }
            }
        }

        const finalSettings = { ...formState };
        if (isChangingPassword) {
            finalSettings.adminPassword = newPassword;
            finalSettings.adminPasswordLastChanged = new Date().toISOString();
        }

        updateSettings(finalSettings);
        
        // Reset security fields
        setIsChangingPassword(false);
        setIsSecurityUnlocked(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSecurityError(null);
        showNotification("Paramètres sauvegardés avec succès !");
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof AppSettings) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadingField(fieldName as string);
            
            try {
                const url = await storageService.uploadFile(file, 'app_assets');
                setFormState(prev => ({ ...prev, [fieldName]: url }));
                showNotification("Image mise à jour !");
            } catch (error) {
                console.error(error);
                alert("Erreur lors de l'upload vers Cloudinary.");
            } finally {
                setUploadingField(null);
            }
        }
    };

    const fontSizes = [
        { label: 'Petit', value: 'text-xs' },
        { label: 'Compact', value: 'text-sm' },
        { label: 'Normal', value: 'text-base' },
        { label: 'Grand', value: 'text-lg' },
        { label: 'Très grand', value: 'text-xl' },
        { label: 'Titre (2XL)', value: 'text-2xl' },
        { label: 'Titre (3XL)', value: 'text-3xl' },
    ];

    const ImageUploader: React.FC<{ label: string, fieldName: keyof AppSettings, currentUrl?: string }> = ({ label, fieldName, currentUrl }) => (
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</span>
            <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                {currentUrl ? (
                    <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 italic text-[10px]">Standard</div>
                )}
                {uploadingField === fieldName && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
            <label className={`mt-3 cursor-pointer text-xs font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm text-blue-600 hover:bg-blue-50 transition-all ${uploadingField ? 'opacity-50 pointer-events-none' : ''}`}>
                Changer l'image
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, fieldName)} 
                    disabled={uploadingField !== null}
                />
            </label>
        </div>
    );

    const NavButton: React.FC<{ id: SettingsTab, label: string, icon: React.ReactNode }> = ({ id, label, icon }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                setEditingLegalPage(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === id 
                ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <span className={activeTab === id ? 'text-white' : 'text-gray-400'}>{icon}</span>
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );

    const WeekDay: React.FC<{ day: number, label: string }> = ({ day, label }) => {
        const isSelected = formState.allowedDays?.includes(day);
        return (
            <button
                type="button"
                onClick={() => handleToggleDay(day)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                }`}
            >
                {label}
            </button>
        );
    };

    const isIdentityChanged = formState.adminUsername !== settings.adminUsername || formState.adminEmail !== settings.adminEmail;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 flex-shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 sticky top-4">
                    <div className="hidden lg:block px-4 py-3 mb-2 border-b border-gray-50">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Configuration</h2>
                    </div>
                    <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                        <NavButton id="design" label="Apparence" icon={<PaintBrushIcon className="w-5 h-5" />} />
                        <NavButton id="rules" label="Calendrier" icon={<CalendarDaysIcon className="w-5 h-5" />} />
                        <NavButton id="data" label="Données" icon={<DatabaseIcon className="w-5 h-5" />} />
                        <NavButton id="stats" label="Statistiques" icon={<ListIcon className="w-5 h-5" />} />
                        <NavButton id="pages" label="Pages d'info" icon={<JournalIcon className="w-5 h-5" />} />
                        <NavButton id="users" label="Utilisateurs" icon={<UserGroupIcon className="w-5 h-5" />} />
                        <NavButton id="footer" label="Pied de page" icon={<PencilIcon className="w-5 h-5" />} />
                        <NavButton id="security" label="Sécurité" icon={<CogIcon className="w-5 h-5" />} />
                    </nav>
                </aside>

                {/* Main Content Pane */}
                <div className="flex-grow w-full">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                            
                            {/* Header Panel */}
                            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {activeTab === 'design' && "Apparence"}
                                    {activeTab === 'rules' && "Calendrier"}
                                    {activeTab === 'data' && "Données"}
                                    {activeTab === 'stats' && "Statistiques"}
                                    {activeTab === 'pages' && "Pages d'information"}
                                    {activeTab === 'users' && "Gestion des Utilisateurs"}
                                    {activeTab === 'footer' && "Pied de page"}
                                    {activeTab === 'security' && "Sécurité"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'design' && "Personnalisez les textes, les couleurs et le style de votre accueil"}
                                    {activeTab === 'rules' && "Définissez les contraintes de réservation : délais, jours et créneaux"}
                                    {activeTab === 'data' && "Gérez les niveaux de classe, les communes et les écoles"}
                                    {activeTab === 'stats' && "Visualisez l'activité et l'impact de vos animations pédagogiques"}
                                    {activeTab === 'pages' && "Créez et modifiez des pages de contenu personnalisées pour vos utilisateurs"}
                                    {activeTab === 'users' && "Gérez les comptes d'accès à l'administration et leurs permissions"}
                                    {activeTab === 'footer' && "Gérez les liens du pied de page, les mentions légales et les infos de l'établissement"}
                                    {activeTab === 'security' && "Gérez vos identifiants de connexion et l'e-mail de secours"}
                                </p>
                            </div>

                            {/* Content Body */}
                            <div className="p-8 flex-grow">
                                {activeTab === 'design' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Titre Style */}
                                            <div className="space-y-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                                                <h4 className="font-bold text-blue-800 flex items-center gap-2">Titre de l'accueil</h4>
                                                <input type="text" name="homepageTitle" value={formState.homepageTitle} onChange={handleChange} className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Titre principal..."/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Taille</label>
                                                        <select name="titleFontSize" value={formState.titleFontSize} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white">
                                                            {fontSizes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Couleur</label>
                                                        <div className="flex gap-2">
                                                            <input type="color" name="titleColor" value={formState.titleColor} onChange={handleChange} className="h-9 w-12 border border-blue-200 rounded-lg cursor-pointer bg-white p-1"/>
                                                            <input type="text" name="titleColor" value={formState.titleColor} onChange={handleChange} className="flex-grow px-2 py-1 border border-blue-200 rounded-lg text-[10px] font-mono bg-white uppercase"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-6 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.titleFontWeight === 'font-bold'} onChange={(e) => setFormState({...formState, titleFontWeight: e.target.checked ? 'font-bold' : 'font-normal'})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-blue-300"/>
                                                        <span className="text-sm font-bold text-blue-900 group-hover:text-blue-700">Gras</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.titleFontStyle === 'italic'} onChange={(e) => setFormState({...formState, titleFontStyle: e.target.checked ? 'italic' : 'not-italic'})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-blue-300"/>
                                                        <span className="text-sm italic text-blue-900 group-hover:text-blue-700">Italique</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Sous-titre Style */}
                                            <div className="space-y-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                                <h4 className="font-bold text-indigo-800 flex items-center gap-2">Sous-titre</h4>
                                                <input type="text" name="homepageSubtitle" value={formState.homepageSubtitle || ''} onChange={handleChange} className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sous-titre informatif..."/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Taille</label>
                                                        <select name="subtitleFontSize" value={formState.subtitleFontSize} onChange={handleChange} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white">
                                                            {fontSizes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Couleur</label>
                                                        <div className="flex gap-2">
                                                            <input type="color" name="subtitleColor" value={formState.subtitleColor} onChange={handleChange} className="h-9 w-12 border border-indigo-200 rounded-lg cursor-pointer bg-white p-1"/>
                                                            <input type="text" name="subtitleColor" value={formState.subtitleColor} onChange={handleChange} className="flex-grow px-2 py-1 border border-indigo-200 rounded-lg text-[10px] font-mono bg-white uppercase"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-6 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.subtitleFontWeight === 'font-bold'} onChange={(e) => setFormState({...formState, subtitleFontWeight: e.target.checked ? 'font-bold' : 'font-normal'})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300"/>
                                                        <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-700">Gras</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.subtitleFontStyle === 'italic'} onChange={(e) => setFormState({...formState, subtitleFontStyle: e.target.checked ? 'italic' : 'not-italic'})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300"/>
                                                        <span className="text-sm italic text-indigo-900 group-hover:text-indigo-700">Italique</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3">Couleur de l'en-tête (Sticky Header)</label>
                                                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <input type="color" name="headerBgColor" value={formState.headerBgColor} onChange={handleChange} className="h-12 w-16 border rounded-lg cursor-pointer bg-white p-1 shadow-sm"/>
                                                    <input type="text" name="headerBgColor" value={formState.headerBgColor} onChange={handleChange} className="w-full max-w-[150px] px-3 py-2 border rounded-lg font-mono text-xs uppercase"/>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3">Couleur de fond globale (Accueil)</label>
                                                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <input type="color" name="homepageBgColor" value={formState.homepageBgColor} onChange={handleChange} className="h-12 w-16 border rounded-lg cursor-pointer bg-white p-1 shadow-sm"/>
                                                    <input type="text" name="homepageBgColor" value={formState.homepageBgColor} onChange={handleChange} className="w-full max-w-[150px] px-3 py-2 border rounded-lg font-mono text-xs uppercase"/>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informations de Contact (Moved from General) */}
                                        <div className="max-w-2xl space-y-6 border-t pt-8">
                                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <BellIcon className="w-5 h-5 text-blue-600" />
                                                    Informations de Contact
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone de contact</label>
                                                        <input type="text" name="contactPhone" value={formState.contactPhone || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold" placeholder="ex: 03 82 26 03 00"/>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">E-mail de contact</label>
                                                        <input type="email" name="contactEmail" value={formState.contactEmail || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold" placeholder="ex: contact@grandlongwy.fr"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'rules' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                {/* Préavis */}
                                                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100">
                                                    <h4 className="font-bold text-blue-900 mb-2">Préavis de réservation</h4>
                                                    <p className="text-xs text-blue-600/80 mb-4">Délai minimum (en jours) requis avant la date de l'atelier pour pouvoir réserver.</p>
                                                    <div className="flex items-center gap-4">
                                                        <input 
                                                            type="range" 
                                                            min="0" max="60" step="1"
                                                            name="bookingLeadTime" 
                                                            value={formState.bookingLeadTime} 
                                                            onChange={(e) => setFormState({...formState, bookingLeadTime: parseInt(e.target.value)})}
                                                            className="flex-grow h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        />
                                                        <div className="bg-white px-4 py-2 rounded-lg border border-blue-200 font-bold text-blue-700 min-w-[100px] text-center">
                                                            {formState.bookingLeadTime} jours
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Jours autorisés */}
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <h4 className="font-bold text-gray-800 mb-2">Jours d'ouverture hebdomadaire</h4>
                                                    <p className="text-xs text-gray-500 mb-4">Sélectionnez les jours où les réservations sont possibles.</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <WeekDay day={2} label="Mardi" />
                                                        <WeekDay day={3} label="Mercredi" />
                                                        <WeekDay day={4} label="Jeudi" />
                                                        <WeekDay day={5} label="Vendredi" />
                                                        <WeekDay day={6} label="Samedi" />
                                                    </div>
                                                </div>

                                                {/* Créneaux Horaires */}
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <h4 className="font-bold text-gray-800 mb-2">Créneaux horaires standards</h4>
                                                    <p className="text-xs text-gray-500 mb-4">Heures de début des ateliers proposées aux enseignants.</p>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {(formState.availableTimeSlots || []).map(time => (
                                                            <div key={time} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                                <span className="font-bold text-gray-700">{time}h00</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleRemoveTimeSlot(time)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={newSlotTime}
                                                            onChange={(e) => setNewSlotTime(e.target.value)}
                                                            placeholder="Ex: 11"
                                                            className="flex-grow px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={handleAddTimeSlot}
                                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                                        >
                                                            Ajouter
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vision d'ensemble */}
                                            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl space-y-6">
                                                <h4 className="text-xl font-bold flex items-center gap-2">
                                                    <span className="text-indigo-300">★</span>
                                                    Vision d'ensemble
                                                </h4>
                                                <div className="space-y-4 text-sm opacity-90 leading-relaxed">
                                                    <p>Voici comment les réservations sont validées sur votre plateforme :</p>
                                                    <div className="space-y-3">
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">1</div>
                                                            <p><strong>Délai :</strong> Un atelier n'est réservable que s'il se situe à plus de <span className="text-indigo-200 font-bold">{formState.bookingLeadTime} jours</span> d'aujourd'hui.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">2</div>
                                                            <p><strong>Calendrier :</strong> Seuls les jours <span className="text-indigo-200 font-bold">{(formState.allowedDays || []).map(d => ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d]).join(', ')}</span> et hors vacances/indisponibilités sont ouverts.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">3</div>
                                                            <p><strong>Exclusivité du créneau :</strong> Lorsqu'un créneau (date + heure) est réservé pour une animation, ce créneau devient <span className="text-indigo-200 font-bold">indisponible pour tous les animateurs</span> et toutes les autres animations.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">4</div>
                                                            <p><strong>Après-midi :</strong> Un seul atelier est autorisé par demi-journée d'après-midi. Si 14h ou 15h est pris, l'autre est bloqué pour tout le monde.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">5</div>
                                                            <p><strong>Animateurs :</strong> Si un animateur est mobilisé par une animation le matin ou l'après-midi, il ne peut pas être sollicité pour une autre animation sur cette même journée.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'data' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* Nettoyage automatique */}
                                        <div className="p-6 bg-red-50/30 rounded-2xl border border-red-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-red-900 flex items-center gap-2">
                                                    <DatabaseIcon className="w-5 h-5" />
                                                    Nettoyage automatique des données personnelles (RGPD)
                                                </h4>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formState.autoCleanupEnabled} 
                                                        onChange={(e) => setFormState({...formState, autoCleanupEnabled: e.target.checked})}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                                </label>
                                            </div>
                                            <p className="text-xs text-red-700 mb-4 leading-relaxed">
                                                Conformément au RGPD, il est recommandé de ne pas conserver les données personnelles plus longtemps que nécessaire. 
                                                Cette option permet d'anonymiser automatiquement le nom, le téléphone et l'email des enseignants pour l'année scolaire écoulée.
                                            </p>
                                            {formState.autoCleanupEnabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Jour d'exécution chaque année</label>
                                                        <select 
                                                            value={formState.cleanupDay} 
                                                            onChange={(e) => setFormState({...formState, cleanupDay: parseInt(e.target.value)})}
                                                            className="w-full p-2.5 bg-white border border-red-200 rounded-xl font-bold text-red-900"
                                                        >
                                                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Mois d'exécution</label>
                                                        <select 
                                                            value={formState.cleanupMonth} 
                                                            onChange={(e) => setFormState({...formState, cleanupMonth: parseInt(e.target.value)})}
                                                            className="w-full p-2.5 bg-white border border-red-200 rounded-xl font-bold text-red-900"
                                                        >
                                                            <option value={6}>Juillet</option>
                                                            <option value={7}>Août</option>
                                                            <option value={8}>Septembre</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Niveaux de classe */}
                                        <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                                <AcademicCapIcon className="w-5 h-5" />
                                                Niveaux de classe
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(formState.classLevels || []).map(level => (
                                                    <div key={level} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg shadow-sm">
                                                        <span className="font-bold text-blue-700">{level}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveClassLevel(level)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 max-w-xs">
                                                <input 
                                                    type="text" 
                                                    id="newClassLevel"
                                                    placeholder="Nouveau niveau (ex: MS)"
                                                    className="flex-grow px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddClassLevel((e.target as HTMLInputElement).value);
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const input = document.getElementById('newClassLevel') as HTMLInputElement;
                                                        handleAddClassLevel(input.value);
                                                        input.value = '';
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                                >
                                                    Ajouter
                                                </button>
                                            </div>
                                        </div>

                                        {/* Communes */}
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <MapPinIcon className="w-5 h-5 text-red-500" />
                                                    Communes
                                                </h4>
                                                <div className="flex gap-3 items-center">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <label className="cursor-pointer px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold flex items-center gap-2">
                                                            <PlusCircleIcon className="w-4 h-4" />
                                                            Importer Excel
                                                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportCommunes} />
                                                        </label>
                                                        <span className="text-[9px] text-gray-400 italic">Colonne attendue : "Communes"</span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={handleAddCommune}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
                                                    >
                                                        <PlusCircleIcon className="w-4 h-4" />
                                                        Ajouter manuellement
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                                                {(formState.communes || []).map(commune => (
                                                    <div key={commune.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative group">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveCommune(commune.id)}
                                                            className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nom de la commune</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={commune.name} 
                                                                    onChange={(e) => handleUpdateCommune(commune.id, 'name', e.target.value)}
                                                                    className="w-full px-2 py-1 border rounded text-sm font-semibold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Code Postal</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={commune.postalCode} 
                                                                    onChange={(e) => handleUpdateCommune(commune.id, 'postalCode', e.target.value)}
                                                                    className="w-full px-2 py-1 border rounded text-sm font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Écoles */}
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <BuildingLibraryIcon className="w-5 h-5 text-indigo-500" />
                                                    Écoles
                                                </h4>
                                                <div className="flex flex-col items-end gap-1">
                                                    <label className="cursor-pointer px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold flex items-center gap-2">
                                                        <PlusCircleIcon className="w-4 h-4" />
                                                        Importer Excel
                                                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportSchools} />
                                                    </label>
                                                    <span className="text-[9px] text-gray-400 italic">Colonnes attendues : "Ecoles", "Communes", "Adresses"</span>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {(formState.communes || []).map(commune => (
                                                    <div key={commune.id} className="space-y-3">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <h5 className="font-bold text-gray-700">{commune.name} ({commune.postalCode})</h5>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleAddSchool(commune.id)}
                                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                            >
                                                                <PlusCircleIcon className="w-3 h-3" />
                                                                Ajouter une école
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {(formState.schools || []).filter(s => s.communeId === commune.id).map(school => (
                                                                <div key={school.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative group">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => handleRemoveSchool(school.id)}
                                                                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Nom de l'école</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={school.name} 
                                                                                onChange={(e) => handleUpdateSchool(school.id, 'name', e.target.value)}
                                                                                className="w-full px-2 py-1 border rounded text-sm font-semibold"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Adresse</label>
                                                                            <textarea 
                                                                                value={school.address} 
                                                                                onChange={(e) => handleUpdateSchool(school.id, 'address', e.target.value)}
                                                                                className="w-full px-2 py-1 border rounded text-sm h-16"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <ManageStats />
                                )}

                                {activeTab === 'users' && (
                                    <ManageUsers showNotification={showNotification} />
                                )}

                                {activeTab === 'footer' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {editingLegalPage ? (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-lg font-bold text-gray-800">
                                                        Édition : {
                                                            editingLegalPage === 'legalNotice' ? 'Mentions Légales' : 
                                                            editingLegalPage === 'privacyPolicy' ? 'Politique de Confidentialité' : 
                                                            'Gestion des Cookies'
                                                        }
                                                    </h4>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setEditingLegalPage(null)}
                                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                                                    >
                                                        Retour
                                                    </button>
                                                </div>
                                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                    <ReactQuill 
                                                        theme="snow"
                                                        value={formState[editingLegalPage] || ''}
                                                        onChange={(content) => setFormState({ ...formState, [editingLegalPage]: content })}
                                                        modules={{
                                                            toolbar: [
                                                                [{ 'header': [1, 2, false] }],
                                                                ['bold', 'italic', 'underline'],
                                                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                                ['clean']
                                                            ],
                                                        }}
                                                        className="h-[400px] mb-12"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Legal Pages Selection */}
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-gray-800">Pages légales</h4>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const templates = {
                                                                    legalNotice: `<h2>1. Présentation du site</h2><p>En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :</p><p><strong>Propriétaire</strong> : [Nom de l'établissement / Collectivité] – [Adresse complète]</p><p><strong>Responsable publication</strong> : [Nom du responsable] – [Email de contact]</p><p><strong>Webmaster</strong> : [Nom du webmaster] – [Email du webmaster]</p><p><strong>Hébergeur</strong> : Netlify – 2325 3rd Street, Suite 296, San Francisco, California 94107</p><h2>2. Conditions générales d’utilisation du site et des services proposés</h2><p>L’utilisation du site implique l’acceptation pleine et entière des conditions générales d’utilisation ci-après décrites. Ces conditions d’utilisation sont susceptibles d’être modifiées ou complétées à tout moment.</p><h2>3. Description des services fournis</h2><p>Le site a pour objet de fournir une information concernant l’ensemble des activités de la structure et de permettre la réservation d'animations pédagogiques.</p><h2>4. Propriété intellectuelle et contrefaçons</h2><p>[Nom de l'établissement] est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels.</p><h2>5. Limitations de responsabilité</h2><p>[Nom de l'établissement] ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l’utilisateur, lors de l’accès au site.</p>`,
                                                                    privacyPolicy: `<h2>1. Gestion des données personnelles</h2><p>En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et le Règlement Général sur la Protection des Données (RGPD : n° 2016-679).</p><h2>2. Finalité des données collectées</h2><p>Le site est susceptible de traiter tout ou partie des données :</p><ul><li>Pour permettre la navigation sur le site</li><li>Pour prévenir et lutter contre la fraude informatique</li><li>Pour améliorer la navigation sur le site</li><li>Pour gérer les réservations d'animations (Nom, Email, Téléphone, École)</li></ul><h2>3. Droit d’accès, de rectification et d’opposition</h2><p>Conformément à la réglementation européenne en vigueur, les Utilisateurs disposent des droits suivants :</p><ul><li>Droit d'accès (article 15 RGPD) et de rectification (article 16 RGPD)</li><li>Droit à l'effacement (article 17 du RGPD)</li><li>Droit de retirer à tout moment un consentement (article 13-2c RGPD)</li><li>Droit à la limitation du traitement des données (article 18 RGPD)</li></ul><p>Pour exercer ces droits, contactez : [Email de contact DPO / Responsable]</p><h2>4. Non-communication des données personnelles</h2><p>Le site s’interdit de traiter, héberger ou transférer les Informations collectées sur ses Clients vers un pays situé en dehors de l’Union européenne ou reconnu comme « non adéquat » par la Commission européenne sans en informer préalablement le client.</p>`,
                                                                    cookiesPolicy: `<h2>1. Qu'est-ce qu'un cookie ?</h2><p>Un « cookie » est un petit fichier d’information envoyé sur le navigateur de l’Utilisateur et enregistré au sein du terminal de l’Utilisateur. Ce fichier comprend des informations telles que le nom de domaine de l’Utilisateur, le fournisseur d’accès Internet de l’Utilisateur, le système d’exploitation de l’Utilisateur, ainsi que la date et l’heure d’accès.</p><h2>2. Utilisation des cookies sur ce site</h2><p>Ce site utilise des cookies strictement nécessaires à son bon fonctionnement :</p><ul><li><strong>Cookies de session</strong> : Pour maintenir votre connexion ou l'état de votre réservation en cours.</li><li><strong>Cookies de sécurité</strong> : Pour prévenir les attaques malveillantes.</li></ul><h2>3. Cookies tiers</h2><p>Ce site n'utilise pas de cookies publicitaires. Des cookies de mesure d'audience anonymes peuvent être utilisés pour améliorer l'expérience utilisateur.</p><h2>4. Comment désactiver les cookies ?</h2><p>L’Utilisateur peut configurer son navigateur pour qu’il lui permette de décider s’il souhaite ou non les accepter de manière à ce que des Cookies soient enregistrés dans le terminal ou, au contraire, qu’ils soient rejetés.</p>`
                                                                };
                                                                setFormState({
                                                                    ...formState,
                                                                    ...templates
                                                                });
                                                                showNotification("Modèles légaux restaurés ! N'oubliez pas d'enregistrer.");
                                                            }}
                                                            className="text-xs font-bold text-blue-600 hover:underline"
                                                        >
                                                            Restaurer les modèles par défaut
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-4 shadow-sm">
                                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <PencilIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">Mentions Légales</h4>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingLegalPage('legalNotice')}
                                                                className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>

                                                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-4 shadow-sm">
                                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <PencilIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">Confidentialité</h4>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingLegalPage('privacyPolicy')}
                                                                className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>

                                                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-4 shadow-sm">
                                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <PencilIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">Cookies</h4>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingLegalPage('cookiesPolicy')}
                                                                className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Content */}
                                                <div className="space-y-4 border-t pt-8">
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Contenu textuel du pied de page (Bas de page)</label>
                                                    <textarea 
                                                        name="footerContent" 
                                                        value={formState.footerContent} 
                                                        onChange={handleChange} 
                                                        rows={4} 
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" 
                                                        placeholder="Coordonnées simplifiées, copyright, etc."
                                                    />
                                                </div>

                                                {/* Dynamic Links */}
                                                <div className="space-y-4 border-t pt-8">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-gray-800">Liens supplémentaires du pied de page</h4>
                                                        <button 
                                                            type="button" 
                                                            onClick={handleAddFooterLink}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold"
                                                        >
                                                            <PlusCircleIcon className="w-4 h-4" />
                                                            Ajouter un lien
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {(formState.footerLinks || []).map((link) => (
                                                            <div key={link.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 items-start sm:items-center">
                                                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                                                    <input 
                                                                        type="text" 
                                                                        value={link.label} 
                                                                        onChange={(e) => handleUpdateFooterLink(link.id, 'label', e.target.value)}
                                                                        placeholder="Label du lien"
                                                                        className="px-3 py-2 border rounded-lg text-sm bg-white"
                                                                    />
                                                                    <input 
                                                                        type="text" 
                                                                        value={link.url || ''} 
                                                                        onChange={(e) => handleUpdateFooterLink(link.id, 'url', e.target.value)}
                                                                        placeholder="URL (ex: https://...)"
                                                                        className="px-3 py-2 border rounded-lg text-sm bg-white"
                                                                    />
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleRemoveFooterLink(link.id)}
                                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(formState.footerLinks || []).length === 0 && (
                                                            <p className="text-sm text-gray-400 italic text-center py-4">Aucun lien supplémentaire configuré.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Establishment Info */}
                                                <div className="space-y-6 border-t pt-8">
                                                    <h4 className="font-bold text-gray-800">Informations sur l'établissement</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom de l'établissement</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={formState.establishmentInfo?.name || ''} 
                                                                    onChange={(e) => handleUpdateEstablishmentInfo('name', e.target.value)}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                    placeholder="ex: Médiathèque de Longwy"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adresse</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={formState.establishmentInfo?.address || ''} 
                                                                    onChange={(e) => handleUpdateEstablishmentInfo('address', e.target.value)}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                    placeholder="ex: 1 Avenue de la Paix, 54400 Longwy"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone</label>
                                                                    <input 
                                                                        type="text" 
                                                                        value={formState.establishmentInfo?.phone || ''} 
                                                                        onChange={(e) => handleUpdateEstablishmentInfo('phone', e.target.value)}
                                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                        placeholder="ex: 03 82 26 03 00"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">E-mail</label>
                                                                    <input 
                                                                        type="email" 
                                                                        value={formState.establishmentInfo?.email || ''} 
                                                                        onChange={(e) => handleUpdateEstablishmentInfo('email', e.target.value)}
                                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                        placeholder="ex: contact@longwy.fr"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Logo de l'établissement</span>
                                                            <div className="relative w-40 h-40 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center mb-4">
                                                                {formState.establishmentInfo?.logoUrl ? (
                                                                    <img src={formState.establishmentInfo.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                                                                ) : (
                                                                    <div className="text-gray-300 text-xs italic text-center px-4">Aucun logo importé</div>
                                                                )}
                                                                {uploadingField === 'establishmentLogo' && (
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <label className={`cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all ${uploadingField ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                Importer un logo
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    className="hidden" 
                                                                    onChange={async (e) => {
                                                                        if (e.target.files && e.target.files[0]) {
                                                                            const file = e.target.files[0];
                                                                            setUploadingField('establishmentLogo');
                                                                            try {
                                                                                const url = await storageService.uploadFile(file, 'logos');
                                                                                handleUpdateEstablishmentInfo('logoUrl', url);
                                                                                showNotification("Logo mis à jour !");
                                                                            } catch (error) {
                                                                                console.error(error);
                                                                                alert("Erreur lors de l'upload.");
                                                                            } finally {
                                                                                setUploadingField(null);
                                                                            }
                                                                        }
                                                                    }} 
                                                                    disabled={uploadingField !== null}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'pages' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Pages d'information</h3>
                                                <p className="text-xs text-gray-400 font-medium">Créez des pages de contenu personnalisées pour vos utilisateurs.</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleAddInfoPage}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                            >
                                                <PlusCircleIcon className="w-4 h-4" />
                                                Ajouter une page
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Liste des pages */}
                                            <div className="lg:col-span-1 space-y-3">
                                                {(formState.infoPages || []).length === 0 ? (
                                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        <JournalIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                                        <p className="text-xs text-gray-400 italic">Aucune page créée</p>
                                                    </div>
                                                ) : (
                                                    (formState.infoPages || []).map(page => (
                                                        <div 
                                                            key={page.id}
                                                            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${editingInfoPageId === page.id ? 'bg-indigo-50 border-indigo-200 shadow-md translate-x-1' : 'bg-white border-gray-100 hover:border-indigo-100 shadow-sm'}`}
                                                            onClick={() => setEditingInfoPageId(page.id)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-grow">
                                                                    <h4 className={`text-sm font-bold ${editingInfoPageId === page.id ? 'text-indigo-900' : 'text-gray-700'}`}>{page.title}</h4>
                                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">slug: /{page.slug}</p>
                                                                </div>
                                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="flex gap-1">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveInfoPage(page.id, 'up'); }}
                                                                            disabled={(formState.infoPages || []).indexOf(page) === 0}
                                                                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                                            title="Monter"
                                                                        >
                                                                            <SortAscIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveInfoPage(page.id, 'down'); }}
                                                                            disabled={(formState.infoPages || []).indexOf(page) === (formState.infoPages || []).length - 1}
                                                                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                                            title="Descendre"
                                                                        >
                                                                            <SortDescIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleRemoveInfoPage(page.id); }}
                                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                            title="Supprimer"
                                                                        >
                                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* Zone d'édition */}
                                            <div className="lg:col-span-2">
                                                {editingInfoPageId ? (
                                                    <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Titre de la page</label>
                                                            <div className="relative">
                                                                <PencilIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <input 
                                                                    type="text"
                                                                    value={(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.title || ''}
                                                                    onChange={(e) => handleUpdateInfoPage(editingInfoPageId, 'title', e.target.value)}
                                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-800 focus:border-indigo-500 outline-none transition-all"
                                                                    placeholder="ex: Informations pratiques"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contenu de la page</label>
                                                            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden focus-within:border-indigo-500 transition-all">
                                                                <ReactQuill 
                                                                    theme="snow"
                                                                    value={(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.content || ''}
                                                                    onChange={(content) => handleUpdateInfoPage(editingInfoPageId, 'content', content)}
                                                                    className="h-[400px]"
                                                                    modules={{
                                                                        toolbar: [
                                                                            [{ 'header': [1, 2, false] }],
                                                                            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                                            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                                                                            ['link'],
                                                                            ['clean']
                                                                        ],
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                                            <button 
                                                                onClick={() => setEditingInfoPageId(null)}
                                                                className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                                            >
                                                                Fermer l'éditeur
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                                                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-4 rotate-3">
                                                            <PencilIcon className="w-12 h-12 text-indigo-100" />
                                                        </div>
                                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Éditeur de page</h4>
                                                        <p className="text-xs text-gray-400 mt-2">Sélectionnez une page pour commencer à modifier son contenu ou créez-en une nouvelle.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="max-w-md space-y-6">
                                            {/* Section Identifiants & Récupération */}
                                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Identifiants & Récupération</h4>
                                                    {isSecurityUnlocked ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                                                            <CheckIcon className="w-3 h-3" /> Déverrouillé
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                            </svg>
                                                            Verrouillé
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Identifiant Admin</label>
                                                    <div className={`flex items-center gap-3 p-1 rounded-xl border shadow-sm transition-all ${isSecurityUnlocked ? 'bg-white border-gray-200 focus-within:ring-2 focus-within:ring-blue-500' : 'bg-gray-100 border-gray-200 cursor-not-allowed'}`}>
                                                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                            </svg>
                                                        </div>
                                                        <input 
                                                            type="text" 
                                                            name="adminUsername" 
                                                            value={formState.adminUsername || ''} 
                                                            onChange={handleChange} 
                                                            disabled={!isSecurityUnlocked}
                                                            className={`flex-grow px-2 py-2 text-lg font-bold outline-none bg-transparent ${isSecurityUnlocked ? 'text-gray-800' : 'text-gray-400 cursor-not-allowed'}`} 
                                                            placeholder="Identifiant"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">E-mail de secours (Récupération)</label>
                                                    <div className={`flex items-center gap-3 p-1 rounded-xl border shadow-sm transition-all ${isSecurityUnlocked ? 'bg-white border-gray-200 focus-within:ring-2 focus-within:ring-blue-500' : 'bg-gray-100 border-gray-200 cursor-not-allowed'}`}>
                                                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                                            </svg>
                                                        </div>
                                                        <input 
                                                            type="email" 
                                                            name="adminEmail" 
                                                            value={formState.adminEmail || ''} 
                                                            onChange={handleChange} 
                                                            disabled={!isSecurityUnlocked}
                                                            className={`flex-grow px-2 py-2 text-sm font-bold outline-none bg-transparent ${isSecurityUnlocked ? 'text-gray-800' : 'text-gray-400 cursor-not-allowed'}`} 
                                                            placeholder="admin@exemple.fr"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Périodicité de changement de mot de passe</label>
                                                    <select 
                                                        name="passwordExpiryDays" 
                                                        value={formState.passwordExpiryDays || 0} 
                                                        onChange={handleChange}
                                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value={0}>Désactivé</option>
                                                        <option value={30}>Tous les 30 jours</option>
                                                        <option value={60}>Tous les 60 jours</option>
                                                        <option value={90}>Tous les 90 jours (Recommandé)</option>
                                                        <option value={180}>Tous les 180 jours</option>
                                                    </select>
                                                    <p className="text-[10px] text-gray-400 mt-1 italic">Force les administrateurs et utilisateurs à changer leur mot de passe régulièrement.</p>
                                                </div>
                                            </div>

                                            {/* Section Mot de passe */}
                                            <div className="pt-4">
                                                {isChangingPassword ? (
                                                    <div className="space-y-5 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200 shadow-inner">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest">Nouveau mot de passe</h4>
                                                            <button type="button" onClick={() => {setIsChangingPassword(false); setSecurityError(null); setNewPassword(''); setConfirmPassword('');}} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Annuler le changement</button>
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <input 
                                                                    type="password" 
                                                                    value={newPassword}
                                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                                                    placeholder="Nouveau"
                                                                />
                                                                <input 
                                                                    type="password" 
                                                                    value={confirmPassword}
                                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                                                    placeholder="Confirmer"
                                                                />
                                                            </div>
                                                            <PasswordPolicy password={newPassword} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sécurité</label>
                                                        <div className="flex items-center gap-4 w-full">
                                                            <div className="flex-grow flex items-center gap-2 px-4 py-2 border rounded-xl bg-gray-100 text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                                </svg>
                                                                <span className="font-mono text-sm tracking-widest">••••••••</span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setIsChangingPassword(true)}
                                                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                                            >
                                                                Changer le MDP
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Champ de confirmation (visible pour déverrouiller ou confirmer changement) */}
                                            <div className={`p-6 rounded-2xl border space-y-3 transition-all ${isSecurityUnlocked ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                <h4 className={`text-xs font-black uppercase tracking-widest ${isSecurityUnlocked ? 'text-green-900' : 'text-red-900'}`}>
                                                    {isSecurityUnlocked ? 'Vérification réussie' : 'Confirmation requise'}
                                                </h4>
                                                <p className={`text-[11px] leading-tight ${isSecurityUnlocked ? 'text-green-700' : 'text-red-700'}`}>
                                                    {isSecurityUnlocked 
                                                        ? 'Votre mot de passe a été vérifié. Vous pouvez maintenant modifier vos identifiants.' 
                                                        : 'Saisissez votre mot de passe actuel pour déverrouiller la modification des identifiants.'}
                                                </p>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="password" 
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        className={`flex-grow px-4 py-2.5 border rounded-xl outline-none focus:ring-2 shadow-sm transition-all ${isSecurityUnlocked ? 'border-green-200 bg-white focus:ring-green-500' : 'border-red-200 bg-white focus:ring-red-500'}`}
                                                        placeholder="Mot de passe actuel"
                                                    />
                                                    {!isSecurityUnlocked && (
                                                        <button 
                                                            type="button" 
                                                            onClick={handleUnlockSecurity}
                                                            className="px-4 py-2.5 bg-red-600 text-white text-xs font-black uppercase rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-100"
                                                        >
                                                            Vérifier
                                                        </button>
                                                    )}
                                                </div>
                                                {securityError && (
                                                    <p className="text-[11px] text-red-600 font-bold bg-white p-2.5 rounded-lg border border-red-100 shadow-sm animate-in fade-in zoom-in-95">
                                                        ⚠️ {securityError}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Panel with Save Button */}
                            <div className="px-8 py-6 bg-white border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <p className="text-xs text-gray-400 font-medium italic">
                                    N'oubliez pas d'enregistrer vos modifications avant de quitter cet onglet.
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => {setFormState(settings); setIsChangingPassword(false); setIsSecurityUnlocked(false); setSecurityError(null); setOldPassword(''); setNewPassword(''); setConfirmPassword('');}} 
                                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Réinitialiser
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ManageSettings;
