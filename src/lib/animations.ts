import type { Variants, Transition } from 'framer-motion';

// 动画持续时间常量
export const DURATIONS = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
  story: 0.8,
} as const;

// 缓动函数
export const EASINGS = {
  // 基础缓动
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  
  // 自然缓动
  anticipate: [0.6, -0.28, 0.735, 0.045],
  backIn: [0.6, -0.28, 0.735, 0.045],
  backOut: [0.175, 0.885, 0.32, 1.275],
  
  // 弹性缓动
  circIn: [0.6, 0.04, 0.98, 0.335],
  circOut: [0.075, 0.82, 0.165, 1],
  
  // 温柔缓动
  gentle: [0.25, 0.46, 0.45, 0.94],
  soft: [0.25, 0.1, 0.25, 1],
} as const;

// 动画变体定义
export const ANIMATIONS = {
  // 淡入淡出
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,
  
  // 缩放动画
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  } as Variants,
  
  // 弹性缩放
  elasticScale: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      }
    },
    exit: { opacity: 0, scale: 0.3 },
  } as Variants,
  
  // 滑入动画
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  } as Variants,
  
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  } as Variants,
  
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  } as Variants,
  
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  } as Variants,
  
  // 旋转进入
  rotateIn: {
    hidden: { opacity: 0, rotate: -10, scale: 0.9 },
    visible: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 10, scale: 0.9 },
  } as Variants,
  
  // 心跳动画
  heartbeat: {
    idle: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      }
    },
    tap: { scale: 0.95 },
  } as Variants,
  
  // 水波纹动画
  ripple: {
    idle: { scale: 0, opacity: 0.8 },
    active: { 
      scale: 4,
      opacity: 0,
      transition: {
        duration: 0.6,
        ease: EASINGS.easeOut,
      }
    },
  } as Variants,
  
  // 磁性吸附
  magnetic: {
    idle: { scale: 1 },
    hover: { 
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15,
      }
    },
    tap: { 
      scale: 0.9,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 10,
      }
    },
  } as Variants,
  
  // 粒子爆炸
  particleExplosion: {
    hidden: { 
      scale: 0, 
      opacity: 0,
      rotate: 0,
    },
    visible: (i: number) => ({
      scale: 1,
      opacity: [0, 1, 0],
      rotate: [0, 360],
      x: Math.cos(i * 0.5) * 100,
      y: Math.sin(i * 0.5) * 100,
      transition: {
        duration: 1,
        delay: i * 0.05,
        ease: EASINGS.easeOut,
      }
    }),
  } as Variants,
  
  // 打字机效果
  typewriter: {
    hidden: { width: 0 },
    visible: { width: "auto" },
  } as Variants,
  
  // 思考气泡
  thinking: {
    idle: { scale: 1, opacity: 0.7 },
    thinking: { 
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: EASINGS.easeInOut,
      }
    },
  } as Variants,
  
  // 成功保存
  successSave: {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: [0, 1.2, 1],
      rotate: [-180, 10, 0],
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275], // backOut
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  } as Variants,
  
  // 模态框背景
  modalOverlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,
  
  // 模态框内容
  modalContent: {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        mass: 0.8,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2 }
    }
  } as Variants,
} as const;

// 通用过渡配置
export const createTransition = (config: Partial<Transition> = {}): Transition => ({
  duration: DURATIONS.normal,
  ease: EASINGS.easeInOut,
  ...config,
});

// 响应式动画配置
export const responsiveAnimation = {
  mobile: {
    transition: createTransition({ duration: DURATIONS.fast }),
  },
  desktop: {
    transition: createTransition({ duration: DURATIONS.normal }),
  },
} as const;

// 主题色彩动画
export const colorThemes = {
  // 温暖主题
  warm: {
    primary: "#FF6B6B",
    secondary: "#FFE66D",
    accent: "#FF8E53",
  },
  // 冷静主题  
  cool: {
    primary: "#4ECDC4",
    secondary: "#44A08D",
    accent: "#556270",
  },
  // 自然主题
  nature: {
    primary: "#95E1D3",
    secondary: "#F3A683",
    accent: "#778BEB",
  },
} as const;

// 情绪对应的动画配置
export const emotionAnimations = {
  happy: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    }
  },
  sad: {
    scale: 0.95,
    y: 2,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.gentle,
    }
  },
  excited: {
    scale: 1.15,
    rotate: -5,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 8,
    }
  },
  calm: {
    scale: 1,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.soft,
    }
  },
  anxious: {
    // 使用transform代替直接修改x属性，避免强制重排
    x: 0,
    y: 0,
    transition: {
      duration: 0.3,
      repeat: 3,
      ease: "easeInOut",
      // 在子组件中使用此transition配置，配合transform属性
    }
  },
  grateful: {
    scale: [1, 1.05, 1],
    transition: {
      duration: DURATIONS.story,
      ease: EASINGS.anticipate,
    }
  },
} as const;