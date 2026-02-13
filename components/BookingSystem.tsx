
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Animation, View, Booking } from '../types';
import AdminLogin from './AdminLogin';
import AppFooter from './shared/AppFooter';
import AnimationSelection from './booking/AnimationSelection';
import BookingCalendar from './booking/BookingCalendar';
import BookingForm from './booking/BookingForm';
import BookingConfirmation from './booking/BookingConfirmation';
import { formatPhoneNumber } from '../utils/formatters';
import { emailService } from '../services/emailService';

interface BookingSystemProps {
  view: View;
  selectedAnimation: Animation | null;
  onSelectAnimation: (animation: Animation) => void;
  onBackToHome: () => void;
  onNavigateToAdmin: () => void;
  onAdminLogin: () => void;
}

const BookingSystem: React.FC<BookingSystemProps> = ({ view, selectedAnimation, onSelectAnimation, onBackToHome, onNavigateToAdmin, onAdminLogin }) => {
  const { saveBooking, settings } = useContext(AppContext);
  const [bookingDetails, setBookingDetails] = useState<{ date: Date, time: number } | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    emailService.init();
  }, []);

  const handleBookSlot = (date: Date, time: number) => {
    setBookingDetails({ date, time });
  };

  const handleConfirmBooking = async (formData: Omit<Booking, 'id' | 'animationTitle'>) => {
    if (!selectedAnimation) return;

    const formattedFormData = {
        ...formData,
        phoneNumber: formatPhoneNumber(formData.phoneNumber),
    };

    const newBooking: Booking = {
        ...formattedFormData,
        id: Date.now().toString(),
        animationTitle: selectedAnimation.title,
    };
    
    try {
        await saveBooking(newBooking);
        
        // Envoi des e-mails en arrière-plan
        // emailService.sendBookingConfirmation(newBooking); // DÉSACTIVÉ TEMPORAIREMENT
        
        if (selectedAnimation.animator) {
            const animator = settings.animators.find(a => a.name === selectedAnimation.animator);
            if (animator && animator.email) {
                emailService.sendAnimatorNotification(newBooking, animator);
            }
        }

        setBookingDetails(null);
        setConfirmedBooking(newBooking);
    } catch (error) {
        alert("Une erreur est survenue lors de la réservation. Veuillez réessayer.");
    }
  };
  
  const handleCloseConfirmation = () => {
    setConfirmedBooking(null);
    onBackToHome();
  };

  if (view === View.ADMIN_LOGIN) {
    return <AdminLogin settings={settings} onLoginSuccess={onAdminLogin} onBackToHome={onBackToHome} />;
  }

  if (view === View.CALENDAR && selectedAnimation) {
    const fontColor = selectedAnimation.fontColor || '#ffffff';
    const borderColor = fontColor.startsWith('#') && fontColor.length === 7 ? `${fontColor}33` : fontColor;

    return (
      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen flex flex-col">
        <div className="flex-grow">
            <header className="max-w-7xl mx-auto mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <button onClick={onBackToHome} className="text-blue-600 hover:underline mb-6 inline-block font-medium">← Retour à la liste</button>
                <div 
                    className="p-6 rounded-lg w-full border flex flex-col md:flex-row gap-6 md:items-center"
                    style={{ 
                        backgroundColor: selectedAnimation.color, 
                        color: fontColor,
                        borderColor: borderColor
                    }}
                >
                    <div className="md:w-1/2 md:border-r md:pr-10" style={{ borderColor: borderColor }}>
                        <h1 className="text-3xl font-bold leading-tight">{selectedAnimation.title}</h1>
                        <p className="opacity-90 mt-2 text-lg font-semibold">{selectedAnimation.classLevel}</p>
                    </div>
                    
                    {selectedAnimation.description && (
                        <div className="md:w-1/2 md:pl-4">
                            <p className="text-lg md:text-xl leading-relaxed opacity-95 italic font-medium">
                                {selectedAnimation.description}
                            </p>
                        </div>
                    )}
                </div>
                <p className="text-gray-600 mt-6 italic font-medium">Sélectionnez une date et un créneau horaire disponibles ci-dessous :</p>
            </header>
            <BookingCalendar animation={selectedAnimation} onBookSlot={handleBookSlot} />
            {bookingDetails && <BookingForm animation={selectedAnimation} date={bookingDetails.date} time={bookingDetails.time} onConfirm={handleConfirmBooking} onCancel={() => setBookingDetails(null)} />}
            {confirmedBooking && <BookingConfirmation booking={confirmedBooking} onOk={handleCloseConfirmation} />}
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
     <div style={{ backgroundColor: settings.homepageBgColor }} className="min-h-screen flex flex-col">
        <AnimationSelection onSelectAnimation={onSelectAnimation} onNavigateToAdmin={onNavigateToAdmin} />
        <AppFooter />
    </div>
  );
};

export default BookingSystem;
