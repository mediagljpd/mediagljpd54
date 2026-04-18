
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { AnimatorSettings, Holiday } from '../../types';
import { AdminSubComponentProps } from './types';
import { toYYYYMMDD } from '../../utils/date';
import { PencilIcon, TrashIcon } from '../Icons';
import HolidayEditModal from './HolidayEditModal';

const ManageCalendar: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings, currentUser } = useContext(AppContext);
    const animators = useMemo(() => settings.animators || [], [settings.animators]);
    
    // Scoping for user role
    const isRestrictedUser = currentUser?.role === 'user';
    const linkedAnimator = currentUser?.animatorName;
    const canManageVacations = currentUser?.role === 'admin' || currentUser?.permissions.canManageVacations;

    const [selectedAnimatorName, setSelectedAnimatorName] = useState<string>(() => {
        if (isRestrictedUser && linkedAnimator) return linkedAnimator;
        return (animators[0] && animators[0].name) || '';
    });
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

    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // On initialise par défaut sur le mois actuel si on est dans l'année scolaire active
        // L'année scolaire va d'Octobre (9) de startYear à Juin (5) de endYear
        const years = settings.activeYear.split('-').map(Number);
        const sY = years[0];
        const eY = years[1];
        
        const isWithinRange = (currentYear === sY && currentMonth >= 9) || 
                             (currentYear === eY && currentMonth <= 5);
        
        if (isWithinRange) {
            return new Date(currentYear, currentMonth, 1);
        }
        return new Date(sY || now.getFullYear(), 9, 1);
    });
    const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
    const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: ''});
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    const selectedAnimatorSettings = useMemo<AnimatorSettings>(() => {
        return settings.animatorSettings?.[selectedAnimatorName] || { unavailableDates: [], inactiveSlots: [] };
    }, [settings.animatorSettings, selectedAnimatorName]);

    const timeSlots = useMemo(() => [9, 10, 14, 15], []);

    useEffect(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const isWithinRange = (currentYear === startYear && currentMonth >= 9) || 
                             (currentYear === endYear && currentMonth <= 5);
        
        if (isWithinRange) {
            setCurrentDate(new Date(currentYear, currentMonth, 1));
        } else {
            setCurrentDate(new Date(startYear, 9, 1));
        }
    }, [startYear, endYear]);
    
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
        if (!selectedAnimatorName) return;
        
        const isCurrentlyUnavailable = selectedAnimatorSettings.unavailableDates.includes(dateStr);
        const newUnavailabilities = isCurrentlyUnavailable
            ? selectedAnimatorSettings.unavailableDates.filter(d => d !== dateStr)
            : [...selectedAnimatorSettings.unavailableDates, dateStr].sort();

        const newAnimatorSettings = { ...(settings.animatorSettings || {}) };
        newAnimatorSettings[selectedAnimatorName] = {
            ...selectedAnimatorSettings,
            unavailableDates: newUnavailabilities,
        };
        
        updateSettings({ ...settings, animatorSettings: newAnimatorSettings });
        showNotification(isCurrentlyUnavailable ? "Date de nouveau disponible" : "Date rendue indisponible");
    };

    const toggleCheckDate = (dateStr: string) => {
        const newChecked = new Set(checkedDates);
        if (newChecked.has(dateStr)) newChecked.delete(dateStr);
        else newChecked.add(dateStr);
        setCheckedDates(newChecked);
    };

    const deleteCheckedDates = () => {
        if (!selectedAnimatorName || checkedDates.size === 0) return;
        
        const newAnimatorSettings = { ...(settings.animatorSettings || {}) };
        newAnimatorSettings[selectedAnimatorName] = {
            ...selectedAnimatorSettings,
            unavailableDates: selectedAnimatorSettings.unavailableDates.filter(d => !checkedDates.has(d)),
        };

        updateSettings({ ...settings, animatorSettings: newAnimatorSettings });
        setCheckedDates(new Set());
        showNotification(`${checkedDates.size} date(s) supprimée(s).`);
    };

    const groupedUnavailabilities = useMemo(() => {
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        
        const sortedDates = [...selectedAnimatorSettings.unavailableDates].sort();
        
        const grouped: Record<string, { label: string, dates: string[], sortKey: number }> = {};
        
        sortedDates.forEach(dateStr => {
            const date = new Date(dateStr.replace(/-/g, '/'));
            const m = date.getMonth();
            const y = date.getFullYear();
            const key = `${y}-${m.toString().padStart(2, '0')}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    label: `${monthNames[m]} ${y}`,
                    dates: [],
                    sortKey: y * 100 + m
                };
            }
            grouped[key].dates.push(dateStr);
        });
        
        return Object.values(grouped).sort((a, b) => a.sortKey - b.sortKey);
    }, [selectedAnimatorSettings.unavailableDates]);

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
                        disabled={!canManageVacations}
                        className="p-2 border rounded w-48 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    <select 
                        value={selectedAnimatorName} 
                        onChange={e => setSelectedAnimatorName(e.target.value)} 
                        disabled={isRestrictedUser && !!linkedAnimator}
                        className="w-full p-2 border rounded mb-4 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
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
                        
                            <h4 className="font-semibold mb-2 text-gray-700">Gérer les jours d'indisponibilité :</h4>
                            <p className="text-xs text-gray-500 mb-4 italic">Cliquez sur une date dans le calendrier pour l'ajouter ou la supprimer.</p>
                            {/* Mini Calendar for selection */}
                            <div className="flex justify-between items-center mb-2">
                                <button 
                                    type="button"
                                    onClick={() => changeMonth(-1)}
                                    disabled={isAtFirstMonth}
                                    className="px-3 py-1 text-lg rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Mois précédent"
                                >&lt;</button>
                                <span className="font-semibold text-lg text-gray-700">{monthNames[month]} {year}</span>
                                <button 
                                    type="button"
                                    onClick={() => changeMonth(1)}
                                    disabled={isAtLastMonth}
                                    className="px-3 py-1 text-lg rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Mois suivant"
                                >&gt;</button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-6">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={`${d}-${i}`} className="font-semibold">{d}</div>)}
                                {Array.from({ length: startingDay }).map((_, i) => <div key={`e-${i}`}></div>)}
                                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                    const day = dayIndex + 1;
                                    const date = new Date(year, month, day);
                                    const dateStr = toYYYYMMDD(date);
                                    const isUnavailable = selectedAnimatorSettings.unavailableDates.includes(dateStr);
                                    let classes = "p-1 rounded cursor-pointer transition-colors ";
                                    if (isUnavailable) classes += "bg-red-500 text-white font-bold shadow-sm";
                                    else classes += "hover:bg-gray-200 text-gray-700";

                                    return <div key={day} className={classes} onClick={() => handleDateClick(dateStr)}>{day}</div>;
                                })}
                            </div>
                            
                            {selectedAnimatorSettings.unavailableDates.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-gray-800">Dates indisponibles pour "{selectedAnimatorName}" :</h4>
                                        {checkedDates.size > 0 && (
                                            <button 
                                                onClick={deleteCheckedDates}
                                                className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors flex items-center gap-1"
                                            >
                                                <TrashIcon className="w-3 h-3" />
                                                Supprimer la sélection ({checkedDates.size})
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {groupedUnavailabilities.map(group => (
                                            <div key={group.label} className="space-y-2">
                                                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 py-1 px-2 rounded">{group.label}</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {group.dates.map(d => (
                                                        <div key={d} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors group">
                                                            <div className="flex items-center gap-3">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={checkedDates.has(d)}
                                                                    onChange={() => toggleCheckDate(d)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {new Date(d.replace(/-/g, '/')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => removeUnavailability(d)} 
                                                                className="text-gray-300 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Supprimer"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                {/* Section Vacances */}
                <div className={`bg-white p-6 rounded-lg shadow ${!canManageVacations ? 'opacity-60 grayscale' : ''}`}>
                    <h3 className="text-xl font-semibold mb-4">Gérer les périodes de vacances</h3>
                    {canManageVacations ? (
                        <>
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
                        </>
                    ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold italic">Accès restreint : Seul l'administrateur peut gérer les vacances.</p>
                        </div>
                    )}
                </div>
            </div>
             {editingHoliday && <HolidayEditModal holiday={editingHoliday} onSave={handleUpdateHoliday} onCancel={() => setEditingHoliday(null)} />}
        </div>
    );
};

export default ManageCalendar;
