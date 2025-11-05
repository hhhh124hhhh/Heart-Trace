# 💝 心迹 (Heart Trace) - 记录心情，温暖陪伴

一个基于React + TypeScript的心理健康应用，通过AI提供温柔回应，帮助用户记录和调节情绪。

![心迹Logo](public/favicon.svg)

## ✨ 核心功能

- **心情记录**: 记录每日心情和感受，支持情绪标签
- **AI温柔回应**: 基于智谱GLM-4-Flash模型的温柔回应  
- **情绪分析**: 基于关键词的情绪识别和量化分析
- **历史回顾**: 查看情绪变化趋势和记录统计
- **隐私保护**: 支持私密记录和本地存储

## 🎯 应用特色

- **温柔设计**: 现代化UI设计，温暖的渐变色调
- **智能交互**: 50字以上内容即可获得AI个性化回应
- **降级机制**: AI服务不可用时提供精心设计的预设回应
- **本地优先**: 数据主要存储在本地，保护用户隐私
- **响应式**: 完美适配移动端和桌面端

## 🚀 一键部署到Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/daily-reflection)

### 部署步骤
1. **Fork仓库**: 点击右上角Fork按钮
2. **连接Netlify**: 访问 [Netlify](https://app.netlify.com) 并连接GitHub
3. **配置环境变量**: 在Netlify控制台设置 `ZHIPU_API_KEY`
4. **部署完成**: 自动构建和部署！

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/yourusername/Heart-Trace.git
cd Heart-Trace


# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置你的智谱AI密钥

# 启动开发
pnpm dev
```

## 🤖 AI功能说明

- **智能对话**: 基于智谱GLM-4-Flash免费模型，提供50-100字的温柔回应
- **情绪分析**: 自动分析平静度、正向度、能量值三个维度
- **智能降级**: API不可用时提供精心设计的预设回应
- **限流保护**: 防止API滥用（开发环境宽松，生产环境严格）

## 🔧 环境配置

### 获取智谱AI密钥
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn)
2. 注册并登录账号
3. 创建GLM-4-Flash模型的API密钥（免费）

### 配置方式
- **生产环境** (Netlify): 
  - 在Netlify控制台 Site settings > Environment variables 中设置
  - 变量名: `ZHIPU_API_KEY`
- **开发环境**: 
  - 复制 `.env.example` 为 `.env`
  - 设置 `ZHIPU_API_KEY=your-api-key-here`

## 📊 技术架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React 前端    │───▶│ Netlify Functions │───▶│   智谱AI API    │
│                 │    │   (API代理)      │    │  GLM-4-Flash    │
│ • 心情记录      │    │                 │    │                 │
│ • 情绪分析      │    │ • 请求限流       │    │ • 温柔回应      │
│ • 历史回顾      │    │ • 错误处理       │    │ • 免费模型      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │ LocalForage存储 │
                    │                 │
                    │ • 用户记录      │
                    │ • 设置偏好      │
                    │ • 统计数据      │
                    └──────────────────┘
```

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6.x
- **UI组件**: shadcn/ui + Radix UI
- **样式系统**: TailwindCSS + 自定义主题
- **状态管理**: React Hooks + Context API
- **数据存储**: LocalForage (IndexedDB)
- **图标库**: Lucide React
- **部署平台**: Netlify (Functions +静态托管)
- **AI服务**: 智谱AI GLM-4-Flash (免费模型)

## 🎯 项目特色

- **完全免费**: 使用智谱AI免费模型，无API调用费用
- **隐私优先**: 数据本地存储，无需账号注册
- **响应式设计**: 完美适配手机、平板、桌面设备
- **渐进式Web应用**: 支持PWA，可添加到主屏幕
- **温柔回应**: AI提示词精心设计，提供心理疏导式回应
- **优雅降级**: 网络问题时提供有意义的预设回应

## 📱 使用流程

1. **记录心情**: 写下当天的感受和想法
2. **选择情绪**: 通过情绪标签快速标记当前状态
3. **获得回应**: AI提供温暖、治愈的个性化回应
4. **回顾成长**: 查看历史记录和情绪变化趋势

## 🚀 部署说明

### Netlify自动部署
1. Fork本仓库
2. 在Netlify连接GitHub账号
3. 设置环境变量 `ZHIPU_API_KEY`
4. 自动部署完成

### 本地开发
```bash
git clone https://github.com/yourusername/daily-reflection.git
cd daily-reflection
pnpm install
cp .env.example .env  # 配置API密钥
pnpm dev
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 🚀 GitHub开源指南

### 初始化仓库
```bash
# 在GitHub上创建一个新仓库
# 然后在本地仓库执行以下命令

# 初始化Git
git init

# 添加所有文件
git add .

# 初始提交
git commit -m "初始化项目 - 心迹 (Heart Trace) 心理健康应用"

# 添加远程仓库（替换为你的GitHub仓库URL）
git remote add origin https://github.com/yourusername/heart-trace.git

# 推送到GitHub
git push -u origin main
```

### 开源建议
- 更新 `README.md` 中的部署链接指向你的仓库
- 确保 `.gitignore` 文件合理配置，不包含敏感信息
- 在首次提交前删除 `.env` 文件中的实际API密钥
- 考虑添加一个详细的项目介绍视频或截图

## 📄 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [智谱AI开放平台](https://open.bigmodel.cn) - 获取免费API密钥
- [在线演示](https://your-app.netlify.app) - 体验应用功能
- [问题反馈](https://github.com/yourusername/heart-trace/issues) - 报告Bug或建议功能