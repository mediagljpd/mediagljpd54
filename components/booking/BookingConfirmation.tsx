
import React, { useEffect } from 'react';
import { Booking } from '../../types';
import { CheckIcon, XIcon } from '../Icons';

const BookingConfirmation: React.FC<{ booking: Booking, onOk: () => void }> = ({ booking, onOk }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onOk();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onOk]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div 
                className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full transform animate-in fade-in zoom-in duration-300 relative" 
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onOk}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <XIcon className="w-6 h-6" />
                </button>

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

                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-blue-800 text-sm leading-relaxed">
                        Un mail de confirmation a été envoyé à l'adresse ci-dessous, si vous n'avez rien reçu pensez à vérifier votre dossier courrier indésirable : <br/>
                        <span className="font-bold text-blue-950 text-base mt-1 block">{booking.email}</span>
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
