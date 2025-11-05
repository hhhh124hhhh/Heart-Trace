import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'AI正在思考中...',
}) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-40 shadow-xl flex flex-col items-center gap-24 animate-scale-in">
        <div className="relative">
          <Sparkles className="w-16 h-16 text-primary-500 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-soft"></div>
        </div>
        <p className="text-body text-neutral-dark animate-pulse">{message}</p>
      </div>
    </div>
  );
};
