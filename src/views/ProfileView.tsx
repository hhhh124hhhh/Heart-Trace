import React, { useState, useEffect } from 'react';
import { User, Tag, TrendingUp, Lock, Bell, Info, Bot, ChevronRight, Download, Upload, BarChart3 } from 'lucide-react';
import { settingsDB, statsDB, tagsDB, recordsDB, DEFAULT_TAGS } from '../lib/storage';
import { aiSettingsDB } from '../lib/aiSettingsDB';
import { EmotionTag } from '../components/EmotionTag';
import { Button } from '../components/Button';
import { DataExportModal } from '../components/DataExportModal';
import { DataImportModal } from '../components/DataImportModal';
import { EmotionDashboard } from '../components/EmotionDashboard';
import { WeeklySummaryModal } from '../components/WeeklySummaryModal';
import type { UserSettings, UserStats, Tag as TagType, DailyRecord } from '../types';
import { aiService } from '../lib/aiService';

interface ProfileViewProps {
  onNavigateToAIConfig: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateToAIConfig }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tags, setTags] = useState<TagType[]>(DEFAULT_TAGS);
  const [recentRecords, setRecentRecords] = useState<DailyRecord[]>([]);
  const [aiServiceStatus, setAiServiceStatus] = useState({
    available: false,
    checking: true,
    message: '检查中...'
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

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
    
    // 监听数据导入事件
    const handleDataImported = () => {
      loadData();
    };
    
    window.addEventListener('data-imported', handleDataImported);
    
    return () => {
      window.removeEventListener('data-imported', handleDataImported);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadData = async () => {
    const userSettings = await settingsDB.get();
    setSettings(userSettings);
    
    const userStats = await statsDB.calculateStats();
    setStats(userStats);
    
    const allTags = await tagsDB.getAll();
    setTags(allTags);
    
    // 获取最近14天的记录用于趋势图
    const allRecords = await recordsDB.getAll();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recent = allRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= twoWeeksAgo;
    });
    setRecentRecords(recent);
    
    // 检测用户级别，决定是否显示高级模式
    await checkUserLevel();
  };

  const handleImportComplete = () => {
    // 导入完成后刷新数据
    loadData();
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
            情绪仪表盘
          </h3>
          <div className="grid grid-cols-2 gap-16">

            <EmotionDashboard records={recentRecords} tags={tags} />
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
                    aiServiceStatus.available ? 'text-semantic-success' : 'text-neutral-earth'
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
            {/* 数据管理 */}
            <div className="border-b border-neutral-mist">
              {/* 第一行：数据导入和导出 */}
              <div className="grid grid-cols-2">
                {/* 数据导入 */}
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center justify-between p-24 w-full hover:bg-neutral-50 transition-colors border-r border-neutral-mist"
                >
                  <div className="flex items-center gap-12">
                    <Upload className="w-5 h-5 text-neutral-stone" />
                    <div className="text-left">
                      <div className="text-body text-neutral-dark">数据导入</div>
                      <div className="text-caption text-neutral-stone">恢复备份数据</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-stone" />
                </button>

                {/* 数据导出 */}
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center justify-between p-24 w-full hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-12">
                    <Download className="w-5 h-5 text-neutral-stone" />
                    <div className="text-left">
                      <div className="text-body text-neutral-dark">数据导出</div>
                      <div className="text-caption text-neutral-stone">备份记录和设置</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-stone" />
                </button>
              </div>

              {/* 第二行：数据统计 */}
              <div className="border-t border-neutral-mist">
                <button
                  onClick={() => setShowWeeklySummary(true)}
                  className="flex items-center justify-between p-24 w-full hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-12">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                    <div className="text-left">
                      <div className="text-body text-neutral-dark">数据统计</div>
                      <div className="text-caption text-neutral-stone">查看周总结和数据分析</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-stone" />
                </button>
              </div>
            </div>
            
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
            <div className="flex items-center gap-4 text-body-small text-neutral-stone">
              <img src="/icon-192.svg" alt="心迹logo" className="w-6 h-6" />
              <span>心迹 v2.0</span>
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
      
      {/* 数据导入模态框 */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* 周总结模态框 */}
      <WeeklySummaryModal
        isOpen={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
      />
    </div>
  );
};
