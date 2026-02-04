<template>
  <div class="game-container">
    <!-- 隐藏的视频元素 -->
    <video
      ref="videoElement"
      class="hidden-video"
      autoplay
      playsinline
      muted
    ></video>

    <!-- 主游戏画布 -->
    <canvas ref="gameCanvas" class="game-canvas"></canvas>

    <!-- UI 覆盖层 -->
    <div class="game-ui">
      <!-- 顶部信息栏 -->
      <div class="top-bar">
        <div class="score-display">
          <span class="label">得分</span>
          <span class="value">{{ gameStore.score }}</span>
        </div>

        <div class="level-display">
          <span class="label">关卡</span>
          <span class="value">{{ levelName }}</span>
        </div>

        <div class="lives-display">
          <span class="label">生命</span>
          <span v-for="i in gameStore.lives" :key="i" class="heart">❤️</span>
        </div>

        <div class="timer-display">
          <span class="label">时间</span>
          <span class="value">{{ formatTime(playTime) }}</span>
        </div>

        <!-- FPS显示（开发模式） -->
        <div v-if="import.meta.env.DEV" class="fps-display">
          <span class="label">FPS</span>
          <span class="value" :class="{ 'fps-low': fps < 30, 'fps-good': fps >= 50 }">
            {{ fps }}
          </span>
        </div>

        <!-- 暂停按钮 -->
        <div class="pause-btn" @click="togglePause">
          {{ gameStore.isPaused ? '▶️' : '⏸️' }}
        </div>
      </div>

      <!-- 安全区警告 -->
      <transition name="slide">
        <div v-if="!gameStore.safetyZone.isInFrame" class="zone-warning">
          <span class="warning-icon">⚠️</span>
          <span>请回到画面内</span>
        </div>
      </transition>

      <!-- 当前关卡目标提示（仅关卡一显示） -->
      <div v-if="gameStore.currentLevel === 1" class="target-prompt">
        <transition name="fade" mode="out-in">
          <div :key="currentPrompt" class="prompt-text">
            {{ currentPrompt }}
          </div>
        </transition>
      </div>

      <!-- 关卡提示（仅关卡二、三显示） -->
      <div v-if="gameStore.currentLevel === 2" class="level-hint">
        左右移动躲避障碍，深蹲躲过高处障碍！
      </div>
      <div v-if="gameStore.currentLevel === 3" class="level-hint">
        模仿左侧姿势，保持75%以上匹配度！
      </div>
    </div>

    <!-- 关卡组件 -->
    <ColorBattleLevel
      v-if="gameStore.currentLevel === 1"
      :landmarks="currentLandmarks"
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      :game-type="gameStore.currentLevel"
      :sub-level="gameStore.currentSubLevel"
      @collision="handleCollision"
      @prompt="handlePrompt"
      @level-complete="handleLevelComplete"
      @encouragement="handleEncouragement"
      @powerup="handlePowerUp"
    />

    <ObstacleDodgeLevel
      v-if="gameStore.currentLevel === 2"
      :landmarks="currentLandmarks"
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      @collision="handleCollision"
    />

    <PoseMimicryLevel
      v-if="gameStore.currentLevel === 3"
      :landmarks="currentLandmarks"
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      @collision="handleCollision"
    />

    <!-- 粒子画布 -->
    <canvas ref="particleCanvas" class="particle-canvas"></canvas>

    <!-- 连击显示 -->
    <transition name="streak">
      <div v-if="gameStore.streak >= 3" class="streak-display">
        <span class="streak-icon">🔥</span>
        <span class="streak-count">{{ gameStore.streak }}</span>
        <span class="streak-text">连击!</span>
      </div>
    </transition>

    <!-- 鼓励反馈 -->
    <EncouragementToast
      ref="encouragementToast"
      :message="encouragementMessage"
      :type="encouragementType"
      :streak="gameStore.streak"
    />

    <!-- 道具显示 -->
    <PowerUpDisplay />

    <!-- 难度提示（轻松模式时显示） -->
    <div v-if="gameStore.userDifficulty === 'easy'" class="easy-mode-hint">
      <span>🌟 轻松模式</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePoseDetection } from '@/composables/usePoseDetection'
