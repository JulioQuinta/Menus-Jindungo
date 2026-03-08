import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Skeleton from './Skeleton';

const SmartImage = ({ src, alt, className = '', style = {}, borderRadius = '0' }) => {
    const { isLowEnd } = useNetworkStatus();
    const [loaded, setLoaded] = useState(false);
    const [finalSrc, setFinalSrc] = useState('');

    useEffect(() => {
        if (!src) return;

        let targetUrl = src;

        // Optimization for Supabase Storage or Unsplash if used
        if (isLowEnd) {
            // If it's Unsplash, use their API
            if (src.includes('images.unsplash.com')) {
                targetUrl = src.replace('w=400', 'w=200&q=40');
            }
            // If Supabase (checking by common pattern or domain if known), 
            // supabase storage doesn't have on-the-fly transformations unless using specific resizing proxy,
            // but we can simulate logic or add query params if we had a transformer. 
            // For now, we assume Unsplash or standard serving.
        }

        setFinalSrc(targetUrl);
    }, [src, isLowEnd]);

    return (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius, ...style }} className={className}>
            {/* Placeholder Skeleton while loading */}
            {!loaded && (
                <Skeleton
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                />
            )}

            {finalSrc && (
                <img
                    src={finalSrc}
                    alt={alt}
                    onLoad={() => setLoaded(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.5s ease-in-out',
                        display: 'block'
                    }}
                />
            )}
        </div>
    );
};

export default SmartImage;
