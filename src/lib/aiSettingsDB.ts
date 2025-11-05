import localforage from 'localforage';
import type { AIServiceSettings } from '../types';

// AI服务设置存储
const aiSettingsStore = localforage.createInstance({
  name: 'daily-reflection',
  storeName: 'ai-settings',
});

export const aiSettingsDB = {
  async get(): Promise<AIServiceSettings> {
    const settings = await aiSettingsStore.getItem<AIServiceSettings>('settings');
    if (!settings) {
      const defaultSettings: AIServiceSettings = {
        models: [], // 移除默认模型配置
        selectedModelId: undefined,
        isConfigured: false,
      };
      await aiSettingsStore.setItem('settings', defaultSettings);
      return defaultSettings;
    }
    
    return settings;
  },

  async update(updates: Partial<AIServiceSettings>): Promise<AIServiceSettings> {
    const settings = await this.get();
    const updated = { ...settings, ...updates };
    await aiSettingsStore.setItem('settings', updated);
    return updated;
  },

  async addModel(model: any): Promise<void> {
    const settings = await this.get();
    settings.models.push(model);
    await aiSettingsStore.setItem('settings', settings);
  },

  async updateModel(id: string, updates: Partial<any>): Promise<void> {
    const settings = await this.get();
    const index = settings.models.findIndex(m => m.id === id);
    if (index !== -1) {
      settings.models[index] = { ...settings.models[index], ...updates };
      await aiSettingsStore.setItem('settings', settings);
    }
  },

  async deleteModel(id: string): Promise<void> {
    const settings = await this.get();
    settings.models = settings.models.filter(m => m.id !== id);
    if (settings.selectedModelId === id) {
      settings.selectedModelId = undefined;
      settings.isConfigured = false;
    }
    await aiSettingsStore.setItem('settings', settings);
  },

  async selectModel(id: string): Promise<void> {
    await this.update({
      selectedModelId: id,
      isConfigured: true,
    });
  },

  // 清除所有设置（重置到默认状态）
  async reset(): Promise<void> {
    const defaultSettings: AIServiceSettings = {
      models: [],
      selectedModelId: undefined,
      isConfigured: false,
    };
    await aiSettingsStore.setItem('settings', defaultSettings);
  },
};
