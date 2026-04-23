import React, { useContext } from 'react';
import { AppContext } from '../../AppContext';
import { View } from '../../types';

interface AppFooterProps {
  onNavigate: (view: View) => void;
}

const AppFooter: React.FC<AppFooterProps> = ({ onNavigate }) => {
  const { settings } = useContext(AppContext);
  const { establishmentInfo, footerLinks } = settings;

  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-12 py-12 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        
        {/* Left Side: Links */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <button 
              onClick={() => onNavigate(View.LEGAL_NOTICE)}
              className="text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Mentions légales
            </button>
            <button 
              onClick={() => onNavigate(View.PRIVACY_POLICY)}
              className="text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Politique de confidentialité
            </button>
            <button 
              onClick={() => onNavigate(View.COOKIES_POLICY)}
              className="text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Cookies
            </button>
            {footerLinks?.map((link) => (
              link.url && (
                <a 
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>
          
          {settings.footerContent && (
            <div className="text-sm text-gray-400 whitespace-pre-wrap mt-2 leading-relaxed">
              {settings.footerContent}
            </div>
          )}
        </div>

        {/* Right Side: Establishment Info & Logo */}
        <div className="flex items-center gap-8">
          {establishmentInfo?.logoUrl && (
            <img 
              src={establishmentInfo.logoUrl} 
              alt="Logo" 
              className="h-24 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          )}
          
          <div className="flex flex-col text-base text-gray-600">
            {establishmentInfo?.name && <span className="font-bold text-gray-900 mb-1.5 text-lg">{establishmentInfo.name}</span>}
            {establishmentInfo?.address && <span className="mb-1">{establishmentInfo.address}</span>}
            {establishmentInfo?.phone && <span className="mb-1">Tél : {establishmentInfo.phone}</span>}
            {establishmentInfo?.email && (
              <a href={`mailto:${establishmentInfo.email}`} className="hover:text-blue-600 transition-colors">
                Email : {establishmentInfo.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
