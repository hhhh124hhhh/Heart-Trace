import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-semantic-success" />,
    error: <XCircle className="w-5 h-5 text-semantic-error" />,
    info: <Info className="w-5 h-5 text-semantic-info" />,
  };
  
  const bgColors = {
    success: 'bg-semantic-success/10 border-semantic-success',
    error: 'bg-semantic-error/10 border-semantic-error',
    info: 'bg-semantic-info/10 border-semantic-info',
  };
  
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className={`flex items-center gap-12 px-24 py-16 rounded-full border-2 ${bgColors[type]} bg-white/90 backdrop-blur-sm shadow-lg`}>
        {icons[type]}
        <span className="text-body text-neutral-dark">{message}</span>
      </div>
    </div>
  );
};
