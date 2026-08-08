/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async (session) => {
            if (session?.user) {
                try {
                    console.log("Fetching Profile for:", session.user.id);
                    // Handle offline role fallback
                    if (!navigator.onLine) {
                        const cachedRole = localStorage.getItem(`jindungo_role_${session.user.id}`);
                        setRole(cachedRole || 'client');
                        setUser(session.user);
                        setLoading(false);
                        return;
                    }

                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role, status')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    console.log("Profile Data Received:", data);
                    if (error) {
                        console.error("Supabase Profile Error:", error);
                        const cachedRole = localStorage.getItem(`jindungo_role_${session.user.id}`);
                        setRole(cachedRole || 'client');
                    } else if (data) {
                        console.log("Profile Status:", data.status, "Role:", data.role);
                        if (data.status === 'banned') {
                            await supabase.auth.signOut();
                            alert("Sua conta foi suspensa.");
                            return;
                        }
                        if (data.status === 'pending') {
                            await supabase.auth.signOut();
                            alert("O seu pedido de acesso foi recebido e está a aguardar aprovação da nossa equipa. Entraremos em contacto brevemente!");
                            return;
                        }
                        localStorage.setItem(`jindungo_role_${session.user.id}`, data.role || 'client');
                        setRole(data.role || 'client');
                    } else {
                        // No profile found
                        console.warn("No profile found for user:", session.user.id);
                        const cachedRole = localStorage.getItem(`jindungo_role_${session.user.id}`);
                        setRole(cachedRole || 'client');
                    }
                } catch (err) {
                    console.error("Unexpected Profile Fetch Error:", err);
                    const cachedRole = localStorage.getItem(`jindungo_role_${session.user.id}`);
                    setRole(cachedRole || 'client');
                }
                setUser(session.user);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        };

        // Offline Session check first
        const offlineSessionRaw = localStorage.getItem('jindungo_offline_session');
        if (offlineSessionRaw && !navigator.onLine) {
            try {
                const offlineSession = JSON.parse(offlineSessionRaw);
                setUser(offlineSession.user);
                setRole(offlineSession.role);
                setLoading(false);
            } catch (e) {
                console.error("Error reading offline session", e);
                // Real Supabase Flow
                supabase.auth.getSession().then(({ data: { session } }) => {
                    fetchProfile(session);
                }).catch(err => {
                    console.error("Auth Init Error:", err);
                    setLoading(false);
                });
            }
        } else {
            // Real Supabase Flow
            supabase.auth.getSession().then(({ data: { session } }) => {
                fetchProfile(session);
            }).catch(err => {
                console.error("Auth Init Error:", err);
                setLoading(false);
            });
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const offlineSessionPresent = localStorage.getItem('jindungo_offline_session');
            if (offlineSessionPresent && !navigator.onLine) return;
            fetchProfile(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const cleanEmail = (email || '').trim().toLowerCase();
        console.log("Attempting Login. Email:", cleanEmail, "Online:", navigator.onLine);

        if (!navigator.onLine) {
            let offlineCreds = null;
            const offlineCredsRaw = localStorage.getItem('jindungo_offline_credentials');
            console.log("Offline login credentials from local storage:", offlineCredsRaw);
            
            if (offlineCredsRaw) {
                try {
                    offlineCreds = JSON.parse(offlineCredsRaw);
                } catch (e) {
                    console.error("Error parsing offline credentials", e);
                }
            }

            // Fallback for Julio's test credentials to allow 100% offline client login without first online connection
            if (!offlineCreds && cleanEmail === 'quintajulio8@hotmail.com' && password === '123456') {
                console.log("[AuthContext] Seeding default offline credentials fallback for developer...");
                offlineCreds = {
                    email: 'quintajulio8@hotmail.com',
                    password: '123456',
                    profile: { id: '0640ac07-e28e-45e6-bc36-cbd3db085470', role: 'admin' }
                };
                localStorage.setItem('jindungo_offline_credentials', JSON.stringify(offlineCreds));
            }

            if (offlineCreds) {
                const cachedEmail = (offlineCreds.email || '').trim().toLowerCase();
                
                console.log("Offline comparison details:", {
                    cachedEmail,
                    inputEmail: cleanEmail,
                    emailMatches: cachedEmail === cleanEmail,
                    passwordMatches: offlineCreds.password === password
                });

                if (cachedEmail === cleanEmail && offlineCreds.password === password) {
                    const mockSession = {
                        user: { id: offlineCreds.profile.id, email: offlineCreds.email },
                        role: offlineCreds.profile.role
                    };
                    setUser(mockSession.user);
                    setRole(mockSession.role);
                    localStorage.setItem('jindungo_offline_session', JSON.stringify(mockSession));
                    console.log("Offline login successful! Mock session cached.");
                    return { data: { user: mockSession.user }, error: null };
                }
            }
            return { data: null, error: { message: "Sem ligação à internet e sem credenciais locais válidas." } };
        }

        const result = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!result.error && result.data?.user) {
            localStorage.removeItem('jindungo_offline_session');
        }
        return result;
    };

    const signUp = (email, password, options) => {
        return supabase.auth.signUp({ email, password, options });
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error during sign out:", error);
        } finally {
            localStorage.removeItem('masquerade_restaurant_id');
            localStorage.removeItem('jindungo_offline_session');
            setUser(null);
            setRole(null);
        }
    };

    const value = {
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff' }}>
                    Loading...
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
