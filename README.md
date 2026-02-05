# 体感小游戏 (Motion Games)

Web端全身互动游戏，基于 MediaPipe 姿态识别技术，让孩子通过肢体动作来玩游戏。

## 项目特点

- **即点即用**：无需安装，浏览器打开即可使用
- **跨平台**：支持手机/iPad/Mac/PC，投屏到电视体验更佳
- **环境自适应**：自动识别孩子站位，动态调整灵敏度
- **安全保护**：15分钟强制休息提醒，保护视力

## 技术栈

| 模块 | 技术方案 |
|------|----------|
| 框架 | Vue 3 + Vite |
| 姿态识别 | @mediapipe/pose |
| 渲染 | Canvas 2D |
| 状态管理 | Pinia |
| 语音 | Web Speech API |
| 音效 | Web Audio API |

## 功能模块

### 一、体感游戏（7 种）

| 游戏 | 说明 |
|------|------|
| 色彩大作战 | 听语音找颜色，用手拍碎对应颜色的气球 |
| 障碍躲避 | 左右移动躲避障碍，深蹲躲过高处障碍 |
| 姿势临摹 | 模仿卡通动物姿势，看谁像 |
| 数字识别 | 识别数字，拍碎正确的数字气球 |
| 有氧拳击 | 左右出拳击打目标，节奏健身 |
| 健身环 | 原地抬腿跑步 + 深蹲挤压攻击敌人 |
| 运动网球 | 用手当球拍，对打接球 |

每种游戏有多档子关卡，星级评价与进度保存。

### 二、核心功能

1. **环境自适应**
   - 镜像模式切换（默认开启）
   - 动态原点计算（以双肩中点为参考）
   - 安全区检测（全身在画面内）
   - EMA 平滑处理（消除骨架跳变）

2. **交互判定**
   - 碰撞检测（手掌/足部与物体）
   - 悬停确认（悬停2秒确认）
   - 姿势匹配（姿势临摹用）

3. **难度与幼童适配**
   - 轻松模式 / 普通模式 / 挑战模式（首页选择）
   - 轻松模式：节奏慢、目标大、不扣生命，适合 4–6 岁
   - 鼓励语与温和错误音效，开场欢迎语与首次成功提示

4. **趣味与反馈**
   - 连击显示与连击鼓励语
   - 趣味道具（时间减速、保护罩、双倍积分、额外生命等）
   - 骨骼显示开关（游戏内可切换是否显示骨架）

### 三、UI 与流程

1. **首页**
   - 难度选择、开始游戏、鼠标体验入口
   - 用户 / 统计 / 设置（镜像、性能）

2. **用户与进度**
   - 用户名登录或匿名游玩；匿名不保存进度
   - 按用户保存关卡星级与游戏历史
   - 统计面板：总场次、正确/错误、连击、游戏时长等

3. **站位与引导**
   - 人形虚线框站位引导
   - 手势教程（可跳过）
   - 关卡选择（按游戏类型 → 子关卡）

4. **游戏中**
   - 暂停按钮 → 暂停菜单（继续 / 重新开始 / 设置 / 退出）
   - 设置：镜像、性能模式、自定义颜色单词
   - 休息提醒（约 15 分钟）

### 四、家长控制

- 运动计时与 15 分钟休息提醒
- 关卡自定义（修改颜色单词）
- 性能模式（高/低）
- 无摄像头时可使用鼠标体验模式

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 目录结构

```
motion_games/
├── src/
│   ├── components/          # 组件
│   │   ├── WelcomeScreen.vue      # 首页（难度、用户、统计、设置）
│   │   ├── PositionGuide.vue      # 站位引导
│   │   ├── GestureTutorial.vue    # 手势教程
│   │   ├── LevelSelect.vue       # 游戏与关卡选择
│   │   ├── GameContainer.vue      # 游戏容器（暂停、骨骼开关、鼓励等）
│   │   ├── PauseMenu.vue          # 暂停菜单（继续/重开/设置/退出）
│   │   ├── GameOver.vue           # 游戏结束（星级、下一关/选关/首页）
│   │   ├── BreakReminder.vue      # 休息提醒
│   │   ├── UserProfile.vue        # 用户与历史记录
│   │   ├── StatisticsPanel.vue    # 统计面板
│   │   ├── EncouragementToast.vue # 鼓励语浮层
│   │   ├── PowerUpDisplay.vue     # 道具显示
│   │   └── MouseExperience.vue    # 鼠标体验模式
│   ├── composables/
│   │   ├── usePoseDetection.js    # 姿态检测
│   │   ├── useCollisionDetection.js  # 碰撞检测
│   │   ├── useParticles.js        # 粒子特效
│   │   ├── useSpeech.js           # 语音/音效
│   │   └── useSkeletonDraw.js     # 骨骼绘制
│   ├── levels/              # 关卡
│   │   ├── ColorBattleLevel.vue   # 色彩大作战
│   │   ├── ObstacleDodgeLevel.vue # 障碍躲避
│   │   ├── PoseMimicryLevel.vue   # 姿势临摹
│   │   ├── NumberRecognitionLevel.vue # 数字识别
│   │   ├── FitnessBoxingLevel.vue # 有氧拳击
│   │   ├── RingFitLevel.vue       # 健身环
│   │   └── SportsTennisLevel.vue   # 运动网球
│   ├── config/
│   │   ├── levelConfig.js         # 关卡与难度配置
│   │   └── achievements.js        # 成就配置
│   ├── stores/
│   │   └── game.js
│   ├── utils/
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 核心算法

### 自适应坐标映射

```javascript
function getAdaptiveMapping(landmarks, canvasWidth, canvasHeight) {
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]

  // 双肩中点（参考原点）
  const centerX = (leftShoulder.x + rightShoulder.x) / 2
  const centerY = (leftShoulder.y + rightShoulder.y) / 2

  // 肩宽作为缩放基准
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
  const standardShoulderRatio = 0.2
  const scale = shoulderWidth / standardShoulderRatio

  return { origin: { x: centerX, y: centerY }, scale }
}
```

### EMA 平滑处理

```javascript
function smoothLandmarks(newLandmarks, alpha = 0.3) {
  if (!previousLandmarks) return newLandmarks

  return newLandmarks.map((landmark, i) => ({
    x: previousLandmarks[i].x + alpha * (landmark.x - previousLandmarks[i].x),
    y: previousLandmarks[i].y + alpha * (landmark.y - previousLandmarks[i].y),
    // ...
  }))
}
```

## 浏览器兼容性

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- 需要支持 HTTPS 访问摄像头

## 已实现与未来扩展

- [x] 关卡二：障碍躲避
- [x] 关卡三：姿势临摹
- [x] 关卡四：数字识别
- [x] 有氧拳击、健身环、运动网球
- [x] 难度模式（轻松/普通/挑战）
- [x] 用户与进度、统计面板、成就
- [x] 鼓励语、趣味道具、连击、骨骼显示
- [x] 暂停菜单（继续/重开/设置/退出）
- [ ] 多人对战模式
- [ ] 自定义关卡编辑器

## License

MIT
