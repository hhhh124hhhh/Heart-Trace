import localforage from 'localforage';
import type { DailyRecord, Tag, UserStats, UserSettings } from '../types';

// 导出相关类型定义
export interface ExportData {
  exportInfo: {
    version: string;
    exportDate: string;
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  records: DailyRecord[];
  tags: Tag[];
  settings: UserSettings;
  stats: UserStats;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
  includeSettings?: boolean;
  includeStats?: boolean;
}

// 初始化数据存储
export const recordStore = localforage.createInstance({
  name: 'daily-reflection',
  storeName: 'records',
});

export const tagStore = localforage.createInstance({
  name: 'daily-reflection',
  storeName: 'tags',
});

const settingsStore = localforage.createInstance({
  name: 'daily-reflection',
  storeName: 'settings',
});

// 默认情绪标签
export const DEFAULT_TAGS: Tag[] = [
  { id: 'happy', name: '开心', color: 'linear-gradient(135deg, #FFE082, #FFB74D)', isCustom: false },
  { id: 'calm', name: '平静', color: 'linear-gradient(135deg, #A5D6A7, #66BB6A)', isCustom: false },
  { id: 'grateful', name: '感恩', color: 'linear-gradient(135deg, #FFCC80, #FFA726)', isCustom: false },
  { id: 'sad', name: '难过', color: 'linear-gradient(135deg, #90CAF9, #64B5F6)', isCustom: false },
  { id: 'excited', name: '兴奋', color: 'linear-gradient(135deg, #FF8A65, #FF7043)', isCustom: false },
  { id: 'anxious', name: '焦虑', color: 'linear-gradient(135deg, #CE93D8, #BA68C8)', isCustom: false },
  { id: 'tired', name: '疲惫', color: 'linear-gradient(135deg, #B0BEC5, #90A4AE)', isCustom: false },
  { id: 'down', name: '失落', color: 'linear-gradient(135deg, #B0BEC5, #78909C)', isCustom: false },
];

// 记录相关操作
export const recordsDB = {
  async getAll(): Promise<DailyRecord[]> {
    const keys = await recordStore.keys();
    const records = await Promise.all(
      keys.map(key => recordStore.getItem<DailyRecord>(key))
    );
    return records.filter(Boolean).sort((a, b) => b!.createdAt - a!.createdAt);
  },

  async getById(id: string): Promise<DailyRecord | null> {
    return await recordStore.getItem<DailyRecord>(id);
  },

  async create(record: Omit<DailyRecord, 'id' | 'createdAt' | 'date'>): Promise<DailyRecord> {
    const newRecord: DailyRecord = {
      ...record,
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      date: new Date().toISOString(), // 设置date字段为当前日期的ISO字符串
    };
    await recordStore.setItem(newRecord.id, newRecord);
    return newRecord;
  },

  async update(id: string, updates: Partial<DailyRecord>): Promise<DailyRecord | null> {
    const record = await recordStore.getItem<DailyRecord>(id);
    if (!record) return null;
    
    const updated = { ...record, ...updates };
    await recordStore.setItem(id, updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await recordStore.removeItem(id);
  },

  async getTodayRecords(): Promise<DailyRecord[]> {
    const all = await this.getAll();
    const today = new Date().toDateString();
    return all.filter(r => new Date(r.date).toDateString() === today);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<DailyRecord[]> {
    const all = await this.getAll();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return all.filter(r => {
      const date = new Date(r.date).getTime();
      return date >= start && date <= end;
    });
  },

  async searchByKeyword(keyword: string): Promise<DailyRecord[]> {
    const all = await this.getAll();
    const lowerKeyword = keyword.toLowerCase();
    return all.filter(r => 
      r.content.toLowerCase().includes(lowerKeyword) ||
      r.aiResponse?.toLowerCase().includes(lowerKeyword)
    );
  },
};

// 标签相关操作
export const tagsDB = {
  async getAll(): Promise<Tag[]> {
    const stored = await tagStore.getItem<Tag[]>('tags');
    if (!stored) {
      await this.init();
      return DEFAULT_TAGS;
    }
    return stored;
  },
  
  async getById(id: string): Promise<Tag | undefined> {
    const tags = await this.getAll();
    return tags.find(tag => tag.id === id);
  },

  async init(): Promise<void> {
    await tagStore.setItem('tags', DEFAULT_TAGS);
  },

  async add(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const tags = await this.getAll();
    const newTag: Tag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    tags.push(newTag);
    await tagStore.setItem('tags', tags);
    return newTag;
  },

  async update(id: string, updates: Partial<Tag>): Promise<void> {
    const tags = await this.getAll();
    const index = tags.findIndex(t => t.id === id);
    if (index !== -1) {
      tags[index] = { ...tags[index], ...updates };
      await tagStore.setItem('tags', tags);
    }
  },

  async delete(id: string): Promise<void> {
    const tags = await this.getAll();
    const filtered = tags.filter(t => t.id !== id);
    await tagStore.setItem('tags', filtered);
  },
};

// 用户统计相关操作
export const statsDB = {
  async get(): Promise<UserStats> {
    const stats = await settingsStore.getItem<UserStats>('stats');
    if (!stats) {
      const defaultStats: UserStats = {
        totalRecords: 0,
        continuousDays: 0,
        startDate: new Date().toISOString(),
        emotionDistribution: {},
      };
      await settingsStore.setItem('stats', defaultStats);
      return defaultStats;
    }
    return stats;
  },

  async update(updates: Partial<UserStats>): Promise<UserStats> {
    const stats = await this.get();
    const updated = { ...stats, ...updates };
    await settingsStore.setItem('stats', updated);
    return updated;
  },

  async calculateStats(): Promise<UserStats> {
    const records = await recordsDB.getAll();
    const emotionDistribution: { [key: string]: number } = {};
    
    records.forEach(record => {
      record.tags.forEach(tag => {
        emotionDistribution[tag] = (emotionDistribution[tag] || 0) + 1;
      });
    });

    // 计算连续天数
    let continuousDays = 0;
    const sortedRecords = [...records].sort((a, b) => b.createdAt - a.createdAt);
    
    if (sortedRecords.length > 0) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const record of sortedRecords) {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === continuousDays) {
          continuousDays++;
        } else {
          break;
        }
      }
    }

    const stats: UserStats = {
      totalRecords: records.length,
      continuousDays,
      startDate: records.length > 0 ? records[records.length - 1].date : new Date().toISOString(),
      emotionDistribution,
      lastRecordDate: records.length > 0 ? records[0].date : undefined,
    };

    await this.update(stats);
    return stats;
  },
};

