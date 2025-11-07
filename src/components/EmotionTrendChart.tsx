import * as React from 'react';
import { useState } from 'react';
import * as Recharts from 'recharts';
import type { DailyRecord } from '../types';

// 使用unknown作为中间类型进行安全的类型断言
const LineChart = Recharts.LineChart as unknown as React.ElementType;
const Line = Recharts.Line as unknown as React.ElementType;
const XAxis = Recharts.XAxis as unknown as React.ElementType;
const YAxis = Recharts.YAxis as unknown as React.ElementType;
const CartesianGrid = Recharts.CartesianGrid as unknown as React.ElementType;
const Tooltip = Recharts.Tooltip as unknown as React.ElementType;
const ResponsiveContainer = Recharts.ResponsiveContainer as unknown as React.ElementType;
const ComposedChart = Recharts.ComposedChart as unknown as React.ElementType;
const Bar = Recharts.Bar as unknown as React.ElementType;
const Legend = Recharts.Legend as unknown as React.ElementType;
const Area = Recharts.Area as unknown as React.ElementType;

interface DayDistribution {
  date: string;
  count: number;
  primaryEmotion?: string;
  calmness?: number;
  positivity?: number;
  energy?: number;
}

interface EmotionTrendChartProps {
  records?: DailyRecord[];
  data?: DayDistribution[];
  compact?: boolean;
}

interface ChartData {
  date: string;
  dateLabel: string;
  平静度: number | null;
  正向度: number | null;
  能量值: number | null;
  记录数?: number;
}

// 主题颜色配置
const themeColors = {
  calmness: {
    primary: '#3b82f6',  // 蓝色 - 平静
    secondary: '#dbeafe', // 浅蓝色背景
    gradientStart: 'rgba(59, 130, 246, 0.3)',
    gradientEnd: 'rgba(59, 130, 246, 0.05)'
  },
  positivity: {
    primary: '#8b5cf6',  // 紫色 - 正向
    secondary: '#f3e8ff', // 浅紫色背景
    gradientStart: 'rgba(139, 92, 246, 0.3)',
    gradientEnd: 'rgba(139, 92, 246, 0.05)'
  },
  energy: {
    primary: '#f59e0b',  // 琥珀色 - 能量
    secondary: '#fffbeb', // 浅黄色背景
    gradientStart: 'rgba(245, 158, 11, 0.3)',
    gradientEnd: 'rgba(245, 158, 11, 0.05)'
  },
  count: {
    primary: '#10b981',  // 绿色 - 记录数
    secondary: '#d1fae5', // 浅绿色背景
  }
};

// 状态管理 - 控制显示的指标

