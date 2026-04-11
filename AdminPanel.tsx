
import React, { useState } from 'react';
import { Booking, Animation } from '../../types';
import { formatPhoneNumber } from '../../utils/formatters';

const BookingEditForm: React.FC<{
    booking: Booking;
    animations: Animation[];
    bookings: Booking[];
    onSave: (booking: Booking) => void;
    onCancel: () => void;
}> = ({ booking, animations, bookings, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Booking>({
        ...booking, 
        email: booking.email || '',
        noBusRequired: booking.noBusRequired || false,
        busCost: booking.busCost || 0,
        busStatus: booking.busStatus || 'pending'
    });
    const timeSlots = [9, 10, 14, 15];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;
        if (type === 'number') {
            finalValue = value === '' ? 0 : parseInt(value, 10);
        } else if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'time') {
            finalValue = parseInt(value, 10);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation conflits... (conservée)
        const slotConflict = bookings.find(b => 
            b.id !== formData.id && 
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
            const afternoonConflict = bookings.find(b => 
                b.id !== formData.id && 
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Modifier la réservation</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Infos de base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Animation</label>
                            <select name="animationId" value={formData.animationId} onChange={handleAnimationChange} className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold">
                                {animations.map(anim => <option key={anim.id} value={anim.id}>{anim.title}</option>)}
                            </select>
                        </div>
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
                           <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                             <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Heure</label>
                             <select name="time" value={formData.time} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold">
                                {timeSlots.map(slot => <option key={slot} value={slot}>{slot}h00</option>)}
                             </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Enseignant</label>
                            <input type="text" name="teacherName" value={formData.teacherName} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Niveau</label>
                            <input type="text" name="classLevel" value={formData.classLevel} onChange={handleChange} required className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold"/>
                        </div>
                    </div>

                    {/* Section Bus Admin */}
                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl space-y-4">
                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Administration du transport</h4>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="noBusRequired" checked={formData.noBusRequired} onChange={handleChange} className="w-4 h-4 rounded text-blue-600"/>
                                <span className="text-sm font-bold text-blue-800 italic">Pas de bus nécessaire</span>
                            </label>
                        </div>
                        {!formData.noBusRequired && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Statut prise en charge</label>
                                    <select name="busStatus" value={formData.busStatus} onChange={handleChange} className="w-full p-2.5 bg-white border border-blue-200 rounded-xl font-bold text-blue-900">
                                        <option value="pending">En attente</option>
                                        <option value="validated">Validé</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Coût (€)</label>
                                    <input type="number" name="busCost" value={formData.busCost} onChange={handleChange} className="w-full p-2.5 bg-white border border-blue-200 rounded-xl font-bold text-blue-900"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Infos de passage</label>
                                    <textarea name="busInfo" value={formData.busInfo} onChange={handleChange} className="w-full p-2.5 bg-white border border-blue-200 rounded-xl font-medium h-20"/>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Annuler</button>
                        <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-100 transform active:scale-95 transition-all">Sauvegarder</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingEditForm;
