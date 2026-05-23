
import React from 'react';
import { CheckIcon, XIcon } from '../Icons';

interface PasswordPolicyProps {
    password: string;
    singleLine?: boolean;
}

const PasswordPolicy: React.FC<PasswordPolicyProps> = ({ password, singleLine }) => {
    const rules = [
        { label: "8 caractères min.", test: (p: string) => p.length >= 8 },
        { label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
        { label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
        { label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
        { label: "Un car. spécial", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    if (singleLine) {
        return (
            <div className="bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100 w-full">
                <div className="grid grid-cols-2 min-[540px]:grid-cols-5 gap-y-1 gap-x-2 w-full">
                    {rules.map((rule, idx) => {
                        const isValid = rule.test(password);
                        return (
                            <div key={idx} className="flex items-center justify-start min-[540px]:justify-center gap-1.5 py-0.5">
                                {isValid ? (
                                    <div className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                        <CheckIcon className="w-2.5 h-2.5" />
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center shrink-0">
                                        <XIcon className="w-2.5 h-2.5" />
                                    </div>
                                )}
                                <span className={`text-[10px] font-bold ${isValid ? 'text-green-700 font-extrabold' : 'text-gray-400'}`}>
                                    {rule.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Critères de sécurité</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {rules.map((rule, idx) => {
                    const isValid = rule.test(password);
                    return (
                        <div key={idx} className="flex items-center gap-2">
                            {isValid ? (
                                <div className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckIcon className="w-2.5 h-2.5" />
                                </div>
                            ) : (
                                <div className="w-4 h-4 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center">
                                    <XIcon className="w-2.5 h-2.5" />
                                </div>
                            )}
                            <span className={`text-[10px] font-bold ${isValid ? 'text-green-700' : 'text-gray-400'}`}>
                                {rule.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PasswordPolicy;
