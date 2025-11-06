import React, { useState, useEffect } from 'react';
import { Settings, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { aiService } from '../lib/aiService';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';

interface AIConfigViewProps {
  onBack: () => void;
}

export const AIConfigView: React.FC<AIConfigViewProps> = ({ onBack }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    // 组件加载时检查服务状态
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    setCheckingStatus(true);
    try {
      const result = await aiService.generateResponse({
        content: '测试连接',
        tags: []
      });
      if (result.error) {
        setToast({ message: `AI服务异常: ${result.error}`, type: 'error' });
      } else {
        setToast({ message: 'AI服务运行正常', type: 'success' });
      }
    } catch (error) {
      setToast({ message: '无法连接到AI服务', type: 'error' });
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm overflow-y-auto pb-[120px]">
      <div className="max-w-[800px] mx-auto px-24 pt-24">
        {/* 标题栏 */}
        <div className="flex items-center gap-16 mb-32">
          <button
            onClick={onBack}
            className="p-8 rounded-full hover:bg-white/50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-neutral-dark rotate-180" />
          </button>
          <h1 className="text-h1 font-bold text-neutral-dark flex items-center gap-12">
            <Settings className="w-8 h-8" />
            AI服务设置
          </h1>
        </div>

        {/* 当前状态说明 */}
        <div className="mb-32 p-24 rounded-xl bg-secondary-100/50 border border-secondary-300/30">
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16">
            🎯 当前使用代理服务
          </h3>
          <p className="text-body-small text-neutral-dark leading-relaxed mb-16">
            现在使用后端代理服务，无需手动配置AI模型和API密钥。系统会自动使用智谱GLM-4-Flash模型提供温柔回应。
          </p>
          
          <div className="mt-16 p-16 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-medium text-primary-700 mb-8">✨ 简化的优势</h4>
            <ul className="space-y-4 text-body-small text-primary-600">
              <li>• API密钥完全隐藏在后端</li>
              <li>• 自动限流保护，防止滥用</li>  
              <li>• 开箱即用，无需配置</li>
              <li>• 优雅的错误处理和降级</li>
            </ul>
          </div>

          <div className="mt-16 p-16 bg-semantic-success/10 border border-semantic-success/30 rounded-lg">
            <h4 className="font-medium text-semantic-success mb-8">📈 服务状态</h4>
            <p className="text-body-small text-semantic-success">
              智谱GLM-4-Flash模型运行正常，支持温和的AI对话体验。
            </p>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mb-32 p-24 rounded-xl bg-white/50 border border-neutral-mist">
          <h3 className="text-h3 font-semibold text-neutral-dark mb-16">
            📋 功能说明
          </h3>
          
          <div className="space-y-12">
            <div className="flex items-start gap-12">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-2">
                <span className="text-primary-600 text-xs font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-neutral-dark mb-4">自动限流保护</h4>
                <p className="text-body-small text-neutral-earth">
                  系统自动限制API调用频率（100次/天，10次/小时/IP），确保服务稳定运行。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-12">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-2">
                <span className="text-primary-600 text-xs font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-neutral-dark mb-4">智能降级处理</h4>
                <p className="text-body-small text-neutral-earth">
                  当AI服务不可用时，系统会自动提供预设的温柔回应，确保用户体验连续性。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-12">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-2">
                <span className="text-primary-600 text-xs font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-neutral-dark mb-4">隐私保护</h4>
                <p className="text-body-small text-neutral-earth">
                  所有数据仅用于生成回应，不会存储用户个人信息，对话内容本地保存。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-12">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />}
            onClick={checkServiceStatus}
            loading={checkingStatus}
          >
            检查服务状态
          </Button>
        </div>

        {/* 技术信息 */}
        <div className="mt-32 p-16 bg-neutral-mist/30 rounded-lg">
          <h4 className="font-medium text-neutral-earth mb-8">技术信息</h4>
          <div className="space-y-4 text-body-small text-neutral-earth">
            <p><strong>AI模型:</strong> 智谱GLM-4-Flash</p>
            <p><strong>部署方式:</strong> Netlify Functions</p>
            <p><strong>数据存储:</strong> 本地IndexedDB</p>
            <p><strong>限流策略:</strong> 100次/天，10次/小时/IP</p>
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};