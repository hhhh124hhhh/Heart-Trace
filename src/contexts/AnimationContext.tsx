import React, { createContext, useContext, useState, useCallback } from 'react';
import { EASINGS, DURATIONS } from '../lib/animations';

// 动画偏好设置类型
export interface AnimationPreferences {
  enabled: boolean;
  reducedMotion: boolean;
  customSpeed: 'slow' | 'normal' | 'fast';
  customIntensity: 'subtle' | 'normal' | 'strong';
}

// 动画上下文类型
interface AnimationContextType {
  preferences: AnimationPreferences;
  updatePreferences: (updates: Partial<AnimationPreferences>) => void;
  // 计算实际动画时长
  getDuration: (baseDuration: number) => number;
  // 计算实际缓动函数
  getEasing: (baseEasing: number[]) => number[];
  // 检查是否应该播放动画
  shouldAnimate: () => boolean;
}

// 默认设置
const defaultPreferences: AnimationPreferences = {
  enabled: true,
  reducedMotion: false,
  customSpeed: 'normal',
  customIntensity: 'normal',
};

// 创建上下文
const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

// 动画速度倍数
const speedMultipliers = {
  slow: 1.5,
  normal: 1,
  fast: 0.6,
} as const;

// 动画强度倍数
const intensityMultipliers = {
  subtle: 0.5,
  normal: 1,
  strong: 1.5,
} as const;

// 动画提供者组件
export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AnimationPreferences>(() => {
    // 从localStorage读取用户偏好
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('animation-preferences');
      if (saved) {
        try {
          return { ...defaultPreferences, ...JSON.parse(saved) };
        } catch (e) {
          console.warn('Failed to parse animation preferences:', e);
        }
      }
      
      // 检查系统偏好
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        return { ...defaultPreferences, reducedMotion: true };
      }
    }
    
    return defaultPreferences;
  });

  const updatePreferences = useCallback((updates: Partial<AnimationPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('animation-preferences', JSON.stringify(newPrefs));
      }
      
      return newPrefs;
    });
  }, []);

  const getDuration = useCallback((baseDuration: number): number => {
    if (!preferences.enabled || preferences.reducedMotion) {
      return 0;
    }
    
    const speedMultiplier = speedMultipliers[preferences.customSpeed];
    const intensityMultiplier = intensityMultipliers[preferences.customIntensity];
    
    return baseDuration * speedMultiplier * intensityMultiplier;
  }, [preferences]);

  const getEasing = useCallback((baseEasing: readonly number[]): number[] => {
    if (!preferences.enabled || preferences.reducedMotion) {
      return [...EASINGS.linear];
    }
    
    return [...baseEasing];
  }, [preferences]);

  const shouldAnimate = useCallback((): boolean => {
    return preferences.enabled && !preferences.reducedMotion;
  }, [preferences]);

  // 监听系统动画偏好变化
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        updatePreferences({ reducedMotion: e.matches });
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [updatePreferences]);

  const value: AnimationContextType = {
    preferences,
    updatePreferences,
    getDuration,
    getEasing,
    shouldAnimate,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// 使用动画上下文的Hook
export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  
  return context;
};

// 便捷Hook：获取动画props
export const useAnimatedProps = () => {
  const { getDuration, getEasing, shouldAnimate } = useAnimation();
  
  return {
    initial: shouldAnimate() ? undefined : false,
    animate: shouldAnimate() ? undefined : false,
    transition: shouldAnimate() ? {
      duration: getDuration(DURATIONS.normal),
      ease: getEasing([...EASINGS.easeInOut]),
    } : { duration: 0 },
  };
};

// 便捷Hook：情绪动画
export const useEmotionAnimation = (emotion: string) => {
  const { getDuration, shouldAnimate } = useAnimation();
  
  return {
    whileTap: shouldAnimate() ? {
      transform: "scale(0.95)",
      transition: { duration: getDuration(DURATIONS.fast) }
    } : undefined,
    whileHover: shouldAnimate() ? {
      transform: "scale(1.05)",
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 10,
      }
    } : undefined,
  };
};

// 便捷Hook：成功动画
export const useSuccessAnimation = () => {
  const { getDuration, shouldAnimate } = useAnimation();
  
  return {
    initial: shouldAnimate() ? { transform: "scale(0) rotate(-180deg)" } : false,
    animate: shouldAnimate() ? {
      transform: [
        "scale(0) rotate(-180deg)",
        "scale(1.2) rotate(10deg)",
        "scale(1) rotate(0deg)"
      ],
      opacity: 1,
    } : undefined,
    transition: shouldAnimate() ? {
      duration: getDuration(DURATIONS.normal),
      ease: [0.175, 0.885, 0.32, 1.275],
    } : { duration: 0 },
  };
};