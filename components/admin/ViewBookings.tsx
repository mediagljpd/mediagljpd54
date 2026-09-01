
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../../AppContext';
import { Booking } from '../../types';
import { AdminSubComponentProps } from './types';
import { generateBusPdf } from '../../services/documentGenerator';
import { formatPhoneNumber } from '../../utils/formatters';
import { emailService } from '../../services/emailService';
import { SortAscIcon, SortDescIcon, SortIcon, SearchIcon, SparklesIcon, PdfIcon, SendIcon, ListIcon, CalendarDaysIcon, TrashIcon, CogIcon, CheckIcon, XIcon, BellIcon, ClockIcon, UserGroupIcon } from '../Icons';

import BookingEditForm from './BookingEditForm';
import BookingsCalendar from './BookingsCalendar';
import RandomBookingGenerator from './RandomBookingGenerator';
import BusSheetGeneratorModal from './BusSheetGeneratorModal';
import ConfirmationModal from '../shared/ConfirmationModal';

const SCHOOL_YEAR_MONTHS = [
    { label: 'OCT', value: 9 },
    { label: 'NOV', value: 10 },
    { label: 'DEC', value: 11 },
    { label: 'JAN', value: 0 },
    { label: 'FEV', value: 1 },
    { label: 'MAR', value: 2 },
    { label: 'AVR', value: 3 },
    { label: 'MAI', value: 4 },
    { label: 'JUIN', value: 5 },
];

const BUS_STATUS_OPTIONS = [
    { label: 'En attente', value: 'pending' },
    { label: 'Validés', value: 'validated' },
    { label: 'Pas de bus', value: 'none' },
];

const BOOKING_STATUS_OPTIONS = [
    { label: 'À confirmer', value: 'pending' },
    { label: 'Validés', value: 'validated' },
];

