import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌶️ Jindungo</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                Crie o menu digital do seu restaurante em minutos.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/demo" style={{
                    padding: '1rem 2rem',
                    background: 'white',
                    color: '#ff6b6b',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    Ver Demo
                </Link>
                <Link to="/login" style={{
                    padding: '1rem 2rem',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid white',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                }}>
                    Acesso SaaS (Entrar)
                </Link>
            </div>
        </div>
    );
};

export default LandingPage;
