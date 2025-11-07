import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  TrendingDown, 
  Heart, 
  Target, 
  Zap,
  BarChart3,
  MessageCircle,
  Award
} from 'lucide-react';
import { weeklyStatsDB } from '../lib/storage';
import { EmotionDashboard } from './EmotionDashboard';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';
import type { WeeklyStats } from '../types';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate?: Date;
}

// 情绪名称映射：英文 -> 中文
export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({ 
  isOpen, 
  onClose, 
  targetDate 
}) => {
  // 情绪名称映射函数
  const getChineseEmotion = (emotionName: string): string => {
    const emotionMap: {[key: string]: string} = {
      'happy': '开心',
      'excited': '兴奋',
      'calm': '平静',
      'peaceful': '平和',
      'relaxed': '放松',
      'sad': '难过',
      'angry': '愤怒',
      'anxious': '焦虑',
      'tired': '疲惫',
      'grateful': '感恩',
      'confident': '自信',
      'motivated': '有动力',
      'lonely': '孤独',
      'hopeful': '充满希望',
      'satisfied': '满足',
      'frustrated': '沮丧',
      'stressed': '压力大',
      'joyful': '愉悦',
      'content': '满足',
      'optimistic': '乐观'
    };
    // 如果找到对应中文，则返回中文，否则返回原名称（假设已经是中文）
    return emotionMap[emotionName.toLowerCase()] || emotionName;
  };

  // 计算情绪稳定性
  const calculateEmotionalStability = (stats: WeeklyStats): { isStable: boolean; score: number } => {
    if (stats.totalRecords < 3) return { isStable: false, score: 0 };
    
    // 基于情绪分析数据计算方差
    const emotions = [];
    // 这里需要从dayDistribution中获取更详细的情绪数据
    // 暂时使用基础的情绪稳定性计算
    const variance = Math.abs(stats.averageEmotions.calmness - 70) / 100 + 
                     Math.abs(stats.averageEmotions.positivity - 70) / 100 +
                     Math.abs(stats.averageEmotions.energy - 70) / 100;
    
    const score = Math.round(Math.max(0, (1 - variance / 3)) * 100);
    return {
      isStable: score >= 70,
      score
    };
  };

  // 寻找特殊模式
  const findSpecialPattern = (stats: WeeklyStats): string | null => {
    // 检查周末情绪模式
    const weekendDays = stats.dayDistribution.slice(-2); // 周六、周日
    const weekdayDays = stats.dayDistribution.slice(0, -2); // 周一到周五
    
    if (weekendDays.length > 0 && weekdayDays.length > 0) {
      const weekendAvgRecords = weekendDays.reduce((sum, day) => sum + day.count, 0) / weekendDays.length;
      const weekdayAvgRecords = weekdayDays.reduce((sum, day) => sum + day.count, 0) / weekdayDays.length;
      
      if (weekendAvgRecords > weekdayAvgRecords * 1.5) {
        return "周末更倾向于记录心情，情绪表达更丰富";
      }
    }
    
    // 检查情绪逐步改善模式
    if (stats.dayDistribution.length >= 3) {
      const firstHalf = stats.dayDistribution.slice(0, 3);
      const secondHalf = stats.dayDistribution.slice(-3);
      
      const firstHalfRecords = firstHalf.reduce((sum, day) => sum + day.count, 0);
      const secondHalfRecords = secondHalf.reduce((sum, day) => sum + day.count, 0);
      
      if (secondHalfRecords > firstHalfRecords * 1.2) {
        return "本周后期记录更频繁，情绪觉察力在提升";
      }
    }
    
    // 检查高连续性模式
    if (stats.continuousDays >= 7 && stats.totalRecords >= 10) {
      return "坚持了一整周且记录丰富，养成了很好的情绪觉察习惯";
    }
    
    return null;
  };

  // 生成增强总结
  const generateEnhancedSummary = (stats: WeeklyStats): {
    main: string;
    insights: string[];
    encouragement: string;
  } => {
    const insights = [];
    
    // 基础数据总结
    const topEmotion = stats.topEmotions.length > 0 ? getChineseEmotion(stats.topEmotions[0].emotion) : '平静';
    const main = `这周你记录了${stats.totalRecords}次心情，主要情绪是${topEmotion}`;
    
    // 记录频率洞察
    if (stats.totalRecords > stats.previousWeekRecords) {
      const improvement = stats.previousWeekRecords > 0 ? 
        Math.round(((stats.totalRecords - stats.previousWeekRecords) / stats.previousWeekRecords) * 100) : 
        100;
      insights.push(`记录频率比上周提升了${improvement}%，情绪觉察更敏锐`);
    } else if (stats.totalRecords < stats.previousWeekRecords && stats.previousWeekRecords > 0) {
      insights.push(`记录次数比上周减少，但每一次记录都很有价值`);
    }
    
    // 情绪稳定性洞察
    const stability = calculateEmotionalStability(stats);
    if (stability.isStable) {
      insights.push("情绪稳定性很好，内心比较平和");
    } else if (stability.score > 0) {
      insights.push("情绪有一些波动，但这是正常的过程");
    }
    
    // 连续性洞察
    if (stats.continuousDays >= 7) {
      insights.push("坚持了一整周，非常棒");
    } else if (stats.continuousDays >= 3) {
      insights.push(`连续记录${stats.continuousDays}天，继续保持`);
    }
    
    // 特殊发现
    const specialPattern = findSpecialPattern(stats);
    if (specialPattern) {
      insights.push(specialPattern);
    }
    
    // 情绪质量洞察
    if (stats.averageEmotions.calmness >= 70) {
      insights.push("整体平静度较高，内心状态不错");
    }
    if (stats.averageEmotions.positivity >= 70) {
      insights.push("积极情绪占主导，心态阳光");
    }
    
    return {
      main,
      insights: insights.slice(0, 3), // 最多3个要点
      encouragement: ""
    };
  };
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 分享功能已移除
  const { shouldAnimate } = useAnimation();

  const loadWeeklyStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stats = await weeklyStatsDB.getWeeklyStats(targetDate);
      setWeeklyStats(stats);
      
      // 标记为已查看
      if (!targetDate || isCurrentWeek(targetDate)) {
        await weeklyStatsDB.markWeeklySummaryViewed();
      }
    } catch (err) {
      setError('加载周总结失败，请重试');
      console.error('Weekly summary load error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  // 加载周统计数据
  useEffect(() => {
    if (isOpen) {
      loadWeeklyStats();
    }
  }, [isOpen, targetDate, loadWeeklyStats]);

  const isCurrentWeek = (date?: Date): boolean => {
    if (!date) return true;
    const now = new Date();
    const currentWeek = weeklyStatsDB.getWeekRange(now);
    const targetWeek = weeklyStatsDB.getWeekRange(date);
    
    return currentWeek.start.getTime() === targetWeek.start.getTime();
  };

  const getWeekChangeText = (current: number, previous: number): { text: string; type: 'increase' | 'decrease' | 'same' } => {
    if (current > previous) {
      const percentage = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
      return { 
        text: `+${percentage > 0 ? percentage + '%' : ''}`, 
        type: 'increase' 
      };
    } else if (current < previous) {
      const percentage = previous > 0 ? Math.round(((previous - current) / previous) * 100) : 0;
      return { 
        text: `-${percentage > 0 ? percentage + '%' : ''}`, 
        type: 'decrease' 
      };
    } else {
      return { text: '持平', type: 'same' };
    }
  };

  // 分享功能相关代码已全部移除

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-16">
      <motion.div
        className="bg-white rounded-2xl shadow-xl max-w-[800px] w-full max-h-[90vh] overflow-y-auto"
        initial={shouldAnimate ? ANIMATIONS.MODAL.initial : {}}
        animate={shouldAnimate ? ANIMATIONS.MODAL.animate : {}}
        exit={shouldAnimate ? ANIMATIONS.MODAL.exit : {}}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-mist">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-dark">本周心迹总结</h2>
              <p className="text-sm text-neutral-stone">
                {weeklyStats && (
                  `${new Date(weeklyStats.weekRange.start).toLocaleDateString('zh-CN')} - ${new Date(weeklyStats.weekRange.end).toLocaleDateString('zh-CN')}`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-3 rounded-full hover:bg-neutral-50 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-stone" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-body text-neutral-stone">正在生成本周总结...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-body text-red-600 mb-6">{error}</p>
              <button
                onClick={loadWeeklyStats}
                className="px-6 py-3 rounded-full bg-primary-500 text-white text-sm hover:bg-primary-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : weeklyStats ? (
            <motion.div
              className="space-y-6"
              initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
              animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
            >
              {/* 核心指标卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={MessageCircle}
                  label="本周记录"
                  value={weeklyStats.totalRecords}
                  change={getWeekChangeText(weeklyStats.totalRecords, weeklyStats.previousWeekRecords)}
                  color="blue"
                />
                <StatCard
                  icon={Heart}
                  label="连续天数"
                  value={weeklyStats.continuousDays}
                  color="red"
                />
                <StatCard
                  icon={Target}
                  label="平静度"
                  value={`${weeklyStats.averageEmotions.calmness}%`}
                  color="green"
                  isAnalytical={true}
                />
                <StatCard
                  icon={Zap}
                  label="能量值"
                  value={`${weeklyStats.averageEmotions.energy}%`}
                  color="yellow"
                  isAnalytical={true}
                />
              </div>

              {/* 主要情绪分析 */}
              <div className="bg-neutral-50 rounded-xl p-5">
                <h3 className="text-body font-medium text-neutral-dark mb-5 flex items-center gap-3">
                  <BarChart3 className="w-5 h-5" />
                  情绪分布
                </h3>
                
                {weeklyStats.topEmotions.length > 0 ? (
                  <div className="space-y-4">
                    {weeklyStats.topEmotions.slice(0, 3).map((emotion, index) => {
                      // 确保情绪名称始终显示为中文
                      // 使用组件顶层定义的getChineseEmotion函数
                      
                      const chineseEmotion = getChineseEmotion(emotion.emotion);
                      
                      return (
                        <div key={emotion.emotion} className="flex items-center gap-4">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{chineseEmotion}</span>
                              <span className="text-sm text-neutral-stone">{emotion.percentage}%</span>
                            </div>
                            <div className="w-full bg-neutral-mist rounded-full h-4">
                              <div 
                                className="bg-gradient-to-r from-primary-400 to-primary-500 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${emotion.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-body text-neutral-stone text-center py-6">本周暂无情绪记录</p>
                )}
              </div>

  
  
              {/* 增强总结话语 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                <Award className="w-6 h-6 text-purple-500 mx-auto mb-4" />
                
                {/* 主标题 */}
                <p className="text-body text-neutral-dark font-medium mb-4">
                  {(() => {
                    const summary = generateEnhancedSummary(weeklyStats);
                    return summary.main;
                  })()}
                </p>
                
                {/* 关键洞察列表 */}
                <div className="space-y-2 mb-4">
                  {(() => {
                    const summary = generateEnhancedSummary(weeklyStats);
                    return summary.insights.map((insight, index) => (
                      <div key={index} className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"></div>
                        <p className="text-sm text-neutral-dark leading-relaxed">{insight}</p>
                      </div>
                    ));
                  })()}
                </div>
                

              </div>

              {/* 操作按钮区域已移除分享功能 */}
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  change?: { text: string; type: 'increase' | 'decrease' | 'same' };
  color: 'blue' | 'red' | 'green' | 'yellow';
  isAnalytical?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, change, color, isAnalytical = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-500',
    red: 'bg-red-50 text-red-500',
    green: 'bg-green-50 text-green-500',
    yellow: 'bg-yellow-50 text-yellow-500'
  };

  // 显示纯数值，去除"（心情指数）"标记
  const displayValue = value;

  return (
    <div className="bg-white rounded-lg border border-neutral-mist p-4 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {change && (
          <div className={`flex items-center gap-2 text-xs ${
            change.type === 'increase' ? 'text-green-500' : 
            change.type === 'decrease' ? 'text-red-500' : 'text-neutral-stone'
          }`}>
            {change.type === 'increase' && <TrendingDown className="w-3 h-3 rotate-180" />}
            {change.type === 'decrease' && <TrendingDown className="w-3 h-3" />}
            {change.text}
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-neutral-dark mb-1">
        {displayValue}
      </div>
      <div className="text-sm text-neutral-stone">
        {label}
        {isAnalytical && (
          <span className="block text-[11px] mt-1 leading-5 text-neutral-stone/80">
            计算方式：基于您一周内的心情记录频率、情绪标签及关键词综合分析生成，范围0-100%
          </span>
        )}
      </div>
    </div>
  );
};

// 生成鼓励文案
const getEncouragementText = (stats: WeeklyStats): string => {
  if (stats.totalRecords === 0) {
    return '开始记录你的第一个心情吧！';
  }
  
  if (stats.continuousDays >= 7) {
    return '太棒了！你已经坚持记录了一整周！';
  }
  
  if (stats.totalRecords >= 10) {
    return '你有很多感触和思考，继续保持这份敏感！';
  }
  
  if (stats.averageEmotions.positivity >= 70) {
    return '这周的心情很积极呢，继续保持好心态！';
  }
  
  if (stats.averageEmotions.calmness >= 70) {
    return '内心很平静，这种状态真好！';
  }
  
  return '每一步都值得被记录，加油！';
};