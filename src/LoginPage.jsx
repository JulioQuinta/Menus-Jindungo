import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, User, ChefHat, Briefcase, Eye, EyeOff, Shield } from 'lucide-react';
import { useSettings } from './context/SettingsContext';
import { supabase } from './lib/supabaseClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [loginType, setLoginType] = useState('restaurant'); // 'restaurant' or 'internal'
    const [showPassword, setShowPassword] = useState(false);
    const [errorShake, setErrorShake] = useState(false);
    const { signIn, user, role } = useAuth();
    const navigate = useNavigate();
    const { logoUrl } = useSettings();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && user && role) {
            if (role === 'super_admin') navigate('/super-admin');
            else if (role === 'admin' || role === 'owner') navigate('/admin');
            else navigate('/menu');
        }
    }, [user, role, navigate, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData, error } = await signIn(email, password);
            if (error) throw error;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', authData.user.id)
                .single();
            
            const fetchedRole = profile?.role || 'client';
            const fetchedStatus = profile?.status || 'active';

            if (fetchedStatus === 'pending') {
                await supabase.auth.signOut();
                toast.error("A sua conta está em análise. Aguarde contacto.", { duration: 6000 });
                setErrorShake(true);
                return;
            }

            if (loginType === 'restaurant' && fetchedRole === 'super_admin') {
                await supabase.auth.signOut();
                toast.error("Utilize a aba de Gestão.");
                setErrorShake(true);
                return;
            }
            if (loginType === 'internal' && fetchedRole !== 'super_admin') {
                await supabase.auth.signOut();
                toast.error("Acesso restrito à Administração.");
                setErrorShake(true);
                return;
            }

            toast.success("Bem-vindo aos Menús Jindungo!");
        } catch (error) {
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);
            toast.error("Dados de acesso incorretos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0A0A] font-sans selection:bg-[#D4AF37] selection:text-black">
            {/* Animated Refraction Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-white/5 to-transparent blur-[120px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            {/* Login Card */}
            <div className={`relative z-10 w-full max-w-[440px] px-6 transition-all duration-1000 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                
                <div className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/20 rounded-[2.5rem] blur-sm"></div>
                    
                    <div className="relative bg-[#111111]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10">
                        
                        {/* Header Area */}
                        <div className="text-center mb-10">
                            <div className="relative inline-block mb-6 group/logo">
                                <div className="absolute inset-0 bg-[#D4AF37] blur-3xl opacity-20 group-hover/logo:opacity-40 transition-opacity duration-700"></div>
                                <div className="relative p-1 bg-gradient-to-b from-white/10 to-transparent rounded-3xl border border-white/10 shadow-2xl">
                                    <img 
                                        src={logoUrl || "/jindungo_logo_v3.png"} 
                                        className="w-24 h-24 object-contain brightness-110 drop-shadow-2xl" 
                                        alt="Jindungo Premium Logo" 
                                    />
                                </div>
                            </div>
                            
                            <h1 className="text-3xl font-serif font-black text-white tracking-tight mb-2">
                                Menús <span className="text-[#D4AF37]">Jindungo</span>
                            </h1>
                            
                            <div className="flex items-center justify-center gap-3 opacity-60">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/40"></div>
                                <span className="text-[9px] font-display text-gray-300">Acesso Exclusivo</span>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/40"></div>
                            </div>
                        </div>

                        {/* Login Type Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5 backdrop-blur-md font-display">
                            <button
                                type="button"
                                onClick={() => setLoginType('restaurant')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-medium rounded-xl transition-all duration-500 ${loginType === 'restaurant' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <ChefHat size={16} />
                                RESTAURANTE
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType('internal')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-medium rounded-xl transition-all duration-500 ${loginType === 'internal' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Briefcase size={16} />
                                GESTÃO
                            </button>
                        </div>

                        {/* Form Area */}
                        <form className={`space-y-6 ${errorShake ? 'animate-shake' : ''}`} onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all duration-300 text-sm"
                                        placeholder={loginType === 'restaurant' ? "E-mail do Restaurante" : "E-mail Administrativo"}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all duration-300 text-sm"
                                        placeholder="Palavra-passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#D4AF37] focus:ring-offset-0 focus:ring-[#D4AF37]/50" />
                                    <span className="text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors">Manter sessão</span>
                                </label>
                                <Link to="/forgot-password" size="xs" className="text-[11px] text-[#D4AF37]/80 hover:text-[#D4AF37] hover:underline font-bold transition-all">
                                    Recuperar acesso?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group relative overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? 'A validar...' : 'Entrar na Plataforma'}
                                </span>
                            </button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-10 text-center">
                            <p className="text-sm text-gray-500">
                                Não tem uma conta? {' '}
                                <Link to="/register" className="text-[#D4AF37] font-black hover:underline underline-offset-4 decoration-2">
                                    Solicitar Adesão
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="flex items-center gap-2 text-white/50 text-[9px] font-black tracking-widest">
                            <Shield size={10} /> PROTEÇÃO BIOMÉTRICA ATIVA
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-700 font-mono">© 2026 MENÚS JINDUNGO • VER 3.1.2</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