export const EmotionTrendChart: React.FC<EmotionTrendChartProps> = ({ records, data, compact = false }) => {
  // 状态管理 - 控制显示的指标，默认全部显示
  const [visibleMetrics, setVisibleMetrics] = useState({
    平静度: true,
    正向度: true,
    能量值: true,
    记录数: true
  });
  
  // 情绪维度解释文本
  const emotionExplanations = {
    平静度: '反映情绪的稳定与平和程度，值越高表示情绪越稳定',
    正向度: '反映情绪的积极与愉悦程度，值越高表示情绪越积极',
    能量值: '反映情绪的活跃与动力程度，值越高表示情绪越活跃',
    记录数: '每日心情记录的次数，反映了你的记录频率'
  };
  
  // 切换指标显示状态
  const toggleMetric = (metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // 处理compact模式的数据
  const getCompactChartData = (): ChartData[] => {
    if (!data) return [];
    
    return data.map(day => {
      const date = new Date(day.date);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' });
      
      return {
        date: dateStr,
        dateLabel: weekday,
        // 正确处理情绪维度数据，确保它们能被正确显示
        平静度: typeof day.calmness === 'number' ? Math.round(day.calmness) : null,
        正向度: typeof day.positivity === 'number' ? Math.round(day.positivity) : null,
        能量值: typeof day.energy === 'number' ? Math.round(day.energy) : null,
        记录数: day.count
      };
    });
  };

  // 获取最近7天的数据，从周一开始计算
  const getLast7DaysData = (): ChartData[] => {
    // 方案1：如果有records数据，使用原始记录计算
    if (records && records.length > 0) {
      const chartData: ChartData[] = [];
      const today = new Date();
      
      // 计算本周一的日期 - 确保从周一开始
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日是0，要减6天；其他天减dayOfWeek-1天
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToSubtract);
      
      // 生成从周一开始的7天日期数组 (周一到周日) - 严格按照周一到周日顺序
      const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        const weekday = `周${dayNames[i]}`; // 确保正确的星期显示
        
        // 查找当天有情绪分析的记录
        const dayRecords = records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.toDateString() === date.toDateString() && record.emotionAnalysis;
        });
        
        if (dayRecords.length > 0) {
          // 计算当天所有记录的平均值，确保数据有效性
          const validRecords = dayRecords.filter(r => 
            r.emotionAnalysis && 
            typeof r.emotionAnalysis.calmness === 'number' &&
            typeof r.emotionAnalysis.positivity === 'number' &&
            typeof r.emotionAnalysis.energy === 'number'
          );
          
          if (validRecords.length > 0) {
            const totalRecords = validRecords.length;
            const totalCalmness = validRecords.reduce((sum, r) => sum + (r.emotionAnalysis!.calmness || 0), 0);
            const totalPositivity = validRecords.reduce((sum, r) => sum + (r.emotionAnalysis!.positivity || 0), 0);
            const totalEnergy = validRecords.reduce((sum, r) => sum + (r.emotionAnalysis!.energy || 0), 0);
            
            chartData.push({
              date: dateStr,
              dateLabel: weekday,
              平静度: Math.round(totalCalmness / totalRecords),
              正向度: Math.round(totalPositivity / totalRecords),
              能量值: Math.round(totalEnergy / totalRecords),
              记录数: totalRecords
            });
          } else {
            // 没有有效记录时使用默认值
            chartData.push({
              date: dateStr,
              dateLabel: weekday,
              平静度: null,
              正向度: null,
              能量值: null,
              记录数: 0
            });
          }
        } else {
            // 没有记录时使用默认值
            chartData.push({
              date: dateStr,
              dateLabel: weekday,
              平静度: null,
              正向度: null,
              能量值: null,
              记录数: 0
            });
        }
      }
      
      return chartData;
    }
    
    // 方案2：如果没有records但有data（来自周统计），使用data和默认值生成图表数据
    if (data && data.length > 0) {
      // 生成一个按周一到周日排序的日期映射
      const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToSubtract);
      
      // 创建日期到索引的映射
      const dateToIndexMap = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dateToIndexMap.set(date.toDateString(), i);
      }
      
      // 根据日期映射创建按周一到周日排序的图表数据
      const sortedData: ChartData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        const weekday = `周${dayNames[i]}`;
        
        // 查找当天的数据
        const dayData = data.find(d => {
          const dayDate = new Date(d.date);
          return dayDate.toDateString() === date.toDateString();
        });
        
        if (dayData) {
          sortedData.push({
            date: dateStr,
            dateLabel: weekday,
            平静度: typeof dayData.calmness === 'number' ? Math.round(dayData.calmness) : null,
            正向度: typeof dayData.positivity === 'number' ? Math.round(dayData.positivity) : null,
            能量值: typeof dayData.energy === 'number' ? Math.round(dayData.energy) : null,
            记录数: dayData.count
          });
        } else {
          // 没有数据时使用默认值
          sortedData.push({
            date: dateStr,
            dateLabel: weekday,
            平静度: null,
            正向度: null,
            能量值: null,
            记录数: 0
          });
        }
      }
      
      return sortedData;
    }
    
    return [];
  };

  const chartData = compact ? getCompactChartData() : getLast7DaysData();
  // 修改hasData判断逻辑，只要有记录数就认为有数据
  const hasData = chartData.some(d => d.记录数 > 0);

  if (!hasData) {
    return (
      <div className={`p-16 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm ${compact ? '' : 'col-span-2'}`}>
        <div className="text-body-small text-neutral-stone mb-8">{compact ? '本周心情记录' : '情绪趋势'}</div>
        <div className="flex flex-col items-center justify-center h-32 text-neutral-stone">
          <span className="text-body-small mb-2">暂无数据</span>
          <span className="text-xs text-neutral-stone/70">开始记录你的每日心情，系统将自动分析趋势</span>
        </div>
      </div>
    );
  }

  const titleText = compact ? '本周心情记录趋势' : '最近7天情绪分析趋势图';
  const subtitleText = compact ? '' : '系统根据你的记录自动分析情绪的三个维度';


  return (
    <div className={`p-6 rounded-2xl bg-white/95 backdrop-blur-sm shadow-md border border-gray-100 transition-all hover:shadow-lg ${compact ? '' : 'col-span-2'}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{titleText}</h3>
        {subtitleText && (
          <p className="text-sm text-gray-500">{subtitleText}</p>
        )}
      </div>
      
      {/* 交互式图例控制 */}
      <div className="flex flex-wrap justify-center gap-6 mb-6 bg-gray-50 p-3 rounded-lg">
          <button 
            onClick={() => toggleMetric('平静度')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${visibleMetrics.平静度 ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <div className={`w-3 h-3 rounded-full ${visibleMetrics.平静度 ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
            <span>平静度</span>
          </button>
          <button 
            onClick={() => toggleMetric('正向度')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${visibleMetrics.正向度 ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <div className={`w-3 h-3 rounded-full ${visibleMetrics.正向度 ? 'bg-purple-600' : 'bg-gray-400'}`}></div>
            <span>正向度</span>
          </button>
          <button 
            onClick={() => toggleMetric('能量值')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${visibleMetrics.能量值 ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <div className={`w-3 h-3 rounded-full ${visibleMetrics.能量值 ? 'bg-amber-600' : 'bg-gray-400'}`}></div>
            <span>能量值</span>
          </button>
          <button 
            onClick={() => toggleMetric('记录数')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${visibleMetrics.记录数 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <div className={`w-3 h-3 rounded-sm ${visibleMetrics.记录数 ? 'bg-green-600' : 'bg-gray-400'}`}></div>
            <span>记录数</span>
          </button>
        </div>
        
        <ResponsiveContainer width="100%" height={compact ? 180 : 300}>
          {compact ? (
          // 紧凑模式使用Bar图表更直观地显示记录数量
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#666' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              tickFormatter={(value, index) => {
                const day = chartData[index];
                return `${value}\n${day.dateLabel}`;
              }}
              interval={0}
            />
            <YAxis 
              domain={[0, 'dataMax + 1']}
              tick={{ fontSize: 11, fill: '#666' }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
              label={{ value: '记录数', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              }}
              formatter={(value: any, name: string) => {
                return [value || 0, name];
              }}
              labelFormatter={(label, entries, defaultLabelFormatter) => {
                const index = chartData.findIndex(d => d.date === label);
                if (index !== -1) {
                  const day = chartData[index];
                  return `${day.date} ${day.dateLabel}`;
                }
                return defaultLabelFormatter(label, entries);
              }}
            />
            <Bar 
              dataKey="记录数" 
              fill={themeColors.count.primary}
              fillOpacity={0.8}
              radius={[6, 6, 0, 0]}
              barSize={32}
              animationDuration={1000}
            />
          </ComposedChart>
        ) : (
          // 完整模式 - 现代美观的设计
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
            <defs>
              {/* 渐变定义 */}
              <linearGradient id="calmnessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColors.calmness.primary} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={themeColors.calmness.primary} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="positivityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColors.positivity.primary} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={themeColors.positivity.primary} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColors.energy.primary} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={themeColors.energy.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* 网格线 - 只显示水平网格线，更简洁 */}
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            
            {/* X轴 - 优化样式 */}
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#666', fontWeight: 500 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              tickFormatter={(value, index) => {
                const day = chartData[index];
                return `${value} ${day.dateLabel}`;
              }}
              interval={0}
            />
            
            {/* 左侧Y轴 - 情绪评分 */}
            <YAxis 
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={false}
              tickLine={false}
              tickCount={6}
              label={{ 
                value: '情绪评分', 
                angle: -90, 
                position: 'insideLeft', 
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666', fontWeight: 500 }
              }}
            />
            
            {/* 右侧Y轴 - 记录数 */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'dataMax + 1']}
              tick={{ fontSize: 12, fill: themeColors.count.primary }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
              label={{ 
                value: '记录数', 
                angle: 90, 
                position: 'insideRight', 
                style: { textAnchor: 'middle', fontSize: 12, fill: themeColors.count.primary, fontWeight: 500 }
              }}
            />
            


            {/* 自定义Tooltip */}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
                minWidth: '180px'
              }}
              formatter={(value: any, name: string) => {
                if (name === '记录数') {
                  return [`${value || 0} 次`, name];
                }
                if (value !== null) {
                  return [`${value}%`, name];
                }
                return ['无数据', name];
              }}
              labelFormatter={(label, entries, defaultLabelFormatter) => {
                const index = chartData.findIndex(d => d.date === label);
                if (index !== -1) {
                  const day = chartData[index];
                  return `${day.date} ${day.dateLabel}`;
                }
                return defaultLabelFormatter(label, entries);
              }}
              itemStyle={(entry) => {
                const name = entry.name;
                let color = '#666';
                
                if (name === '平静度') color = themeColors.calmness.primary;
                if (name === '正向度') color = themeColors.positivity.primary;
                if (name === '能量值') color = themeColors.energy.primary;
                if (name === '记录数') color = themeColors.count.primary;
                
                return { color };
              }}
            />
            
            {/* 显示区域填充（面积图效果）- 根据visibleMetrics条件显示 */}
            {visibleMetrics['平静度'] && (
              <Area 
                type="monotone" 
                dataKey="平静度" 
                stroke={themeColors.calmness.primary}
                strokeWidth={0}
                fill="url(#calmnessGradient)"
                activeDot={{ r: 0 }}
                connectNulls={false}
                yAxisId="left"
                name="平静度"
                isAnimationActive={true}
                animationDuration={1500}
                stackId="emotion"
                fillOpacity={0.8}
              />
            )}
            
            {visibleMetrics['正向度'] && (
              <Area 
                type="monotone" 
                dataKey="正向度" 
                stroke={themeColors.positivity.primary}
                strokeWidth={0}
                fill="url(#positivityGradient)"
                activeDot={{ r: 0 }}
                connectNulls={false}
                yAxisId="left"
                name="正向度"
                isAnimationActive={true}
                animationDuration={1500}
                stackId="emotion"
                fillOpacity={0.8}
              />
            )}
            
            {visibleMetrics['能量值'] && (
              <Area 
                type="monotone" 
                dataKey="能量值" 
                stroke={themeColors.energy.primary}
                strokeWidth={0}
                fill="url(#energyGradient)"
                activeDot={{ r: 0 }}
                connectNulls={false}
                yAxisId="left"
                name="能量值"
                isAnimationActive={true}
                animationDuration={1500}
                stackId="emotion"
                fillOpacity={0.8}
              />
            )}
            
            {/* 显示折线 - 更清晰的线图表示 - 根据visibleMetrics条件显示 */}
            {visibleMetrics['平静度'] && (
              <Line 
                type="monotone" 
                dataKey="平静度" 
                stroke={themeColors.calmness.primary}
                strokeWidth={3}
                dot={{ 
                  fill: themeColors.calmness.primary,
                  stroke: '#fff',
                  strokeWidth: 2, 
                  r: 4
                }}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: themeColors.calmness.primary
                }}
                connectNulls={false}
                yAxisId="left"
                name="平静度"
                isAnimationActive={true}
                animationDuration={1000}
              />
            )}
            
            {visibleMetrics['正向度'] && (
              <Line 
                type="monotone" 
                dataKey="正向度" 
                stroke={themeColors.positivity.primary}
                strokeWidth={3}
                dot={{ 
                  fill: themeColors.positivity.primary,
                  stroke: '#fff',
                  strokeWidth: 2, 
                  r: 4
                }}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: themeColors.positivity.primary
                }}
                connectNulls={false}
                yAxisId="left"
                name="正向度"
                isAnimationActive={true}
                animationDuration={1000}
              />
            )}
            
            {visibleMetrics['能量值'] && (
              <Line 
                type="monotone" 
                dataKey="能量值" 
                stroke={themeColors.energy.primary}
                strokeWidth={3}
                dot={{ 
                  fill: themeColors.energy.primary,
                  stroke: '#fff',
                  strokeWidth: 2, 
                  r: 4
                }}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: themeColors.energy.primary
                }}
                connectNulls={false}
                yAxisId="left"
                name="能量值"
                isAnimationActive={true}
                animationDuration={1000}
              />
            )}
            
            {/* 记录数柱状图 - 根据visibleMetrics条件显示 */}
            {visibleMetrics['记录数'] && (
              <Bar 
                dataKey="记录数" 
                fill={themeColors.count.primary} 
                fillOpacity={0.7}
                radius={[6, 6, 0, 0]}
                yAxisId="right"
                barSize={28}
                isAnimationActive={true}
                animationDuration={1200}
                animationBegin={300}
              />
            )}
          </ComposedChart>
        )}
        
        {/* 没有数据时的提示 - 增强视觉效果 */}
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-2">暂无数据</p>
              <p className="text-xs text-gray-400">开始记录你的每日心情，系统将自动分析趋势</p>
            </div>
          </div>
        )}
        </ResponsiveContainer>
      
      {/* 增强版情绪维度解释 */}
      {!compact && (
        <div className="mt-8">
          <h4 className="text-base font-medium text-gray-700 mb-4">情绪维度说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl transition-all ${visibleMetrics.平静度 ? 'bg-blue-50 border border-blue-100 shadow-sm' : 'bg-gray-50 border border-gray-100 opacity-70'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${visibleMetrics.平静度 ? themeColors.calmness.primary : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">平静度</span>
              </div>
              <p className="text-sm text-gray-600">{emotionExplanations.平静度}</p>
            </div>
            <div className={`p-4 rounded-xl transition-all ${visibleMetrics.正向度 ? 'bg-purple-50 border border-purple-100 shadow-sm' : 'bg-gray-50 border border-gray-100 opacity-70'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${visibleMetrics.正向度 ? themeColors.positivity.primary : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">正向度</span>
              </div>
              <p className="text-sm text-gray-600">{emotionExplanations.正向度}</p>
            </div>
            <div className={`p-4 rounded-xl transition-all ${visibleMetrics.能量值 ? 'bg-amber-50 border border-amber-100 shadow-sm' : 'bg-gray-50 border border-gray-100 opacity-70'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${visibleMetrics.能量值 ? themeColors.energy.primary : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">能量值</span>
              </div>
              <p className="text-sm text-gray-600">{emotionExplanations.能量值}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};