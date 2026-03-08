import React from 'react';

const Skeleton = ({ width, height, variant = 'rect', style, className = '' }) => {
    const baseStyle = {
        width: width || '100%',
        height: height || '1rem',
        backgroundColor: '#e2e8f0',
        borderRadius: variant === 'circle' ? '50%' : '4px',
        ...style
    };

    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={baseStyle}
        />
    );
};

export default Skeleton;
