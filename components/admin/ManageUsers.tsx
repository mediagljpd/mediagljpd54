
import React, { useState, useContext } from 'react';
import { AppContext } from '../../AppContext';
import { AdminUser, UserRole, UserPermissions } from '../../types';
import { AdminSubComponentProps } from './types';
import { TrashIcon, CogIcon, PlusIcon, CheckIcon, ShieldCheckIcon, UserIcon, LockIcon, UserGroupIcon } from '../Icons';
import { validatePassword } from '../../utils/validators';
import PasswordPolicy from './PasswordPolicy';

const ManageUsers: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings } = useContext(AppContext);
    
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    const initialPermissions: UserPermissions = {
        canModifySettings: false,
        canAddChangelog: false,
        canManageVacations: false,
        canManageAnimations: false
    };

    const [formData, setFormData] = useState<Omit<AdminUser, 'id'>>({
        username: '',
        password: '',
        role: UserRole.USER,
        animatorName: '',
        permissions: { ...initialPermissions }
    });

    const handleSave = async () => {
        const complexityError = validatePassword(formData.password);
        if (complexityError) {
            showNotification(complexityError, 'error');
            return;
        }

        const currentUsers = settings.users || [];
        let newUsers;

        if (editingUser) {
            const isPasswordChanged = formData.password !== editingUser.password;
            newUsers = currentUsers.map(u => u.id === editingUser.id ? { 
                ...formData, 
                id: u.id,
                passwordLastChanged: isPasswordChanged ? new Date().toISOString() : u.passwordLastChanged
            } : u);
        } else {
            const newUser: AdminUser = {
                ...formData,
                id: Date.now().toString(),
                passwordLastChanged: new Date().toISOString()
            };
            newUsers = [...currentUsers, newUser];
        }

        await updateSettings({ ...settings, users: newUsers });
        setIsAdding(false);
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            role: UserRole.USER,
            animatorName: '',
            permissions: { ...initialPermissions }
        });
        showNotification(editingUser ? 'Utilisateur mis à jour !' : 'Utilisateur créé !');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Supprimer cet utilisateur ?')) {
            const newUsers = (settings.users || []).filter(u => u.id !== id);
            await updateSettings({ ...settings, users: newUsers });
            showNotification('Utilisateur supprimé.');
        }
    };

    const togglePermission = (key: keyof UserPermissions) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestion des comptes Utilisateur</h2>
                    <p className="text-sm text-gray-500 mt-1">Créez et gérez les accès restreints pour les animateurs.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <PlusIcon className="w-5 h-5" /> Nouvel utilisateur
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Rôle / Animateur</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Permissions</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(settings.users || []).map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-gray-800">{user.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.role === UserRole.ADMIN ? 'Admin' : 'Utilisateur'}
                                        </span>
                                        {user.animatorName && (
                                            <span className="text-xs text-gray-500 mt-1 font-medium">Lié à : {user.animatorName}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.permissions.canModifySettings && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Paramètres</span>}
                                        {user.permissions.canAddChangelog && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Journal</span>}
                                        {user.permissions.canManageVacations && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Vacances</span>}
                                        {user.permissions.canManageAnimations && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Animations</span>}
                                        {!Object.values(user.permissions).some(v => v) && <span className="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100 font-bold uppercase italic">Aucune</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditingUser(user);
                                                setFormData({ ...user });
                                                setIsAdding(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg border border-gray-100 transition-all"
                                        >
                                            <CogIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-gray-100 transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(settings.users || []).length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                    Aucun compte utilisateur créé pour le moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => { setIsAdding(false); setEditingUser(null); }}>
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                            </h2>
                            <button onClick={() => { setIsAdding(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Identifiant</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all"
                                            placeholder="Nom d'utilisateur"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Mot de passe</label>
                                    <div className="relative">
                                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all"
                                            placeholder="Mot de passe"
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <PasswordPolicy password={formData.password} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Animateur relié</label>
                                <div className="relative">
                                    <UserGroupIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select 
                                        value={formData.animatorName}
                                        onChange={(e) => setFormData({...formData, animatorName: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none appearance-none"
                                    >
                                        <option value="">-- Aucun (Accès non lié) --</option>
                                        {settings.animators.map(a => (
                                            <option key={a.name} value={a.name}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
                                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Permissions & Limitations</h4>
                                </div>
                                <p className="text-xs text-gray-500 italic mb-4">Cochez pour autoriser l'accès à ces fonctionnalités.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">Modifier les Paramètres</span>
                                            <span className="text-[10px] text-gray-400">Accès complet à l'onglet Paramètres</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.permissions.canModifySettings}
                                            onChange={() => togglePermission('canModifySettings')}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">Gérer le Journal</span>
                                            <span className="text-[10px] text-gray-400">Ajouter/Supprimer des entrées</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.permissions.canAddChangelog}
                                            onChange={() => togglePermission('canAddChangelog')}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">Gérer les Vacances</span>
                                            <span className="text-[10px] text-gray-400">Ajouter des périodes de vacances</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.permissions.canManageVacations}
                                            onChange={() => togglePermission('canManageVacations')}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">Gérer les Animations</span>
                                            <span className="text-[10px] text-gray-400">Ajouter animations et animateurs</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.permissions.canManageAnimations}
                                            onChange={() => togglePermission('canManageAnimations')}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsAdding(false); setEditingUser(null); }}
                                    className="flex-grow py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSave}
                                    className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 transform active:scale-95 transition-all"
                                >
                                    {editingUser ? 'Enregistrer les modifications' : 'Créer le compte'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
