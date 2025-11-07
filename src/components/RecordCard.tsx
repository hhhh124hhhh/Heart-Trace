import React, { useState, useMemo } from 'react';
import { Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyRecord } from '../types';
import { EmotionTag } from './EmotionTag';
import { DEFAULT_TAGS } from '../lib/storage';

interface RecordCardProps {
  record: DailyRecord;
  onToggleFavorite?: (id: string) => void;
  defaultExpanded?: boolean;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  onToggleFavorite,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // 使用useMemo确保日期计算仅在record.date变化时重新计算
  const { dateStr, timeStr } = useMemo(() => {
    // 现在record.date总是存在且有效的
    const date = new Date(record.date);
    
    // 格式化日期为 月/日 格式
    const formattedDate = date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    // 格式化时间为 时:分 格式，确保24小时制
    const formattedTime = date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    return { dateStr: formattedDate, timeStr: formattedTime };
  }, [record.date]);

  
  const recordTags = DEFAULT_TAGS.filter(tag => record.tags.includes(tag.id));
  
  return (
    <div 
      className="w-full p-24 rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-slow cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 头部：日期和操作按钮 */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-8">
          <span className="text-caption text-neutral-stone">{dateStr} {timeStr}</span>
          {record.isPrivate && (
            <span className="text-caption text-neutral-stone">私密</span>
          )}
        </div>
        <div className="flex items-center gap-12">
          {record.aiResponse && (
            <div className="flex items-center gap-4">
              <MessageCircle className="w-4 h-4 text-secondary-500" />
              {defaultExpanded && (
                <div className="flex items-center gap-2 px-2 py-1 bg-secondary-100 rounded-full animate-fade-in">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-secondary-600 font-medium">新回复</span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(record.id);
            }}
            className="p-2 transition-all hover:scale-110 active:scale-95"
            aria-label={record.isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                record.isFavorite 
                  ? 'fill-accent-sunrise text-accent-sunrise' 
                  : 'text-neutral-stone hover:text-accent-sunrise'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* 标签 */}
      {recordTags.length > 0 && (
        <div className="flex flex-wrap gap-8 mb-12">
          {recordTags.map(tag => (
            <EmotionTag key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      
      {/* 内容摘要/完整内容 */}
      <div className="text-body text-neutral-dark leading-relaxed mb-12">
        {isExpanded ? record.content : `${record.content.slice(0, 50)}${record.content.length > 50 ? '...' : ''}`}
      </div>
      
      {/* AI回应（展开时显示） */}
      {isExpanded && record.aiResponse && (
        <div className="mt-16 p-16 rounded-lg bg-gradient-to-br from-primary-50 to-secondary-100 animate-fade-in">
          <div className="flex items-start gap-12">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
              <div className="flex-1">
                <p className="text-body-small text-neutral-dark leading-loose">
                  {record.aiResponse}
                </p>
              </div>
          </div>
        </div>
      )}
      
      {/* 展开/收起指示器 */}
      <div className="flex justify-center mt-8">
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-stone" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-stone" />
        )}
      </div>
    </div>
  );
};
