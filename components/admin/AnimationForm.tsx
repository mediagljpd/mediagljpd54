
import React, { useState, useRef, useContext } from 'react';
import { Animation, Animator } from '../../types';
import { storageService } from '../../services/storageService';
import { SparklesIcon } from '../Icons';
import { AppContext } from '../../AppContext';

const AnimationForm: React.FC<{ animation: Animation, animators: Animator[], onSave: (anim: Animation) => void, onCancel: () => void }> = ({ animation, animators, onSave, onCancel }) => {
    const { animations } = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formState, setFormState] = useState<Animation>({
        ...animation,
        fontColor: animation.fontColor || '#ffffff'
    });

    const isExisting = animations.some(a => a.id === animation.id);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await storageService.uploadFile(file, 'animations');
            setFormState(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur lors de l'upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    const handleCancel = () => {
        const hasChanges = JSON.stringify(formState) !== JSON.stringify({
            ...animation,
            fontColor: animation.fontColor || '#ffffff'
        });
        if (hasChanges) {
            if (window.confirm("Vous avez des modifications non enregistrées sur cette fiche d'animation. Voulez-vous vraiment annuler ?")) {
                onCancel();
            }
        } else {
            onCancel();
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{isExisting ? "Modifier l'animation" : "Nouvelle animation"}</h3>
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

                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Illustration (Cloudinary)</label>
                        <div className="flex gap-2">
                            <input 
                                type="url" 
                                name="imageUrl" 
                                value={formState.imageUrl || ''} 
                                onChange={handleChange} 
                                placeholder="https://res.cloudinary.com/..." 
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs bg-gray-50" 
                            />
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}`}
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <SparklesIcon className="w-4 h-4" />
                                )}
                                {isUploading ? 'Upload...' : 'Uploader'}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 italic">L'image sera hébergée sur Cloudinary et optimisée automatiquement.</p>
                    </div>
                    {(formState.imageUrl || isUploading) && (
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg border-2 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center relative">
                                {isUploading ? (
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <img 
                                        src={formState.imageUrl} 
                                        alt="Aperçu" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Erreur';
                                        }}
                                    />
                                )}
                                {formState.imageUrl && !isUploading && (
                                    <button 
                                        type="button"
                                        onClick={() => setFormState(prev => ({ ...prev, imageUrl: '' }))}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600 transition-colors"
                                        title="Supprimer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
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
                    <button type="button" onClick={handleCancel} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors">Annuler</button>
                    <button type="submit" className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md transition-all">Sauvegarder</button>
                </div>
            </form>
        </div>
    );
};

export default AnimationForm;
