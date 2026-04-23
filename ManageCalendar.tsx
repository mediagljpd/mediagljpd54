
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { AdminUser, UserRole, UserPermissions } from '../../types';
import { AdminSubComponentProps } from './types';
import { TrashIcon, CogIcon, PlusIcon, CheckIcon, ShieldCheckIcon, UserIcon, LockIcon, UserGroupIcon, ShieldIcon } from '../Icons';
import { validatePassword } from '../../utils/validators';
import PasswordPolicy from './PasswordPolicy';
import { dataService } from '../../services/dataService';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import ConfirmationModal from '../shared/ConfirmationModal';

const ManageUsers: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings } = useContext(AppContext);
    
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [admins, setAdmins] = useState<{id: string, email: string}[]>([]);
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminUid, setNewAdminUid] = useState('');
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    
    // Sort local users alphabetically by username
    const sortedUsers = useMemo(() => {
        return [...(settings.users || [])].sort((a, b) => 
            a.username.toLocaleLowerCase().localeCompare(b.username.toLocaleLowerCase())
        );
    }, [settings.users]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'admins'), (snapshot) => {
            const adminList = snapshot.docs.map(doc => ({
                id: doc.id,
                email: doc.data().email
            })).sort((a, b) => a.email.toLocaleLowerCase().localeCompare(b.email.toLocaleLowerCase()));
            setAdmins(adminList);
        });
        return () => unsub();
    }, []);

    const handleAddAdmin = async () => {
        if (!newAdminUid || !newAdminEmail) return;
        try {
            await dataService.addAdmin(newAdminUid, newAdminEmail);
            showNotification('Admin Google ajouté avec succès');
            setNewAdminUid('');
            setNewAdminEmail('');
            setIsAddingAdmin(false);
        } catch (err) {
            showNotification('Erreur lors de l\'ajout de l\'admin', 'error');
        }
    };

    const initialPermissions: UserPermissions = {
        canModifySettings: false,
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

        try {
            const currentUsers = settings.users || [];
            let newUsers;

            if (editingUser) {
                const isPasswordChanged = formData.password !== editingUser.password;
                newUsers = currentUsers.map(u => u.id === editingUser.id ? { 
                    ...formData, 
                    id: u.id,
                    passwordLastChanged: isPasswordChanged ? new Date().toISOString() : u.passwordLastChanged,
                    mustChangePassword: isPasswordChanged ? true : u.mustChangePassword
                } : u);
            } else {
                const newUser: AdminUser = {
                    ...formData,
                    id: Date.now().toString(),
                    passwordLastChanged: new Date().toISOString(),
                    mustChangePassword: true
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
        } catch (err) {
            console.error("Error saving user:", err);
            showNotification('Erreur lors de la sauvegarde de l\'utilisateur', 'error');
        }
    };

    const handleDelete = (id: string) => {
        if (!id) return;
        console.log("Delete triggered for user ID:", id);
        setUserToDelete(id);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        const id = userToDelete;
        
        try {
            console.log("Starting deletion process for ID:", id);
            const currentUsers = settings.users || [];
            // Comparison as strings to avoid type mismatches (number vs string)
            const newUsers = currentUsers.filter(u => String(u.id) !== String(id));
            
            if (newUsers.length === currentUsers.length) {
                showNotification('Utilisateur non trouvé ou déjà supprimé.', 'error');
                console.warn(`Could not find user with id ${id} among`, currentUsers);
                setUserToDelete(null);
                return;
            }

            console.log("Updating settings with the filtered user list...");
            await updateSettings({ ...settings, users: newUsers });
            showNotification('Utilisateur supprimé avec succès.');
        } catch (err) {
            console.error("Error deleting user:", err);
            showNotification('Erreur lors de la suppression de l\'utilisateur. Vérifiez votre connexion.', 'error');
        } finally {
            setUserToDelete(null);
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
                    <h2 className="text-2xl font-bold text-gray-800">Gestion des comptes Utilisateurs</h2>
                    <p className="text-sm text-gray-500 mt-1">Créez et gérez les accès restreints pour les animateurs.</p>
                </div>
                <button 
                    type="button"
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
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Identifiant</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Compte / Animateur</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Permissions</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedUsers.map(user => (
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
                                            {user.role === UserRole.ADMIN ? 'Administrateur' : 'Compte Utilisateur'}
                                        </span>
                                        {user.animatorName && (
                                            <span className="text-xs text-gray-500 mt-1 font-medium">Lié à : {user.animatorName}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.permissions.canModifySettings && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Paramètres</span>}
                                        {user.permissions.canManageVacations && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Vacances</span>}
                                        {user.permissions.canManageAnimations && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">Animations</span>}
                                        {!Object.values(user.permissions).some(v => v) && <span className="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100 font-bold uppercase italic">Aucune</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log("Edit button clicked for:", user.username);
                                                setEditingUser(user);
                                                setFormData({ 
                                                    username: user.username,
                                                    password: user.password || '',
                                                    role: user.role,
                                                    animatorName: user.animatorName || '',
                                                    permissions: { ...user.permissions }
                                                 });
                                                setIsAdding(true);
                                            }}
                                            className="p-2.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-all cursor-pointer relative z-[20]"
                                            title="Modifier"
                                        >
                                            <CogIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log("Delete button clicked for ID:", user.id);
                                                handleDelete(user.id);
                                            }}
                                            className="p-2.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 transition-all cursor-pointer relative z-[20]"
                                            title="Supprimer"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                    Aucun compte utilisateur créé pour le moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-2">
                        <ShieldIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-800">Comptes Admin (Google OAuth)</h3>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setIsAddingAdmin(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                    >
                        + Ajouter un administrateur
                    </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">E-mail</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Google UID</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {admins.map(admin => (
                            <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <ShieldCheckIcon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-gray-700">{admin.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <code className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">{admin.id}</code>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm('Supprimer cet accès Admin ?')) {
                                                try {
                                                    await deleteDoc(doc(db, 'admins', admin.id));
                                                    showNotification('Accès supprimé');
                                                } catch (e) {
                                                    showNotification('Erreur suppression', 'error');
                                                }
                                            }
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">
                                    Aucun compte admin Google configuré.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAddingAdmin && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" onClick={() => setIsAddingAdmin(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">Ajouter un Admin Google</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">E-mail Google</label>
                                <input 
                                    type="email"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none"
                                    placeholder="exemple@gmail.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Google UID</label>
                                <input 
                                    type="text"
                                    value={newAdminUid}
                                    onChange={(e) => setNewAdminUid(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none"
                                    placeholder="UID du compte Google"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">L'UID est disponible dans la console Firebase Auth ou via le profil utilisateur lors d'une première tentative de connexion.</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsAddingAdmin(false)} className="flex-grow py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors">Annuler</button>
                                <button type="button" onClick={handleAddAdmin} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 shadow-lg shadow-blue-100">Ajouter</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => { setIsAdding(false); setEditingUser(null); }}>
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                {editingUser ? 'Modifier le compte' : 'Nouveau compte utilisateur'}
                            </h2>
                            <button type="button" onClick={() => { setIsAdding(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600">
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
            <ConfirmationModal 
                isOpen={!!userToDelete}
                title="Supprimer l'utilisateur"
                message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action supprimera définitivement ses accès à la plateforme."
                confirmLabel="Supprimer définitivement"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setUserToDelete(null)}
            />
        </div>
    );
};

export default ManageUsers;