import { useParticles } from '@/composables/useParticles'
import { useGameStore } from '@/stores/game'
import { trackEvent } from '@/utils/analytics'
import { getLevelConfig } from '@/config/levelConfig'
import ColorBattleLevel from '@/levels/ColorBattleLevel.vue'
import EncouragementToast from '@/components/EncouragementToast.vue'
import PowerUpDisplay from '@/components/PowerUpDisplay.vue'
import ObstacleDodgeLevel from '@/levels/ObstacleDodgeLevel.vue'
import PoseMimicryLevel from '@/levels/PoseMimicryLevel.vue'

const emit = defineEmits(['game-over'])

const gameStore = useGameStore()

const videoElement = ref(null)
const gameCanvas = ref(null)
const particleCanvas = ref(null)

const currentLandmarks = ref(null)
const canvasWidth = ref(1280)
const canvasHeight = ref(720)
const playTime = ref(0)
const currentPrompt = ref('准备好了吗？')

// 性能监控
const fps = ref(0)
const frameCount = ref(0)
let lastFpsUpdate = performance.now()
let frameTimes = []

// 鼓励反馈
const encouragementToast = ref(null)
const encouragementMessage = ref('')
const encouragementType = ref('correct')

// 关卡名称（从配置中获取）
const levelName = computed(() => {
  const config = getLevelConfig(gameStore.currentLevel, gameStore.currentSubLevel)
  return config?.name || '关卡'
})

// 粒子系统
const {
  createBalloonPop,
  createCoinCollect,
  createGhostTrail,
  startAnimation,
  clear
} = useParticles(particleCanvas)

// 初始化姿态检测
const { initialize, stop } = usePoseDetection(videoElement, handlePoseResults)

// 上一次的 landmarks（用于计算运动强度）
let previousLandmarks = null
let ghostTrailCounter = 0

// 格式化时间
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 处理姿态检测结果
function handlePoseResults({ landmarks, image }) {
  // 性能监控：记录帧时间
  const frameStart = performance.now()
  
  currentLandmarks.value = landmarks

  if (!gameCanvas.value) return

  const ctx = gameCanvas.value.getContext('2d')
  const { width, height } = gameCanvas.value

  // 绘制视频背景
  ctx.save()
  if (gameStore.isMirrored) {
    ctx.scale(-1, 1)
    ctx.drawImage(image, -width, 0, width, height)
  } else {
    ctx.drawImage(image, 0, 0, width, height)
  }
  ctx.restore()

  // 添加暗色遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, width, height)

  // 计算运动强度并创建肢体轨迹
  // 优化：减少不必要的计算
  if (previousLandmarks && landmarks && landmarks.length > 16) {
    let totalMovement = 0

    // 计算手腕的运动量（使用平方距离，避免开方）
    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    const prevLeftWrist = previousLandmarks[15]
    const prevRightWrist = previousLandmarks[16]

    if (leftWrist && prevLeftWrist && leftWrist.visibility > 0.3) {
      const dx = leftWrist.x - prevLeftWrist.x
      const dy = leftWrist.y - prevLeftWrist.y
      totalMovement += dx * dx + dy * dy // 使用平方距离
    }

    if (rightWrist && prevRightWrist && rightWrist.visibility > 0.3) {
      const dx = rightWrist.x - prevRightWrist.x
      const dy = rightWrist.y - prevRightWrist.y
      totalMovement += dx * dx + dy * dy
    }

    // 运动强度超过阈值时创建轨迹（阈值也使用平方值）
    if (totalMovement > 0.0225) { // 0.15^2
      ghostTrailCounter++
      // 每5帧创建一次轨迹，避免过于频繁
      if (ghostTrailCounter % 5 === 0) {
        createGhostTrail(landmarks, Math.sqrt(totalMovement))
      }
    }
  }

  // 优化：只在需要时深拷贝
  if (landmarks) {
    if (!previousLandmarks) {
      previousLandmarks = landmarks.map(lm => ({ ...lm }))
    } else {
      // 直接更新，避免创建新数组
      for (let i = 0; i < landmarks.length && i < previousLandmarks.length; i++) {
        previousLandmarks[i].x = landmarks[i].x
        previousLandmarks[i].y = landmarks[i].y
        previousLandmarks[i].z = landmarks[i].z
        previousLandmarks[i].visibility = landmarks[i].visibility
      }
    }
  }

  // 性能监控：更新FPS
  const frameTime = performance.now() - frameStart
  frameTimes.push(frameTime)
  if (frameTimes.length > 60) {
    frameTimes.shift() // 只保留最近60帧
  }
  
  frameCount.value++
  const now = performance.now()
  if (now - lastFpsUpdate >= 1000) {
    // 计算平均FPS
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    fps.value = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0
    lastFpsUpdate = now
  }
}

