import React from 'react';
import { toast } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        toast.error("Ocorreu um erro inesperado. Por favor, recarregue a página.");
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', background: 'red', color: 'white', wordBreak: 'break-word', overflow: 'auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>ERRO FATAL NO IOS (DEBUG)</h1>
                        <p>Por favor, tire um print desta tela e envie para o suporte:</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px' }}>
                        <h3 style={{ fontWeight: 'bold' }}>Mensagem de Erro:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error && this.state.error.toString()}</pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
