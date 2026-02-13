
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../App';
import { AnimatorSettings, Holiday } from '../../types';
import { AdminSubComponentProps } from './types';
import { toYYYYMMDD } from '../../utils/date';
import { PencilIcon, TrashIcon } from '../Icons';
import HolidayEditModal from './HolidayEditModal';

const ManageCalendar: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings } = useContext(AppContext);
    const animators = useMemo(() => settings.animators || [], [settings.animators]);
    const [selectedAnimatorName, setSelectedAnimatorName] = useState<string>((animators[0] && animators[0].name) || '');
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [inactiveSlots, setInactiveSlots] = useState<number[]>([]);
    
    const [startYear, endYear] = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
            const currentY = new Date().getFullYear();
            return [currentY, currentY + 1]; // Fallback
        }
        return [years[0], years[1]];
    }, [settings.activeYear]);

    const [currentDate, setCurrentDate] = useState(new Date(startYear, 9, 1));
    const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: ''});
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    const selectedAnimatorSettings = useMemo<AnimatorSettings>(() => {
        return settings.animatorSettings?.[selectedAnimatorName] || { unavailableDates: [], inactiveSlots: [] };
    }, [settings.animatorSettings, selectedAnimatorName]);

    const timeSlots = useMemo(() => [9, 10, 14, 15], []);

    useEffect(() => {
        setCurrentDate(new Date(startYear, 9, 1));
    }, [startYear]);
    
     useEffect(() => {
        if (selectedAnimatorName) {
            setInactiveSlots(selectedAnimatorSettings.inactiveSlots);
        } else {
            setInactiveSlots([]);
        }
    }, [selectedAnimatorSettings, selectedAnimatorName]);

    const schoolYears = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Détection de l'année scolaire pivot
        // Si on est entre Janvier (0) et Juin (5), l'année scolaire en cours a démarré l'année dernière.
        // Sinon (Juillet à Décembre), l'année scolaire en cours démarre cette année.
        const baseYear = currentMonth < 6 ? currentYear - 1 : currentYear;
        
        const years = [];
        // On propose l'année scolaire en cours et les 5 années suivantes
        for (let i = 0; i <= 5; i++) {
            const startYear = baseYear + i;
            const endYear = startYear + 1;
            years.push(`${startYear}-${endYear}`);
        }

        // Sécurité : Si l'année enregistrée dans les settings est plus ancienne que notre pivot, 
        // on l'ajoute quand même pour qu'elle reste sélectionnée et visible.
        if (!years.includes(settings.activeYear)) {
            years.push(settings.activeYear);
            years.sort();
        }
        return years;
    }, [settings.activeYear]);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newActiveYear = e.target.value;
        updateSettings({ ...settings, activeYear: newActiveYear });
        showNotification("Année scolaire active mise à jour !");
    };

    const handleDateClick = (dateStr: string) => {
        const newSelection = new Set(selectedDates);
        if (newSelection.has(dateStr)) {
            newSelection.delete(dateStr);
        } else {
            newSelection.add(dateStr);
        }
        setSelectedDates(newSelection);
    };

    const saveUnavailabilities = () => {
        if (!selectedAnimatorName) return;
        const existingUnavailabilities = new Set(selectedAnimatorSettings.unavailableDates);
        selectedDates.forEach(d => existingUnavailabilities.add(d));

        const newAnimatorSettings = { ...(settings.animatorSettings || {}) };
        newAnimatorSettings[selectedAnimatorName] = {
            ...selectedAnimatorSettings,
            unavailableDates: Array.from(existingUnavailabilities).sort(),
        };
        
        updateSettings({ ...settings, animatorSettings: newAnimatorSettings });
        setSelectedDates(new Set());
        showNotification("Indisponibilités enregistrées !");
    };

    const removeUnavailability = (dateStr: string) => {
        if (!selectedAnimatorName) return;
        
        const newAnimatorSettings = { ...(settings.animatorSettings || {}) };
        newAnimatorSettings[selectedAnimatorName] = {
            ...selectedAnimatorSettings,
            unavailableDates: selectedAnimatorSettings.unavailableDates.filter(d => d !== dateStr),
        };

        updateSettings({ ...settings, animatorSettings: newAnimatorSettings });
        showNotification('Indisponibilité supprimée.');
    };
    
    const handleSlotToggle = (slot: number) => {
        setInactiveSlots(currentSlots =>
            currentSlots.includes(slot)
                ? currentSlots.filter(s => s !== slot)
                : [...currentSlots, slot]
        );
    };
    
    const handleSaveSlots = () => {
        if (!selectedAnimatorName) return;

        const newAnimatorSettings = { ...(settings.animatorSettings || {}) };
        newAnimatorSettings[selectedAnimatorName] = {
            ...selectedAnimatorSettings,
            inactiveSlots: inactiveSlots,
        };
    
        updateSettings({ ...settings, animatorSettings: newAnimatorSettings });
        showNotification("Créneaux horaires mis à jour !");
    };

    const handleAddHoliday = (e: React.FormEvent) => {
        e.preventDefault();
        if(newHoliday.name && newHoliday.startDate && newHoliday.endDate) {
            updateSettings({ ...settings, holidays: [...settings.holidays, newHoliday] });
            setNewHoliday({ name: '', startDate: '', endDate: ''});
            showNotification('Période de vacances ajoutée.');
        }
    }

    const handleUpdateHoliday = (updatedHoliday: Holiday) => {
        const originalHolidayName = editingHoliday!.name;
        const newHolidays = settings.holidays.map(h => h.name === originalHolidayName ? updatedHoliday : h);
        updateSettings({ ...settings, holidays: newHolidays });
        setEditingHoliday(null);
        showNotification("Période de vacances mise à jour.");
    };
    
    const handleDeleteHoliday = (holidayNameToDelete: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette période de vacances ?")) {
            updateSettings({ ...settings, holidays: settings.holidays.filter(h => h.name !== holidayNameToDelete) });
            showNotification('Période de vacances supprimée.');
        }
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth -1;

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); // Avoid month skipping issues
            newDate.setMonth(prev.getMonth() + offset);

            const newYear = newDate.getFullYear();
            const newMonth = newDate.getMonth(); // 0 = Jan, 9 = Oct, 5 = June

            // School year starts in October (month 9)
            if (newYear < startYear || (newYear === startYear && newMonth < 9)) {
                return prev; // Do not go before October of start year
            }

            // School year ends in June (month 5)
            if (newYear > endYear || (newYear === endYear && newMonth > 5)) {
                return prev; // Do not go after June of end year
            }
            
            return newDate;
        });
    };
    
    const isAtFirstMonth = year === startYear && month === 9; // October
    const isAtLastMonth = year === endYear && month === 5; // June

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gérer le calendrier</h2>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-xl font-semibold mb-4">Paramètres du calendrier</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="activeYear" className="font-medium text-gray-700">Année scolaire active :</label>
                    <select
                        id="activeYear"
                        value={settings.activeYear}
                        onChange={handleYearChange}
                        className="p-2 border rounded w-48 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {schoolYears.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section Indisponibilités & Créneaux */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">Gérer les indisponibilités et créneaux par animateur</h3>
                    <select value={selectedAnimatorName} onChange={e => setSelectedAnimatorName(e.target.value)} className="w-full p-2 border rounded mb-4 bg-white">
                        {animators.length > 0 ? (
                           animators.map(animator => <option key={animator.name} value={animator.name}>{animator.name}</option>)
                        ) : (
                           <option value="">-- Aucun animateur configuré --</option>
                        )}
                    </select>

                    {selectedAnimatorName && (
                        <>
                            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-semibold mb-2 text-gray-700">Désactiver des créneaux pour "{selectedAnimatorName}" :</h4>
                                <div className="flex gap-4 mb-3">
                                    {timeSlots.map(slot => (
                                        <label key={slot} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={inactiveSlots.includes(slot)}
                                                onChange={() => handleSlotToggle(slot)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span>{slot}h</span>
                                        </label>
                                    ))}
                                </div>
                                <button onClick={handleSaveSlots} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                                    Sauvegarder les créneaux
                                </button>
                            </div>
                        
                            <h4 className="font-semibold mb-2 text-gray-700">Ajouter des jours d'indisponibilité :</h4>
                            {/* Mini Calendar for selection */}
                            <div className="flex justify-between items-center mb-2">
                                <button 
                                    onClick={() => changeMonth(-1)}
                                    disabled={isAtFirstMonth}
                                    className="px-3 py-1 text-lg rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Mois précédent"
                                >&lt;</button>
                                <span className="font-semibold text-lg text-gray-700">{monthNames[month]} {year}</span>
                                <button 
                                    onClick={() => changeMonth(1)}
                                    disabled={isAtLastMonth}
                                    className="px-3 py-1 text-lg rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Mois suivant"
                                >&gt;</button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="font-semibold">{d}</div>)}
                                {Array.from({ length: startingDay }).map((_, i) => <div key={`e-${i}`}></div>)}
                                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                    const day = dayIndex + 1;
                                    const date = new Date(year, month, day);
                                    const dateStr = toYYYYMMDD(date);
                                    const isSelected = selectedDates.has(dateStr);
                                    const isUnavailable = selectedAnimatorSettings.unavailableDates.includes(dateStr);
                                    let classes = "p-1 rounded cursor-pointer ";
                                    if (isSelected) classes += "bg-blue-500 text-white";
                                    else if (isUnavailable) classes += "bg-red-300 line-through";
                                    else classes += "hover:bg-gray-200";

                                    return <div key={day} className={classes} onClick={() => handleDateClick(dateStr)}>{day}</div>;
                                })}
                            </div>
                            
                            <div className="mt-4 flex gap-2">
                                <button onClick={saveUnavailabilities} className="flex-grow bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400" disabled={selectedDates.size === 0}>
                                    Rendre indisponible(s)
                                </button>
                                <button onClick={() => setSelectedDates(new Set())} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50" disabled={selectedDates.size === 0}>
                                    Annuler
                                </button>
                            </div>


                            {selectedAnimatorSettings.unavailableDates.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold">Dates indisponibles pour "{selectedAnimatorName}":</h4>
                                    <ul className="list-disc pl-5 text-sm">
                                        {selectedAnimatorSettings.unavailableDates.sort().map(d => (
                                            <li key={d}>{new Date(d.replace(/-/g, '/')).toLocaleDateString('fr-FR')} <button onClick={() => removeUnavailability(d)} className="text-red-500 ml-2 text-xs">(supprimer)</button></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                {/* Section Vacances */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">Gérer les périodes de vacances</h3>
                    <form onSubmit={handleAddHoliday} className="space-y-3 p-4 border rounded-lg bg-gray-50 mb-4">
                        <input type="text" placeholder="Nom (ex: Vacances d'été)" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="w-full p-2 border rounded" required/>
                        <div className="flex gap-2">
                           <input type="date" value={newHoliday.startDate} onChange={e => setNewHoliday({...newHoliday, startDate: e.target.value})} className="w-full p-2 border rounded" required title="Date de début"/>
                           <input type="date" value={newHoliday.endDate} onChange={e => setNewHoliday({...newHoliday, endDate: e.target.value})} className="w-full p-2 border rounded" required title="Date de fin"/>
                        </div>
                        <button type="submit" className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Ajouter la période</button>
                    </form>
                    
                    <div className="space-y-2">
                        {settings.holidays.map(h => (
                            <div key={h.name} className="flex justify-between items-center p-2 bg-yellow-100 rounded">
                                <div>
                                    <p className="font-semibold">{h.name}</p>
                                    <p className="text-sm text-gray-600">{new Date(h.startDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')} - {new Date(h.endDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="flex items-center">
                                    <button onClick={() => setEditingHoliday(h)} className="text-gray-500 hover:text-indigo-600 p-1" aria-label={`Modifier ${h.name}`}>
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteHoliday(h.name)} className="text-red-600 hover:text-red-800 p-1" aria-label={`Supprimer ${h.name}`}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             {editingHoliday && <HolidayEditModal holiday={editingHoliday} onSave={handleUpdateHoliday} onCancel={() => setEditingHoliday(null)} />}
        </div>
    );
};

export default ManageCalendar;
