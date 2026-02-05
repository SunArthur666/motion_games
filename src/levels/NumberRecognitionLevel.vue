<template>
  <div class="number-recognition-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
    
    <!-- 数字提示 -->
    <div class="number-prompt">
      <div class="target-number">{{ targetNumber }}</div>
      <div class="prompt-text">用手触碰数字 {{ targetNumber }} 的气球！</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCollisionDetection } from '@/composables/useCollisionDetection'
import { useSpeech } from '@/composables/useSpeech'
import { useGameStore } from '@/stores/game'
import { getLevelConfig, applyDifficultyAdjustments } from '@/config/levelConfig'

const props = defineProps({
  landmarks: { type: Array, default: null },
  canvasWidth: Number,
  canvasHeight: Number,
  gameType: { type: Number, default: 4 },
  subLevel: { type: Number, default: 1 }
})

const emit = defineEmits(['collision', 'prompt', 'level-complete', 'level-started', 'encouragement'])

const gameStore = useGameStore()
const levelCanvas = ref(null)
const { checkCollisions } = useCollisionDetection()
const { playSound } = useSpeech()

// 获取关卡配置
const levelConfig = computed(() => {
  const baseConfig = getLevelConfig(props.gameType, props.subLevel)
  if (!baseConfig) return null
  return applyDifficultyAdjustments(baseConfig, gameStore.userDifficulty)
})

const gameConfig = computed(() => {
  return levelConfig.value?.config || {
    spawnInterval: 2000,
    balloonSpeed: 2,
    balloonRadius: [40, 50],
    numbers: [1, 2, 3, 4, 5],
    targetCount: 10,
    timeLimit: null,
    lives: 3,
    scoreMultiplier: 1.0
  }
})

// 游戏状态
const balloons = ref([])
const targetNumber = ref(1)
const correctCount = ref(0)
const wrongCount = ref(0)
const streak = ref(0)
const startTime = ref(null)
const elapsedTime = ref(0)

let gameLoop = null
let spawnInterval = null

// 数字颜色映射
const NUMBER_COLORS = {
  1: '#ff6b6b', 2: '#4d96ff', 3: '#6bcb77', 4: '#ffd93d', 5: '#a855f7',
  6: '#ff9800', 7: '#00bcd4', 8: '#e91e63', 9: '#9c27b0', 0: '#607d8b'
}

onMounted(() => {
  if (levelCanvas.value) {
    levelCanvas.value.width = props.canvasWidth
    levelCanvas.value.height = props.canvasHeight
  }
  startGame()
})

onUnmounted(() => {
  stopGame()
})

const hasHadFirstSuccess = ref(false)

function startGame() {
  targetNumber.value = gameConfig.value.numbers[0]
  correctCount.value = 0
  wrongCount.value = 0
  streak.value = 0
  hasHadFirstSuccess.value = false
  startTime.value = Date.now()

  emit('level-started')
  spawnInterval = setInterval(() => {
    spawnBalloon()
  }, gameConfig.value.spawnInterval || 2000)

  gameLoop = requestAnimationFrame(update)
  
  if (gameConfig.value.timeLimit) {
    setTimeout(() => {
      if (correctCount.value >= gameConfig.value.targetCount) {
        completeLevel()
      } else {
        emit('collision', { type: 'game-over', data: { reason: 'timeout' } })
      }
    }, gameConfig.value.timeLimit * 1000)
  }
}

function stopGame() {
  if (spawnInterval) clearInterval(spawnInterval)
  if (gameLoop) cancelAnimationFrame(gameLoop)
}

function spawnBalloon() {
  if (!levelCanvas.value) return

  const availableNumbers = gameConfig.value.numbers || [1, 2, 3, 4, 5]
  const randomNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)]
  const radiusRange = gameConfig.value.balloonRadius || [40, 50]
  const radius = radiusRange[0] + Math.random() * (radiusRange[1] - radiusRange[0])

  const x = radius + Math.random() * (props.canvasWidth - radius * 2)
  const y = props.canvasHeight + radius
  const baseSpeed = gameConfig.value.balloonSpeed || 2
  const speed = baseSpeed + Math.random() * (baseSpeed * 0.3)

  balloons.value.push({
    id: Date.now() + Math.random(),
    x,
    y,
    radius,
    number: randomNumber,
    speed,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.02
  })
}

let lastUpdateTime = performance.now()
const TARGET_FPS = 60
const FRAME_INTERVAL = 1000 / TARGET_FPS

