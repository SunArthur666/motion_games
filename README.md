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

### 一、核心功能

1. **环境自适应**
   - 镜像模式切换（默认开启）
   - 动态原点计算（以双肩中点为参考）
   - 安全区检测（全身在画面内）
   - EMA 平滑处理（消除骨架跳变）

2. **交互判定**
   - 碰撞检测（手掌/足部与物体）
   - 悬停确认（悬停2秒确认）
   - 姿势匹配（关卡三用）

3. **关卡设计**
   - 关卡一：色彩大作战（MVP）
   - 关卡二：障碍躲避（全身运动）
   - 关卡三：姿势临摹（趣味挑战）

### 二、UI 功能

1. **站位引导**
   - 人形虚线框引导
   - 实时检测反馈
   - 进度条显示

2. **无感UI**
   - 大按钮设计（肢体触发）
   - 投屏优化模式
   - 低功耗设置

### 三、家长控制

- 运动计时（15分钟强制休息）
- 关卡自定义（修改颜色单词）
- 性能模式调节

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
│   │   ├── PositionGuide.vue      # 站位引导
│   │   ├── GameContainer.vue      # 游戏容器
│   │   ├── PauseMenu.vue          # 暂停菜单
│   │   └── BreakReminder.vue      # 休息提醒
│   ├── composables/         # 组合式函数
│   │   ├── usePoseDetection.js    # 姿态检测
│   │   ├── useCollisionDetection.js  # 碰撞检测
│   │   ├── useParticles.js        # 粒子特效
│   │   └── useSpeech.js           # 语音音效
│   ├── levels/              # 关卡
│   │   └── ColorBattleLevel.vue   # 色彩大作战
│   ├── stores/              # 状态管理
│   │   └── game.js
│   ├── utils/               # 工具函数
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

## 未来扩展

- [x] 关卡二：障碍躲避
- [x] 关卡三：姿势临摹
- [ ] 多人对战模式
- [x] 成就系统
- [x] 数据统计面板
- [ ] 自定义关卡编辑器

## License

MIT
