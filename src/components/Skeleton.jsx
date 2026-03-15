import React from 'react';

const Skeleton = ({ width, height, variant = 'rect', className = '', darkMode = false }) => {
    return (
        <div
            className={`
                animate-pulse 
                ${variant === 'circle' ? 'rounded-full' : 'rounded-xl'} 
                ${darkMode ? 'bg-white/5' : 'bg-gray-200'} 
                ${className}
            `}
            style={{
                width: width || '100%',
                height: height || '1rem'
            }}
        />
    );
};

export default Skeleton;
