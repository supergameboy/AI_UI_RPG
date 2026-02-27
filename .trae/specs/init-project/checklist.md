# Checklist

## Monorepo结构
- [x] 根目录存在package.json，包含workspaces相关脚本
- [x] 根目录存在pnpm-workspace.yaml，正确配置packages路径
- [x] packages目录下存在frontend、backend、shared三个子目录
- [x] 根目录存在tsconfig.json基础TypeScript配置
- [x] 根目录存在.eslintrc.js ESLint配置
- [x] 根目录存在.prettierrc Prettier配置
- [x] 根目录存在.gitignore文件
- [x] 根目录存在README.md项目说明文档

## 前端项目(packages/frontend)
- [x] 前端package.json包含React、Vite、TypeScript依赖
- [x] 前端存在vite.config.ts配置文件
- [x] 前端目录结构包含：components、pages、stores、services、utils、styles
- [x] 前端存在tsconfig.json，继承根配置
- [x] 前端存在main.tsx入口文件
- [x] 前端存在App.tsx根组件
- [x] 前端存在全局样式文件

## 后端项目(packages/backend)
- [x] 后端package.json包含Express、TypeScript依赖
- [x] 后端目录结构包含：routes、services、models、utils、middleware
- [x] 后端存在tsconfig.json，继承根配置
- [x] 后端存在index.ts入口文件
- [x] 后端配置了开发热重载

## 共享类型包(packages/shared)
- [x] shared package.json正确配置
- [x] shared存在tsconfig.json
- [x] shared包含基础类型定义(与设计文档一致)
- [x] shared正确导出类型定义

## 开发脚本
- [x] 根package.json包含`dev`脚本，可同时启动前后端
- [x] 根package.json包含`build`脚本
- [x] 前端开发服务器运行在端口5173
- [x] 后端开发服务器运行在端口6756

## 功能验证
- [x] 运行`pnpm install`成功安装所有依赖
- [x] 运行`pnpm dev`前端成功启动
- [x] 运行`pnpm dev`后端成功启动
- [x] 前端可以导入`@ai-rpg/shared`的类型定义
- [x] 后端可以导入`@ai-rpg/shared`的类型定义
