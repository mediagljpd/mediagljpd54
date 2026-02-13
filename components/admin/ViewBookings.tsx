
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../../App';
import { Booking } from '../../types';
import { AdminSubComponentProps } from './types';
import { generateBusPdf } from '../../services/documentGenerator';
import { formatPhoneNumber } from '../../utils/formatters';
import { SortAscIcon, SortDescIcon, SortIcon, SearchIcon, SparklesIcon, PdfIcon, ListIcon, CalendarDaysIcon, TrashIcon, CogIcon, CheckIcon } from '../Icons';

import BookingEditForm from './BookingEditForm';
import BookingsCalendar from './BookingsCalendar';
import RandomBookingGenerator from './RandomBookingGenerator';
import BusSheetGeneratorModal from './BusSheetGeneratorModal';

const SCHOOL_YEAR_MONTHS = [
    { label: 'OCT', value: 9 },
    { label: 'NOV', value: 10 },
    { label: 'DEC', value: 11 },
    { label: 'JAN', value: 0 },
    { label: 'FEV', value: 1 },
    { label: 'MAR', value: 2 },
    { label: 'AVR', value: 3 },
    { label: 'MAI', value: 4 },
    { label: 'JUN', value: 5 },
];

const BUS_STATUS_OPTIONS = [
    { label: 'En attente', value: 'pending' },
    { label: 'Validés', value: 'validated' },
    { label: 'Pas de bus', value: 'none' },
];

