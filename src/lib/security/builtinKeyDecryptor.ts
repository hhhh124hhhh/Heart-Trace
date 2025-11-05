import { DeviceFingerprint, CryptoUtils, AntiDebug, SECURITY_CONSTANTS, securityUtils } from './index';
import type { AIModelConfig } from '../../types';

/**
 * 内置模型密钥解密器
 * 负责安全管理和解密内置API密钥
 */
export class BuiltinKeyDecryptor {
  private static instance: BuiltinKeyDecryptor;
  private cache: Map<string, { key: string; timestamp: number }> = new Map();
  private deviceKey: CryptoKey | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
  private readonly MAX_CACHE_SIZE = 10;

  static getInstance(): BuiltinKeyDecryptor {
    if (!this.instance) {
      this.instance = new BuiltinKeyDecryptor();
    }
    return this.instance;
  }

  private constructor() {
    // 初始化时启动安全保护
    this.initializeSecurity();
  }

  /**
   * 初始化安全保护
   */
  private async initializeSecurity(): Promise<void> {
    try {
      // 检查环境安全性
      if (!securityUtils.isEnvironmentSecure()) {
        console.warn('当前环境不安全，禁用内置密钥功能');
        return;
      }

      // 启动反调试保护
      const antiDebug = AntiDebug.getInstance();
      antiDebug.start();

    } catch (error) {
      console.error('安全初始化失败:', error);
    }
  }

  /**
   * 解密内置模型的API密钥
   */
  async decryptKey(encryptedModel: EncryptedBuiltinModel): Promise<string> {
    try {
      // 检查缓存
      const cached = this.getCachedKey(encryptedModel.id);
      if (cached) {
        return cached;
      }

      // 执行安全检查
      this.performSecurityCheck();

      // 获取或生成设备密钥
      const deviceKey = await this.getDeviceKey();

      // 解密API密钥
      const decryptedKey = await this.performDecryption(encryptedModel, deviceKey);

      // 缓存结果
      this.cacheKey(encryptedModel.id, decryptedKey);

      // 安全延迟（防止时序攻击）
      await securityUtils.randomDelay();

      return decryptedKey;

    } catch (error) {
      console.error('密钥解密失败:', error);
      throw new Error('内置密钥解密失败');
    }
  }

  /**
   * 获取设备派生密钥
   */
  private async getDeviceKey(): Promise<CryptoKey> {
    if (this.deviceKey) {
      return this.deviceKey;
    }

    try {
      // 生成设备指纹
      const fingerprint = DeviceFingerprint.getInstance();
      const deviceFingerprint = await fingerprint.generateFingerprint();

      // 生成盐值
      const cryptoUtils = CryptoUtils.getInstance();
      const salt = cryptoUtils.generateSalt();

      // 派生密钥
      this.deviceKey = await cryptoUtils.deriveKey(
        deviceFingerprint,
        salt,
        SECURITY_CONSTANTS.KEY_DERIVATION.ITERATIONS
      );

      return this.deviceKey;

    } catch (error) {
      console.error('设备密钥生成失败:', error);
      throw new Error('无法生成设备密钥');
    }
  }

  /**
   * 执行解密操作
   */
  private async performDecryption(
    encryptedModel: EncryptedBuiltinModel,
    deviceKey: CryptoKey
  ): Promise<string> {
    try {
      const cryptoUtils = CryptoUtils.getInstance();

      // 重组密钥片段
      const combinedKey = this.recombineKeyFragments(encryptedModel.keyFragments);

      // Base64解码
      const encryptedData = atob(combinedKey);

      // 解密
      const decryptedKey = await cryptoUtils.decryptFromBase64(encryptedData, deviceKey);

      return decryptedKey;

    } catch (error) {
      console.error('解密操作失败:', error);
      throw new Error('解密操作失败');
    }
  }

