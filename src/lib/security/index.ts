/**
 * 导出安全模块的所有工具类
 */

export { DeviceFingerprint } from './deviceFingerprint';
export { CryptoUtils } from './cryptoUtils';
export { AntiDebug } from './antiDebug';

// 安全模块常量
export const SECURITY_CONSTANTS = {
  // 密钥派生参数
  KEY_DERIVATION: {
    ITERATIONS: 100000,
    SALT_LENGTH: 32,
    KEY_LENGTH: 256
  },
  
  // 加密参数
  ENCRYPTION: {
    ALGORITHM: 'AES-GCM',
    IV_LENGTH: 12
  },
  
  // 防护参数
  PROTECTION: {
    CHECK_INTERVAL: 1000, // 1秒
    MAX_VIOLATIONS: 3,
    VIOLATION_TIMEOUT: 300000 // 5分钟
  }
};

// 安全工具函数
export const securityUtils = {
  /**
   * 延迟执行（用于防止时序攻击）
   */
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 安全的随机延迟
   */
  async randomDelay(min: number = 50, max: number = 200): Promise<void> {
    const delayMs = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.delay(delayMs);
  },

  /**
   * 生成安全的随机ID
   */
  generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * 检查环境是否安全
   */
  isEnvironmentSecure(): boolean {
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
  },

  /**
   * 安全的本地存储
   */
  secureStorage: {
    set(key: string, value: string): void {
      try {
        if (securityUtils.isEnvironmentSecure()) {
          localStorage.setItem(key, btoa(value));
        }
      } catch (error) {
        console.warn('安全存储失败:', error);
      }
    },

    get(key: string): string | null {
      try {
        if (securityUtils.isEnvironmentSecure()) {
          const value = localStorage.getItem(key);
          return value ? atob(value) : null;
        }
        return null;
      } catch (error) {
        console.warn('安全读取失败:', error);
        return null;
      }
    },

    remove(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('安全删除失败:', error);
      }
    }
  }
};