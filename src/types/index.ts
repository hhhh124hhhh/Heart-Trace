// 记录对象类型
export interface DailyRecord {
  id: string;
  date: string;
  content: string;
  tags: string[];
  aiResponse?: string;
  isPrivate: boolean;
  isFavorite: boolean;
  emotionAnalysis?: EmotionAnalysis;
  createdAt: number;
}

// 情绪分析结果
export interface EmotionAnalysis {
  calmness: number;  // 平静度 0-100
  positivity: number; // 正向度 0-100
  energy: number;    // 能量值 0-100
}

// 标签对象类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isCustom: boolean;
}

// 用户统计数据
export interface UserStats {
  totalRecords: number;
  continuousDays: number;
  startDate: string;
  emotionDistribution: { [key: string]: number };
  lastRecordDate?: string;
}

// 用户设置
export interface UserSettings {
  nickname: string;
  defaultPrivate: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  faceLock: boolean;
}

// AI回应请求
export interface AIResponseRequest {
  content: string;
  tags: string[];
}

// AI回应结果
export interface AIResponseResult {
  response: string;
  emotionAnalysis?: EmotionAnalysis;
  error?: string;
}

// AI模型提供商
export type AIProvider = 'deepseek' | 'kimi' | 'glm' | 'qwen' | 'wenxin' | 'spark' | 'custom';

// 模型状态
export type ModelStatus = 'available' | 'maintenance' | 'disabled' | 'unknown';

// AI模型配置
export interface AIModelConfig {
  id: string;
  provider: AIProvider;
  name: string;
  model: string;
  apiKey?: string;
  apiUrl?: string;
  available: boolean;
  description?: string;
  status?: ModelStatus;
  lastChecked?: number;
  isFreeTier?: boolean; // 标记是否为免费额度模型
  isBuiltin?: boolean; // 标记是否为内置模型
  isEncrypted?: boolean; // 标记是否为加密模型
}

// AI服务设置
export interface AIServiceSettings {
  selectedModelId?: string;
  models: AIModelConfig[];
  isConfigured: boolean;
}

// 视图类型
export type View = 'home' | 'history' | 'profile' | 'ai-config';
