import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

// 模态框组件
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate, getDuration } = useAnimation();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
  };

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  // 聚焦管理
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const modalContent = (
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
            onClick={handleBackdropClick}
          />

          {/* 模态框内容 */}
          <motion.div
            ref={modalRef}
            className={`relative ${sizeClasses[size]} w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ${className}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={shouldAnimate() ? ANIMATIONS.modalContent : undefined}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* 头部 */}
            {(title || showCloseButton) && (
              <motion.div
                className="flex items-center justify-between p-6 border-b border-gray-100"
                initial={shouldAnimate() ? { opacity: 0, y: -20 } : false}
                animate={shouldAnimate() ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  delay: getDuration(0.1),
                  duration: getDuration(0.3),
                }}
              >
                <div>
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-xl font-semibold text-gray-900"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="mt-1 text-sm text-gray-500"
                    >
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={shouldAnimate() ? { scale: 1.1 } : undefined}
                    whileTap={shouldAnimate() ? { scale: 0.9 } : undefined}
                    aria-label="关闭"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* 内容区域 */}
            <motion.div
              className="max-h-[calc(90vh-8rem)] overflow-y-auto"
              initial={shouldAnimate() ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate() ? { opacity: 1, y: 0 } : undefined}
              transition={{
                delay: getDuration(0.2),
                duration: getDuration(0.4),
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// 确认对话框组件
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'info',
  loading = false,
}) => {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      closeOnBackdropClick={!loading}
    >
      <div className="p-6 pt-0">
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <motion.button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
            whileHover={loading ? undefined : { scale: 1.02 }}
            whileTap={loading ? undefined : { scale: 0.98 }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </div>
            ) : (
              confirmText
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

// 成功提示模态框
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = '成功！',
  message,
  actionText = '好的',
  onAction,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div className="p-6 pt-0 text-center">
        <motion.div
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
        >
          <motion.svg
            className="w-8 h-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.div>

        <motion.p
          className="text-gray-600 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>

        <motion.button
          onClick={() => {
            onAction?.();
            onClose();
          }}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {actionText}
        </motion.button>
      </div>
    </Modal>
  );
};

// 加载模态框
interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  progress?: number;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message = '正在处理...',
  progress,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // 加载时不允许关闭
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className="p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        
        <motion.p
          className="text-gray-600 mb-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>

        {progress !== undefined && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

// 底部抽屉模态框（移动端友好）
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'top';
  height?: 'auto' | 'half' | 'full';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  height = 'auto',
}) => {
  const { shouldAnimate, getDuration } = useAnimation();

  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  };

  const drawerVariants = {
    hidden: {
      [position === 'bottom' ? 'y' : 'x']: position === 'bottom' ? '100%' : '-100%',
    },
    visible: {
      [position === 'bottom' ? 'y' : 'x']: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      [position === 'bottom' ? 'y' : 'x']: position === 'bottom' ? '100%' : '-100%',
      transition: {
        duration: getDuration(0.3),
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={shouldAnimate() ? overlayVariants : undefined}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* 抽屉内容 */}
          <motion.div
            className={`absolute left-0 right-0 bg-white rounded-t-2xl shadow-2xl ${heightClasses[height]} ${
              position === 'bottom' ? 'bottom-0' : 'top-0'
            } overflow-hidden`}
            variants={shouldAnimate() ? drawerVariants : undefined}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* 拖拽指示器 */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* 标题 */}
            {title && (
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
            )}

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};