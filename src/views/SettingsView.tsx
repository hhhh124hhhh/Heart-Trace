import React, { useState, useEffect } from 'react';

// 扩展Window接口以支持notificationTimer
declare global {
  interface Window {
    notificationTimer?: NodeJS.Timeout;
  }
}
import { User, Lock, Bell, Upload, Download, ChevronRight, Palette, Shield, Bot } from 'lucide-react';
import { settingsDB, statsDB, tagsDB, recordsDB, DEFAULT_TAGS } from '../lib/storage';
import { aiService } from '../lib/aiService';
import { EmotionTag } from '../components/EmotionTag';
import { Button } from '../components/Button';
import { DataExportModal } from '../components/DataExportModal';
import { DataImportModal } from '../components/DataImportModal';
import type { UserSettings, UserStats, Tag as TagType, DailyRecord } from '../types';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tags, setTags] = useState<TagType[]>(DEFAULT_TAGS);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState({
    available: false,
    checking: true,
    message: '检查中...'
  });

  useEffect(() => {
    loadData();
    checkAIServiceStatus(); // 检查AI服务状态
    
    // 监听数据导入事件
    const handleDataImported = () => {
      loadData();
    };
    
    window.addEventListener('data-imported', handleDataImported);
    
    return () => {
      window.removeEventListener('data-imported', handleDataImported);
    };
  }, []);
  
  const loadData = async () => {
    const userSettings = await settingsDB.get();
    setSettings(userSettings);
    
    const userStats = await statsDB.calculateStats();
    setStats(userStats);
    
    const allTags = await tagsDB.getAll();
    setTags(allTags);
  };

  const handleImportComplete = () => {
    // 导入完成后刷新数据
    loadData();
  };

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
  
  const handleToggleSetting = async (key: keyof UserSettings, value: boolean) => {
    if (!settings) return;
    await settingsDB.update({ [key]: value });
    await loadData();
    
    // 如果开启了提醒，请求通知权限
    if (key === 'dailyReminder' && value) {
      requestNotificationPermission();
    }
  };

  const handleNicknameChange = async (newNickname: string) => {
    if (!settings) return;
    await settingsDB.update({ nickname: newNickname });
    await loadData();
  };

  const handleReminderTimeChange = async (newTime: string) => {
    if (!settings) return;
    await settingsDB.update({ reminderTime: newTime });
    await loadData();
    
    // 更新提醒时间后重新设置定时提醒
    if (settings.dailyReminder) {
      setupDailyReminder(newTime);
    }
  };

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // 权限获取成功，设置定时提醒
        if (settings?.dailyReminder && settings?.reminderTime) {
          setupDailyReminder(settings.reminderTime);
        }
      }
    }
  };

  // 设置每日定时提醒
  const setupDailyReminder = (timeStr: string) => {
    // 清除可能存在的旧定时器
    if (window.notificationTimer) {
      clearTimeout(window.notificationTimer);
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // 如果今天的提醒时间已过，则设置为明天
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const delay = reminderTime.getTime() - now.getTime();
    
    // 设置定时器
    window.notificationTimer = setTimeout(() => {
      showNotification();
      // 提醒后重新设置下一次提醒
      setupDailyReminder(timeStr);
    }, delay);
  };

  // 显示通知
  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('每日记录提醒', {
        body: '该记录今天的心情了！',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'daily-reflection-reminder'
      }).onclick = () => {
        window.focus();
      };
    }
  };

  // 组件挂载时设置提醒
  useEffect(() => {
    if (settings?.dailyReminder && settings?.reminderTime) {
      // 检查是否有权限
      if ('Notification' in window && Notification.permission === 'granted') {
        setupDailyReminder(settings.reminderTime);
      }
    }
    
    // 组件卸载时清除定时器
    return () => {
      if (window.notificationTimer) {
        clearTimeout(window.notificationTimer);
      }
    };
  }, [settings?.dailyReminder, settings?.reminderTime]);
  
  return (
    <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
      <div className="max-w-[800px] mx-auto px-24 pt-24">
        {/* 标题 */}
        <div className="mb-32 animate-fade-in">
          <div className="flex items-center gap-12 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-h1 font-bold text-neutral-dark">设置</h1>
          </div>
          <p className="text-body text-neutral-stone">
            管理你的应用偏好设置
          </p>
        </div>
        
        {/* 用户信息卡 */}
        <div className="mb-32 p-24 rounded-xl bg-white shadow-sm border border-neutral-mist animate-slide-up">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-16">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-8 mb-4">
                  <input
                    type="text"
                    value={settings?.nickname || '朋友'}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    className="text-h3 font-semibold text-neutral-dark bg-transparent border-none outline-none"
                    maxLength={20}
                  />
                </div>
                <p className="text-body-small text-neutral-stone">
                  已坚持记录 {stats?.continuousDays || 0} 天
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 隐私设置 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16 flex items-center gap-8">
            <Shield className="w-5 h-5 text-primary-500" />
            隐私设置
          </h3>
          <div className="bg-white rounded-xl border border-neutral-mist shadow-sm overflow-hidden">
            {/* 默认隐私模式 */}
            <div className="flex items-center justify-between p-24 border-b border-neutral-mist">
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

        {/* 提醒设置 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16 flex items-center gap-8">
            <Bell className="w-5 h-5 text-primary-500" />
            提醒设置
          </h3>
          <div className="bg-white rounded-xl border border-neutral-mist shadow-sm overflow-hidden">
            {/* 每日提醒 */}
            <div className="flex items-center justify-between p-24">
              <div className="flex items-center gap-12">
                <Bell className="w-5 h-5 text-neutral-stone" />
                <div>
                  <div className="text-body text-neutral-dark">每日记录提醒</div>
                  <div className="text-caption text-neutral-stone">
                    {settings?.dailyReminder ? `每天 ${settings.reminderTime} 提醒` : '关闭状态'}
                    {settings?.dailyReminder && (
                      <input
                        type="time"
                        value={settings.reminderTime}
                        onChange={(e) => handleReminderTimeChange(e.target.value)}
                        className="mt-4 px-12 py-8 rounded-lg border border-neutral-mist focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('dailyReminder', !settings?.dailyReminder)}
                className={`
                  relative w-12 h-7 rounded-full transition-colors duration-normal
                  ${settings?.dailyReminder ? 'bg-primary-500' : 'bg-neutral-mist'}
                `}
              >
                <div className={`
                  absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-normal
                  ${settings?.dailyReminder ? 'translate-x-[22px]' : 'translate-x-1'}
                `} />
              </button>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16 flex items-center gap-8">
            <Shield className="w-5 h-5 text-primary-500" />
            数据管理
          </h3>
          <div className="bg-white rounded-xl border border-neutral-mist shadow-sm overflow-hidden">
            {/* 数据导入和导出 */}
            <div className="grid grid-cols-2 border-b border-neutral-mist">
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

            {/* 存储空间信息 */}
            <div className="p-24">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-body text-neutral-dark">存储统计</div>
                  <div className="text-caption text-neutral-stone">
                    共 {stats?.totalRecords || 0} 条记录
                  </div>
                </div>
                <div className="text-caption text-neutral-stone">
                  本地存储
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷标签管理 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16 flex items-center gap-8">
            <Palette className="w-5 h-5 text-primary-500" />
            快捷标签
          </h3>
          <div className="bg-white rounded-xl border border-neutral-mist shadow-sm p-24">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {tags.map(tag => (
                <div key={tag.id} className="opacity-90 hover:opacity-100 transition-opacity duration-200">
                  <EmotionTag
                    tag={tag}
                    selected={false}
                    onClick={() => {}}
                  />
                </div>
              ))}
            </div>
            <p className="text-caption text-neutral-stone mt-16 text-center">
              常用情绪标签，用于快速记录
            </p>
          </div>
        </div>

        {/* 系统状态 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16 flex items-center gap-8">
            <Bot className="w-5 h-5 text-primary-500" />
            系统状态
          </h3>
          <div className="bg-white rounded-xl border border-neutral-mist shadow-sm overflow-hidden">
            {/* AI服务状态 */}
            <div className="flex items-center justify-between p-24">
              <div className="flex items-center gap-12">
                <Bot className="w-5 h-5 text-neutral-stone" />
                <span className="text-body text-neutral-dark">AI服务状态</span>
              </div>
              <div className="flex items-center gap-8">
                <div className={`w-2 h-2 rounded-full ${
                  aiServiceStatus.checking ? 'animate-pulse bg-yellow-500' :
                  aiServiceStatus.available ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className={`text-caption ${
                  aiServiceStatus.available ? 'text-green-600' : 
                  aiServiceStatus.checking ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {aiServiceStatus.message}
                </span>
                {!aiServiceStatus.available && !aiServiceStatus.checking && (
                  <button 
                    onClick={checkAIServiceStatus}
                    className="text-caption text-primary-500 hover:text-primary-600 underline"
                  >
                    重新检查
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 关于 */}
        <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="p-24 rounded-xl bg-white border border-neutral-mist shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <img src="/icon-192.svg" alt="心迹logo" className="w-8 h-8" />
                <div>
                  <div className="text-body font-medium text-neutral-dark">心迹</div>
                  <div className="text-caption text-neutral-stone">v2.0.1</div>
                </div>
              </div>
              <div className="text-caption text-neutral-stone">
                温柔对待自己的每一个瞬间
              </div>
            </div>
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
    </div>
  );
};