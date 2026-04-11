
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../App';
import { Animation, Holiday, Booking, AnimatorSettings } from '../../types';
import { toYYYYMMDD } from '../../utils/date';

const BookingCalendar: React.FC<{ animation: Animation, onBookSlot: (date: Date, time: number) => void }> = ({ animation, onBookSlot }) => {
    const { bookings, settings, animations } = useContext(AppContext);
    
    const animatorSettings = useMemo<AnimatorSettings>(() => {
        if (!animation.animator) {
            return { unavailableDates: [], inactiveSlots: [] };
        }
        return settings.animatorSettings?.[animation.animator] || { unavailableDates: [], inactiveSlots: [] };
    }, [animation.animator, settings.animatorSettings]);

    const [startYear, endYear] = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
            return [2025, 2026];
        }
        return [years[0], years[1]];
    }, [settings.activeYear]);

    const getInitialDate = () => {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();

        const isInActiveRange = 
            (todayYear === startYear && todayMonth >= 9) || 
            (todayYear === endYear && todayMonth <= 5);

        if (isInActiveRange) return today;
        return new Date(startYear, 9, 1);
    };

    const [currentDate, setCurrentDate] = useState(getInitialDate());

    useEffect(() => {
        setCurrentDate(getInitialDate());
    }, [startYear, endYear]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(1);
        newDate.setMonth(currentDate.getMonth() + offset);
        
        if (newDate.getFullYear() === startYear && newDate.getMonth() < 9) return;
        if (newDate.getFullYear() === endYear && newDate.getMonth() > 5) return;
        if (newDate.getFullYear() < startYear || newDate.getFullYear() > endYear) return;

        setCurrentDate(newDate);
    };

    const isDateInHoliday = (date: Date, holidays: Holiday[]): boolean => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return holidays.some(h => {
            const startDate = new Date(h.startDate.replace(/-/g, '/'));
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(h.endDate.replace(/-/g, '/'));
            endDate.setHours(0, 0, 0, 0);
            return checkDate >= startDate && checkDate <= endDate;
        });
    };

    const animationAnimatorMap = useMemo(() => {
        return animations.reduce((acc, anim) => {
            if (anim.animator) acc[anim.id] = anim.animator;
            return acc;
        }, {} as Record<string, string>);
    }, [animations]);

    const bookingsByDate = useMemo(() => {
        return bookings.reduce((acc, booking) => {
            if (!acc[booking.date]) acc[booking.date] = [];
            acc[booking.date].push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
    }, [bookings]);

    const isSlotAvailable = (date: Date, time: number): boolean => {
        const dateString = toYYYYMMDD(date);
        const dayBookings = bookingsByDate[dateString] || [];
        
        if (animatorSettings.inactiveSlots.includes(time)) return false;
        if (dayBookings.some(b => b.time === time)) return false;

        const isAfternoonSlot = time === 14 || time === 15;
        if (isAfternoonSlot && dayBookings.some(b => b.time === 14 || b.time === 15)) {
            return false;
        }

        const currentAnimator = animation.animator;
        if (currentAnimator && currentAnimator.trim() !== '') {
            const animatorHasBookingOnDate = dayBookings.some(booking => {
                const bookingAnimator = animationAnimatorMap[booking.animationId];
                return bookingAnimator === currentAnimator;
            });
            if (animatorHasBookingOnDate) return false;
        }

        return true;
    };

    // Génération des jours d'ouverture pour le mois en cours
    const availableDaysInMonth = useMemo(() => {
        const days = [];
        const lastDay = new Date(year, month + 1, 0).getDate();
        const allowedWeekDays = settings.allowedDays || [2, 4];
        const leadTime = settings.bookingLeadTime !== undefined ? settings.bookingLeadTime : 14;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minLeadDate = new Date(today);
        minLeadDate.setDate(today.getDate() + leadTime);

        for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month, d);
            if (allowedWeekDays.includes(date.getDay())) {
                const isHoliday = isDateInHoliday(date, settings.holidays);
                
                // On ne pousse pas le jour s'il s'agit de vacances
                if (isHoliday) continue;

                const isTooSoon = date < minLeadDate;
                const isAnimatorUnavailable = animatorSettings.unavailableDates.includes(toYYYYMMDD(date));
                
                days.push({
                    date,
                    isTooSoon,
                    isAnimatorUnavailable,
                    dateString: toYYYYMMDD(date),
                    fullDateLabel: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                });
            }
        }
        return days;
    }, [year, month, settings.allowedDays, settings.bookingLeadTime, settings.holidays, animatorSettings.unavailableDates]);

    const timeSlots = settings.availableTimeSlots || [9, 10, 14, 15];

    return (
        <div className="max-w-7xl mx-auto px-4 pb-12">
            {/* Sélecteur de mois plus compact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
                <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-blue-600 disabled:opacity-20"
                    disabled={year === startYear && month === 9}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">
                        {monthNames[month]} <span className="text-blue-600">{year}</span>
                    </h2>
                </div>
                <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-blue-600 disabled:opacity-20"
                    disabled={year === endYear && month === 5}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* Liste des jours optimisée : 3 colonnes sur desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDaysInMonth.length > 0 ? (
                    availableDaysInMonth.map((dayObj) => {
                        const isDayBlocked = dayObj.isTooSoon || dayObj.isAnimatorUnavailable;
                        
                        return (
                            <div 
                                key={dayObj.dateString}
                                className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden h-full flex flex-col ${
                                    isDayBlocked ? 'border-gray-100 opacity-80' : 'border-blue-100 hover:shadow-md'
                                }`}
                            >
                                <div className={`p-4 flex flex-col flex-grow ${isDayBlocked ? 'bg-gray-50/50' : 'bg-white'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center font-black flex-shrink-0 ${
                                            isDayBlocked ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white shadow-sm'
                                        }`}>
                                            <span className="text-[9px] leading-none mb-0.5 uppercase">{dayObj.date.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                            <span className="text-lg leading-none">{dayObj.date.getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={`text-sm font-bold capitalize truncate ${isDayBlocked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                {dayObj.fullDateLabel}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        {timeSlots.map(time => {
                                            const available = !isDayBlocked && isSlotAvailable(dayObj.date, time);
                                            return (
                                                <button
                                                    key={time}
                                                    disabled={!available}
                                                    onClick={() => onBookSlot(dayObj.date, time)}
                                                    className={`px-2 py-2 rounded-lg font-bold text-xs transition-all transform active:scale-95 border ${
                                                        available 
                                                        ? 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white' 
                                                        : 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100'
                                                    }`}
                                                >
                                                    {available ? `${time}h00` : 'Complet'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Aucun créneau ce mois-ci</h3>
                        <p className="text-gray-400 mt-2 max-w-sm mx-auto text-sm font-medium">
                            Les réservations pour cette période sont complètes ou non autorisées.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingCalendar;
