
import React, { useState, useEffect, useContext } from 'react';
import { AppSettings, UserRole, AdminUser } from '../types';
import { AppContext } from '../AppContext';
import { auth, db } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LockIcon } from './Icons';
import { validatePassword } from '../utils/validators';
import PasswordPolicy from './admin/PasswordPolicy';

interface AdminLoginProps {
  settings: AppSettings;
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ settings, onLoginSuccess, onBackToHome }) => {
  const { setCurrentUser, updateSettings } = useContext(AppContext);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loginMode, setLoginMode] = useState<'google' | 'password'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // States for mandatory password change
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setLoggedUser(user);
      
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      
      if (adminDoc.exists()) {
        setCurrentUser({
          id: user.uid,
          username: user.email || user.displayName || 'Admin',
          role: UserRole.ADMIN,
          permissions: {
            canModifySettings: true,
            canManageVacations: true,
            canManageAnimations: true
          }
        });
        onLoginSuccess();
      } else {
        setError("Accès refusé. Votre compte Google n'est pas autorisé comme administrateur.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error("Détails de l'erreur de connexion:", err);
      // Afficher le code d'erreur spécifique pour aider au diagnostic (ex: auth/unauthorized-domain)
      const errorCode = err.code || "unknown";
      const errorMessage = err.message || "Erreur inconnue";
      setError(`Erreur Firebase (${errorCode}): ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const user = (settings.users || []).find(u => u.username === username && u.password === password);

    if (user) {
      // Requis pour les nouveaux utilisateurs OU les anciens qui n'ont jamais changé (flag absent)
      // Seulement pour les comptes "Utilisateur" (accès limité)
      const isLimitedUser = user.role === UserRole.USER;
      const needsChange = isLimitedUser && (user.mustChangePassword === true || user.mustChangePassword === undefined);

      if (needsChange) {
        setPendingUser(user);
      } else {
        setCurrentUser(user);
        onLoginSuccess();
      }
    } else {
      setError("Identifiant ou mot de passe incorrect.");
    }
    setIsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const complexityError = validatePassword(newPassword);
    if (complexityError) {
      setError(complexityError);
      return;
    }

    if (newPassword === pendingUser.password) {
        setError("Le nouveau mot de passe doit être différent de l'actuel.");
        return;
    }

    setIsLoading(true);
    try {
        const updatedUser = {
            ...pendingUser,
            password: newPassword,
            mustChangePassword: false,
            passwordLastChanged: new Date().toISOString()
        };

        const updatedUsers = (settings.users || []).map(u => 
            u.id === pendingUser.id ? updatedUser : u
        );

        await updateSettings({ ...settings, users: updatedUsers });
        setCurrentUser(updatedUser);
        onLoginSuccess();
    } catch (err) {
        setError("Une erreur est survénue lors du changement de mot de passe.");
    } finally {
        setIsLoading(false);
    }
  };

  if (pendingUser) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
            <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-12">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">Sécurité Requise</h2>
                    <p className="text-gray-500 text-sm">C'est votre première connexion. Veuillez choisir un nouveau mot de passe personnel pour continuer.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-1">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nouveau mot de passe</label>
                        <input 
                            type="password" 
                            required 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none"
                            placeholder="Nouveau mot de passe"
                        />
                        <div className="mt-2 text-left">
                            <PasswordPolicy password={newPassword} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Confirmez le mot de passe</label>
                        <input 
                            type="password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none"
                            placeholder="Confirmez"
                        />
                    </div>

                    {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50 flex justify-center"
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Actualiser et se connecter"}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setPendingUser(null)}
                            className="text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors"
                        >
                            Retour à la connexion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="w-full p-8 sm:p-12 flex flex-col justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Accès administrateur</h2>
                    <p className="text-gray-600 mb-8 text-sm">Connectez-vous pour accéder au panneau de gestion.</p>

                    <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                        <button 
                            onClick={() => { setLoginMode('password'); setError(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'password' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Compte Utilisateur
                        </button>
                        <button 
                            onClick={() => { setLoginMode('google'); setError(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'google' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Compte Admin
                        </button>
                    </div>
                    
                    {loginMode === 'google' ? (
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            )}
                            Se connecter avec Google
                        </button>
                    ) : (
                        <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Identifiant</label>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none"
                                    placeholder="Nom d'utilisateur"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Mot de passe</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50 flex justify-center"
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Se connecter"}
                            </button>
                        </form>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                            <p className="text-red-700 text-sm font-bold mb-1">Accès refusé</p>
                            <p className="text-red-600 text-xs mb-1">{error}</p>
                            {loginMode === 'google' && loggedUser && (
                                <div className="bg-white p-3 rounded border border-red-100 mt-2">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Votre UID Google :</p>
                                    <code className="text-[10px] font-mono break-all text-red-800 bg-red-50 px-1 py-0.5 rounded">{loggedUser.uid}</code>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8">
                      <button onClick={onBackToHome} className="text-sm text-blue-600 hover:text-blue-500 hover:underline">
                          ← Retour à l'accueil
                      </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminLogin;
