
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../../AppContext';
import { AnimatorSettings, Holiday } from '../../types';
import { AdminSubComponentProps } from './types';
import { toYYYYMMDD } from '../../utils/date';
import { PencilIcon, TrashIcon, CalendarDaysIcon } from '../Icons';
import ConfirmationModal from '../shared/ConfirmationModal';
import HolidayEditModal from './HolidayEditModal';

const ManageCalendar: React.FC<AdminSubComponentProps> = ({ showNotification, setHasUnsavedChanges: setParentUnsavedChanges, registerSave }) => {
    const { settings, updateSettings, currentUser } = useContext(AppContext);
    const animators = useMemo(() => settings.animators || [], [settings.animators]);
    const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
    
    // Scoping for user role
    const isRestrictedUser = currentUser?.role === 'user';
    const linkedAnimator = currentUser?.animatorName;
    const canManageVacations = currentUser?.role === 'admin' || currentUser?.permissions.canManageVacations;

    const [selectedAnimatorName, setSelectedAnimatorName] = useState<string>(() => {
        if (isRestrictedUser && linkedAnimator) return linkedAnimator;
        return (animators[0] && animators[0].name) || '';
    });
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [inactiveSlots, setInactiveSlots] = useState<number[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    
    const [noLimit, setNoLimit] = useState<boolean>(true);
    const [monthlyBookingLimit, setMonthlyBookingLimit] = useState<number | undefined>(undefined);
    
    const canEditCurrentAnimatorSettings = useMemo(() => {
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.role === 'user') {
            const linked = currentUser.animatorName;
            if (!linked) return false; // Non-linked users can only view, not edit
            return selectedAnimatorName === linked; // Linked users can modify only their own
        }
        return false;
    }, [currentUser, selectedAnimatorName]);

    const [startYear, endYear] = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
            const currentY = new Date().getFullYear();
            return [currentY, currentY + 1]; // Fallback
        }
        return [years[0], years[1]];
    }, [settings.activeYear]);

    const isHolidayInActiveYear = (h: Holiday, activeYear: string) => {
        if (!activeYear) return false;
        if (h.name.includes(activeYear)) return true;
        if (!h.startDate || !h.endDate) return false;
        
        try {
            const years = activeYear.split('-').map(Number);
            if (years.length !== 2) return false;
            const [sY, eY] = years;
            
            const startLimit = new Date(sY, 9, 1); // 1er Octobre startYear
            const endLimit = new Date(eY, 5, 30); // 30 Juin endYear
            
            const hStart = new Date(h.startDate.replace(/-/g, '/'));
            const hEnd = new Date(h.endDate.replace(/-/g, '/'));
            
            return (hStart >= startLimit && hStart <= endLimit) || 
                   (hEnd >= startLimit && hEnd <= endLimit);
        } catch (e) {
            return false;
        }
    };

    const activeHolidays = useMemo(() => {
        return (settings.holidays || []).filter(h => isHolidayInActiveYear(h, settings.activeYear));
    }, [settings.holidays, settings.activeYear]);

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

    const timeSlots = useMemo(() => {
        return settings.availableTimeSlots || [9, 10, 14, 15];
    }, [settings.availableTimeSlots]);

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
        const activeYear = settings.activeYear;
        if (!activeYear) return;

        const defaultNames = [
            `Vacances de la Toussaint (${activeYear})`,
            `Vacances de Noël (${activeYear})`,
            `Vacances d'hiver (${activeYear})`,
            `Vacances de Printemps (${activeYear})`
        ];

        const currentHolidays = settings.holidays || [];
        const missingNames = defaultNames.filter(name => !currentHolidays.some(h => h.name === name));

        if (missingNames.length > 0) {
            const newHolidays = [
                ...currentHolidays,
                ...missingNames.map(name => ({
                    name,
                    startDate: '',
                    endDate: ''
                }))
            ];
            updateSettings({ holidays: newHolidays });
        }
    }, [settings.activeYear, settings.holidays, updateSettings]);
    
    useEffect(() => {
        if (selectedAnimatorName) {
            const animSettings = settings.animatorSettings?.[selectedAnimatorName] || { unavailableDates: [], inactiveSlots: [] };
            setInactiveSlots(animSettings.inactiveSlots || []);
            setSelectedDates(animSettings.unavailableDates || []);
            const limit = animSettings.monthlyBookingLimit;
            setMonthlyBookingLimit(limit);
            setNoLimit(limit === undefined);
            setHasUnsavedChanges(false);
        } else {
            setInactiveSlots([]);
            setSelectedDates([]);
            setMonthlyBookingLimit(undefined);
            setNoLimit(true);
            setHasUnsavedChanges(false);
        }
    }, [selectedAnimatorName, settings.animatorSettings]);

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
        updateSettings({ activeYear: newActiveYear });
        showNotification("Année scolaire active mise à jour !");
    };

    const handleDateClick = (dateStr: string) => {
        if (!selectedAnimatorName) return;
        
        const isCurrentlyUnavailable = selectedDates.includes(dateStr);
        const newUnavailabilities = isCurrentlyUnavailable
            ? selectedDates.filter(d => d !== dateStr)
            : [...selectedDates, dateStr].sort();

        setSelectedDates(newUnavailabilities);
        setHasUnsavedChanges(true);
    };

    const toggleCheckDate = (dateStr: string) => {
        const newChecked = new Set(checkedDates);
        if (newChecked.has(dateStr)) newChecked.delete(dateStr);
        else newChecked.add(dateStr);
        setCheckedDates(newChecked);
    };

    const deleteCheckedDates = () => {
        if (!selectedAnimatorName || checkedDates.size === 0) return;
        
        const newUnavailabilities = selectedDates.filter(d => !checkedDates.has(d));
        setSelectedDates(newUnavailabilities);
        setCheckedDates(new Set());
        setHasUnsavedChanges(true);
    };

    const groupedUnavailabilities = useMemo(() => {
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        
        const sortedDates = [...selectedDates].sort();
        
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
    }, [selectedDates]);

    const removeUnavailability = (dateStr: string) => {
        if (!selectedAnimatorName) return;
        setSelectedDates(prev => prev.filter(d => d !== dateStr));
        setHasUnsavedChanges(true);
    };
    
    const handleSlotToggle = (slot: number) => {
        const slotNum = Number(slot);
        setInactiveSlots(currentSlots => {
            const normalized = currentSlots.map(Number);
            if (normalized.includes(slotNum)) {
                return normalized.filter(s => s !== slotNum);
            } else {
                return [...normalized, slotNum];
            }
        });
    };
    
    const handleSaveAnimatorSettings = () => {
        if (!selectedAnimatorName) return;

        const updatedAnimatorSettings: AnimatorSettings = {
            ...selectedAnimatorSettings,
            inactiveSlots: inactiveSlots,
            unavailableDates: selectedDates
        };

        if (noLimit) {
            delete updatedAnimatorSettings.monthlyBookingLimit;
        } else {
            updatedAnimatorSettings.monthlyBookingLimit = monthlyBookingLimit === undefined || isNaN(monthlyBookingLimit) ? 0 : monthlyBookingLimit;
        }

        const newAnimatorSettings = { ...(settings.animatorSettings || {}) };
        newAnimatorSettings[selectedAnimatorName] = updatedAnimatorSettings;
    
        updateSettings({ animatorSettings: newAnimatorSettings });
        setHasUnsavedChanges(false);
        showNotification("Paramètres de l'animateur (dates et créneaux) enregistrés !");
    };

    useEffect(() => {
        if (setParentUnsavedChanges) {
            setParentUnsavedChanges(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, setParentUnsavedChanges]);

    // Keep save handle reference stable
    const saveHandleRef = useRef(handleSaveAnimatorSettings);
    saveHandleRef.current = handleSaveAnimatorSettings;

    useEffect(() => {
        if (registerSave) {
            registerSave(() => {
                saveHandleRef.current();
            });
        }
    }, [registerSave]);

    const handleAddHoliday = (e: React.FormEvent) => {
        e.preventDefault();
        if(newHoliday.name && newHoliday.startDate && newHoliday.endDate) {
            updateSettings({ holidays: [...settings.holidays, newHoliday] });
            setNewHoliday({ name: '', startDate: '', endDate: ''});
            showNotification('Période de vacances ajoutée.');
        }
    }

    const handleUpdateHoliday = (updatedHoliday: Holiday) => {
        const originalHolidayName = editingHoliday!.name;
        const newHolidays = settings.holidays.map(h => h.name === originalHolidayName ? updatedHoliday : h);
        updateSettings({ holidays: newHolidays });
        setEditingHoliday(null);
        showNotification("Période de vacances mise à jour.");
    };
    
    const handleDeleteHoliday = (holidayNameToDelete: string) => {
        setHolidayToDelete(holidayNameToDelete);
    }

    const confirmDeleteHoliday = () => {
        if (!holidayToDelete) return;
        updateSettings({ holidays: settings.holidays.filter(h => h.name !== holidayToDelete) });
        showNotification('Période de vacances supprimée.');
        setHolidayToDelete(null);
    };

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

            <div className="mx-auto max-w-2xl bg-gradient-to-r from-indigo-600/10 via-indigo-600/5 to-transparent p-3 rounded-2xl border border-indigo-200/60 shadow-sm mb-8 flex flex-row items-center justify-between gap-4 px-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
                        <CalendarDaysIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-indigo-950 uppercase tracking-tight">Paramètres du calendrier</h3>
                        <p className="hidden sm:block text-[10px] text-indigo-900/60 font-medium">Déterminez l'année active pour les créneaux.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-sm shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Année active :</span>
                    {!canManageVacations ? (
                        <span className="text-indigo-950 font-black text-xs px-2 py-1">{settings.activeYear}</span>
                    ) : (
                        <select
                            id="activeYear"
                            value={settings.activeYear}
                            onChange={handleYearChange}
                            className="text-center py-1 px-2 border-0 text-indigo-950 font-black rounded bg-white text-xs outline-none transition-all cursor-pointer focus:ring-0"
                        >
                            {schoolYears.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section Indisponibilités & Créneaux */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">Gérer les indisponibilités et créneaux par animateur</h3>
                    <select 
                        value={selectedAnimatorName} 
                        onChange={e => setSelectedAnimatorName(e.target.value)} 
                        className="w-full p-2 border rounded mb-4 bg-white"
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-gray-700">Créneaux désactivés pour "{selectedAnimatorName}" :</h4>
                                        <div className="flex gap-4 mb-3">
                                            {timeSlots.map(slot => (
                                                <label key={slot} className={`flex items-center space-x-2 ${canEditCurrentAnimatorSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}>
                                                    <input
                                                        type="checkbox"
                                                        disabled={!canEditCurrentAnimatorSettings}
                                                        checked={inactiveSlots.map(Number).includes(Number(slot))}
                                                        onChange={() => {
                                                            if (!canEditCurrentAnimatorSettings) return;
                                                            handleSlotToggle(Number(slot));
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                        className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${!canEditCurrentAnimatorSettings ? 'cursor-not-allowed opacity-60' : ''}`}
                                                    />
                                                    <span>{slot}h</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 text-gray-700">Limite mensuelle de réservations :</h4>
                                        <div className="space-y-3">
                                            <label className={`flex items-center gap-2 group ${canEditCurrentAnimatorSettings ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                <input 
                                                    type="checkbox"
                                                    disabled={!canEditCurrentAnimatorSettings}
                                                    checked={noLimit}
                                                    onChange={(e) => {
                                                        if (!canEditCurrentAnimatorSettings) return;
                                                        const checked = e.target.checked;
                                                        setNoLimit(checked);
                                                        if (checked) setMonthlyBookingLimit(undefined);
                                                        else if (monthlyBookingLimit === undefined) setMonthlyBookingLimit(0);
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                    className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${!canEditCurrentAnimatorSettings ? 'cursor-not-allowed' : ''}`}
                                                />
                                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Pas de limite</span>
                                            </label>
                                            
                                            {!noLimit && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        disabled={!canEditCurrentAnimatorSettings}
                                                        value={monthlyBookingLimit ?? 0}
                                                        onChange={(e) => {
                                                            if (!canEditCurrentAnimatorSettings) return;
                                                            setMonthlyBookingLimit(parseInt(e.target.value) || 0);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                        className="w-20 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm disabled:opacity-60 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">réservations / mois</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        
                            <h4 className="font-semibold mb-2 text-gray-700">Jours d'indisponibilité de l'animateur :</h4>
                            {canEditCurrentAnimatorSettings ? (
                                <p className="text-xs text-gray-500 mb-4 italic">Cliquez sur une date dans le calendrier pour l'ajouter ou la supprimer.</p>
                            ) : (
                                <p className="text-xs text-amber-600 mb-4 font-semibold italic">👁️ Mode lecture seule : Vous visualisez les indisponibilités de cet animateur.</p>
                            )}
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
                                    const isUnavailable = selectedDates.includes(dateStr);
                                    let classes = "p-1 rounded transition-colors ";
                                    if (canEditCurrentAnimatorSettings) {
                                        classes += "cursor-pointer hover:bg-gray-200 ";
                                    } else {
                                        classes += "cursor-not-allowed ";
                                    }
                                    if (isUnavailable) classes += "bg-red-500 text-white font-bold shadow-sm";
                                    else classes += "text-gray-700";

                                    return (
                                        <div 
                                            key={day} 
                                            className={classes} 
                                            onClick={() => canEditCurrentAnimatorSettings && handleDateClick(dateStr)}
                                        >
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>

                            {canEditCurrentAnimatorSettings && (
                                <div className="mb-8">
                                <button 
                                    onClick={handleSaveAnimatorSettings} 
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                                        hasUnsavedChanges 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 animate-pulse' 
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                                >
                                    {hasUnsavedChanges ? (
                                        <>💾 Sauvegarder les modifications</>
                                    ) : (
                                        <>✅ Paramètres à jour</>
                                    )}
                                </button>
                                {hasUnsavedChanges && (
                                    <p className="text-center text-amber-600 text-sm font-bold mt-2 animate-bounce">
                                        ⚠️ Pensez à enregistrer vos modifications avant de quitter !
                                    </p>
                                )}
                            </div>
                            )}
                            
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
                <div className="bg-white p-6 rounded-lg shadow">
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
                                {activeHolidays.map(h => (
                                    <div key={h.name} className="flex justify-between items-center p-2 bg-yellow-100 rounded">
                                        <div>
                                            <p className="font-semibold">{h.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {h.startDate && h.endDate ? (
                                                    `${new Date(h.startDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')} - ${new Date(h.endDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')}`
                                                ) : (
                                                    <span className="text-amber-600 italic font-medium">Dates non renseignées ⚠️</span>
                                                )}
                                            </p>
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
                        <>
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
                                ℹ️ Mode lecture seule: Vous pouvez consulter les périodes de vacances scolaires ci-dessous, mais vous n'avez pas l'autorisation de les modifier.
                            </div>
                            <div className="space-y-2">
                                {activeHolidays.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center p-4">Aucune période de vacances configurée pour cette année scolaire.</p>
                                ) : (
                                    activeHolidays.map(h => (
                                        <div key={h.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{h.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {h.startDate && h.endDate ? (
                                                        `${new Date(h.startDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')} - ${new Date(h.endDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')}`
                                                    ) : (
                                                        <span className="text-amber-600 italic font-medium">Dates non renseignées ⚠️</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
             {editingHoliday && <HolidayEditModal holiday={editingHoliday} onSave={handleUpdateHoliday} onCancel={() => setEditingHoliday(null)} />}
             <ConfirmationModal 
                isOpen={!!holidayToDelete}
                title="Supprimer les vacances"
                message={`Êtes-vous sûr de vouloir supprimer la période "${holidayToDelete}" ?`}
                confirmLabel="Supprimer"
                isDanger={true}
                onConfirm={confirmDeleteHoliday}
                onCancel={() => setHolidayToDelete(null)}
            />
        </div>
    );
};

export default ManageCalendar;
