import React from 'react';
import type { Tag } from '../types';

interface EmotionTagProps {
  tag: Tag;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const EmotionTag: React.FC<EmotionTagProps> = ({
  tag,
  selected = false,
  onClick,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'min-w-[60px] h-12 px-8 text-caption',
    md: 'min-w-[72px] h-14 px-12 text-body-small',
  };
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-normal cursor-pointer';
  const selectedClasses = selected 
    ? 'shadow-md scale-105' 
    : 'opacity-60 hover:opacity-80 hover:scale-102';
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${selectedClasses}`}
      style={{
        background: tag.color,
      }}
    >
      {tag.icon && <span>{tag.icon}</span>}
      <span className="text-white drop-shadow-sm">{tag.name}</span>
    </button>
  );
};
