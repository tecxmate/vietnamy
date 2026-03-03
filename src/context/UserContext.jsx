import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // Default Persona: 25 year old male
    const [userProfile, setUserProfile] = useState(() => {
        const saved = localStorage.getItem('vnme_user_profile');
        return saved ? JSON.parse(saved) : { age: 25, gender: 'male', name: 'Bạn', goal: '', dialect: '', level: '', dailyMins: 10, dictMode: 'en' };
    });

    useEffect(() => {
        localStorage.setItem('vnme_user_profile', JSON.stringify(userProfile));
    }, [userProfile]);

    const updateUserProfile = (newProfile) => {
        setUserProfile(prev => ({ ...prev, ...newProfile }));
    };

    return (
        <UserContext.Provider value={{ userProfile, updateUserProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
