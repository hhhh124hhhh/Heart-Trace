import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { RecordCard } from '../components/RecordCard';
import { EmotionTag } from '../components/EmotionTag';
import { recordsDB, tagsDB, DEFAULT_TAGS } from '../lib/storage';
import type { DailyRecord, Tag } from '../types';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export const HistoryView: React.FC = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    filterRecords();
  }, [records, timeFilter, selectedTag, searchKeyword]);
  
  const loadData = async () => {
    const allRecords = await recordsDB.getAll();
    setRecords(allRecords);
    
    const allTags = await tagsDB.getAll();
    setTags(allTags);
  };
  
  const filterRecords = () => {
    let filtered = [...records];
    
    // 时间筛选
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(r => {
          const recordDate = new Date(r.date);
          return !isNaN(recordDate.getTime()) && recordDate.toDateString() === today.toDateString();
        });
        break;
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        filtered = filtered.filter(r => {
          const recordDate = new Date(r.date);
          return !isNaN(recordDate.getTime()) && recordDate >= weekAgo;
        });
        break;
      }
      case 'month': {
        // 获取当前月份的第一天（0点0分0秒）
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // 获取下一个月份的第一天（0点0分0秒）
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        filtered = filtered.filter(r => {
          const recordDate = new Date(r.date);
          return !isNaN(recordDate.getTime()) && 
                 recordDate >= currentMonthStart && 
                 recordDate < nextMonthStart;
        });
        break;
      }
      default:
        // 对于'all'和其他情况，过滤掉无效日期
        filtered = filtered.filter(r => {
          const recordDate = new Date(r.date);
          return !isNaN(recordDate.getTime());
        });
    }
    
    // 标签筛选
    if (selectedTag) {
      filtered = filtered.filter(r => r.tags.includes(selectedTag));
    }
    
    // 关键词搜索
    if (searchKeyword) {
      filtered = filtered.filter(r =>
        r.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        r.aiResponse?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    
    setFilteredRecords(filtered);
  };
  
  const handleToggleFavorite = async (id: string) => {
    const record = await recordsDB.getById(id);
    if (record) {
      await recordsDB.update(id, { isFavorite: !record.isFavorite });
      await loadData();
    }
  };
  
  const timeFilters: { id: TimeFilter; label: string }[] = [
    { id: 'today', label: '今天' },
    { id: 'week', label: '近7天' },
    { id: 'month', label: '本月' },
    { id: 'all', label: '全部' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
      <div className="max-w-[800px] mx-auto px-24 pt-24">
        {/* 标题 */}
        <div className="mb-32 animate-fade-in">
          <h1 className="text-h1 font-bold text-neutral-dark">历史回顾</h1>
          <p className="text-body-small text-neutral-stone mt-8">
            共 {records.length} 条记录
          </p>
        </div>
        
        {/* 时间筛选器 */}
        <div className="mb-16 animate-slide-up">
          <div className="flex gap-12 overflow-x-auto pb-8 scrollbar-hide">
            {timeFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`
                  px-16 py-8 rounded-full text-body-small font-medium whitespace-nowrap
                  transition-all duration-normal
                  ${timeFilter === filter.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white text-neutral-earth hover:bg-primary-50'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 搜索框和标签筛选 */}
        <div className="mb-24 space-y-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-16 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-stone" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索记录内容..."
              className="w-full h-14 pl-48 pr-16 rounded-full bg-white border-2 border-neutral-mist text-body text-neutral-dark placeholder:text-neutral-stone focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          
          {/* 标签筛选 */}
          <div>
            <div className="flex gap-12 overflow-x-auto pb-6 scrollbar-hide">
              <button
                onClick={() => setSelectedTag(null)}
                className={`
                  px-12 py-12 rounded-full text-body-small font-medium whitespace-nowrap
                  ${!selectedTag
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-neutral-earth hover:bg-primary-50'
                  }
                  transition-all duration-normal
                `}
              >
                全部
              </button>
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex-shrink-0">
                  <EmotionTag
                    tag={tag}
                    selected={tag.id === selectedTag}
                    onClick={() => setSelectedTag(tag.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 记录列表 */}
        <div className="space-y-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onToggleFavorite={handleToggleFavorite}
              />
            ))
          ) : (
            <div className="text-center py-64">
              <div className="mb-24">
                <div className="w-32 h-32 mx-auto rounded-full bg-primary-50 flex items-center justify-center">
                  <Search className="w-16 h-16 text-primary-500" />
                </div>
              </div>
              <h3 className="text-h3 font-semibold text-neutral-dark mb-8">
                {searchKeyword || selectedTag ? '未找到相关记录' : '还没有记录'}
              </h3>
              <p className="text-body-small text-neutral-stone">
                {searchKeyword || selectedTag ? '试试调整筛选条件' : '开始你的第一次记录吧'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
