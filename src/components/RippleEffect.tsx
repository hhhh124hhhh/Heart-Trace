import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';

interface RippleEffectProps {
  children: React.ReactNode;
  disabled?: boolean;
  rippleColor?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

// 水波纹效果组件
export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  disabled = false,
  rippleColor = 'rgba(255, 255, 255, 0.5)',
  className = '',
  onClick,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const { shouldAnimate, getDuration } = useAnimation();

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    // 自动移除水波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, getDuration(600));
  }, [disabled, getDuration]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    createRipple(e);
    onClick?.(e);
  }, [createRipple, onClick]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      
      {/* 水波纹层 */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              className="absolute rounded-full"
              style={{
                // 使用transform代替直接修改位置和尺寸，避免强制重排
                width: 0,
                height: 0,
                backgroundColor: rippleColor,
                // 居中定位，后续通过transform缩放实现动画
                left: '50%',
                top: '50%',
              }}
              initial="hidden"
              animate="active"
              exit="hidden"
              variants={shouldAnimate() ? {
                hidden: { 
                  scale: 0, 
                  opacity: 0.8,
                  // 使用transform代替size动画，避免重排
                  transform: `translate(-50%, -50%) scale(0)`,
                },
                active: { 
                  // 使用transform缩放代替width/height变化
                  transform: `translate(-50%, -50%) scale(${ripple.size * 2})`,
                  opacity: 0,
                  transition: {
                    duration: 0.6,
                    ease: [0, 0, 0.2, 1],
                  }
                },
              } : undefined}
              transition={{
                duration: getDuration(0.6),
                ease: [0, 0, 0.2, 1],
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 增强型按钮组件，集成水波纹效果
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  rippleColor?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  rippleColor,
}) => {
  const { shouldAnimate } = useAnimation();

  const baseClasses = 'relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const defaultRippleColors = {
    primary: 'rgba(255, 255, 255, 0.3)',
    secondary: 'rgba(0, 0, 0, 0.1)',
    ghost: 'rgba(0, 0, 0, 0.05)',
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={shouldAnimate() && !disabled ? { scale: 0.95 } : undefined}
      whileHover={shouldAnimate() && !disabled ? { scale: 1.02 } : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      <RippleEffect
        disabled={disabled}
        rippleColor={rippleColor || defaultRippleColors[variant]}
      >
        {children}
      </RippleEffect>
    </motion.button>
  );
};