const ViewBookings: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { bookings, animations, removeBooking, updateBookings, settings, saveBooking, currentUser, updateSettings } = useContext(AppContext);
    const isBusManager = currentUser?.role === 'admin' || !!currentUser?.permissions?.canManageBus;
    
    type AugmentedBooking = Booking & { animator?: string };
    type SortableKey = 'date' | 'teacherName';

    // Filtres
    const animators = useMemo(() => settings.animators || [], [settings.animators]);
    const [selectedAnimators, setSelectedAnimators] = useState<Set<string>>(new Set());
    const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
    const [selectedBusStatuses, setSelectedBusStatuses] = useState<Set<string>>(new Set());
    const [selectedBookingStatuses, setSelectedBookingStatuses] = useState<Set<string>>(new Set());
    const filterInitialized = useRef(false);

    const animatorMapForFiltering = useMemo(() => {
        const map = new Map<string, string>();
        animations.forEach(anim => {
            if (anim.animator) map.set(anim.id, anim.animator);
        });
        return map;
    }, [animations]);

    const [startYear, endYear] = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
            const currentYear = new Date().getFullYear();
            return [currentYear, currentYear + 1]; // Fallback
        }
        return [years[0], years[1]];
    }, [settings.activeYear]);

    const activeSchoolYearBookingsCount = useMemo(() => {
        return bookings.filter(b => {
            const bDate = new Date(b.date.replace(/-/g, '/'));
            const bYear = bDate.getFullYear();
            const bMonth = bDate.getMonth();
            return (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
        }).length;
    }, [bookings, startYear, endYear]);

    const monthItemsWithCounts = useMemo(() => {
        return SCHOOL_YEAR_MONTHS.map(item => {
            // totalCount: counts bookings in this month for the active school year
            const totalCount = bookings.filter(booking => {
                const bDate = new Date(booking.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                if (bMonth !== item.value) return false;
                
                const expectedYear = item.value >= 9 ? startYear : endYear;
                return bYear === expectedYear;
            }).length;

            // filteredCount: counts bookings in this month for the active school year matching OTHER active filters
            const filteredCount = bookings.filter(booking => {
                const bDate = new Date(booking.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                if (bMonth !== item.value) return false;
                
                const expectedYear = item.value >= 9 ? startYear : endYear;
                if (bYear !== expectedYear) return false;

                const bAnimator = animatorMapForFiltering.get(booking.animationId);
                const passesAnimator = selectedAnimators.size === 0 || (bAnimator ? selectedAnimators.has(bAnimator) : false);

                let currentStatus = 'none';
                if (!booking.noBusRequired) {
                    currentStatus = booking.busStatus || 'pending';
                }
                const passesBus = selectedBusStatuses.size === 0 || selectedBusStatuses.has(currentStatus);

                const currentBookingStatus = booking.status === 'validated' ? 'validated' : 'pending';
                const passesBookingStatus = !settings.enableBookingStatus || selectedBookingStatuses.size === 0 || selectedBookingStatuses.has(currentBookingStatus);

                return passesAnimator && passesBus && passesBookingStatus;
            }).length;

            return {
                name: item.label,
                value: item.value,
                filteredCount,
                totalCount
            };
        });
    }, [bookings, startYear, endYear, selectedAnimators, selectedBusStatuses, selectedBookingStatuses, settings.enableBookingStatus, animatorMapForFiltering]);

    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [busManagementBooking, setBusManagementBooking] = useState<Booking | null>(null);
    const [statusManagementBooking, setStatusManagementBooking] = useState<Booking | null>(null);

    // Clés de préférence d'affichage par défaut pour la session personnelle (fallback local)
    const userPrefKey = currentUser?.id || currentUser?.username || 'global';
    const viewPrefKey = `booking_default_view_${userPrefKey}`;
    const scopePrefKey = `booking_default_scope_${userPrefKey}`;

    const [defaultViewPref, setDefaultViewPref] = useState<'list' | 'calendar'>(() => {
        const userPref = (currentUser?.id && settings.userPreferences?.[currentUser.id]) ||
                         (currentUser?.username && settings.userPreferences?.[currentUser.username]);
        if (userPref?.defaultViewPref) return userPref.defaultViewPref;
        const saved = (currentUser?.id ? localStorage.getItem(`booking_default_view_${currentUser.id}`) : null) ||
                      (currentUser?.username ? localStorage.getItem(`booking_default_view_${currentUser.username}`) : null) ||
                      localStorage.getItem(viewPrefKey);
        return (saved === 'list' || saved === 'calendar') ? saved : 'list';
    });

    const [defaultScopePref, setDefaultScopePref] = useState<'all' | 'mine'>(() => {
        const userPref = (currentUser?.id && settings.userPreferences?.[currentUser.id]) ||
                         (currentUser?.username && settings.userPreferences?.[currentUser.username]);
        if (userPref?.defaultScopePref) return userPref.defaultScopePref;
        const saved = (currentUser?.id ? localStorage.getItem(`booking_default_scope_${currentUser.id}`) : null) ||
                      (currentUser?.username ? localStorage.getItem(`booking_default_scope_${currentUser.username}`) : null) ||
                      localStorage.getItem(scopePrefKey);
        return (saved === 'all' || saved === 'mine') ? saved : 'all';
    });

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
        const userPref = (currentUser?.id && settings.userPreferences?.[currentUser.id]) ||
                         (currentUser?.username && settings.userPreferences?.[currentUser.username]);
        if (userPref?.defaultViewPref) return userPref.defaultViewPref;
        const saved = (currentUser?.id ? localStorage.getItem(`booking_default_view_${currentUser.id}`) : null) ||
                      (currentUser?.username ? localStorage.getItem(`booking_default_view_${currentUser.username}`) : null) ||
                      localStorage.getItem(viewPrefKey);
        return (saved === 'list' || saved === 'calendar') ? saved : 'list';
    });

    const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

    const handleDefaultViewChange = async (newView: 'list' | 'calendar') => {
        setDefaultViewPref(newView);
        localStorage.setItem(viewPrefKey, newView);
        if (currentUser?.id) localStorage.setItem(`booking_default_view_${currentUser.id}`, newView);
        if (currentUser?.username) localStorage.setItem(`booking_default_view_${currentUser.username}`, newView);
        setViewMode(newView);

        if ((currentUser?.id || currentUser?.username) && updateSettings) {
            try {
                const userPrefs = settings.userPreferences || {};
                const keysToUpdate = Array.from(new Set([currentUser?.id, currentUser?.username].filter(Boolean) as string[]));
                const updatedPrefs = { ...userPrefs };
                for (const key of keysToUpdate) {
                    updatedPrefs[key] = {
                        ...(userPrefs[key] || {}),
                        defaultViewPref: newView
                    };
                }
                await updateSettings({
                    userPreferences: updatedPrefs
                });
            } catch (err) {
                console.error("Erreur de sauvegarde de la préférence de vue dans Firestore:", err);
            }
        }
    };

    const handleDefaultScopeChange = async (newScope: 'all' | 'mine') => {
        setDefaultScopePref(newScope);
        localStorage.setItem(scopePrefKey, newScope);
        if (currentUser?.id) localStorage.setItem(`booking_default_scope_${currentUser.id}`, newScope);
        if (currentUser?.username) localStorage.setItem(`booking_default_scope_${currentUser.username}`, newScope);
        
        if (newScope === 'mine' && currentUser?.animatorName) {
            setSelectedAnimators(new Set([currentUser.animatorName]));
        } else {
            setSelectedAnimators(new Set());
        }

        if ((currentUser?.id || currentUser?.username) && updateSettings) {
            try {
                const userPrefs = settings.userPreferences || {};
                const keysToUpdate = Array.from(new Set([currentUser?.id, currentUser?.username].filter(Boolean) as string[]));
                const updatedPrefs = { ...userPrefs };
                for (const key of keysToUpdate) {
                    updatedPrefs[key] = {
                        ...(userPrefs[key] || {}),
                        defaultScopePref: newScope
                    };
                }
                await updateSettings({
                    userPreferences: updatedPrefs
                });
            } catch (err) {
                console.error("Erreur de sauvegarde de la préférence de portée dans Firestore:", err);
            }
        }
    };

    // Synchronisation dynamique si les paramètres de la base changent ou sont chargés après montage
    useEffect(() => {
        if (!currentUser) return;
        const userPref = (currentUser.id && settings.userPreferences?.[currentUser.id]) ||
                         (currentUser.username && settings.userPreferences?.[currentUser.username]);
        if (userPref) {
            if (userPref.defaultViewPref) {
                setDefaultViewPref(userPref.defaultViewPref);
                setViewMode(userPref.defaultViewPref);
            }
            if (userPref.defaultScopePref) {
                setDefaultScopePref(userPref.defaultScopePref);
            }
        }
    }, [settings.userPreferences, currentUser]);

    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isBusSheetModalOpen, setIsBusSheetModalOpen] = useState(false);
    const [viewingBookingId, setViewingBookingId] = useState<string | null>(null);
    const viewingBooking = useMemo(() => bookings.find(b => b.id === viewingBookingId) || null, [bookings, viewingBookingId]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showBulkValidateConfirm, setShowBulkValidateConfirm] = useState(false);
    const [showBulkPendingConfirm, setShowBulkPendingConfirm] = useState(false);
    const [isSendListModalOpen, setIsSendListModalOpen] = useState(false);
    const [recipientListEmail, setRecipientListEmail] = useState('');
    const [selectedRecipientAnimator, setSelectedRecipientAnimator] = useState('');
    const [isSendingList, setIsSendingList] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (viewingBookingId) setViewingBookingId(null);
                else if (busManagementBooking) setBusManagementBooking(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [viewingBookingId, busManagementBooking]);

    // Initialisation intelligente des filtres en mode additif (sélection active)
    useEffect(() => {
        if (filterInitialized.current || animators.length === 0) return;

        const userPref = (currentUser?.id && settings.userPreferences?.[currentUser.id]) ||
                         (currentUser?.username && settings.userPreferences?.[currentUser.username]);
        const userScopeKey = `booking_default_scope_${currentUser?.id || currentUser?.username || 'global'}`;
        const savedScope = (currentUser?.id ? localStorage.getItem(`booking_default_scope_${currentUser.id}`) : null) ||
                           (currentUser?.username ? localStorage.getItem(`booking_default_scope_${currentUser.username}`) : null) ||
                           localStorage.getItem(userScopeKey);

        const activeScope = userPref?.defaultScopePref || (savedScope === 'mine' ? 'mine' : 'all');

        if (activeScope === 'mine' && currentUser?.animatorName) {
            setSelectedAnimators(new Set([currentUser.animatorName]));
        } else {
            setSelectedAnimators(new Set()); // Vide = Tous les animateurs
        }

        setSelectedMonths(new Set()); // Vide = Tous les mois
        setSelectedBusStatuses(new Set()); // Vide = Tous les statuts bus
        setSelectedBookingStatuses(new Set()); // Vide = Tous les statuts de réservation
        filterInitialized.current = true;
    }, [animators, currentUser, startYear, endYear, settings]);

    const animatorItemsWithCounts = useMemo(() => {
        return animators.map(a => {
            // totalCount: bookings for this animator in the active school year
            const totalCount = bookings.filter(b => {
                const bDate = new Date(b.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                const inSchoolYear = (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
                if (!inSchoolYear) return false;

                const bAnimator = animatorMapForFiltering.get(b.animationId);
                return bAnimator?.trim().toLowerCase() === a.name.trim().toLowerCase();
            }).length;

            // filteredCount: bookings for this animator in the active school year matching OTHER active filters
            const filteredCount = bookings.filter(b => {
                const bDate = new Date(b.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                const inSchoolYear = (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
                if (!inSchoolYear) return false;

                const bAnimator = animatorMapForFiltering.get(b.animationId);
                if (bAnimator?.trim().toLowerCase() !== a.name.trim().toLowerCase()) return false;

                const passesMonth = selectedMonths.size === 0 || selectedMonths.has(bMonth);
                
                let currentStatus = 'none';
                if (!b.noBusRequired) {
                    currentStatus = b.busStatus || 'pending';
                }
                const passesBus = selectedBusStatuses.size === 0 || selectedBusStatuses.has(currentStatus);

                const currentBookingStatus = b.status === 'validated' ? 'validated' : 'pending';
                const passesBookingStatus = !settings.enableBookingStatus || selectedBookingStatuses.size === 0 || selectedBookingStatuses.has(currentBookingStatus);

                return passesMonth && passesBus && passesBookingStatus;
            }).length;

            return {
                name: a.name,
                value: a.name,
                filteredCount,
                totalCount
            };
        });
    }, [animators, bookings, startYear, endYear, animatorMapForFiltering, selectedMonths, selectedBusStatuses, selectedBookingStatuses, settings.enableBookingStatus]);

    const busStatusItemsWithCounts = useMemo(() => {
        return BUS_STATUS_OPTIONS.map(opt => {
            // totalCount: bookings for this bus status in the active school year
            const totalCount = bookings.filter(b => {
                const bDate = new Date(b.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                const inSchoolYear = (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
                if (!inSchoolYear) return false;

                let currentStatus = 'none';
                if (!b.noBusRequired) {
                    currentStatus = b.busStatus || 'pending';
                }
                return currentStatus === opt.value;
            }).length;

            // filteredCount: bookings for this bus status in the active school year matching OTHER active filters
            const filteredCount = bookings.filter(b => {
                const bDate = new Date(b.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                const inSchoolYear = (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
                if (!inSchoolYear) return false;

                let currentStatus = 'none';
                if (!b.noBusRequired) {
                    currentStatus = b.busStatus || 'pending';
                }
                if (currentStatus !== opt.value) return false;

                const bAnimator = animatorMapForFiltering.get(b.animationId);
                const passesAnimator = selectedAnimators.size === 0 || (bAnimator ? selectedAnimators.has(bAnimator) : false);

                const passesMonth = selectedMonths.size === 0 || selectedMonths.has(bMonth);

                const currentBookingStatus = b.status === 'validated' ? 'validated' : 'pending';
                const passesBookingStatus = !settings.enableBookingStatus || selectedBookingStatuses.size === 0 || selectedBookingStatuses.has(currentBookingStatus);

                return passesAnimator && passesMonth && passesBookingStatus;
            }).length;

            return {
                name: opt.label,
                value: opt.value,
                filteredCount,
                totalCount
            };
        });
    }, [bookings, startYear, endYear, selectedAnimators, selectedMonths, selectedBookingStatuses, settings.enableBookingStatus, animatorMapForFiltering]);

    const bookingStatusItemsWithCounts = useMemo(() => {
        return BOOKING_STATUS_OPTIONS.map(opt => {
            // totalCount: bookings for this booking status in the active school year
            const totalCount = bookings.filter(b => {
                const bDate = new Date(b.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                const inSchoolYear = (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
                if (!inSchoolYear) return false;

                const currentStatus = b.status === 'validated' ? 'validated' : 'pending';
                return currentStatus === opt.value;
            }).length;

            // filteredCount: matching OTHER active filters (animator, month, bus)
            const filteredCount = bookings.filter(b => {
                const bDate = new Date(b.date.replace(/-/g, '/'));
                const bYear = bDate.getFullYear();
                const bMonth = bDate.getMonth();
                const inSchoolYear = (bYear === startYear && bMonth >= 9) || (bYear === endYear && bMonth <= 5);
                if (!inSchoolYear) return false;

                const currentStatus = b.status === 'validated' ? 'validated' : 'pending';
                if (currentStatus !== opt.value) return false;

                const bAnimator = animatorMapForFiltering.get(b.animationId);
                const passesAnimator = selectedAnimators.size === 0 || (bAnimator ? selectedAnimators.has(bAnimator) : false);
                const passesMonth = selectedMonths.size === 0 || selectedMonths.has(bMonth);

                let currentBusStatus = 'none';
                if (!b.noBusRequired) {
                    currentBusStatus = b.busStatus || 'pending';
                }
                const passesBus = selectedBusStatuses.size === 0 || selectedBusStatuses.has(currentBusStatus);

                return passesAnimator && passesMonth && passesBus;
            }).length;

            return {
                name: opt.label,
                value: opt.value,
                filteredCount,
                totalCount
            };
        });
    }, [bookings, startYear, endYear, selectedAnimators, selectedMonths, selectedBusStatuses, animatorMapForFiltering]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            // 1. Filtre Animateur
            const animator = animatorMapForFiltering.get(booking.animationId);
            const passesAnimator = selectedAnimators.size === 0 || (animator ? selectedAnimators.has(animator) : false);
            
            // 2. Filtre Mois
            const bookingDate = new Date(booking.date.replace(/-/g, '/'));
            const passesMonth = selectedMonths.size === 0 || selectedMonths.has(bookingDate.getMonth());

            // 3. Filtre Bus
            let currentStatus = 'none';
            if (!booking.noBusRequired) {
                currentStatus = booking.busStatus || 'pending';
            }
            const passesBus = selectedBusStatuses.size === 0 || selectedBusStatuses.has(currentStatus);

            // 4. Filtre Statut de réservation
            const currentBookingStatus = booking.status === 'validated' ? 'validated' : 'pending';
            const passesBookingStatus = !settings.enableBookingStatus || selectedBookingStatuses.size === 0 || selectedBookingStatuses.has(currentBookingStatus);

            return passesAnimator && passesMonth && passesBus && passesBookingStatus;
        });
    }, [bookings, selectedAnimators, selectedMonths, selectedBusStatuses, selectedBookingStatuses, settings.enableBookingStatus, animatorMapForFiltering]);

    const sortedBookings = useMemo(() => {
        let processableBookings: AugmentedBooking[] = filteredBookings.map(b => ({
            ...b,
            animator: animatorMapForFiltering.get(b.animationId) || 'N/A'
        }));

        if (searchTerm.trim()) {
            const lowercasedTerm = searchTerm.toLowerCase().trim();
            processableBookings = processableBookings.filter(b =>
                b.animationTitle.toLowerCase().includes(lowercasedTerm) ||
                b.teacherName.toLowerCase().includes(lowercasedTerm) ||
                b.classLevel.toLowerCase().includes(lowercasedTerm) ||
                (b.animator || '').toLowerCase().includes(lowercasedTerm) ||
                (b.email || '').toLowerCase().includes(lowercasedTerm) ||
                b.phoneNumber.toLowerCase().includes(lowercasedTerm) ||
                (b.commune || '').toLowerCase().includes(lowercasedTerm) ||
                (b.schoolName || '').toLowerCase().includes(lowercasedTerm)
            );
        }
        
        if (sortConfig !== null) {
            processableBookings.sort((a, b) => {
                const key = sortConfig.key;
                const valA = a[key] || '';
                const valB = b[key] || '';
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return processableBookings;
    }, [filteredBookings, sortConfig, searchTerm, animatorMapForFiltering]);
    
    // Fonctions utilitaires de filtre
    const toggleItem = (set: Set<any>, setter: React.Dispatch<React.SetStateAction<Set<any>>>, item: any) => {
        const newSet = new Set(set);
        if (newSet.has(item)) newSet.delete(item);
        else newSet.add(item);
        setter(newSet);
    };

    const selectAll = (allValues: any[], setter: React.Dispatch<React.SetStateAction<Set<any>>>) => {
        setter(new Set(allValues));
    };

    const deselectAll = (setter: React.Dispatch<React.SetStateAction<Set<any>>>) => {
        setter(new Set());
    };

    const handleSelectAllTable = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedBookingIds(new Set(sortedBookings.map(b => b.id)));
        else setSelectedBookingIds(new Set());
    };

    const handleSelectOneTable = (id: string) => {
        toggleItem(selectedBookingIds, setSelectedBookingIds, id);
    };

    const handleDeleteSelected = () => {
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        const idsToDelete = Array.from(selectedBookingIds);
        try {
            await Promise.all(idsToDelete.map(id => removeBooking(id)));
            showNotification(`${selectedBookingIds.size} réservation(s) supprimée(s).`);
            setSelectedBookingIds(new Set());
        } catch (error) {
            showNotification("Erreur lors de la suppression groupée.", "error");
        } finally {
            setShowBulkDeleteConfirm(false);
        }
    };

    const handleToggleBookingStatus = async (b: Booking) => {
        const newStatus: 'pending' | 'validated' = b.status === 'validated' ? 'pending' : 'validated';
        try {
            const anim = animations.find(a => a.id === b.animationId || a.title === b.animationTitle);
            await saveBooking({ ...b, status: newStatus }, anim?.animator);

            if (newStatus === 'validated' && b.status !== 'validated' && settings.emailAnimatorOnValidationEnabled !== false && anim?.animator) {
                const animator = (settings.animators || []).find(
                    a => a.name.trim().toLowerCase() === anim.animator?.trim().toLowerCase()
                );
                if (animator && animator.email) {
                    await emailService.sendAnimatorValidationNotification({ ...b, status: 'validated' }, animator, settings);
                    showNotification(`Réservation validée & e-mail envoyé à ${animator.name} !`);
                    return;
                }
            }

            showNotification(newStatus === 'validated' ? 'Réservation validée !' : 'Réservation passée en "À confirmer".');
        } catch (error) {
            showNotification("Erreur lors de la mise à jour du statut.", "error");
        }
    };

    const handleSaveStatusManagement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (statusManagementBooking) {
            try {
                const anim = animations.find(a => a.id === statusManagementBooking.animationId || a.title === statusManagementBooking.animationTitle);
                const previousBooking = bookings.find(b => b.id === statusManagementBooking.id);
                const previousStatus = previousBooking?.status || 'pending';
                
                await saveBooking(statusManagementBooking, anim?.animator);

                // Envoi de l'e-mail à l'animateur si le statut passe à "validated"
                if (statusManagementBooking.status === 'validated' && previousStatus !== 'validated') {
                    if (settings.emailAnimatorOnValidationEnabled !== false && anim?.animator) {
                        const animator = (settings.animators || []).find(
                            a => a.name.trim().toLowerCase() === anim.animator?.trim().toLowerCase()
                        );
                        if (animator && animator.email) {
                            await emailService.sendAnimatorValidationNotification(statusManagementBooking, animator, settings);
                            showNotification(`Statut validé & e-mail envoyé à ${animator.name} !`);
                            setStatusManagementBooking(null);
                            return;
                        }
                    }
                }

                setStatusManagementBooking(null);
                showNotification(statusManagementBooking.status === 'validated' ? 'Réservation validée !' : 'Statut de la réservation mis à jour !');
            } catch (error) {
                showNotification("Erreur lors de la mise à jour du statut.", "error");
            }
        }
    };

    const handleBulkValidate = () => {
        const count = bookings.filter(b => selectedBookingIds.has(b.id)).length;
        if (count === 0) {
            showNotification("Aucune réservation sélectionnée.");
            return;
        }
        setShowBulkValidateConfirm(true);
    };

    const confirmBulkValidate = async () => {
        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));
        if (selectedBookings.length === 0) return;
        setShowBulkValidateConfirm(false);
        try {
            let emailCount = 0;
            for (const b of selectedBookings) {
                const anim = animations.find(a => a.id === b.animationId || a.title === b.animationTitle);
                await saveBooking({ ...b, status: 'validated' }, anim?.animator);

                if (b.status !== 'validated' && settings.emailAnimatorOnValidationEnabled !== false && anim?.animator) {
                    const animator = (settings.animators || []).find(
                        a => a.name.trim().toLowerCase() === anim.animator?.trim().toLowerCase()
                    );
                    if (animator && animator.email) {
                        await emailService.sendAnimatorValidationNotification({ ...b, status: 'validated' }, animator, settings);
                        emailCount++;
                    }
                }
            }
            if (emailCount > 0) {
                showNotification(`${selectedBookings.length} réservation(s) validée(s) (${emailCount} e-mail(s) animateur envoyé(s)) !`);
            } else {
                showNotification(`${selectedBookings.length} réservation(s) validée(s) !`);
            }
            setSelectedBookingIds(new Set());
        } catch (error) {
            showNotification("Erreur lors de la validation groupée.", "error");
        }
    };

    const handleBulkSetPending = () => {
        const count = bookings.filter(b => selectedBookingIds.has(b.id)).length;
        if (count === 0) {
            showNotification("Aucune réservation sélectionnée.");
            return;
        }
        setShowBulkPendingConfirm(true);
    };

    const confirmBulkSetPending = async () => {
        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));
        if (selectedBookings.length === 0) return;
        setShowBulkPendingConfirm(false);
        try {
            await Promise.all(selectedBookings.map(b => {
                const anim = animations.find(a => a.id === b.animationId || a.title === b.animationTitle);
                return saveBooking({ ...b, status: 'pending' }, anim?.animator);
            }));
            showNotification(`${selectedBookings.length} réservation(s) passée(s) en "À confirmer" !`);
            setSelectedBookingIds(new Set());
        } catch (error) {
            showNotification("Erreur lors de la mise à jour groupée.", "error");
        }
    };

    const [isSendingReminders, setIsSendingReminders] = useState(false);
    const [showReminderConfirm, setShowReminderConfirm] = useState(false);

    const handleSendReminders = () => {
        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));
        if (selectedBookings.length === 0) {
            showNotification("Aucune réservation sélectionnée.");
            return;
        }

        if (settings.emailReminderEnabled === false) {
            showNotification("Le rappel automatique par e-mail est désactivé dans les paramètres généraux.", "error");
            return;
        }

        setShowReminderConfirm(true);
    };

    const confirmSendReminders = async () => {
        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));
        if (selectedBookings.length === 0) {
            return;
        }

        setIsSendingReminders(true);
        setShowReminderConfirm(false);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const booking of selectedBookings) {
                try {
                    // Update reminderSent status in local and database
                    await saveBooking({ ...booking, reminderSent: true });
                    
                    // Send booking reminder (which will send to teacher and/or animator according to settings)
                    await emailService.sendBookingReminder(booking, settings, animations);
                    successCount++;
                } catch (err) {
                    console.error("Error sending manual reminder:", err);
                    failCount++;
                }
            }
            if (failCount === 0) {
                showNotification(`${successCount} rappel(s) envoyé(s) avec succès.`);
            } else {
                showNotification(`${successCount} rappel(s) envoyé(s), ${failCount} échec(s).`, "error");
            }
            setSelectedBookingIds(new Set());
        } catch (error) {
            showNotification("Erreur lors de l'envoi des rappels.", "error");
        } finally {
            setIsSendingReminders(false);
        }
    };

    const confirmSingleDelete = async () => {
        if (!deleteId) return;
        try {
            await removeBooking(deleteId);
            showNotification('Réservation supprimée.');
        } catch (error) {
            showNotification('Erreur lors de la suppression.', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSendList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientListEmail.trim()) {
            showNotification("Veuillez renseigner une adresse e-mail.", "error");
            return;
        }

        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));
        if (selectedBookings.length === 0) {
            showNotification("Aucune réservation sélectionnée.");
            return;
        }

        if (settings.emailListEnabled === false) {
            showNotification("L'envoi d'e-mails pour la liste est désactivé dans les paramètres généraux.", "error");
            return;
        }

        setIsSendingList(true);
        try {
            await emailService.sendBookingList(recipientListEmail.trim(), selectedBookings, settings);
            const targetName = selectedRecipientAnimator ? `${selectedRecipientAnimator} (${recipientListEmail.trim()})` : recipientListEmail.trim();
            showNotification(`La liste (${selectedBookings.length} résa.) a été envoyée par e-mail à ${targetName} !`);
            setIsSendListModalOpen(false);
            setRecipientListEmail('');
            setSelectedRecipientAnimator('');
        } catch (error) {
            showNotification("Erreur lors de l'envoi de l'e-mail.", "error");
        } finally {
            setIsSendingList(false);
        }
    };

    const handleGenerateBusSheet = async (format: 'pdf') => {
        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id) && !b.noBusRequired);
        if (selectedBookings.length === 0) {
            showNotification("Aucune réservation avec besoin de bus sélectionnée (statut 'Pas de bus' ignoré).");
            return;
        }
        try {
            const { generateBusPdf } = await import('../../services/documentGenerator');
            await generateBusPdf(selectedBookings);
        } catch (error) {
            showNotification("Erreur lors de la génération du PDF.");
        }
    };

    const handleSaveBusManagement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBusManager) {
            showNotification("Vous n'avez pas les droits pour modifier le transport.", "error");
            setBusManagementBooking(null);
            return;
        }
        if (busManagementBooking) {
            saveBooking(busManagementBooking);
            setBusManagementBooking(null);
            showNotification('Gestion du bus mise à jour !');
        }
    };

    const SortableHeader: React.FC<{ columnKey: SortableKey; title: string; }> = ({ columnKey, title }) => {
        const isSorted = sortConfig?.key === columnKey;
        return (
            <th onClick={() => {
                let dir: 'asc' | 'desc' = 'asc';
                if (sortConfig.key === columnKey && sortConfig.direction === 'asc') dir = 'desc';
                setSortConfig({ key: columnKey, direction: dir });
            }} className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1.5">
                    {title}
                    {!isSorted ? <SortIcon className="w-4 h-4 opacity-0 group-hover:opacity-100" /> : (sortConfig.direction === 'asc' ? <SortAscIcon className="w-4 h-4 text-blue-600" /> : <SortDescIcon className="w-4 h-4 text-blue-600" />)}
                </div>
            </th>
        );
    };

    const totalActiveFiltersCount = useMemo(() => {
        return selectedAnimators.size + selectedMonths.size + selectedBusStatuses.size + selectedBookingStatuses.size;
    }, [selectedAnimators, selectedMonths, selectedBusStatuses, selectedBookingStatuses]);

    const resetAllFilters = () => {
        setSelectedAnimators(new Set());
        setSelectedMonths(new Set());
        setSelectedBusStatuses(new Set());
        setSelectedBookingStatuses(new Set());
        setSearchTerm('');
    };

    // Sous-composant pour les sections de filtre uniformisées et compactes (max 2 lignes)
    const FilterSection: React.FC<{ 
        title: string, 
        items: { name: string, value: any, filteredCount: number, totalCount: number }[], 
        selected: Set<any>, 
        onToggle: (val: any) => void,
        onReset: () => void,
        onSelectAll?: () => void,
        variant?: 'animators' | 'vertical' | 'bus' | 'months'
    }> = ({ title, items, selected, onToggle, onReset, onSelectAll, variant = 'animators' }) => {
        const isFiltered = selected.size > 0;

        const renderItem = (item: { name: string, value: any, filteredCount: number, totalCount: number }) => {
            const isChecked = selected.has(item.value);
            return (
                <label 
                    key={item.value} 
                    className={`inline-flex items-center space-x-1 cursor-pointer text-xs transition-all px-1.5 py-0.5 rounded-md whitespace-nowrap select-none ${
                        isChecked 
                            ? 'font-black text-blue-900 bg-blue-100/80 border border-blue-300 shadow-xs' 
                            : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent'
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(item.value)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-0.5">
                        <span>{item.name}</span>
                        <span className="text-[10px]">
                            {item.filteredCount === item.totalCount ? (
                                <span className={isChecked ? 'text-blue-700 font-bold' : 'text-gray-400 font-normal'}>({item.totalCount})</span>
                            ) : (
                                <span className="text-blue-600 font-bold">
                                    ({item.filteredCount}<span className="text-gray-400 font-normal">/{item.totalCount}</span>)
                                </span>
                            )}
                        </span>
                    </span>
                </label>
            );
        };

        const renderContent = () => {
            if (variant === 'vertical') {
                // 2 éléments (Statut : 1. À confirmer, 2. Validés)
                return (
                    <div className="flex flex-col justify-around h-full py-0.5">
                        {items.map(renderItem)}
                    </div>
                );
            }

            if (variant === 'bus') {
                // 3 éléments sur 3 lignes : 1. En attente, 2. Validés, 3. Pas de bus
                return (
                    <div className="flex flex-col justify-around h-full py-0.5">
                        {items.map(renderItem)}
                    </div>
                );
            }

            if (variant === 'months') {
                // 9 mois sur 3 lignes : 1. OCT, NOV, DEC / 2. JAN, FEV, MAR / 3. AVR, MAI, JUIN
                return (
                    <div className="flex flex-col justify-around h-full py-0.5">
                        <div className="flex flex-wrap items-center gap-x-1.5">
                            {items.slice(0, 3).map(renderItem)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5">
                            {items.slice(3, 6).map(renderItem)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5">
                            {items.slice(6, 9).map(renderItem)}
                        </div>
                    </div>
                );
            }

            // Animateurs : 3 lignes (1. Amélie, Cyrielle / 2. Fatiha, Matthieu / 3. Thomas, Valentine)
            // Si le nombre d'animateurs varie, répartition par tiers de 2 par ligne
            return (
                <div className="flex flex-col justify-around h-full py-0.5">
                    <div className="flex flex-wrap items-center gap-x-2">
                        {items.slice(0, 2).map(renderItem)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                        {items.slice(2, 4).map(renderItem)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                        {items.slice(4).map(renderItem)}
                    </div>
                </div>
            );
        };

        return (
            <div className="flex flex-col gap-1.5 h-full">
                <div className="flex justify-between items-center px-0.5">
                    <div className="flex items-center gap-1.5">
                        <strong className="text-xs font-black text-gray-500 uppercase tracking-wider">{title}</strong>
                        {isFiltered ? (
                            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                {selected.size}
                            </span>
                        ) : (
                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                Tous
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                        {isFiltered ? (
                            <button 
                                type="button" 
                                onClick={onReset} 
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5"
                                title="Afficher tous les éléments de cette catégorie"
                            >
                                <XIcon className="w-3 h-3" />
                                <span>Tout afficher</span>
                            </button>
                        ) : onSelectAll ? (
                            <button 
                                type="button" 
                                onClick={onSelectAll} 
                                className="text-gray-400 hover:text-blue-600 hover:underline cursor-pointer text-[10px]"
                            >
                                Tout cocher
                            </button>
                        ) : null}
                    </div>
                </div>
                <div className={`p-2.5 rounded-xl border flex-grow h-[105px] transition-colors ${
                    isFiltered ? 'bg-blue-50/25 border-blue-200' : 'bg-gray-50/80 border-gray-100'
                }`}>
                    {renderContent()}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-bold text-gray-800">Liste des réservations</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {activeSchoolYearBookingsCount} {activeSchoolYearBookingsCount > 1 ? 'réservations' : 'réservation'} en {settings.activeYear}
                    </span>
                </div>
                 <div className="flex flex-wrap items-center gap-3">
                    {/* Affichage par défaut */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-xs text-gray-600">
                        <CogIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold text-gray-500 whitespace-nowrap">Affichage par défaut :</span>
                        <select
                            value={defaultViewPref}
                            onChange={(e) => handleDefaultViewChange(e.target.value as 'list' | 'calendar')}
                            className="bg-transparent font-extrabold text-gray-800 focus:outline-none cursor-pointer hover:text-blue-600 border-none p-0 pr-1 text-xs"
                        >
                            <option value="list">Vue Liste</option>
                            <option value="calendar">Vue Calendrier</option>
                        </select>
                        <span className="text-gray-300">|</span>
                        <select
                            value={defaultScopePref}
                            onChange={(e) => handleDefaultScopeChange(e.target.value as 'all' | 'mine')}
                            className="bg-transparent font-extrabold text-gray-800 focus:outline-none cursor-pointer hover:text-blue-600 border-none p-0 pr-1 text-xs"
                        >
                            <option value="all">Toutes les résas</option>
                            {currentUser?.animatorName ? (
                                <option value="mine">Mes résas</option>
                            ) : (
                                <option value="mine" disabled>Mes résas (indisponible)</option>
                            )}
                        </select>
                    </div>

                    <div className="inline-flex rounded-md shadow-sm">
                        <button onClick={() => setViewMode('list')} className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600 z-10' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}>
                            <ListIcon className="w-4 h-4 mr-2" /> Liste
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`inline-flex items-center px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg transition-colors ${viewMode === 'calendar' ? 'bg-blue-600 text-white border-blue-600 z-10' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}>
                            <CalendarDaysIcon className="w-4 h-4 mr-2" /> Calendrier
                        </button>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <button onClick={() => setIsGeneratorOpen(true)} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">
                            <SparklesIcon className="w-5 h-5" /> <span className="hidden sm:inline">Générer</span>
                        </button>
                    )}
                </div>
            </div>
            
            {/* Zone de filtres harmonisée (Mode additif) */}
            <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700">Filtres</span>
                        {totalActiveFiltersCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                {totalActiveFiltersCount} critère{totalActiveFiltersCount > 1 ? 's' : ''} actif{totalActiveFiltersCount > 1 ? 's' : ''}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Toutes les réservations affichées (aucun filtre restreint)
                            </span>
                        )}
                    </div>
                    {totalActiveFiltersCount > 0 && (
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="text-xs font-black text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-tight"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                            Réinitialiser tous les filtres
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
                    <div className={`${settings.enableBookingStatus ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col`}>
                        <FilterSection 
                            title="Animateurs"
                            items={animatorItemsWithCounts}
                            selected={selectedAnimators}
                            onToggle={(v) => toggleItem(selectedAnimators, setSelectedAnimators, v)}
                            onReset={() => setSelectedAnimators(new Set())}
                            onSelectAll={() => selectAll(animators.map(a => a.name), setSelectedAnimators)}
                            variant="animators"
                        />
                    </div>
                    {settings.enableBookingStatus && (
                        <div className="lg:col-span-2 flex flex-col">
                            <FilterSection 
                                title="Statut"
                                items={bookingStatusItemsWithCounts}
                                selected={selectedBookingStatuses}
                                onToggle={(v) => toggleItem(selectedBookingStatuses, setSelectedBookingStatuses, v)}
                                onReset={() => setSelectedBookingStatuses(new Set())}
                                onSelectAll={() => selectAll(BOOKING_STATUS_OPTIONS.map(o => o.value), setSelectedBookingStatuses)}
                                variant="vertical"
                            />
                        </div>
                    )}
                    <div className={`${settings.enableBookingStatus ? 'lg:col-span-3' : 'lg:col-span-3'} flex flex-col`}>
                        <FilterSection 
                            title="Bus"
                            items={busStatusItemsWithCounts}
                            selected={selectedBusStatuses}
                            onToggle={(v) => toggleItem(selectedBusStatuses, setSelectedBusStatuses, v)}
                            onReset={() => setSelectedBusStatuses(new Set())}
                            onSelectAll={() => selectAll(BUS_STATUS_OPTIONS.map(o => o.value), setSelectedBusStatuses)}
                            variant="bus"
                        />
                    </div>
                    <div className={`${settings.enableBookingStatus ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col`}>
                        <FilterSection 
                            title="Mois"
                            items={monthItemsWithCounts}
                            selected={selectedMonths}
                            onToggle={(v) => toggleItem(selectedMonths, setSelectedMonths, v)}
                            onReset={() => setSelectedMonths(new Set())}
                            onSelectAll={() => selectAll(SCHOOL_YEAR_MONTHS.map(m => m.value), setSelectedMonths)}
                            variant="months"
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0">
                {viewMode === 'list' ? (
                    <>
                        {/* Barre de recherche et barre d'actions groupées sticky au-dessus de la liste des réservations */}
                        <div className="sticky top-0 z-20 pb-3 pt-1 -mt-1 bg-gray-100/95 backdrop-blur-md flex flex-col gap-2.5">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-gray-200/90 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <div className="relative flex-grow flex items-center">
                                    <SearchIcon className="h-5 w-5 text-gray-400 shrink-0 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par enseignant, école, commune, animation, niveau, animateur..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full text-sm bg-transparent placeholder-gray-400 text-gray-900 focus:outline-none"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors ml-2"
                                            title="Effacer la recherche"
                                        >
                                            <XIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:pl-3 border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 border-gray-200 shrink-0">
                                    <span className="text-xs font-bold text-gray-600 whitespace-nowrap">
                                        {sortedBookings.length} {sortedBookings.length > 1 ? 'réservations' : 'réservation'}
                                    </span>
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                                        >
                                            Effacer filtre
                                        </button>
                                    )}
                                </div>
                            </div>

                            {selectedBookingIds.size > 0 && (
                                <div className="bg-indigo-900 text-white p-3 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-4 border border-indigo-700/50">
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                            {selectedBookingIds.size} sélectionné(s)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBookingIds(new Set())}
                                            className="text-xs font-medium text-indigo-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer pl-4.5 flex items-center gap-1"
                                            title="Désélectionner toutes les réservations"
                                        >
                                            Réinitialiser la sélection
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {settings.enableBookingStatus && (
                                            <>
                                                <button 
                                                    onClick={handleBulkValidate} 
                                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-black uppercase rounded-lg transition-colors shadow-sm cursor-pointer"
                                                    title="Valider toutes les réservations sélectionnées"
                                                >
                                                    <CheckIcon className="w-4 h-4" /> Valider
                                                </button>
                                                <button 
                                                    onClick={handleBulkSetPending} 
                                                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-black uppercase rounded-lg transition-colors shadow-sm cursor-pointer"
                                                    title="Passer en 'À confirmer' toutes les réservations sélectionnées"
                                                >
                                                    <ClockIcon className="w-4 h-4" /> À confirmer
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={handleSendReminders} 
                                            disabled={isSendingReminders}
                                            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer"
                                        >
                                            <BellIcon className="w-4 h-4" /> {isSendingReminders ? 'Envoi...' : 'Rappel'}
                                        </button>
                                        <button onClick={() => setIsSendListModalOpen(true)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer">
                                            <SendIcon className="w-4 h-4" /> Envoi Liste
                                        </button>
                                        <button onClick={() => setIsBusSheetModalOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer">
                                            <PdfIcon className="w-4 h-4" /> Fiches bus
                                        </button>
                                        <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer">
                                            <TrashIcon className="w-4 h-4" /> Supprimer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 w-10">
                                            <input type="checkbox" ref={headerCheckboxRef} onChange={handleSelectAllTable} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        </th>
                                        <SortableHeader columnKey="date" title="Date & Animation" />
                                        <SortableHeader columnKey="teacherName" title="Établissement" />
                                        {settings.enableBookingStatus && (
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Statut</th>
                                        )}
                                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Transport (Bus)</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {sortedBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={settings.enableBookingStatus ? 6 : 5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-1">
                                                        <SearchIcon className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-base font-bold text-gray-800">Aucune réservation trouvée</p>
                                                    <p className="text-xs text-gray-500 max-w-sm">
                                                        {searchTerm 
                                                            ? `Aucun résultat pour "${searchTerm}". Essayez de modifier votre recherche ou vos filtres.`
                                                            : "Aucune réservation ne correspond aux filtres sélectionnés."}
                                                    </p>
                                                    {searchTerm && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSearchTerm('')}
                                                            className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Effacer la recherche
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedBookings.map(b => (
                                            <tr key={b.id} className={`group hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedBookingIds.has(b.id) ? 'bg-blue-50/50' : ''}`} onClick={() => setViewingBookingId(b.id)}>
                                                <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedBookingIds.has(b.id)} onChange={() => handleSelectOneTable(b.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900">{new Date(b.date.replace(/-/g, '/')).toLocaleDateString('fr-FR')} à {b.time}h</span>
                                                        <span className="text-sm font-bold text-blue-600 mt-1 truncate" title={b.animationTitle}>{b.animationTitle}</span>
                                                        {b.animator && b.animator !== 'N/A' && <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{b.animator}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800 truncate">{b.teacherName} <span className="text-gray-400 font-normal">({b.classLevel})</span></span>
                                                        <span className="text-xs text-gray-500 mt-0.5 truncate">{b.schoolName}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">{b.commune}</span>
                                                    </div>
                                                </td>
                                                {settings.enableBookingStatus && (
                                                    <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                                                b.status === 'validated' 
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                                {b.status === 'validated' ? (
                                                                    <>
                                                                        <CheckIcon className="w-3 h-3 text-emerald-600" />
                                                                        <span>Validé</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ClockIcon className="w-3 h-3 text-amber-600" />
                                                                        <span>À confirmer</span>
                                                                    </>
                                                                )}
                                                            </span>
                                                            <button 
                                                                onClick={() => setStatusManagementBooking({ ...b, status: b.status || 'pending' })} 
                                                                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase mt-1 hover:underline text-left"
                                                            >
                                                                Gestion du statut
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-col items-start gap-1">
                                                        {b.noBusRequired ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">Pas de bus</span>
                                                        ) : (
                                                            <>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${b.busStatus === 'validated' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                                    {b.busStatus === 'validated' ? 'Validé' : 'En attente'}
                                                                </span>
                                                                <span className="text-xs font-bold text-gray-600">{b.busCost || 0} €</span>
                                                            </>
                                                        )}
                                                        <button onClick={() => setBusManagementBooking({ ...b, busStatus: b.busStatus || 'pending' })} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase mt-1 hover:underline text-left">Gestion du bus</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top text-right">
                                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => setEditingBooking(b)} className="p-2 text-gray-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-gray-100 transition-all shadow-sm"><CogIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => setDeleteId(b.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-gray-100 transition-all shadow-sm"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <BookingsCalendar bookings={filteredBookings} animations={animations} onEdit={(b) => setViewingBookingId(b.id)} />
                )}
            </div>
            
            {/* Détails de la réservation */}
            {viewingBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500]">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{viewingBooking.animationTitle}</h2>
                                <p className="text-blue-600 font-bold">{new Date(viewingBooking.date.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {viewingBooking.time}h</p>
                            </div>
                            <button type="button" onClick={() => setViewingBookingId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Informations Enseignant</h3>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom</p>
                                            <p className="font-bold text-gray-800">{viewingBooking.teacherName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                            <p className="font-bold text-blue-600">{viewingBooking.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone</p>
                                            <p className="font-bold text-gray-800">{formatPhoneNumber(viewingBooking.phoneNumber)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Établissement & Classe</h3>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">École / Structure</p>
                                            <p className="font-bold text-gray-800">{viewingBooking.schoolName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commune</p>
                                            <p className="font-bold text-gray-800">{viewingBooking.commune}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Niveau</p>
                                            <p className="font-bold text-gray-800">{viewingBooking.classLevel}</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200 mt-2 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Élèves</p>
                                                <p className="font-bold text-blue-600 text-lg">{viewingBooking.studentCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accompagnateurs</p>
                                                <p className="font-bold text-gray-800 text-lg">{viewingBooking.adultCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {settings.enableBookingStatus && (
                                    <div>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Statut de la réservation</h3>
                                        <div className={`rounded-2xl p-4 border flex items-center justify-between gap-4 ${
                                            viewingBooking.status === 'validated' 
                                                ? 'bg-emerald-50/70 border-emerald-200' 
                                                : 'bg-amber-50/70 border-amber-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${viewingBooking.status === 'validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {viewingBooking.status === 'validated' ? <CheckIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">État actuel</p>
                                                    <p className={`font-black text-base ${viewingBooking.status === 'validated' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        {viewingBooking.status === 'validated' ? 'Validé' : 'À confirmer'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const b = viewingBooking;
                                                    setViewingBookingId(null);
                                                    setTimeout(() => setStatusManagementBooking({ ...b, status: b.status || 'pending' }), 10);
                                                }}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                                            >
                                                Gestion du statut
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Transport & Logistique</h3>
                                    <div className="bg-blue-50 rounded-2xl p-4 space-y-3 border border-blue-100">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Besoin de bus</p>
                                            <p className="font-bold text-blue-900">{viewingBooking.noBusRequired ? 'Non' : 'Oui'}</p>
                                        </div>
                                        {!viewingBooking.noBusRequired && (
                                            <>
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Statut prise en charge</p>
                                                    <p className={`font-bold ${viewingBooking.busStatus === 'validated' ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {viewingBooking.busStatus === 'validated' ? 'Validé' : 'En attente'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Coût</p>
                                                    <p className="font-bold text-blue-900">{viewingBooking.busCost || 0} €</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {viewingBooking.busInfo && (
                                    <div>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Commentaires / Infos passage</h3>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingBooking.busInfo}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => { 
                                    const b = viewingBooking;
                                    setViewingBookingId(null);
                                    // Utilisation d'un timeout pour s'assurer que le changement d'état est bien process et éviter les conflits de modales
                                    setTimeout(() => setEditingBooking(b), 10);
                                }} 
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                Modifier
                            </button>
                            <button type="button" onClick={() => setViewingBookingId(null)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modale Gestion du Statut */}
            {statusManagementBooking && (() => {
                const statusAnim = animations.find(a => a.id === statusManagementBooking.animationId || a.title === statusManagementBooking.animationTitle);
                const statusAnimator = statusAnim?.animator 
                    ? (settings.animators || []).find(a => a.name.trim().toLowerCase() === statusAnim.animator?.trim().toLowerCase())
                    : null;

                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <button 
                                type="button" 
                                onClick={() => setStatusManagementBooking(null)} 
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                            <div className="flex justify-between items-start mb-2 pr-6">
                                <h2 className="text-2xl font-black text-gray-800">Gestion du statut</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-6 font-medium">
                                Définition du statut pour la réservation de <strong>{statusManagementBooking.teacherName}</strong> ({statusManagementBooking.schoolName}, {statusManagementBooking.commune}).
                            </p>
                            
                            <form onSubmit={handleSaveStatusManagement} className="space-y-5 overflow-y-auto pr-1.5 custom-scrollbar">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">État de la réservation</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setStatusManagementBooking({...statusManagementBooking, status: 'pending'})} 
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                                statusManagementBooking.status !== 'validated' 
                                                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-sm' 
                                                    : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-100/60'
                                            }`}
                                        >
                                            <div className={`p-2.5 rounded-xl ${statusManagementBooking.status !== 'validated' ? 'bg-amber-200/70 text-amber-800' : 'bg-gray-200/50 text-gray-400'}`}>
                                                <ClockIcon className="w-6 h-6" />
                                            </div>
                                            <span className="font-black text-sm uppercase tracking-wide">À confirmer</span>
                                            <span className="text-[11px] text-center font-medium opacity-80">En attente de validation</span>
                                        </button>

                                        <button 
                                            type="button" 
                                            onClick={() => setStatusManagementBooking({...statusManagementBooking, status: 'validated'})} 
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                                statusManagementBooking.status === 'validated' 
                                                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm' 
                                                    : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-100/60'
                                            }`}
                                        >
                                            <div className={`p-2.5 rounded-xl ${statusManagementBooking.status === 'validated' ? 'bg-emerald-200/70 text-emerald-800' : 'bg-gray-200/50 text-gray-400'}`}>
                                                <CheckIcon className="w-6 h-6" />
                                            </div>
                                            <span className="font-black text-sm uppercase tracking-wide">Validé</span>
                                            <span className="text-[11px] text-center font-medium opacity-80">Réservation confirmée</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Information précise sur l'envoi de l'e-mail de notification */}
                                {statusManagementBooking.status === 'validated' ? (
                                    <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider text-emerald-800">
                                            <span className="text-base">📧</span> Envoi de l'e-mail de notification animateur
                                        </div>
                                        {settings.emailAnimatorOnValidationEnabled !== false ? (
                                            statusAnimator && statusAnimator.email ? (
                                                <p className="leading-relaxed">
                                                    Lors de la validation, l'e-mail de notification sera automatiquement envoyé à l'animateur concerné : <strong className="font-bold text-emerald-900">{statusAnimator.name}</strong> (<span className="underline">{statusAnimator.email}</span>).
                                                </p>
                                            ) : statusAnimator ? (
                                                <p className="text-amber-800 font-medium leading-relaxed">
                                                    ⚠️ L'animateur <strong>{statusAnimator.name}</strong> n'a pas d'adresse e-mail renseignée dans les paramètres. Aucun e-mail ne sera envoyé.
                                                </p>
                                            ) : statusAnim?.animator ? (
                                                <p className="text-amber-800 font-medium leading-relaxed">
                                                    ⚠️ L'animateur <strong>{statusAnim.animator}</strong> n'a pas de profil configuré avec une adresse e-mail.
                                                </p>
                                            ) : (
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    ℹ️ Aucun animateur n'est affecté à cette animation.
                                                </p>
                                            )
                                        ) : (
                                            <p className="text-gray-700 font-medium leading-relaxed">
                                                ℹ️ L'envoi automatique d'e-mail à l'animateur lors de la validation est actuellement <strong className="font-bold text-red-600">désactivé</strong> dans les Paramètres.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs text-amber-800 font-medium">
                                        ⏳ La réservation reste en statut « À confirmer ». Aucun e-mail de notification ne sera envoyé.
                                    </div>
                                )}

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 space-y-2 font-medium">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Animation :</span>
                                        <span className="font-bold text-gray-800 text-right truncate max-w-[240px]" title={statusManagementBooking.animationTitle}>{statusManagementBooking.animationTitle}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Animateur :</span>
                                        <span className="font-bold text-indigo-700 text-right">{statusAnim?.animator || "Non assigné"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Date & Créneau :</span>
                                        <span className="font-bold text-gray-800">{new Date(statusManagementBooking.date.replace(/-/g, '/')).toLocaleDateString('fr-FR')} à {statusManagementBooking.time}h</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Établissement :</span>
                                        <span className="font-bold text-gray-800 text-right">{statusManagementBooking.schoolName} ({statusManagementBooking.commune})</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                                    <button type="button" onClick={() => setStatusManagementBooking(null)} className="flex-grow py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors">
                                        Annuler
                                    </button>
                                    <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                                        Confirmer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* Modales conservées */}
            {busManagementBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <button 
                            type="button" 
                            onClick={() => setBusManagementBooking(null)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div className="flex justify-between items-start mb-2 pr-6">
                            <h2 className="text-2xl font-black text-gray-800">Gestion du transport</h2>
                            {!isBusManager && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg uppercase tracking-tight">Lecture seule</span>}
                        </div>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Validation de la prise en charge pour <strong>{busManagementBooking.teacherName}</strong> ({busManagementBooking.schoolName}, {busManagementBooking.commune}).</p>
                        
                        <form onSubmit={handleSaveBusManagement} className="space-y-6 overflow-y-auto pr-1.5 custom-scrollbar">
                            {/* Option Pas de bus nécessaire */}
                            <div className="p-4 bg-blue-50/50 border border-blue-100/60 rounded-2xl flex items-center gap-3">
                                <label className={`flex items-center gap-3 ${isBusManager ? 'cursor-pointer' : 'cursor-not-allowed'} select-none w-full`}>
                                    <input 
                                        type="checkbox" 
                                        name="noBusRequired" 
                                        checked={busManagementBooking.noBusRequired || false} 
                                        disabled={!isBusManager}
                                        onChange={(e) => setBusManagementBooking({...busManagementBooking, noBusRequired: e.target.checked})} 
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 transition-all border-gray-200"
                                    />
                                    <div>
                                        <span className="text-sm font-black text-blue-900 uppercase tracking-wider block">Pas de bus nécessaire</span>
                                        <span className="text-[11px] text-blue-500 font-medium tracking-wide">Cochez cette case si l'établissement se déplace par ses propres moyens.</span>
                                    </div>
                                </label>
                            </div>

                            {!busManagementBooking.noBusRequired ? (
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    <div className="space-y-3">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">État de la prise en charge</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                type="button" 
                                                disabled={!isBusManager}
                                                onClick={() => setBusManagementBooking({...busManagementBooking, busStatus: 'pending'})} 
                                                className={`px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${busManagementBooking.busStatus === 'pending' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                En attente
                                            </button>
                                            <button 
                                                type="button" 
                                                disabled={!isBusManager}
                                                onClick={() => setBusManagementBooking({...busManagementBooking, busStatus: 'validated'})} 
                                                className={`px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${busManagementBooking.busStatus === 'validated' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                Validé
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label htmlFor="busCost" className="block text-xs font-black text-gray-400 uppercase tracking-widest">Montant de la prise en charge (€)</label>
                                        <div className="relative">
                                            <input 
                                                id="busCost" 
                                                type="text" 
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                disabled={!isBusManager}
                                                value={busManagementBooking.busCost || 0} 
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setBusManagementBooking({...busManagementBooking, busCost: parseInt(val) || 0})
                                                }} 
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-800 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">€</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="busInfo" className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Infos / Consigne de passage</label>
                                        <textarea 
                                            id="busInfo"
                                            name="busInfo"
                                            disabled={!isBusManager}
                                            value={busManagementBooking.busInfo || ''}
                                            onChange={(e) => setBusManagementBooking({...busManagementBooking, busInfo: e.target.value})}
                                            placeholder="Ex: Horaires de bus, point de ralliement, correspondances, consignes particulières de transport..."
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium text-gray-800 focus:border-blue-500 outline-none min-h-[100px] disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-300 placeholder:text-sm text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center py-6 animate-in fade-in duration-200">
                                    <span className="text-2xl mb-1 block">📌</span>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Aucun bus nécessaire</p>
                                    <p className="text-xs text-gray-500 font-medium font-sans">Les détails logistiques et coûts sont désactivés pour cette réservation.</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                                <button type="button" onClick={() => setBusManagementBooking(null)} className="flex-grow py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors">
                                    {isBusManager ? 'Annuler' : 'Fermer'}
                                </button>
                                {isBusManager && (
                                    <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 shadow-lg shadow-blue-100">Confirmer</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isGeneratorOpen && <RandomBookingGenerator onClose={() => setIsGeneratorOpen(false)} onGenerate={(newB) => { updateBookings([...bookings, ...newB]); setIsGeneratorOpen(false); showNotification(`${newB.length} générées !`); }} />}
            {isBusSheetModalOpen && (
                <BusSheetGeneratorModal 
                    bookingCount={bookings.filter(b => selectedBookingIds.has(b.id) && !b.noBusRequired).length} 
                    onClose={() => setIsBusSheetModalOpen(false)} 
                    onGenerate={handleGenerateBusSheet} 
                />
            )}
            
            {/* Modal Envoi Liste */}
            {isSendListModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsSendListModalOpen(false);
                                setSelectedRecipientAnimator('');
                                setRecipientListEmail('');
                            }} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3 mb-2 pr-6">
                            <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                                <SendIcon className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Envoyer la liste</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-5 font-medium">
                            Sélectionnez un animateur existant ou saisissez une adresse e-mail pour envoyer le tableau récapitulatif des <strong>{selectedBookingIds.size} réservation(s)</strong> sélectionnée(s).
                        </p>
                        
                        {settings?.emailListEnabled === false && (
                            <div className="mb-5 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold leading-relaxed">
                                ⚠️ <span className="font-bold">Attention :</span> L'envoi d'e-mails pour la liste est actuellement désactivé dans vos paramètres généraux. Vous devez l'activer pour pouvoir effectuer cet envoi.
                            </div>
                        )}
                        
                        <form onSubmit={handleSendList} className="space-y-5 overflow-y-auto pr-1 custom-scrollbar">
                            {/* Sélection d'un animateur existant */}
                            <div className="space-y-2.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <UserGroupIcon className="w-4 h-4 text-indigo-600" />
                                        <span>Choisir un animateur existant</span>
                                    </label>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Facultatif</span>
                                </div>
                                <select 
                                    value={selectedRecipientAnimator}
                                    onChange={(e) => {
                                        const animName = e.target.value;
                                        setSelectedRecipientAnimator(animName);
                                        if (animName) {
                                            const found = animators.find(a => a.name === animName);
                                            if (found?.email) {
                                                setRecipientListEmail(found.email);
                                            } else {
                                                setRecipientListEmail('');
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-800 focus:border-green-500 outline-none transition-all cursor-pointer text-sm"
                                >
                                    <option value="">-- Choisir un animateur dans la liste --</option>
                                    {animators.map(a => (
                                        <option key={a.name} value={a.name}>
                                            {a.name} {a.email ? `(${a.email})` : '— (aucun e-mail renseigné)'}
                                        </option>
                                    ))}
                                </select>

                                {/* Boutons / Badges de sélection rapide */}
                                {animators.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {animators.map(a => {
                                            const isSelected = selectedRecipientAnimator === a.name;
                                            return (
                                                <button
                                                    key={a.name}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedRecipientAnimator('');
                                                        } else {
                                                            setSelectedRecipientAnimator(a.name);
                                                            if (a.email) {
                                                                setRecipientListEmail(a.email);
                                                            } else {
                                                                setRecipientListEmail('');
                                                            }
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                                        isSelected
                                                            ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-200'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span>{a.name}</span>
                                                    {a.email ? (
                                                        <span className={`text-[10px] ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>✉️</span>
                                                    ) : (
                                                        <span className="text-[10px] text-amber-500" title="Aucun e-mail configuré">⚠️</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Saisie / Confirmation de l'adresse e-mail */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                                        Adresse e-mail destinataire
                                    </label>
                                    {selectedRecipientAnimator && (
                                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                            Lié à : {selectedRecipientAnimator}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    value={recipientListEmail}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRecipientListEmail(val);
                                        const match = animators.find(a => a.email && a.email.toLowerCase() === val.trim().toLowerCase());
                                        setSelectedRecipientAnimator(match ? match.name : '');
                                    }}
                                    placeholder="animateur@exemple.com ou autre adresse"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 text-sm"
                                />

                                {selectedRecipientAnimator && (() => {
                                    const animObj = animators.find(a => a.name === selectedRecipientAnimator);
                                    if (animObj && !animObj.email) {
                                        return (
                                            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium leading-relaxed">
                                                ⚠️ L'animateur <strong>{selectedRecipientAnimator}</strong> n'a pas d'adresse e-mail enregistrée dans les Paramètres. Veuillez saisir son adresse e-mail dans le champ ci-dessus.
                                            </p>
                                        );
                                    }
                                    if (animObj && animObj.email) {
                                        return (
                                            <p className="text-[11px] text-green-700 font-medium flex items-center gap-1.5">
                                                <span>✓</span> La liste sera expédiée à l'adresse officielle de l'animateur <strong>{animObj.name}</strong> (<span className="underline">{animObj.email}</span>).
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            
                            <div className="flex gap-3 pt-3 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsSendListModalOpen(false);
                                        setSelectedRecipientAnimator('');
                                        setRecipientListEmail('');
                                    }} 
                                    className="flex-grow py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSendingList || !recipientListEmail.trim()}
                                    className="flex-[2] py-3 bg-green-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSendingList ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <SendIcon className="w-4 h-4" /> Envoyer la liste
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingBooking && <BookingEditForm booking={editingBooking} animations={animations} bookings={bookings} onSave={async (b) => { 
                try {
                    const anim = animations.find(a => a.id === b.animationId);
                    await saveBooking(b, anim?.animator); 
                    setEditingBooking(null); 
                    showNotification('Réservation modifiée avec succès !'); 
                } catch (err: any) {
                    console.error("Erreur lors de la modification de la réservation:", err);
                    showNotification(err?.message || "Erreur lors de l'enregistrement de la modification.", "error");
                }
            }} onCancel={() => setEditingBooking(null)} />}

            <ConfirmationModal 
                isOpen={!!deleteId}
                title="Supprimer la réservation"
                message="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
                confirmLabel="Supprimer"
                isDanger={true}
                onConfirm={confirmSingleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <ConfirmationModal 
                isOpen={showBulkDeleteConfirm}
                title="Suppression groupée"
                message={`Êtes-vous sûr de vouloir supprimer les ${selectedBookingIds.size} réservations sélectionnées ? Cette action est irréversible.`}
                confirmLabel="Supprimer tout"
                isDanger={true}
                onConfirm={confirmBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />

            <ConfirmationModal 
                isOpen={showBulkValidateConfirm}
                title="Valider les réservations"
                message={`Voulez-vous vraiment valider les ${selectedBookingIds.size} réservation(s) sélectionnée(s) ?${settings.emailAnimatorOnValidationEnabled !== false ? " Si configuré, les animateurs concernés recevront un e-mail de notification." : ""}`}
                confirmLabel="Valider tout"
                isDanger={false}
                onConfirm={confirmBulkValidate}
                onCancel={() => setShowBulkValidateConfirm(false)}
            />

            <ConfirmationModal 
                isOpen={showBulkPendingConfirm}
                title="Passer en 'À confirmer'"
                message={`Voulez-vous vraiment passer les ${selectedBookingIds.size} réservation(s) sélectionnée(s) au statut "À confirmer" ?`}
                confirmLabel="Confirmer"
                isDanger={false}
                onConfirm={confirmBulkSetPending}
                onCancel={() => setShowBulkPendingConfirm(false)}
            />

            <ConfirmationModal 
                isOpen={showReminderConfirm}
                title="Envoyer les rappels"
                message={`Voulez-vous envoyer un e-mail de rappel aux destinataires (enseignants et/ou animateurs selon vos paramètres globaux) pour les ${selectedBookingIds.size} réservations sélectionnées ?`}
                confirmLabel="Envoyer"
                isDanger={false}
                onConfirm={confirmSendReminders}
                onCancel={() => setShowReminderConfirm(false)}
            />
        </div>
    );
};

export default ViewBookings;
