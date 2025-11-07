import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';

interface AIResponseModalProps {
  isOpen: boolean;
  response: string;
  onClose: () => void;
  autoCloseDelay?: number; // 自动关闭延迟时间，默认5秒
}

export const AIResponseModal: React.FC<AIResponseModalProps> = ({
  isOpen,
  response,
  onClose,
  autoCloseDelay = 5000
}) => {
  const [remainingTime, setRemainingTime] = useState(autoCloseDelay / 1000);
  const { shouldAnimate, getDuration } = useAnimation();

  useEffect(() => {
    if (isOpen && response) {
      setRemainingTime(autoCloseDelay / 1000);
      
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      const countdownTimer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    }
  }, [isOpen, response, onClose, autoCloseDelay]);

  if (!isOpen || !response) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 毛玻璃背景 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={shouldAnimate() ? ANIMATIONS.modalOverlay : undefined}
            transition={{
              duration: getDuration(0.3),
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={shouldAnimate() ? ANIMATIONS.modalContent : undefined}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              duration: getDuration(0.3)
            }}
          >
            {/* 关闭按钮 */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={shouldAnimate() ? { scale: 1.1 } : undefined}
              whileTap={shouldAnimate() ? { scale: 0.9 } : undefined}
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* AI图标和标题 */}
            <motion.div
              className="flex items-center gap-3 mb-4"
              initial={shouldAnimate() ? { opacity: 0, y: -20 } : false}
              animate={shouldAnimate() ? { opacity: 1, y: 0 } : undefined}
              transition={{
                delay: getDuration(0.1),
                duration: getDuration(0.3),
              }}
            >
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"
                initial={shouldAnimate() ? { scale: 0 } : false}
                animate={shouldAnimate() ? { scale: 1 } : undefined}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: getDuration(0.2),
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI的温柔回应</h3>
                <p className="text-sm text-gray-500">为你准备的专属回复</p>
              </div>
            </motion.div>

            {/* 回复内容 */}
            <motion.div
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-4"
              initial={shouldAnimate() ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate() ? { opacity: 1, y: 0 } : undefined}
              transition={{
                delay: getDuration(0.3),
                duration: getDuration(0.4),
              }}
            >
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {response}
              </p>
            </motion.div>

            {/* 自动关闭倒计时提示 */}
            <motion.div
              className="flex items-center justify-between text-sm text-gray-500"
              initial={shouldAnimate() ? { opacity: 0 } : false}
              animate={shouldAnimate() ? { opacity: 1 } : undefined}
              transition={{
                delay: getDuration(0.4),
                duration: getDuration(0.3),
              }}
            >
              <span>窗口将在 {remainingTime} 秒后自动关闭</span>
              <div className="flex items-center gap-1">
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={shouldAnimate() ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5] 
                  } : undefined}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={shouldAnimate() ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5] 
                  } : undefined}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0.2,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={shouldAnimate() ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5] 
                  } : undefined}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0.4,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>

            {/* 提示文字 */}
            <motion.div
              className="mt-4 pt-4 border-t border-gray-100"
              initial={shouldAnimate() ? { opacity: 0 } : false}
              animate={shouldAnimate() ? { opacity: 1 } : undefined}
              transition={{
                delay: getDuration(0.5),
                duration: getDuration(0.3),
              }}
            >
              <p className="text-xs text-gray-400 text-center">
                AI回复已保存在你的记录中，随时可以查看
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};