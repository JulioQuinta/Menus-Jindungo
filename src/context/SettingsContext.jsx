import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SettingsContext = createContext({});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState('/jindungo_logo_v3.png');
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoadingSettings(true);
            const { data, error } = await supabase
                .from('app_settings')
                .select('logo_url')
                .eq('id', 'global')
                .single();

            if (data && data.logo_url) {
                setLogoUrl(data.logo_url);
            }
        } catch (err) {
            console.error('Error fetching global settings:', err);
        } finally {
            setLoadingSettings(false);
        }
    };

    const updateLogoUrl = async (newUrl) => {
        try {
            const { error } = await supabase
                .from('app_settings')
                .update({ logo_url: newUrl, updated_at: new Date().toISOString() })
                .eq('id', 'global');

            if (error) throw error;
            setLogoUrl(newUrl);
            return { success: true };
        } catch (error) {
            console.error('Error updating logo:', error);
            return { error };
        }
    };

    return (
        <SettingsContext.Provider value={{ logoUrl, updateLogoUrl, loadingSettings, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
