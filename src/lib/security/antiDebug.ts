/**
 * 反调试和防护工具
 * 提供基础的代码保护机制
 */

export class AntiDebug {
  private static instance: AntiDebug;
  private isActive: boolean = false;
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL = 1000; // 1秒检查一次

  static getInstance(): AntiDebug {
    if (!this.instance) {
      this.instance = new AntiDebug();
    }
    return this.instance;
  }

  /**
   * 启动反调试保护
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.performSecurityChecks();
    this.startContinuousMonitoring();
  }

  /**
   * 停止反调试保护
   */
  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 执行安全检查
   */
  private performSecurityChecks(): void {
    try {
      // 检查开发者工具
      if (this.checkDevTools()) {
        this.handleSuspiciousActivity('开发者工具检测');
        return;
      }

      // 检查代码完整性
      if (this.checkCodeIntegrity()) {
        this.handleSuspiciousActivity('代码完整性检查失败');
        return;
      }

      // 检查调试器
      if (this.checkDebugger()) {
        this.handleSuspiciousActivity('调试器检测');
        return;
      }

    } catch (error) {
      console.warn('安全检查异常:', error);
    }
  }

  /**
   * 开始持续监控
   */
  private startContinuousMonitoring(): void {
    this.checkInterval = window.setInterval(() => {
      if (this.isActive) {
        this.performSecurityChecks();
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * 检查开发者工具
   */
  private checkDevTools(): boolean {
    const threshold = 160;

    // 检查窗口尺寸差异
    if (window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold) {
      return true;
    }

    // 检查控制台
    if (this.checkConsole()) {
      return true;
    }

    return false;
  }

  /**
   * 检查控制台
   */
  private checkConsole(): boolean {
    const start = performance.now();
    console.log('%c', 'color: transparent;');
    const end = performance.now();

    // 如果console.log执行时间异常长，可能被调试器拦截
    return end - start > 100;
  }

  /**
   * 检查调试器
   */
  private checkDebugger(): boolean {
    try {
      // 时间检测
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger; // 这行代码在调试器中会触发断点
      const end = performance.now();

      // 如果执行时间异常长，说明触发了调试器
      return end - start > 100;
    } catch (error) {
      // 如果debugger语句抛出异常，可能存在调试器
      return true;
    }
  }

  /**
   * 检查代码完整性
   */
  private checkCodeIntegrity(): boolean {
    try {
      // 检查关键函数是否被修改
      const criticalFunctions = [
        'crypto.subtle.encrypt',
        'crypto.subtle.decrypt',
        'atob',
        'btoa'
      ];

      for (const func of criticalFunctions) {
        if (this.isFunctionModified(func)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('代码完整性检查异常:', error);
      return false;
    }
  }

  /**
   * 检查函数是否被修改
   */
  private isFunctionModified(funcPath: string): boolean {
    try {
      const parts = funcPath.split('.');
      let obj = window as any;
      
      for (const part of parts) {
        if (!(obj && typeof obj[part] === 'function')) {
          return true; // 函数不存在或被修改
        }
        obj = obj[part];
      }

      // 检查函数toString()结果是否异常
      const funcStr = obj.toString();
      if (funcStr.includes('native code') === false && 
          funcStr.includes('[native code]') === false) {
        return true; // 可能被重写
      }

      return false;
    } catch (error) {
      return true; // 检查失败，认为被修改
    }
  }

  /**
   * 处理可疑活动
   */
  private handleSuspiciousActivity(reason: string): void {
    console.warn('检测到可疑活动:', reason);
    
    // 清除敏感数据
    this.clearSensitiveData();
    
    // 可以选择重定向或显示警告
    // 这里我们只是停止保护并记录事件
    this.stop();
    
    // 触发安全事件
    this.triggerSecurityEvent(reason);
  }

  /**
   * 清除敏感数据
   */
  private clearSensitiveData(): void {
    try {
      // 清除localStorage中的敏感数据
      const sensitiveKeys = ['api-key', 'token', 'secret'];
      for (const key of sensitiveKeys) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }

      // 清除全局变量中的敏感数据
      if ((window as any).__sensitive_data) {
        delete (window as any).__sensitive_data;
      }

    } catch (error) {
      console.error('清除敏感数据失败:', error);
    }
  }

  /**
   * 触发安全事件
   */
  private triggerSecurityEvent(reason: string): void {
    try {
      // 记录安全事件
      const securityEvent = {
        type: 'SUSPICIOUS_ACTIVITY',
        reason,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.warn('安全事件:', securityEvent);

      // 可以选择发送到服务器进行分析
      // this.reportSecurityEvent(securityEvent);
      
    } catch (error) {
      console.error('触发安全事件失败:', error);
    }
  }

  /**
   * 检查当前是否在安全环境
   */
  isSecureEnvironment(): boolean {
    try {
      return !this.checkDevTools() && 
             !this.checkDebugger() && 
             !this.checkCodeIntegrity();
    } catch (error) {
      return false;
    }
  }

  /**
   * 添加页面可见性监听
   */
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时的检查
        setTimeout(() => {
          if (this.isActive && !document.hidden) {
            this.performSecurityChecks();
          }
        }, 100);
      }
    });
  }

  /**
   * 生成简单的代码哈希（用于完整性检查）
   */
  generateCodeHash(): string {
    try {
      const scripts = document.querySelectorAll('script');
      let combinedCode = '';
      
      scripts.forEach(script => {
        if (script.textContent) {
          combinedCode += script.textContent;
        }
      });

      // 简单哈希算法
      let hash = 0;
      for (let i = 0; i < combinedCode.length; i++) {
        const char = combinedCode.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      
      return hash.toString(16);
    } catch (error) {
      return 'unknown';
    }
  }
}