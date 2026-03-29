# 🎮 PUBG Prototype — 和平精英操作手感复刻

> **一个完全由 AI 编写代码的第三人称射击游戏原型**
>
> 🔗 **在线体验**: [https://albertfuzheng.github.io/pubg-prototype/](https://albertfuzheng.github.io/pubg-prototype/)

<div align="center">

**策划驱动 · AI 执行 · 零人工编码**

</div>

---

## 📖 项目背景

这个项目是一次**纯 AI 游戏研发工作流**的验证实验。

核心问题：**一个游戏策划（非程序员），能否仅通过与 AI 对话，从零搭建一个可玩的游戏原型？**

答案是：可以。

### 我们做了什么

1. **策划提需求** — 基于和平精英（PUBG）5年策划经验，提出操作手感复刻的详细需求
2. **AI 分析方案** — 对比 5 种技术路线（Three.js、Godot、Unity、UE5、AI原生平台），选定 Web 技术栈
3. **AI 搜索参考** — 在 GitHub 找到 [TPS-Controls](https://github.com/Soham1803/TPS-Controls) 开源项目作为架构基础
4. **AI 编写设计文档** — 产出 600 行详细设计文档（[DESIGN-DOC.md](./DESIGN-DOC.md)），包含 PUBG 真实数据参考
5. **AI 编写全部代码** — 13 个模块、4 个组件、约 2000 行 TypeScript，全部由 AI 生成
6. **AI 配置部署** — GitHub Actions + GitHub Pages 自动部署
7. **AI 修复 Bug** — 例如摄像机 roll 倾斜 bug（Three.js 欧拉角分解顺序问题），从定位到修复全程 AI 完成

**整个过程中，策划没有手写过一行代码。**

### 开发工具

- [WorkBuddy](https://www.codebuddy.cn/) — AI 编码助手（主力开发工具）
- GitHub + GitHub Pages — 版本控制与部署

---

## 🕹️ 操作说明

点击游戏画面获取鼠标控制权后即可操作：

| 按键 | 功能 | 说明 |
|------|------|------|
| `W` `A` `S` `D` | 移动 | 前后左右，后退 ×0.7 / 横移 ×0.85 |
| `Shift` | 冲刺 | 按住加速至 6.3 m/s |
| `Space` | 跳跃 | 趴下时不可跳 |
| 鼠标移动 | 视角旋转 | — |
| 鼠标左键 | 射击 | 腰射有扩散，连射扩散递增 |
| 鼠标右键 | 瞄准 (ADS) | FOV 缩小，精度提升，移速降低 |
| `Q` / `E` | 左右探头 | 按住倾斜 18°，摄像机跟随 |
| `C` | 蹲下 / 站起 | 点按切换 |
| `Z` | 趴下 / 站起 | 点按切换 |
| `Alt` | 自由视角 | 按住旋转观察，松开回正 |
| `R` | 换弹 | — |
| `1` `2` `3` | 切换武器 | AKM / M416 / AWM |

> 按键映射完全对齐**和平精英 PC 端**默认配置。

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 渲染 | [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 声明式 3D 渲染 |
| 物理 | [Rapier](https://rapier.rs/) (`@react-three/rapier`) | Rust→WASM 物理引擎 |
| 状态 | [Zustand](https://zustand-demo.pmnd.rs/) | 轻量状态管理 |
| UI | [React 19](https://react.dev/) + TypeScript | 类型安全 |
| 构建 | [Vite 5](https://vite.dev/) | 秒级热更新 |
| 调试 | [Leva](https://github.com/pmndrs/leva) | 运行时参数调试面板 |

### 项目结构

```
pubg-prototype/
├── src/
│   ├── App.tsx                          # 主入口（Canvas + Physics + 按键映射）
│   ├── main.tsx                         # React 挂载点
│   │
│   ├── components/
│   │   ├── Player.tsx                   # 🎯 主玩家组件（整合所有模块）
│   │   ├── Environment.tsx              # 训练场地图（建筑/掩体/移动靶）
│   │   ├── Crosshair.tsx                # 动态准星 HUD（扩散动画）
│   │   └── HUD.tsx                      # 游戏状态显示（姿态/瞄准/冲刺）
│   │
│   ├── modules/player/                  # 📦 玩家系统模块（核心）
│   │   ├── constants.ts                 # 和平精英真实数据参数配置
│   │   ├── types.ts                     # TypeScript 类型定义
│   │   ├── camera.ts                    # 越肩摄像机 + ADS + 碰撞检测
│   │   ├── physics.ts                   # PUBG 速度体系 + 加减速 + 方向修饰
│   │   ├── movement.ts                  # 移动动画切换逻辑
│   │   ├── jump.ts                      # 跳跃系统（脉冲 + 冷却 + 姿态限制）
│   │   ├── stance.ts                    # 姿态状态机（站 / 蹲 / 趴）
│   │   ├── lean.ts                      # 探头系统（Q/E 倾斜 + 平滑插值）
│   │   ├── freeLook.ts                  # 自由视角（Alt 解锁摄像机）
│   │   ├── shooting.ts                  # 射击系统（射线 + 扩散 + 后坐力）
│   │   ├── recoil.ts                    # 骨骼视觉后坐力（手部抖动）
│   │   ├── muzzleFlash.ts               # 枪口火焰（Mesh + PointLight）
│   │   └── useAnimationSetup.ts         # FBX 动画加载 Hook
│   │
│   ├── hooks/
│   │   └── useInput.ts                  # 输入状态管理
│   │
│   └── stores/
│       └── gameStore.ts                 # Zustand 全局状态
│
├── public/
│   ├── models/                          # GLTF 角色模型
│   └── animations/                      # FBX 动画文件
│
├── DESIGN-DOC.md                        # 📋 600 行详细设计文档
├── .github/workflows/deploy.yml         # GitHub Pages 自动部署
└── package.json
```

### 模块设计

项目采用**组件 → 模块 → 状态**三层分离架构：

```
Player.tsx (组件层)
  ├── camera.ts      ─── 摄像机行为
  ├── physics.ts     ─── 物理移动
  ├── movement.ts    ─── 动画切换
  ├── jump.ts        ─── 跳跃
  ├── stance.ts      ─── 姿态切换
  ├── lean.ts        ─── 探头
  ├── freeLook.ts    ─── 自由视角
  ├── shooting.ts    ─── 射击逻辑
  ├── recoil.ts      ─── 后坐力视觉
  └── muzzleFlash.ts ─── 枪口火焰
```

每个模块是纯函数，接收参数、返回结果，不持有状态。所有状态集中在 `PlayerState` 中，由 `Player.tsx` 在每帧 `useFrame` 中驱动。

---

## 🎯 已实现功能

### 摄像机系统
- ✅ 右肩越肩视角（偏移 0.6m）
- ✅ ADS 瞄准过渡（距离/FOV/偏移平滑切换）
- ✅ 冲刺 FOV 增大（速度感）
- ✅ 姿态关联高度（站 1.8m / 蹲 1.2m / 趴 0.5m）
- ✅ 多射线锥形碰撞检测（防穿墙，9 条射线）
- ✅ 探头摄像机偏移 + Roll 跟随

### 移动系统
- ✅ PUBG 真实速度体系（站立 4.7 / 冲刺 6.3 / 蹲行 3.4 / 匍匐 1.2 m/s）
- ✅ 方向速度修饰（后退 ×0.7 / 横移 ×0.85）
- ✅ ADS 移速降低（×0.6）
- ✅ 起步/停步加减速（消除"滑冰感"）

### 姿态系统
- ✅ 站立 / 蹲下 / 趴下三级姿态
- ✅ C 键蹲站切换、Z 键趴下/起身
- ✅ 姿态影响移速、跳跃、后坐力

### 战斗系统
- ✅ 腰射扩散（基础 3° + 移动/射击递增，最大 8°）
- ✅ ADS 精确射击（基础 0.3°）
- ✅ 后坐力系统（垂直上扬 + 水平随机）
- ✅ 姿态后坐力减益（蹲 -15% / 趴 -30%）
- ✅ 停火后准星自动恢复
- ✅ 动态准星 HUD（四线扩散动画）
- ✅ 枪口火焰 + 点光源

### 其他
- ✅ Q/E 探头（18° 倾斜 + 0.4m 偏移）
- ✅ Alt 自由视角（±100° 范围，松开回正）
- ✅ 训练场地图（建筑/掩体/移动靶标）
- ✅ GitHub Pages 自动部署

---

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（支持热更新）
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

构建产物在 `dist/` 目录，约 5.8 MB（主要是 Three.js）。

---

## 📦 部署

项目通过 **GitHub Actions** 自动部署到 **GitHub Pages**：

- 推送到 `main` 分支 → 自动触发构建 → 部署到 Pages
- 部署配置：`.github/workflows/deploy.yml`
- Pages Source 需选 **"GitHub Actions"**（不是 "Deploy from a branch"）

---

## 🔧 开发故事：AI 修的一个有意思的 Bug

**问题**：鼠标旋转镜头时地平线会左右倾斜。

**根因**：Three.js 的 `camera.rotation.order` 默认是 `'XYZ'`，而 `camera.lookAt()` 产生的旋转本质是 YXZ（yaw→pitch）。用 XYZ 顺序分解这个旋转矩阵，会产生一个不应存在的 Z 分量（roll），导致画面倾斜。

**修复**：在 `lookAt()` 前加一行 `camera.rotation.order = 'YXZ'`。

这个 bug 从截图报告到定位根因到修复，全程由 AI 完成。策划只需要说"镜头歪了"。

---

## 🗺️ Roadmap

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 核心操控感（摄像机/移动/姿态/探头） | ✅ 完成 |
| Phase 2 | 射击手感（扩散/后坐力/准星/自由视角） | ✅ 完成 |
| Phase 3 | 完善（多武器/换弹/射击模式/丰富地图） | 🔜 进行中 |
| Phase 4 | 升级到 Godot 4.x（更完整的引擎能力） | 📋 规划中 |

---

## 📚 参考

- **上游项目**：[Soham1803/TPS-Controls](https://github.com/Soham1803/TPS-Controls) — 提供了 R3F + Rapier 的 TPS 基础架构
- **设计文档**：[DESIGN-DOC.md](./DESIGN-DOC.md) — 包含 PUBG 真实操作数据和详细模块设计
- **PUBG Wiki** — 移动速度、武器数据参考

---

## 📋 License

MIT

---

<div align="center">

*Built with ❤️ by a game designer and AI — no manual coding required.*

</div>
