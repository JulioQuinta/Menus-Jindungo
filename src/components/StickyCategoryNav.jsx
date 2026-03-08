import React from 'react';

const StickyCategoryNav = ({ categories, activeCategory, onSelectCategory }) => {
    return (
        <div className="sticky-nav">
            <div className="nav-scroll-container">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        className={`nav-item ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => onSelectCategory(category.id)}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StickyCategoryNav;
