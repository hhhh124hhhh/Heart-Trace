import React from 'react';
import { Home, History, User } from 'lucide-react';
import type { View } from '../types';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onViewChange,
}) => {
  const tabs = [
    { id: 'home' as View, label: '今日', icon: Home },
    { id: 'history' as View, label: '历史', icon: History },
    { id: 'profile' as View, label: '我的', icon: User },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-neutral-mist shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-40">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 max-w-[80px] min-h-[60px] px-4 transition-all duration-normal hover:scale-105 active:scale-95"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-primary-500' : 'text-neutral-stone'
                  }`}
                />
                {isActive && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary-500 animate-scale-in"></div>
                )}
              </div>
              <span className={`text-[12px] font-medium mt-4 whitespace-nowrap ${
                isActive ? 'text-primary-500' : 'text-neutral-stone'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* 安全区域适配 */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white"></div>
    </nav>
  );
};
