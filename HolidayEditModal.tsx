import React, { useState, useEffect } from 'react';
import { Holiday } from '../../types';
import { XIcon } from '../Icons';

const getCleanHolidayName = (name: string): string => {
    return name.replace(/\s*\(\d{4}-\d{4}\)$/, '').trim();
};

const HolidayEditModal: React.FC<{
    holiday: Holiday;
    onSave: (holiday: Holiday) => void;
    onCancel: () => void;
}> = ({ holiday, onSave, onCancel }) => {
    const yearMatch = holiday.name.match(/\((\d{4}-\d{4})\)/);
    const activeYearTag = yearMatch ? yearMatch[0] : '';
    const initialCleanName = getCleanHolidayName(holiday.name);

    const [cleanName, setCleanName] = useState(initialCleanName);
    const [startDate, setStartDate] = useState(holiday.startDate || '');
    const [endDate, setEndDate] = useState(holiday.endDate || '');
    
    // Si c'est un jour unique (ou dates vides et nom d'un jour férié)
    const isPublicHoliday = ['Toussaint', 'Armistice', 'Travail', 'Ascension', 'Victoire'].includes(initialCleanName);
    const [isSingleDay, setIsSingleDay] = useState<boolean>(() => {
        if (!holiday.startDate && !holiday.endDate) return isPublicHoliday;
        return holiday.startDate === holiday.endDate;
    });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    const handleClearDates = () => {
        setStartDate('');
        setEndDate('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalStart = startDate;
        let finalEnd = isSingleDay ? startDate : (endDate || startDate);

        // Si date de fin antérieure à date de début en mode période
        if (!isSingleDay && finalStart && finalEnd && finalEnd < finalStart) {
            const temp = finalStart;
            finalStart = finalEnd;
            finalEnd = temp;
        }

        // On préserve le tag d'année scolaire s'il existait
        const finalName = activeYearTag && !cleanName.includes(activeYearTag)
            ? `${cleanName.trim()} ${activeYearTag}`
            : cleanName.trim();

        onSave({
            name: finalName,
            startDate: finalStart,
            endDate: finalEnd
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    title="Fermer"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {isPublicHoliday ? 'Jour férié' : 'Période scolaire'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800 mt-1">
                        Modifier la période ou le jour férié
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="holiday-name" className="block text-sm font-semibold text-gray-700 mb-1">
                            Nom
                        </label>
                        <input 
                            type="text" 
                            id="holiday-name" 
                            value={cleanName} 
                            onChange={e => setCleanName(e.target.value)} 
                            className="w-full p-2.5 border border-gray-300 rounded-xl shadow-xs text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
                            required 
                        />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <input 
                                    type="checkbox"
                                    checked={isSingleDay}
                                    onChange={e => {
                                        const checked = e.target.checked;
                                        setIsSingleDay(checked);
                                        if (checked && startDate) {
                                            setEndDate(startDate);
                                        }
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                />
                                <span>Journée unique {isPublicHoliday && '(recommandé pour les jours fériés)'}</span>
                            </label>

                            {(startDate || endDate) && (
                                <button 
                                    type="button"
                                    onClick={handleClearDates}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 underline"
                                >
                                    Effacer les dates
                                </button>
                            )}
                        </div>

                        {isSingleDay ? (
                            <div>
                                <label htmlFor="single-date" className="block text-xs font-semibold text-gray-600 mb-1">
                                    Date
                                </label>
                                <input 
                                    type="date" 
                                    id="single-date" 
                                    value={startDate} 
                                    onChange={e => {
                                        setStartDate(e.target.value);
                                        setEndDate(e.target.value);
                                    }} 
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    required 
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="holiday-start" className="block text-xs font-semibold text-gray-600 mb-1">
                                        Date de début
                                    </label>
                                    <input 
                                        type="date" 
                                        id="holiday-start" 
                                        value={startDate} 
                                        onChange={e => {
                                            setStartDate(e.target.value);
                                            if (!endDate) setEndDate(e.target.value);
                                        }} 
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="holiday-end" className="block text-xs font-semibold text-gray-600 mb-1">
                                        Date de fin
                                    </label>
                                    <input 
                                        type="date" 
                                        id="holiday-end" 
                                        value={endDate} 
                                        onChange={e => setEndDate(e.target.value)} 
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        required 
                                    />
                                </div>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-500 italic">
                            💡 {isSingleDay 
                                ? "Cette journée sera automatiquement bloquée et non réservable pour tous les animateurs." 
                                : "Tous les jours compris dans cette période seront bloqués et non réservables pour tous les animateurs."}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors text-sm"
                        >
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HolidayEditModal;