// 处理碰撞事件
function handleCollision(event) {
  const { type, data } = event

  switch (type) {
    case 'balloon-pop':
      createBalloonPop(data.x, data.y, data.color)
      gameStore.addScore(data.points)
      break
    case 'coin-collect':
      createCoinCollect(data.x, data.y)
      gameStore.addScore(data.points)
      break
    case 'wrong-color':
      gameStore.loseLife()
      break
    case 'hit':
      gameStore.loseLife()
      break
    case 'game-over':
      // 显示游戏结束界面
      handleGameOver(data.score)
      break
    case 'game-complete':
      // 关卡三完成
      handleGameComplete(data)
      break
  }
}

// 处理提示更新（关卡一）
function handlePrompt(prompt) {
  currentPrompt.value = prompt
}

// 处理鼓励反馈
function handleEncouragement(event) {
  const { type, message, streak } = event
  encouragementMessage.value = message
  encouragementType.value = type
  
  if (encouragementToast.value) {
    encouragementToast.value.show()
  }
}

// 处理道具事件
function handlePowerUp(event) {
  const { type, powerUp } = event
  
  if (type === 'collect') {
    // 道具收集特效
    createCoinCollect(
      canvasWidth.value / 2,
      canvasHeight.value / 2
    )
  }
}

// 游戏结束
function handleGameOver(score) {
  gameStore.endGame()

  // 追踪游戏结束事件
  trackEvent('game_over', {
    level: gameStore.currentLevel,
    score,
    time: playTime.value,
    reason: 'lives_depleted'
  })

  // 发送游戏结束事件
  emit('game-over', {
    score,
    time: playTime.value,
    level: gameStore.currentLevel,
    success: false
  })
}

// 关卡完成
function handleLevelComplete(data) {
  const { stars, result, levelConfig } = data
  gameStore.endGame()

  // 追踪关卡完成事件
  trackEvent('level_complete', {
    gameType: gameStore.currentLevel,
    subLevel: gameStore.currentSubLevel,
    stars,
    score: result.score,
    time: result.time,
    accuracy: result.accuracy
  })

  // 计算成就
  const achievements = []
  if (stars === 3) {
    achievements.push({ id: 'perfect', icon: '⭐', name: '完美通关' })
  }
  if (result.accuracy >= 0.9) {
    achievements.push({ id: 'accurate', icon: '🎯', name: '精准大师' })
  }
  if (result.score > 5000) {
    achievements.push({ id: 'high_score', icon: '🏆', name: '高分玩家' })
  }

  // 发送关卡完成事件
  emit('game-over', {
    score: result.score,
    completed: result.completed,
    total: result.total,
    time: result.time,
    level: gameStore.currentLevel,
    subLevel: gameStore.currentSubLevel,
    stars,
    success: true,
    achievements,
    levelConfig
  })
}

