
import React, { useState, useContext, useMemo } from 'react';
import { Animation, Booking } from '../../types';
import { toYYYYMMDD } from '../../utils/date';
import { AppContext } from '../../AppContext';
import { SearchIcon, MapPinIcon, AcademicCapIcon, BuildingLibraryIcon } from '../Icons';

const BookingForm: React.FC<{ animation: Animation, date: Date, time: number, onConfirm: (formData: Omit<Booking, 'id' | 'animationTitle'>) => void, onCancel: () => void }> = ({ animation, date, time, onConfirm, onCancel }) => {
    const { settings } = useContext(AppContext);
    const [formData, setFormData] = useState({
        animationId: animation.id,
        date: toYYYYMMDD(date),
        time: time,
        teacherName: '',
        classLevel: '',
        commune: '',
        schoolName: '',
        phoneNumber: '',
        email: '',
        studentCount: '' as any,
        adultCount: '' as any,
        busInfo: '',
        noBusRequired: false,
    });

    const [communeSearch, setCommuneSearch] = useState('');
    const [showCommuneList, setShowCommuneList] = useState(false);
    const [selectedCommuneId, setSelectedCommuneId] = useState<string | null>(null);

    const filteredCommunes = useMemo(() => {
        if (!communeSearch) return settings.communes || [];
        return (settings.communes || []).filter(c => 
            c.name.toLowerCase().includes(communeSearch.toLowerCase()) || 
            c.postalCode.includes(communeSearch)
        );
    }, [settings.communes, communeSearch]);

    const filteredSchools = useMemo(() => {
        if (!selectedCommuneId) return [];
        return (settings.schools || []).filter(s => s.communeId === selectedCommuneId);
    }, [settings.schools, selectedCommuneId]);

    const selectedSchool = useMemo(() => {
        return (settings.schools || []).find(s => s.name === formData.schoolName && s.communeId === selectedCommuneId);
    }, [settings.schools, formData.schoolName, selectedCommuneId]);

    const [showErrors, setShowErrors] = useState(false);

    const handleClassLevelToggle = (level: string) => {
        const currentLevels = formData.classLevel ? formData.classLevel.split(', ') : [];
        let newLevels;
        if (currentLevels.includes(level)) {
            newLevels = currentLevels.filter(l => l !== level);
        } else {
            newLevels = [...currentLevels, level];
        }
        setFormData(prev => ({ ...prev, classLevel: newLevels.join(', ') }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseInt(value) : value);
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.classLevel) {
            setShowErrors(true);
            return;
        }

        // Initialisation des statuts bus pour l'admin
        onConfirm({
            ...formData,
            studentCount: parseInt(formData.studentCount as any) || 0,
            adultCount: parseInt(formData.adultCount as any) || 0,
            busStatus: formData.noBusRequired ? 'validated' : 'pending',
            busCost: 0
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onCancel}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Réservation pour "{animation.title}"</h2>
                <p className="mb-6 text-gray-600">Le {date.toLocaleDateString('fr-FR')} à {time}h00</p>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700">Nom de l'enseignant</label>
                        <input id="teacherName" type="text" name="teacherName" placeholder="ex: Jean Dupont" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                            Niveau de la classe
                        </label>
                        <div className={`flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border transition-colors ${showErrors && !formData.classLevel ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                            {(settings.classLevels || ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2']).map(level => (
                                <label key={level} className={`flex items-center px-2.5 py-1 rounded-full border cursor-pointer transition-all text-xs font-bold ${
                                    formData.classLevel.split(', ').includes(level)
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                                }`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={formData.classLevel.split(', ').includes(level)}
                                        onChange={() => {
                                            handleClassLevelToggle(level);
                                            if (showErrors) setShowErrors(false);
                                        }}
                                    />
                                    {level}
                                </label>
                            ))}
                        </div>
                        {showErrors && !formData.classLevel && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">Veuillez sélectionner au moins un niveau.</p>
                        )}
                        <input type="hidden" name="classLevel" value={formData.classLevel} />
                    </div>

                    <div className="col-span-2 md:col-span-1 relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-red-500" />
                            Commune
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Tapez le nom ou le code postal..." 
                                value={communeSearch || formData.commune}
                                onChange={(e) => {
                                    setCommuneSearch(e.target.value);
                                    setShowCommuneList(true);
                                    if (formData.commune) {
                                        setFormData(prev => ({ ...prev, commune: '', schoolName: '' }));
                                        setSelectedCommuneId(null);
                                    }
                                }}
                                onFocus={() => setShowCommuneList(true)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                            />
                            <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        </div>
                        
                        {showCommuneList && filteredCommunes.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {filteredCommunes.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, commune: `${c.name} (${c.postalCode})` }));
                                            setCommuneSearch(`${c.name} (${c.postalCode})`);
                                            setSelectedCommuneId(c.id);
                                            setShowCommuneList(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b last:border-0 text-sm"
                                    >
                                        <span className="font-bold text-gray-800">{c.name}</span>
                                        <span className="ml-2 text-gray-500 font-mono">({c.postalCode})</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <BuildingLibraryIcon className="w-4 h-4 text-indigo-500" />
                            Nom de l'école
                        </label>
                        <select 
                            name="schoolName" 
                            value={formData.schoolName}
                            onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                            disabled={!selectedCommuneId}
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">-- Sélectionnez une école --</option>
                            {filteredSchools.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        {selectedSchool && (
                            <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-100 flex items-start gap-2">
                                <MapPinIcon className="w-3.5 h-3.5 text-indigo-400 mt-0.5" />
                                <p className="text-[11px] text-indigo-700 leading-tight">
                                    <span className="font-bold">Adresse :</span> {selectedSchool.address}
                                </p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                        <input
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            placeholder="ex: 0612345678"
                            onChange={handleChange}
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
                        <input id="email" type="email" name="email" placeholder="ex: jean.dupont@academie.fr" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700">Nombre d'élèves</label>
                        <input 
                            id="studentCount" 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="studentCount" 
                            value={formData.studentCount} 
                            placeholder="ex: 25"
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setFormData(prev => ({ ...prev, studentCount: val }));
                            }} 
                            required 
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="adultCount" className="block text-sm font-medium text-gray-700">Nombre d'adultes</label>
                        <input 
                            id="adultCount" 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="adultCount" 
                            value={formData.adultCount} 
                            placeholder="ex: 2"
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setFormData(prev => ({ ...prev, adultCount: val }));
                            }} 
                            required 
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Section Bus */}
                    <div className="col-span-2 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                            <input 
                                type="checkbox" 
                                name="noBusRequired" 
                                checked={formData.noBusRequired} 
                                onChange={handleChange}
                                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-blue-300"
                            />
                            <span className="text-sm font-bold text-blue-900">
                                Nous ne souhaitons pas bénéficier de la prise en charge du bus par le Grand Longwy
                            </span>
                        </label>

                        <div className={formData.noBusRequired ? 'opacity-40 grayscale pointer-events-none' : ''}>
                            <label htmlFor="busInfo" className="block text-sm font-bold text-gray-700 mb-1">
                                Consignes pour le bus
                            </label>
                            <textarea 
                                id="busInfo" 
                                name="busInfo" 
                                value={formData.busInfo}
                                placeholder="Où et à quelle heure doit passer le bus ? Précisez l'horaire et l'adresse…" 
                                onChange={handleChange} 
                                required={!formData.noBusRequired}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-300 rounded-md font-bold hover:bg-gray-400">Annuler</button>
                        <button type="submit" className="px-8 py-2 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 shadow-md transform active:scale-95 transition-all">Confirmer la réservation</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingForm;
