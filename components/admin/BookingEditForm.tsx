
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Booking, Animation } from '../../types';
import { formatPhoneNumber } from '../../utils/formatters';
import { AppContext } from '../../AppContext';
import BookingSlotPicker from './BookingSlotPicker';

const BookingEditForm: React.FC<{
    booking: Booking;
    animations: Animation[];
    bookings: Booking[];
    onSave: (booking: Booking) => void;
    onCancel: () => void;
}> = ({ booking, animations, bookings, onSave, onCancel }) => {
    const { currentUser, settings } = useContext(AppContext);
    
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    const isAdmin = currentUser?.role === 'admin';
    const [showSlotPicker, setShowSlotPicker] = useState(false);
    const [formData, setFormData] = useState<Booking>({
        ...booking, 
        email: booking.email || '',
        noBusRequired: booking.noBusRequired || false,
        busCost: booking.busCost || 0,
        busStatus: booking.busStatus || 'pending'
    });

    const currentAnimation = useMemo(() => {
        return animations.find(a => a.id === formData.animationId) || animations[0];
    }, [animations, formData.animationId]);

    const animationAnimatorMap = useMemo(() => {
        return animations.reduce((acc, anim) => {
            if (anim.animator) acc[anim.id] = anim.animator;
            return acc;
        }, {} as Record<string, string>);
    }, [animations]);

    const animatorSettings = useMemo(() => {
        const animName = currentAnimation?.animator?.trim();
        if (!animName) return { unavailableDates: [], inactiveSlots: [] };
        
        const matchingKey = Object.keys(settings.animatorSettings || {}).find(
            key => key.trim().toLowerCase() === animName.toLowerCase()
        );
        
        return matchingKey ? settings.animatorSettings![matchingKey] : { unavailableDates: [], inactiveSlots: [] };
    }, [currentAnimation, settings.animatorSettings]);

    const animatorAvailability = useMemo(() => {
        const animatorName = currentAnimation?.animator?.trim();
        if (!animatorName) {
            return { available: true, reason: "" };
        }

        const dateString = formData.date;
        const timeVal = formData.time;

        // 1. Check if the date is marked as unavailable for this animator
        if ((animatorSettings.unavailableDates || []).includes(dateString)) {
            return { available: false, reason: "L'animateur est marqué comme indisponible à cette date." };
        }

        // 2. Check if the slot (time) is inactive for this animator
        if ((animatorSettings.inactiveSlots || []).some(s => Number(s) === Number(timeVal))) {
            return { available: false, reason: `Le créneau de ${timeVal}h est désactivé pour cet animateur.` };
        }

        // 3. Check if the animator has another booking on that date (excluding this booking itself)
        const otherBookings = bookings.filter(b => b.id !== formData.id);
        const animatorHasBookingOnDate = otherBookings.find(booking => {
            if (booking.date !== dateString) return false;
            const bookingAnimator = animationAnimatorMap[booking.animationId]?.trim().toLowerCase();
            return bookingAnimator === animatorName.toLowerCase();
        });

        if (animatorHasBookingOnDate) {
            return { 
                available: false, 
                reason: `L'animateur a déjà une autre animation ce jour-là ("${animatorHasBookingOnDate.animationTitle}" à ${animatorHasBookingOnDate.time}h).` 
            };
        }

        // 4. Check monthly bookings limit for this animator
        if (animatorSettings.monthlyBookingLimit !== undefined) {
            const bookingDate = new Date(dateString.replace(/-/g, '/'));
            const bYear = bookingDate.getFullYear();
            const bMonth = bookingDate.getMonth();

            const currentMonthBookingCount = otherBookings.filter(booking => {
                const bD = new Date(booking.date.replace(/-/g, '/'));
                const isSameMonth = bD.getFullYear() === bYear && bD.getMonth() === bMonth;
                if (!isSameMonth) return false;

                const bookingAnimator = animationAnimatorMap[booking.animationId]?.trim().toLowerCase();
                return bookingAnimator === animatorName.toLowerCase();
            }).length;

            if (currentMonthBookingCount >= animatorSettings.monthlyBookingLimit) {
                return { 
                    available: false, 
                    reason: `L'animateur a atteint sa limite mensuelle de réservations (${animatorSettings.monthlyBookingLimit}) pour ce mois.` 
                };
            }
        }

        return { available: true, reason: "" };
    }, [currentAnimation, formData.date, formData.time, formData.id, animatorSettings, bookings, animationAnimatorMap]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;
        if (type === 'number') {
            finalValue = value === '' ? 0 : parseInt(value, 10);
        } else if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleAnimationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAnimationId = e.target.value;
        const selectedAnimation = animations.find(a => a.id === newAnimationId);
        if (selectedAnimation) {
            setFormData(prev => ({
                ...prev,
                animationId: newAnimationId,
                animationTitle: selectedAnimation.title,
            }));
        }
    };

    const handleSlotSelect = (date: string, time: number) => {
        setFormData(prev => ({
            ...prev,
            date,
            time
        }));
        setShowSlotPicker(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!animatorAvailability.available) {
            alert(`Impossible de sauvegarder : ${animatorAvailability.reason}`);
            return;
        }

        // Final sanity check for conflicts in case multi-user environment
        const otherBookings = bookings.filter(b => b.id !== formData.id);
        
        const slotConflict = otherBookings.find(b => 
            b.date === formData.date && 
            b.time === formData.time
        );

        if (slotConflict) {
            alert(`Conflit de créneau : L'heure de ${formData.time}h est déjà réservée pour l'animation "${slotConflict.animationTitle}".`);
            return;
        }

        const isAfternoon = formData.time === 14 || formData.time === 15;
        if (isAfternoon) {
            const otherTime = formData.time === 14 ? 15 : 14;
            const afternoonConflict = otherBookings.find(b => 
                b.date === formData.date && 
                b.time === otherTime
            );
            if (afternoonConflict) {
                alert(`Conflit d'après-midi : Le créneau de ${otherTime}h est déjà occupé par "${afternoonConflict.animationTitle}". Un seul atelier est possible par après-midi.`);
                return;
            }
        }

        const formattedBooking = {
            ...formData,
            phoneNumber: formatPhoneNumber(formData.phoneNumber)
        };
        onSave(formattedBooking);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Modifier la réservation</h2>
                    <button type="button" onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Animation Selection */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Animation</label>
                        <select 
                            name="animationId" 
                            value={formData.animationId} 
                            onChange={handleAnimationChange} 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                            {animations.map(anim => <option key={anim.id} value={anim.id}>{anim.title}</option>)}
                        </select>

                        {/* Animator & Availability Status */}
                        <div className="mt-2.5 text-xs">
                            {currentAnimation?.animator ? (
                                <div className={`flex flex-col gap-1 p-3.5 rounded-2xl border transition-all ${
                                    animatorAvailability.available 
                                    ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800' 
                                    : 'bg-rose-50/40 border-rose-100 text-rose-800'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">
                                            Animateur : <span className="underline decoration-dotted">{currentAnimation.animator}</span>
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            animatorAvailability.available 
                                            ? 'bg-emerald-100/80 text-emerald-700' 
                                            : 'bg-rose-100/80 text-rose-700'
                                        }`}>
                                            {animatorAvailability.available ? '✓ Disponible' : '✗ Indisponible'}
                                        </span>
                                    </div>
                                    {!animatorAvailability.available && (
                                        <p className="text-[11px] font-semibold mt-1 text-rose-700 font-sans tracking-wide leading-relaxed">
                                            ⚠️ {animatorAvailability.reason}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-2xl border border-gray-150 bg-gray-50 text-gray-500 italic">
                                    Aucun animateur assigné à cette animation.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Slot Display & Trigger */}
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-indigo-600 border border-indigo-100">
                                    <span className="text-[10px] font-black leading-none uppercase">{new Date(formData.date.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                    <span className="text-lg font-black leading-none">{new Date(formData.date.replace(/-/g, '/')).getDate()}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Créneau sélectionné</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-gray-700 capitalize">
                                            {new Date(formData.date.replace(/-/g, '/')).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </span>
                                        <span className="text-lg font-black text-indigo-700">à {formData.time}h00</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => setShowSlotPicker(true)}
                                className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-wider border border-indigo-200 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
                            >
                                Changer la date
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Enseignant</label>
                            <input type="text" name="teacherName" value={formData.teacherName} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Commune</label>
                            <input type="text" name="commune" value={formData.commune} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold" placeholder="ex: MEXY (54135)"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">École</label>
                            <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Niveau</label>
                            <input type="text" name="classLevel" value={formData.classLevel} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email Enseignant</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone Enseignant</label>
                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nombre d'élèves</label>
                            <input type="number" name="studentCount" value={formData.studentCount} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nombre d'adultes</label>
                            <input type="number" name="adultCount" value={formData.adultCount} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Annuler</button>
                        <button 
                            type="submit" 
                            disabled={!animatorAvailability.available}
                            className={`px-10 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transform active:scale-95 transition-all ${
                                animatorAvailability.available 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none active:scale-100'
                            }`}
                        >
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal de sélection de créneau */}
            {showSlotPicker && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4" onClick={() => setShowSlotPicker(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Modifier le créneau</h3>
                            <button onClick={() => setShowSlotPicker(false)} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <BookingSlotPicker 
                                animation={currentAnimation}
                                selectedDate={formData.date}
                                selectedTime={formData.time}
                                currentBookingId={formData.id}
                                onSelect={handleSlotSelect}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-center">
                            <button 
                                type="button" 
                                onClick={() => setShowSlotPicker(false)}
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                            >
                                Fermer sans changer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingEditForm;
