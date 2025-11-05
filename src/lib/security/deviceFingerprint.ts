/**
 * 设备指纹生成工具
 * 用于生成基于设备特征的唯一标识符，作为密钥派生的基础
 */

export class DeviceFingerprint {
  private static instance: DeviceFingerprint;
  private fingerprint: string | null = null;

  static getInstance(): DeviceFingerprint {
    if (!this.instance) {
      this.instance = new DeviceFingerprint();
    }
    return this.instance;
  }

  /**
   * 生成设备指纹
   */
  async generateFingerprint(): Promise<string> {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    try {
      const components = await this.collectDeviceComponents();
      this.fingerprint = await this.hashComponents(components);
      return this.fingerprint;
    } catch (error) {
      console.error('设备指纹生成失败:', error);
      // 降级到时间戳为基础的指纹
      this.fingerprint = this.generateFallbackFingerprint();
      return this.fingerprint;
    }
  }

  /**
   * 收集设备组件信息
   */
  private async collectDeviceComponents(): Promise<string[]> {
    const components: string[] = [];

    // 浏览器信息
    components.push(navigator.userAgent);
    components.push(navigator.language);
    components.push(navigator.platform);

    // 屏幕信息
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

    // 时区信息
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Canvas指纹
    try {
      const canvasFingerprint = this.generateCanvasFingerprint();
      if (canvasFingerprint) {
        components.push(canvasFingerprint);
      }
    } catch (error) {
      console.warn('Canvas指纹生成失败:', error);
    }

    // WebGL指纹
    try {
      const webglFingerprint = this.generateWebGLFingerprint();
      if (webglFingerprint) {
        components.push(webglFingerprint);
      }
    } catch (error) {
      console.warn('WebGL指纹生成失败:', error);
    }

    // 字体检测
    try {
      const fontFingerprint = await this.detectFonts();
      components.push(fontFingerprint);
    } catch (error) {
      console.warn('字体检测失败:', error);
    }

    return components;
  }

  /**
   * Canvas指纹生成
   */
  private generateCanvasFingerprint(): string | null {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // 绘制特定文本和图形
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('DailyReflection 🌟', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device Fingerprint', 4, 35);
      
      return canvas.toDataURL();
    } catch (error) {
      return null;
    }
  }

  /**
   * WebGL指纹生成
   */
  private generateWebGLFingerprint(): string | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      return `${vendor}|${renderer}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * 字体检测
   */
  private async detectFonts(): Promise<string> {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS',
      'Arial Black', 'Impact', 'Microsoft Sans Serif', 'Tahoma', 'Monaco',
      'Lucida Console', 'Lucida Sans Unicode', 'SimSun', 'SimHei'
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unknown';

    const baseText = 'mmmmmmmmmmlli';
    const baseSize = '72px';
    
    const detectedFonts: string[] = [];
    
    for (const font of testFonts) {
      ctx.font = `${baseSize} '${font}', monospace`;
      const baseWidth = ctx.measureText(baseText).width;
      
      ctx.font = `${baseSize} monospace`;
      const monoWidth = ctx.measureText(baseText).width;
      
      if (baseWidth !== monoWidth) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts.join(',');
  }

  /**
   * 哈希组件信息
   */
  private async hashComponents(components: string[]): Promise<string> {
    const combined = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 降级指纹生成（基于时间戳和随机数）
   */
  private generateFallbackFingerprint(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const userAgent = navigator.userAgent.substring(0, 50);
    
    const combined = `${timestamp}-${random}-${userAgent}`;
    return btoa(combined).replace(/[+/=]/g, '').substring(0, 32);
  }

  /**
   * 清除缓存的指纹
   */
  clearFingerprint(): void {
    this.fingerprint = null;
  }

  /**
   * 检查指纹是否已生成
   */
  hasFingerprint(): boolean {
    return this.fingerprint !== null;
  }
}