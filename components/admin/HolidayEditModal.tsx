import React, { useState } from 'react';
import { Holiday } from '../../types';

const HolidayEditModal: React.FC<{
    holiday: Holiday;
    onSave: (holiday: Holiday) => void;
    onCancel: () => void;
}> = ({ holiday, onSave, onCancel }) => {
    const [formState, setFormState] = useState(holiday);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onCancel}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Modifier la période de vacances</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="holiday-name" className="block text-sm font-medium text-gray-700">Nom de la période</label>
                        <input type="text" id="holiday-name" name="name" value={formState.name} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="holiday-start" className="block text-sm font-medium text-gray-700">Date de début</label>
                            <input type="date" id="holiday-start" name="startDate" value={formState.startDate} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="holiday-end" className="block text-sm font-medium text-gray-700">Date de fin</label>
                            <input type="date" id="holiday-end" name="endDate" value={formState.endDate} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuler</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Sauvegarder</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HolidayEditModal;
