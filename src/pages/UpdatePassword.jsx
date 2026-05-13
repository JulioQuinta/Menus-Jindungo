import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Key, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError("A palavra-passe deve ter no mínimo 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            toast.success("Palavra-passe atualizada com sucesso!");
            setTimeout(() => navigate('/admin'), 2000);
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
                             <Key size={32} className="text-[#D4AF37]" />
                        </div>
                        <h2 className="text-3xl font-serif font-black text-white tracking-tight mb-2">Nova Senha</h2>
                        <p className="text-gray-500 text-sm">Defina a sua nova credencial de acesso.</p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-300 text-xs animate-shake text-center">
                                {error}
                            </div>
                        )}

                        <div className="relative group/field">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm font-mono"
                                placeholder="••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {loading ? 'A guardar...' : 'Atualizar Senha'}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 flex items-center justify-center gap-4 opacity-20 pointer-events-none">
                         <ShieldCheck size={14} className="text-white" />
                         <span className="text-[9px] text-white font-black tracking-[0.3em] uppercase">Conexão Encriptada</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
