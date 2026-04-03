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
        // [MODIFIED] Se usarmos handle, o container DEVE permitir scroll (manipulation ou auto)
        // Só bloqueamos se não houver handle (uso antigo)
        touchAction: useHandle ? 'auto' : 'none'
    };

    // [MODIFIED] Passamos as listeners para o componente filho (handle)
    const context = { 
        attributes, 
        listeners: {
            ...listeners,
            // Opcional: garantir que o handle tenha touch-action none
            style: { touchAction: 'none' } 
        } 
    };

    return (
        <div ref={setNodeRef} style={style} {...(!useHandle ? { ...attributes, ...listeners } : {})}>
            {typeof children === 'function' ? children(context) : children}
        </div>
    );
}
