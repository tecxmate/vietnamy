import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_LEARNER_MODE } from '../data/learnerModes';

const UserContext = createContext();

const SUPPORTED_PROFILE_LANGS = ['en', 'zh-s', 'zh-t'];
const SUPPORTED_DICT_LANGS = ['en', 'zh-s', 'zh-t'];

const normalizeProfileLang = (lang) => {
    if (lang === 'zh') return 'zh-s';
    return SUPPORTED_PROFILE_LANGS.includes(lang) ? lang : 'en';
};

const DEFAULT_PROFILE = {
    age: 25,
    gender: 'male',
    name: 'Bạn',
    goal: '',
    dialect: '',
    level: '',
    dailyMins: 10,
    nativeLang: 'en',
    dictMode: 'en',
    visibleDicts: SUPPORTED_DICT_LANGS,
    learnerMode: DEFAULT_LEARNER_MODE,
};

const normalizeDictMode = (mode) => {
    if (mode === 'all' || SUPPORTED_DICT_LANGS.includes(mode)) return mode;
    if (mode === 'zh') return 'zh-s';
    return 'en';
};

const normalizeProfile = (profile = {}) => {
    const visibleDicts = Array.isArray(profile.visibleDicts)
        ? profile.visibleDicts.map(normalizeDictMode).filter(lang => SUPPORTED_DICT_LANGS.includes(lang))
        : SUPPORTED_DICT_LANGS;
    return {
        ...DEFAULT_PROFILE,
        ...profile,
        nativeLang: normalizeProfileLang(profile.nativeLang),
        dictMode: normalizeDictMode(profile.dictMode),
        visibleDicts: visibleDicts.length > 0 ? [...new Set(visibleDicts)] : SUPPORTED_DICT_LANGS,
    };
};

export const UserProvider = ({ children }) => {
    const { syncProgress } = useAuth();
    // Default Persona: 25 year old male
    const [userProfile, setUserProfile] = useState(() => {
        const saved = localStorage.getItem('vnme_user_profile');
        if (!saved) return DEFAULT_PROFILE;
        try {
            return normalizeProfile(JSON.parse(saved));
        } catch {
            return DEFAULT_PROFILE;
        }
    });

    useEffect(() => {
        localStorage.setItem('vnme_user_profile', JSON.stringify(userProfile));
        syncProgress?.();
    }, [userProfile]);

    const updateUserProfile = (newProfile) => {
        setUserProfile(prev => normalizeProfile({ ...prev, ...newProfile }));
    };

    return (
        <UserContext.Provider value={{ userProfile, updateUserProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
