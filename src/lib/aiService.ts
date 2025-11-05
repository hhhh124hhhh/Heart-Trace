import type { AIResponseRequest, AIResponseResult } from '../types';
import { aiSettingsDB } from './aiSettingsDB';
import { GENTLE_RESPONSE_PROMPT } from './aiModels';

// API代理基础URL
const API_PROXY_URL = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions/zhipu-proxy';

/**
 * 调用API代理服务生成回应
 */
async function callAPIProxy(request: AIResponseRequest): Promise<{
  response: string;
  usage?: { remaining: number };
  error?: string;
}> {
  try {
    // 构建用户消息
    const emotionTags = request.tags.length > 0 
      ? `[情绪标签: ${request.tags.join('、')}]` 
      : '';
    const userMessage = `${emotionTags}\n\n${request.content}`;

    const response = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: GENTLE_RESPONSE_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        response: '',
        error: `API请求失败 (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        response: '',
        error: data.error || 'API服务错误',
      };
    }

    if (!data.data.choices || !data.data.choices[0] || !data.data.choices[0].message) {
      return {
        response: '',
        error: 'API返回格式错误',
      };
    }

    return {
      response: data.data.choices[0].message.content.trim(),
      usage: data.rateLimit,
    };
    
  } catch (error) {
    return {
      response: '',
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

/**
 * 生成AI温柔回应
 */
export const aiService = {
  async generateResponse(request: AIResponseRequest): Promise<AIResponseResult> {
    try {
      // 调用API代理服务
      const result = await callAPIProxy(request);
      
      if (result.error) {
        console.error('API代理调用失败:', result.error);
        
        // 根据错误类型提供不同回应
        if (result.error.includes('rate limit') || result.error.includes('limit exceeded')) {
          return {
            response: '今日AI回应次数已达上限，请明天再试。您的记录已保存，我会继续陪伴您。',
            error: result.error,
            emotionAnalysis: analyzeEmotion(request.content)
          };
        } else if (result.error.includes('API key not configured')) {
          return {
            response: 'AI服务暂时不可用，但我会用心倾听。您的感受很重要，记录本身就是一种治愈。',
            error: result.error,
            emotionAnalysis: analyzeEmotion(request.content)
          };
        } else if (result.error.includes('Failed to fetch') || result.error.includes('ECONNREFUSED')) {
          return {
            response: '暂时连接不上AI服务，但我在这里陪伴您。您的记录已保存，每一次记录都很有意义。',
            error: result.error,
            emotionAnalysis: analyzeEmotion(request.content)
          };
        }
        
        // 其他错误时使用降级回应
        return this.getFallbackResponse(request);
      }

      // 情绪分析
      const emotionAnalysis = analyzeEmotion(request.content);

      return {
        response: result.response,
        emotionAnalysis,
      };
      
    } catch (error) {
      console.error('AI回应生成失败:', error);
      
      // 优雅降级到预设回应
      return this.getFallbackResponse(request, error);
    }
  },

  /**
   * 获取降级回应
   */
  getFallbackResponse(request: AIResponseRequest, error?: any): AIResponseResult {
    const fallbackResponses = [
      "感谢你愿意分享此刻的感受。每一次记录都是对自己的温柔对待，你正在用自己的方式照顾内心。",
      "我听到了你的心声。生活中的起起伏伏都是正常的，允许自己感受每一种情绪，这本身就是一种勇气。",
      "每个人都有自己的节奏和步调，不必着急，也不必比较。此刻的你，已经在用心生活了。",
      "你的感受很重要，谢谢你愿意把它们记录下来。这本身就是一种很好的自我照顾。",
      "生活中的每一刻都值得被看见，包括你现在的心情。给自己一些时间和温柔吧。"
    ];

    // 根据内容选择更合适的回应
    let selectedResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    // 简单的关键词匹配
    const content = request.content.toLowerCase();
    if (content.includes('累') || content.includes('疲惫') || content.includes('困')) {
      selectedResponse = "感觉到了你的疲惫。允许自己休息一下吧，你已经很努力了。照顾好自己比什么都重要。";
    } else if (content.includes('开心') || content.includes('高兴') || content.includes('快乐')) {
      selectedResponse = "真好呢！看到你此刻的心情这么美好，我也为你感到开心。享受这份美好吧！";
    } else if (content.includes('焦虑') || content.includes('担心') || content.includes('害怕')) {
      selectedResponse = "我感受到了你的担忧。这些情绪都是正常的，给自己一些耐心和温柔。一切都会慢慢好起来的。";
    }

    return {
      response: selectedResponse,
      emotionAnalysis: analyzeEmotion(request.content),
      error: error instanceof Error ? error.message : undefined
    };
  },

  /**
   * 检查服务状态
   */
  async checkServiceStatus(): Promise<{ 
    available: boolean; 
    message: string; 
    rateLimit?: { remaining: number } 
  }> {
    try {
      const result = await callAPIProxy({
        content: '你好，这是一条测试消息',
        tags: []
      });
      
      if (result.error) {
        // 提供更具体的错误信息
        if (result.error.includes('API key not configured')) {
          return {
            available: false,
            message: 'API密钥未配置'
          };
        } else if (result.error.includes('Failed to fetch')) {
          return {
            available: false,
            message: '无法连接到AI服务'
          };
        } else if (result.error.includes('rate limit')) {
          // 区分开发环境和生产环境的提示信息
          const message = import.meta.env.DEV 
            ? '开发环境 - API调用频率测试中' 
            : 'API调用频率受限';
          return {
            available: false,
            message: message
          };
        }
        
        return {
          available: false,
          message: `API错误: ${result.error}`
        };
      }
      
      return {
        available: true,
        message: 'AI服务运行正常',
        rateLimit: result.usage
      };
    } catch (error) {
      // 处理网络错误
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          return {
            available: false,
            message: '代理服务器未启动，请运行: node scripts/dev-server.js'
          };
        } else if (error.message.includes('ECONNREFUSED')) {
          return {
            available: false,
            message: '无法连接到AI代理服务器'
          };
        }
      }
      
      return {
        available: false,
        message: error instanceof Error ? error.message : '服务检查失败'
      };
    }
  },
};

/**
 * 基于关键词的简单情绪分析
 */
function analyzeEmotion(content: string): {
  calmness: number;
  positivity: number;
  energy: number;
} {
  const positiveWords = ['开心', '高兴', '快乐', '幸福', '满足', '愉快', '美好', '棒', '好', '喜欢', '爱'];
  const negativeWords = ['难过', '伤心', '痛苦', '失望', '焦虑', '担心', '害怕', '生气', '愤怒', '糟糕'];
  const calmWords = ['平静', '安宁', '放松', '舒服', '平和', '宁静'];
  const energeticWords = ['兴奋', '激动', '充满', '活力', '精神', '努力', '奋斗'];

  let positivity = 50;
  let calmness = 50;
  let energy = 50;

  positiveWords.forEach(word => {
    if (content.includes(word)) positivity += 5;
  });

  negativeWords.forEach(word => {
    if (content.includes(word)) positivity -= 5;
  });

  calmWords.forEach(word => {
    if (content.includes(word)) calmness += 8;
  });

  energeticWords.forEach(word => {
    if (content.includes(word)) {
      energy += 8;
      calmness -= 5;
    }
  });

  return {
    calmness: Math.max(0, Math.min(100, calmness)),
    positivity: Math.max(0, Math.min(100, positivity)),
    energy: Math.max(0, Math.min(100, energy)),
  };
}
