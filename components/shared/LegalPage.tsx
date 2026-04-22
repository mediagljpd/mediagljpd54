
import React from 'react';

interface LegalPageProps {
  title: string;
  content: string;
  onBack: () => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ title, content, onBack }) => {
  /**
   * Cette fonction est la clé : elle transforme le HTML brut en une structure
   * où chaque mot est protégé dans un span 'inline-block'.
   * Un élément inline-block ne peut JAMAIS être coupé par le navigateur.
   */
  const wrapWords = (html: string) => {
    if (!html) return '<p style="color: #6b7280; font-style: italic;">Contenu en cours de rédaction...</p>';
    
    // 1. On crée un document temporaire pour manipuler le DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.querySelector('div');
    
    if (!container) return html;

    // 2. Fonction récursive pour traiter tous les nœuds de texte
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        // On split par les espaces mais on garde les espaces dans le résultat
        const words = text.split(/(\s+)/);
        
        const fragment = document.createDocumentFragment();
        words.forEach(word => {
          if (word.trim().length > 0) {
            // C'est un mot : on l'enveloppe pour qu'il soit insécable
            const span = document.createElement('span');
            span.textContent = word;
            // inline-block = insécable / white-space nowrap = double sécurité
            span.style.display = 'inline-block';
            span.style.whiteSpace = 'nowrap';
            span.style.wordBreak = 'normal';
            fragment.appendChild(span);
          } else {
            // C'est un espace : on le laisse tel quel (il servira de point de rupture naturel)
            fragment.appendChild(document.createTextNode(word));
          }
        });
        
        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      } else {
        // Pour les autres nœuds, on traite les enfants
        const children = Array.from(node.childNodes);
        children.forEach(processNode);
      }
    };

    processNode(container);
    return container.innerHTML;
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <style dangerouslySetInnerHTML={{ __html: `
        .legal-safe-container {
          line-height: 1.8;
          color: #1f2937;
          font-size: 1.05rem;
          text-align: left !important;
          max-width: 100%;
        }
        .legal-safe-container h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          color: #111827;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.5rem;
          display: block;
        }
        .legal-safe-container p {
          margin-bottom: 1.5rem;
          display: block;
        }
        .legal-safe-container ul, .legal-safe-container ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
          display: block;
        }
        .legal-safe-container li {
          margin-bottom: 0.75rem;
          display: list-item;
        }
        .legal-safe-container strong {
          font-weight: 700;
          color: #111827;
        }
      `}} />
      
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack} 
          className="mb-8 text-blue-600 hover:underline flex items-center gap-2 font-semibold"
        >
          ← Retour à l'accueil
        </button>
        
        <h1 className="text-4xl font-extrabold mb-10 text-gray-900 tracking-tight">{title}</h1>
        
        <div 
          className="legal-safe-container"
          dangerouslySetInnerHTML={{ __html: wrapWords(content) }}
        />
      </div>
    </div>
  );
};

export default LegalPage;
