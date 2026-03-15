import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children, useHandle = false }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative',
        touchAction: 'none'
    };

    const context = { attributes, listeners };

    return (
        <div ref={setNodeRef} style={style} {...(!useHandle ? { ...attributes, ...listeners } : {})}>
            {typeof children === 'function' ? children(context) : children}
        </div>
    );
}