const ViewBookings: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { bookings, animations, removeBooking, updateBookings, settings, saveBooking } = useContext(AppContext);
    
    type AugmentedBooking = Booking & { animator?: string };
    type SortableKey = 'date' | 'teacherName';

    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [busManagementBooking, setBusManagementBooking] = useState<Booking | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isBusSheetModalOpen, setIsBusSheetModalOpen] = useState(false);

    // Filtres
    const animators = useMemo(() => settings.animators || [], [settings.animators]);
    const [selectedAnimators, setSelectedAnimators] = useState<Set<string>>(new Set());
    const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set(SCHOOL_YEAR_MONTHS.map(m => m.value)));
    const [selectedBusStatuses, setSelectedBusStatuses] = useState<Set<string>>(new Set(['pending', 'validated', 'none']));

    // Initialisation des animateurs (tout cocher par défaut)
    useEffect(() => {
        if (animators.length > 0 && selectedAnimators.size === 0) {
            setSelectedAnimators(new Set(animators.map(a => a.name)));
        }
    }, [animators]);

    const animatorMapForFiltering = useMemo(() => {
        const map = new Map<string, string>();
        animations.forEach(anim => {
            if (anim.animator) map.set(anim.id, anim.animator);
        });
        return map;
    }, [animations]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            // 1. Filtre Animateur
            const animator = animatorMapForFiltering.get(booking.animationId);
            const passesAnimator = !animator || selectedAnimators.has(animator);
            
            // 2. Filtre Mois
            const bookingDate = new Date(booking.date.replace(/-/g, '/'));
            const passesMonth = selectedMonths.has(bookingDate.getMonth());

            // 3. Filtre Bus
            let currentStatus = 'none';
            if (!booking.noBusRequired) {
                currentStatus = booking.busStatus || 'pending';
            }
            const passesBus = selectedBusStatuses.has(currentStatus);

            return passesAnimator && passesMonth && passesBus;
        });
    }, [bookings, selectedAnimators, selectedMonths, selectedBusStatuses, animatorMapForFiltering]);

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
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer les ${selectedBookingIds.size} réservations sélectionnées ?`)) {
            const idsToDelete = Array.from(selectedBookingIds);
            idsToDelete.forEach(id => removeBooking(id));
            showNotification(`${selectedBookingIds.size} réservation(s) supprimée(s).`);
            setSelectedBookingIds(new Set());
        }
    };

    const handleGenerateBusSheet = async (format: 'pdf') => {
        const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));
        if (selectedBookings.length === 0) {
            showNotification("Aucune réservation sélectionnée.");
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

    // Sous-composant pour les sections de filtre uniformisées
    const FilterSection: React.FC<{ 
        title: string, 
        items: { label: string, value: any }[], 
        selected: Set<any>, 
        onToggle: (val: any) => void,
        onSelectAll: () => void,
        onDeselectAll: () => void
    }> = ({ title, items, selected, onToggle, onSelectAll, onDeselectAll }) => (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                <strong className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</strong>
                <div className="flex gap-2 text-[10px] font-bold uppercase">
                    <button onClick={onSelectAll} className="text-blue-600 hover:underline">Tout cocher</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={onDeselectAll} className="text-gray-400 hover:underline">Tout décocher</button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100 flex-grow h-full">
                {items.map(item => (
                    <label key={item.value} className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">
                        <input
                            type="checkbox"
                            checked={selected.has(item.value)}
                            onChange={() => onToggle(item.value)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Liste des réservations</h2>
                 <div className="flex flex-wrap items-center gap-3">
                    {viewMode === 'list' && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-48 sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    )}
                    <div className="inline-flex rounded-md shadow-sm">
                        <button onClick={() => setViewMode('list')} className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600 z-10' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}>
                            <ListIcon className="w-4 h-4 mr-2" /> Liste
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`inline-flex items-center px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg transition-colors ${viewMode === 'calendar' ? 'bg-blue-600 text-white border-blue-600 z-10' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}>
                            <CalendarDaysIcon className="w-4 h-4 mr-2" /> Calendrier
                        </button>
                    </div>
                    <button onClick={() => setIsGeneratorOpen(true)} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">
                        <SparklesIcon className="w-5 h-5" /> <span className="hidden sm:inline">Générer</span>
                    </button>
                    <button onClick={() => setIsBusSheetModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <PdfIcon className="w-5 h-5" /> <span className="hidden sm:inline">Fiches bus</span>
                    </button>
                </div>
            </div>
            
            {/* Zone de filtres harmonisée sur une seule ligne sur desktop */}
            <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <FilterSection 
                        title="Animateurs"
                        items={animators.map(a => ({ label: a.name, value: a.name }))}
                        selected={selectedAnimators}
                        onToggle={(v) => toggleItem(selectedAnimators, setSelectedAnimators, v)}
                        onSelectAll={() => selectAll(animators.map(a => a.name), setSelectedAnimators)}
                        onDeselectAll={() => deselectAll(setSelectedAnimators)}
                    />
                    <FilterSection 
                        title="Gestion du bus"
                        items={BUS_STATUS_OPTIONS}
                        selected={selectedBusStatuses}
                        onToggle={(v) => toggleItem(selectedBusStatuses, setSelectedBusStatuses, v)}
                        onSelectAll={() => selectAll(BUS_STATUS_OPTIONS.map(o => o.value), setSelectedBusStatuses)}
                        onDeselectAll={() => deselectAll(setSelectedBusStatuses)}
                    />
                    <FilterSection 
                        title="Mois"
                        items={SCHOOL_YEAR_MONTHS}
                        selected={selectedMonths}
                        onToggle={(v) => toggleItem(selectedMonths, setSelectedMonths, v)}
                        onSelectAll={() => selectAll(SCHOOL_YEAR_MONTHS.map(m => m.value), setSelectedMonths)}
                        onDeselectAll={() => deselectAll(setSelectedMonths)}
                    />
                </div>
            </div>

            <div className="min-h-0">
                {viewMode === 'list' ? (
                    <>
                        {selectedBookingIds.size > 0 && (
                            <div className="bg-indigo-900 text-white p-4 mb-4 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4">
                                <span className="font-black text-sm uppercase tracking-widest">{selectedBookingIds.size} sélectionné(s)</span>
                                <button onClick={handleDeleteSelected} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 text-xs font-black uppercase rounded-lg transition-colors">
                                    <TrashIcon className="w-4 h-4" /> Supprimer
                                </button>
                            </div>
                        )}
                        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 w-10">
                                            <input type="checkbox" ref={headerCheckboxRef} onChange={handleSelectAllTable} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        </th>
                                        <SortableHeader columnKey="date" title="Date & Animation" />
                                        <SortableHeader columnKey="teacherName" title="Établissement" />
                                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Transport (Bus)</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {sortedBookings.map(b => (
                                        <tr key={b.id} className={`group hover:bg-gray-50/50 transition-colors ${selectedBookingIds.has(b.id) ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4 align-top">
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
                                            <td className="px-6 py-4 align-top">
                                                {b.noBusRequired ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">Pas de bus</span>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${b.busStatus === 'validated' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                            {b.busStatus === 'validated' ? 'Validé' : 'En attente'}
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-600">{b.busCost || 0} €</span>
                                                        <button onClick={() => setBusManagementBooking(b)} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase mt-1 hover:underline">Gestion du bus</button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-top text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingBooking(b)} className="p-2 text-gray-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-gray-100 transition-all shadow-sm"><CogIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => { if(window.confirm("Supprimer ?")) removeBooking(b.id); }} className="p-2 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-gray-100 transition-all shadow-sm"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <BookingsCalendar bookings={filteredBookings} animations={animations} onEdit={setEditingBooking} />
                )}
            </div>
            
            {/* Modales conservées */}
            {busManagementBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setBusManagementBooking(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Gestion du transport</h2>
                        <p className="text-sm text-gray-500 mb-6">Validation de la prise en charge pour <strong>{busManagementBooking.teacherName}</strong>.</p>
                        <form onSubmit={handleSaveBusManagement} className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">État de la prise en charge</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setBusManagementBooking({...busManagementBooking, busStatus: 'pending'})} className={`px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${busManagementBooking.busStatus === 'pending' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>En attente</button>
                                    <button type="button" onClick={() => setBusManagementBooking({...busManagementBooking, busStatus: 'validated'})} className={`px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${busManagementBooking.busStatus === 'validated' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}>Validé</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="busCost" className="block text-xs font-black text-gray-400 uppercase tracking-widest">Montant (€)</label>
                                <div className="relative">
                                    <input id="busCost" type="number" value={busManagementBooking.busCost || 0} onChange={(e) => setBusManagementBooking({...busManagementBooking, busCost: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-800 focus:border-blue-500 outline-none" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">€</div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setBusManagementBooking(null)} className="flex-grow py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors">Annuler</button>
                                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 shadow-lg">Confirmer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isGeneratorOpen && <RandomBookingGenerator onClose={() => setIsGeneratorOpen(false)} onGenerate={(newB) => { updateBookings([...bookings, ...newB]); setIsGeneratorOpen(false); showNotification(`${newB.length} générées !`); }} />}
            {isBusSheetModalOpen && <BusSheetGeneratorModal bookingCount={selectedBookingIds.size} onClose={() => setIsBusSheetModalOpen(false)} onGenerate={handleGenerateBusSheet} />}
            {editingBooking && <BookingEditForm booking={editingBooking} animations={animations} bookings={bookings} onSave={(b) => { saveBooking(b); setEditingBooking(null); showNotification('Modifiée !'); }} onCancel={() => setEditingBooking(null)} />}
        </div>
    );
};

export default ViewBookings;
