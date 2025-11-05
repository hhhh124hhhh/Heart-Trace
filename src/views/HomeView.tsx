import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, LockOpen } from 'lucide-react';
import { Button } from '../components/Button';
import { EmotionTag } from '../components/EmotionTag';
import { TextArea } from '../components/TextArea';
import { RecordCard } from '../components/RecordCard';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Toast } from '../components/Toast';
import { recordsDB, tagsDB, statsDB, DEFAULT_TAGS } from '../lib/storage';
import { aiService } from '../lib/aiService';
import type { DailyRecord, Tag } from '../types';

export const HomeView: React.FC = () => {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [todayRecords, setTodayRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  // 加载标签和今日记录
  useEffect(() => {
    loadData();
  }, []);
  
  // 调试文本长度变化
  useEffect(() => {
    const requiredLength = import.meta.env.DEV ? 5 : 20;
    console.log('Content length changed:', content.length, 'Required length:', requiredLength, 'Button should be disabled:', content.length < requiredLength);
  }, [content]);


  
  const loadData = async () => {
    const allTags = await tagsDB.getAll();
    setTags(allTags);
    
    const records = await recordsDB.getTodayRecords();
    setTodayRecords(records);
  };
  
  const handleToggleTag = (tagId: string) => {
    // 实现单选逻辑：选择一个标签时，取消所有其他标签的选择
    // 如果再次点击已选中的标签，则取消选择
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? []  // 如果已选中，则取消选择
        : [tagId]  // 否则只选择当前标签
    );
  };
  
  const handleGenerateResponse = async () => {
    // 根据环境区分字数限制：开发环境5字，生产环境20字
    const requiredLength = import.meta.env.DEV ? 5 : 20;
    if (content.length < requiredLength) {
      setToast({ message: '再多写一点，让我更了解你', type: 'error' });
      return;
    }
    
    // 确保之前的loading状态被清除
    setLoading(false);
    // 然后再设置为true
    setTimeout(() => setLoading(true), 0);
    
    try {
      // 直接调用AI服务，信任智能模型选择
      const aiResult = await aiService.generateResponse({
        content,
        tags: selectedTags,
      });
      
      // 保存记录（总是保存用户输入）
      const newRecord = await recordsDB.create({
        content,
        tags: selectedTags,
        aiResponse: aiResult.response,
        emotionAnalysis: aiResult.emotionAnalysis,
        isPrivate,
        isFavorite: false,
      });
      
      // 更新统计
      await statsDB.calculateStats();
      
      // 清空表单
      setContent('');
      setSelectedTags([]);
      setIsPrivate(false);
      
      // 重新加载今日记录
      await loadData();
      
      // 显示成功提示 - 无论是否有AI回应都显示成功
      setToast({ 
        message: aiResult.error ? '记录已保存' : '记录保存成功，AI已回应', 
        type: 'success' 
      });
      
    } catch (error) {
      console.error('保存记录失败:', error);
      
      // 即使出错也尝试保存用户输入
      try {
        const fallbackResult = aiService.getFallbackResponse({ content, tags: selectedTags });
        await recordsDB.create({
          content,
          tags: selectedTags,
          aiResponse: fallbackResult.response,
          emotionAnalysis: fallbackResult.emotionAnalysis,
          isPrivate,
          isFavorite: false,
        });
        
        setToast({ message: '记录已保存', type: 'success' });
        setContent('');
        setSelectedTags([]);
        setIsPrivate(false);
        await loadData();
        
      } catch (saveError) {
        setToast({ message: '保存失败，请重试', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleFavorite = async (id: string) => {
    const record = await recordsDB.getById(id);
    if (record) {
      await recordsDB.update(id, { isFavorite: !record.isFavorite });
      await loadData();
    }
  };
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });
  
  return (
    <div className="bg-gradient-morning overflow-y-auto pb-[120px] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <div className="max-w-[800px] mx-auto px-6 sm:px-8 pt-8 sm:pt-10">
        {/* 日期展示区 */}
        <div className="text-center mb-32 animate-fade-in">
          <h1 className="text-h1 font-bold text-neutral-dark mb-8">{dateStr}</h1>
          <p className="text-body text-neutral-stone">{weekday}</p>
        </div>
        
        {/* 空行占位 */}
        
        {/* 问候语 */}
        <div className="text-center mb-40 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-h2 font-semibold text-neutral-dark">
            今天过得怎么样？
          </h2>
        </div>
        
        {/* 快速标签选择 */}
        <div className="mb-32 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="grid grid-cols-4 gap-16">
            {tags.slice(0, 8).map(tag => (
              <EmotionTag
                key={tag.id}
                tag={tag}
                selected={selectedTags.includes(tag.id)}
                onClick={() => handleToggleTag(tag.id)}
              />
            ))}
          </div>
        </div>
        
        {/* 文本输入区 */}
        <div className="mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下此刻的感受..."
            showCharCount
            // 使用组件默认的minChars值（根据环境自动设置）
          />
        </div>
        
        {/* 隐私开关 */}
        <div className="mb-24 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className="flex items-center gap-8 text-body-small text-neutral-earth hover:text-neutral-dark transition-colors"
          >
            {isPrivate ? (
              <Lock className="w-5 h-5 text-primary-500" />
            ) : (
              <LockOpen className="w-5 h-5" />
            )}
            <span>{isPrivate ? '仅自己可见' : '公开记录'}</span>
          </button>
          <p className="text-caption text-neutral-stone mt-4 ml-32">
            {isPrivate ? '此记录仅保存在本地，不会上传' : '此记录可选择云端同步'}
          </p>
        </div>
        
        {/* 生成按钮 */}
        <div className="mb-48 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Button
            fullWidth
            size="xl"
            icon={<Sparkles className="w-5 h-5" />}
            onClick={handleGenerateResponse}
            // 根据环境区分字数限制：开发环境5字，生产环境20字
            disabled={content.length < (import.meta.env.DEV ? 5 : 20)}
            loading={false}
          >
            获得温柔回应
          </Button>
        </div>
        
        {/* 今日足迹 */}
        {todayRecords.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-h3 font-semibold text-neutral-dark mb-16">今日足迹</h3>
            <div className="space-y-16">
              {todayRecords.slice(0, 3).map(record => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部AI提示 */}
      <div className="mt-32 text-center text-caption text-neutral-stone italic">
        回复由AI生成
      </div>
      
      {loading && <LoadingOverlay />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};
