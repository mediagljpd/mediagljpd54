
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '../Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    title, 
    message, 
    confirmLabel, 
    cancelLabel = "Annuler", 
    onConfirm, 
    onCancel,
    isDanger = false
}) => {
    useEffect(() => {
        if (isOpen) {
            console.log("ConfirmationModal is now OPEN:", title);
        }
    }, [isOpen, title]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button 
                        type="button"
                        onClick={onCancel} 
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8">
                    <p className="text-gray-600 leading-relaxed mb-8">{message}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:w-auto px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                console.log("ConfirmationModal CONFIRMED");
                                onConfirm();
                                onCancel();
                            }}
                            className={`w-full sm:w-auto px-10 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                                isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                            }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
