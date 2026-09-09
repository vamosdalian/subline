# Subline

一款受 Sublime Text 启发的轻量级桌面编辑器，使用 Electron + CodeMirror 6 构建。

## 功能概要

- **多标签编辑** — 同时打开多个文件，点击/中键关闭标签，未保存文件显示修改标记
- **语法高亮** — 支持 JavaScript、TypeScript、HTML、CSS、JSON、Python、Markdown 等语言，根据文件扩展名自动识别
- **多文件夹侧边栏** — 可同时挂载多个目录，每个目录一组可折叠的文件树；子目录按需读取，挂载大仓库也不卡；右键根目录可刷新、在 Finder 中显示或从侧边栏移除，重启后自动恢复目录与展开状态
- **命令面板** — `Cmd+Shift+P` / `Ctrl+Shift+P` 唤起，模糊搜索快速执行命令
- **状态栏** — 实时显示光标位置、语言模式、文件编码
- **文件管理** — 新建、打开、保存、另存为，支持菜单和快捷键两种方式
- **深色主题** — 接近 Sublime Text 的 Monokai 风格配色

## 快捷键

| 功能       | macOS              | Windows / Linux      |
| ---------- | ------------------ | -------------------- |
| 新建文件   | `Cmd+N`            | `Ctrl+N`             |
| 打开文件   | `Cmd+O`            | `Ctrl+O`             |
| 打开文件夹 | `Cmd+Shift+O`      | `Ctrl+Shift+O`       |
| 保存       | `Cmd+S`            | `Ctrl+S`             |
| 另存为     | `Cmd+Shift+S`      | `Ctrl+Shift+S`       |
| 关闭标签   | `Cmd+W`            | `Ctrl+W`             |
| 命令面板   | `Cmd+Shift+P`      | `Ctrl+Shift+P`       |
| 切换侧边栏 | `Cmd+B`            | `Ctrl+B`             |

## 技术栈

- **Electron** — 桌面应用框架
- **CodeMirror 6** — 编辑器引擎
- **TypeScript** — 全栈类型安全
- **electron-vite** — 构建工具（开发模式支持 HMR）

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后会自动打开 Electron 窗口，代码修改后渲染进程支持热更新。

### 生产构建

```bash
npm run build
```

构建产物输出到 `out/` 目录。

## 项目结构

```
src/
├── main/           # Electron 主进程（窗口管理、菜单、IPC）
├── preload/        # 安全桥接层（contextBridge）
├── renderer/       # 渲染进程（UI、编辑器、组件）
│   └── src/
│       ├── components/
│       │   ├── editor/       # 编辑器管理、标签栏、语言支持
│       │   ├── sidebar/      # 文件树
│       │   ├── command-palette.ts
│       │   └── status-bar.ts
│       ├── styles/           # CSS 样式
│       └── app.ts            # 应用控制器
└── shared/         # 主进程与渲染进程共享的类型定义
```
