import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('As senhas não coincidem');
        }

        if (password.length < 6) {
            return setError('A senha deve ter pelo menos 6 caracteres');
        }

        setError('');
        setIsLoading(true);
        try {
            const { error } = await signUp(email, password);
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError('Falha ao cadastrar: ' + err.message);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
                {/* Background (Fixed) */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"
                        alt="Fine Dining"
                        className="w-full h-full object-cover opacity-40 blur-sm"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>

                <div className="relative z-10 p-8 bg-black/50 backdrop-blur-xl border border-green-500/30 rounded-2xl shadow-2xl text-center max-w-md w-full animate-fade-in-up">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-900/50">
                        <span className="text-4xl text-white">✓</span>
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-white mb-4">Bem-vindo!</h2>
                    <p className="text-lg text-gray-300">
                        Sua conta foi criada com sucesso.<br />
                        <span className="text-sm text-gray-400 mt-2 block">Redirecionando para o login...</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
            {/* Animated Background - Slow Zoom effect */}
            <div className={`absolute inset-0 z-0 transition-transform duration-[20s] ease-linear transform ${mounted ? 'scale-110' : 'scale-100'}`}>
                <img
                    src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"
                    alt="Fine Dining"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>

            {/* Register Card Container */}
            <div className={`relative z-10 w-full max-w-md px-6 transition-all duration-1000 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Glass Effect Card */}
                <div className="relative group">
                    {/* Glowing border effect behind the card */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>

                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">

                        {/* Header Section */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight mb-2">
                                Criar Conta
                            </h2>
                            <p className="text-gray-400 text-sm font-light tracking-wide">
                                Junte-se ao Jindungo e transforme seu menu
                            </p>
                        </div>

                        {/* Form Section */}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-200 flex items-start gap-3 animate-shake">
                                    <span className="text-lg">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="group/input">
                                    <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider ml-1 group-focus-within/input:text-red-400 transition-colors">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-300 backdrop-blur-sm"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="group/input">
                                    <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider ml-1 group-focus-within/input:text-red-400 transition-colors">Senha</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="group/input">
                                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider ml-1 group-focus-within/input:text-red-400 transition-colors">Confirmar Senha</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Repita a senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full relative group overflow-hidden py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 transition-all group-hover:from-red-600 group-hover:to-red-500"></div>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {isLoading ? 'Criando Conta...' : 'Começar Agora'} <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500">
                                Já tem uma conta?{' '}
                                <Link to="/login" className="font-semibold text-white hover:text-red-400 transition-colors border-b border-transparent hover:border-red-400 pb-0.5">
                                    Fazer Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer simple mark */}
                <div className="mt-8 text-center opacity-40">
                    <p className="text-xs text-white/50">&copy; 2026 Jindungo Systems</p>
                </div>
            </div>
        </div>
    );
};

export default Register;
