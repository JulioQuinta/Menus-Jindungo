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
                    // Use maybeSingle() to avoid error if no row exists
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role, status')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    console.log("Profile Data Received:", data);
                    if (error) {
                        console.error("Supabase Profile Error:", error);
                        // Don't crash, just use default role
                        setRole('client');
                    } else if (data) {
                        console.log("Profile Status:", data.status, "Role:", data.role);
                        if (data.status === 'banned') {
                            await supabase.auth.signOut();
                            alert("Sua conta foi suspensa.");
                            return;
                        }
                        setRole(data.role || 'client');
                    } else {
                        // No profile found
                        console.warn("No profile found for user:", session.user.id);
                        setRole('client');
                    }
                } catch (err) {
                    console.error("Unexpected Profile Fetch Error:", err);
                    setRole('client');
                }
                setUser(session.user);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        };

        // Real Supabase Flow
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchProfile(session);
        }).catch(err => {
            console.error("Auth Init Error:", err);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Only fetch if session changed significantly or exists?
            // Actually, fetchProfile handles session=null effectively.
            fetchProfile(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = (email, password) => {
        return supabase.auth.signUp({ email, password });
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error during sign out:", error);
        } finally {
            localStorage.removeItem('masquerade_restaurant_id');
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
