
import React from 'react';

interface LegalPageProps {
  title: string;
  content: string;
  onBack: () => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ title, content, onBack }) => {
  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack} 
          className="mb-8 text-blue-600 hover:underline flex items-center gap-2 font-medium"
        >
          ← Retour à l'accueil
        </button>
        
        <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">{title}</h1>
        
        <div 
          className="prose prose-blue max-w-none text-gray-800 leading-relaxed"
          style={{ 
            wordBreak: 'normal', 
            overflowWrap: 'break-word', 
            hyphens: 'none',
            textAlign: 'left'
          }}
          dangerouslySetInnerHTML={{ __html: content || '<p className="text-gray-500 italic">Contenu en cours de rédaction...</p>' }}
        />
      </div>
    </div>
  );
};

export default LegalPage;
