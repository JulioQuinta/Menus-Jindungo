import React, { createContext, useContext } from 'react';

const SettingsContext = createContext({});

export const useSettings = () => ({ logoUrl: '/jindungo_logo_v3.png', updateLogoUrl: async () => { }, loadingSettings: false });

export const SettingsProvider = ({ children }) => {
    return <>{children}</>;
};
