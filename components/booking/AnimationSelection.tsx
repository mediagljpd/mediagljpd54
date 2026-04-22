
import React, { useContext, useState } from 'react';
import { AppContext } from '../../AppContext';
import { Animation } from '../../types';
import { CogIcon, BellIcon, XIcon } from '../Icons';

const AnimationCard: React.FC<{ animation: Animation; onSelect: () => void }> = ({ animation, onSelect }) => {
    const fontColor = animation.fontColor || '#ffffff';
    
    const cardStyle = {
        background: `linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1)), ${animation.color}`,
        color: fontColor
    };

    const getBorderColor = (hex: string) => {
        if (hex.startsWith('#') && hex.length === 7) {
            return `${hex}33`;
        }
        return hex;
    };

    const borderColor = getBorderColor(fontColor);

    return (
        <div
            className="rounded-xl shadow-md overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 flex flex-col p-4 border h-[250px] w-full"
            style={{ ...cardStyle, borderColor: borderColor }}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
            aria-label={`Sélectionner l'animation ${animation.title}`}
        >
            <div className="overflow-hidden flex-grow">
                <div className="mb-2">
                    <h3 className="text-lg font-bold line-clamp-2 leading-tight" title={animation.title}>
                        {animation.title}
                    </h3>
                    <p 
                        className="font-semibold mt-1 text-sm opacity-90 truncate border-b pb-1"
                        style={{ borderColor: borderColor }}
                    >
                        {animation.classLevel}
                    </p>
                </div>

                {animation.description && (
                    <p className="text-sm opacity-85 leading-snug line-clamp-5 mt-2">
                        {animation.description}
                    </p>
                )}
            </div>
            
            <div 
                className="text-right pt-2 border-t mt-2"
                style={{ borderColor: borderColor }}
            >
                <span 
                    className="inline-block bg-black/10 hover:bg-black/20 font-bold py-1.5 px-3 rounded-md transition-colors text-[10px] uppercase tracking-wide border"
                    style={{ borderColor: borderColor }}
                >
                    Réserver →
                </span>
            </div>
        </div>
    );
};

const AnimationSelection: React.FC<{ 
  onSelectAnimation: (animation: Animation) => void; 
  onNavigateToAdmin: () => void;
  onNavigateToInfoPage: (pageId: string) => void;
}> = ({ onSelectAnimation, onNavigateToAdmin, onNavigateToInfoPage }) => {
  const { animations, settings } = useContext(AppContext);
  const [showContact, setShowContact] = useState(false);

  const headerStyle = {
      backgroundColor: settings.headerBgColor || '#ffffff',
  };

  const titleStyle = {
      color: settings.titleColor || '#111827',
  };

  const subtitleStyle = {
      color: settings.subtitleColor || '#4b5563',
  };

  return (
    <>
      <header className="shadow-sm sticky top-0 z-40 w-full backdrop-blur-md bg-opacity-95" style={headerStyle}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between min-h-24 py-4 gap-4">
                  {/* Bouton Contact à Gauche */}
                  <div className="z-10 flex-shrink-0 flex flex-col items-center">
                      <button
                          onClick={() => setShowContact(true)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 text-sm font-black uppercase tracking-wider"
                          aria-label="Nous contacter"
                      >
                          <BellIcon className="w-5 h-5" />
                          <span className="hidden md:inline">Nous contacter</span>
                      </button>
                      {settings.headerInfoText && (
                          <p 
                            className={`mt-1.5 ${settings.headerInfoFontSize || 'text-[10px]'} ${settings.headerInfoFontWeight || 'font-normal'} ${settings.headerInfoFontStyle === 'italic' ? 'italic' : 'normal'} text-center leading-tight animate-in fade-in slide-in-from-top-1 duration-500`}
                            style={{ 
                                color: settings.headerInfoColor || '#6b7280',
                                maxWidth: `${settings.headerInfoWidth || 200}px` 
                            }}
                          >
                              {settings.headerInfoText}
                          </p>
                      )}
                  </div>

                  <div className="flex-1 min-w-0 text-center">
                      <h1 
                        className={`${settings.titleFontSize || 'text-2xl'} ${settings.titleFontWeight || 'font-bold'} ${settings.titleFontStyle || 'not-italic'} leading-tight break-words`}
                        style={titleStyle}
                      >
                        {settings.homepageTitle}
                      </h1>
                      <p 
                        className={`${settings.subtitleFontSize || 'text-sm'} ${settings.subtitleFontWeight || 'font-normal'} ${settings.subtitleFontStyle || 'not-italic'} mt-1 hidden lg:block px-4 line-clamp-2`}
                        style={subtitleStyle}
                      >
                        {settings.homepageSubtitle || `Choisissez une animation pour voir les créneaux disponibles pour l'année scolaire ${settings.activeYear}`}
                      </p>
                  </div>

                  {/* Bouton Admin à Droite */}
                  <div className="z-10 flex-shrink-0">
                      <button
                          onClick={onNavigateToAdmin}
                          className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg shadow hover:bg-slate-700 transition-colors text-[10px] font-bold uppercase tracking-tight"
                          aria-label="Accéder à l'administration"
                      >
                          <CogIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Administration</span>
                      </button>
                  </div>
              </div>

              {/* Liens de pages d'info centrés en bas de l'en-tête */}
              {settings.infoPages && settings.infoPages.length > 0 && (
                  <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2 pb-4 pt-2 border-t border-gray-100/50 mt-1">
                      {settings.infoPages.map(page => (
                          <button
                              key={page.id}
                              onClick={() => onNavigateToInfoPage(page.id)}
                              className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-all hover:scale-110 relative group"
                          >
                              {page.title}
                              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      </header>

      {/* Fenêtre modale de contact */}
      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300" onClick={() => setShowContact(false)}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative transform animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setShowContact(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                        <BellIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nous contacter</h2>
                    <p className="text-slate-500 text-sm mt-1">Informations de contact</p>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Numéro de téléphone</p>
                        <p className="text-lg font-bold text-slate-800">{settings.contactPhone || "Non renseigné"}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adresse e-mail</p>
                        <p className="text-lg font-bold text-blue-600 break-all">{settings.contactEmail || "Non renseignée"}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setShowContact(false)}
                    className="mt-10 w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-slate-200"
                >
                    Fermer
                </button>
            </div>
        </div>
      )}

      <div className="flex-grow flex flex-col" style={{ backgroundColor: settings.homepageBgColor || '#f8fafc' }}>
          <main className="max-w-7xl mx-auto w-full py-8 sm:py-12 px-4 sm:px-6">
              <div className="flex flex-wrap justify-center gap-6">
                  {animations.map(anim => (
                      <div key={anim.id} className="w-full sm:w-[280px] flex-shrink-0">
                        <AnimationCard animation={anim} onSelect={() => onSelectAnimation(anim)} />
                      </div>
                  ))}
              </div>
          </main>
      </div>
    </>
  );
};

export default AnimationSelection;
