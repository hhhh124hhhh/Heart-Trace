// Netlify Function for ZhipuAI API Proxy
// Note: Node.js 18+ has built-in fetch API

// 简单的内存存储用于限流（生产环境建议使用数据库）
const rateLimitStore = new Map();

// 限流配置 - 支持环境变量控制
const RATE_LIMITS = {
  DAILY_TOTAL: parseInt(process.env.RATE_LIMIT_DAILY_TOTAL) || 1000,    // 每日总请求限制
  HOURLY_IP: parseInt(process.env.RATE_LIMIT_HOURLY_IP) || 100,       // 每IP每小时限制
  PER_USER: parseInt(process.env.RATE_LIMIT_PER_USER) || 200,         // 每用户每日限制
  
  // 测试模式配置（小范围测试时使用）
  get TEST_MODE() {
    return process.env.RATE_LIMIT_TEST_MODE === 'true' || 
           process.env.RATE_LIMIT_TEST_MODE === '1';
  },
  
  // 根据模式返回实际限流值
  getDailyTotal() {
    return this.TEST_MODE ? 10000 : this.DAILY_TOTAL;
  },
  
  getHourlyIP() {
    return this.TEST_MODE ? 1000 : this.HOURLY_IP;
  },
  
  getPerUser() {
    return this.TEST_MODE ? 2000 : this.PER_USER;
  }
};

// 清理过期的限流记录
function cleanupExpiredRecords() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (key.startsWith('ip_') && now - data.timestamp > oneHour) {
      rateLimitStore.delete(key);
    } else if (key.startsWith('total_') && now - data.timestamp > oneDay) {
      rateLimitStore.delete(key);
    } else if (key.startsWith('user_') && now - data.timestamp > oneDay) {
      rateLimitStore.delete(key);
    }
  }
}

// 检查全局限流
function checkGlobalRateLimit() {
  const now = Date.now();
  const today = new Date(now).toDateString();
  const globalKey = `total_${today}`;
  
  let globalData = rateLimitStore.get(globalKey);
  if (!globalData) {
    globalData = { count: 0, timestamp: now };
  }
  
  if (now - globalData.timestamp > 24 * 60 * 60 * 1000) {
    globalData = { count: 0, timestamp: now };
  }
  
  const dailyTotal = RATE_LIMITS.getDailyTotal();
  if (globalData.count >= dailyTotal) {
    return { allowed: false, reason: 'daily_limit_exceeded', remaining: 0 };
  }
  
  return { allowed: true, remaining: dailyTotal - globalData.count };
}

// 检查IP限流
function checkIPRateLimit(clientIP) {
  const now = Date.now();
  const ipKey = `ip_${clientIP}`;
  
  let ipData = rateLimitStore.get(ipKey);
  if (!ipData) {
    ipData = { count: 0, timestamp: now };
  }
  
  if (now - ipData.timestamp > 60 * 60 * 1000) {
    ipData = { count: 0, timestamp: now };
  }
  
  const hourlyIP = RATE_LIMITS.getHourlyIP();
  if (ipData.count >= hourlyIP) {
    return { allowed: false, reason: 'ip_rate_limit_exceeded', remaining: 0 };
  }
  
  return { allowed: true, remaining: hourlyIP - ipData.count };
}

// 更新限流计数器
function updateRateCounters(clientIP, userId = null) {
  const now = Date.now();
  const today = new Date(now).toDateString();
  
  // 更新全局计数
  const globalKey = `total_${today}`;
  const globalData = rateLimitStore.get(globalKey) || { count: 0, timestamp: now };
  globalData.count += 1;
  rateLimitStore.set(globalKey, globalData);
  
  // 更新IP计数
  const ipKey = `ip_${clientIP}`;
  const ipData = rateLimitStore.get(ipKey) || { count: 0, timestamp: now };
  ipData.count += 1;
  rateLimitStore.set(ipKey, ipData);
  
  // 更新用户计数（如果有用户标识）
  if (userId) {
    const userKey = `user_${userId}`;
    const userData = rateLimitStore.get(userKey) || { count: 0, timestamp: now };
    userData.count += 1;
    rateLimitStore.set(userKey, userData);
  }
}

// 获取客户端IP
function getClientIP(request) {
  return request.headers['x-forwarded-for'] || 
         request.headers['x-real-ip'] || 
         request.connection.remoteAddress ||
         'unknown';
}

// 日志记录
function logRequest(clientIP, userAgent, success, error = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ip: clientIP,
    userAgent,
    success,
    error
  };
  
  // 在实际部署中，这里可以发送到日志服务
  console.log('API Request:', JSON.stringify(logEntry));
}

