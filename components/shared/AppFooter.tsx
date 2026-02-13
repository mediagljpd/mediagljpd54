import React, { useContext } from 'react';
import { AppContext } from '../../App';

const AppFooter: React.FC = () => {
  const { settings } = useContext(AppContext);
  if (!settings.footerContent) return null;

  return (
    <footer className="w-full text-center p-6 mt-12 text-sm text-gray-600 border-t border-gray-200">
      <div className="whitespace-pre-wrap">{settings.footerContent}</div>
    </footer>
  );
};

export default AppFooter;