function update(currentTime = performance.now()) {
  if (!levelCanvas.value) {
    gameLoop = requestAnimationFrame(update)
    return
  }

  const deltaTime = currentTime - lastUpdateTime
  if (deltaTime < FRAME_INTERVAL) {
    gameLoop = requestAnimationFrame(update)
    return
  }
  lastUpdateTime = currentTime

  const ctx = levelCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  updateBalloons(ctx)
  
  if (props.landmarks && props.landmarks.length > 0) {
    checkGameCollisions()
  }

  if (startTime.value) {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }

  gameLoop = requestAnimationFrame(update)
}

function updateBalloons(ctx) {
  const aliveBalloons = []
  
  for (const balloon of balloons.value) {
    balloon.y -= balloon.speed
    balloon.wobble += balloon.wobbleSpeed
    const wobbleX = Math.sin(balloon.wobble) * 20

    if (balloon.y + balloon.radius < 0) {
      continue
    }

    drawBalloon(ctx, balloon.x + wobbleX, balloon.y, balloon.radius, balloon.number)
    aliveBalloons.push(balloon)
  }
  
  balloons.value = aliveBalloons
}

function drawBalloon(ctx, x, y, radius, number) {
  const color = NUMBER_COLORS[number] || '#ff6b6b'
  
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

  // 数字
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${radius * 0.6}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(number.toString(), x, y)

  // 气球结
  ctx.beginPath()
  ctx.moveTo(x - 8, y + radius - 5)
  ctx.lineTo(x, y + radius + 10)
  ctx.lineTo(x + 8, y + radius - 5)
  ctx.fillStyle = color
  ctx.fill()
}

function checkGameCollisions() {
  if (!props.landmarks || balloons.value.length === 0) return

  try {
    const balloonObjects = balloons.value.map(b => ({
      id: b.id,
      x: b.x,
      y: b.y,
      radius: b.radius,
      number: b.number,
      shape: 'circle'
    }))

    const collisions = checkCollisions(props.landmarks, balloonObjects)

    for (const collision of collisions) {
      if (!collision || !collision.object) continue
      
      const balloon = balloons.value.find(b => b.id === collision.object.id)
      if (!balloon) continue

      const isTarget = balloon.number === targetNumber.value

      if (isTarget) {
        balloons.value = balloons.value.filter(b => b.id !== balloon.id)
        streak.value++
        correctCount.value++
        gameStore.addStreak()

        const basePoints = 100
        let points = Math.floor(basePoints * gameConfig.value.scoreMultiplier)
        if (gameStore.isPowerUpActive('doublePoints')) points *= 2

        emit('collision', {
          type: 'balloon-pop',
          data: { x: balloon.x, y: balloon.y, points, number: balloon.number }
        })
        playSound('correct')

        if (!hasHadFirstSuccess.value) {
          hasHadFirstSuccess.value = true
          const firstMsg = gameStore.getEncouragement('firstSuccess')
          if (firstMsg) emit('encouragement', { type: 'correct', message: firstMsg, streak: streak.value })
        } else {
          sendEncouragement('correct', streak.value)
        }

        if (correctCount.value >= gameConfig.value.targetCount) {
          completeLevel()
          return
        }

        selectNewTargetNumber()
      } else {
        streak.value = 0
        wrongCount.value++
        const isDead = gameStore.loseLife()
        emit('collision', { type: 'wrong-number', data: { number: balloon.number } })
        playSound('wrong')
        sendEncouragement('wrong')
        if (isDead) return
      }
    }
  } catch (e) {
    console.warn('Error in collision detection:', e)
  }
}

function selectNewTargetNumber() {
  const availableNumbers = gameConfig.value.numbers || [1, 2, 3, 4, 5]
  const newNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)]
  targetNumber.value = newNumber
  emit('prompt', `找到数字 ${newNumber}！`)
}

function sendEncouragement(type, streakValue = 0) {
  const message = gameStore.getEncouragement(type, streakValue)
  if (message) {
    emit('encouragement', { type, message, streak: streakValue })
  }
}

function completeLevel() {
  stopGame()
  
  const accuracy = correctCount.value / (correctCount.value + wrongCount.value) || 0
  const result = {
    score: gameStore.score,
    time: elapsedTime.value,
    accuracy,
    completed: correctCount.value,
    total: gameConfig.value.targetCount
  }
  
  const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
  
  emit('level-complete', {
    stars,
    result,
    levelConfig: levelConfig.value
  })
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

function darkenColor(color, percent) {
  return lightenColor(color, -percent)
}
</script>

<style scoped>
.number-recognition-level {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.level-canvas {
  width: 100%;
  height: 100%;
}

.number-prompt {
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 100;
}

.target-number {
  font-size: 120px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 30px rgba(100, 200, 255, 1);
  margin-bottom: 20px;
}

.prompt-text {
  font-size: 32px;
  color: #fff;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.5);
  padding: 15px 40px;
  border-radius: 20px;
}
</style>
