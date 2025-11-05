import type { AIModelConfig, AIProvider, ModelStatus } from '../types';

// 移除AI_PROVIDERS，因为现在使用代理服务

/**
 * 模型发现和状态检测服务
 */

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

/**
 * 从AI服务商API获取可用模型列表
 */
export async function fetchModelsFromProvider(
  provider: string,
  apiKey: string
): Promise<ModelInfo[]> {
  if (provider === 'custom' || !apiKey) {
    return [];
  }

  // 当前版本使用代理服务，不支持直接发现模型
  console.warn('获取模型列表功能在代理模式下暂时禁用');
  return [];
}

/**
 * 检测单个模型的状态
 */
export async function checkModelStatus(
  provider: string,
  model: string,
  apiKey: string,
  apiUrl?: string
): Promise<ModelStatus> {
  // 当前版本使用代理服务，不支持直接检测模型状态
  console.warn('模型状态检测功能在代理模式下暂时禁用');
  return 'unknown';
}

/**
 * 批量检测多个模型的状态
 */
export async function checkMultipleModelsStatus(
  models: AIModelConfig[]
): Promise<Map<string, ModelStatus>> {
  const statusMap = new Map<string, ModelStatus>();

  // 使用Promise.allSettled避免单个失败影响整体
  const results = await Promise.allSettled(
    models.map(async (model) => {
      if (!model.apiKey) {
        return { id: model.id, status: 'unknown' as ModelStatus };
      }

      const status = await checkModelStatus(
        model.provider,
        model.model,
        model.apiKey,
        model.apiUrl
      );

      return { id: model.id, status };
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      statusMap.set(result.value.id, result.value.status);
    }
  });

  return statusMap;
}

/**
 * 自动发现并创建模型配置
 */
export async function discoverModelsForProvider(
  provider: string,
  apiKey: string
): Promise<AIModelConfig[]> {
  // 当前版本使用代理服务，不支持自动发现模型
  console.warn('自动发现模型功能在代理模式下暂时禁用');
  return [];
}

/**
 * 刷新所有模型状态
 */
export async function refreshAllModelsStatus(
  models: AIModelConfig[]
): Promise<AIModelConfig[]> {
  const statusMap = await checkMultipleModelsStatus(models);

  return models.map((model) => ({
    ...model,
    status: statusMap.get(model.id) || 'unknown',
    lastChecked: Date.now(),
  }));
}

/**
 * 获取状态显示文本
 */
export function getStatusText(status: ModelStatus): string {
  switch (status) {
    case 'available':
      return '可用';
    case 'maintenance':
      return '维护中';
    case 'disabled':
      return '已停用';
    default:
      return '未知';
  }
}

/**
 * 获取状态颜色类名
 */
export function getStatusColor(status: ModelStatus): string {
  switch (status) {
    case 'available':
      return 'bg-semantic-success';
    case 'maintenance':
      return 'bg-semantic-warning';
    case 'disabled':
      return 'bg-neutral-stone';
    default:
      return 'bg-neutral-mist';
  }
}
