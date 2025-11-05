# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个名为"心迹"的React + TypeScript心理健康应用，支持用户记录每日心情并获得AI的温柔回应。项目使用Vite构建，支持多种国内AI服务提供商。

## 常用命令

### 开发环境
```bash
pnpm dev                    # 安装依赖并启动开发服务器
pnpm install-deps          # 安装项目依赖
```

### 构建与生产
```bash
pnpm build                 # 构建开发版本
pnpm build:prod           # 构建生产版本 (BUILD_MODE=prod)
pnpm preview              # 预览构建结果
```

### 代码质量
```bash
pnpm lint                 # 运行ESLint代码检查
```

### 依赖管理
```bash
pnpm clean                # 清理所有依赖和缓存
```

## 代码架构

### 核心技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS + shadcn/ui组件库
- **状态管理**: 本地状态管理 (useState, useEffect)
- **数据存储**: LocalForage (本地indexedDB存储)
- **路由**: React Router DOM

### 目录结构
```
src/
├── components/           # 可复用组件
│   ├── BottomNav.tsx    # 底部导航
│   ├── Button.tsx       # 通用按钮
│   ├── RecordCard.tsx   # 记录卡片
│   └── ...
├── views/               # 页面视图
│   ├── HomeView.tsx     # 首页(记录页面)
│   ├── HistoryView.tsx  # 历史记录
│   ├── ProfileView.tsx  # 个人设置
│   └── AIConfigView.tsx # AI模型配置
├── lib/                 # 核心服务
│   ├── aiService.ts     # AI服务调用
│   ├── storage.ts       # 本地数据存储
│   ├── aiModels.ts      # AI模型配置
│   └── aiSettingsDB.ts  # AI设置数据库
├── types/               # TypeScript类型定义
└── hooks/               # 自定义React Hooks
```

### 数据管理架构
应用使用本地IndexedDB存储数据，通过LocalForage进行管理：

- **recordsDB**: 管理日常记录的增删改查
- **tagsDB**: 管理情绪标签
- **statsDB**: 管理用户统计数据  
- **settingsDB**: 管理用户设置
- **aiSettingsDB**: 管理AI模型配置

### AI服务集成
支持多个国内AI服务提供商：
- DeepSeek、KIMI、智谱GLM、通义千问、文心一言、讯飞星火
- 使用OpenAI兼容API格式
- 支持自定义API端点和密钥
- 包含简单的情绪分析功能

### 应用路由
应用使用视图切换模式，主要视图：
- `home`: 主页 - 记录今日心情
- `history`: 历史记录查看
- `profile`: 个人设置
- `ai-config`: AI模型配置

### 组件库
基于Radix UI和shadcn/ui构建的组件系统：
- 使用@radix-ui作为无样式组件基础
- 使用class-variance-authority进行变体管理
- 配合TailwindCSS实现样式

## 开发注意事项

### 环境变量
- 项目使用.env.local文件管理敏感配置
- 请勿将包含API密钥的配置文件提交到版本控制

### 构建配置
- 开发模式会启用source-identifier插件用于调试
- 生产模式(BUILD_MODE=prod)会禁用调试功能
- 使用@路径别名指向src目录

### 代码风格
- ESLint配置允许any类型和未使用变量
- 使用TypeScript严格类型检查
- 遵循React 18函数组件最佳实践