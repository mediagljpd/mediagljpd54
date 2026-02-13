
import React from 'react';
import { Booking } from '../../types';
import { CheckIcon } from '../Icons';

const BookingConfirmation: React.FC<{ booking: Booking, onOk: () => void }> = ({ booking, onOk }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onOk}>
            <div 
                className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full transform animate-in fade-in zoom-in duration-300" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckIcon className="w-10 h-10" />
                </div>
                
                <h2 className="text-3xl font-extrabold mb-2 text-slate-800">Réservation confirmée !</h2>
                <div className="h-1 w-16 bg-green-500 mx-auto mb-6 rounded-full"></div>
                
                <div className="space-y-3 text-slate-600">
                    <p>Votre demande de réservation pour l'atelier :</p>
                    <p className="font-bold text-slate-900 text-lg px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                        {booking.animationTitle}
                    </p>
                    <p>
                        le <span className="font-semibold text-slate-800">{new Date(booking.date.replace(/-/g, '/')).toLocaleDateString('fr-FR')}</span> à <span className="font-semibold text-slate-800">{booking.time}h00</span> a bien été enregistrée.
                    </p>
                </div>

                <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-sm text-orange-700 font-bold uppercase italic">
                        ⚠️ Note importante :
                    </p>
                    <p className="text-orange-800 text-xs mt-1">
                        L'envoi automatique du mail de confirmation est actuellement désactivé. Veuillez noter ces informations ou faire une capture d'écran.
                    </p>
                </div>

                <button 
                    onClick={onOk} 
                    className="mt-8 w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}

export default BookingConfirmation;
