#!/usr/bin/env node

/**
 * 速率限制测试脚本
 * 用于测试API代理的速率限制功能
 * 使用方法: node scripts/test-rate-limit.cjs --requests=100 --interval=100
 */

const https = require('https');
const http = require('http');
const url = require('url');

// 解析命令行参数（不依赖第三方库）
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    requests: 100,
    interval: 100,
    url: 'http://localhost:8888/.netlify/functions/zhipu-proxy',
    concurrency: 5,
    testMode: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--requests=')) {
      options.requests = parseInt(arg.split('=')[1], 10) || options.requests;
    } else if (arg.startsWith('--interval=')) {
      options.interval = parseInt(arg.split('=')[1], 10) || options.interval;
    } else if (arg.startsWith('--url=')) {
      options.url = arg.split('=')[1] || options.url;
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10) || options.concurrency;
    } else if (arg === '--test-mode') {
      options.testMode = true;
    }
  });

  return options;
}

const options = parseArgs();

console.log('📊 速率限制测试开始');
console.log(`测试配置:`);
console.log(`- 请求总数: ${options.requests}`);
console.log(`- 请求间隔: ${options.interval}ms`);
console.log(`- 测试URL: ${options.url}`);
console.log(`- 并发数: ${options.concurrency}`);
console.log(`- 测试模式: ${options.testMode ? '开启' : '关闭'}`);
console.log('--------------------------------------------------------');

// 统计数据
let successCount = 0;
let errorCount = 0;
let rateLimitCount = 0;
let startTime = null;
let endTime = null;
let queue = [];
let activeRequests = 0;

// 发送单个请求
function sendRequest(index) {
  return new Promise((resolve) => {
    const parsedUrl = url.parse(options.url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': 'true',
        'X-Test-Number': index
      }
    };

    const testData = {
      model: "glm-4-flash",
      messages: [
        {
          role: "user",
          content: "你好，请给我一个简短的回复"
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    };

    activeRequests++;
    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        activeRequests--;
        
        if (res.statusCode === 200) {
          successCount++;
          console.log(`✅ 请求 ${index}: 成功 (${res.statusCode})`);
        } else if (res.statusCode === 429) {
          rateLimitCount++;
          console.log(`🚫 请求 ${index}: 触发限流 (${res.statusCode})`);
        } else {
          errorCount++;
          console.log(`❌ 请求 ${index}: 失败 (${res.statusCode})`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      activeRequests--;
      errorCount++;
      console.log(`❌ 请求 ${index}: 错误 - ${e.message || '未知错误'}`);
      console.debug(`错误详情: ${e.stack || '无堆栈信息'}`);
      resolve();
    });

    req.write(JSON.stringify(testData));
    req.end();
  });
}

// 并发控制函数
async function processQueue() {
  if (queue.length === 0) {
    if (activeRequests === 0) {
      endTime = Date.now();
      printResults();
    }
    return;
  }

  if (activeRequests < options.concurrency) {
    const index = queue.shift();
    await sendRequest(index);
    setTimeout(processQueue, 0);
  } else {
    setTimeout(processQueue, 10);
  }
}

// 打印测试结果
function printResults() {
  console.log('\n--------------------------------------------------------');
  console.log('📊 速率限制测试结果');
  console.log(`- 总请求数: ${options.requests}`);
  console.log(`- 成功请求: ${successCount}`);
  console.log(`- 失败请求: ${errorCount}`);
  console.log(`- 触发限流: ${rateLimitCount}`);
  
  const totalTime = endTime - startTime;
  const requestsPerSecond = (options.requests / (totalTime / 1000)).toFixed(2);
  
  console.log(`- 总耗时: ${totalTime}ms`);
  console.log(`- 吞吐量: ${requestsPerSecond} 请求/秒`);
  
  if (rateLimitCount > 0) {
    console.log('\n⚠️  限流触发分析:');
    console.log(`- 限流触发率: ${((rateLimitCount / options.requests) * 100).toFixed(2)}%`);
    
    if (options.testMode) {
      console.log('💡 注意: 测试模式下应大幅减少限流触发');
    } else {
      console.log('💡 建议: 考虑调整限流参数或启用测试模式');
    }
  } else {
    console.log('\n✅ 限流功能正常工作，未触发限流');
  }
  
  console.log('--------------------------------------------------------');
}

// 启动测试
function startTest() {
  // 准备请求队列
  for (let i = 1; i <= options.requests; i++) {
    queue.push(i);
  }

  startTime = Date.now();
  processQueue();
}

// 直接启动测试
startTest();