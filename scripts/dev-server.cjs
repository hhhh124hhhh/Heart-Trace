// 本地开发服务器 - 模拟智谱AI API代理
// 运行方式：node scripts/dev-server.js

const express = require('express');
// Note: Node.js 18+ has built-in fetch API
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = 8888;

// 中间件
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 简单的内存存储用于限流
const rateLimitStore = new Map();
const RATE_LIMITS = {
  HOURLY_IP: parseInt(process.env.RATE_LIMIT_HOURLY_IP) || 100,
  DAILY_TOTAL: parseInt(process.env.RATE_LIMIT_DAILY_TOTAL) || 1000,
  
  // 测试模式配置（小范围测试时使用）
  get TEST_MODE() {
    return process.env.RATE_LIMIT_TEST_MODE === 'true' || 
           process.env.RATE_LIMIT_TEST_MODE === '1';
  },
  
  // 根据模式返回实际限流值
  getHourlyIP() {
    return this.TEST_MODE ? 1000 : this.HOURLY_IP;
  },
  
  getDailyTotal() {
    return this.TEST_MODE ? 10000 : this.DAILY_TOTAL;
  }
};

function checkRateLimit(clientIP) {
  const now = Date.now();
  const hourKey = `hour_${clientIP}_${Math.floor(now / (60 * 60 * 1000))}`;
  const dayKey = `day_${Math.floor(now / (24 * 60 * 60 * 1000))}`;
  
  const hourlyIP = RATE_LIMITS.getHourlyIP();
  const dailyTotal = RATE_LIMITS.getDailyTotal();
  
  let hourCount = rateLimitStore.get(hourKey) || 0;
  let dayCount = rateLimitStore.get(dayKey) || 0;
  
  if (hourCount >= hourlyIP) {
    return { allowed: false, reason: 'IP rate limit exceeded' };
  }
  
  if (dayCount >= dailyTotal) {
    return { allowed: false, reason: 'Daily limit exceeded' };
  }
  
  rateLimitStore.set(hourKey, hourCount + 1);
  rateLimitStore.set(dayKey, dayCount + 1);
  
  return { allowed: true };
}

// 主要的AI代理端点
app.post('/.netlify/functions/zhipu-proxy', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // 检查是否为开发模式（放宽条件，确保开发环境下跳过限流）
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV === 'true' || true; // 强制跳过限流检查
    
    // 开发模式下跳过限流检查
    if (!isDevMode) {
      // 检查限流
      const rateLimit = checkRateLimit(clientIP);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          error: rateLimit.reason
        });
      }
    } else {
      console.log('✅ 开发模式：跳过速率限制检查');
    }
    
    // 检查API密钥
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey || apiKey === 'your-zhipu-api-key-here') {
      console.log('⚠️ API密钥未配置或使用占位符');
      return res.status(500).json({
        error: '开发服务器配置错误',
        message: '请在.env文件中设置正确的智谱AI API密钥',
        help: '访问 https://open.bigmodel.cn 获取API密钥'
      });
    }
    
    const model = process.env.ZHIPU_MODEL || 'glm-4-flash';
    const { messages } = req.body;
    
    // 验证messages参数
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('❌ 请求参数无效: messages参数缺失或格式错误');
      return res.status(400).json({
        error: '请求参数错误',
        message: 'messages参数是必需的，且必须是非空数组'
      });
    }
    
    console.log('🤖 调用智谱AI:', { model, messageCount: messages.length });
    
    // 调用智谱AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 智谱AI API错误:', response.status, errorText);
      return res.status(response.status).json({
        error: '智谱AI服务错误',
        status: response.status,
        message: errorText
      });
    }
    
    const data = await response.json();
    console.log('✅ 智谱AI响应成功');
    
    res.json({
      success: true,
      data: data,
      rateLimit: {
        globalRemaining: 50,
        ipRemaining: 5
      }
    });
    
  } catch (error) {
    console.error('❌ 服务器错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  const apiKey = process.env.ZHIPU_API_KEY;
  res.json({
    status: 'ok',
    apiKeyConfigured: !!(apiKey && apiKey !== 'your-zhipu-api-key-here'),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 本地开发服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 AI代理端点: http://localhost:${PORT}/.netlify/functions/zhipu-proxy`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  
  // 显示限流配置
  console.log('\n🔧 限流配置:');
  console.log(`   每日总限制: ${RATE_LIMITS.getDailyTotal()}`);
  console.log(`   每IP每小时: ${RATE_LIMITS.getHourlyIP()}`);
  console.log(`   测试模式: ${RATE_LIMITS.TEST_MODE ? '开启' : '关闭'}`);
  console.log(`   环境变量: ${process.env.RATE_LIMIT_TEST_MODE || '未设置'}`);
  
  if (RATE_LIMITS.TEST_MODE) {
    console.log('🎯 测试模式已开启 - 限流大幅放宽，适合小范围测试');
  }
  
  console.log('\n🔑 API密钥状态:');
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey || apiKey === 'your-zhipu-api-key-here') {
    console.log('⚠️  警告: ZHIPU_API_KEY未配置或使用占位符');
    console.log('📝 请在.env文件中设置正确的智谱AI API密钥');
  } else {
    console.log('✅ ZHIPU_API_KEY已配置');
  }
});