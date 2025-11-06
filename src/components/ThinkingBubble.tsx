import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';

interface ThinkingBubbleProps {
  isVisible: boolean;
  message?: string;
  type?: 'thinking' | 'analyzing' | 'generating';
  size?: 'sm' | 'md' | 'lg';
}

// 小气泡组件
const ThoughtDot: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const { shouldAnimate, getDuration } = useAnimation();

  return (
    <motion.div
      className="absolute bg-blue-400 rounded-full"
      style={{
        width: size,
        height: size,
      }}
      initial={shouldAnimate() ? { scale: 0, opacity: 0 } : false}
      animate={shouldAnimate() ? {
        scale: [0, 1, 0.8, 1],
        opacity: [0, 1, 0.6, 1],
        y: [0, -8, -4, 0],
      } : undefined}
      transition={shouldAnimate() ? {
        duration: getDuration(1.5),
        delay,
        repeat: Infinity,
        ease: [0.25, 0.46, 0.45, 0.94],
      } : undefined}
    />
  );
};

// 思考气泡组件
export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({
  isVisible,
  message = 'AI正在思考...',
  type = 'thinking',
  size = 'md',
}) => {
  const { shouldAnimate, getDuration } = useAnimation();

  const sizeConfig = {
    sm: {
      container: 'w-16 h-16',
      icon: 'w-6 h-6',
      text: 'text-sm',
      dots: [4, 3, 2],
    },
    md: {
      container: 'w-20 h-20',
      icon: 'w-8 h-8',
      text: 'text-base',
      dots: [6, 4, 3],
    },
    lg: {
      container: 'w-24 h-24',
      icon: 'w-10 h-10',
      text: 'text-lg',
      dots: [8, 6, 4],
    },
  };

  const config = sizeConfig[size];

  const getTypeConfig = () => {
    switch (type) {
      case 'analyzing':
        return {
          icon: Brain,
          gradient: 'from-purple-400 to-pink-400',
          bgColor: 'bg-purple-100',
          message: 'AI正在分析情绪...',
        };
      case 'generating':
        return {
          icon: Sparkles,
          gradient: 'from-blue-400 to-cyan-400',
          bgColor: 'bg-blue-100',
          message: 'AI正在生成回复...',
        };
      default:
        return {
          icon: Loader2,
          gradient: 'from-blue-400 to-indigo-400',
          bgColor: 'bg-blue-100',
          message: 'AI正在思考...',
        };
    }
  };

  const typeConfig = getTypeConfig();
  const Icon = typeConfig.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={shouldAnimate() ? { opacity: 0, scale: 0.8, y: 20 } : false}
          animate={shouldAnimate() ? { opacity: 1, scale: 1, y: 0 } : undefined}
          exit={shouldAnimate() ? { opacity: 0, scale: 0.8, y: -20 } : undefined}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          {/* 主气泡 */}
          <div className="relative">
            <motion.div
              className={`${config.container} ${typeConfig.bgColor} rounded-full flex items-center justify-center shadow-lg`}
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(219,234,254,0.9))`,
              }}
              animate={shouldAnimate() ? {
                scale: [1, 1.05, 1],
                rotate: [0, 1, -1, 0],
              } : undefined}
              transition={shouldAnimate() ? {
                duration: getDuration(2),
                repeat: Infinity,
                ease: [0.25, 0.46, 0.45, 0.94],
              } : undefined}
            >
              <Icon 
                className={`${config.icon} text-blue-500`}
                style={{
                  color: type === 'generating' ? '#3B82F6' : 
                         type === 'analyzing' ? '#8B5CF6' : '#6366F1',
                }}
              />
              
              {type === 'thinking' && (
                <motion.div
                  animate={shouldAnimate() ? { rotate: 360 } : undefined}
                  transition={shouldAnimate() ? {
                    duration: getDuration(2),
                    repeat: Infinity,
                    ease: "linear",
                  } : undefined}
                >
                  <Loader2 className={`${config.icon} text-blue-500`} />
                </motion.div>
              )}
            </motion.div>

            {/* 小气泡装饰 */}
            {shouldAnimate() && (
              <>
                <motion.div
                  className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-300 rounded-full opacity-60"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.3, 0.6],
                  }}
                  transition={{
                    duration: getDuration(1.5),
                    delay: 0.2,
                    repeat: Infinity,
                  }}
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-200 rounded-full opacity-40"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.2, 0.4],
                  }}
                  transition={{
                    duration: getDuration(1.8),
                    delay: 0.5,
                    repeat: Infinity,
                  }}
                />
              </>
            )}

            {/* 脉冲效果 */}
            {shouldAnimate() && (
              <motion.div
                className={`absolute inset-0 ${typeConfig.bgColor} rounded-full opacity-30`}
                animate={{
                  scale: [1, 1.3, 1.5],
                  opacity: [0.3, 0.1, 0],
                }}
                transition={{
                  duration: getDuration(2),
                  repeat: Infinity,
                }}
                style={{
                  background: `linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))`,
                }}
              />
            )}
          </div>

          {/* 思考点动画 */}
          <div className="flex gap-1 justify-center">
            {config.dots.map((dotSize, index) => (
              <ThoughtDot
                key={index}
                delay={index * 0.2}
                size={dotSize}
              />
            ))}
          </div>

          {/* 消息文字 */}
          <motion.p
            className={`${config.text} text-gray-600 text-center font-medium`}
            initial={shouldAnimate() ? { opacity: 0, y: 10 } : false}
            animate={shouldAnimate() ? { opacity: 1, y: 0 } : undefined}
            transition={{
              delay: getDuration(0.3),
              duration: getDuration(0.5),
            }}
          >
            {message}
          </motion.p>

          {/* 进度条 */}
          {shouldAnimate() && (
            <motion.div
              className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: "8rem" }}
              transition={{ duration: getDuration(0.5), delay: 0.2 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: getDuration(3),
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 情绪分析可视化组件
export const EmotionAnalysisVisualization: React.FC<{
  isVisible: boolean;
  analysis?: {
    calmness: number;
    positivity: number;
    energy: number;
  };
}> = ({ isVisible, analysis }) => {
  const { shouldAnimate, getDuration } = useAnimation();

  if (!analysis) return null;

  const emotions = [
    { name: '平静度', value: analysis.calmness, color: 'from-blue-400 to-cyan-400', icon: '😌' },
    { name: '正向度', value: analysis.positivity, color: 'from-green-400 to-emerald-400', icon: '😊' },
    { name: '能量值', value: analysis.energy, color: 'from-orange-400 to-red-400', icon: '⚡' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
          initial={shouldAnimate() ? { opacity: 0, scale: 0.9, y: 20 } : false}
          animate={shouldAnimate() ? { opacity: 1, scale: 1, y: 0 } : undefined}
          exit={shouldAnimate() ? { opacity: 0, scale: 0.9, y: -20 } : undefined}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>🧠</span>
            情绪分析
          </h3>
          
          <div className="space-y-3">
            {emotions.map((emotion, index) => (
              <motion.div
                key={emotion.name}
                className="flex items-center gap-3"
                initial={shouldAnimate() ? { opacity: 0, x: -20 } : false}
                animate={shouldAnimate() ? { opacity: 1, x: 0 } : undefined}
                transition={{
                  delay: getDuration(0.1 * index),
                  duration: getDuration(0.5),
                }}
              >
                <span className="text-2xl">{emotion.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{emotion.name}</span>
                    <span className="text-sm font-bold text-gray-900">{emotion.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${emotion.color} rounded-full`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${emotion.value}%` }}
                      transition={{
                        duration: getDuration(1),
                        delay: getDuration(0.2 + index * 0.1),
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};