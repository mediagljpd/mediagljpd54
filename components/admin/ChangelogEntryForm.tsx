import React, { useState } from 'react';
import { ChangelogEntry } from '../../types';

const ChangelogEntryForm: React.FC<{
    entry?: ChangelogEntry | null;
    onSave: (entry: Omit<ChangelogEntry, 'id' | 'date'> | ChangelogEntry) => void;
    onCancel: () => void;
}> = ({ entry, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        version: entry?.version || '',
        title: entry?.title || '',
        description: entry?.description || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = () => {
        if (!formState.title || !formState.description) {
            alert('Le titre et la description sont requis.'); // Using alert as showNotification is not available here.
            return;
        }
        if (entry) { // Editing existing entry
            onSave({ ...entry, ...formState });
        } else { // Creating new entry
            onSave(formState);
        }
    };
    
    return (
        <div className="bg-gray-50 p-4 rounded-lg my-6 border space-y-3">
            <h4 className="font-semibold">{entry ? "Modifier l'entrée" : "Nouvelle entrée"}</h4>
            <input 
                type="text" 
                name="title"
                placeholder="Titre (ex: Améliorations UI)"
                value={formState.title}
                onChange={handleChange}
                className="w-full p-2 border rounded"
            />
            <input 
                type="text" 
                name="version"
                placeholder="Version (ex: 1.2.1)"
                value={formState.version}
                onChange={handleChange}
                className="w-full p-2 border rounded"
            />
            <textarea
                name="description"
                placeholder="Description des changements..."
                value={formState.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border rounded"
            ></textarea>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Annuler</button>
                <button type="button" onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Sauvegarder</button>
            </div>
        </div>
    );
};

export default ChangelogEntryForm;
