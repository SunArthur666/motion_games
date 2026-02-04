<template>
  <div class="mouse-experience">
    <div class="experience-header">
      <h1>🖱️ 鼠标体验模式</h1>
      <p>没有摄像头？用鼠标也能体验！</p>
      <button @click="goBack" class="back-btn">← 返回</button>
    </div>

    <!-- 游戏区域 -->
    <div class="game-area" ref="gameArea">
      <canvas ref="canvas" @mousemove="handleMouseMove" @click="handleClick"></canvas>

      <!-- 虚拟手掌 -->
      <div
        class="virtual-hand"
        :style="{ left: handPosition.x + 'px', top: handPosition.y + 'px' }"
      >
        <span class="hand-emoji">👆</span>
        <div class="click-effect" :class="{ clicking: isClicking }"></div>
      </div>

      <!-- UI -->
      <div class="game-ui">
        <div class="score-display">
          <span class="label">得分</span>
          <span class="value">{{ score }}</span>
        </div>

        <div class="target-display">
          <span class="label">目标</span>
          <span class="value" :style="{ color: COLORS[targetColor].hex }">
            {{ COLORS[targetColor].name }}
          </span>
        </div>

        <div class="streak-display">
          <span class="label">连击</span>
          <span class="value">{{ streak }}/5</span>
        </div>

        <!-- 进度条 -->
        <div class="streak-bar">
          <div class="streak-fill" :style="{ width: (streak / 5) * 100 + '%' }"></div>
        </div>

        <!-- 狂欢模式提示 -->
        <div v-if="isFrenzyMode" class="frenzy-notice">
          🎉 狂欢时间！收集金币！
        </div>
      </div>
    </div>

    <!-- 游戏结束 -->
    <transition name="fade">
      <div v-if="gameOver" class="game-over-modal">
        <div class="modal-content">
          <h2>体验结束</h2>
          <div class="final-score">
            <span>最终得分</span>
            <span class="score-value">{{ score }}</span>
          </div>
          <div class="actions">
            <button @click="restart" class="action-btn primary">
              🔄 再玩一次
            </button>
            <button @click="goBack" class="action-btn">
              🏠 返回首页
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 教程提示 -->
    <transition name="fade">
      <div v-if="showTutorial" class="tutorial-overlay" @click="startGame">
        <div class="tutorial-content" @click.stop>
          <h2>如何玩</h2>
          <div class="tutorial-steps">
            <div class="step">
              <span class="step-icon">🖱️</span>
              <span>移动鼠标控制手掌位置</span>
            </div>
            <div class="step">
              <span class="step-icon">👆</span>
              <span>点击鼠标点破气球</span>
            </div>
            <div class="step">
              <span class="step-icon">🎯</span>
              <span>只点目标颜色的气球</span>
            </div>
            <div class="step">
              <span class="step-icon">🔥</span>
              <span>连击5次进入狂欢模式</span>
            </div>
          </div>
          <button @click="startGame" class="start-btn">开始体验</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['back'])

const canvas = ref(null)
const gameArea = ref(null)

// 游戏状态
const score = ref(0)
const streak = ref(0)
const targetColor = ref('red')
const isFrenzyMode = ref(false)
const gameOver = ref(false)
const showTutorial = ref(true)

// 手掌位置（鼠标）
const handPosition = ref({ x: 0, y: 0 })
const isClicking = ref(false)

// 气球和金币
const balloons = ref([])
const coins = ref([])

// 颜色配置
const COLORS = {
  red: { name: '红色', hex: '#ff6b6b' },
  blue: { name: '蓝色', hex: '#4d96ff' },
  green: { name: '绿色', hex: '#6bcb77' },
  yellow: { name: '黄色', hex: '#ffd93d' }
}

const BALLOON_COLORS = Object.keys(COLORS)

// 游戏循环
let gameLoop = null
let spawnInterval = null
let frenzyTimeout = null

// 游戏配置
const SPAWN_RATE = 1500 // 气球生成间隔
const BALLOON_SPEED = 2
const COLLISION_RADIUS = 50