// 游戏完成（兼容旧代码）
function handleGameComplete(data) {
  const { score, completed, total } = data
  gameStore.endGame()

  // 追踪游戏完成事件
  trackEvent('game_complete', {
    level: gameStore.currentLevel,
    score,
    completed,
    total,
    time: playTime.value
  })

  // 计算成就
  const achievements = []
  if (completed === total) {
    achievements.push({ id: 'perfect', icon: '⭐', name: '完美通关' })
  }
  if (score > 1000) {
    achievements.push({ id: 'high_score', icon: '🏆', name: '高分玩家' })
  }

  // 发送游戏完成事件
  emit('game-over', {
    score,
    completed,
    total,
    time: playTime.value,
    level: gameStore.currentLevel,
    success: true,
    achievements
  })
}

// 切换暂停
function togglePause() {
  if (gameStore.isPaused) {
    gameStore.resumeGame()
  } else {
    gameStore.pauseGame()
  }
}

// 游戏计时器
let timerInterval = null

function startTimer() {
  timerInterval = setInterval(() => {
    if (!gameStore.isPaused && gameStore.isPlaying) {
      playTime.value++
    }
  }, 1000)
}

// 初始化
onMounted(async () => {
  // 设置画布尺寸
  if (gameCanvas.value) {
    gameCanvas.value.width = canvasWidth.value
    gameCanvas.value.height = canvasHeight.value
  }

  if (particleCanvas.value) {
    particleCanvas.value.width = canvasWidth.value
    particleCanvas.value.height = canvasHeight.value
  }

  // 初始化姿态检测
  await initialize()

  // 启动粒子动画
  startAnimation()

  // 启动计时器
  startTimer()

  // 根据关卡设置初始提示
  const levelHints = [
    '找到红色！',
    '躲避障碍！',
    '模仿姿势！'
  ]
  currentPrompt.value = levelHints[gameStore.currentLevel - 1]
})

onUnmounted(() => {
  stop()
  clear()
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
  overflow: hidden;
}

.hidden-video {
  display: none;
}

.game-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.top-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
}

.score-display,
.level-display,
.lives-display,
.timer-display,
.fps-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
}

.fps-display .fps-low {
  color: #ff6b6b;
}

.fps-display .fps-good {
  color: #6bcb77;
}

.label {
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 5px;
}

.value {
  font-size: 32px;
  font-weight: bold;
}

.heart {
  font-size: 24px;
  margin: 0 2px;
}

.pause-btn {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s;
}

.pause-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.zone-warning {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(239, 68, 68, 0.9);
  padding: 20px 40px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: #fff;
  font-size: 24px;
}

.target-prompt {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.prompt-text {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 20px rgba(100, 200, 255, 0.8);
  background: rgba(0, 0, 0, 0.5);
  padding: 20px 50px;
  border-radius: 20px;
}

.level-hint {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 15px 30px;
  border-radius: 15px;
  text-align: center;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translate(-50%, -50%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 连击显示 */
.streak-display {
  position: fixed;
  top: 150px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.9), rgba(255, 100, 0, 0.9));
  border-radius: 20px;
  color: #fff;
  z-index: 1500;
  box-shadow: 0 5px 20px rgba(255, 165, 0, 0.5);
}

.streak-icon {
  font-size: 32px;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

.streak-count {
  font-size: 36px;
  font-weight: bold;
}

.streak-text {
  font-size: 18px;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.2); }
}

.streak-enter-active {
  animation: streakIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.streak-leave-active {
  animation: streakOut 0.3s ease-in;
}

@keyframes streakIn {
  from {
    transform: translateX(-100px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes streakOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100px);
    opacity: 0;
  }
}

/* 轻松模式提示 */
.easy-mode-hint {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px 20px;
  background: rgba(74, 222, 128, 0.8);
  border-radius: 15px;
  color: #fff;
  font-size: 14px;
  z-index: 1000;
}

.easy-mode-hint span {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
