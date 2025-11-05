/**
 * 加密解密工具类
 * 提供AES-256-GCM加密和解密功能
 */

export class CryptoUtils {
  private static instance: CryptoUtils;
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12; // GCM推荐的IV长度

  static getInstance(): CryptoUtils {
    if (!this.instance) {
      this.instance = new CryptoUtils();
    }
    return this.instance;
  }

  /**
   * 从密码派生密钥
   */
  async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number = 100000
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(password);

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      ),
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 生成随机盐值
   */
  generateSalt(length: number = 32): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * 生成随机IV
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  }

  /**
   * 加密数据
   */
  async encrypt(
    plaintext: string,
    key: CryptoKey,
    iv?: Uint8Array
  ): Promise<{ encrypted: Uint8Array; iv: Uint8Array; authTag?: Uint8Array }> {
    const actualIV = iv || this.generateIV();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: actualIV
      },
      key,
      data
    );

    const encryptedArray = new Uint8Array(encrypted);
    
    return {
      encrypted: encryptedArray,
      iv: actualIV
    };
  }

  /**
   * 解密数据
   */
  async decrypt(
    encrypted: Uint8Array,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * 加密字符串并返回Base64编码
   */
  async encryptToBase64(
    plaintext: string,
    key: CryptoKey,
    iv?: Uint8Array
  ): Promise<string> {
    const result = await this.encrypt(plaintext, key, iv);
    
    // 将IV和加密数据合并
    const combined = new Uint8Array(result.iv.length + result.encrypted.length);
    combined.set(result.iv);
    combined.set(result.encrypted, result.iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * 从Base64字符串解密
   */
  async decryptFromBase64(
    combinedBase64: string,
    key: CryptoKey
  ): Promise<string> {
    const combined = new Uint8Array(
      atob(combinedBase64).split('').map(char => char.charCodeAt(0))
    );

    // 提取IV和加密数据
    const iv = combined.slice(0, this.IV_LENGTH);
    const encrypted = combined.slice(this.IV_LENGTH);

    return await this.decrypt(encrypted, key, iv);
  }

  /**
   * 生成安全的随机字符串
   */
  generateRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/[+/=]/g, '')
      .substring(0, length);
  }

  /**
   * 安全比较两个字符串（防止时序攻击）
   */
  async secureCompare(a: string, b: string): Promise<boolean> {
    if (a.length !== b.length) {
      return false;
    }

    const encoder = new TextEncoder();
    const bufferA = encoder.encode(a);
    const bufferB = encoder.encode(b);

    const key = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureA = await crypto.subtle.sign('HMAC', key, bufferA);
    
    return await crypto.subtle.verify('HMAC', key, signatureA, bufferB);
  }

  /**
   * 混淆字符串（简单混淆，非加密）
   */
  obfuscate(str: string): string {
    return btoa(str.split('').reverse().join('')).replace(/[+/=]/g, '');
  }

  /**
   * 反混淆字符串
   */
  deobfuscate(obfuscatedStr: string): string {
    const padded = obfuscatedStr + '=='.slice(0, (4 - obfuscatedStr.length % 4) % 4);
    try {
      return atob(padded).split('').reverse().join('');
    } catch {
      throw new Error('反混淆失败');
    }
  }

  /**
   * 生成密钥派生所需的盐值
   */
  generateKeyDerivationSalt(): {
    salt: Uint8Array;
    saltBase64: string;
  } {
    const salt = this.generateSalt();
    return {
      salt,
      saltBase64: btoa(String.fromCharCode(...salt))
    };
  }

  /**
   * 安全清零数组
   */
  secureZero(array: Uint8Array): void {
    // 尽可能安全地清零数组内容
    for (let i = 0; i < array.length; i++) {
      array[i] = 0;
    }
  }

  /**
   * 安全清零字符串
   */
  secureZeroString(str: string): void {
    // 在JavaScript中无法完全安全地清零字符串，
    // 但可以通过重新赋值来帮助垃圾回收
    void str; // 防止编译器优化
  }
}