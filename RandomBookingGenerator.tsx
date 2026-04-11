
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { ChangelogEntry } from '../../types';
import { AdminSubComponentProps } from './types';
import { toYYYYMMDD } from '../../utils/date';
import { BellIcon, PlusCircleIcon, PencilIcon, TrashIcon } from '../Icons';
import ChangelogEntryForm from './ChangelogEntryForm';

const ManageJournal: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { changelog, saveChangelogEntry, removeChangelogEntry, bookings } = useContext(AppContext);
    const [isAdding, setIsAdding] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

    const sortedChangelog = useMemo(() => {
        return [...changelog].sort((a, b) => new Date(b.date.replace(/-/g, '/')).getTime() - new Date(a.date.replace(/-/g, '/')).getTime());
    }, [changelog]);

    const lastUpdateDate = sortedChangelog.length > 0
        ? new Date(sortedChangelog[0].date.replace(/-/g, '/')).toLocaleDateString('fr-FR')
        : 'N/A';
    
    // Augmentation de la limite à 20 réservations
    const recentBookings = useMemo(() => {
        return [...bookings].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 20);
    }, [bookings]);

    const handleAddEntry = async (entryData: Omit<ChangelogEntry, 'id' | 'date'>) => {
        try {
            const newEntry: ChangelogEntry = {
                id: Date.now().toString(),
                date: toYYYYMMDD(new Date()),
                ...entryData,
            };
            await saveChangelogEntry(newEntry);
            setIsAdding(false);
            showNotification('Entrée de journal ajoutée avec succès !');
        } catch (error) {
            showNotification('Erreur lors de l\'ajout au journal.');
        }
    };
    
    const handleUpdateEntry = async (updatedEntry: ChangelogEntry) => {
        try {
            await saveChangelogEntry(updatedEntry);
            setEditingEntryId(null);
            showNotification('Entrée mise à jour avec succès !');
        } catch (error) {
            showNotification('Erreur lors de la mise à jour.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
            try {
                await removeChangelogEntry(id);
                showNotification('Entrée supprimée.');
            } catch (error) {
                showNotification('Erreur lors de la suppression.');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Journal</h2>
                    <span className="text-base font-normal text-gray-500">(Suivi des mises à jour)</span>
                </div>
                <p className="text-gray-500">Dernière mise à jour : <span className="font-semibold text-gray-700">{lastUpdateDate}</span></p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Mises à jour</h3>
                        <button 
                            onClick={() => { setIsAdding(!isAdding); setEditingEntryId(null); }}
                            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            {isAdding ? 'Annuler' : 'Ajouter une entrée'}
                        </button>
                    </div>

                    {isAdding && <ChangelogEntryForm onSave={handleAddEntry} onCancel={() => setIsAdding(false)} />}

                    <div className="space-y-6">
                        {sortedChangelog.map(entry => (
                             editingEntryId === entry.id
                             ? <ChangelogEntryForm key={entry.id} entry={entry} onSave={handleUpdateEntry} onCancel={() => setEditingEntryId(null)} />
                             : (
                                <div key={entry.id} className="relative border-l-4 pl-6 border-blue-500">
                                    <div className="absolute top-1 -left-[9px] w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500">{new Date(entry.date.replace(/-/g, '/')).toLocaleDateString('fr-FR')} {entry.version && <span className="ml-2 font-mono bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">{entry.version}</span>}</p>
                                            <h4 className="text-lg font-bold text-gray-800 mt-1">{entry.title}</h4>
                                            <p className="mt-2 text-gray-600 whitespace-pre-wrap">{entry.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => { setEditingEntryId(entry.id); setIsAdding(false); }} className="text-gray-400 hover:text-indigo-600 p-1" aria-label="Modifier">
                                                <PencilIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-600 p-1" aria-label="Supprimer">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow h-fit">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <BellIcon className="w-6 h-6 text-yellow-500" /> Notifications
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Dernières réservations (20 max)</h4>
                            {recentBookings.length > 0 ? (
                                <div className="space-y-2 text-sm max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {recentBookings.map(b => (
                                        <div key={b.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                            <p className="font-bold text-blue-800 leading-tight mb-1">{b.animationTitle}</p>
                                            <p className="text-gray-700 font-medium">{b.teacherName}</p>
                                            <p className="text-gray-500 text-xs mt-2 italic">
                                                Atelier : <span className="font-bold text-gray-700 not-italic">
                                                    {new Date(b.date.replace(/-/g, '/')).toLocaleDateString('fr-FR')} à {b.time}h
                                                </span>
                                            </p>
                                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400">
                                                <span>Enregistrée le :</span>
                                                <span className="font-mono">
                                                    {new Date(parseInt(b.id)).toLocaleString('fr-FR', { 
                                                        day: '2-digit', 
                                                        month: '2-digit', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Aucune réservation pour le moment.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default ManageJournal;
