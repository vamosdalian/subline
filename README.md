<div align="center">

# Subline

**一款受 Sublime Text 启发的轻量级跨平台文本编辑器**

开箱即用 · 打开即写 · 支持 macOS / Windows / Linux

[下载最新版本](https://github.com/vamosdalian/subline/releases/latest) · [反馈问题](https://github.com/vamosdalian/subline/issues)

</div>

---

Subline 想做的事情很简单：当你只是想快速打开一个文件看看、改两行、随手记点东西时，不用等一个大型 IDE 启动。它启动快、界面干净，同时保留了多标签、语法高亮、文件树、命令面板这些真正每天都会用到的功能。

## 特性

- **多标签编辑** — 同时打开多个文件，未保存的标签会显示修改标记，中键点击即可关闭
- **语法高亮** — 自动识别 JavaScript、TypeScript、HTML、CSS、JSON、Python、Markdown 等语言
- **多文件夹侧边栏** — 可同时挂载多个目录，各自一棵可折叠的文件树；子目录按需加载，挂载大仓库也不会卡
- **会话恢复** — 关闭再打开，上次的标签页、光标位置、挂载目录和展开状态都还在
- **命令面板** — `Cmd/Ctrl + Shift + P` 唤起，模糊搜索直接执行命令，不用翻菜单
- **Markdown 图片支持** — 在 `.md` 文件里直接粘贴截图，图片自动存到文档旁的 `images/` 目录并插入引用；图片可在编辑器内直接预览、右键复制或拖到其他应用
- **多套主题** — 内置 One Dark、Monokai Pro、Dracula、GitHub Dark / Light、Nord
- **可自定义** — 字体、字号、缩进宽度、是否使用 Tab、自动换行、图片是否自动渲染，都可以在偏好设置里调整
- **文件关联** — 安装后可以用 Subline 直接打开 `.txt`、`.md`、`.json`、`.yaml`、`.sql`、`.log` 等文件

## 安装

前往 [Releases 页面](https://github.com/vamosdalian/subline/releases/latest) 下载对应平台的安装包：

| 平台 | 安装包 | 安装方式 |
| --- | --- | --- |
| macOS | `.dmg` | 打开后把 Subline 拖入「应用程序」，再看下面的说明 |
| Windows | `.exe` | 双击运行安装程序 |
| Linux | `.deb` | `sudo dpkg -i Subline_*.deb` |

> macOS 版本目前只提供 Apple Silicon（M 系列芯片）构建，Intel 机型可以按下面「参与项目」一节自行打包。

### macOS 用户请先看这里

Subline 目前没有经过 Apple 的付费签名和公证，所以首次打开时系统可能会提示 **「Subline 已损坏，无法打开，你应该将它移到废纸篓」**。这并不是文件损坏，而是 macOS 对未公证应用的默认拦截。

把应用拖入「应用程序」文件夹后，在终端执行下面这条命令，去掉隔离标记即可正常打开：

```bash
xattr -d com.apple.quarantine /Applications/Subline.app
```

这条命令只需要执行一次。如果提示 `No such xattr`，说明标记已经被移除，直接打开应用即可。

### Windows 用户

安装时 SmartScreen 可能会提示「Windows 已保护你的电脑」，同样是因为安装包未签名。点击「更多信息」→「仍要运行」即可继续安装。

## 快捷键

| 功能 | macOS | Windows / Linux |
| --- | --- | --- |
| 新建文件 | `Cmd+N` | `Ctrl+N` |
| 打开文件 | `Cmd+O` | `Ctrl+O` |
| 打开文件夹 | `Cmd+Shift+O` | `Ctrl+Shift+O` |
| 保存 | `Cmd+S` | `Ctrl+S` |
| 另存为 | `Cmd+Shift+S` | `Ctrl+Shift+S` |
| 关闭标签 | `Cmd+W` | `Ctrl+W` |
| 命令面板 | `Cmd+Shift+P` | `Ctrl+Shift+P` |
| 切换侧边栏 | `Cmd+B` | `Ctrl+B` |
| 偏好设置 | `Cmd+,` | `Ctrl+,` |

## 使用小贴士

- **挂载多个项目**：多次执行「打开文件夹」，侧边栏会把它们并排列出，互不干扰。右键根目录可以刷新、在文件管理器中显示，或从侧边栏移除。
- **写 Markdown 时贴图**：截图后直接 `Cmd/Ctrl + V`，图片会保存为文档同级 `images/` 目录下的 PNG，并插入相对路径引用。如果文档还没保存，图片会先放在临时目录，保存文档时自动迁移过去。
- **不想看到图片链接**：偏好设置里打开「隐藏图片 URL」，编辑器只显示渲染后的图片。
- **在图片上右键**：可以打开原图、复制图片、复制 Markdown 引用，或者连引用带本地文件一起删掉。

## 参与项目

Subline 是一个开源项目，欢迎提 Issue 反馈问题或提出想要的功能。如果你想自己动手：

```bash
git clone https://github.com/vamosdalian/subline.git
cd subline
npm install
npm run dev      # 开发模式，支持热更新
npm run dist     # 打包当前平台的安装包，产物在 release/
```

需要 Node.js 18 及以上版本。应用基于 Electron 与 CodeMirror 6 构建，使用 TypeScript 编写。

## 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源，可自由使用、修改和分发，详见 LICENSE 文件。

## 致谢

Subline 的交互与配色深受 [Sublime Text](https://www.sublimetext.com/) 启发，编辑体验由 [CodeMirror 6](https://codemirror.net/) 提供支持。