exports.handler = async (event, context) => {
  // 记录限流配置（仅在开发环境或测试模式）
  if (process.env.NODE_ENV !== 'production' || RATE_LIMITS.TEST_MODE) {
    console.log('🔧 限流配置:', {
      dailyTotal: RATE_LIMITS.getDailyTotal(),
      hourlyIP: RATE_LIMITS.getHourlyIP(),
      perUser: RATE_LIMITS.getPerUser(),
      testMode: RATE_LIMITS.TEST_MODE,
      environment: process.env.NODE_ENV || 'unknown'
    });
  }

  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const clientIP = getClientIP(event);
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    // 清理过期记录
    cleanupExpiredRecords();
    
    // 检查是否为开发模式（开发模式下跳过速率限制）
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.DEV === 'true' ||
                         process.env.NODE_ENV === undefined; // 本地开发服务器通常没有NODE_ENV
    
    // 初始化限流检查结果
    let globalCheck = { allowed: true, remaining: RATE_LIMITS.getDailyTotal() };
    let ipCheck = { allowed: true, remaining: RATE_LIMITS.getHourlyIP() };
    
    // 开发模式下不检查速率限制
    if (!isDevelopment) {
      // 检查限流
      globalCheck = checkGlobalRateLimit();
      if (!globalCheck.allowed) {
        logRequest(clientIP, userAgent, false, 'Global daily limit exceeded');
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ 
            error: 'Daily API limit exceeded',
            remaining: 0
          })
        };
      }
      
      ipCheck = checkIPRateLimit(clientIP);
      if (!ipCheck.allowed) {
        logRequest(clientIP, userAgent, false, 'IP rate limit exceeded');
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ 
            error: 'Rate limit exceeded for this IP',
            remaining: ipCheck.remaining
          })
        };
      }
    } else {
      console.log('Development mode: Rate limiting skipped');
    }
    
    // 解析请求体
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      logRequest(clientIP, userAgent, false, 'Invalid JSON in request body');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request body',
          message: 'Request body must be valid JSON'
        })
      };
    }
    const { messages, model = 'glm-4-flash' } = requestBody;
    
    // 验证必需的参数
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logRequest(clientIP, userAgent, false, 'Missing or invalid messages parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request parameters',
          message: 'Messages parameter is required and must be a non-empty array'
        })
      };
    }
    
    // 获取环境变量中的API密钥
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      logRequest(clientIP, userAgent, false, 'API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Service configuration error',
          message: 'ZHIPU_API_KEY environment variable is required'
        })
      };
    }
    
    // 构建请求到智谱AI
    const zhipuResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 200,
        temperature: 0.8
      })
    });
    
    if (!zhipuResponse.ok) {
      let errorText;
      try {
        errorText = await zhipuResponse.text();
      } catch (textError) {
        errorText = 'Failed to read error response';
      }
      
      logRequest(clientIP, userAgent, false, `ZhipuAI API error: ${zhipuResponse.status}`);
      
      // 根据不同的HTTP状态码返回相应的错误
      let statusCode = zhipuResponse.status;
      if (zhipuResponse.status === 401) {
        statusCode = 500; // 将认证错误转换为服务器错误，不暴露API密钥问题
      }
      
      return {
        statusCode: statusCode >= 500 ? 500 : statusCode, // 限制返回的状态码范围
        headers,
        body: JSON.stringify({
          error: 'AI service error',
          status: zhipuResponse.status,
          message: statusCode === 500 ? 'AI service temporarily unavailable' : errorText
        })
      };
    }
    
    let responseData;
    try {
      responseData = await zhipuResponse.json();
    } catch (jsonError) {
      logRequest(clientIP, userAgent, false, 'Failed to parse AI response JSON');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'AI service response error',
          message: 'Invalid response format from AI service'
        })
      };
    }
    
    // 验证AI响应的格式
    if (!responseData.choices || !Array.isArray(responseData.choices) || responseData.choices.length === 0) {
      logRequest(clientIP, userAgent, false, 'Invalid AI response structure');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'AI service response error',
          message: 'AI service returned invalid response format'
        })
      };
    }
    
    // 更新限流计数器
    updateRateCounters(clientIP);
    
    // 记录成功请求
    logRequest(clientIP, userAgent, true);
    
    // 计算剩余配额
    const globalRemaining = Math.max(0, (globalCheck?.remaining ?? RATE_LIMITS.getDailyTotal()) - 1);
    const ipRemaining = Math.max(0, (ipCheck?.remaining ?? RATE_LIMITS.getHourlyIP()) - 1);
    
    // 返回响应
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: responseData,
        rateLimit: {
          globalRemaining,
          ipRemaining
        }
      })
    };
    
  } catch (error) {
    const clientIP = getClientIP(event);
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logRequest(clientIP, userAgent, false, errorMessage);
    
    // 在生产环境中不暴露详细错误信息
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage = isProduction ? 'Internal server error' : errorMessage;
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: responseMessage,
        timestamp: new Date().toISOString()
      })
    };
  }
};