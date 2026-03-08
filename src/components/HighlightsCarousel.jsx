import React, { useEffect, useRef } from 'react';

const HighlightsCarousel = ({ items = [] }) => {
    const scrollRef = useRef(null);

    // Auto-scroll effect
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let scrollAmount = 0;
        const speed = 1; // Pixels per interval
        const step = () => {
            if (scrollContainer) {
                scrollContainer.scrollLeft += speed;
                scrollAmount += speed;

                // Reset transparency or loop if needed (simple implementation for now)
                // For a seamless loop we'd need to duplicate items, but let's keep it simple first
            }
        };

        const intervalId = setInterval(step, 50);

        // Pause on hover
        const stopScroll = () => clearInterval(intervalId);
        scrollContainer.addEventListener('mouseenter', stopScroll);
        scrollContainer.addEventListener('mouseleave', () => {
            // Restart logic could be here, but let's keep it simple: auto-scroll only runs initially or manually
        });

        return () => {
            clearInterval(intervalId);
            if (scrollContainer) {
                scrollContainer.removeEventListener('mouseenter', stopScroll);
            }
        };
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="highlights-section">
            <h3 className="highlights-title">✨ Sugestões do Chefe</h3>
            <div className="highlights-carousel" ref={scrollRef}>
                {items.map(item => (
                    <div key={item.id} className="highlight-card">
                        <img src={item.img} alt={item.name} />
                        <div className="highlight-info">
                            <span className="highlight-name">{item.name}</span>
                            <span className="highlight-price">{item.price}</span>
                        </div>
                        {item.badge && <span className="highlight-badge">{item.badge}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HighlightsCarousel;
