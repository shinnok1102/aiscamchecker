
import { useContext } from 'react';
import { LanguageContext } from '../core-contexts/LanguageContext';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  // Optionally, you can return a loading state if translations are not yet loaded
  // For simplicity, we assume they are loaded or t function handles it.
  return context;
};
