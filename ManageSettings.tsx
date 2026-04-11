
import { storageService } from '../../services/storageService';
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { Animator } from '../../types';
import { AdminSubComponentProps } from './types';
import { PencilIcon, CheckIcon, XIcon, TrashIcon } from '../Icons';

const ManageAnimators: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { animations, updateAnimationsOrder, settings, updateSettings } = useContext(AppContext);
    const [newAnimatorName, setNewAnimatorName] = useState('');
    const [editingAnimator, setEditingAnimator] = useState<{ original: Animator; current: Animator } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const animators = useMemo(() => settings.animators || [], [settings.animators]);

    const handleAddAnimator = () => {
        const trimmedName = newAnimatorName.trim();
        if (trimmedName && !animators.some(a => a.name === trimmedName)) {
            const newAnimators = [...animators, { name: trimmedName, email: '', avatarUrl: '' }].sort((a, b) => a.name.localeCompare(b.name));
            updateSettings({ ...settings, animators: newAnimators });
            setNewAnimatorName('');
            showNotification(`Animateur "${trimmedName}" ajouté.`);
        } else if (animators.some(a => a.name === trimmedName)) {
            showNotification(`L'animateur "${trimmedName}" existe déjà.`);
        }
    };
    
    const handleUpdateAnimator = () => {
        if (!editingAnimator) return;
        const { original, current } = editingAnimator;
        const newName = current.name.trim();

        if (!newName) {
            showNotification("Le nom de l'animateur ne peut pas être vide.");
            return;
        }
        if (newName !== original.name && animators.some(a => a.name === newName)) {
            showNotification(`L'animateur "${newName}" existe déjà.`);
            return;
        }

        const newAnimators = animators.map(anim => (anim.name === original.name ? current : anim)).sort((a, b) => a.name.localeCompare(b.name));
        
        if (original.name !== newName) {
            const newAnimations = animations.map(anim => {
                if (anim.animator === original.name) {
                    return { ...anim, animator: newName };
                }
                return anim;
            });
            updateAnimationsOrder(newAnimations);

            const newAnimatorSettings = { ...(settings.animatorSettings || {})};
            if(newAnimatorSettings[original.name]) {
                newAnimatorSettings[newName] = newAnimatorSettings[original.name];
                delete newAnimatorSettings[original.name];
            }
            updateSettings({ ...settings, animators: newAnimators, animatorSettings: newAnimatorSettings });
        } else {
            updateSettings({ ...settings, animators: newAnimators });
        }

        setEditingAnimator(null);
        showNotification(`Animateur "${newName}" mis à jour.`);
    };

    const handleRemoveAnimator = async (animatorToRemove: Animator) => {
        const isAnimatorUsed = animations.some(anim => anim.animator === animatorToRemove.name);
        if (isAnimatorUsed) {
            alert(`Impossible de supprimer "${animatorToRemove.name}". Il est assigné à une ou plusieurs animations.`);
            return;
        }

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'animateur "${animatorToRemove.name}" ?`)) {
            const newAnimators = animators.filter(animator => animator.name !== animatorToRemove.name);
            const newAnimatorSettings = { ...(settings.animatorSettings || {})};
            if(newAnimatorSettings[animatorToRemove.name]) {
                delete newAnimatorSettings[animatorToRemove.name];
            }
            updateSettings({ ...settings, animators: newAnimators, animatorSettings: newAnimatorSettings });
            showNotification(`Animateur "${animatorToRemove.name}" supprimé.`);
        }
    };

    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && editingAnimator) {
            const file = e.target.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
                alert("L'image est trop volumineuse (max 5 Mo).");
                return;
            }

            setIsUploading(true);
            try {
                // Upload vers Cloudinary
                const downloadURL = await storageService.uploadFile(file, `avatars`);
                
                setEditingAnimator(prev => prev ? ({
                    ...prev,
                    current: { ...prev.current, avatarUrl: downloadURL }
                }) : null);
                
                showNotification("Image mise à jour !");
            } catch (error) {
                console.error(error);
                alert("Erreur lors de l'upload. Avez-vous configuré votre cloud_name et upload_preset dans storageService.ts ?");
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gérer les animateurs</h2>
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newAnimatorName}
                    onChange={(e) => setNewAnimatorName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAnimator()}
                    placeholder="Nom de l'animateur"
                    className="flex-grow min-w-0 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button onClick={handleAddAnimator} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 whitespace-nowrap">Ajouter</button>
            </div>
            <ul className="space-y-3">
                {animators.length > 0 ? animators.map(animator => (
                    <li key={animator.name}>
                        {editingAnimator?.original.name === animator.name ? (
                            <div className="w-full bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-inner">
                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 text-center">
                                        <div className="relative group">
                                            <img 
                                                src={editingAnimator.current.avatarUrl || `https://ui-avatars.com/api/?name=${editingAnimator.current.name.replace(/\s/g, '+')}&background=random`} 
                                                alt="Aperçu" 
                                                className={`w-16 h-20 object-cover rounded-md mb-2 bg-gray-200 shadow-sm border border-indigo-100 ${isUploading ? 'opacity-50' : ''}`}
                                            />
                                            {isUploading && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <label 
                                            htmlFor="avatar-upload" 
                                            className={`cursor-pointer text-xs font-bold ${isUploading ? 'text-gray-400' : 'text-blue-600 hover:underline'}`}
                                        >
                                            {isUploading ? 'Envoi...' : 'Modifier'}
                                        </label>
                                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} disabled={isUploading}/>
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        <input
                                            type="text"
                                            value={editingAnimator.current.name}
                                            onChange={(e) => setEditingAnimator(prev => prev ? ({ ...prev, current: { ...prev.current, name: e.target.value }}) : null)}
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Nom complet"
                                            autoFocus
                                        />
                                        <input
                                            type="email"
                                            value={editingAnimator.current.email || ''}
                                            onChange={(e) => setEditingAnimator(prev => prev ? ({ ...prev, current: { ...prev.current, email: e.target.value }}) : null)}
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Adresse e-mail"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-indigo-100">
                                    <button onClick={() => setEditingAnimator(null)} className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded" aria-label="Annuler" disabled={isUploading}>
                                        <XIcon className="w-4 h-4" /> Annuler
                                    </button>
                                    <button onClick={handleUpdateAnimator} className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded shadow-sm" aria-label="Sauvegarder" disabled={isUploading}>
                                        <CheckIcon className="w-4 h-4" /> Enregistrer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 h-28 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <img src={animator.avatarUrl || `https://ui-avatars.com/api/?name=${animator.name.replace(/\s/g, '+')}&background=random`} alt={`Avatar de ${animator.name}`} className="w-16 h-20 flex-shrink-0 object-cover rounded-md bg-gray-200 shadow-sm border border-gray-100" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 text-lg leading-tight truncate">{animator.name}</p>
                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1 truncate" title={animator.email}>
                                            <span className="opacity-60 text-[10px] uppercase font-bold tracking-wider">Email:</span>
                                            {animator.email || 'Non renseigné'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                    <button onClick={() => setEditingAnimator({ original: animator, current: { ...animator } })} className="text-gray-400 hover:text-indigo-600 p-1.5 bg-white rounded-full border border-gray-100 shadow-sm hover:border-indigo-200" title="Modifier">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleRemoveAnimator(animator)} className="text-gray-400 hover:text-red-600 p-1.5 bg-white rounded-full border border-gray-100 shadow-sm hover:border-red-200" title="Supprimer">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                )) : <p className="text-gray-500 italic text-center py-4">Aucun animateur ajouté.</p>}
            </ul>
        </div>
    );
};

export default ManageAnimators;
