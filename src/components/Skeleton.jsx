import React from 'react';

const Skeleton = ({ width, height, variant = 'rect', className = '', darkMode = true }) => {
    return (
        <div
            className={`
                relative overflow-hidden
                ${variant === 'circle' ? 'rounded-full' : 'rounded-2xl'} 
                ${darkMode ? 'bg-white/5 border border-white/5' : 'bg-gray-100'} 
                ${className}
            `}
            style={{
                width: width || '100%',
                height: height || '1rem'
            }}
        >
            {/* Shimmer Sweep - Needs large background size to move */}
            <div 
                className={`absolute inset-0 animate-shimmer`} 
                style={{
                    background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%)',
                    backgroundSize: '200% 100%'
                }}
            />
        </div>
    );
};

export default Skeleton;
