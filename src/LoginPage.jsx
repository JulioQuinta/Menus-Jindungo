import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, User, ChefHat, Briefcase } from 'lucide-react'; // Using icons for visual cues

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [loginType, setLoginType] = useState('restaurant'); // 'restaurant' or 'internal'
    const [errorShake, setErrorShake] = useState(false);
    const { signIn, user, role } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user && role) {
            console.log("LOGIN REDIRECT - User Role Is:", role);
            if (role === 'super_admin') navigate('/super-admin');
            else if (role === 'admin' || role === 'owner') navigate('/admin');
            else navigate('/menu');
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            toast.success("Bem-vindo de volta!");
        } catch (error) {
            console.error(error);
            console.error(error);
            // Shake animation for lock icon and form
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);

            const form = document.getElementById('login-form');
            form.classList.add('animate-shake');
            setTimeout(() => form.classList.remove('animate-shake'), 500);

            toast.error("Credenciais inválidas. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#121212]">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#D4AF37]/10 blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]"></div>
            </div>

            {/* Login Card */}
            <div className={`relative z-10 w-full max-w-md px-6 transition-all duration-1000 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                <div className="glass-dark border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 rounded-full bg-primary/10 mb-5 border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                            <span className="text-4xl font-serif text-primary drop-shadow-md">Mj</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white tracking-tight mb-2">
                            Menús Jindungo
                        </h2>
                        <p className="text-gray-400 text-sm font-light tracking-wide uppercase">
                            Acesso Premium
                        </p>
                    </div>

                    {/* Type Toggle */}
                    <div className="flex bg-black/40 p-1.5 rounded-xl mb-6 relative border border-white/5">
                        {/* Sliding Background */}
                        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.1)] ${loginType === 'restaurant' ? 'left-1.5' : 'left-[50%]'}`}></div>

                        <button
                            type="button"
                            onClick={() => setLoginType('restaurant')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors ${loginType === 'restaurant' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ChefHat size={18} />
                            Restaurante
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType('internal')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors ${loginType === 'internal' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Briefcase size={18} />
                            Gestão
                        </button>
                    </div>

                    {/* Type Description */}
                    <div className="text-center mb-8 px-4 h-5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2 animate-fade-in">
                            {loginType === 'restaurant' ? (
                                <>
                                    <span className="w-4 h-[1px] bg-gray-700"></span>
                                    Painel do Lojista & Ementas
                                    <span className="w-4 h-[1px] bg-gray-700"></span>
                                </>
                            ) : (
                                <>
                                    <span className="w-4 h-[1px] bg-gray-700"></span>
                                    Administração SaaS Jindungo
                                    <span className="w-4 h-[1px] bg-gray-700"></span>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Form */}
                    <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div className="group relative">
                                <User className="absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors duration-300" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300"
                                    placeholder={loginType === 'restaurant' ? "email@restaurante.com" : "admin@jindungo.com"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="group relative">
                                <Lock
                                    className={`absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors duration-300 ${errorShake ? 'animate-shake text-error' : ''}`}
                                    size={20}
                                />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300"
                                    placeholder="Sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-white/5 text-primary focus:ring-primary/50" />
                                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar de mim</span>
                            </label>
                            <Link to="/forgot-password" className="text-xs text-primary/80 hover:text-primary transition-colors hover:underline">
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-4 rounded-xl font-bold text-black bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 uppercase tracking-wide text-sm"
                        >
                            {loading ? 'Acessando...' : 'Entrar na Plataforma'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Novo por aqui? <span className="text-primary font-semibold hover:underline">Criar conta</span>
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-600 font-mono">SECURE ACCESS • JINDUNGO SYSTEMS</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
