// AI功能测试脚本
// 运行方式：node scripts/test-ai.js

// Note: Node.js 18+ has built-in fetch API

const API_BASE_URL = 'http://localhost:8888';

async function testAIEndpoint() {
  console.log('🧪 测试AI代理端点...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/zhipu-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // 不指定模型，让后端从环境变量读取默认模型
        messages: [
          {
            role: 'system',
            content: '你是一位温柔、善解人意的心理疏导助手。请给予温暖、治愈的回应。'
          },
          {
            role: 'user',
            content: '今天工作很累，感觉有点压力'
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    const data = await response.json();
    
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ AI代理工作正常！');
      if (data.data.choices && data.data.choices[0] && data.data.choices[0].message) {
        console.log('💬 AI回应:', data.data.choices[0].message.content);
      }
    } else {
      console.log('❌ AI代理返回错误:', data.error || data.message);
      console.log('💡 这通常是因为API密钥未配置，这是正常的开发状态');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

async function testHealthEndpoint() {
  console.log('\n❤️  测试健康检查端点...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(data, null, 2));
    
    if (data.status === 'ok') {
      console.log('✅ 健康检查通过！');
    } else {
      console.log('❌ 健康检查失败');
    }
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
  }
}

async function main() {
  console.log('🤖 心迹 - AI功能测试');
  console.log('=============================\n');
  
  await testHealthEndpoint();
  await testAIEndpoint();
  
  console.log('\n🎯 测试总结:');
  console.log('1. 如果看到"API密钥未配置"错误，这是正常的开发状态');
  console.log('2. 前端会显示相应的错误信息和降级回应');
  console.log('3. 配置真实API密钥后即可获得完整的AI功能');
  console.log('\n📝 下一步:');
  console.log('- 在.env文件中设置ZHIPU_API_KEY');
  console.log('- 访问 http://localhost:5176 测试前端功能');
  console.log('- 输入心情内容，观察AI服务和降级机制');
}

main().catch(console.error);