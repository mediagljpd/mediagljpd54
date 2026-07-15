
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { Animation, View, Booking, CustomLegalPage } from '../types';
import AdminLogin from './AdminLogin';
import AppFooter from './shared/AppFooter';
import AnimationSelection from './booking/AnimationSelection';
import BookingCalendar from './booking/BookingCalendar';
import BookingForm from './booking/BookingForm';
import BookingConfirmation from './booking/BookingConfirmation';
import { formatPhoneNumber } from '../utils/formatters';
import { emailService } from '../services/emailService';

import LegalPage from './shared/LegalPage';
import CookieBanner from './shared/CookieBanner';

interface BookingSystemProps {
  view: View;
  selectedAnimation: Animation | null;
  onSelectAnimation: (animation: Animation) => void;
  onBackToHome: () => void;
  onNavigate: (view: View) => void;
  onNavigateToAdmin: () => void;
  onAdminLogin: () => void;
  selectedInfoPage: CustomLegalPage | null;
  onSelectInfoPage: (page: CustomLegalPage) => void;
}

const BookingSystem: React.FC<BookingSystemProps> = ({ 
  view, 
  selectedAnimation, 
  onSelectAnimation, 
  onBackToHome, 
  onNavigate,
  onNavigateToAdmin, 
  onAdminLogin,
  selectedInfoPage,
  onSelectInfoPage,
}) => {
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
    
    // On transmet l'animateur pour le contrôle de concurrence atomique Firestore
    await saveBooking(newBooking, selectedAnimation.animator);
    
    // Envoi des e-mails en arrière-plan
    emailService.sendBookingConfirmation(newBooking, settings);
    
    if (selectedAnimation.animator) {
        const animator = settings.animators.find(a => 
            a.name.trim().toLowerCase() === selectedAnimation.animator?.trim().toLowerCase()
        );
        if (animator && animator.email) {
            emailService.sendAnimatorNotification(newBooking, animator, settings);
        }
    }

    setBookingDetails(null);
    setConfirmedBooking(newBooking);
  };
  
  const handleCloseConfirmation = () => {
    setConfirmedBooking(null);
    onBackToHome();
  };

  const renderContent = () => {
    if (view === View.ADMIN_LOGIN) {
      return <AdminLogin settings={settings} onLoginSuccess={onAdminLogin} onBackToHome={onBackToHome} />;
    }

    if (view === View.LEGAL_NOTICE) {
      return <LegalPage title={settings.legalNoticeTitle || "Mentions Légales"} content={settings.legalNotice || ''} onBack={onBackToHome} />;
    }

    if (view === View.PRIVACY_POLICY) {
      return <LegalPage title={settings.privacyPolicyTitle || "Politique de Confidentialité"} content={settings.privacyPolicy || ''} onBack={onBackToHome} />;
    }

    if (view === View.COOKIES_POLICY) {
      return <LegalPage title={settings.cookiesPolicyTitle || "Gestion des Cookies"} content={settings.cookiesPolicy || ''} onBack={onBackToHome} />;
    }

    if (view === View.INFO_PAGE && selectedInfoPage) {
      return <LegalPage title={selectedInfoPage.title} content={selectedInfoPage.content} onBack={onBackToHome} hideTitle={selectedInfoPage.hideTitle} />;
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
                      className="p-6 rounded-lg w-full border flex flex-col md:flex-row gap-6 md:items-center relative overflow-hidden"
                      style={{ 
                          backgroundColor: selectedAnimation.color, 
                          color: fontColor,
                          borderColor: borderColor
                      }}
                  >
                      {selectedAnimation.imageUrl && (
                          <div className="absolute -right-4 -top-4 opacity-20 pointer-events-none">
                              <img src={selectedAnimation.imageUrl} alt="" className="w-48 h-48 object-cover rounded-full rotate-12" />
                          </div>
                      )}
                      
                      <div className="md:w-1/2 md:border-r md:pr-10 z-10" style={{ borderColor: borderColor }}>
                          <h1 className="text-3xl font-bold leading-tight flex items-center gap-4">
                              {selectedAnimation.imageUrl && (
                                  <div className="w-16 h-16 rounded-xl border-2 border-white/50 shadow-lg overflow-hidden flex-shrink-0">
                                      <img src={selectedAnimation.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                              )}
                              {selectedAnimation.title}
                          </h1>
                          <p className="opacity-90 mt-2 text-lg font-semibold">{selectedAnimation.classLevel}</p>
                      </div>
                      
                      {selectedAnimation.description && (
                          <div className="md:w-1/2 md:pl-4 z-10">
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
              {confirmedBooking && <BookingConfirmation booking={confirmedBooking} onOk={handleCloseConfirmation} settings={settings} />}
          </div>
          <AppFooter onNavigate={onNavigate} />
        </div>
      );
    }

    return (
       <div style={{ backgroundColor: settings.homepageBgColor }} className="min-h-screen flex flex-col">
          <AnimationSelection 
            onSelectAnimation={onSelectAnimation} 
            onNavigateToAdmin={onNavigateToAdmin}
            onNavigateToInfoPage={(id) => {
              const page = (settings.infoPages || []).find(p => p.id === id);
              if (page) {
                  onSelectInfoPage(page);
                  onNavigate(View.INFO_PAGE);
              }
            }}
          />
          <AppFooter onNavigate={onNavigate} />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {view !== View.ADMIN_LOGIN && <CookieBanner onNavigate={onNavigate} />}
    </>
  );
};

export default BookingSystem;