  /**
   * 重组密钥片段
   */
  private recombineKeyFragments(fragments: KeyFragments): string {
    try {
      const { f1, f2, f3, combineOrder = [1, 2, 3], separator = '_' } = fragments;
      
      const fragmentsArray = [f1, f2, f3];
      
      // 按照指定顺序重组
      const recombined = combineOrder
        .map(index => fragmentsArray[index - 1])
        .join(separator);

      return recombined;

    } catch (error) {
      console.error('密钥片段重组失败:', error);
      throw new Error('密钥片段重组失败');
    }
  }

  /**
   * 执行安全检查
   */
  private performSecurityCheck(): void {
    try {
      // 检查环境安全性
      if (!this.isEnvironmentSecure()) {
        throw new Error('环境安全检查失败');
      }

      // 检查调试器
      const antiDebug = AntiDebug.getInstance();
      if (!antiDebug.isSecureEnvironment()) {
        throw new Error('检测到调试环境');
      }

    } catch (error) {
      console.error('安全检查失败:', error);
      // 清除敏感数据
      this.clearSensitiveData();
      throw error;
    }
  }

  /**
   * 缓存解密的密钥
   */
  private cacheKey(modelId: string, key: string): void {
    try {
      // 清理过期缓存
      this.cleanExpiredCache();

      // 检查缓存大小
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        // 删除最旧的缓存项
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }

      // 添加新缓存
      this.cache.set(modelId, {
        key,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('密钥缓存失败:', error);
    }
  }

  /**
   * 获取缓存的密钥
   */
  private getCachedKey(modelId: string): string | null {
    try {
      const cached = this.cache.get(modelId);
      if (!cached) {
        return null;
      }

      // 检查缓存是否过期
      const now = Date.now();
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(modelId);
        return null;
      }

      return cached.key;

    } catch (error) {
      console.error('缓存读取失败:', error);
      return null;
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    try {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.CACHE_DURATION) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.error('缓存清理失败:', error);
    }
  }

  /**
   * 清除敏感数据
   */
  clearSensitiveData(): void {
    try {
      // 清除缓存
      this.cache.clear();

      // 清除设备密钥
      this.deviceKey = null;

      // 清除设备指纹
      const fingerprint = DeviceFingerprint.getInstance();
      fingerprint.clearFingerprint();

    } catch (error) {
      console.error('敏感数据清除失败:', error);
    }
  }

  /**
   * 检查模型是否为内置加密模型
   */
  isEncryptedBuiltinModel(model: any): model is EncryptedBuiltinModel {
    return model && 
           model.isBuiltin === true && 
           model.isEncrypted === true &&
           model.keyFragments &&
           typeof model.keyFragments === 'object';
  }

  /**
   * 获取解密器状态
   */
  getStatus(): {
    isInitialized: boolean;
    cacheSize: number;
    isSecure: boolean;
  } {
    return {
      isInitialized: this.deviceKey !== null,
      cacheSize: this.cache.size,
      isSecure: this.isEnvironmentSecure()
    };
  }

  /**
   * 检查环境是否安全
   */
  private isEnvironmentSecure(): boolean {
    try {
      // 检查基本的加密支持
      if (!window.crypto || !window.crypto.subtle) {
        return false;
      }

      // 检查是否在HTTPS环境
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        return false;
      }

      // 检查是否在iframe中
      if (window.self !== window.top) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// 类型定义
export interface KeyFragments {
  f1: string;    // 片段1 (base64编码)
  f2: string;    // 片段2 (base64编码)
  f3: string;    // 片段3 (base64编码)
  combineOrder?: number[]; // 组合顺序
  separator?: string;       // 分隔符
}

export interface EncryptedBuiltinModel extends Omit<AIModelConfig, 'apiKey'> {
  isBuiltin: true;
  isEncrypted: true;
  keyFragments: KeyFragments;
  decryptParams?: {
    algorithm: string;
    iterations: number;
    saltLength: number;
    ivLength: number;
  };
}

export default BuiltinKeyDecryptor;