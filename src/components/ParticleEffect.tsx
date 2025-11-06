import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';

// 粒子类型定义
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  lifetime: number;
  type: 'circle' | 'star' | 'heart' | 'sparkle';
}

// 粒子效果属性
interface ParticleEffectProps {
  trigger: boolean;
  count?: number;
  colors?: string[];
  types?: Array<'circle' | 'star' | 'heart' | 'sparkle'>;
  position?: { x: number; y: number };
  radius?: number;
  duration?: number;
  onComplete?: () => void;
}

// 单个粒子组件
const ParticleComponent: React.FC<{ 
  particle: Particle; 
  onComplete: (id: number) => void;
}> = ({ particle, onComplete }) => {
  const { shouldAnimate, getDuration } = useAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(particle.id);
    }, particle.lifetime);

    return () => clearTimeout(timer);
  }, [particle.id, particle.lifetime, onComplete]);

  const renderParticleShape = () => {
    switch (particle.type) {
      case 'star':
        return (
          <svg viewBox="0 0 24 24" fill={particle.color}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'heart':
        return (
          <svg viewBox="0 0 24 24" fill={particle.color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'sparkle':
        return (
          <svg viewBox="0 0 24 24" fill={particle.color}>
            <path d="M12 2L13.09 8.26L20 9.27L13.09 10.28L12 16.54L10.91 10.28L4 9.27L10.91 8.26L12 2Z" />
          </svg>
        );
      default:
        return <div style={{ backgroundColor: particle.color }} />;
    }
  };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        // 使用transform代替left/top，避免强制重排
        transform: `translate(${particle.x}px, ${particle.y}px)`,
        width: particle.size,
        height: particle.size,
      }}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={shouldAnimate() ? {
        hidden: { 
          scale: 0, 
          opacity: 0,
          rotate: 0,
        },
        visible: {
          scale: [0, 1, 0.5],
          opacity: [0, 1, 0],
          rotate: particle.type === 'sparkle' ? [0, 360] : [0, 180],
          // 将x/y动画合并到transform中，避免重排
          transition: {
            duration: getDuration(particle.lifetime / 1000),
            ease: [0.25, 0.46, 0.45, 0.94],
          }
        },
      } : undefined}
    >
      {renderParticleShape()}
    </motion.div>
  );
};

// 粒子效果容器组件
export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  trigger,
  count = 12,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
  types = ['circle', 'star', 'sparkle'],
  position = { x: 0, y: 0 },
  radius = 80,
  duration = 2000,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getDuration } = useAnimation();

  const generateParticles = () => {
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = 0.5 + Math.random() * 1.5;
      const particleType = types[Math.floor(Math.random() * types.length)];
      
      newParticles.push({
        id: Date.now() + i,
        x: position.x + Math.cos(angle) * (Math.random() * radius * 0.3),
        y: position.y + Math.sin(angle) * (Math.random() * radius * 0.3),
        size: 8 + Math.random() * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
        },
        lifetime: getDuration(duration) + Math.random() * 500,
        type: particleType,
      });
    }
    
    return newParticles;
  };

  const removeParticle = (id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (trigger) {
      const newParticles = generateParticles();
      setParticles(newParticles);

      // 清理定时器
      const cleanupTimer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, getDuration(duration + 1000));

      return () => clearTimeout(cleanupTimer);
    }
  }, [trigger, position, getDuration, duration, onComplete]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <AnimatePresence>
        {particles.map(particle => (
          <ParticleComponent
            key={particle.id}
            particle={particle}
            onComplete={removeParticle}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// 成功保存粒子效果
export const SuccessParticles: React.FC<{
  show: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = ({ show, position, onComplete }) => {
  return (
    <ParticleEffect
      trigger={show}
      count={16}
      colors={['#4ADE80', '#22C55E', '#16A34A', '#FFD700', '#FFA500']}
      types={['star', 'sparkle', 'circle']}
      position={position || { x: 0, y: 0 }}
      radius={100}
      duration={2500}
      onComplete={onComplete}
    />
  );
};

// 爱心粒子效果
export const LoveParticles: React.FC<{
  show: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = ({ show, position, onComplete }) => {
  return (
    <ParticleEffect
      trigger={show}
      count={12}
      colors={['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FFE4E1']}
      types={['heart', 'circle']}
      position={position || { x: 0, y: 0 }}
      radius={60}
      duration={2000}
      onComplete={onComplete}
    />
  );
};

// 庆祝粒子效果
export const CelebrationParticles: React.FC<{
  show: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = ({ show, position, onComplete }) => {
  return (
    <ParticleEffect
      trigger={show}
      count={20}
      colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD700', '#FFA07A', '#98D8C8']}
      types={['star', 'sparkle', 'circle', 'heart']}
      position={position || { x: 0, y: 0 }}
      radius={120}
      duration={3000}
      onComplete={onComplete}
    />
  );
};

// Hook: 获取元素位置用于粒子效果
export const useParticlePosition = (elementRef: React.RefObject<HTMLElement>) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const updatePosition = () => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [elementRef]);

  return position;
};