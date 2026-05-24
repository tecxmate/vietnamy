import { createContext, useContext, useState, useEffect } from 'react';
import { normalizeLang } from '../lib/i18n';

const LanguageContext = createContext();

export function useLanguage() {
    return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
    // Initialize from localStorage or default to 'en'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('vnme_app_language') || localStorage.getItem('vietnamy_language');
        return normalizeLang(saved);
    });

    useEffect(() => {
        localStorage.setItem('vnme_app_language', normalizeLang(language));
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'zh-s' : prev === 'zh-s' ? 'zh-t' : 'en');
    };

    const value = {
        language,
        setLanguage: (next) => setLanguage(normalizeLang(next)),
        toggleLanguage
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
