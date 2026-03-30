# PUBG Prototype — 和平精英操作手感复刻

> **一个完全由 AI 编写代码的第三人称射击游戏原型**
>
> **在线体验**: [https://albertfuzheng.github.io/pubg-prototype/](https://albertfuzheng.github.io/pubg-prototype/)

**策划驱动 · AI 执行 · 零人工编码**

---

## 项目背景

这是一次**纯 AI 游戏研发工作流**的验证实验。

核心问题：**一个游戏策划（非程序员），能否仅通过与 AI 对话，从零搭建一个可玩的游戏原型？**

答案是：可以。

### 开发过程

1. **策划提需求** — 基于和平精英 5 年策划经验，提出操作手感复刻的详细需求
2. **AI 分析方案** — 对比 5 种技术路线（Three.js、Godot、Unity、UE5、AI 原生平台），选定 Web 技术栈
3. **AI 搜索参考** — 找到 [TPS-Controls](https://github.com/Soham1803/TPS-Controls) 开源项目作为架构基础
4. **AI 编写设计文档** — 产出详细设计文档（[DESIGN-DOC.md](./DESIGN-DOC.md)），包含 PUBG 真实数据参考
5. **AI 编写全部代码** — 13 个模块、4 个组件，全部由 AI 生成
6. **AI 配置部署** — GitHub Actions + GitHub Pages 自动部署
7. **策划持续调优** — 通过对话描述体验问题，AI 定位并修复

**整个过程中，策划没有手写过一行代码。**

### 开发工具

- [Claude Code](https://claude.ai/claude-code) — AI 编码助手（主力开发工具）
- [WorkBuddy](https://www.codebuddy.cn/) — AI 编码助手（早期开发）
- GitHub + GitHub Pages — 版本控制与部署

---

## 操作说明

点击游戏画面获取鼠标控制权后即可操作：

| 按键 | 功能 | 说明 |
|------|------|------|
| `W` `A` `S` `D` | 移动 | 前后左右，后退 x0.7 / 横移 x0.85 |
| `Shift` | 冲刺 | 按住加速至 6.3 m/s，角色朝移动方向转身 |
| `Space` | 跳跃 | 低矮快速跳跃，趴下时不可跳 |
| 鼠标移动 | 视角旋转 | 镜头与角色相对位置固定 |
| 鼠标左键 | 射击 | 腰射有扩散，疾跑中射击会先退出疾跑 |
| 鼠标右键 | 瞄准 (ADS) | FOV 缩小，精度提升，移速降低 |
| `Q` / `E` | 左右探头 | 镜头水平偏移，无 roll 旋转 |
| `C` | 蹲下 / 站起 | 点按切换，镜头仅垂直下移 |
| `Z` | 趴下 / 站起 | 点按切换，镜头仅垂直下移 |
| `Alt` | 自由视角 | 按住旋转观察，松开回正 |
| `R` | 换弹 | 根据武器不同换弹时间不同 |
| `B` | 切换射击模式 | 全自动 / 单发 |
| `1` `2` `3` | 切换武器 | AKM / M416 / AWM |

> 按键映射对齐**和平精英 PC 端**默认配置。

---

## 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 渲染 | [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 声明式 3D 渲染 |
| 物理 | [Rapier](https://rapier.rs/) (`@react-three/rapier`) | Rust→WASM 物理引擎，启用插值 |
| 状态 | [Zustand](https://zustand-demo.pmnd.rs/) | 轻量状态管理 |
| UI | [React 19](https://react.dev/) + TypeScript | 类型安全 |
| 构建 | [Vite 5](https://vite.dev/) | 秒级热更新 |

### 项目结构

```
pubg-prototype/
├── src/
│   ├── App.tsx                          # 主入口（Canvas + Physics + 按键映射）
│   ├── components/
│   │   ├── Player.tsx                   # 主玩家组件（整合所有模块）
│   │   ├── Environment.tsx              # 训练场地图
│   │   ├── Crosshair.tsx                # 动态准星 HUD
│   │   └── HUD.tsx                      # 武器/弹药/姿态/射击模式 HUD
│   ├── modules/player/                  # 玩家系统模块
│   │   ├── constants.ts                 # 参数配置（速度/摄像机/武器/探头/跳跃）
│   │   ├── types.ts                     # TypeScript 类型定义
│   │   ├── camera.ts                    # 越肩摄像机 + ADS + 碰撞检测 + 恢复平滑
│   │   ├── physics.ts                   # 物理移动（从模型视觉位置同步镜头）
│   │   ├── movement.ts                  # 移动动画切换
│   │   ├── jump.ts                      # 跳跃系统
│   │   ├── stance.ts                    # 姿态状态机（站/蹲/趴）
│   │   ├── lean.ts                      # 探头系统（位置偏移，无 roll）
│   │   ├── freeLook.ts                  # 自由视角
│   │   ├── shooting.ts                  # 射击（射线 + 扩散 + 后坐力）
│   │   ├── recoil.ts                    # 骨骼视觉后坐力
│   │   ├── muzzleFlash.ts               # 枪口火焰
│   │   └── useAnimationSetup.ts         # FBX 动画加载
│   └── hooks/
│       └── useInput.ts                  # 输入状态管理
├── public/
│   ├── models/                          # GLTF 角色模型（Mixamo）
│   └── animations/                      # FBX 动画文件
├── CLAUDE.md                            # AI 开发指南与项目约定
├── DESIGN-DOC.md                        # 详细设计文档
└── .github/workflows/deploy.yml         # GitHub Pages 自动部署
```

### 架构原则

每个模块是纯函数，接收参数、返回结果，不持有状态。所有状态集中在 `PlayerState` 中，由 `Player.tsx` 在每帧 `useFrame` 中驱动。

---

## 已实现功能

### 摄像机系统
- 右肩越肩视角（紧凑构图，距离 1.8m）
- ADS 瞄准过渡（距离/FOV/偏移平滑切换）
- 姿态切换仅垂直下移（不改变镜头朝向和前后距离）
- 多射线锥形碰撞检测（防穿墙），碰撞恢复平滑 lerp
- 镜头与角色相对位置完全刚性（旋转/移动/疾跑均不漂移）
- 从模型 `getWorldPosition()` 读取位置，消除物理/渲染帧不同步的重影

### 移动系统
- PUBG 真实速度体系（站立 4.7 / 冲刺 6.3 / 蹲行 3.4 / 匍匐 1.2 m/s）
- 方向速度修饰（后退 x0.7 / 横移 x0.85）
- 疾跑时角色朝向移动方向，停止疾跑转回镜头朝向
- 疾跑时上半身前倾 ~20 度，手臂独立下垂 40 度（Shoulder 骨骼独立控制）

### 战斗系统
- 三把武器（AKM / M416 / AWM），各有独立参数
- 全自动 / 单发射击模式切换（B 键）
- 弹药系统（弹匣 + 备弹 + 换弹动画）
- 后坐力：微小上扬 + 随机水平抖动（每枪不同）
- 疾跑中射击：立即退出疾跑 → 0.1s 延迟转身 → 开火 → 0.3s 内禁止疾跑
- 动态准星 HUD + 枪口火焰

### 探头系统
- Q/E 探头：仅水平位置偏移 + 轻微下移，无 roll 旋转
- 角色身体 30 度倾斜动作

### 物理与部署
- Rapier 物理引擎（重力 -20，启用插值，变步长）
- 跳跃：冲量 3.5，低矮快速（PUBG 风格）
- 切页面回来不会出现镜头/角色脱节
- GitHub Actions 自动构建部署到 GitHub Pages

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（支持热更新）
npm run dev

# 构建生产版本
npm run build
```

---

## 部署

项目通过 **GitHub Actions** 自动部署到 **GitHub Pages**：

- 推送到 `main` 分支 → 自动触发构建 → 部署到 Pages
- 部署配置：`.github/workflows/deploy.yml`
- Pages Source 需选 **"GitHub Actions"**

---

## 参考

- **上游项目**：[Soham1803/TPS-Controls](https://github.com/Soham1803/TPS-Controls) — R3F + Rapier TPS 基础架构
- **设计文档**：[DESIGN-DOC.md](./DESIGN-DOC.md) — 包含 PUBG 真实操作数据
- **AI 开发指南**：[CLAUDE.md](./CLAUDE.md) — 项目约定与开发上下文

---

## License

MIT

---

*Built by a game designer and AI — no manual coding required.*
