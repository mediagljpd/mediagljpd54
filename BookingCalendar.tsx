
import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
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

const AnimationSelection: React.FC<{ onSelectAnimation: (animation: Animation) => void; onNavigateToAdmin: () => void }> = ({ onSelectAnimation, onNavigateToAdmin }) => {
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
              <div className="relative flex items-center justify-center min-h-24 py-4">
                  {/* Bouton Contact à Gauche */}
                  <div className="absolute inset-y-0 left-0 flex items-center">
                      <button
                          onClick={() => setShowContact(true)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 text-sm font-black uppercase tracking-wider"
                          aria-label="Nous contacter"
                      >
                          <BellIcon className="w-5 h-5" />
                          <span className="hidden md:inline">Nous contacter</span>
                      </button>
                  </div>

                  <div className="text-center px-24 md:px-0">
                      <h1 
                        className={`${settings.titleFontSize || 'text-2xl'} ${settings.titleFontWeight || 'font-bold'} ${settings.titleFontStyle || 'not-italic'} leading-tight`}
                        style={titleStyle}
                      >
                        {settings.homepageTitle}
                      </h1>
                      <p 
                        className={`${settings.subtitleFontSize || 'text-sm'} ${settings.subtitleFontWeight || 'font-normal'} ${settings.subtitleFontStyle || 'italic'} mt-1 hidden lg:block px-4`}
                        style={subtitleStyle}
                      >
                        {settings.homepageSubtitle || `Choisissez une animation pour voir les créneaux disponibles pour l'année scolaire ${settings.activeYear}`}
                      </p>
                  </div>

                  {/* Bouton Admin à Droite */}
                  <div className="absolute inset-y-0 right-0 flex items-center">
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
