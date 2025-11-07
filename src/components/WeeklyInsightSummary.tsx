import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { weeklyStatsDB } from '../lib/storage';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';
import type { WeeklyStats } from '../types';

interface WeeklyInsightSummaryProps {
  onNavigateToInsights: () => void;
}

export const WeeklyInsightSummary: React.FC<WeeklyInsightSummaryProps> = ({
  onNavigateToInsights
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
      setError('加载失败');
      console.error('Weekly summary load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 如果没有数据或正在加载，不显示
  if (loading || error || !weeklyStats || weeklyStats.totalRecords === 0) {
    return null;
  }

  const topEmotion = weeklyStats.topEmotions[0];
  const hasTrend = weeklyStats.totalRecords > weeklyStats.previousWeekRecords;

  // 根据用户要求，删除整个组件元素
  return null;
};