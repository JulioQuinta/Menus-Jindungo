import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Skeleton from './Skeleton';

const SmartImage = ({ src, alt, className = '', style = {}, borderRadius = '0' }) => {
    const { isLowEnd } = useNetworkStatus();
    const [loaded, setLoaded] = useState(false);

    const finalSrc = React.useMemo(() => {
        if (!src) return '';

        let targetUrl = src;

        // Optimization for Supabase Storage or Unsplash if used
        if (isLowEnd) {
            // If it's Unsplash, use their API
            if (src.includes('images.unsplash.com')) {
                return src.replace('w=400', 'w=200&q=40');
            }
            
            // If it's Supabase (and we have the optimization features enabled - Jindungo usually uses their own resizer if available)
            // For now, we can at least ensure we don't load huge raw images if the user provides a direct bucket link.
        }

        return targetUrl;
    }, [src, isLowEnd]);

    // Use Intersection Observer for manual trigger if browser lazy loading is slow
    const [shouldShow, setShouldShow] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setShouldShow(true);
                observer.disconnect();
            }
        }, { rootMargin: '200px' }); // Load 200px before appearing
        
        const el = document.getElementById(`img-container-${src}`);
        if (el) observer.observe(el);
        
        return () => observer.disconnect();
    }, [src]);

    return (
        <div 
            id={`img-container-${src}`}
            style={{ position: 'relative', overflow: 'hidden', borderRadius, ...style, minHeight: '100px' }} 
            className={className}
        >
            {/* Placeholder Skeleton while loading */}
            {(!loaded || !shouldShow) && (
                <Skeleton
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                />
            )}

            {shouldShow && finalSrc && (
                <img
                    src={finalSrc}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                        display: 'block'
                    }}
                />
            )}
        </div>
    );
};

export default SmartImage;
