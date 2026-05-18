import React, { useState, useEffect, useRef } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Skeleton from './Skeleton';

const SmartImage = ({ src, alt, className = '', style = {}, borderRadius = '0' }) => {
    const { isLowEnd } = useNetworkStatus();
    const [loaded, setLoaded] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef(null);

    const finalSrc = React.useMemo(() => {
        if (!src) return '';
        let targetUrl = src;
        if (isLowEnd && src.includes('images.unsplash.com')) {
            return src.replace('w=400', 'w=200&q=40');
        }
        return targetUrl;
    }, [src, isLowEnd]);

    useEffect(() => {
        const currentElement = containerRef.current;
        if (!currentElement) {
            setShouldShow(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setShouldShow(true);
                observer.disconnect();
            }
        }, { rootMargin: '300px' });

        observer.observe(currentElement);

        return () => {
            observer.disconnect();
        };
    }, [finalSrc]);

    const isFallback = !finalSrc || hasError;

    return (
        <div 
            ref={containerRef}
            style={{ position: 'relative', overflow: 'hidden', borderRadius, minHeight: '100px', ...style }} 
            className={className}
        >
            {(!loaded || !shouldShow) && !isFallback && (
                <Skeleton
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                />
            )}

            {isFallback ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1C] via-[#222222] to-[#141414] flex flex-col items-center justify-center text-center p-3 border border-white/5">
                    <span className="text-3xl filter drop-shadow-[0_4px_10px_rgba(229,194,123,0.3)]">🍽️</span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 mt-2 tracking-widest line-clamp-1">{alt || 'Iguaria'}</span>
                </div>
            ) : shouldShow && (
                <img
                    src={finalSrc}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    onError={() => setHasError(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.4s ease-in-out',
                        display: 'block'
                    }}
                />
            )}
        </div>
    );
};

export default SmartImage;
