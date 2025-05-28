'use client';

import React, { FC } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableSignatureProps {
  id: string; 
  signatureImage: string;
  style?: React.CSSProperties; 
}

const DraggableSignature: FC<DraggableSignatureProps> = ({ id, signatureImage, style }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const combinedStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.7 : 1, // Slightly more visible when dragging
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'inline-block', 
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    borderRadius: '0.375rem', // rounded-md
    transition: 'opacity 0.15s ease-in-out, box-shadow 0.15s ease-in-out', // Smooth transition for opacity and shadow
  };

  if (!signatureImage) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...listeners}
      {...attributes}
      className="touch-none p-1 bg-white" // Added small padding and bg for shadow visibility
    >
      <img
        src={signatureImage}
        alt="Draggable Signature"
        className="max-w-full h-auto block" // block display to contain within parent padding
        style={{ maxHeight: '80px' }} // Slightly smaller than the display in SignaturePad for visual distinction
      />
    </div>
  );
};

export default DraggableSignature;
