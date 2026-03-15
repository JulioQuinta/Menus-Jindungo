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
            background: '#121212',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient background blur */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', filter: 'blur(100px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(100px)' }}></div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/jindungo_logo_v3.png" style={{ width: '160px', height: '160px', objectFit: 'contain', borderRadius: '50%' }} alt="Logo" />
                <h1 style={{ fontSize: '3.5rem', margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: 'bold' }}>
                    <span style={{ color: '#D4AF37' }}>Jindungo</span>
                </h1>
            </div>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                A Revolução do Menu Digital em Angola
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', zIndex: 10, padding: '0 20px' }}>
                <Link to="/explorar" style={{
                    padding: '1.2rem 2.5rem',
                    background: 'rgba(212,175,55,0.1)',
                    color: '#D4AF37',
                    border: '1px solid #D4AF37',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    backdropFilter: 'blur(10px)'
                }}>
                    Explorar Restaurantes
                </Link>
                <Link to="/login" style={{
                    padding: '1.2rem 2.5rem',
                    background: '#D4AF37',
                    color: 'black',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 30px rgba(212,175,55,0.3)',
                    transition: 'all 0.3s'
                }}>
                    Acesso Admin (Entrar)
                </Link>
            </div>
        </div>
    );
};

export default LandingPage;
