import React, { useState, useEffect } from 'react';
import { User, Tag, TrendingUp, Lock, Bell, Info, Bot, ChevronRight, Download } from 'lucide-react';
import { settingsDB, statsDB, tagsDB, DEFAULT_TAGS } from '../lib/storage';
import { aiSettingsDB } from '../lib/aiSettingsDB';
import { EmotionTag } from '../components/EmotionTag';
import { Button } from '../components/Button';
import { DataExportModal } from '../components/DataExportModal';
import type { UserSettings, UserStats, Tag as TagType } from '../types';
import { aiService } from '../lib/aiService';

interface ProfileViewProps {
  onNavigateToAIConfig: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateToAIConfig }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tags, setTags] = useState<TagType[]>(DEFAULT_TAGS);
  const [aiServiceStatus, setAiServiceStatus] = useState({
    available: false,
    checking: true,
    message: '检查中...'
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // 检查AI服务状态
  const checkAIServiceStatus = async () => {
    try {
      setAiServiceStatus({
        ...aiServiceStatus,
        checking: true,
        message: '检查中...'
      });
      
      // 实际调用AI服务的状态检查方法
      const status = await aiService.checkServiceStatus();
      
      setAiServiceStatus({
        available: status.available,
        checking: false,
        message: status.message
      });
    } catch (error) {
      setAiServiceStatus({
        available: false,
        checking: false,
        message: '检查失败: 未知错误'
      });
    }
  };

  useEffect(() => {
    checkAIServiceStatus();
  }, []);
  
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadData = async () => {
    const userSettings = await settingsDB.get();
    setSettings(userSettings);
    
    const userStats = await statsDB.calculateStats();
    setStats(userStats);
    
    const allTags = await tagsDB.getAll();
    setTags(allTags);
    
    // 检测用户级别，决定是否显示高级模式
    await checkUserLevel();
  };
  
  const checkUserLevel = async () => {
    try {
      const stats = await statsDB.get();
      const aiSettings = await aiSettingsDB.get();
      
      // 使用超过30天或有自定义配置显示高级模式
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(stats.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const hasCustomConfig = aiSettings.models.some(m => !m.isBuiltin);
      
      // 不再设置用户级别和高级模式，保持界面简洁
    } catch (error) {
      console.error('检查用户级别失败:', error);
    }
  };
  
  const getMostFrequentEmotion = () => {
    if (!stats || Object.keys(stats.emotionDistribution).length === 0) {
      return '暂无数据';
    }
    
    const sorted = Object.entries(stats.emotionDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number));
    
    if (sorted.length === 0) return '暂无数据';
    
    const [tagId] = sorted[0];
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || tagId;
  };
  
  const handleToggleSetting = async (key: keyof UserSettings, value: boolean) => {
    if (!settings) return;
    await settingsDB.update({ [key]: value });
    await loadData();
  };
  
  return (
    <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
      <div className="max-w-[800px] mx-auto px-24 pt-24">
        {/* 标题 */}
        <div className="mb-32 animate-fade-in">
          <h1 className="text-h1 font-bold text-neutral-dark">我的</h1>
        </div>
        
        {/* 用户信息卡 */}
        <div className="mb-32 p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-md animate-slide-up">
          <div className="flex items-center gap-16 mb-24">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-h3 font-semibold text-neutral-dark">
                {settings?.nickname || '朋友'}
              </h2>
              <p className="text-body-small text-neutral-stone">
                坚持了 {stats?.continuousDays || 0} 天
              </p>
            </div>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16 flex items-center gap-8">
            <TrendingUp className="w-5 h-5" />
            数据统计
          </h3>
          <div className="grid grid-cols-2 gap-16">
            <div className="p-32 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
              <div className="text-display font-bold text-primary-500 mb-8">
                {stats?.totalRecords || 0}
              </div>
              <div className="text-body-small text-neutral-stone">总记录数</div>
            </div>
            <div className="p-32 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
              <div className="text-display font-bold text-secondary-500 mb-8">
                {stats?.continuousDays || 0}
              </div>
              <div className="text-body-small text-neutral-stone">连续天数</div>
            </div>
            <div className="col-span-2 p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
              <div className="text-body-small text-neutral-stone mb-8">最常情绪</div>
              <div className="text-h3 font-semibold text-neutral-dark">
                {getMostFrequentEmotion()}
              </div>
            </div>
          </div>
        </div>
        
        {/* 高级设置已暂时隐藏，保持应用简单 */}
        
        {/* AI服务状态 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <div className="p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-12">
                  <Bot className="w-5 h-5 text-neutral-stone" />
                  <span className="text-body text-neutral-dark">AI服务状态</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className={`w-2 h-2 rounded-full ${
                    aiServiceStatus.checking ? 'animate-pulse bg-semantic-warning' :
                    aiServiceStatus.available ? 'bg-semantic-success' : 'bg-neutral-stone'
                  }`}></div>
                  <span className={`text-caption ${
                    aiServiceStatus.available ? 'text-semantic-success' : 'text-neutral-stone'
                  }`}>
                    {aiServiceStatus.message}
                  </span>
                  {!aiServiceStatus.available && !aiServiceStatus.checking && (
                    <button 
                      onClick={checkAIServiceStatus}
                      className="text-primary-500 hover:text-primary-600 underline text-caption"
                    >
                      重新检查
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        
        {/* 我的标签库 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* 标签库区域已移除 */}
        </div>
        
        {/* 设置 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16">设置</h3>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden">
            {/* 数据导出 */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-between p-24 w-full hover:bg-neutral-50 transition-colors border-b border-neutral-mist"
            >
              <div className="flex items-center gap-12">
                <Download className="w-5 h-5 text-neutral-stone" />
                <div className="text-left">
                  <div className="text-body text-neutral-dark">数据导出</div>
                  <div className="text-caption text-neutral-stone">导出您的所有记录和设置</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-stone" />
            </button>
            
            {/* 默认隐私模式 */}
            <div className="flex items-center justify-between p-24">
              <div className="flex items-center gap-12">
                <Lock className="w-5 h-5 text-neutral-stone" />
                <div>
                  <div className="text-body text-neutral-dark">默认隐私模式</div>
                  <div className="text-caption text-neutral-stone">新记录默认仅自己可见</div>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('defaultPrivate', !settings?.defaultPrivate)}
                className={`
                  relative w-12 h-7 rounded-full transition-colors duration-normal
                  ${settings?.defaultPrivate ? 'bg-primary-500' : 'bg-neutral-mist'}
                `}
              >
                <div className={`
                  absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-normal
                  ${settings?.defaultPrivate ? 'translate-x-[22px]' : 'translate-x-1'}
                `} />
              </button>
            </div>
          </div>
        </div>
        
        {/* 关于 */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-12 text-body-small text-neutral-stone">
              <Info className="w-4 h-4" />
              <span>心迹 v1.0.0</span>
            </div>
            <p className="text-caption text-neutral-stone mt-8 leading-relaxed">
              温柔对待自己的每一个瞬间
            </p>
          </div>
        </div>
      </div>
      
      {/* 数据导出模态框 */}
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
