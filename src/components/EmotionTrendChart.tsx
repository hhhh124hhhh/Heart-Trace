import React from 'react';
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

interface EmotionTrendChartProps {
  records: DailyRecord[];
}

interface ChartData {
  date: string;
  平静度: number | null;
  正向度: number | null;
  能量值: number | null;
}

export const EmotionTrendChart: React.FC<EmotionTrendChartProps> = ({ records }) => {
  // 获取最近7天的数据
  const getLast7DaysData = (): ChartData[] => {
    const data: ChartData[] = [];
    const today = new Date();
    
    // 生成最近7天的日期数组
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      
      // 查找当天有情绪分析的记录
      const dayRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === date.toDateString() && record.emotionAnalysis;
      });
      
      if (dayRecords.length > 0) {
        // 取当天最后一条记录的情绪分析数据
        const lastRecord = dayRecords[dayRecords.length - 1];
        const analysis = lastRecord.emotionAnalysis!;
        
        data.push({
          date: dateStr,
          平静度: analysis.calmness,
          正向度: analysis.positivity,
          能量值: analysis.energy
        });
      } else {
        data.push({
          date: dateStr,
          平静度: null,
          正向度: null,
          能量值: null
        });
      }
    }
    
    return data;
  };

  const chartData = getLast7DaysData();
  const hasData = chartData.some(d => d.平静度 !== null || d.正向度 !== null || d.能量值 !== null);

  if (!hasData) {
    return (
      <div className="col-span-2 p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="text-body-small text-neutral-stone mb-8">情绪趋势</div>
        <div className="flex items-center justify-center h-40 text-neutral-stone">
          <span className="text-body-small">暂无情绪数据</span>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-2 p-24 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="text-body-small text-neutral-stone mb-16">最近7天情绪趋势</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: any) => value !== null ? `${value}%` : '无数据'}
          />
          <Line 
            type="monotone" 
            dataKey="平静度" 
            stroke="#60A5FA" 
            strokeWidth={2}
            dot={{ fill: '#60A5FA', r: 3 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="正向度" 
            stroke="#A78BFA" 
            strokeWidth={2}
            dot={{ fill: '#A78BFA', r: 3 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="能量值" 
            stroke="#FBBF24" 
            strokeWidth={2}
            dot={{ fill: '#FBBF24', r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-16 mt-12">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#60A5FA]"></div>
          <span className="text-caption text-neutral-stone">平静度</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#A78BFA]"></div>
          <span className="text-caption text-neutral-stone">正向度</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#FBBF24]"></div>
          <span className="text-caption text-neutral-stone">能量值</span>
        </div>
      </div>
    </div>
  );
};