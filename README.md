# PUBG Prototype — AI Game Dev Workflow

> 🎮 用 AI 驱动的纯策划游戏研发工作流验证项目

一个基于 Three.js + React Three Fiber 的第三人称射击游戏原型，用于验证"策划驱动、AI执行"的游戏开发工作流。

## 🕹️ 操作说明

| 按键 | 功能 |
|------|------|
| WASD | 移动 |
| Shift | 冲刺 |
| Space | 跳跃 |
| 鼠标移动 | 视角旋转 |
| 左键 | 射击 |
| 右键 | 瞄准 |
| Q / E | 左右探头 |
| C | 蹲下 |
| Z | 趴下 |
| R | 换弹 |
| 1 / 2 / 3 | 切换武器（AKM / M416 / AWM） |

## 🛠️ 技术栈

- **React** + **TypeScript** — UI 框架和类型安全
- **Three.js** + **React Three Fiber** — 3D 渲染
- **Rapier** — 物理引擎
- **Zustand** — 状态管理
- **Vite** — 构建工具

## 🚀 本地开发

```bash
npm install
npm run dev
```

## 📦 构建部署

```bash
npm run build
```

构建产物在 `dist/` 目录，通过 GitHub Actions 自动部署到 GitHub Pages。

## 📋 License

MIT
