
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the shape of your translation strings object
interface Translations {
  [key: string]: string | Translations;
}

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
  isLoaded: boolean;
}

const defaultLanguage = 'vi';
const supportedLanguages = ['vi', 'en'];

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') : null;
    return storedLang && supportedLanguages.includes(storedLang) ? storedLang : defaultLanguage;
  });
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const fetchTranslations = useCallback(async (lang: string) => {
    try {
      setIsLoaded(false);
      // Ensure the path is absolute from the public directory or handled by your bundler
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json: ${response.statusText}`);
      }
      const data: Translations = await response.json();
      setTranslations(data);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading translation file:", error);
      // Fallback to default language if current one fails
      if (lang !== defaultLanguage) {
        await fetchTranslations(defaultLanguage);
      } else {
        setTranslations({}); // Empty translations if default also fails
        setIsLoaded(true); // Mark as loaded to avoid infinite loops
      }
    }
  }, []);

  useEffect(() => {
    fetchTranslations(language);
  }, [language, fetchTranslations]);

  const changeLanguage = (lang: string) => {
    if (supportedLanguages.includes(lang)) {
      setLanguage(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appLanguage', lang);
      }
    } else {
      console.warn(`Language '${lang}' is not supported.`);
    }
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    if (!translations) return key; // Return key if translations not loaded

    const keys = key.split('.');
    let current: string | Translations | undefined = translations;

    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = current[k] as string | Translations;
      } else {
        // console.warn(`Translation key "${key}" not found for language "${language}".`);
        return key; // Key not found
      }
    }
    
    let translatedString = typeof current === 'string' ? current : key;

    if (options && typeof translatedString === 'string') {
      Object.entries(options).forEach(([optKey, value]) => {
        translatedString = translatedString.replace(new RegExp(`{${optKey}}`, 'g'), String(value));
      });
    }
    
    return translatedString;

  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};
