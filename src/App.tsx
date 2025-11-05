import { useState } from 'react';
import { HomeView } from './views/HomeView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { AIConfigView } from './views/AIConfigView';
import { BottomNav } from './components/BottomNav';
import type { View } from './types';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <div className="min-h-screen pb-[80px] pb-[calc(80px+env(safe-area-inset-bottom))]">
      
      {/* 视图内容 - 应用直接可用，无需配置 */}
      {currentView === 'home' && <HomeView />}
      {currentView === 'history' && <HistoryView />}
      {currentView === 'profile' && (
        <ProfileView onNavigateToAIConfig={() => setCurrentView('ai-config')} />
      )}
      {currentView === 'ai-config' && (
        <AIConfigView onBack={() => setCurrentView('profile')} />
      )}
      
      {/* 底部导航 */}
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

export default App;
