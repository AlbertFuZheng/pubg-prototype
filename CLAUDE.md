# CLAUDE.md — AI 开发指南

## 项目概述

这是一个**和平精英操作手感复刻**的 Web 3D TPS 原型，技术栈为 React Three Fiber + Rapier + TypeScript + Vite。

**用户身份**：正哥，游戏策划（5 年和平精英项目经验），非程序员。所有代码由 AI 生成，用户通过描述体验问题来驱动迭代。

## 核心开发约定

### 每次修改都必须提交到 GitHub
用户在另一台电脑通过 GitHub Pages 体验，**每次代码修改后必须 `git add` + `git commit` + `git push origin main`**。推送后 GitHub Actions 会自动构建部署。

### 提交规范
- 提交信息用英文，简明描述改动
- 末尾加 `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- 具体文件精确 `git add`，不要 `git add -A`

### Node.js 路径
系统 PATH 中没有 node/npm，本地 Node.js 位于：
```
.tools/node/node-v20.18.0-win-x64/node.exe
```

### gh CLI
已安装 GitHub CLI，需要在 PATH 中加入：
```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
```

## 架构要点

### 镜头系统（camera.ts）— 最常调优的模块
- **镜头与角色相对位置必须刚性固定**：旋转/移动/疾跑时不允许有漂移
- 从 `group.getWorldPosition()` 读取模型视觉位置（不是 `rb.translation()`），确保镜头和模型同帧同步
- 姿态切换（蹲/趴）只做纯 Y 向下偏移，不改变镜头朝向和前后距离
- 镜头朝向用 `Euler(-pitch, yaw+PI, 0, 'YXZ')` 计算，不用 lookAt 角色身体
- 碰撞推近时立即响应，碰撞恢复时用 ratio-based lerp 平滑过渡
- 疾跑时 FOV 不变

### 探头系统（lean.ts + camera.ts）
- Q/E 探头只做位置偏移（水平 + 轻微下移），**不做 roll 旋转**
- 角色身体通过 Spine2 骨骼 rotateZ 做倾斜动作

### 疾跑系统（Player.tsx）
- 疾跑时角色朝向移动方向（WASD），停止疾跑转回镜头朝向
- 疾跑时 Spine2 跟随 pitch（头部/上半身跟镜头），Shoulder 骨骼独立控制手臂下垂 40 度
- 疾跑中射击：立即退出疾跑 → 0.1s 延迟（转身） → 开火 → 开火后 0.3s 内禁止疾跑

### 后坐力系统（shooting.ts + constants.ts）
- 后坐力非常小：微小向上（0.08 度），随机水平抖动（0.12 度范围），每枪不同
- 不累积：`verticalAccumulation = 0`
- 后坐力应用到 `mouseRotation.current.y`（向上偏移，即减小 pitch 值）

### 骨骼索引（Mixamo 标准）
```
0: Hips, 1: Spine, 2: Spine1, 3: Spine2
4: Neck, 5: Head
7: LeftShoulder, 8: LeftArm
31: RightShoulder, 32: RightArm
```

### 物理配置
- 重力：`[0, -20, 0]`（比真实重力大，手感更沉）
- 跳跃冲量：3.5（低矮快速）
- 物理引擎启用插值：`<Physics interpolate={true} timeStep="vary">`

## 用户偏好与反馈记录

### 镜头体验（最高优先级）
- **镜头和角色的相对位置在任何情况下都不能漂移**（旋转、移动、疾跑、姿态切换）
- 如果出现漂移，优先检查时序问题（物理帧 vs 渲染帧），用 `getWorldPosition()` 而非 `rb.translation()`
- 不要用 lerp 解决漂移问题——lerp 本身就是漂移的来源
- 碰撞恢复可以用 lerp，但正常跟随不能有任何延迟

### 操作手感
- 参考和平精英 PC 端的体验来调整所有参数
- 用户会通过截图标注和文字描述来反馈问题，需要准确理解
- 改动要小而精确，不要过度重构

### 沟通偏好
- 用中文回复
- 每次修改后提交并推送到 GitHub
- 不需要冗长的解释，简洁说明改了什么

## 当前进度与待办

### 已完成
- 基础移动系统（WASD + 冲刺 + 姿态）
- 越肩摄像机系统（刚性跟随 + 碰撞 + ADS）
- 探头系统（位置偏移，无 roll）
- 跳跃系统（低矮快速）
- 射击系统（射线 + 扩散 + 微后坐力）
- 武器系统（AKM / M416 / AWM，弹药，换弹，射击模式）
- 疾跑转身射击过渡
- 自由视角（Alt）
- GitHub Pages 自动部署

### 待优化
- 开枪时镜头向下转动的问题（用户上一次反馈，需要确认后坐力方向是否已修正为向上）
- 疾跑时手臂骨骼动作可能需要进一步调优
- 可能需要更多的地图元素和训练场景
