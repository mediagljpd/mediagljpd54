
import React, { useState, useContext } from 'react';
import { AppContext } from '../../AppContext';
import { Animation } from '../../types';
import { AdminSubComponentProps } from './types';
import { DragHandleIcon, PencilIcon, TrashIcon } from '../Icons';
import AnimationForm from './AnimationForm';
import ManageAnimators from './ManageAnimators';
import ConfirmationModal from '../shared/ConfirmationModal';

const ManageAnimations: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { animations, bookings, saveAnimation, removeAnimation, updateAnimationsOrder, settings, currentUser } = useContext(AppContext);
    const [editing, setEditing] = useState<Animation | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const canManage = currentUser?.role === 'admin' || currentUser?.permissions.canManageAnimations;
    
    const handleSave = async (animToSave: Animation) => {
        try {
            await saveAnimation(animToSave);
            setEditing(null);
            showNotification('Animation sauvegardée avec succès !');
        } catch (error) {
            showNotification('Erreur lors de la sauvegarde.');
        }
    };

    const handleDelete = async (id: string) => {
        const isUsed = bookings.some(booking => booking.animationId === id);
        if (isUsed) {
            showNotification("Cette animation ne peut pas être supprimée car des réservations y sont associées.", 'error');
            return;
        }
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await removeAnimation(deleteId);
            showNotification('Animation supprimée.');
        } catch (error) {
            console.error("Delete error:", error);
            showNotification('Erreur lors de la suppression. Vérifiez vos permissions.', 'error');
        } finally {
            setDeleteId(null);
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = animations.findIndex(a => a.id === draggedId);
        const targetIndex = animations.findIndex(a => a.id === targetId);
        
        const newAnimations = [...animations];
        const [draggedItem] = newAnimations.splice(draggedIndex, 1);
        newAnimations.splice(targetIndex, 0, draggedItem);
        
        updateAnimationsOrder(newAnimations);
        setDraggedId(null);
    };

    const handleAddNew = () => {
        setEditing({ 
            id: Date.now().toString(), 
            title: '', 
            description: '', 
            classLevel: '', 
            animator: '', 
            color: '#000000',
            fontColor: '#ffffff',
            order: animations.length // Se place à la fin par défaut
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
                <ManageAnimators showNotification={showNotification} />
            </div>
            
            <div className="lg:col-span-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Gérer les animations</h2>
                    {canManage && (
                        <button onClick={handleAddNew} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                            Ajouter une animation
                        </button>
                    )}
                </div>

                {editing && <AnimationForm animation={editing} animators={settings.animators} onSave={handleSave} onCancel={() => setEditing(null)} />}

                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 w-12"></th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Titre</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Animateur</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Niveau</th>
                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {animations.map(anim => (
                                     <tr
                                    key={anim.id}
                                    draggable={canManage}
                                    onDragStart={(e) => canManage && handleDragStart(e, anim.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => canManage && handleDrop(e, anim.id)}
                                    className={`transition-opacity ${draggedId === anim.id ? 'opacity-30' : 'hover:bg-gray-50'}`}
                                >
                                    <td className={`px-6 py-4 whitespace-nowrap text-gray-400 ${canManage ? 'cursor-move' : 'cursor-not-allowed opacity-30'}`}>
                                        <DragHandleIcon className="w-5 h-5" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">{anim.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">{anim.animator || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">{anim.classLevel}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                        <div className="flex justify-end items-center">
                                            {canManage ? (
                                                <>
                                                    <button 
                                                        onClick={() => setEditing(anim)} 
                                                        className="text-gray-500 hover:text-indigo-600 p-1" 
                                                        title="Modifier l'animation"
                                                        aria-label={`Modifier ${anim.title}`}
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(anim.id)} 
                                                        className="text-gray-500 hover:text-red-600 p-1 ml-2" 
                                                        title="Supprimer l'animation"
                                                        aria-label={`Supprimer ${anim.title}`}
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Lecture seule</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={!!deleteId}
                title="Supprimer l'animation"
                message="Êtes-vous sûr de vouloir supprimer cette animation ? Cette action est irréversible."
                confirmLabel="Supprimer"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

export default ManageAnimations;