// 用户设置相关操作
export const settingsDB = {
  async get(): Promise<UserSettings> {
    const settings = await settingsStore.getItem<UserSettings>('settings');
    if (!settings) {
      const defaultSettings: UserSettings = {
        nickname: '朋友',
        defaultPrivate: false,
        dailyReminder: false,
        reminderTime: '20:00',
        faceLock: false,
      };
      await settingsStore.setItem('settings', defaultSettings);
      return defaultSettings;
    }
    return settings;
  },

  async update(updates: Partial<UserSettings>): Promise<UserSettings> {
    const settings = await this.get();
    const updated = { ...settings, ...updates };
    await settingsStore.setItem('settings', updated);
    return updated;
  },
};

// 数据导出相关操作
export const exportDB = {
  // 获取导出数据
  async getExportData(options: ExportOptions = { format: 'json' }): Promise<ExportData> {
    // 获取记录
    let records = await recordsDB.getAll();
    
    // 应用日期范围筛选
    if (options.dateRange) {
      records = records.filter(record => {
        const recordDate = new Date(record.date);
        const startDate = new Date(options.dateRange!.start);
        const endDate = new Date(options.dateRange!.end);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    // 获取其他数据
    const tags = await tagsDB.getAll();
    const settings = await settingsDB.get();
    const stats = await statsDB.get();

    // 确定日期范围
    const dateRange = {
      start: records.length > 0 ? records[records.length - 1].date : new Date().toISOString(),
      end: records.length > 0 ? records[0].date : new Date().toISOString()
    };

    return {
      exportInfo: {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        totalRecords: records.length,
        dateRange
      },
      records,
      tags: options.includeSettings !== false ? tags : [],
      settings: options.includeSettings !== false ? settings : {
        nickname: '',
        defaultPrivate: false,
        dailyReminder: false,
        reminderTime: '20:00',
        faceLock: false,
      },
      stats: options.includeStats !== false ? stats : {
        totalRecords: 0,
        continuousDays: 0,
        startDate: new Date().toISOString(),
        emotionDistribution: {},
      }
    };
  },

  // 转换为JSON格式
  toJSON(exportData: ExportData): string {
    return JSON.stringify(exportData, null, 2);
  },

  // 转换为CSV格式
  toCSV(exportData: ExportData): string {
    const headers = [
      '日期',
      '内容', 
      '标签',
      '平静度',
      '正向度',
      '能量值',
      'AI回应',
      '是否收藏',
      '创建时间'
    ];

    const csvRows = [
      headers.join(','),
      ...exportData.records.map(record => [
        record.date,
        `"${this.escapeCsvField(record.content)}"`,
        `"${record.tags.join(', ')}"`,
        record.emotionAnalysis?.calmness || '',
        record.emotionAnalysis?.positivity || '',
        record.emotionAnalysis?.energy || '',
        `"${this.escapeCsvField(record.aiResponse || '')}"`,
        record.isFavorite ? '是' : '否',
        new Date(record.createdAt).toLocaleString('zh-CN')
      ])
    ];

    return '\uFEFF' + csvRows.join('\n'); // 添加BOM以支持中文
  },

  // CSV字段转义
  escapeCsvField(field: string): string {
    return field.replace(/"/g, '""').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  },

  // 生成导出文件名
  generateFileName(format: 'json' | 'csv'): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    return `心迹数据导出_${dateStr}_${timeStr}.${format}`;
  }
};
