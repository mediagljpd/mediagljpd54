
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { View } from '../../types';

interface CookieBannerProps {
  onNavigate: (view: View) => void;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Respect de votre vie privée</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ce site utilise uniquement des cookies nécessaires à son bon fonctionnement (gestion des réservations et sécurité). 
                  Aucun cookie publicitaire n'est utilisé.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 pt-2">
              <button 
                onClick={() => onNavigate(View.COOKIES_POLICY)}
                className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
              >
                En savoir plus
              </button>
              <button 
                onClick={handleAccept}
                className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
