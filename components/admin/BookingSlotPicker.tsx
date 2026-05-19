
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { Animation, Holiday, Booking, AnimatorSettings } from '../../types';
import { toYYYYMMDD } from '../../utils/date';

interface BookingSlotPickerProps {
    animation: Animation;
    selectedDate: string;
    selectedTime: number;
    currentBookingId: string;
    onSelect: (date: string, time: number) => void;
}

const BookingSlotPicker: React.FC<BookingSlotPickerProps> = ({ 
    animation, 
    selectedDate, 
    selectedTime,
    currentBookingId,
    onSelect 
}) => {
    const { bookings, settings, animations } = useContext(AppContext);
    
    const animatorSettings = useMemo<AnimatorSettings>(() => {
        const animName = animation.animator?.trim();
        if (!animName) return { unavailableDates: [], inactiveSlots: [] };
        
        const matchingKey = Object.keys(settings.animatorSettings || {}).find(
            key => key.trim().toLowerCase() === animName.toLowerCase()
        );
        
        return matchingKey ? settings.animatorSettings![matchingKey] : { unavailableDates: [], inactiveSlots: [] };
    }, [animation.animator, settings.animatorSettings]);

    const [startYear, endYear] = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        return years.length === 2 ? [years[0], years[1]] : [2025, 2026];
    }, [settings.activeYear]);

    // Initial date should be the currently selected date of the booking being edited
    const [viewDate, setViewDate] = useState(() => {
        if (selectedDate) return new Date(selectedDate.replace(/-/g, '/'));
        return new Date();
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setDate(1);
        newDate.setMonth(viewDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const isDateInHoliday = (date: Date, holidays: Holiday[]): boolean => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return (holidays || []).some(h => {
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

    // Filtrer les réservations pour exclure celle qu'on est en train de modifier
    const otherBookings = useMemo(() => {
        return bookings.filter(b => b.id !== currentBookingId);
    }, [bookings, currentBookingId]);

    const bookingsByDate = useMemo(() => {
        return otherBookings.reduce((acc, booking) => {
            if (!acc[booking.date]) acc[booking.date] = [];
            acc[booking.date].push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
    }, [otherBookings]);

    const currentMonthBookingCount = useMemo(() => {
        const currentAnimator = animation.animator?.trim().toLowerCase();
        if (!currentAnimator || animatorSettings.monthlyBookingLimit === undefined) return 0;

        return otherBookings.filter(booking => {
            const bookingDate = new Date(booking.date.replace(/-/g, '/'));
            const isSameMonth = bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
            if (!isSameMonth) return false;

            const bookingAnimator = animationAnimatorMap[booking.animationId]?.trim().toLowerCase();
            return bookingAnimator === currentAnimator;
        }).length;
    }, [otherBookings, year, month, animation.animator, animatorSettings.monthlyBookingLimit, animationAnimatorMap]);

    const isLimitReached = useMemo(() => {
        return animatorSettings.monthlyBookingLimit !== undefined && currentMonthBookingCount >= animatorSettings.monthlyBookingLimit;
    }, [animatorSettings.monthlyBookingLimit, currentMonthBookingCount]);

    const isSlotAvailable = (date: Date, time: number): boolean => {
        const dateString = toYYYYMMDD(date);
        
        // Si c'est le créneau ACTUELLEMENT sélectionné dans le formulaire (même s'il n'est pas encore sauvegardé),
        // on l'affiche comme sélectionné, pas comme indisponible de base.
        if (dateString === selectedDate && time === selectedTime) return true;

        // Ne pas proposer de créneaux pour des dates déjà dépassées
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return false;

        if (isLimitReached) return false;
        
        const dayBookings = bookingsByDate[dateString] || [];
        
        if ((animatorSettings.inactiveSlots || []).some(s => Number(s) === Number(time))) return false;
        if (dayBookings.some(b => Number(b.time) === Number(time))) return false;

        const timeVal = Number(time);
        const isAfternoonSlot = timeVal === 14 || timeVal === 15;
        if (isAfternoonSlot && dayBookings.some(b => Number(b.time) === 14 || Number(b.time) === 15)) {
            return false;
        }

        const currentAnimator = animation.animator?.trim().toLowerCase();
        if (currentAnimator && currentAnimator !== '') {
            const animatorHasBookingOnDate = dayBookings.some(booking => {
                const bookingAnimator = animationAnimatorMap[booking.animationId]?.trim().toLowerCase();
                return bookingAnimator === currentAnimator;
            });
            if (animatorHasBookingOnDate) return false;
        }

        return true;
    };

    const daysInMonth = useMemo(() => {
        const days = [];
        const lastDay = new Date(year, month + 1, 0).getDate();
        const allowedWeekDays = settings.allowedDays || [2, 4];
        
        // Pour les admins, on ignore peut-être le lead time ?
        // Mais "modèle enseignant" suggère de l'afficher. On va quand même le garder mais peut-être visuellement distinct.
        const leadTime = settings.bookingLeadTime !== undefined ? settings.bookingLeadTime : 14;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minLeadDate = new Date(today);
        minLeadDate.setDate(today.getDate() + leadTime);

        for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month, d);
            const dateString = toYYYYMMDD(date);
            const isAllowedDay = allowedWeekDays.includes(date.getDay());
            const isHoliday = isDateInHoliday(date, settings.holidays);
            const isPast = date < today;
            const isTooSoon = date < minLeadDate;
            const isAnimatorUnavailable = animatorSettings.unavailableDates.includes(dateString);

            // On permet la date si elle est sélectionnée (pour voir où elle est) 
            // OU si elle n'est pas dépassée
            const isSelectable = isAllowedDay && !isHoliday && !isAnimatorUnavailable && (!isPast || dateString === selectedDate);

            days.push({
                date,
                dateString,
                isAllowedDay,
                isHoliday,
                isPast,
                isTooSoon,
                isAnimatorUnavailable,
                isSelectable
            });
        }
        return days;
    }, [year, month, settings.allowedDays, settings.bookingLeadTime, settings.holidays, animatorSettings.unavailableDates]);

    const timeSlots = settings.availableTimeSlots || [9, 10, 14, 15];

    return (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Choisir Date & Horaire</h3>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-xs font-black text-gray-700 uppercase min-w-[100px] text-center">
                        {monthNames[month]} {year}
                    </span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {daysInMonth.filter(d => d.isSelectable).map(day => (
                    <div key={day.dateString} className="bg-white rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex flex-col items-center justify-center text-blue-700">
                                <span className="text-[7px] font-black leading-none uppercase">{day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                <span className="text-xs font-black leading-none">{day.date.getDate()}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-700 capitalize">
                                {day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {timeSlots.map(time => {
                                const available = isSlotAvailable(day.date, time);
                                const isSelected = day.dateString === selectedDate && time === selectedTime;
                                
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        disabled={!available && !isSelected}
                                        onClick={() => onSelect(day.dateString, time)}
                                        className={`py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                                            isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : available
                                            ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                                            : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        {time}h
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {daysInMonth.filter(d => d.isSelectable).length === 0 && (
                   <div className="text-center py-8">
                       <p className="text-xs font-bold text-gray-400">Aucun créneau autorisé ce mois-ci</p>
                   </div>
                )}
            </div>
            
            <div className="mt-4 flex items-center gap-2 justify-center">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Sélectionné</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-200"></span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Disponible</span>
                </div>
            </div>
        </div>
    );
};

export default BookingSlotPicker;
