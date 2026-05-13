import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setMessage("Se existir uma conta com este e-mail, receberá um link de recuperação.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0A0A] font-sans">
            {/* Animated Refraction Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-white/5 to-transparent blur-[120px]"></div>
            </div>

            <div className={`relative z-10 w-full max-w-[440px] px-6 transition-all duration-1000 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                
                <div className="bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                    
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                             <ShieldCheck size={32} className="text-[#D4AF37]" />
                        </div>
                        <h2 className="text-3xl font-serif font-black text-white tracking-tight mb-2">Recuperar Senha</h2>
                        <p className="text-gray-500 text-sm">Introduza o seu e-mail de acesso.</p>
                    </div>

                    {message ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-[2rem] text-center">
                                <p className="text-green-300 text-sm leading-relaxed">{message}</p>
                            </div>
                            <Link to="/login" className="flex items-center justify-center gap-2 text-[#D4AF37] font-black uppercase tracking-widest text-[10px] hover:underline transition-all">
                                <ArrowLeft size={14} /> Voltar ao Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-300 text-xs animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group relative overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? 'A processar...' : 'Enviar Link de Redefinição'}
                                </span>
                            </button>

                            <div className="text-center pt-4">
                                <Link to="/login" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <ArrowLeft size={12} /> Voltar
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
