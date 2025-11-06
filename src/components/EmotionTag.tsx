import React from 'react';
import { motion } from 'framer-motion';
import type { Tag } from '../types';
import { RippleEffect } from './RippleEffect';
import { useAnimation, useEmotionAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS, emotionAnimations } from '../lib/animations';

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
  const { shouldAnimate } = useAnimation();
  const emotionAnimation = useEmotionAnimation(tag.id);

  const sizeClasses = {
    sm: 'min-w-[60px] h-12 px-8 text-caption',
    md: 'min-w-[72px] h-14 px-12 text-body-small',
  };
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-full font-medium cursor-pointer relative overflow-hidden';
  const selectedClasses = selected 
    ? 'shadow-lg transition-transform duration-300' 
    : 'opacity-70 hover:opacity-90 transition-all duration-300';

  // 根据情绪获取对应的动画配置
  const getEmotionSpecificAnimation = () => {
    const baseAnimation = emotionAnimations[tag.id as keyof typeof emotionAnimations];
    return baseAnimation || emotionAnimations.calm;
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${selectedClasses}`}
      style={{
        background: tag.color,
        // 确保标签始终可见
        transform: "scale(1)"
      }}
      // 磁性吸附动画
      whileHover={shouldAnimate() ? {
        transform: `scale(${selected ? 1.08 : 1.05})`,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 15,
        }
      } : undefined}
      whileTap={shouldAnimate() ? {
        transform: "scale(0.95)",
        transition: {
          type: "spring",
          stiffness: 600,
          damping: 10,
        }
      } : undefined}
      // 情绪特定的动画 - 修正：只有在选中时才应用动画，避免干扰默认显示
      animate={shouldAnimate() && selected ? getEmotionSpecificAnimation() : undefined}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* 水波纹效果 */}
      <RippleEffect
        rippleColor="rgba(255, 255, 255, 0.3)"
        disabled={false}
      >
        <div className="flex items-center gap-2">
          {/* 图标 */}
          {tag.icon && (
            <span>
              {tag.icon}
            </span>
          )}
          
          {/* 文字 */}
          <span className="text-white drop-shadow-sm relative z-10">
            {tag.name}
          </span>

          {/* 选中状态指示器 */}
          {selected && (
            <div className="absolute inset-0 rounded-full border-2 border-white opacity-50" />
          )}
        </div>
      </RippleEffect>

      {/* 发光效果 */}
      {selected && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.button>
  );
};
