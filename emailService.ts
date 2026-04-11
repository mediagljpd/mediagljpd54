
import React from 'react';

interface LegalPageProps {
  title: string;
  content: string;
  onBack: () => void;
  headerBgColor?: string;
  headerTextColor?: string;
}

const LegalPage: React.FC<LegalPageProps> = ({ 
  title, 
  content, 
  onBack,
  headerBgColor = '#ffffff',
  headerTextColor = '#111827'
}) => {
  // Process content to replace hyphens with non-breaking hyphens safely (only in text, not in HTML tags)
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    return content.split(/(<[^>]*>)/).map(part => {
      if (part.startsWith('<')) return part;
      // Replace standard hyphen with non-breaking hyphen (&#8209;)
      // This prevents the browser from breaking the line at the hyphen
      return part.replace(/-/g, '&#8209;');
    }).join('');
  }, [content]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col mb-12">
        <div 
          className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: headerBgColor, color: headerTextColor }}
        >
          <h1 className="text-2xl font-bold">{title}</h1>
          <button 
            onClick={onBack}
            className="px-4 py-2 rounded-lg transition-opacity font-medium hover:opacity-80"
            style={{ backgroundColor: `${headerTextColor}1A`, color: headerTextColor }}
          >
            Retour
          </button>
        </div>
        <div className="p-8">
          <style dangerouslySetInnerHTML={{ __html: `
            .legal-content-container {
              font-family: inherit;
              color: #374151;
              line-height: 1.6;
              text-align: left !important;
              /* Prevent word cutting while ensuring wrapping */
              word-break: normal !important;
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              hyphens: none !important;
              white-space: normal !important;
              text-rendering: auto !important;
            }
            .legal-content-container p, 
            .legal-content-container ul, 
            .legal-content-container ol, 
            .legal-content-container li {
              margin-top: 0 !important;
              margin-bottom: 0 !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
              word-break: normal !important;
              overflow-wrap: break-word !important;
            }
            .legal-content-container ul, 
            .legal-content-container ol {
              padding-left: 1.5rem !important;
              margin-top: 0.5rem !important;
              margin-bottom: 0.5rem !important;
            }
            .legal-content-container li {
              display: list-item !important;
            }
            .legal-content-container h1, 
            .legal-content-container h2, 
            .legal-content-container h3, 
            .legal-content-container h4 {
              margin-top: 1.5rem !important;
              margin-bottom: 0.5rem !important;
              font-weight: 700;
              color: #111827;
              line-height: 1.2;
            }
            .legal-content-container h1 { font-size: 1.5rem; }
            .legal-content-container h2 { font-size: 1.25rem; }
            .legal-content-container h3 { font-size: 1.125rem; }
            
            /* Extra safety for all nested elements */
            .legal-content-container * {
              word-break: normal !important;
              overflow-wrap: break-word !important;
              hyphens: none !important;
            }
          `}} />
          <div className="legal-content-container">
            {processedContent ? (
              <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            ) : (
              <p className="text-gray-500 italic">Le contenu de cette page n'a pas encore été configuré.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
