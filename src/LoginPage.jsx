import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, User, ChefHat, Briefcase, Eye, EyeOff, Sparkles, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSettings } from './context/SettingsContext';
import { supabase } from './lib/supabaseClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [loginType, setLoginType] = useState('restaurant'); // 'restaurant' | 'internal'
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
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
                toast.error("A sua conta está em análise. Aguarde o nosso contacto.", { duration: 6000 });
                setErrorShake(true);
                return;
            }

            if (loginType === 'restaurant' && fetchedRole === 'super_admin') {
                await supabase.auth.signOut();
                toast.error("Utilize a aba de Gestão para entrar como Super Admin.");
                setErrorShake(true);
                return;
            }
            if (loginType === 'internal' && fetchedRole !== 'super_admin') {
                await supabase.auth.signOut();
                toast.error("Acesso restrito à Administração da Plataforma.");
                setErrorShake(true);
                return;
            }

            toast.success("Bem-vindo de volta aos Menús Jindungo!");
        } catch (error) {
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);
            toast.error("Dados de acesso incorretos. Verifique o seu e-mail e palavra-passe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0B0B0C] font-sans selection:bg-[#D4AF37] selection:text-black p-4 sm:p-6 md:p-8">
            
            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-[#D4AF37]/50 text-white hover:text-[#D4AF37] transition-all flex items-center justify-center shadow-lg"
                    title="Voltar ao Início"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>
            
            {/* Pristine Deep Matte Background with Soft Golden Aura matching screenshot */}
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <div className="absolute w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] bg-gradient-to-r from-[#D4AF37]/15 via-amber-500/10 to-[#D4AF37]/15 blur-[150px] rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_transparent_80%)]"></div>
            </div>

            {/* Main Centered Login Container matching screenshot */}
            <div className={`relative z-10 w-full max-w-[460px] transition-all duration-1000 ease-out transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}>
                
                {/* Masterpiece Glassmorphic Card matching screenshot */}
                <div className="relative group">
                    {/* Outer Golden Glow Border */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-[#D4AF37]/60 via-[#D4AF37]/20 to-[#D4AF37]/40 rounded-[2.5rem] blur-[2px] opacity-80"></div>
                    
                    <div className="relative bg-gradient-to-b from-[#1C1814]/90 via-[#15120F]/90 to-[#100D0B]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-[#D4AF37]/40 overflow-hidden">
                        
                        {/* Diagonal Glass Sheen overlay matching screenshot */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/[0.08] pointer-events-none" />

                        {/* Top Chili & Golden Leaves Emblem matching screenshot */}
                        <div className="text-center mb-8 relative z-10 select-none">
                            <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-md animate-pulse"></div>
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Piri-piri" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] relative z-10" />
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white uppercase tracking-wider bg-gradient-to-r from-white via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent mb-2">
                                Menús Jindungo
                            </h1>
                            
                            <div className="flex items-center justify-center gap-3 opacity-60">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Acesso Exclusivo</span>
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]"></div>
                            </div>
                        </div>

                        {/* Role Switcher Pills matching screenshot */}
                        <div className="flex bg-[#0D0B09]/90 p-1.5 rounded-full mb-8 border border-white/10 shadow-inner relative z-10 select-none">
                            <button
                                type="button"
                                onClick={() => setLoginType('restaurant')}
                                className={`flex-1 py-3 text-xs font-black rounded-full transition-all duration-500 uppercase tracking-wider flex items-center justify-center gap-2 ${
                                    loginType === 'restaurant' 
                                        ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]' 
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <ChefHat size={14} /> Restaurante
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType('internal')}
                                className={`flex-1 py-3 text-xs font-black rounded-full transition-all duration-500 uppercase tracking-wider flex items-center justify-center gap-2 ${
                                    loginType === 'internal' 
                                        ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]' 
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Briefcase size={14} /> Gestão
                            </button>
                        </div>

                        {/* Form Area matching screenshot */}
                        <form className={`space-y-6 relative z-10 ${errorShake ? 'animate-shake' : ''}`} onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-[#12100E] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all text-sm shadow-inner"
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
                                        className="w-full bg-[#12100E] border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all text-sm shadow-inner"
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

                            {/* Toggle Switch Remember me & Forgot Password matching screenshot */}
                            <div className="flex items-center justify-between px-1 text-xs pt-1 select-none">
                                <div 
                                    className="flex items-center gap-2.5 cursor-pointer group"
                                    onClick={() => setRememberMe(!rememberMe)}
                                >
                                    <div className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center ${
                                        rememberMe ? 'bg-[#D4AF37]' : 'bg-[#2A2415]'
                                    }`}>
                                        <div className={`w-4 h-4 rounded-full bg-black shadow-md transition-transform ${
                                            rememberMe ? 'translate-x-4' : 'translate-x-0'
                                        }`} />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white transition-colors font-light">Manter sessão</span>
                                </div>
                                <Link to="/forgot-password" className="text-[#D4AF37] hover:underline font-bold transition-all">
                                    Recuperar acesso?
                                </Link>
                            </div>

                            {/* Main CTA Button matching screenshot */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black font-black py-4.5 rounded-full uppercase tracking-widest text-xs shadow-[0_10px_35px_rgba(212,175,55,0.4)] hover:shadow-[0_15px_45px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 mt-8 mb-4 group border border-amber-300"
                            >
                                <span>{loading ? 'A validar credenciais...' : 'Entrar na Plataforma'}</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Register Link matching screenshot */}
                <div className="mt-8 text-center select-none">
                    <p className="text-xs text-gray-400">
                        Não tem uma conta? {' '}
                        <Link to="/register" className="text-[#D4AF37] font-black hover:underline flex items-center justify-center gap-1 inline-flex tracking-wider">
                            Solicitar Adesão
                        </Link>
                    </p>
                </div>

                {/* Footer security badge & version */}
                <div className="mt-8 text-center flex flex-col items-center gap-2 select-none opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold tracking-widest uppercase">
                        <Shield size={12} className="text-[#D4AF37]" /> Criptografia Avançada 256-BIT
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono tracking-wider">© 2026 MENUS JINDUNGO PLATAFORMA GLOBAL</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
