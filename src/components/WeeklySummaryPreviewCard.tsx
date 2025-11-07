import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Heart, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { weeklyStatsDB } from '../lib/storage';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';
import type { WeeklyStats } from '../types';

interface WeeklySummaryPreviewCardProps {
  onOpenSummary: () => void;
}

export const WeeklySummaryPreviewCard: React.FC<WeeklySummaryPreviewCardProps> = ({
  onOpenSummary
}) => {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { shouldAnimate } = useAnimation();

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  const loadWeeklyStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const stats = await weeklyStatsDB.getWeeklyStats();
      setWeeklyStats(stats);
    } catch (err) {
      setError('加载周统计失败');
      console.error('Weekly preview load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-mist p-20 mb-24">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-8 text-body text-neutral-stone">加载本周统计...</span>
        </div>
      </div>
    );
  }

  if (error || !weeklyStats) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-mist p-20 mb-24">
        <div className="flex items-center justify-center py-16">
          <span className="text-body text-neutral-stone">暂无本周数据</span>
        </div>
      </div>
    );
  }

  // 如果本周没有任何记录，不显示卡片
  if (weeklyStats.totalRecords === 0) {
    return null;
  }

  const weekStart = new Date(weeklyStats.weekRange.start).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
  const weekEnd = new Date(weeklyStats.weekRange.end).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });

  const topEmotion = weeklyStats.topEmotions[0];
  const hasTrend = weeklyStats.totalRecords > weeklyStats.previousWeekRecords;

  return (
    <motion.div
      className="bg-white rounded-2xl border border-neutral-mist p-20 mb-24 cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={onOpenSummary}
      initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
      animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
      whileHover={{ y: -2 }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-12">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-h3 font-semibold text-neutral-dark">本周心迹总结</h3>
            <p className="text-body-small text-neutral-stone">
              {weekStart} - {weekEnd}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-stone group-hover:text-primary-500 transition-colors" />
      </div>

      {/* 核心指标预览 */}
      <div className="grid grid-cols-3 gap-16 mb-16">
        <div className="text-center">
          <div className="text-h2 font-bold text-primary-600 mb-4">
            {weeklyStats.totalRecords}
          </div>
          <div className="text-body-small text-neutral-stone">条记录</div>
        </div>
        
        <div className="text-center">
          <div className="text-h2 font-bold text-green-600 mb-4">
            {weeklyStats.continuousDays}
          </div>
          <div className="text-body-small text-neutral-stone">连续天数</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <TrendingUp className={`w-4 h-4 ${hasTrend ? 'text-green-500' : 'text-neutral-stone'}`} />
            <span className={`text-h2 font-bold ${hasTrend ? 'text-green-600' : 'text-neutral-dark'}`}>
              {topEmotion?.emotion || '平静'}
            </span>
          </div>
          <div className="text-body-small text-neutral-stone">主要情绪</div>
        </div>
      </div>

      {/* 简化的情绪分布 */}
      {weeklyStats.topEmotions.length > 0 && (
        <div className="bg-neutral-50 rounded-xl p-12 mb-16">
          <div className="flex items-center gap-8">
            <Heart className="w-4 h-4 text-primary-500" />
            <span className="text-body-small font-medium text-neutral-dark">情绪分布</span>
          </div>
          
          <div className="flex gap-8 mt-8 flex-wrap">
            {weeklyStats.topEmotions.slice(0, 3).map((emotion, index) => (
              <div key={emotion.emotion} className="flex items-center gap-4">
                <div 
                  className="w-3 h-3 rounded-full bg-primary-500"
                  style={{ 
                    backgroundColor: index === 0 ? '#8B5CF6' : index === 1 ? '#A78BFA' : '#C4B5FD'
                  }}
                />
                <span className="text-body-small text-neutral-dark">{emotion.emotion}</span>
                <span className="text-body-small text-neutral-stone">{emotion.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 趋势指示器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          {hasTrend ? (
            <div className="flex items-center gap-4 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-body-small font-medium">
                比上周更积极
              </span>
            </div>
          ) : weeklyStats.totalRecords < weeklyStats.previousWeekRecords ? (
            <div className="flex items-center gap-4 text-neutral-stone">
              <span className="text-body-small">
                记录数量平稳
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-neutral-stone">
              <span className="text-body-small">
                保持良好记录习惯
              </span>
            </div>
          )}
        </div>
        
        <button className="text-body-small text-primary-600 hover:text-primary-700 transition-colors font-medium">
          查看详情 →
        </button>
      </div>
    </motion.div>
  );
};