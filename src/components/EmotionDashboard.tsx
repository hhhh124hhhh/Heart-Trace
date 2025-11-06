import React from 'react';
import { TrendingUp, TrendingDown, Minus, Flame, PenTool, Sparkles } from 'lucide-react';
import type { DailyRecord, Tag } from '../types';

interface EmotionDashboardProps {
  records: DailyRecord[];
  tags: Tag[];
}

interface EmotionData {
  tag: Tag;
  count: number;
  percentage: number;
}

interface AchievementData {
  continuousDays: number;
  weekRecords: number;
  totalRecords: number;
}

export const EmotionDashboard: React.FC<EmotionDashboardProps> = ({ records, tags }) => {
  // 获取今日情绪状态
  const getTodayEmotion = () => {
    const today = new Date();
    const todayRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === today.toDateString();
    });

    if (todayRecords.length === 0) return null;
    
    const latestRecord = todayRecords[todayRecords.length - 1];
    const selectedTagId = latestRecord.tags[0];
    const selectedTag = tags.find(tag => tag.id === selectedTagId);
    
    return {
      tag: selectedTag,
      record: latestRecord,
      content: latestRecord.content
    };
  };

  // 获取昨日情绪对比
  const getYesterdayComparison = (todayRecord?: DailyRecord) => {
    if (!todayRecord || !todayRecord.emotionAnalysis) return null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === yesterday.toDateString() && record.emotionAnalysis;
    });

    if (yesterdayRecords.length === 0) return null;

    const yesterdayRecord = yesterdayRecords[yesterdayRecords.length - 1];
    const todayAnalysis = todayRecord.emotionAnalysis;
    const yesterdayAnalysis = yesterdayRecord.emotionAnalysis!;

    // 比较主要情绪指标
    const calmnessDiff = todayAnalysis.calmness - yesterdayAnalysis.calmness;
    const positivityDiff = todayAnalysis.positivity - yesterdayAnalysis.positivity;
    const energyDiff = todayAnalysis.energy - yesterdayAnalysis.energy;

    // 简单的情绪趋势判断
    const avgDiff = (calmnessDiff + positivityDiff + energyDiff) / 3;
    
    if (Math.abs(avgDiff) < 5) {
      return { trend: 'stable', text: '和昨天心情差不多' };
    } else if (avgDiff > 0) {
      return { trend: 'better', text: '比昨天更积极一些' };
    } else {
      return { trend: 'worse', text: '比昨天需要更多关爱' };
    }
  };

  // 获取成就数据
  const getAchievements = (): AchievementData => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 本周开始（周日）
    
    // 计算连续天数（简化版，实际应该检查是否真的连续）
    const continuousDays = records.length > 0 ? Math.min(30, records.length) : 0;
    
    // 本周记录数
    const weekRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart;
    }).length;

    return {
      continuousDays,
      weekRecords,
      totalRecords: records.length
    };
  };

  // 获取本周情绪分布
  const getWeekEmotionDistribution = (): EmotionData[] => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // 最近7天

    const weekRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart;
    });

    const tagCounts: { [key: string]: number } = {};
    
    weekRecords.forEach(record => {
      record.tags.forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });

    const total = Object.values(tagCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(tagCounts)
      .map(([tagId, count]) => {
        const tag = tags.find(t => t.id === tagId);
        if (!tag) return null;
        return {
          tag,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
      })
      .filter((item): item is EmotionData => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // 只显示前3个
  };

  const todayEmotion = getTodayEmotion();
  const comparison = todayEmotion ? getYesterdayComparison(todayEmotion.record) : null;
  const achievements = getAchievements();
  const weekEmotions = getWeekEmotionDistribution();

  
  // 情绪图标映射
  const getEmotionIcon = (tagId: string) => {
    const iconMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      angry: '😤',
      peaceful: '😌',
      excited: '🤗',
      tired: '😴',
      confused: '😕'
    };
    return iconMap[tagId] || '💭';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'better': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'worse': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-neutral-stone" />;
    }
  };

  return (
    <div className="col-span-2 space-y-16">
      {/* 总是显示仪表盘标题 */}
  
      
      {/* 今日心情状态 */}
      <div className="p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="text-body-small text-neutral-stone mb-16">今日心情</div>
        {todayEmotion ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-16">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: todayEmotion.tag?.color || '#f0f0f0' }}
              >
                {getEmotionIcon(todayEmotion.tag?.id || '')}
              </div>
              <div>
                <div className="text-h3 font-semibold text-neutral-dark mb-4">
                  今天是{todayEmotion.tag?.name || '记录'}的一天
                </div>
                {comparison && (
                  <div className="flex items-center gap-8 text-body-small text-neutral-stone">
                    {getTrendIcon(comparison.trend)}
                    <span>{comparison.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-stone">
            <div className="text-4xl mb-8">💭</div>
            <div className="text-body">今天还没有记录</div>
          </div>
        )}
      </div>

      {/* 记录成就 - 总是显示 */}
      <div className="grid grid-cols-3 gap-12">
        <div className="p-16 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm text-center">
          <div className="flex justify-center mb-8">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-display font-bold text-neutral-dark mb-4">
            {achievements.continuousDays}
          </div>
          <div className="text-caption text-neutral-stone">连续天数</div>
        </div>
        
        <div className="p-16 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm text-center">
          <div className="flex justify-center mb-8">
            <PenTool className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-display font-bold text-neutral-dark mb-4">
            {achievements.weekRecords}
          </div>
          <div className="text-caption text-neutral-stone">本周记录</div>
        </div>
        
        <div className="p-16 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm text-center">
          <div className="flex justify-center mb-8">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-display font-bold text-neutral-dark mb-4">
            {achievements.totalRecords}
          </div>
          <div className="text-caption text-neutral-stone">总记录数</div>
        </div>
      </div>

      {/* 本周情绪分布 */}
      {weekEmotions.length > 0 ? (
        <div className="p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="text-body-small text-neutral-stone mb-16">本周情绪分布</div>
          <div className="space-y-12">
            {weekEmotions.map((emotion, index) => (
              <div key={emotion.tag.id} className="flex items-center justify-between">
                <div className="flex items-center gap-12">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: emotion.tag.color }}
                  >
                    {getEmotionIcon(emotion.tag.id)}
                  </div>
                  <span className="text-body text-neutral-dark">{emotion.tag.name}</span>
                  {index === 0 && (
                    <span className="px-8 py-4 bg-primary-100 text-primary-600 rounded-full text-caption">
                      最频繁
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(emotion.count, 7) }).map((_, i) => (
                      <div 
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: emotion.tag.color }}
                      />
                    ))}
                  </div>
                  <span className="text-body-small text-neutral-stone">
                    {emotion.count}天
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="text-body-small text-neutral-stone mb-16">本周情绪分布</div>
          <div className="text-center py-16 text-neutral-stone">
            <div className="text-body-small">暂无情绪数据</div>
          </div>
        </div>
      )}
    </div>
  );
};