
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Booking, Animation } from '../../types';
import { AppContext } from '../../App';
import { toYYYYMMDD } from '../../utils/date';

const BookingsCalendar: React.FC<{ bookings: Booking[]; animations: Animation[]; onEdit: (booking: Booking) => void }> = ({ bookings, animations, onEdit }) => {
    const { settings } = useContext(AppContext);

    const [startYear, endYear] = useMemo(() => {
        const years = settings.activeYear.split('-').map(Number);
        if (years.length !== 2 || isNaN(years[0]) || isNaN(years[1])) {
            const currentYear = new Date().getFullYear();
            return [currentYear, currentYear + 1]; // Fallback
        }
        return [years[0], years[1]];
    }, [settings.activeYear]);
    
    const getInitialDate = () => {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();

        if (
            (todayYear === startYear && todayMonth >= 9) || 
            (todayYear === endYear && todayMonth <= 5)
        ) {
            return today;
        }
        return new Date(startYear, 9, 1);
    };

    const [currentDate, setCurrentDate] = useState(getInitialDate);

    useEffect(() => {
        setCurrentDate(getInitialDate());
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startYear, endYear]);

    const animationColorMap = useMemo(() => {
        return animations.reduce((acc, anim) => {
            acc[anim.id] = { bg: anim.color, text: anim.fontColor };
            return acc;
        }, {} as Record<string, { bg: string, text: string }>);
    }, [animations]);

    const bookingsByDate = useMemo(() => {
        return bookings.reduce((acc, booking) => {
            const date = booking.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
    }, [bookings]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startingDay = (firstDayOfMonth === 0 || firstDayOfMonth === 1) ? 0 : firstDayOfMonth - 2;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(1); 
        newDate.setMonth(currentDate.getMonth() + offset);

        if (newDate.getFullYear() === startYear && newDate.getMonth() < 9) return;
        if (newDate.getFullYear() === endYear && newDate.getMonth() > 5) return;
        if (newDate.getFullYear() < startYear || newDate.getFullYear() > endYear) return;

        setCurrentDate(newDate);
    };
    
    const todayStr = toYYYYMMDD(new Date());

    return (
        <div className="bg-white rounded-xl shadow border border-gray-200">
            {/* Header section */}
            <div className="bg-white z-20 p-4 border-b rounded-t-xl">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => changeMonth(-1)} 
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{monthNames[month]} {year}</h3>
                    </div>
                    <button 
                        onClick={() => changeMonth(1)} 
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                
                <div className="grid grid-cols-5 text-center font-bold text-gray-400 uppercase text-xs tracking-widest">
                    {['Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => 
                        <div key={day} className="pb-2">{day}</div>
                    )}
                </div>
            </div>

            <div className="bg-gray-100">
                <div className="grid grid-cols-5 gap-px">
                    {Array.from({ length: startingDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50/50 min-h-[140px]"></div>
                    ))}
                    
                    {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                        const day = dayIndex + 1;
                        const date = new Date(year, month, day);
                        const dow = date.getDay();
                        
                        if (dow === 0 || dow === 1) return null;

                        const dateStr = toYYYYMMDD(date);
                        const dayBookings = (bookingsByDate[dateStr] || []).sort((a,b) => a.time - b.time);
                        const isToday = dateStr === todayStr;

                        return (
                            <div 
                                key={day} 
                                className={`p-2 flex flex-col relative min-h-[140px] group transition-colors ${
                                    isToday ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'
                                }`}
                            >
                                <span className={`text-sm font-bold self-end px-2 py-1 rounded-full ${
                                    isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'
                                }`}>
                                    {day}
                                </span>
                                
                                <div className="space-y-2 mt-2">
                                    {dayBookings.map(booking => {
                                        const colors = animationColorMap[booking.animationId] || { bg: '#E5E7EB', text: '#111827' };
                                        return (
                                            <div 
                                                key={booking.id}
                                                onClick={() => onEdit(booking)}
                                                className="p-2.5 rounded-lg text-[12px] leading-snug cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all shadow-sm border border-black/5"
                                                style={{ backgroundColor: colors.bg, color: colors.text }}
                                                title={`${booking.animationTitle} - ${booking.teacherName} (${booking.classLevel})`}
                                            >
                                                <p className="font-bold tracking-normal truncate mb-0.5">
                                                    {booking.time}h • {booking.animationTitle}
                                                </p>
                                                <p className="truncate opacity-90 font-medium">
                                                    {booking.teacherName} ({booking.classLevel})
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {Array.from({ length: (5 - ((startingDay + daysInMonth - (Array.from({ length: daysInMonth }).filter((_, i) => {
                         const d = new Date(year, month, i+1).getDay();
                         return d === 0 || d === 1;
                    }).length)) % 5)) % 5 }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="bg-gray-50/50 min-h-[140px]"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookingsCalendar;
