
import React, { useState } from 'react';
import { Animation, Booking } from '../../types';
import { toYYYYMMDD } from '../../utils/date';

const BookingForm: React.FC<{ animation: Animation, date: Date, time: number, onConfirm: (formData: Omit<Booking, 'id' | 'animationTitle'>) => void, onCancel: () => void }> = ({ animation, date, time, onConfirm, onCancel }) => {
    const [formData, setFormData] = useState({
        animationId: animation.id,
        date: toYYYYMMDD(date),
        time: time,
        teacherName: '',
        classLevel: '',
        commune: '',
        schoolName: '',
        phoneNumber: '',
        email: '',
        studentCount: 25,
        adultCount: 2,
        busInfo: '',
        noBusRequired: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseInt(value) : value);
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Initialisation des statuts bus pour l'admin
        onConfirm({
            ...formData,
            busStatus: formData.noBusRequired ? undefined : 'pending',
            busCost: 0
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onCancel}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Réservation pour "{animation.title}"</h2>
                <p className="mb-6 text-gray-600">Le {date.toLocaleDateString('fr-FR')} à {time}h00</p>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700">Nom de l'enseignant</label>
                        <input id="teacherName" type="text" name="teacherName" placeholder="ex: Jean Dupont" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700">Niveau de la classe</label>
                        <input id="classLevel" type="text" name="classLevel" placeholder="ex: CE2" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="commune" className="block text-sm font-medium text-gray-700">Commune</label>
                        <input id="commune" type="text" name="commune" placeholder="ex: Lille" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">Nom de l'école</label>
                        <input id="schoolName" type="text" name="schoolName" placeholder="ex: École Pasteur" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                        <input
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            placeholder="ex: 0612345678"
                            onChange={handleChange}
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
                        <input id="email" type="email" name="email" placeholder="ex: jean.dupont@academie.fr" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase italic">⚠️ L'envoi automatique du mail de confirmation est désactivé.</p>
                    </div>
                    <div>
                        <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700">Nombre d'élèves</label>
                        <input id="studentCount" type="number" name="studentCount" value={formData.studentCount} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="adultCount" className="block text-sm font-medium text-gray-700">Nombre d'adultes</label>
                        <input id="adultCount" type="number" name="adultCount" value={formData.adultCount} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>

                    {/* Section Bus */}
                    <div className="col-span-2 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                            <input 
                                type="checkbox" 
                                name="noBusRequired" 
                                checked={formData.noBusRequired} 
                                onChange={handleChange}
                                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-blue-300"
                            />
                            <span className="text-sm font-bold text-blue-900">
                                Nous ne souhaitons pas bénéficier de la prise en charge du bus par le Grand Longwy
                            </span>
                        </label>

                        <div className={formData.noBusRequired ? 'opacity-40 grayscale pointer-events-none' : ''}>
                            <label htmlFor="busInfo" className="block text-sm font-bold text-gray-700 mb-1">
                                Informations pour le bus
                            </label>
                            <textarea 
                                id="busInfo" 
                                name="busInfo" 
                                value={formData.busInfo}
                                placeholder="Où et à quelle heure doit passer le bus ? Précisez l'adresse..." 
                                onChange={handleChange} 
                                required={!formData.noBusRequired}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-300 rounded-md font-bold hover:bg-gray-400">Annuler</button>
                        <button type="submit" className="px-8 py-2 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 shadow-md transform active:scale-95 transition-all">Confirmer la réservation</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingForm;
