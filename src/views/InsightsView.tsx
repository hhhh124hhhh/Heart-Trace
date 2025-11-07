import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Award,
  Loader2,
  Calendar,
  Lightbulb,
  Activity,
  Smile
} from 'lucide-react';
import { weeklyStatsDB } from '../lib/storage';
import { WeeklySummaryModal } from '../components/WeeklySummaryModal';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';
import type { WeeklyStats } from '../types';

export const InsightsView: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
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
      setError('加载洞察数据失败');
      console.error('Insights load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 计算情绪健康度评分 (0-100)
  const calculateEmotionHealthScore = (stats: WeeklyStats): number => {
    if (stats.totalRecords === 0) return 0;
    
    // 调整权重：更注重情绪质量，减少连续性的影响
    const calmnessWeight = 0.45;    // 平静度权重增加
    const positivityWeight = 0.35;  // 正向度权重增加
    const consistencyWeight = 0.20; // 连续性权重降低
    
    const calmnessScore = stats.averageEmotions.calmness;
    const positivityScore = stats.averageEmotions.positivity;
    
    // 连续性评分：最多影响20分，而不是30分
    const consistencyScore = Math.min((stats.continuousDays / 7) * 100, 100) * 0.2;
    
    // 记录频率加成：记录多的用户有小幅加成
    const frequencyBonus = Math.min(stats.totalRecords * 2, 10); // 最多10分加成
    
    const baseScore = calmnessScore * calmnessWeight + positivityScore * positivityWeight;
    
    // 应用连续性评分
    const finalScore = Math.round(baseScore + consistencyScore + frequencyBonus);
    
    // 确保分数在0-100范围内
    return Math.min(Math.max(finalScore, 0), 100);
  };

  // 情绪英文到中文的映射
  const getChineseEmotion = (emotion: string): string => {
    const emotionMap: { [key: string]: string } = {
      // 系统中实际存在的8个情绪
      'happy': '开心',
      'calm': '平静',
      'grateful': '感恩',
      'sad': '难过',
      'excited': '兴奋',
      'anxious': '焦虑',
      'tired': '疲惫',
      'down': '失落'
    };
    return emotionMap[emotion] || emotion;
  };

  // 获取情绪颜色
  const getEmotionColor = (emotion: string): string => {
    const emotionColors: { [key: string]: string } = {
      // 系统中实际存在的8个情绪（中文和英文映射）
      '开心': '#FFB74D',
      '平静': '#66BB6A',
      '感恩': '#FFA726',
      '难过': '#64B5F6',
      '兴奋': '#FF7043',
      '焦虑': '#BA68C8',
      '疲惫': '#90A4AE',
      '失落': '#78909C',
      // 英文映射（兼容现有数据）
      'happy': '#FFB74D',
      'calm': '#66BB6A',
      'grateful': '#FFA726',
      'sad': '#64B5F6',
      'excited': '#FF7043',
      'anxious': '#BA68C8',
      'tired': '#90A4AE',
      'down': '#78909C'
    };
    return emotionColors[emotion] || '#8B5CF6';
  };

  // 获取情绪健康度等级
  const getHealthGrade = (score: number): { grade: string; color: string; description: string } => {
    if (score >= 80) return { grade: '优秀', color: 'text-green-600', description: '情绪状态非常棒' };
    if (score >= 60) return { grade: '良好', color: 'text-blue-600', description: '情绪状态不错' };
    if (score >= 40) return { grade: '一般', color: 'text-yellow-600', description: '情绪状态需要关注' };
    return { grade: '需改善', color: 'text-red-600', description: '情绪状态需要调整' };
  };

  // 生成个性化建议
  const generatePersonalizedSuggestions = (stats: WeeklyStats, healthScore: number): {
    title: string;
    icon: React.ElementType;
    suggestions: string[];
    color: string;
    bgColor: string;
  } => {
    const topEmotion = stats.topEmotions[0]?.emotion || '';
    const chineseEmotion = getChineseEmotion(topEmotion);
    
    // 根据健康度评分生成建议
    if (healthScore >= 80) {
      // 优秀状态建议
      return {
        title: '继续保持优秀状态',
        icon: Award,
        suggestions: [
          `你本周${chineseEmotion}的状态很棒，可以尝试分享你的积极心态`,
          '保持规律记录，探索更深层的情绪洞察',
          '尝试新的情绪调节技巧，提升情绪管理能力'
        ],
        color: 'text-green-600',
        bgColor: 'from-green-50 to-emerald-50'
      };
    } else if (healthScore >= 60) {
      // 良好状态建议
      const frequencySuggestion = stats.totalRecords < 5 ? '增加记录频率，每天花几分钟记录感受' : '保持记录习惯，关注情绪变化';
      
      return {
        title: '巩固良好状态',
        icon: Smile,
        suggestions: [
          frequencySuggestion,
          chineseEmotion ? `识别${chineseEmotion}情绪的触发因素，更好地管理` : '关注主要情绪的触发因素',
          '练习深呼吸或冥想，增强情绪稳定性'
        ],
        color: 'text-blue-600',
        bgColor: 'from-blue-50 to-indigo-50'
      };
    } else if (healthScore >= 40) {
      // 一般状态建议
      const calmnessSuggestion = stats.averageEmotions.calmness < 50 ? 
        '多尝试放松技巧，如听音乐、散步' : 
        '保持内心平静，这是很好的基础';
      
      return {
        title: '关注情绪健康',
        icon: Activity,
        suggestions: [
          calmnessSuggestion,
          stats.continuousDays < 3 ? '建立每天记录的习惯，连续性很重要' : '坚持记录，你会看到进步',
          '关注睡眠质量和运动，它们对情绪影响很大'
        ],
        color: 'text-yellow-600',
        bgColor: 'from-yellow-50 to-amber-50'
      };
    } else {
      // 需要改善状态建议
      return {
        title: '温柔照顾自己',
        icon: Heart,
        suggestions: [
          '从每天简单记录开始，不需要长篇大论',
          '识别主要压力源，尝试简单的减压方法',
          '保证充足睡眠，这是情绪健康的基石'
        ],
        color: 'text-red-600',
        bgColor: 'from-red-50 to-pink-50'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
        <div className="max-w-[800px] mx-auto px-24 pt-24">
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-16" />
            <p className="text-body text-neutral-stone">正在加载洞察数据...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
        <div className="max-w-[800px] mx-auto px-24 pt-24">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-16">
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-body text-red-600 mb-16">{error}</p>
            <button
              onClick={loadWeeklyStats}
              className="px-16 py-12 rounded-full bg-primary-500 text-white text-body-small hover:bg-primary-600 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weekStart = weeklyStats ? new Date(weeklyStats.weekRange.start).toLocaleDateString('zh-CN') : '';
  const weekEnd = weeklyStats ? new Date(weeklyStats.weekRange.end).toLocaleDateString('zh-CN') : '';
  const hasData = weeklyStats && weeklyStats.totalRecords > 0;
  const healthScore = weeklyStats ? calculateEmotionHealthScore(weeklyStats) : 0;
  const healthGrade = weeklyStats ? getHealthGrade(healthScore) : { grade: '', color: '', description: '' };
  const personalizedSuggestions = weeklyStats ? generatePersonalizedSuggestions(weeklyStats, healthScore) : null;

  return (
    <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
      <div className="max-w-[800px] mx-auto px-24 pt-24">
        {/* 标题 */}
        <div className="mb-32 animate-fade-in">
          <div className="flex items-center gap-12 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-h1 font-bold text-neutral-dark">情绪洞察</h1>
          </div>
          <p className="text-body text-neutral-stone">
            了解你的情绪模式和成长趋势
          </p>
        </div>

        {hasData ? (
          <>
            {/* 情绪健康度仪表盘 */}
            <motion.div
              className="bg-white rounded-2xl border border-neutral-mist p-24 mb-24 shadow-sm"
              initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
              animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
            >
              <div className="text-center mb-20">
                <h2 className="text-h3 font-semibold text-neutral-dark mb-8">本周情绪健康度</h2>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${healthGrade.color} mb-4`}>
                      {healthScore}
                    </div>
                    <div className={`text-body-small font-medium ${healthGrade.color}`}>
                      {healthGrade.grade}
                    </div>
                  </div>
                  <div className="w-px-32 h-1 bg-neutral-mist rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${
                        healthScore >= 80 ? 'from-green-400 to-green-500' :
                        healthScore >= 60 ? 'from-blue-400 to-blue-500' :
                        healthScore >= 40 ? 'from-yellow-400 to-yellow-500' :
                        'from-red-400 to-red-500'
                      }`}
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                  <p className="text-caption text-neutral-stone mt-4">
                    {healthGrade.description}
                  </p>
                </div>
              </div>

              {/* 核心指标 */}
              <div className="grid grid-cols-3 gap-16">
                <div className="text-center p-16 bg-neutral-50 rounded-xl">
                  <div className="text-3xl font-bold text-primary-600 mb-4">
                    {weeklyStats.totalRecords}
                  </div>
                  <div className="text-caption text-neutral-stone">本周记录</div>
                </div>
                
                <div className="text-center p-16 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-4">
                    {weeklyStats.continuousDays}
                  </div>
                  <div className="text-caption text-neutral-stone">连续天数</div>
                </div>
                
                <div className="p-16 bg-blue-50 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {weeklyStats.topEmotions.length > 0 ? getChineseEmotion(weeklyStats.topEmotions[0].emotion) : '暂无数据'}
                  </div>
                  <div className="text-caption text-neutral-stone">一周的主要情绪</div>
                </div>
              </div>

              {/* 点击查看详情 */}
              <div className="text-center">
                <button
                  onClick={() => setShowWeeklySummary(true)}
                  className="px-20 py-12 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                >
                  查看详细分析
                </button>
              </div>
            </motion.div>

            {/* 个性化建议板块 */}
            {personalizedSuggestions && (
              <motion.div
                className={`bg-gradient-to-r ${personalizedSuggestions.bgColor} rounded-2xl border border-neutral-mist p-24 mb-24 shadow-sm`}
                initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
                animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
                style={{ animationDelay: '0.05s' }}
              >
                <div className="flex items-center gap-12 mb-16">
                  <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center`}>
                    <personalizedSuggestions.icon className={`w-5 h-5 ${personalizedSuggestions.color}`} />
                  </div>
                  <h3 className="text-body font-semibold text-neutral-dark">
                    {personalizedSuggestions.title}
                  </h3>
                </div>
                
                <div className="space-y-12">
                  {personalizedSuggestions.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className={`w-3 h-3 ${personalizedSuggestions.color}`} />
                      </div>
                      <p className={`text-body text-neutral-dark leading-relaxed`}>
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 情绪分布和趋势 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 mb-24">
              {/* 情绪分布 */}
              <motion.div
                className="bg-white rounded-2xl border border-neutral-mist p-24 shadow-sm"
                initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
                animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
                style={{ animationDelay: '0.1s' }}
              >
                <h3 className="text-body font-semibold text-neutral-dark mb-16 flex items-center gap-8">
                  <Heart className="w-5 h-5 text-primary-500" />
                  情绪分布
                </h3>
                
                {weeklyStats.topEmotions.length > 0 && (
                  <div className="space-y-12">
                    {weeklyStats.topEmotions.slice(0, 3).map((emotion, index) => (
                      <div key={emotion.emotion} className="flex items-center justify-between p-12 bg-neutral-50 rounded-lg">
                        <div className="flex items-center gap-12">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getEmotionColor(emotion.emotion) }}
                          />
                          <span className="text-body-small font-medium text-neutral-dark">
                            {getChineseEmotion(emotion.emotion)}
                          </span>
                        </div>
                        <div className="flex items-center gap-8">
                          <span className="text-body-small text-neutral-stone">
                            {emotion.percentage}%
                          </span>
                          <div className="w-16 bg-neutral-mist rounded-full h-2">
                            <div 
                              className="h-full rounded-full bg-primary-500"
                              style={{ width: `${emotion.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* 情绪趋势 */}
              <motion.div
                className="bg-white rounded-2xl border border-neutral-mist p-24 shadow-sm"
                initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
                animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
                style={{ animationDelay: '0.2s' }}
              >
                <h3 className="text-body font-semibold text-neutral-dark mb-16 flex items-center gap-8">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  本周情绪趋势
                </h3>
                
                <div className="space-y-12">
                  {[...weeklyStats.dayDistribution]
                    .sort((a, b) => {
                      // 获取星期几（0是周日，1-6是周一到周六）
                      const dayA = new Date(a.date).getDay();
                      const dayB = new Date(b.date).getDay();
                      
                      // 将周日(0)转换为7，确保周一(1)到周日(7)的顺序
                      const sortA = dayA === 0 ? 7 : dayA;
                      const sortB = dayB === 0 ? 7 : dayB;
                      
                      return sortA - sortB;
                    })
                    .map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-8">
                      <div className="flex items-center gap-8">
                        <div className="text-caption text-neutral-stone w-12">
                          {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                        </div>
                        <div className="text-body-small text-neutral-dark">
                          {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-caption text-neutral-stone">
                          记录数: {day.count}
                        </div>
                        {day.primaryEmotion && (
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getEmotionColor(day.primaryEmotion) }}
                            />
                            <span className="text-caption text-neutral-dark">
                              {getChineseEmotion(day.primaryEmotion!)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

  
            {/* 智能洞察卡片 */}
            <motion.div
              className="grid grid-cols-1 gap-16 mb-24"
              initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
              animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
              style={{ animationDelay: '0.4s' }}
            >
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-20 text-center">
                <Award className="w-8 h-8 text-purple-500 mx-auto mb-12" />
                <h3 className="text-body font-semibold text-neutral-dark mb-8">
                  {weeklyStats.totalRecords === 0 ? '开始记录你的第一个心情吧！' :
                   weeklyStats.continuousDays >= 7 ? '太棒了！你已经坚持记录了一整周！' :
                   weeklyStats.totalRecords >= 10 ? '你有很多感触和思考，继续保持这份敏感！' :
                   weeklyStats.averageEmotions.positivity >= 70 ? '这周的心情很积极呢，继续保持好心态！' :
                   weeklyStats.averageEmotions.calmness >= 70 ? '内心很平静，这种状态真好！' :
                   '每一步都值得被记录，加油！'}
                </h3>
                <p className="text-body text-neutral-stone">
                  继续用心记录生活的每一刻 ✨
                </p>
              </div>
            </motion.div>
          </>
        ) : (
          /* 无数据状态 */
          <motion.div
            className="text-center py-32"
            initial={shouldAnimate ? ANIMATIONS.FADE_IN_UP.initial : {}}
            animate={shouldAnimate ? ANIMATIONS.FADE_IN_UP.animate : {}}
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-24">
              <BarChart3 className="w-12 h-12 text-primary-500" />
            </div>
            <h3 className="text-h3 font-semibold text-neutral-dark mb-8">
              还没有洞察数据
            </h3>
            <p className="text-body text-neutral-stone mb-24">
              开始记录你的心情，就能在这里看到有趣的洞察分析
            </p>
          </motion.div>
        )}

        {/* 周总结弹窗 */}
        <WeeklySummaryModal
          isOpen={showWeeklySummary}
          onClose={() => setShowWeeklySummary(false)}
        />
      </div>
    </div>
  );
};