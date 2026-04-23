
import React, { useState } from 'react';
import { Animation, Animator } from '../../types';

const AnimationForm: React.FC<{ animation: Animation, animators: Animator[], onSave: (anim: Animation) => void, onCancel: () => void }> = ({ animation, animators, onSave, onCancel }) => {
    const [formState, setFormState] = useState<Animation>({
        ...animation,
        fontColor: animation.fontColor || '#ffffff'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{animation.id.length > 10 ? 'Nouvelle animation' : 'Modifier l\'animation'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'animation</label>
                    <input type="text" name="title" value={formState.title} onChange={handleChange} placeholder="Titre de l'animation" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formState.description || ''} onChange={handleChange} placeholder="Description détaillée..." rows={3} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animateur référent</label>
                        <select
                            name="animator"
                            value={formState.animator || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="">-- Non assigné --</option>
                            {animators.map(animator => (
                                <option key={animator.name} value={animator.name}>{animator.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Niveaux scolaires</label>
                        <input type="text" name="classLevel" value={formState.classLevel} onChange={handleChange} placeholder="ex: CE1-CE2" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-8 p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                        <label htmlFor="color" className="text-sm font-medium text-gray-700">Couleur de fond :</label>
                        <input type="color" name="color" value={formState.color} onChange={handleChange} className="p-0.5 h-10 w-12 block bg-white border border-gray-200 cursor-pointer rounded-md shadow-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                        <label htmlFor="fontColor" className="text-sm font-medium text-gray-700">Couleur de police :</label>
                        <input type="color" name="fontColor" value={formState.fontColor} onChange={handleChange} className="p-0.5 h-10 w-12 block bg-white border border-gray-200 cursor-pointer rounded-md shadow-sm" />
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center border-l pl-8">
                        <div 
                            className="px-4 py-2 rounded-lg shadow-sm border text-center font-bold text-sm min-w-[150px]"
                            style={{ backgroundColor: formState.color, color: formState.fontColor }}
                        >
                            Aperçu du texte
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors">Annuler</button>
                    <button type="submit" className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md transition-all">Sauvegarder</button>
                </div>
            </form>
        </div>
    );
};

export default AnimationForm;
