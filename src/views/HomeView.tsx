import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, LockOpen } from 'lucide-react';
import { Button } from '../components/Button';
import { EmotionTag } from '../components/EmotionTag';
import { TextArea } from '../components/TextArea';
import { RecordCard } from '../components/RecordCard';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Toast } from '../components/Toast';
import { ThinkingBubble } from '../components/ThinkingBubble';
import { AIResponseText } from '../components/TypewriterText';
import { SuccessParticles } from '../components/ParticleEffect';
import { SuccessModal } from '../components/Modal';
import { recordsDB, tagsDB, statsDB, DEFAULT_TAGS } from '../lib/storage';
import { aiService } from '../lib/aiService';
import { useAnimation } from '../contexts/AnimationContext';
import { ANIMATIONS } from '../lib/animations';
import type { DailyRecord, Tag } from '../types';

export const HomeView: React.FC = () => {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [todayRecords, setTodayRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [currentAIResponse, setCurrentAIResponse] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const { shouldAnimate } = useAnimation();
  const saveButtonRef = useRef<HTMLDivElement>(null);
  // 加载标签和今日记录
  useEffect(() => {
    loadData();
    
    // 监听数据导入事件
    const handleDataImported = () => {
      loadData();
    };
    
    window.addEventListener('data-imported', handleDataImported);
    
    return () => {
      window.removeEventListener('data-imported', handleDataImported);
    };
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
    // 检查是否有内容或选择了标签
    if (content.trim().length === 0 && selectedTags.length === 0) {
      setToast({ message: '请记录一些感受或选择心情标签', type: 'error' });
      return;
    }
    
    // 显示思考动画
    setShowThinking(true);
    
    try {
      // 调用AI服务
      const aiResult = await aiService.generateResponse({
        content,
        tags: selectedTags,
      });
      
      // 隐藏思考动画
      setShowThinking(false);
      
      // 显示AI回复
      if (aiResult.response && !aiResult.error) {
        setCurrentAIResponse(aiResult.response);
      }
      
      // 保存记录
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
      
      // 显示成功动画
      setShowParticles(true);
      setTimeout(() => {
        setShowSuccessModal(true);
        setShowParticles(false);
      }, shouldAnimate() ? 500 : 0);
      
      // 清空表单
      setContent('');
      setSelectedTags([]);
      setIsPrivate(false);
      setCurrentAIResponse('');
      
      // 重新加载今日记录
      await loadData();
      
    } catch (error) {
      console.error('保存记录失败:', error);
      setShowThinking(false);
      
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
        
        setShowParticles(true);
        setTimeout(() => {
          setShowSuccessModal(true);
          setShowParticles(false);
        }, shouldAnimate() ? 500 : 0);
        
        setContent('');
        setSelectedTags([]);
        setIsPrivate(false);
        await loadData();
        
      } catch (saveError) {
        setToast({ message: '保存失败，请重试', type: 'error' });
      }
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
        <div className="text-center mb-32">
          <h1 className="text-h1 font-bold text-neutral-dark mb-8">{dateStr}</h1>
          <p className="text-body text-neutral-stone">{weekday}</p>
        </div>
        
        {/* 空行占位 */}
        
        {/* 问候语 */}
        <div className="text-center mb-40">
          <h2 className="text-h2 font-semibold text-neutral-dark">
            今天过得怎么样？
          </h2>
        </div>
        
        {/* 快速标签选择 */}
        <div className="mb-32">
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
        <div className="mb-16">
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下此刻的感受..."
            showCharCount
            // 使用组件默认的minChars值（根据环境自动设置）
          />
        </div>
        
        {/* 隐私开关 */}
        <div className="mb-24">
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
        <div className="mb-48">
          <div ref={saveButtonRef}>
            <Button
              fullWidth
              size="xl"
              icon={<Sparkles className="w-5 h-5" />}
              onClick={handleGenerateResponse}
              // 有内容或选择了标签时才能提交
              disabled={content.trim().length === 0 && selectedTags.length === 0}
              loading={false}
            >
              获得温柔回应
            </Button>
          </div>
        </div>

        {/* 思考动画 */}
        <AnimatePresence>
          {showThinking && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
              <ThinkingBubble
                isVisible={showThinking}
                type="generating"
                size="lg"
                message="AI正在为你生成温柔回应..."
              />
            </div>
          )}
        </AnimatePresence>

        {/* AI回复显示 */}
        <AnimatePresence>
          {currentAIResponse && (
            <motion.div
              className="mb-32 p-24 bg-white rounded-2xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-8">AI的温柔回应</h4>
                  <div className="text-gray-700 leading-relaxed">
                    <AIResponseText
                      response={currentAIResponse}
                      onComplete={() => {
                        // AI回复显示完成后的处理
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 粒子效果 */}
        {saveButtonRef.current && (
          <SuccessParticles
            show={showParticles}
            position={{
              x: saveButtonRef.current.offsetLeft + saveButtonRef.current.offsetWidth / 2,
              y: saveButtonRef.current.offsetTop + saveButtonRef.current.offsetHeight / 2,
            }}
          />
        )}

        {/* 成功模态框 */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="记录保存成功！"
          message="你的感受已被好好保存，AI已为你准备了温柔回应。"
          actionText="继续记录"
          onAction={() => {
            setShowSuccessModal(false);
          }}
        />
        
        {/* 今日足迹 */}
        {todayRecords.length > 0 && (
          <div>
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
