
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { AppContext } from '../../App';
import { Animation, Booking } from '../../types';
import { toYYYYMMDD } from '../../utils/date';

const FAKE_LAST_NAMES = ['Lefebvre', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy'];
const FAKE_FIRST_NAMES = ['Alice', 'Benjamin', 'Chloé', 'David', 'Eva', 'François', 'Gabrielle', 'Hugo', 'Inès', 'Jules'];
const FAKE_CLASSES = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
const FAKE_COMMUNES = ['Lille', 'Roubaix', 'Tourcoing', 'Villeneuve d\'Ascq', 'Marcq-en-Barœul', 'Lambersart'];
const FAKE_SCHOOL_NAMES = ['École Pasteur', 'École Victor Hugo', 'École Jules Ferry', 'École Jean Jaurès', 'Groupe Scolaire Saint-Exupéry'];

const generateFakeBookingData = (animation: Animation, date: Date, time: number): Omit<Booking, 'id'> => {
    const teacherFirstName = FAKE_FIRST_NAMES[Math.floor(Math.random() * FAKE_FIRST_NAMES.length)];
    const teacherLastName = FAKE_LAST_NAMES[Math.floor(Math.random() * FAKE_LAST_NAMES.length)];
    const teacherName = `${teacherFirstName} ${teacherLastName}`;
    const classLevel = FAKE_CLASSES[Math.floor(Math.random() * FAKE_CLASSES.length)];
    const commune = FAKE_COMMUNES[Math.floor(Math.random() * FAKE_COMMUNES.length)];
    const schoolName = FAKE_SCHOOL_NAMES[Math.floor(Math.random() * FAKE_SCHOOL_NAMES.length)];
    
    return {
        animationId: animation.id,
        animationTitle: animation.title,
        date: toYYYYMMDD(date),
        time,
        teacherName,
        classLevel,
        commune,
        schoolName,
        phoneNumber: `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        email: `${teacherFirstName.toLowerCase()}.${teacherLastName.toLowerCase()}@ecole-fictive.fr`,
        studentCount: Math.floor(Math.random() * 11) + 20, // 20-30
        adultCount: Math.floor(Math.random() * 3) + 2, // 2-4
        busInfo: `Le bus doit récupérer la classe à l'école primaire de ${teacherLastName}ville à 8h30.`,
    };
};


const RandomBookingGenerator: React.FC<{
    onClose: () => void;
    onGenerate: (bookings: Booking[]) => void;
}> = ({ onClose, onGenerate }) => {
    const { animations, bookings, settings } = useContext(AppContext);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateAllYear, setGenerateAllYear] = useState(true);
    const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
    const [bookingCount, setBookingCount] = useState(15);
    const [error, setError] = useState<string | null>(null);

    const schoolYearMonths = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        const startYear = years.length === 2 && !isNaN(years[0]) ? years[0] : new Date().getFullYear();
        const endYear = years.length === 2 && !isNaN(years[1]) ? years[1] : startYear + 1;
        
        const allMonths = [
            { month: 9, year: startYear, name: 'Octobre' },
            { month: 10, year: startYear, name: 'Novembre' },
            { month: 11, year: startYear, name: 'Décembre' },
            { month: 0, year: endYear, name: 'Janvier' },
            { month: 1, year: endYear, name: 'Février' },
            { month: 2, year: endYear, name: 'Mars' },
            { month: 3, year: endYear, name: 'Avril' },
            { month: 4, year: endYear, name: 'Mai' },
            { month: 5, year: endYear, name: 'Juin' },
        ];

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return allMonths.filter(m => {
            if (m.year > currentYear) return true;
            if (m.year < currentYear) return false;
            return m.month >= currentMonth;
        });
    }, [settings.activeYear]);

    const availabilityStats = useMemo(() => {
        const stats: {
            total: number;
            byMonth: Record<string, number>;
            slots: { animation: Animation; date: Date; time: number }[];
        } = {
            total: 0,
            byMonth: {},
            slots: [],
        };
    
        const holidaysSet = new Set<string>();
        settings.holidays.forEach(h => {
            let d = new Date(h.startDate.replace(/-/g, '/'));
            const endDate = new Date(h.endDate.replace(/-/g, '/'));
            while (d <= endDate) {
                holidaysSet.add(toYYYYMMDD(d));
                d.setDate(d.getDate() + 1);
            }
        });
    
        const bookingsByDate = bookings.reduce((acc, booking) => {
            if (!acc[booking.date]) acc[booking.date] = [];
            acc[booking.date].push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
    
        const animationAnimatorMap = animations.reduce((acc, anim) => {
            if (anim.animator) acc[anim.id] = anim.animator;
            return acc;
        }, {} as Record<string, string>);

        const animatorSettings = settings.animatorSettings || {};
        const allowedDays = settings.allowedDays || [2, 4];
        const baseTimeSlots = settings.availableTimeSlots || [9, 10, 14, 15];
    
        for (const { month, year } of schoolYearMonths) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
    
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();
    
                if (!allowedDays.includes(dayOfWeek)) continue;
    
                const dateStr = toYYYYMMDD(date);
                if (holidaysSet.has(dateStr)) continue;
                
                const today = new Date();
                today.setHours(0,0,0,0);
                const leadTime = settings.bookingLeadTime !== undefined ? settings.bookingLeadTime : 14;
                const minLeadDate = new Date(today);
                minLeadDate.setDate(today.getDate() + leadTime);
                if (date < minLeadDate) continue;
    
                const dayBookings = bookingsByDate[dateStr] || [];
                const dayBookedTimes = new Set(dayBookings.map(b => b.time));
                const dayBookedAnimators = new Set(dayBookings.map(b => animationAnimatorMap[b.animationId]).filter(Boolean));
                const isAfternoonBookedOnDay = dayBookedTimes.has(14) || dayBookedTimes.has(15);
    
                const availableAnimsForDay = animations.filter(a => {
                    const currentAnimatorSettings = a.animator ? animatorSettings[a.animator] : undefined;
                    if (currentAnimatorSettings?.unavailableDates.includes(dateStr)) return false;
                    if (a.animator && dayBookedAnimators.has(a.animator)) return false;
                    return true;
                });
    
                if (availableAnimsForDay.length === 0) continue;
    
                for (const animation of availableAnimsForDay) {
                    const animSettings = (animation.animator && animatorSettings[animation.animator])
                        ? animatorSettings[animation.animator]
                        : { unavailableDates: [], inactiveSlots: [] };

                    for (const time of baseTimeSlots) {
                        if (animSettings.inactiveSlots.includes(time)) continue;
                        if (dayBookedTimes.has(time)) continue;
                        
                        const isAfternoon = time === 14 || time === 15;
                        if (isAfternoon && isAfternoonBookedOnDay) continue;

                        stats.slots.push({ animation, date, time });
                    }
                }
            }
        }
        
        const uniqueDateAndSlots = new Set(
            stats.slots.map(s => {
                const slotIdentifier = (s.time === 14 || s.time === 15) ? 'afternoon' : s.time;
                return `${toYYYYMMDD(s.date)}-${slotIdentifier}`;
            })
        );

        stats.total = uniqueDateAndSlots.size;
        
        const newByMonth: Record<string, number> = {};
        stats.slots.forEach(s => {
            const dateStr = toYYYYMMDD(s.date);
            const slotIdentifier = (s.time === 14 || s.time === 15) ? 'afternoon' : s.time;
            const key = `${dateStr}-${slotIdentifier}`;

            if(uniqueDateAndSlots.has(key)) {
                const monthKey = `${s.date.getFullYear()}-${s.date.getMonth()}`;
                newByMonth[monthKey] = (newByMonth[monthKey] || 0) + 1;
                uniqueDateAndSlots.delete(key);
            }
        });
        
        schoolYearMonths.forEach(({ month, year }) => {
            const monthKey = `${year}-${month}`;
            if (!newByMonth.hasOwnProperty(monthKey)) {
                newByMonth[monthKey] = 0;
            }
        });
        stats.byMonth = newByMonth;

        return stats;
    }, [animations, bookings, settings, schoolYearMonths]);
    
    useEffect(() => {
        if (generateAllYear) {
            setSelectedMonths(new Set(schoolYearMonths.map(m => m.month)));
        } else {
            setSelectedMonths(new Set());
        }
    }, [generateAllYear, schoolYearMonths]);

    const handleMonthToggle = (month: number) => {
        setSelectedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(month)) {
                newSet.delete(month);
            } else {
                newSet.add(month);
            }
            return newSet;
        });
    };
    
    const handleGenerate = async () => {
        setError(null);
        setIsGenerating(true);
        
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const targetMonthsIndices = new Set(schoolYearMonths.filter(m => selectedMonths.has(m.month)).map(m => m.month));
    
            let availableSlots = availabilityStats.slots.filter(slot => {
                const slotMonth = slot.date.getMonth();
                return targetMonthsIndices.has(slotMonth);
            });
            
            if (availableSlots.length === 0 && bookingCount > 0) {
                 setError(`Impossible de générer des réservations. Aucun créneau n'est disponible avec les filtres actuels.`);
                 setIsGenerating(false);
                 return;
            }

            for (let i = availableSlots.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
            }

            const newBookings: Booking[] = [];
            const createdSlots = new Set<string>();

            for (const { animation, date, time } of availableSlots) {
                if(newBookings.length >= bookingCount) break;

                const dateStr = toYYYYMMDD(date);
                const slotKey = `${dateStr}-${time}`;
                if(createdSlots.has(slotKey)) continue;
                
                const isAfternoonSlot = time === 14 || time === 15;
                const afternoonKey = `${dateStr}-afternoon`;
                if(isAfternoonSlot && createdSlots.has(afternoonKey)) continue;

                const animator = animation.animator;
                const animatorKey = `${dateStr}-${animator}`;
                if (animator && animator.trim() !== '' && createdSlots.has(animatorKey)) continue;


                const newBookingData = generateFakeBookingData(animation, date, time);
                newBookings.push({
                    ...newBookingData,
                    id: `${Date.now()}-${Math.random()}`,
                });
                
                createdSlots.add(slotKey);
                if(isAfternoonSlot) {
                    createdSlots.add(afternoonKey);
                }
                if (animator && animator.trim() !== '') {
                    createdSlots.add(animatorKey);
                }
            }

            if (newBookings.length < bookingCount) {
                setError(`A pu générer seulement ${newBookings.length} sur les ${bookingCount} demandées en raison de conflits de créneaux.`);
            }
            
            onGenerate(newBookings);

        } catch (e) {
            console.error("Failed to generate bookings", e);
            setError("Une erreur est survenue lors de la génération.");
        } finally {
            setIsGenerating(false);
        }
    };
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-3xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Générer des réservations aléatoires</h2>

                <div className="p-4 border rounded-lg bg-gray-50 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Disponibilité des créneaux</h3>
                    {schoolYearMonths.length > 0 ? (
                        <>
                            <p className="text-gray-600 mb-4">
                                Pour l'année {settings.activeYear} (mois restants): <strong className="text-xl text-indigo-600">{availabilityStats.total}</strong> créneaux disponibles.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                {schoolYearMonths.map(({ month, name, year }) => {
                                    const key = `${year}-${month}`;
                                    const count = availabilityStats.byMonth[key] || 0;
                                    return (
                                        <div key={key} className="flex justify-between items-center border-b pb-1">
                                            <span className="text-gray-700">{name}</span>
                                            <strong className="font-semibold text-gray-900">{count}</strong>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-red-500 italic">Aucun mois restant pour l'année scolaire sélectionnée ({settings.activeYear}).</p>
                    )}
                </div>

                {schoolYearMonths.length > 0 && (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="bookingCount" className="block text-sm font-medium text-gray-700 mb-1">Nombre de réservations à générer</label>
                            <input
                                id="bookingCount"
                                type="number"
                                value={bookingCount}
                                onChange={(e) => setBookingCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1 w-full max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-sm text-gray-500">Période de génération</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={generateAllYear}
                                    onChange={(e) => setGenerateAllYear(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-medium text-gray-700">Générer sur tous les mois restants de l'année scolaire ({settings.activeYear})</span>
                            </label>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-8">
                                {schoolYearMonths.map(({month, name}) => (
                                    <label key={month} className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${generateAllYear ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer hover:bg-gray-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedMonths.has(month)}
                                            onChange={() => handleMonthToggle(month)}
                                            disabled={generateAllYear}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <span>{name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
                
                <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                    <button type="button" onClick={onClose} disabled={isGenerating} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-60">Annuler</button>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedMonths.size === 0 || schoolYearMonths.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                    >
                        {isGenerating ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Générer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RandomBookingGenerator;
