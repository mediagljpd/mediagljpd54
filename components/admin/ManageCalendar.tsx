
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../../AppContext';
import { AnimatorSettings, Holiday } from '../../types';
import { AdminSubComponentProps } from './types';
import { toYYYYMMDD } from '../../utils/date';
import { PencilIcon, TrashIcon, CalendarDaysIcon, CheckIcon, XIcon } from '../Icons';
import ConfirmationModal from '../shared/ConfirmationModal';
import HolidayEditModal from './HolidayEditModal';

const ManageCalendar: React.FC<AdminSubComponentProps> = ({ 
    showNotification, 
    setHasUnsavedChanges: setParentUnsavedChanges, 
    registerSave,
    registerCancel 
}) => {
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
    const [unavailableReasons, setUnavailableReasons] = useState<Record<string, string>>({});
    const [unavailableHalfDays, setUnavailableHalfDays] = useState<Record<string, 'morning' | 'afternoon'>>({});
    const [inactiveSlots, setInactiveSlots] = useState<number[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    
    const [noLimit, setNoLimit] = useState<boolean>(true);
    const [monthlyBookingLimit, setMonthlyBookingLimit] = useState<number | undefined>(undefined);
    
    // Modal states for editing reason and period
    const [editingReasonDates, setEditingReasonDates] = useState<string[] | null>(null);
    const [reasonInput, setReasonInput] = useState<string>('');
    const [periodInput, setPeriodInput] = useState<'morning' | 'afternoon' | 'full' | 'unchanged'>('full');

    // Context menu state for right-clicking calendar days
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; dateStr: string } | null>(null);
    
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

    const getHolidayForDate = (date: Date, holidays: Holiday[]): Holiday | undefined => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return (holidays || []).find(h => {
            if (!h.startDate || !h.endDate) return false;
            const startDate = new Date(h.startDate.replace(/-/g, '/'));
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(h.endDate.replace(/-/g, '/'));
            endDate.setHours(0, 0, 0, 0);
            return checkDate >= startDate && checkDate <= endDate;
        });
    };

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
            setUnavailableReasons(animSettings.unavailableReasons || {});
            setUnavailableHalfDays(animSettings.unavailableHalfDays || {});
            const limit = animSettings.monthlyBookingLimit;
            setMonthlyBookingLimit(limit);
            setNoLimit(limit === undefined);
            setHasUnsavedChanges(false);
            setCheckedDates(new Set());
        } else {
            setInactiveSlots([]);
            setSelectedDates([]);
            setUnavailableReasons({});
            setUnavailableHalfDays({});
            setMonthlyBookingLimit(undefined);
            setNoLimit(true);
            setHasUnsavedChanges(false);
            setCheckedDates(new Set());
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
        if (!canEditCurrentAnimatorSettings) return;
        if (!selectedAnimatorName) return;
        
        const isCurrentlyUnavailable = selectedDates.includes(dateStr);
        if (isCurrentlyUnavailable) {
            setSelectedDates(prev => prev.filter(d => d !== dateStr));
            setUnavailableReasons(prev => {
                const next = { ...prev };
                delete next[dateStr];
                return next;
            });
            setUnavailableHalfDays(prev => {
                const next = { ...prev };
                delete next[dateStr];
                return next;
            });
            setCheckedDates(prev => {
                const next = new Set(prev);
                next.delete(dateStr);
                return next;
            });
        } else {
            // Left click defaults to full day
            setSelectedDates(prev => [...prev, dateStr].sort());
            setUnavailableHalfDays(prev => {
                const next = { ...prev };
                delete next[dateStr];
                return next;
            });
        }
        setHasUnsavedChanges(true);
    };

    const handleDateContextMenu = (e: React.MouseEvent, dateStr: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canEditCurrentAnimatorSettings || !selectedAnimatorName) return;

        const menuWidth = 240;
        const menuHeight = 260;
        const x = Math.min(e.clientX, window.innerWidth - menuWidth - 16);
        const y = Math.min(e.clientY, window.innerHeight - menuHeight - 16);

        setContextMenu({ x, y, dateStr });
    };

    const setDatePeriodType = (dateStr: string, period: 'morning' | 'afternoon' | 'full') => {
        if (!canEditCurrentAnimatorSettings || !selectedAnimatorName) return;

        setSelectedDates(prev => {
            if (!prev.includes(dateStr)) {
                return [...prev, dateStr].sort();
            }
            return prev;
        });

        setUnavailableHalfDays(prev => {
            const next = { ...prev };
            if (period === 'full') {
                delete next[dateStr];
            } else {
                next[dateStr] = period;
            }
            return next;
        });

        setHasUnsavedChanges(true);
        setContextMenu(null);

        const dateFormatted = new Date(dateStr.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        showNotification(
            period === 'morning'
                ? `Matinée bloquée pour le ${dateFormatted}.`
                : period === 'afternoon'
                ? `Après-midi bloqué pour le ${dateFormatted}.`
                : `Journée complète bloquée pour le ${dateFormatted}.`
        );
    };

    const toggleCheckDate = (dateStr: string) => {
        if (!canEditCurrentAnimatorSettings) return;
        const newChecked = new Set(checkedDates);
        if (newChecked.has(dateStr)) newChecked.delete(dateStr);
        else newChecked.add(dateStr);
        setCheckedDates(newChecked);
    };

    const toggleSelectAllDates = () => {
        if (!canEditCurrentAnimatorSettings) return;
        if (checkedDates.size === selectedDates.length) {
            setCheckedDates(new Set());
        } else {
            setCheckedDates(new Set(selectedDates));
        }
    };

    const handleOpenEditReasonModal = (dates: string[]) => {
        if (!canEditCurrentAnimatorSettings || dates.length === 0) return;
        setEditingReasonDates(dates);
        if (dates.length === 1) {
            const d = dates[0];
            setReasonInput(unavailableReasons[d] || '');
            setPeriodInput(unavailableHalfDays[d] || 'full');
        } else {
            const firstReason = unavailableReasons[dates[0]] || '';
            const allSameReason = dates.every(d => (unavailableReasons[d] || '') === firstReason);
            setReasonInput(allSameReason ? firstReason : '');

            const firstPeriod = unavailableHalfDays[dates[0]] || 'full';
            const allSamePeriod = dates.every(d => (unavailableHalfDays[d] || 'full') === firstPeriod);
            setPeriodInput(allSamePeriod ? firstPeriod : 'unchanged');
        }
    };

    const handleSaveReasonAndPeriod = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingReasonDates || editingReasonDates.length === 0) return;

        const trimmed = reasonInput.trim();
        setUnavailableReasons(prev => {
            const next = { ...prev };
            editingReasonDates.forEach(d => {
                if (trimmed) {
                    next[d] = trimmed;
                } else {
                    delete next[d];
                }
            });
            return next;
        });

        if (periodInput !== 'unchanged') {
            setUnavailableHalfDays(prev => {
                const next = { ...prev };
                editingReasonDates.forEach(d => {
                    if (periodInput === 'full') {
                        delete next[d];
                    } else {
                        next[d] = periodInput;
                    }
                });
                return next;
            });
        }

        setHasUnsavedChanges(true);
        showNotification(
            `Indisponibilité mise à jour pour ${editingReasonDates.length} date${editingReasonDates.length > 1 ? 's' : ''}.`
        );
        setEditingReasonDates(null);
        setReasonInput('');
    };

    const handleClearReason = () => {
        if (!editingReasonDates || editingReasonDates.length === 0) return;
        setUnavailableReasons(prev => {
            const next = { ...prev };
            editingReasonDates.forEach(d => {
                delete next[d];
            });
            return next;
        });
        setHasUnsavedChanges(true);
        showNotification(`Motif effacé pour ${editingReasonDates.length} date${editingReasonDates.length > 1 ? 's' : ''}.`);
        setEditingReasonDates(null);
        setReasonInput('');
    };

    const deleteCheckedDates = () => {
        if (!canEditCurrentAnimatorSettings) return;
        if (!selectedAnimatorName || checkedDates.size === 0) return;
        
        const newUnavailabilities = selectedDates.filter(d => !checkedDates.has(d));
        setSelectedDates(newUnavailabilities);
        setUnavailableReasons(prev => {
            const next = { ...prev };
            checkedDates.forEach(d => {
                delete next[d];
            });
            return next;
        });
        setUnavailableHalfDays(prev => {
            const next = { ...prev };
            checkedDates.forEach(d => {
                delete next[d];
            });
            return next;
        });
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
        if (!canEditCurrentAnimatorSettings) return;
        if (!selectedAnimatorName) return;
        setSelectedDates(prev => prev.filter(d => d !== dateStr));
        setUnavailableReasons(prev => {
            const next = { ...prev };
            delete next[dateStr];
            return next;
        });
        setUnavailableHalfDays(prev => {
            const next = { ...prev };
            delete next[dateStr];
            return next;
        });
        setCheckedDates(prev => {
            const next = new Set(prev);
            next.delete(dateStr);
            return next;
        });
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
        if (!canEditCurrentAnimatorSettings) {
            showNotification("Vous n'avez pas l'autorisation de modifier les paramètres de cet animateur.", "error");
            return;
        }
        if (!selectedAnimatorName) return;

        const updatedAnimatorSettings: AnimatorSettings = {
            ...selectedAnimatorSettings,
            inactiveSlots: inactiveSlots,
            unavailableDates: selectedDates,
            unavailableReasons: unavailableReasons,
            unavailableHalfDays: unavailableHalfDays
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
        showNotification("Paramètres de l'animateur (dates, créneaux et motifs) enregistrés !");
    };

    useEffect(() => {
        if (setParentUnsavedChanges) {
            setParentUnsavedChanges(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, setParentUnsavedChanges]);

    // Keep save handle reference stable
    const saveHandleRef = useRef(handleSaveAnimatorSettings);
    saveHandleRef.current = handleSaveAnimatorSettings;

    const handleCancelAnimatorSettings = () => {
        if (selectedAnimatorName) {
            const animSettings = settings.animatorSettings?.[selectedAnimatorName] || { unavailableDates: [], inactiveSlots: [] };
            setInactiveSlots(animSettings.inactiveSlots || []);
            setSelectedDates(animSettings.unavailableDates || []);
            setUnavailableReasons(animSettings.unavailableReasons || {});
            setUnavailableHalfDays(animSettings.unavailableHalfDays || {});
            const limit = animSettings.monthlyBookingLimit;
            setMonthlyBookingLimit(limit);
            setNoLimit(limit === undefined);
            setHasUnsavedChanges(false);
            setCheckedDates(new Set());
        } else {
            setInactiveSlots([]);
            setSelectedDates([]);
            setUnavailableReasons({});
            setUnavailableHalfDays({});
            setMonthlyBookingLimit(undefined);
            setNoLimit(true);
            setHasUnsavedChanges(false);
            setCheckedDates(new Set());
        }
        showNotification("Modifications du calendrier annulées.");
    };

    const cancelHandleRef = useRef(handleCancelAnimatorSettings);
    cancelHandleRef.current = handleCancelAnimatorSettings;

    useEffect(() => {
        if (registerSave) {
            registerSave(() => {
                saveHandleRef.current();
            });
        }
    }, [registerSave]);

    useEffect(() => {
        if (registerCancel) {
            registerCancel(() => {
                cancelHandleRef.current();
            });
        }
    }, [registerCancel]);

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
            
            {/* GRILLE DU HAUT : PARAMÈTRES ANIMATEURS ET VACANCES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Bloc Paramètres généraux de l'animateur (slots et limit) */}
                <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Gérer les créneaux et limites par animateur</h3>
                        <select 
                            value={selectedAnimatorName} 
                            onChange={e => setSelectedAnimatorName(e.target.value)} 
                            className="w-full p-2 border rounded mb-4 bg-white font-semibold text-gray-700"
                        >
                            {animators.length > 0 ? (
                               animators.map(animator => <option key={animator.name} value={animator.name}>{animator.name}</option>)
                            ) : (
                               <option value="">-- Aucun animateur configuré --</option>
                            )}
                        </select>

                        {selectedAnimatorName ? (
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-gray-700">Créneaux désactivés pour "{selectedAnimatorName}" :</h4>
                                        <div className="flex gap-4">
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
                                        <h4 className="font-semibold mb-2 text-gray-700">Limite mensuelle :</h4>
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
                                                        className="w-20 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm disabled:opacity-60 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">réservations / mois</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic text-center p-4 bg-gray-50 rounded-xl border border-dashed">
                                Veuillez sélectionner un animateur pour configurer ses créneaux et limites.
                            </p>
                        )}
                    </div>
                </div>

                {/* Section Vacances (située à droite, en haut) */}
                <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Gérer les périodes de vacances</h3>
                        {canManageVacations ? (
                            <>
                                <form onSubmit={handleAddHoliday} className="space-y-3 p-4 border rounded-lg bg-gray-50 mb-4">
                                    <input type="text" placeholder="Nom (ex: Vacances d'été)" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="w-full p-2 border rounded text-sm font-medium" required/>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={newHoliday.startDate} onChange={e => setNewHoliday({...newHoliday, startDate: e.target.value})} className="p-2 border rounded text-sm" required title="Date de début"/>
                                        <input type="date" value={newHoliday.endDate} onChange={e => setNewHoliday({...newHoliday, endDate: e.target.value})} className="p-2 border rounded text-sm" required title="Date de fin"/>
                                    </div>
                                    <button type="submit" className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-semibold transition-colors">Ajouter la période</button>
                                </form>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                    {activeHolidays.map(h => (
                                        <div key={h.name} className="flex justify-between items-center p-2 bg-yellow-100/70 border border-yellow-200 rounded-lg shadow-sm">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-xs text-yellow-900 truncate" title={h.name}>{h.name}</p>
                                                <p className="text-[10px] text-gray-600 mt-0.5 whitespace-nowrap">
                                                    {h.startDate && h.endDate ? (
                                                        `${new Date(h.startDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')} - ${new Date(h.endDate.replace(/-/g, '/')).toLocaleDateString('fr-FR')}`
                                                    ) : (
                                                        <span className="text-amber-600 italic font-medium">Dates non renseignées ⚠️</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center shrink-0 ml-1">
                                                <button onClick={() => setEditingHoliday(h)} className="text-gray-500 hover:text-indigo-600 p-0.5" aria-label={`Modifier ${h.name}`}>
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDeleteHoliday(h.name)} className="text-red-600 hover:text-red-800 p-0.5" aria-label={`Supprimer ${h.name}`}>
                                                    <TrashIcon className="w-3.5 h-3.5" />
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                    {activeHolidays.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic text-center p-4 col-span-2">Aucune période de vacances configurée pour cette année scolaire.</p>
                                    ) : (
                                        activeHolidays.map(h => (
                                            <div key={h.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 text-xs truncate" title={h.name}>{h.name}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">
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
            </div>

            {/* GRILLE DU BAS : CALENDRIER DES INDISPONIBILITÉS (GAUCHE) ET LISTE (DROITE) ALIGNÉS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendrier de sélection (à gauche) */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-2">Jours d'indisponibilité de l'animateur</h3>
                    {!selectedAnimatorName ? (
                        <p className="text-sm text-gray-500 italic text-center p-6 bg-gray-50 rounded-xl border border-dashed">
                            Veuillez sélectionner un animateur dans la section du haut pour gérer ses indisponibilités.
                        </p>
                    ) : (
                        <>
                            {canEditCurrentAnimatorSettings ? (
                                <p className="text-xs text-gray-500 mb-4 italic">Cliquez sur une date dans le calendrier pour l'ajouter ou la supprimer des indisponibilités de <strong className="text-indigo-600 font-bold">{selectedAnimatorName}</strong>.</p>
                            ) : (
                                <p className="text-xs text-amber-600 mb-4 font-semibold italic">👁️ Mode lecture seule : Vous visualisez les indisponibilités de {selectedAnimatorName}.</p>
                            )}

                            {/* Mini Calendar for selection */}
                            <div className="flex justify-between items-center mb-4">
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
                            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-4">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={`${d}-${i}`} className="font-semibold text-xs text-gray-500 py-1">{d}</div>)}
                                {Array.from({ length: startingDay }).map((_, i) => <div key={`e-${i}`}></div>)}
                                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                    const day = dayIndex + 1;
                                    const date = new Date(year, month, day);
                                    const dateStr = toYYYYMMDD(date);
                                    const isUnavailable = selectedDates.includes(dateStr);
                                    const halfDay = isUnavailable ? unavailableHalfDays[dateStr] : undefined;
                                    const reason = unavailableReasons[dateStr];
                                    const holiday = getHolidayForDate(date, settings.holidays || []);
                                    const isHoliday = !!holiday;

                                    let containerClasses = "relative p-1 rounded-xl transition-all flex flex-col items-center justify-center min-h-[42px] select-none border overflow-hidden ";
                                    if (canEditCurrentAnimatorSettings) {
                                        containerClasses += "cursor-pointer hover:shadow-sm ";
                                    } else {
                                        containerClasses += "cursor-not-allowed ";
                                    }

                                    let periodLabel = isHoliday ? `Disponible (Vacances : ${holiday?.name})` : "Disponible";
                                    if (isUnavailable) {
                                        if (halfDay === 'morning') periodLabel = `Matin indisponible (9h, 10h)${isHoliday ? ` • Vacances : ${holiday?.name}` : ''}`;
                                        else if (halfDay === 'afternoon') periodLabel = `Après-midi indisponible (14h, 15h)${isHoliday ? ` • Vacances : ${holiday?.name}` : ''}`;
                                        else periodLabel = `Journée complète indisponible${isHoliday ? ` • Vacances : ${holiday?.name}` : ''}`;
                                    }

                                    const tooltipText = isUnavailable 
                                        ? `${dateStr} : ${periodLabel}${reason ? ` (Motif: ${reason})` : ''} • Clic gauche: Supprimer / Clic droit: Modifier`
                                        : `${dateStr} : ${periodLabel} • Clic gauche: Bloquer journée • Clic droit: Bloquer demi-journée`;

                                    if (!isUnavailable) {
                                        if (isHoliday) {
                                            // Période de vacances scolaire / férié
                                            containerClasses += "text-amber-950 bg-amber-100 hover:bg-amber-200/80 border-amber-300 hover:border-amber-400";
                                        } else {
                                            containerClasses += "text-gray-700 bg-gray-50/60 hover:bg-indigo-50/60 border-gray-200/80 hover:border-indigo-300";
                                        }
                                    } else if (!halfDay) {
                                        // Journée complète
                                        containerClasses += "bg-red-500 text-white font-bold border-red-600 shadow-xs";
                                    } else {
                                        // Demi-journée
                                        containerClasses += `${isHoliday ? 'bg-amber-100 border-amber-300' : 'bg-white border-red-300'} text-gray-900 font-bold shadow-xs`;
                                    }

                                    return (
                                        <div 
                                            key={day} 
                                            className={containerClasses} 
                                            onClick={() => canEditCurrentAnimatorSettings && handleDateClick(dateStr)}
                                            onContextMenu={(e) => canEditCurrentAnimatorSettings && handleDateContextMenu(e, dateStr)}
                                            title={tooltipText}
                                        >
                                            {/* Rendu visuel demi-rectangle pour demi-journée */}
                                            {isUnavailable && halfDay === 'morning' && (
                                                <div className="absolute inset-x-0 top-0 h-1/2 bg-red-500/90 pointer-events-none" />
                                            )}
                                            {isUnavailable && halfDay === 'afternoon' && (
                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-red-500/90 pointer-events-none" />
                                            )}

                                            {/* Badge demi-journée */}
                                            {isUnavailable && halfDay === 'morning' && (
                                                <span className="absolute top-0.5 right-1 z-10 text-[7px] font-black text-white leading-none tracking-tighter drop-shadow-xs">
                                                    MAT
                                                </span>
                                            )}
                                            {isUnavailable && halfDay === 'afternoon' && (
                                                <span className="absolute bottom-0.5 right-1 z-10 text-[7px] font-black text-white leading-none tracking-tighter drop-shadow-xs">
                                                    AM
                                                </span>
                                            )}

                                            {/* Numéro du jour */}
                                            <span className={`relative z-10 text-xs font-bold ${
                                                !isUnavailable 
                                                    ? (isHoliday ? 'text-amber-950 font-extrabold' : 'text-gray-800')
                                                    : !halfDay 
                                                    ? 'text-white' 
                                                    : halfDay === 'morning'
                                                    ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] translate-y-[-2px]'
                                                    : (isHoliday ? 'text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] translate-y-[2px]' : 'text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] translate-y-[2px]')
                                            }`}>
                                                {day}
                                            </span>

                                            {/* Indicateur de motif */}
                                            {isUnavailable && reason && (
                                                <span 
                                                    className="w-2 h-2 rounded-full bg-amber-300 border border-amber-500 absolute top-1 left-1 z-20 shadow-xs" 
                                                    title={`Motif: ${reason}`} 
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Légende du calendrier */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5" title="Journée entière bloquée">
                                        <span className="w-3.5 h-3.5 rounded-md bg-red-500 border border-red-600 shrink-0" />
                                        <span className="text-[11px] font-medium text-gray-600">Journée</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Matinée bloquée (9h, 10h)">
                                        <span className="w-3.5 h-3.5 rounded-md border border-red-300 bg-white relative overflow-hidden shrink-0 shadow-2xs">
                                            <span className="absolute inset-x-0 top-0 h-1/2 bg-red-500" />
                                        </span>
                                        <span className="text-[11px] font-medium text-gray-600">Matin (MAT)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Après-midi bloqué (14h, 15h)">
                                        <span className="w-3.5 h-3.5 rounded-md border border-red-300 bg-white relative overflow-hidden shrink-0 shadow-2xs">
                                            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-red-500" />
                                        </span>
                                        <span className="text-[11px] font-medium text-gray-600">Après-midi (AM)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Période de vacances scolaires">
                                        <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-300 shrink-0" />
                                        <span className="text-[11px] font-medium text-amber-900">Vacances</span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                    🖱️ Clic gauche: Journée • Clic droit: Demi-journée
                                </div>
                            </div>

                            {canEditCurrentAnimatorSettings && (
                                <div className="mt-4">
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
                        </>
                    )}
                </div>

                {/* Section Liste des Indisponibilités (à droite) */}
                <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-between min-h-[460px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold">Jours d'indisponibilité de l'animateur</h3>
                                {selectedAnimatorName && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Liste des dates verrouillées pour <strong className="text-indigo-600 font-bold">{selectedAnimatorName}</strong>
                                    </p>
                                )}
                            </div>
                        </div>

                        {!selectedAnimatorName ? (
                            <p className="text-sm text-gray-500 italic text-center p-6 bg-gray-50 rounded-xl border border-dashed">
                                Veuillez sélectionner un animateur pour voir et gérer ses indisponibilités.
                            </p>
                        ) : selectedDates.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center p-6 bg-gray-50 rounded-xl border border-dashed">
                                Aucune date d'indisponibilité enregistrée pour "{selectedAnimatorName}".
                            </p>
                        ) : (
                            <div>
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800 text-sm">
                                            Dates indisponibles ({selectedDates.length}) :
                                        </h4>
                                        {canEditCurrentAnimatorSettings && selectedDates.length > 0 && (
                                            <button 
                                                type="button"
                                                onClick={toggleSelectAllDates}
                                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                                            >
                                                {checkedDates.size === selectedDates.length ? "Tout désélectionner" : "Tout cocher"}
                                            </button>
                                        )}
                                    </div>
                                    {canEditCurrentAnimatorSettings && checkedDates.size > 0 && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleOpenEditReasonModal(Array.from(checkedDates))}
                                                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                title="Définir un motif ou modifier la période pour toutes les dates cochées"
                                            >
                                                <PencilIcon className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>Période / Motif ({checkedDates.size})</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={deleteCheckedDates}
                                                className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                title="Supprimer les dates cochées"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                                                <span>Supprimer ({checkedDates.size})</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {groupedUnavailabilities.map(group => (
                                        <div key={group.label} className="space-y-2">
                                            <div className="flex items-center justify-between bg-gray-50/80 py-1 px-2.5 rounded-lg border border-gray-100">
                                                <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                                    {group.label}
                                                </h5>
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {group.dates.length} date{group.dates.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {group.dates.map(d => {
                                                    const reason = unavailableReasons[d];
                                                    const halfDay = unavailableHalfDays[d];
                                                    const isChecked = checkedDates.has(d);
                                                    const formattedDate = new Date(d.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                                                    const fullDate = new Date(d.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                                                    return (
                                                        <div 
                                                            key={d} 
                                                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                                                isChecked 
                                                                    ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' 
                                                                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-xs'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                {canEditCurrentAnimatorSettings ? (
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isChecked}
                                                                        onChange={() => toggleCheckDate(d)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                                                        title="Sélectionner"
                                                                    />
                                                                ) : (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <p className="text-xs font-bold text-gray-800 truncate capitalize" title={fullDate}>
                                                                            {formattedDate}
                                                                        </p>
                                                                        {halfDay === 'morning' ? (
                                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-0.5 shrink-0" title="Matin indisponible (9h, 10h)">
                                                                                <span>☀️</span> MAT
                                                                            </span>
                                                                        ) : halfDay === 'afternoon' ? (
                                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-300 flex items-center gap-0.5 shrink-0" title="Après-midi indisponible (14h, 15h)">
                                                                                <span>🌙</span> AM
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-0.5 shrink-0" title="Journée complète indisponible">
                                                                                <span>📅</span> Jour
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {reason ? (
                                                                        <p 
                                                                            className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 truncate mt-1 max-w-full inline-block"
                                                                            title={`Motif : ${reason}`}
                                                                        >
                                                                            <span className="mr-0.5">💬</span> {reason}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-400 italic mt-0.5">
                                                                            Aucun motif
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {canEditCurrentAnimatorSettings && (
                                                                <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleOpenEditReasonModal([d])} 
                                                                        className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                                        title="Modifier la période ou le motif"
                                                                    >
                                                                        <PencilIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeUnavailability(d)} 
                                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                                        title="Supprimer cette indisponibilité"
                                                                    >
                                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu contextuel lors du clic droit sur un jour du calendrier */}
            {contextMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-[90] bg-transparent" 
                        onClick={() => setContextMenu(null)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                    />
                    <div 
                        className="fixed z-[95] bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 w-60 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                        style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/80">
                            <p className="text-xs font-bold text-gray-900 capitalize">
                                📅 {new Date(contextMenu.dateStr.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                {selectedDates.includes(contextMenu.dateStr) ? (
                                    unavailableHalfDays[contextMenu.dateStr] === 'morning' ? (
                                        <span className="text-amber-700 font-semibold">Actuellement : Matin (MAT)</span>
                                    ) : unavailableHalfDays[contextMenu.dateStr] === 'afternoon' ? (
                                        <span className="text-purple-700 font-semibold">Actuellement : Après-midi (AM)</span>
                                    ) : (
                                        <span className="text-red-700 font-semibold">Actuellement : Journée entière</span>
                                    )
                                ) : (
                                    <span className="text-emerald-600 font-semibold">Actuellement : Disponible</span>
                                )}
                            </p>
                        </div>

                        <div className="p-1 space-y-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setDatePeriodType(contextMenu.dateStr, 'morning')}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                                    selectedDates.includes(contextMenu.dateStr) && unavailableHalfDays[contextMenu.dateStr] === 'morning'
                                        ? 'bg-amber-50 text-amber-900 font-bold'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>☀️</span>
                                    <span>Matin (9h, 10h)</span>
                                </span>
                                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded">MAT</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setDatePeriodType(contextMenu.dateStr, 'afternoon')}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                                    selectedDates.includes(contextMenu.dateStr) && unavailableHalfDays[contextMenu.dateStr] === 'afternoon'
                                        ? 'bg-purple-50 text-purple-900 font-bold'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>🌙</span>
                                    <span>Après-midi (14h, 15h)</span>
                                </span>
                                <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-1 py-0.2 rounded">AM</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setDatePeriodType(contextMenu.dateStr, 'full')}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                                    selectedDates.includes(contextMenu.dateStr) && !unavailableHalfDays[contextMenu.dateStr]
                                        ? 'bg-red-50 text-red-900 font-bold'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span>Journée entière</span>
                                </span>
                                <span className="text-[10px] font-black text-red-700 bg-red-100 px-1 py-0.2 rounded">JOUR</span>
                            </button>

                            {selectedDates.includes(contextMenu.dateStr) && (
                                <>
                                    <div className="my-1 border-t border-gray-100" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const d = contextMenu.dateStr;
                                            setContextMenu(null);
                                            handleOpenEditReasonModal([d]);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-indigo-50 text-indigo-700 font-medium transition-colors text-left cursor-pointer"
                                    >
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        <span>Définir / modifier motif...</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            removeUnavailability(contextMenu.dateStr);
                                            setContextMenu(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors text-left cursor-pointer"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                        <span>Rendre disponible (Supprimer)</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Modal de motif & période d'indisponibilité (unitaire ou groupé) */}
            {editingReasonDates && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                    <PencilIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-gray-900">
                                        {editingReasonDates.length === 1 
                                            ? "Paramètres d'indisponibilité" 
                                            : `Modifier ${editingReasonDates.length} dates`}
                                    </h4>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {editingReasonDates.length === 1 
                                            ? new Date(editingReasonDates[0].replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                            : `${editingReasonDates.length} dates sélectionnées`}
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setEditingReasonDates(null)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveReasonAndPeriod} className="space-y-4">
                            {/* Choix de la période (Journée entière, Matin, Après-midi) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Période d'absence
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPeriodInput('full')}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                            periodInput === 'full'
                                                ? 'bg-red-500 text-white border-red-600 shadow-sm'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="text-sm">📅</span>
                                        <span>Journée</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodInput('morning')}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                            periodInput === 'morning'
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="text-sm">☀️</span>
                                        <span>Matin (MAT)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodInput('afternoon')}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                            periodInput === 'afternoon'
                                                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="text-sm">🌙</span>
                                        <span>Après-midi (AM)</span>
                                    </button>
                                </div>
                                {editingReasonDates.length > 1 && (
                                    <div className="mt-1.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setPeriodInput('unchanged')}
                                            className={`text-[11px] font-semibold underline ${periodInput === 'unchanged' ? 'text-indigo-600 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Ne pas modifier les périodes actuelles
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Motif (facultatif)
                                </label>
                                <input 
                                    type="text"
                                    autoFocus
                                    value={reasonInput}
                                    onChange={(e) => setReasonInput(e.target.value)}
                                    placeholder="Ex: Congés, Formation, Rendez-vous médical..."
                                    className="w-full p-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    maxLength={100}
                                />
                            </div>

                            {/* Suggestions rapides */}
                            <div>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                    Suggestions rapides :
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {['Congés', 'Formation', 'Rendez-vous médical', 'Réunion', 'Déplacement', 'Maladie', 'Autre'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => setReasonInput(suggestion)}
                                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                                reasonInput === suggestion
                                                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div>
                                    {editingReasonDates.some(d => !!unavailableReasons[d]) && (
                                        <button
                                            type="button"
                                            onClick={handleClearReason}
                                            className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline cursor-pointer"
                                        >
                                            Effacer le motif
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingReasonDates(null)}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <CheckIcon className="w-3.5 h-3.5" />
                                        <span>Valider</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
