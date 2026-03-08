import React from 'react';

const SearchBar = ({ value, onChange, placeholder = "🔍 Procurar prato..." }) => {
    return (
        <div style={{
            position: 'sticky',
            top: '0',
            zIndex: 90,
            background: 'var(--bg-primary, #f7fafc)',
            padding: '1rem',
            paddingBottom: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingLeft: '40px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        fontSize: '1rem',
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        outline: 'none',
                        transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #e2e8f0)'}
                />
                <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    opacity: 0.5
                }}>
                    🔍
                </span>
                {value && (
                    <button
                        onClick={() => onChange('')}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#718096',
                            fontSize: '0.8rem'
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
