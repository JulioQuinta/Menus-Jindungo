import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Um Error Boundary localizado para evitar que um erro num widget (ex: gráfico)
 * deite abaixo o ecrã inteiro do utilizador.
 */
class ComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`Error caught by Component Boundary in ${this.props.componentName || 'a component'}:`, error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={`flex flex-col items-center justify-center p-6 bg-red-900/10 border border-red-500/20 rounded-2xl text-center ${this.props.className || ''}`}>
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Falha ao carregar secção</h3>
                    <p className="text-xs text-gray-400 max-w-xs mb-4">
                        Ocorreu um erro temporário neste componente. O resto da página continua a funcionar.
                    </p>
                    <button 
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"
                    >
                        <RefreshCw size={14} />
                        Tentar Novamente
                    </button>
                    {import.meta.env.DEV && (
                        <div className="mt-4 p-2 bg-black/50 rounded text-left overflow-auto max-h-32 text-[10px] text-red-400 w-full">
                            {this.state.error?.toString()}
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ComponentErrorBoundary;
