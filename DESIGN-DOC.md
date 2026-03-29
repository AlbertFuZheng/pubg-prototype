# 和平精英操作复刻设计文档

> **目标**：基于 TPS-Controls 开源项目，复刻和平精英（PUBG Mobile / PUBG PC）的核心操作手感  
> **基准参考**：和平精英 PC 端（模拟器）操作体验  
> **技术栈**：React Three Fiber + TypeScript + Rapier Physics + Vite  
> **上游项目**：[Soham1803/TPS-Controls](https://github.com/Soham1803/TPS-Controls)

---

## 一、操作总览：和平精英 vs TPS-Controls 现状

| 操作模块 | 和平精英（参考标准） | TPS-Controls 现状 | 差距评估 |
|----------|-------------------|--------------------|----------|
| **基础移动** | WASD + Shift冲刺 | WASD + F跑步 | 🟡 按键映射需调整 |
| **姿态切换** | 站立/蹲/趴三级 | 仅站立 | 🔴 需完整实现 |
| **第三人称镜头** | 越肩视角，右偏 | 居中后方 | 🟡 需调整偏移 |
| **自由视角** | Alt长按自由观察 | 无 | 🔴 需新增 |
| **左右探头** | Q/E探头，减少暴露面积 | 无 | 🔴 需新增 |
| **腰射（Hip Fire）** | 不开镜直接射击，准星扩散 | 左键射击（无扩散） | 🟡 需加扩散系统 |
| **开镜（ADS）** | 右键开镜，视角过渡到瞄准镜 | 右键zoom（缩放） | 🟡 需优化过渡 |
| **后坐力** | 垂直+水平后坐力，可压枪 | 骨骼抖动（简单） | 🟡 需扩展为弹道模式 |
| **跳跃** | 空格跳跃 | 空格跳跃 | 🟢 基本一致 |
| **武器系统** | 多武器切换+换弹 | 单武器 | 🟡 后期扩展 |

---

## 二、模块详细设计

### 2.1 第三人称摄像机系统 (Camera)

#### 2.1.1 和平精英镜头行为分析

和平精英的 TPP 摄像机有以下核心特征：

**默认待机视角（非开镜）：**
- 摄像机位于角色**右肩后上方**（经典越肩视角）
- 水平偏移：角色中心向右约 0.5~0.8 单位
- 垂直高度：角色头顶上方约 0.3~0.5 单位
- 后方距离：约 2.5~3.5 单位
- 视角俯仰范围：仰角约 -60° ~ 俯角约 75°
- 摄像机始终看向角色附近（非角色脚底，而是胸部偏上）

**移动中的摄像机：**
- 摄像机跟随有轻微延迟感（lerp 平滑），不是硬绑定
- 冲刺时 FOV 略微增大（5°左右），增强速度感
- 蹲下时摄像机高度降低，跟随角色降低
- 趴下时摄像机降到地面附近高度

**碰撞处理：**
- 相机遇到墙壁时自动靠近角色（防穿墙）
- 相机在室内自动调整距离
- 碰撞回弹要平滑，不能瞬移

#### 2.1.2 改造设计

基于 TPS-Controls 的 `camera.ts` 改造：

```
// 新增摄像机参数
const CAMERA_CONFIG = {
  // 默认视角（非开镜）
  default: {
    distance: 3.0,          // 后方距离
    height: 1.8,            // 相对角色脚底的高度
    rightOffset: 0.6,       // 右肩偏移
    lookAtHeight: 1.3,      // 看向角色的高度（胸部）
    fov: 75,                // 默认视场角
    lerpSpeed: 0.08,        // 跟随平滑度
    pitchMin: -Math.PI / 3, // 仰角限制 (-60°)
    pitchMax: Math.PI * 5/12, // 俯角限制 (75°)
  },
  // 开镜 (ADS) 视角
  ads: {
    distance: 1.2,          // 靠近角色
    height: 1.65,           // 接近眼睛高度
    rightOffset: 0.35,      // 减小右偏
    lookAtHeight: 1.6,      // 看向瞄准方向
    fov: 50,                // 缩小FOV
    lerpSpeed: 0.2,         // 快速过渡
  },
  // 冲刺视角
  sprint: {
    fovBoost: 5,            // FOV 增量
  },
  // 姿态相机高度映射
  stanceHeight: {
    standing: 1.8,
    crouching: 1.2,
    prone: 0.5,
  },
  // 碰撞参数
  collision: {
    minDistance: 0.3,
    rayCount: 9,            // 多射线锥形检测
    buffer: 0.2,
  },
};
```

**关键改动**：
1. ✅ 将 TPS-Controls 居中视角改为**右肩越肩视角**
2. ✅ 摄像机 lookAt 目标从角色中心改为胸部高度
3. ✅ 增加冲刺 FOV 变化
4. ✅ 增加姿态关联的摄像机高度调整
5. ✅ 保留现有碰撞检测系统（9射线锥形检测够用）

---

### 2.2 角色移动系统 (Movement)

#### 2.2.1 和平精英移动数据（参考 PUBG Wiki）

| 姿态 | 速度 (m/s) | 占基准% | 备注 |
|------|-----------|---------|------|
| 站立冲刺 | 6.3 | 100% | Shift持续按住 |
| 蹲下冲刺 | 4.8 | 76% | 蹲着跑 |
| 站立奔跑 | 4.7 | 75% | 正常WASD |
| 蹲下奔跑 | 3.4 | 54% | |
| 站立行走 | 1.7 | 27% | 缓行模式（几乎不用） |
| 蹲下行走 | 1.3 | 21% | |
| 匍匐爬行 | 1.2 | 19% | |

**武器重量影响移动速度**（相对空手基准）：
| 武器类型 | 速度 (m/s) | 减速 |
|---------|-----------|------|
| 手枪 | 6.32 | +0.3% |
| 空手 | 6.30 | 基准 |
| SMG | 6.15 | -2.3% |
| 步枪 | 6.01 | -4.6% |
| 狙击枪 | 5.99 | -4.8% |
| 霰弹枪 | 5.91 | -6.1% |

#### 2.2.2 PC端默认按键映射

| 按键 | 操作 | 优先级 |
|------|------|--------|
| W | 前进 | 核心 |
| A | 左平移 | 核心 |
| S | 后退 | 核心 |
| D | 右平移 | 核心 |
| Shift | 冲刺（按住） | 核心 |
| Space | 跳跃 | 核心 |
| C | 蹲下（点按切换） | 核心 |
| Z | 趴下（点按切换） | 核心 |
| Q | 左探头（按住） | 核心 |
| E | 右探头（按住） | 核心 |
| Alt | 自由视角（按住） | 核心 |
| V | 第一/第三人称切换 | 后期 |
| 鼠标左键 | 射击 | 核心 |
| 鼠标右键 | 开镜/瞄准（按住） | 核心 |
| R | 换弹 | 阶段二 |
| 1/2/3 | 切换武器 | 阶段二 |
| B | 切换射击模式（单发/连发/全自动） | 阶段二 |

#### 2.2.3 改造设计

```
// 移动配置（游戏单位 ≈ 1米）
const MOVEMENT_CONFIG = {
  // 基础速度（单位/秒，1单位 ≈ 1米）
  baseSpeed: 4.7,         // 站立奔跑（默认状态）
  sprintSpeed: 6.3,       // 冲刺
  crouchSpeed: 3.4,       // 蹲行
  proneSpeed: 1.2,        // 匍匐

  // 速度修饰
  backwardMultiplier: 0.7,  // 后退时速度 ×0.7
  strafeMultiplier: 0.85,   // 横移时速度 ×0.85
  adsMultiplier: 0.6,       // 开镜时速度 ×0.6

  // 加减速
  accelerationTime: 0.15,   // 起步加速时间(秒)
  decelerationTime: 0.1,    // 停步减速时间(秒)

  // 跳跃
  jumpImpulse: 4.5,         // 跳跃高度
  jumpCooldown: 0.5,        // 跳跃冷却

  // 转向
  turnLerpStanding: 0.1,    // 站立转向平滑
  turnLerpAds: 1.0,         // 开镜时角色朝向瞬间跟随
};
```

**关键改动**：
1. ✅ 移动从 `MOVE_SPEED=2, RUN_MULTIPLIER=2` 改为基于 PUBG 真实数据的速度体系
2. ✅ 冲刺键从 F 改为 Shift（符合 PUBG 习惯）
3. ✅ 增加后退/横移减速
4. ✅ 增加开镜移动速度降低
5. ✅ 增加起步/停步加减速（避免"滑冰感"）

---

### 2.3 姿态系统 (Stance)

#### 2.3.1 和平精英三级姿态

```
站立 (Standing)
  ↕ C键点按切换
蹲下 (Crouching)
  ↕ Z键点按切换
趴下 (Prone)
```

**姿态特征：**

| 属性 | 站立 | 蹲下 | 趴下 |
|------|------|------|------|
| 碰撞体高度 | ~1.8m | ~1.2m | ~0.4m |
| 碰撞体半径 | 0.3m | 0.3m | 0.3m |
| 摄像机高度 | 1.8m | 1.2m | 0.5m |
| 移动速度基准 | 100% | 72% | 25% |
| 可冲刺 | ✅ | ✅ (76%) | ❌ |
| 可跳跃 | ✅ | ✅ | ❌ |
| 后坐力减少 | 0% | ~15% | ~30% |
| 暴露面积 | 100% | ~60% | ~30% |
| 切换动画时间 | - | 0.3s | 0.5s |

**姿态切换逻辑：**
- C 键：站立 → 蹲下 → 站立（点按切换）
- Z 键：任何姿态 → 趴下 / 趴下 → 站立
- 冲刺中按C：自动取消冲刺再蹲下
- 趴下中不能跳跃和冲刺
- 蹲下中按空格：蹲起跳

#### 2.3.2 实现方案

```typescript
enum Stance {
  Standing = 'standing',
  Crouching = 'crouching',
  Prone = 'prone',
}

interface StanceConfig {
  colliderHeight: number;    // 胶囊碰撞体半高
  colliderRadius: number;
  cameraHeight: number;      // 摄像机基础高度
  moveSpeedMultiplier: number;
  canSprint: boolean;
  canJump: boolean;
  recoilReduction: number;   // 后坐力减少百分比
  transitionTime: number;    // 切换动画时间(秒)
}

const STANCE_CONFIGS: Record<Stance, StanceConfig> = {
  standing: {
    colliderHeight: 0.5,
    colliderRadius: 0.3,
    cameraHeight: 1.8,
    moveSpeedMultiplier: 1.0,
    canSprint: true,
    canJump: true,
    recoilReduction: 0,
    transitionTime: 0,
  },
  crouching: {
    colliderHeight: 0.3,
    colliderRadius: 0.3,
    cameraHeight: 1.2,
    moveSpeedMultiplier: 0.72,
    canSprint: true,
    canJump: true,
    recoilReduction: 0.15,
    transitionTime: 0.3,
  },
  prone: {
    colliderHeight: 0.15,
    colliderRadius: 0.3,
    cameraHeight: 0.5,
    moveSpeedMultiplier: 0.25,
    canSprint: false,
    canJump: false,
    recoilReduction: 0.30,
    transitionTime: 0.5,
  },
};
```

**动画需求**：
- crouch-idle（蹲下待机）
- crouch-walk（蹲走）
- prone-idle（趴下待机）
- prone-crawl（匍匐前进）
- stand-to-crouch（站到蹲过渡）
- crouch-to-stand（蹲到站过渡）
- stand-to-prone / crouch-to-prone（趴下过渡）
- prone-to-stand（起身过渡）

> 💡 **阶段一策略**：先用碰撞体高度变化 + 摄像机高度 lerp 来模拟效果，动画后期补充

---

### 2.4 探头系统 (Lean/Peek)

#### 2.4.1 和平精英探头行为

- **Q键**：按住向左探头，松开回正
- **E键**：按住向右探头，松开回正
- 探头角度约 15°~20° 倾斜
- 角色上半身侧倾，头部横向偏移约 0.3~0.5m
- 摄像机跟随角色倾斜
- 可以在探头状态下射击（探头射击是高端操作核心）
- 探头+开镜 = 掩体射击最佳姿态
- 切换速度快（约 0.15s 过渡）

#### 2.4.2 实现方案

```typescript
const LEAN_CONFIG = {
  maxAngle: 18 * (Math.PI / 180),  // 18度倾斜
  headOffset: 0.4,                  // 头部横向偏移(米)
  lerpSpeed: 0.15,                  // 过渡速度
  cameraRollMultiplier: 0.8,        // 摄像机跟随Roll角
};

// 每帧更新
function updateLean(params: {
  leanLeft: boolean;       // Q键状态
  leanRight: boolean;      // E键状态
  currentLean: number;     // -1 到 1 的插值
  delta: number;
}): number {
  const target = params.leanLeft ? -1 : params.leanRight ? 1 : 0;
  return THREE.MathUtils.lerp(params.currentLean, target, params.lerpSpeed);
}
```

**实现要点**：
1. 上半身骨骼（spine）沿Z轴旋转 → 视觉倾斜
2. 摄像机增加横向偏移 + Roll旋转 → 跟随感
3. 射击射线起点跟随偏移后的头部位置
4. 碰撞体不变（简化处理），但子弹命中判定基于偏移后位置

---

### 2.5 自由视角 (Free Look)

#### 2.5.1 和平精英自由视角行为

- **Alt键**按住：解锁摄像机与角色朝向的绑定
- 摄像机可以在 ~±100° 范围内自由旋转观察
- 角色朝向和移动方向**不变**（只转眼不转身）
- 松开 Alt：摄像机平滑回归到角色后方
- 回归速度较快（约 0.3s）
- 自由视角期间不能射击

#### 2.5.2 实现方案

```typescript
const FREE_LOOK_CONFIG = {
  maxYawOffset: 100 * (Math.PI / 180),   // 最大偏航范围 ±100°
  returnLerpSpeed: 0.15,                   // 回归速度
  enabled: false,                          // Alt键状态
};

// 核心逻辑：
// 1. Alt按住时：鼠标移动只影响 cameraYawOffset，不影响 playerYaw
// 2. Alt松开时：cameraYawOffset lerp 到 0
// 3. 渲染时：camera.yaw = playerYaw + cameraYawOffset
```

---

### 2.6 射击系统 (Shooting)

#### 2.6.1 和平精英射击模式

**腰射（Hip Fire）— 不开镜**：
- 鼠标左键射击
- 准星为散开的十字线（扩散圈）
- 子弹有随机扩散，不精确
- 适合近距离遭遇战
- 移动速度不受影响
- 第三人称视角不变

**开镜（ADS）— 瞄准射击**：
- 鼠标右键按住开镜
- 摄像机过渡到贴近角色的瞄准视角
- 准星收缩为精确十字
- 子弹精确度大幅提升
- 移动速度降低 40%
- FOV 缩小（75° → 50°）
- 灵敏度降低（更容易精确瞄准）

**后坐力系统**：
- **垂直后坐力**：枪口持续上扬，需要玩家向下拖动鼠标"压枪"
- **水平后坐力**：枪口左右随机偏移
- 后坐力大小：站立 > 蹲下 > 趴下
- 首发精准，连射扩散递增
- 停止射击后准星逐渐回复

#### 2.6.2 改造设计

```typescript
const SHOOTING_CONFIG = {
  // 射速（发/分钟，以 M416 为参考）
  fireRate: 680,
  fireCooldown: 60 / 680,    // ~0.088s

  // 腰射扩散
  hipFire: {
    baseSpread: 3.0,          // 基础扩散角度（度）
    moveSpreadBonus: 1.5,     // 移动时额外扩散
    maxSpread: 8.0,           // 最大扩散
    recoveryRate: 5.0,        // 扩散恢复速度（度/秒）
  },

  // 开镜精度
  ads: {
    baseSpread: 0.3,
    moveSpreadBonus: 0.8,
    maxSpread: 2.0,
    recoveryRate: 8.0,
  },

  // 后坐力
  recoil: {
    verticalBase: 0.8,       // 每发基础垂直后坐力(度)
    verticalAccumulation: 0.15, // 连射递增
    horizontalRange: [-0.3, 0.3], // 水平随机范围(度)
    recoverySpeed: 3.0,      // 停火后回复速度（度/秒）
    stanceMultiplier: {       // 姿态修饰
      standing: 1.0,
      crouching: 0.85,
      prone: 0.70,
    },
  },

  // 射击音效
  audio: {
    volume: 0.8,
    fireSound: '/sfx/m416-fire.mp3',
    dryFireSound: '/sfx/dry-fire.mp3',
  },
};
```

**关键改动**：
1. ✅ 增加腰射扩散系统（现有系统只有精确射线）
2. ✅ 后坐力从简单骨骼抖动改为**影响摄像机 pitch**（玩家可以压枪）
3. ✅ 增加连射扩散递增
4. ✅ 姿态对后坐力的减益效果
5. ✅ 射击冷却从 100ms 改为基于武器射速

---

### 2.7 准星/HUD (Crosshair)

#### 2.7.1 和平精英准星行为

**腰射准星**：
- 四条短线组成的十字（动态）
- 移动时线条向外扩散
- 射击时线条向外跳动
- 静止时线条收缩
- 中心有小白点（可选）

**开镜准星**：
- 切换为瞄准镜 UI（红点/全息等）
- 本阶段简化为精确十字准星

#### 2.7.2 实现方案

使用 HTML/CSS overlay（不在 3D 空间内），性能最好且最精确：

```typescript
interface CrosshairState {
  spread: number;      // 当前扩散值 (0-1)
  isADS: boolean;      // 是否开镜
  isMoving: boolean;
  isShooting: boolean;
}

// 准星用4个 <div> 表示四条线
// spread 值控制四条线与中心的距离
// 射击时加一个短暂的"弹跳"效果
```

---

## 三、实现阶段规划

### 阶段一：核心操控感（本次交付）

**目标**：让移动和镜头操控"像和平精英"

| 任务 | 优先级 | 预计工作量 |
|------|--------|-----------|
| 1. 项目搭建（基于 TPS-Controls demo 裁剪） | P0 | 🟢 小 |
| 2. 摄像机改造（右肩越肩视角 + 姿态关联） | P0 | 🟡 中 |
| 3. 移动系统改造（速度体系 + Shift冲刺 + 加减速） | P0 | 🟡 中 |
| 4. 姿态系统（蹲/趴 + 碰撞体 + 摄像机高度） | P0 | 🟡 中 |
| 5. 探头系统（Q/E 上半身倾斜 + 摄像机跟随） | P0 | 🟡 中 |
| 6. 按键映射全面对齐和平精英PC端 | P0 | 🟢 小 |

### 阶段二：射击手感

| 任务 | 优先级 | 预计工作量 |
|------|--------|-----------|
| 7. 开镜(ADS)过渡优化 | P0 | 🟡 中 |
| 8. 腰射扩散系统 | P1 | 🟡 中 |
| 9. 后坐力系统（影响摄像机，可压枪） | P1 | 🔴 大 |
| 10. 动态准星 HUD | P1 | 🟡 中 |
| 11. 自由视角（Alt） | P1 | 🟢 小 |

### 阶段三：完善

| 任务 | 优先级 | 预计工作量 |
|------|--------|-----------|
| 12. 多武器切换 (1/2/3) | P2 | 🔴 大 |
| 13. 换弹系统 (R) | P2 | 🟡 中 |
| 14. 射击模式切换 (B) | P2 | 🟢 小 |
| 15. 更丰富的地图/训练场 | P2 | 🟡 中 |
| 16. 第一/第三人称切换 (V) | P2 | 🔴 大 |

---

## 四、TPS-Controls 代码改造计划

### 需要修改的文件

| 文件 | 改动类型 | 内容 |
|------|---------|------|
| `constants.ts` | 大改 | 替换为和平精英速度体系和参数配置 |
| `camera.ts` | 大改 | 越肩偏移、姿态高度、冲刺FOV、自由视角 |
| `physics.ts` | 大改 | 加减速、多姿态速度、方向速度修饰 |
| `movement.ts` | 中改 | 增加姿态动画切换逻辑 |
| `Player.tsx` | 大改 | 增加姿态状态机、探头、按键映射 |
| `shooting.ts` | 大改 | 扩散系统、后坐力影响摄像机 |
| `types.ts` | 中改 | 增加新的类型定义 |

### 需要新增的文件

| 文件 | 内容 |
|------|------|
| `stance.ts` | 姿态状态机模块 |
| `lean.ts` | 探头系统模块 |
| `freeLook.ts` | 自由视角模块 |
| `crosshair.ts` | 准星扩散计算 |
| `recoilSystem.ts` | 完整后坐力系统（替代现有简单 recoil） |
| `Crosshair.tsx` | React 准星 UI 组件 |
| `HUD.tsx` | 弹药/武器/姿态状态显示 |

### 可以保留不变的文件

| 文件 | 原因 |
|------|------|
| `useAnimationSetup.ts` | 动画加载系统足够好，只需增加新动画 |
| `muzzleFlash.ts` | 枪口火焰效果基本可用 |
| `textures.ts` | 程序化纹理可复用 |
| `assetPaths.ts` | 资源路径管理不变 |
| `preload.ts` | 预加载逻辑不变 |

---

## 五、关键参数速查表

### 摄像机参数
| 参数 | 和平精英参考值 | 备注 |
|------|--------------|------|
| TPP 后方距离 | 3.0 | 站立默认 |
| TPP 右偏 | 0.6 | 越肩视角 |
| TPP 高度 | 1.8 | 站立时 |
| ADS 后方距离 | 1.2 | 贴近 |
| ADS FOV | 50° | 红点/全息 |
| 默认 FOV | 75° | |
| 冲刺 FOV | 80° | |
| Pitch 限制 | -60° ~ +75° | |
| 摄像机 lerp | 0.08 | 默认跟随 |

### 移动速度参数
| 参数 | 值 (m/s) | 备注 |
|------|----------|------|
| 站立奔跑 | 4.7 | WASD 默认 |
| 冲刺 | 6.3 | +Shift |
| 蹲行 | 3.4 | |
| 匍匐 | 1.2 | |
| 后退修饰 | ×0.7 | |
| 横移修饰 | ×0.85 | |
| ADS修饰 | ×0.6 | |

---

## 六、约束和注意事项

1. **Web 端帧率**：目标 60fps，所有 lerp 和物理计算需要 delta-time 归一化
2. **鼠标灵敏度**：保留可配置性，默认值 0.002 合理
3. **动画资源**：阶段一使用 TPS-Controls 自带动画，蹲/趴动画需要后续补充
4. **物理引擎**：Rapier 的碰撞体不支持运行时高度变化，需要用删除+重建的方式实现
5. **移动平台部署**：需要继续支持 GitHub Pages 部署

---

*文档版本：v1.0 | 日期：2026-03-29 | 作者：WorkBuddy + 正哥*
