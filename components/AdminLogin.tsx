
import React, { useState, useEffect, useContext } from 'react';
import { AppSettings, UserRole, AdminUser } from '../types';
import { emailService } from '../services/emailService';
import { AppContext } from '../AppContext';
import { validatePassword } from '../utils/validators';
import PasswordPolicy from './admin/PasswordPolicy';

interface AdminLoginProps {
  settings: AppSettings;
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ settings, onLoginSuccess, onBackToHome }) => {
  const { setCurrentUser, updateSettings } = useContext(AppContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Password Expiry States
  const [isPasswordExpired, setIsPasswordExpired] = useState(false);
  const [expiredUserType, setExpiredUserType] = useState<'admin' | 'user' | null>(null);
  const [expiredUserId, setExpiredUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [expiryError, setExpiryError] = useState('');

  useEffect(() => {
    emailService.init();
  }, []);

  const isSetupRequired = !settings.adminUsername || !settings.adminPassword;

  /**
   * Masque partiellement une adresse e-mail (ex: te****er@academie.fr)
   */
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 3) return `***@${domain}`;
    return `${local.substring(0, 2)}****${local.substring(local.length - 1)}@${domain}`;
  };

  const checkExpiry = (lastChanged?: string) => {
    if (!settings.passwordExpiryDays || settings.passwordExpiryDays === 0) return false;
    if (!lastChanged) return true; // Force change if never changed
    
    const lastDate = new Date(lastChanged);
    const expiryDate = new Date(lastDate);
    expiryDate.setDate(expiryDate.getDate() + settings.passwordExpiryDays);
    
    return new Date() > expiryDate;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetupRequired) {
      onLoginSuccess();
      return;
    }

    if (username === settings.adminUsername && password === settings.adminPassword) {
      if (checkExpiry(settings.adminPasswordLastChanged)) {
        setIsPasswordExpired(true);
        setExpiredUserType('admin');
        return;
      }

      setError('');
      setCurrentUser({
        id: 'main-admin',
        username: settings.adminUsername,
        password: settings.adminPassword,
        role: UserRole.ADMIN,
        permissions: {
          canModifySettings: true,
          canAddChangelog: true,
          canManageVacations: true,
          canManageAnimations: true
        },
        passwordLastChanged: settings.adminPasswordLastChanged
      });
      onLoginSuccess();
      return;
    }

    // Check other users
    const foundUser = (settings.users || []).find(u => u.username === username && u.password === password);
    if (foundUser) {
        if (checkExpiry(foundUser.passwordLastChanged)) {
            setIsPasswordExpired(true);
            setExpiredUserType('user');
            setExpiredUserId(foundUser.id);
            return;
        }

        setError('');
        setCurrentUser(foundUser);
        onLoginSuccess();
    } else {
      setError('Identifiant ou mot de passe incorrect.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpiryError('');

    const complexityError = validatePassword(newPassword);
    if (complexityError) {
        setExpiryError(complexityError);
        return;
    }

    if (newPassword !== confirmPassword) {
        setExpiryError("Les mots de passe ne correspondent pas.");
        return;
    }

    if (newPassword === password) {
        setExpiryError("Le nouveau mot de passe doit être différent de l'ancien.");
        return;
    }

    const updatedSettings = { ...settings };
    const now = new Date().toISOString();

    if (expiredUserType === 'admin') {
        updatedSettings.adminPassword = newPassword;
        updatedSettings.adminPasswordLastChanged = now;
    } else if (expiredUserType === 'user' && expiredUserId) {
        updatedSettings.users = (settings.users || []).map(u => 
            u.id === expiredUserId ? { ...u, password: newPassword, passwordLastChanged: now } : u
        );
    }

    await updateSettings(updatedSettings);
    
    // Auto-login after change
    if (expiredUserType === 'admin') {
        setCurrentUser({
            id: 'main-admin',
            username: settings.adminUsername!,
            password: newPassword,
            role: UserRole.ADMIN,
            permissions: {
                canModifySettings: true,
                canAddChangelog: true,
                canManageVacations: true,
                canManageAnimations: true
            },
            passwordLastChanged: now
        });
    } else {
        const updatedUser = updatedSettings.users?.find(u => u.id === expiredUserId);
        if (updatedUser) setCurrentUser(updatedUser);
    }

    onLoginSuccess();
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
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            
            <div className="w-full p-8 sm:p-12 flex flex-col justify-center">
                <div>
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        {isPasswordExpired ? 'Mot de passe expiré' : 'Accès administrateur'}
                    </h2>
                
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
                    ) : isPasswordExpired ? (
                        <form onSubmit={handleUpdatePassword} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                            <p className="text-sm text-gray-600 text-center mb-4">
                                Votre mot de passe a expiré (tous les {settings.passwordExpiryDays} jours). 
                                Veuillez le modifier pour continuer.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                                
                                <PasswordPolicy password={newPassword} />

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {expiryError && <p className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded border border-red-100">{expiryError}</p>}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                                >
                                    Mettre à jour et accéder
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordExpired(false)}
                                    className="w-full mt-3 text-sm text-gray-500 hover:underline"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        </form>
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
