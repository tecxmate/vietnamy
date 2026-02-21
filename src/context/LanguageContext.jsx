import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function useLanguage() {
    return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
    // Initialize from localStorage or default to 'en'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('vietnamy_language');
        return saved || 'en';
    });

    useEffect(() => {
        localStorage.setItem('vietnamy_language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'cn' : 'en');
    };

    const value = {
        language,
        setLanguage,
        toggleLanguage
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
