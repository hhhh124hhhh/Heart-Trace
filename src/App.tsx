import { useState } from 'react';
import { HomeView } from './views/HomeView';
import { HistoryView } from './views/HistoryView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { AIConfigView } from './views/AIConfigView';
import { BottomNav } from './components/BottomNav';
import { AnimationProvider } from './contexts/AnimationContext';
import type { View } from './types';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <AnimationProvider>
      <div className="min-h-screen pb-[80px] pb-[calc(80px+env(safe-area-inset-bottom))]">
        
        {/* 视图内容 - 应用直接可用，无需配置 */}
        {currentView === 'home' && (
          <HomeView onNavigateToInsights={() => setCurrentView('insights')} />
        )}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'insights' && <InsightsView />}
        {currentView === 'settings' && (
          <SettingsView />
        )}
        
        {/* 底部导航 */}
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </div>
    </AnimationProvider>
  );
}

export default App;
