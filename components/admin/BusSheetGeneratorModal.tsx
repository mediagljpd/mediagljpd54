import React, { useState } from 'react';
import { PdfIcon } from '../Icons';

const BusSheetGeneratorModal: React.FC<{
    bookingCount: number;
    onClose: () => void;
    onGenerate: (format: 'pdf') => Promise<void>;
}> = ({ bookingCount, onClose, onGenerate }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            await onGenerate('pdf');
            // Only close on success. The parent component will show an error notification on failure.
            onClose(); 
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Générer les fiches de bus</h2>
                <p className="mb-6 text-gray-600">Vous allez générer un document PDF contenant {bookingCount} fiche(s).</p>
                
                <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <PdfIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-gray-900">Format PDF</span>
                        <br />
                        <span className="text-sm text-gray-500">Idéal pour l'impression et le partage universel.</span>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuler</button>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center min-w-[120px]"
                    >
                        {isGenerating ? 'Génération...' : 'Confirmer et Générer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusSheetGeneratorModal;
