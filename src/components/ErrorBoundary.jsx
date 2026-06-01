import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error caught by Boundary:", error, errorInfo);
        
        // Check if it's a chunk load error and we haven't reloaded yet
        const errorString = error?.toString() || '';
        if (errorString.includes('ChunkLoadError') || errorString.includes('Failed to fetch dynamically imported module')) {
            const lastReload = window.localStorage.getItem('jindungo_last_chunk_error');
            const now = Date.now();
            
            // Only auto-reload if we haven't done it in the last 10 seconds to avoid loops
            if (!lastReload || now - parseInt(lastReload) > 10000) {
                window.localStorage.setItem('jindungo_last_chunk_error', now.toString());
                window.location.reload();
                return;
            }
        }
    }

    handleReload = () => {
        // Clear all reload flags just in case
        window.localStorage.removeItem('jindungo_page_reloaded');
        window.localStorage.removeItem('jindungo_last_chunk_error');
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 text-white overflow-hidden relative">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] animate-pulse"></div>
                    
                    <div className="relative z-10 max-w-lg w-full bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
                            <AlertCircle size={40} className="text-red-500" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 tracking-tight">Ocorreu um Erro</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed text-sm sm:text-base">
                            Pedimos desculpa, ocorreu um erro inesperado que impediu o carregamento da página. 
                            Isto costuma acontecer quando existe uma nova versão disponível.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="w-full group flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95"
                        >
                            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                            <span>Recarregar Aplicação</span>
                        </button>

                        <div className="mt-10 pt-8 border-t border-white/5 w-full text-left">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-3">Detalhes Técnicos (Debug)</p>
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 max-h-[160px] overflow-auto">
                                <pre className="text-[10px] font-mono text-red-400/80 break-all whitespace-pre-wrap">
                                    {this.state.error && (this.state.error.stack || this.state.error.toString())}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
