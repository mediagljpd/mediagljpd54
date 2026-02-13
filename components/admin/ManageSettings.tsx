
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../App';
import { AppSettings } from '../../types';
import { AdminSubComponentProps } from './types';
import { storageService } from '../../services/storageService';
import { PaintBrushIcon, CogIcon, BellIcon, CalendarDaysIcon, PlusCircleIcon, PencilIcon, CheckIcon, XIcon, SparklesIcon, TrashIcon } from '../Icons';

type SettingsTab = 'design' | 'media' | 'rules' | 'general' | 'security';

const ManageSettings: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings } = useContext(AppContext);
    const [formState, setFormState] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('design');
    
    // States for password change workflow
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // States for image uploads
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // Temp state for new time slot input
    const [newSlotTime, setNewSlotTime] = useState<string>('');

    useEffect(() => {
        // Migration/Defaults for new fields
        const migSettings = { ...settings };
        if (migSettings.bookingLeadTime === undefined) migSettings.bookingLeadTime = 14;
        if (!migSettings.allowedDays) migSettings.allowedDays = [2, 4];
        if (!migSettings.availableTimeSlots) migSettings.availableTimeSlots = [9, 10, 14, 15];
        
        // Ensure Monday (1) is removed if it was previously selected
        if (migSettings.allowedDays.includes(1)) {
            migSettings.allowedDays = migSettings.allowedDays.filter(d => d !== 1);
        }
        
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

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (isChangingPassword) {
            if (oldPassword !== settings.adminPassword) {
                setPasswordError("L'ancien mot de passe est incorrect.");
                return;
            }
            if (!newPassword || newPassword.length < 4) {
                setPasswordError("Le nouveau mot de passe doit faire au moins 4 caractères.");
                return;
            }
            if (newPassword !== confirmPassword) {
                setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
                return;
            }

            const updatedSettings = { ...formState, adminPassword: newPassword };
            updateSettings(updatedSettings);
            
            setIsChangingPassword(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError(null);
            showNotification("Paramètres et mot de passe sauvegardés !");
        } else {
            updateSettings(formState);
            showNotification("Paramètres sauvegardés !");
        }
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
            onClick={() => setActiveTab(id)}
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
                        <NavButton id="media" label="Illustrations" icon={<SparklesIcon className="w-5 h-5" />} />
                        <NavButton id="rules" label="Calendrier" icon={<CalendarDaysIcon className="w-5 h-5" />} />
                        <NavButton id="general" label="Général" icon={<BellIcon className="w-5 h-5" />} />
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
                                    {activeTab === 'design' && "Design & Identité visuelle"}
                                    {activeTab === 'media' && "Illustrations & Médias"}
                                    {activeTab === 'rules' && "Règles du Calendrier & Réservations"}
                                    {activeTab === 'general' && "Paramètres généraux"}
                                    {activeTab === 'security' && "Sécurité & Accès"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'design' && "Personnalisez les textes, les couleurs et le style de votre accueil."}
                                    {activeTab === 'media' && "Modifiez les images d'illustration de l'accès admin et des jeux."}
                                    {activeTab === 'rules' && "Définissez les contraintes de réservation : délais, jours et créneaux."}
                                    {activeTab === 'general' && "Configurez l'année scolaire active et vos informations de contact."}
                                    {activeTab === 'security' && "Gérez vos identifiants de connexion et votre mot de passe."}
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
                                    </div>
                                )}

                                {activeTab === 'media' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <ImageUploader 
                                                label="Illustration Accès Admin" 
                                                fieldName="adminLoginBgUrl" 
                                                currentUrl={formState.adminLoginBgUrl} 
                                            />
                                            <ImageUploader 
                                                label="Jeu Memory (Félins)" 
                                                fieldName="gameMemoryImageUrl" 
                                                currentUrl={formState.gameMemoryImageUrl} 
                                            />
                                            <ImageUploader 
                                                label="Jeu de Dames (Animaux)" 
                                                fieldName="gameCheckersImageUrl" 
                                                currentUrl={formState.gameCheckersImageUrl} 
                                            />
                                            <ImageUploader 
                                                label="Jeu de Picross (Pokémon)" 
                                                fieldName="gamePicrossImageUrl" 
                                                currentUrl={formState.gamePicrossImageUrl} 
                                            />
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

                                {activeTab === 'general' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
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

                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <h4 className="font-bold text-gray-800 mb-4">Année & Secours</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Année scolaire active</label>
                                                            <input type="text" name="activeYear" value={formState.activeYear} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">E-mail de secours (Admin)</label>
                                                            <input type="email" name="adminEmail" value={formState.adminEmail} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="admin@exemple.fr"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Contenu du pied de page</label>
                                                <textarea name="footerContent" value={formState.footerContent} onChange={handleChange} rows={12} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" placeholder="Coordonnées, mentions légales, etc."/>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="max-w-md space-y-6">
                                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Identifiant Admin</label>
                                                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                                                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                        </svg>
                                                    </div>
                                                    <input type="text" name="adminUsername" value={formState.adminUsername || ''} onChange={handleChange} className="flex-grow px-2 py-2 text-lg font-bold text-gray-800 outline-none" placeholder="Identifiant"/>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                {isChangingPassword ? (
                                                    <div className="space-y-5 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200 shadow-inner">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest">Nouveau mot de passe</h4>
                                                            <button type="button" onClick={() => {setIsChangingPassword(false); setPasswordError(null);}} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Annuler</button>
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            <input 
                                                                type="password" 
                                                                value={oldPassword}
                                                                onChange={(e) => setOldPassword(e.target.value)}
                                                                className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                                                placeholder="Ancien mot de passe"
                                                            />
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
                                                        </div>

                                                        {passwordError && (
                                                            <p className="text-[11px] text-red-600 font-bold bg-white p-2.5 rounded-lg border border-red-100 shadow-sm">
                                                                ⚠️ {passwordError}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Mot de passe</label>
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
                                                                Changer
                                                            </button>
                                                        </div>
                                                    </div>
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
                                        onClick={() => {setFormState(settings); setIsChangingPassword(false); setPasswordError(null);}} 
                                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Annuler
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
