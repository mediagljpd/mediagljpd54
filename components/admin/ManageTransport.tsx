import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { Booking } from '../../types';
import { AdminSubComponentProps } from './types';
import { 
    BusIcon, 
    BanknotesIcon, 
    CheckIcon, 
    ClockIcon, 
    DownloadIcon, 
    CalendarIcon, 
    XIcon,
    DocumentTextIcon
} from '../Icons';
import * as XLSX from 'xlsx';
import BdcTemplateEditor from './BdcTemplateEditor';

interface MonthStat {
    key: string; // YYYY-MM
    label: string;
    shortLabel: string;
    year: number;
    monthIndex: number; // 0-11
    validatedBudget: number;
    pendingBudget: number;
    totalBudget: number;
    totalBusCount: number;
    validatedCount: number;
    pendingCount: number;
    noBusCount: number;
    totalAllBookings: number;
    bookings: Booking[];
}

const ManageTransport: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { bookings, settings, currentUser } = useContext(AppContext);
    const [showBdcEditor, setShowBdcEditor] = useState(false);

    // Permission check
    const isBusManager = currentUser?.role === 'admin' || 
                         !!currentUser?.permissions?.canManageBus || 
                         currentUser?.username?.trim().toLowerCase() === 'aude';

    // School Year calculation
    const [startYear, endYear] = useMemo(() => {
        const years = (settings?.activeYear || '').split('-').map(Number);
        if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
            const currentYear = new Date().getFullYear();
            return [currentYear, currentYear + 1];
        }
        return [years[0], years[1]];
    }, [settings?.activeYear]);

    // Filter bookings belonging to active school year
    const activeYearBookings = useMemo(() => {
        return (bookings || []).filter(b => {
            if (!b.date) return false;
            const [yStr, mStr] = b.date.split('-');
            const bYear = Number(yStr);
            const bMonth = Number(mStr); // 1-12
            // Active school year (Sept startYear to July endYear)
            return (bYear === startYear && bMonth >= 8) || (bYear === endYear && bMonth <= 7);
        });
    }, [bookings, startYear, endYear]);

    // Bookings that require a bus
    const activeBusBookings = useMemo(() => {
        return activeYearBookings.filter(b => !b.noBusRequired);
    }, [activeYearBookings]);

    // Total validated budget & statistics for the entire school year
    const yearStats = useMemo(() => {
        let validatedBudget = 0;
        let pendingBudget = 0;
        let validatedCount = 0;
        let pendingCount = 0;

        activeBusBookings.forEach(b => {
            const cost = Number(b.busCost) || 0;
            const status = b.busStatus || 'pending';
            if (status === 'validated') {
                validatedBudget += cost;
                validatedCount++;
            } else {
                pendingBudget += cost;
                pendingCount++;
            }
        });

        const totalBusBookings = activeBusBookings.length;
        const totalEstimatedBudget = validatedBudget + pendingBudget;

        return {
            validatedBudget,
            pendingBudget,
            totalEstimatedBudget,
            totalBusBookings,
            validatedCount,
            pendingCount
        };
    }, [activeBusBookings]);

    // Months of the school year (Oct to June as standard, plus Sept/July if bookings exist)
    const schoolMonths = useMemo<MonthStat[]>(() => {
        const baseMonths = [
            { monthIndex: 8, name: 'Septembre', short: 'SEPT', year: startYear },
            { monthIndex: 9, name: 'Octobre', short: 'OCT', year: startYear },
            { monthIndex: 10, name: 'Novembre', short: 'NOV', year: startYear },
            { monthIndex: 11, name: 'Décembre', short: 'DÉC', year: startYear },
            { monthIndex: 0, name: 'Janvier', short: 'JAN', year: endYear },
            { monthIndex: 1, name: 'Février', short: 'FÉV', year: endYear },
            { monthIndex: 2, name: 'Mars', short: 'MAR', year: endYear },
            { monthIndex: 3, name: 'Avril', short: 'AVR', year: endYear },
            { monthIndex: 4, name: 'Mai', short: 'MAI', year: endYear },
            { monthIndex: 5, name: 'Juin', short: 'JUIN', year: endYear },
            { monthIndex: 6, name: 'Juillet', short: 'JUIL', year: endYear },
        ];

        // Map all bookings in active school year into months
        const monthMap = new Map<string, Booking[]>();
        activeYearBookings.forEach(b => {
            const [yStr, mStr] = b.date.split('-');
            const key = `${yStr}-${mStr.padStart(2, '0')}`;
            if (!monthMap.has(key)) {
                monthMap.set(key, []);
            }
            monthMap.get(key)!.push(b);
        });

        const list: MonthStat[] = [];

        baseMonths.forEach(m => {
            const mPadded = String(m.monthIndex + 1).padStart(2, '0');
            const key = `${m.year}-${mPadded}`;
            const monthBookings = monthMap.get(key) || [];

            // If it's September or July, only include if there are bookings
            if ((m.monthIndex === 8 || m.monthIndex === 6) && monthBookings.length === 0) {
                return;
            }

            let validatedBudget = 0;
            let pendingBudget = 0;
            let validatedCount = 0;
            let pendingCount = 0;
            let noBusCount = 0;

            const busBookingsList: Booking[] = [];

            monthBookings.forEach(b => {
                if (b.noBusRequired) {
                    noBusCount++;
                } else {
                    busBookingsList.push(b);
                    const cost = Number(b.busCost) || 0;
                    const status = b.busStatus || 'pending';
                    if (status === 'validated') {
                        validatedBudget += cost;
                        validatedCount++;
                    } else {
                        pendingBudget += cost;
                        pendingCount++;
                    }
                }
            });

            list.push({
                key,
                label: `${m.name} ${m.year}`,
                shortLabel: m.short,
                year: m.year,
                monthIndex: m.monthIndex,
                validatedBudget,
                pendingBudget,
                totalBudget: validatedBudget + pendingBudget,
                totalBusCount: busBookingsList.length,
                validatedCount,
                pendingCount,
                noBusCount,
                totalAllBookings: monthBookings.length,
                bookings: busBookingsList
            });
        });

        return list;
    }, [activeYearBookings, startYear, endYear]);

    // Excel Export with real currency number formats
    const handleExportExcel = () => {
        try {
            // Sheet 1: Synthèse mensuelle
            const summaryData = schoolMonths.map(m => ({
                'Mois': m.label,
                'Transports demandés': m.totalBusCount,
                'Transports validés': m.validatedCount,
                'Transports en attente': m.pendingCount,
                'Budget validé (€)': Math.round(m.validatedBudget * 100) / 100,
            }));

            // Totals row
            summaryData.push({
                'Mois': `TOTAL ANNÉE SCOLAIRE ${settings?.activeYear || ''}`,
                'Transports demandés': yearStats.totalBusBookings,
                'Transports validés': yearStats.validatedCount,
                'Transports en attente': yearStats.pendingCount,
                'Budget validé (€)': Math.round(yearStats.validatedBudget * 100) / 100,
            });

            // Sheet 2: Liste détaillée des réservations transport
            const detailsData = activeBusBookings.map(b => ({
                'Date': b.date,
                'Heure': `${b.time}h`,
                'Animation': b.animationTitle,
                'Enseignant': b.teacherName,
                'École': b.schoolName,
                'Commune': b.commune,
                'Élèves': b.studentCount,
                'Adultes': b.adultCount,
                'Statut Bus': b.busStatus === 'validated' ? 'Validé' : 'En attente',
                'Coût Bus (€)': Number(b.busCost) || 0,
                'Consignes Transport': b.busInfo || '',
                'Téléphone': b.phoneNumber,
                'E-mail': b.email
            }));

            const wb = XLSX.utils.book_new();
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            const wsDetails = XLSX.utils.json_to_sheet(detailsData);

            // Helper to apply Excel currency number formatting (#,##0.00 €) to specified column headers
            const formatCurrencyColumns = (ws: XLSX.WorkSheet, colNames: string[]) => {
                if (!ws['!ref']) return;
                const range = XLSX.utils.decode_range(ws['!ref']);
                const targetCols: number[] = [];

                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const headerCell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
                    if (headerCell && colNames.includes(String(headerCell.v))) {
                        targetCols.push(C);
                    }
                }

                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    for (const C of targetCols) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        const cell = ws[cellAddress];
                        if (cell && typeof cell.v === 'number') {
                            cell.t = 'n';
                            cell.z = '#,##0.00\\ "€"';
                        }
                    }
                }
            };

            // Format monetary columns
            formatCurrencyColumns(wsSummary, ['Budget validé (€)']);
            formatCurrencyColumns(wsDetails, ['Coût Bus (€)']);

            // Set column widths for readability in Excel
            wsSummary['!cols'] = [
                { wch: 28 }, // Mois
                { wch: 22 }, // Transports demandés
                { wch: 20 }, // Transports validés
                { wch: 22 }, // Transports en attente
                { wch: 20 }, // Budget validé (€)
            ];

            wsDetails['!cols'] = [
                { wch: 14 }, // Date
                { wch: 10 }, // Heure
                { wch: 30 }, // Animation
                { wch: 24 }, // Enseignant
                { wch: 26 }, // École
                { wch: 22 }, // Commune
                { wch: 10 }, // Élèves
                { wch: 10 }, // Adultes
                { wch: 14 }, // Statut Bus
                { wch: 18 }, // Coût Bus (€)
                { wch: 35 }, // Consignes Transport
                { wch: 16 }, // Téléphone
                { wch: 26 }, // E-mail
            ];

            XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse mensuelle');
            XLSX.utils.book_append_sheet(wb, wsDetails, 'Liste des réservations');

            const fileName = `Budget_Transports_${settings?.activeYear || 'scolaire'}.xlsx`;
            XLSX.writeFile(wb, fileName);


            showNotification('Export Excel des transports téléchargé !');
        } catch (error) {
            console.error("Export error:", error);
            showNotification("Erreur lors de l'export Excel.", "error");
        }
    };

    if (!isBusManager) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto my-12 border border-gray-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <XIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
                <p className="text-gray-500 text-sm">
                    Cet onglet est réservé aux personnes autorisées pour la gestion des transports scolaires.
                </p>
            </div>
        );
    }

    if (showBdcEditor) {
        return (
            <BdcTemplateEditor 
                onBack={() => setShowBdcEditor(false)} 
                showNotification={showNotification} 
            />
        );
    }

    return (
        <div className="space-y-8 pb-16">
            {/* Top Bar Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <BusIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestion des transports</h1>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-full border border-blue-200">
                                Année {settings?.activeYear}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Suivi budgétaire annuel, ventilation mensuelle et bilan des transports scolaires
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Overview Cards (Budget engagé, Demandes de transport, Exporter bilan, Éditeur de bon de commande) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Budget engagé */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute right-3 top-3 opacity-15">
                        <BanknotesIcon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-100">Budget engagé</span>
                            <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">Validé</span>
                        </div>
                        <div className="text-3xl lg:text-4xl font-black tracking-tight mb-2 font-mono">
                            {yearStats.validatedBudget.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                    </div>
                    <div className="relative z-10 pt-3 border-t border-white/20 text-xs text-emerald-50 font-medium">
                        Pour les <strong>{yearStats.validatedCount}</strong> transport(s) validé(s) cette année
                    </div>
                </div>

                {/* 2. Demandes de transport */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Demandes de transport</span>
                            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <BusIcon className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl lg:text-4xl font-black tracking-tight text-gray-900 mb-3 font-mono">
                            {yearStats.totalBusBookings}
                        </div>
                    </div>
                    
                    {/* Détail plus visible : badges contrastés et distincts pour validés et en attente */}
                    <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase tracking-wider text-[10px] font-bold">Validés</span>
                                <span className="text-sm font-black text-emerald-800">{yearStats.validatedCount}</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <ClockIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase tracking-wider text-[10px] font-bold">En attente</span>
                                <span className="text-sm font-black text-amber-800">{yearStats.pendingCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Exporter bilan (Excel) */}
                <div 
                    onClick={handleExportExcel}
                    className="bg-white hover:bg-emerald-50/40 rounded-3xl p-6 border-2 border-emerald-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Exportation</span>
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                            <DownloadIcon className="w-4 h-4" />
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-emerald-800 transition-colors mb-1.5 flex items-center gap-2">
                            <span>Exporter bilan (Excel)</span>
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Télécharger la synthèse mensuelle et le détail des transports au format <strong>.xlsx</strong> avec montants monétaires.
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-emerald-700 transition-colors">
                            Bilan complet {settings?.activeYear}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
                            <DownloadIcon className="w-3.5 h-3.5" />
                            <span>Télécharger</span>
                        </span>
                    </div>
                </div>

                {/* 4. Éditeur de bon de commande */}
                <div 
                    onClick={() => setShowBdcEditor(true)}
                    className="bg-white hover:bg-indigo-50/40 rounded-3xl p-6 border-2 border-indigo-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Modèle Word</span>
                        <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                            <DocumentTextIcon className="w-4 h-4" />
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-800 transition-colors mb-1.5 flex items-center gap-2">
                            <span>Éditeur de bon de commande</span>
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Personnaliser le modèle de bon de commande de bus (.docx), prévisualiser et gérer les mentions fixes et dynamiques.
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-indigo-700 transition-colors">
                            Génération automatique
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
                            <DocumentTextIcon className="w-3.5 h-3.5" />
                            <span>Configurer</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Monthly Grid / Breakdown Cards (Détail mensuel - 3 par ligne, hauteur adaptée) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Détail mensuel</h2>
                        <p className="text-xs text-gray-500">
                            Synthèse des budgets engagés et des taux de validation pour chaque mois de l'année scolaire
                        </p>
                    </div>
                </div>

                {/* Grid arranged strictly 3 cards per row on large screens for maximum readability */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {schoolMonths.map((m) => {
                        const validationRatio = m.totalBusCount > 0 
                            ? Math.round((m.validatedCount / m.totalBusCount) * 100) 
                            : 0;

                        return (
                            <div
                                key={m.key}
                                className="rounded-2xl p-4 sm:p-5 border bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    {/* Month header & total count badge */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                <CalendarIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-black text-sm text-gray-900 leading-tight">
                                                {m.label}
                                            </span>
                                        </div>

                                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            m.totalBusCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {m.totalBusCount} bus
                                        </span>
                                    </div>

                                    {/* 1. Budget engagé */}
                                    <div className="bg-gray-50/80 rounded-xl px-3 py-2 border border-gray-100 flex items-baseline justify-between">
                                        <span className="text-xs text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                                            Budget engagé
                                        </span>
                                        <span className="text-lg font-black text-emerald-600 font-mono">
                                            {m.validatedBudget.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </span>
                                    </div>

                                    {/* 2. Taux de validation */}
                                    <div>
                                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 mb-1">
                                            <span>Taux de validation</span>
                                            <span className={validationRatio === 100 ? 'text-emerald-600 font-black' : 'text-gray-700'}>
                                                {validationRatio}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                                            <div 
                                                className="bg-emerald-500 h-full transition-all duration-500" 
                                                style={{ width: `${validationRatio}%` }} 
                                            />
                                            <div 
                                                className="bg-amber-400 h-full transition-all duration-500" 
                                                style={{ width: `${100 - validationRatio}%` }} 
                                            />
                                        </div>
                                    </div>

                                    {/* 3. En-dessous : Nombre de bus validés et en attente */}
                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-[11px]" title="Bus validés">
                                                <CheckIcon className="w-3 h-3 text-emerald-600" />
                                                <span><strong>{m.validatedCount}</strong> validé{m.validatedCount > 1 ? 's' : ''}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-[11px]" title="Bus en attente">
                                                <ClockIcon className="w-3 h-3 text-amber-600" />
                                                <span><strong>{m.pendingCount}</strong> attente</span>
                                            </span>
                                        </div>

                                        <span className="text-[11px] font-medium text-gray-400">
                                            Total : {m.totalBusCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ManageTransport;