onMounted(() => {
  if (canvas.value && gameArea.value) {
    canvas.value.width = gameArea.value.clientWidth
    canvas.value.height = gameArea.value.clientHeight

    // 初始化手位置在中心
    handPosition.value = {
      x: canvas.value.width / 2,
      y: canvas.value.height / 2
    }
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopGame()
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  if (canvas.value && gameArea.value) {
    canvas.value.width = gameArea.value.clientWidth
    canvas.value.height = gameArea.value.clientHeight
  }
}

function handleMouseMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  handPosition.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function handleClick(e) {
  if (gameOver.value || showTutorial.value) return

  isClicking.value = true
  setTimeout(() => isClicking.value = false, 100)

  // 检测点击碰撞
  checkClickCollisions()

  // 创建点击效果
  createClickEffect(handPosition.value.x, handPosition.value.y)
}

function checkClickCollisions() {
  for (let i = balloons.value.length - 1; i >= 0; i--) {
    const balloon = balloons.value[i]
    const dist = Math.sqrt(
      (handPosition.value.x - balloon.x) ** 2 +
      (handPosition.value.y - balloon.y) ** 2
    )

    if (dist < balloon.radius + COLLISION_RADIUS) {
      // 击中气球
      popBalloon(i)
      break // 一次只点一个
    }
  }

  // 狂欢模式检测金币
  if (isFrenzyMode.value) {
    for (let i = coins.value.length - 1; i >= 0; i--) {
      const coin = coins.value[i]
      const dist = Math.sqrt(
        (handPosition.value.x - coin.x) ** 2 +
        (handPosition.value.y - coin.y) ** 2
      )

      if (dist < coin.size + COLLISION_RADIUS) {
        collectCoin(i)
      }
    }
  }
}

function popBalloon(index) {
  const balloon = balloons.value[index]
  balloons.value.splice(index, 1)

  const isTarget = balloon.color === targetColor.value

  if (isFrenzyMode.value || isTarget) {
    // 正确
    streak.value++
    score.value += isFrenzyMode.value ? 50 : 100

    playPopSound(balloon.x, balloon.y, COLORS[balloon.color].hex)

    if (!isFrenzyMode.value && streak.value >= 5) {
      startFrenzyMode()
    } else if (!isFrenzyMode.value) {
      selectNewColor()
    }
  } else {
    // 错误
    streak.value = 0
    playErrorSound()
  }
}

function collectCoin(index) {
  const coin = coins.value[index]
  coins.value.splice(index, 1)
  score.value += 50
  playCoinSound(coin.x, coin.y)
}

function selectNewColor() {
  const colors = BALLOON_COLORS.filter(c => c !== targetColor.value)
  targetColor.value = colors[Math.floor(Math.random() * colors.length)]
}

function startFrenzyMode() {
  isFrenzyMode.value = true
  balloons.value = [] // 清除气球

  // 生成金币
  for (let i = 0; i < 20; i++) {
    setTimeout(() => spawnCoin(), i * 100)
  }

  frenzyTimeout = setTimeout(() => {
    endFrenzyMode()
  }, 8000)
}

function endFrenzyMode() {
  isFrenzyMode.value = false
  streak.value = 0
  coins.value = []
  selectNewColor()
}

function spawnBalloon() {
  if (gameOver.value || isFrenzyMode.value) return

  const colorKeys = BALLOON_COLORS
  const color = colorKeys[Math.floor(Math.random() * colorKeys.length)]
  const radius = 40 + Math.random() * 25

  balloons.value.push({
    x: radius + Math.random() * (canvas.value.width - radius * 2),
    y: canvas.value.height + radius,
    radius,
    color,
    speed: BALLOON_SPEED + Math.random() * 2,
    wobble: Math.random() * Math.PI * 2
  })
}

function spawnCoin() {
  const size = 25
  coins.value.push({
    x: size + Math.random() * (canvas.value.width - size * 2),
    y: -size,
    size,
    speed: 3 + Math.random() * 2
  })
}

function startGame() {
  showTutorial.value = false
  gameOver.value = false
  score.value = 0
  streak.value = 0
  balloons.value = []
  coins.value = []
  targetColor.value = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]

  // 开始生成气球
  spawnInterval = setInterval(spawnBalloon, SPAWN_RATE)

  // 开始游戏循环
  gameLoop = requestAnimationFrame(update)
}

function stopGame() {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  if (spawnInterval) {
    clearInterval(spawnInterval)
  }
  if (frenzyTimeout) {
    clearTimeout(frenzyTimeout)
  }
}

function update() {
  if (!canvas.value || gameOver.value) return

  const ctx = canvas.value.getContext('2d')
  const { width, height } = canvas.value

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  // 绘制背景
  ctx.fillStyle = 'rgba(10, 10, 26, 0.95)'
  ctx.fillRect(0, 0, width, height)

  // 更新和绘制气球
  for (let i = balloons.value.length - 1; i >= 0; i--) {
    const balloon = balloons.value[i]
    balloon.y -= balloon.speed
    balloon.wobble += 0.02

    const wobbleX = Math.sin(balloon.wobble) * 15
    drawBalloon(ctx, balloon.x + wobbleX, balloon.y, balloon.radius, COLORS[balloon.color].hex)

    // 飞出屏幕
    if (balloon.y + balloon.radius < 0) {
      balloons.value.splice(i, 1)
      if (!isFrenzyMode.value) {
        streak.value = 0
      }
    }
  }

  // 更新和绘制金币
  for (let i = coins.value.length - 1; i >= 0; i--) {
    const coin = coins.value[i]
    coin.y += coin.speed
    drawCoin(ctx, coin.x, coin.y, coin.size)

    if (coin.y > height + coin.size) {
      coins.value.splice(i, 1)
    }
  }

  // 绘制点击效果
  drawClickEffects(ctx)

  gameLoop = requestAnimationFrame(update)
}

// 点击效果数组
const clickEffects = ref([])

function createClickEffect(x, y) {
  clickEffects.value.push({
    x, y,
    radius: 10,
    alpha: 1
  })
}

function drawClickEffects(ctx) {
  for (let i = clickEffects.value.length - 1; i >= 0; i--) {
    const effect = clickEffects.value[i]
    effect.radius += 3
    effect.alpha -= 0.05

    if (effect.alpha <= 0) {
      clickEffects.value.splice(i, 1)
      continue
    }

    ctx.beginPath()
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(100, 200, 255, ${effect.alpha})`
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

function drawBalloon(ctx, x, y, radius, color) {
  // 气球主体
  const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius)
  gradient.addColorStop(0, lightenColor(color, 30))
  gradient.addColorStop(0.7, color)
  gradient.addColorStop(1, darkenColor(color, 20))

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // 高光
  ctx.beginPath()
  ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.fill()

  // 气球结
  ctx.beginPath()
  ctx.moveTo(x - 8, y + radius - 5)
  ctx.lineTo(x, y + radius + 10)
  ctx.lineTo(x + 8, y + radius - 5)
  ctx.fillStyle = color
  ctx.fill()
}

function drawCoin(ctx, x, y, size) {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
  gradient.addColorStop(0, '#fffacd')
  gradient.addColorStop(0.5, '#ffd700')
  gradient.addColorStop(1, '#daa520')

  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#b8860b'
  ctx.font = `bold ${size}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', 0, 0)
  ctx.restore()
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min((num >> 16) + amt, 255)
  const G = Math.min((num >> 8 & 0x00FF) + amt, 255)
  const B = Math.min((num & 0x0000FF) + amt, 255)
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)
}

function darkenColor(color, percent) {
  return lightenColor(color, -percent)
}

// 音效
function playPopSound(x, y, color) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

function playCoinSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.1)

  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}

function playErrorSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
  oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.2)

  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}

function restart() {
  gameOver.value = false
  startGame()
}

function goBack() {
  emit('back')
}
</script>

<style scoped>
.mouse-experience {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  overflow: hidden;
}

.experience-header {
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.3);
}

.experience-header h1 {
  font-size: 28px;
  color: #fff;
  margin: 0;
}

.experience-header p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.back-btn {
  margin-left: auto;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #64c8ff;
}

.game-area {
  position: relative;
  width: calc(100% - 40px);
  height: calc(100% - 120px);
  margin: 20px;
  border-radius: 20px;
  overflow: hidden;
  background: #0a0a1a;
}

.game-area canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.virtual-hand {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.hand-emoji {
  font-size: 40px;
  display: block;
  filter: drop-shadow(0 0 10px rgba(100, 200, 255, 0.5));
}

.click-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(100, 200, 255, 0.5);
  opacity: 0;
  transition: all 0.1s;
}

.click-effect.clicking {
  opacity: 1;
  width: 80px;
  height: 80px;
}

.game-ui {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  gap: 20px;
  pointer-events: none;
}

.score-display,
.target-display,
.streak-display {
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 5px;
}

.value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.streak-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.streak-fill {
  height: 100%;
  background: linear-gradient(90deg, #64c8ff, #4ade80);
  transition: width 0.3s;
}

.frenzy-notice {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: bold;
  color: #ffd93d;
  text-shadow: 0 0 20px rgba(255, 217, 61, 0.8);
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
}

.game-over-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 30px;
  padding: 50px;
  text-align: center;
  border: 2px solid rgba(100, 200, 255, 0.2);
}

.modal-content h2 {
  font-size: 36px;
  color: #fff;
  margin-bottom: 30px;
}

.final-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.final-score span:first-child {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.score-value {
  font-size: 64px;
  font-weight: bold;
  color: #4ade80;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-btn {
  padding: 15px 30px;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #64c8ff;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  border: none;
  color: #000;
}

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.tutorial-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 30px;
  padding: 40px;
  max-width: 500px;
  text-align: center;
  border: 2px solid rgba(100, 200, 255, 0.2);
}

.tutorial-content h2 {
  font-size: 32px;
  color: #fff;
  margin-bottom: 30px;
}

.tutorial-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  text-align: left;
}

.step {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #fff;
  font-size: 18px;
}

.step-icon {
  font-size: 32px;
}

.start-btn {
  padding: 15px 50px;
  font-size: 20px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
