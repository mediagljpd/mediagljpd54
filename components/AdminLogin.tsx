
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { emailService } from '../services/emailService';

interface AdminLoginProps {
  settings: AppSettings;
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

const DEFAULT_LOGIN_BG = 'https://i.postimg.cc/FHNkzYMb/e51d34d7fa0879fe125ad25fe3c29954.jpg';

const AdminLogin: React.FC<AdminLoginProps> = ({ settings, onLoginSuccess, onBackToHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    emailService.init();
  }, []);

  const isSetupRequired = !settings.adminUsername || !settings.adminPassword;
  const loginIllustration = settings.adminLoginBgUrl || DEFAULT_LOGIN_BG;

  /**
   * Masque partiellement une adresse e-mail (ex: te****er@academie.fr)
   */
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 3) return `***@${domain}`;
    return `${local.substring(0, 2)}****${local.substring(local.length - 1)}@${domain}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetupRequired) {
      onLoginSuccess();
      return;
    }

    if (username === settings.adminUsername && password === settings.adminPassword) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Identifiant ou mot de passe incorrect.');
    }
  };

  const handleRecover = async () => {
    if (!settings.adminEmail) {
        alert("Aucun e-mail de secours n'est configuré dans les paramètres.");
        return;
    }

    setIsRecovering(true);
    try {
        await emailService.sendRecoveryEmail(
            settings.adminEmail, 
            settings.adminUsername || 'Administrateur',
            settings.adminPassword || ''
        );
        setRecoverySent(true);
        setTimeout(() => {
            setShowRecovery(false);
            setRecoverySent(false);
        }, 8000);
    } catch (e) {
        alert("Une erreur est survenue lors de l'envoi de l'e-mail. Vérifiez la configuration EmailJS.");
    } finally {
        setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex relative">
            
            <div 
                className="hidden md:block md:w-1/2 bg-cover bg-center" 
                style={{ backgroundImage: `url('${loginIllustration}')` }}
                aria-label="Illustration d'un atelier créatif"
            >
            </div>
            
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                <div>
                    <div className="md:hidden text-center mb-6">
                        <img 
                            src={loginIllustration}
                            alt="Illustration d'un atelier créatif" 
                            className="w-40 h-40 object-cover rounded-full mx-auto shadow-md" 
                        />
                    </div>

                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Accès administrateur</h2>
                
                    {isSetupRequired ? (
                      <div className='text-center'>
                            <p className="text-gray-600 mb-4">Aucun identifiant n'est configuré.</p>
                            <button
                              onClick={onLoginSuccess}
                              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                          >
                              Configurer et accéder au panneau
                          </button>
                      </div>
                    ) : (
                      <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-700">Identifiant</label>
                            <input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required
                              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Votre identifiant"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowRecovery(true)}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Identifiants oubliés ?
                                </button>
                            </div>
                            <input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="••••••••"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                        <div>
                            <button
                              type="submit"
                              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                            >
                              Se connecter
                            </button>
                        </div>
                      </form>
                    )}

                    <div className="mt-8 text-center">
                      <button onClick={onBackToHome} className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline">
                          ← Retour à l'accueil
                      </button>
                    </div>
                </div>
            </div>

            {showRecovery && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center p-8 text-center z-10 animate-fade-in">
                    {recoverySent ? (
                        <div className="space-y-4 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Identifiants envoyés</h3>
                            <p className="text-gray-600 text-sm">Vos identifiants actuels ont été envoyés à l'adresse e-mail de secours :</p>
                            <p className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">
                                {maskEmail(settings.adminEmail || 'Non configurée')}
                            </p>
                            <p className="text-[10px] text-gray-400 pt-4 italic">Pensez à vérifier vos courriers indésirables (spam).</p>
                        </div>
                    ) : (
                        <div className="max-w-xs space-y-6">
                            <h3 className="text-2xl font-bold text-gray-800">Récupération</h3>
                            <p className="text-gray-600 text-sm">Souhaitez-vous recevoir vos identifiants par e-mail ?</p>
                            <div className="space-y-3">
                                <button 
                                    onClick={handleRecover}
                                    disabled={isRecovering}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 shadow-md"
                                >
                                    {isRecovering ? 'Envoi en cours...' : "Oui, envoyer mes accès"}
                                </button>
                                <button 
                                    onClick={() => setShowRecovery(false)}
                                    className="w-full text-gray-500 py-2 hover:underline text-sm"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminLogin;
