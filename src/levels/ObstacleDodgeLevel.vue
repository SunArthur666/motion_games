<template>
  <div class="obstacle-dodge-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCollisionDetection } from '@/composables/useCollisionDetection'
import { useSpeech } from '@/composables/useSpeech'
import { useGameStore } from '@/stores/game'
import { getLevelConfig, applyDifficultyAdjustments, calculateStars } from '@/config/levelConfig'

const props = defineProps({
  landmarks: { type: Array, default: null },
  canvasWidth: Number,
  canvasHeight: Number,
  gameType: { type: Number, default: 2 },
  subLevel: { type: Number, default: 1 }
})

const emit = defineEmits(['collision', 'level-complete'])

const gameStore = useGameStore()
const levelCanvas = ref(null)
const { pointInRect, pointInCircle } = useCollisionDetection()
const { speakPrompt, playSound } = useSpeech()

const levelConfig = computed(() => {
  const base = getLevelConfig(props.gameType, props.subLevel)
  return base ? applyDifficultyAdjustments(base, gameStore.userDifficulty) : null
})
const gameConfig = computed(() => levelConfig.value?.config || {})

// 游戏状态
const obstacles = ref([])
const score = ref(0)
const lives = ref(3)
const isGameOver = ref(false)
const elapsedTime = ref(0)
const survivalTimer = ref(null)

// 玩家状态
const playerPosition = ref({ x: 0.5, y: 0.5 }) // 归一化坐标
const isSquatting = ref(false)
const playerZone = ref('center') // 'left', 'center', 'right'

// 游戏配置
const ZONES = {
  left: { x: 0.2, color: '#ff6b6b' },
  center: { x: 0.5, color: '#ffd93d' },
  right: { x: 0.8, color: '#4d96ff' }
}

const PLAYER_RADIUS = 50
const DODGE_THRESHOLD = 0.35 // 肩膀中点偏移阈值
const SQUAT_THRESHOLD = 0.55 // 躯干-臀部高度比阈值

let gameLoop = null
let spawnTimeout = null
let difficulty = 1

onMounted(() => {
  if (levelCanvas.value) {
    levelCanvas.value.width = props.canvasWidth
    levelCanvas.value.height = props.canvasHeight
  }
  startGame()
  speakPrompt('关卡二：左右移动躲避障碍！深蹲躲过高处障碍！')
})

onUnmounted(() => {
  stopGame()
})

function startGame() {
  lives.value = gameStore.lives
  elapsedTime.value = 0
  const targetTime = gameConfig.value.targetTime ?? 30
  if (survivalTimer) clearInterval(survivalTimer)
  survivalTimer = setInterval(() => {
    if (isGameOver.value) return
    elapsedTime.value++
    if (elapsedTime.value >= targetTime) {
      completeLevel()
    }
  }, 1000)
  spawnObstacle()
  gameLoop = requestAnimationFrame(update)
}

function stopGame() {
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (spawnTimeout) clearTimeout(spawnTimeout)
  if (survivalTimer) {
    clearInterval(survivalTimer)
    survivalTimer = null
  }
}

// 生成障碍物
function spawnObstacle() {
  if (isGameOver.value) return

  const types = gameConfig.value.obstacleTypes || ['low', 'high']
  const type = types[Math.floor(Math.random() * types.length)]

  const baseSpeed = gameConfig.value.obstacleSpeed ?? 3
  const obstacle = {
    id: Date.now() + Math.random(),
    type,
    x: Math.random() < 0.5 ? -100 : props.canvasWidth + 100,
    y: type === 'high' ? props.canvasHeight * 0.3 : props.canvasHeight * 0.6,
    speed: baseSpeed + difficulty * 0.5,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.1
  }

  // 根据类型设置尺寸
  switch (type) {
    case 'low':
      obstacle.width = 60
      obstacle.height = 60
      obstacle.color = '#e94560'
      obstacle.shape = 'fireball'
      break
    case 'high':
      obstacle.width = 80
      obstacle.height = 40
      obstacle.color = '#9b59b6'
      obstacle.shape = 'beam'
      obstacle.y = props.canvasHeight * 0.25
      break
    case 'wide':
      obstacle.width = 200
      obstacle.height = 80
      obstacle.color = '#f39c12'
      obstacle.shape = 'barrier'
      obstacle.y = props.canvasHeight * 0.5
      break
  }

  obstacles.value.push(obstacle)

  const interval = gameConfig.value.spawnInterval ?? 2000
  const nextSpawn = Math.max(800, interval - difficulty * 150)
  spawnTimeout = setTimeout(spawnObstacle, nextSpawn)
}

// 更新游戏
function update() {
  if (!levelCanvas.value) return

  const ctx = levelCanvas.value.getContext('2d')

  // 清除画布
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  // 绘制安全区
  drawSafeZones(ctx)

  // 绘制玩家
  drawPlayer(ctx)

  // 更新和绘制障碍物
  updateObstacles(ctx)

  // 检测碰撞
  if (props.landmarks) {
    updatePlayerPosition()
    checkCollisions()
  }

  gameLoop = requestAnimationFrame(update)
}

// 绘制安全区
function drawSafeZones(ctx) {
  const zoneWidth = props.canvasWidth * 0.25
  const zoneHeight = props.canvasHeight * 0.7
  const zoneY = props.canvasHeight * 0.15

  // 左区
  ctx.fillStyle = 'rgba(255, 107, 107, 0.15)'
  ctx.strokeStyle = playerZone.value === 'left' ? '#ff6b6b' : 'rgba(255, 107, 107, 0.3)'
  ctx.lineWidth = playerZone.value === 'left' ? 4 : 2
  roundRect(ctx, props.canvasWidth * 0.05, zoneY, zoneWidth, zoneHeight, 20)
  ctx.fill()
  ctx.stroke()

  // 中区
  ctx.fillStyle = 'rgba(255, 217, 61, 0.15)'
  ctx.strokeStyle = playerZone.value === 'center' ? '#ffd93d' : 'rgba(255, 217, 61, 0.3)'
  ctx.lineWidth = playerZone.value === 'center' ? 4 : 2
  roundRect(ctx, props.canvasWidth * 0.375, zoneY, zoneWidth, zoneHeight, 20)
  ctx.fill()
  ctx.stroke()

  // 右区
  ctx.fillStyle = 'rgba(77, 150, 255, 0.15)'
  ctx.strokeStyle = playerZone.value === 'right' ? '#4d96ff' : 'rgba(77, 150, 255, 0.3)'
  ctx.lineWidth = playerZone.value === 'right' ? 4 : 2
  roundRect(ctx, props.canvasWidth * 0.7, zoneY, zoneWidth, zoneHeight, 20)
  ctx.fill()
  ctx.stroke()

  // 深蹲区（底部）
  ctx.fillStyle = 'rgba(74, 222, 128, 0.15)'
  ctx.strokeStyle = isSquatting.value ? '#4ade80' : 'rgba(74, 222, 128, 0.3)'
  ctx.lineWidth = isSquatting.value ? 4 : 2
  roundRect(ctx, props.canvasWidth * 0.15, props.canvasHeight * 0.85, props.canvasWidth * 0.7, 80, 15)
  ctx.fill()
  ctx.stroke()

  // 标签
  ctx.font = 'bold 20px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.textAlign = 'center'
  ctx.fillText('左', props.canvasWidth * 0.175, zoneY + zoneHeight / 2)
  ctx.fillText('中', props.canvasWidth * 0.5, zoneY + zoneHeight / 2)
  ctx.fillText('右', props.canvasWidth * 0.825, zoneY + zoneHeight / 2)

  if (isSquatting.value) {
    ctx.fillText('↓ 深蹲安全 ↓', props.canvasWidth * 0.5, props.canvasHeight * 0.9)
  }
}

// 绘制玩家
function drawPlayer(ctx) {
  const x = playerPosition.value.x * props.canvasWidth
  const y = playerPosition.value.y * props.canvasHeight

  // 玩家光环
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, PLAYER_RADIUS)
  gradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)')
  gradient.addColorStop(1, 'rgba(100, 200, 255, 0)')

  ctx.beginPath()
  ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // 中心点
  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fillStyle = '#64c8ff'
  ctx.fill()

  // 方向指示
  if (playerZone.value !== 'center') {
    const arrowX = playerZone.value === 'left' ? x - 30 : x + 30
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(arrowX, y)
    ctx.strokeStyle = '#64c8ff'
    ctx.lineWidth = 4
    ctx.stroke()
  }
}

// 更新和绘制障碍物
function updateObstacles(ctx) {
  for (let i = obstacles.value.length - 1; i >= 0; i--) {
    const obstacle = obstacles.value[i]

    // 移动
    if (obstacle.x < 0) {
      obstacle.x += obstacle.speed
    } else {
      obstacle.x -= obstacle.speed
    }

    obstacle.rotation += obstacle.rotationSpeed

    // 绘制
    drawObstacle(ctx, obstacle)

    // 检查是否飞出屏幕
    const isOutOfBounds = obstacle.x < -200 || obstacle.x > props.canvasWidth + 200
    if (isOutOfBounds) {
      obstacles.value.splice(i, 1)
      score.value += 10
      gameStore.addScore(10)

      // 难度递增
      if (score.value % 50 === 0) {
        difficulty = Math.min(difficulty + 0.5, 5)
      }
    }
  }
}

// 绘制障碍物
function drawObstacle(ctx, obstacle) {
  ctx.save()
  ctx.translate(obstacle.x, obstacle.y)
  ctx.rotate(obstacle.rotation)

  switch (obstacle.shape) {
    case 'fireball':
      drawFireball(ctx, obstacle)
      break
    case 'beam':
      drawBeam(ctx, obstacle)
      break
    case 'barrier':
      drawBarrier(ctx, obstacle)
      break
  }

  ctx.restore()
}

// 绘制火球
function drawFireball(ctx, obstacle) {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.width)
  gradient.addColorStop(0, '#fff')
  gradient.addColorStop(0.3, '#ffd700')
  gradient.addColorStop(0.6, '#ff6b00')
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')

  ctx.beginPath()
  ctx.arc(0, 0, obstacle.width, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // 火焰尾迹
  for (let i = 0; i < 5; i++) {
    const size = obstacle.width * (0.3 + i * 0.15)
    const offset = i * 20
    ctx.beginPath()
    ctx.arc(offset, Math.sin(Date.now() * 0.01 + i) * 10, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, ${100 - i * 20}, 0, ${0.5 - i * 0.1})`
    ctx.fill()
  }
}

// 绘制激光束
function drawBeam(ctx, obstacle) {
  const gradient = ctx.createLinearGradient(0, -obstacle.height / 2, 0, obstacle.height / 2)
  gradient.addColorStop(0, 'rgba(155, 89, 182, 0)')
  gradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.8)')
  gradient.addColorStop(1, 'rgba(155, 89, 182, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)

  // 边缘发光
  ctx.strokeStyle = '#9b59b6'
  ctx.lineWidth = 2
  ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)
}

// 绘制障碍墙
function drawBarrier(ctx, obstacle) {
  // 木纹效果
  ctx.fillStyle = '#8B4513'
  roundRect(ctx, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 5)
  ctx.fill()

  // 铆钉
  const nails = [
    [-obstacle.width / 2 + 10, -obstacle.height / 2 + 10],
    [obstacle.width / 2 - 10, -obstacle.height / 2 + 10],
    [-obstacle.width / 2 + 10, obstacle.height / 2 - 10],
    [obstacle.width / 2 - 10, obstacle.height / 2 - 10]
  ]

  for (const [nx, ny] of nails) {
    ctx.beginPath()
    ctx.arc(nx, ny, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#666'
    ctx.fill()
  }
}

// 更新玩家位置
function updatePlayerPosition() {
  if (!props.landmarks) return

  // 获取关键点
  const leftShoulder = props.landmarks[11]
  const rightShoulder = props.landmarks[12]
  const leftHip = props.landmarks[23]
  const rightHip = props.landmarks[24]

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return

  // 计算肩膀中点（玩家中心）
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
  const hipCenterY = (leftHip.y + rightHip.y) / 2

  playerPosition.value = { x: shoulderCenterX, y: shoulderCenterY }

  // 检测左右区域
  if (shoulderCenterX < 0.33) {
    playerZone.value = 'left'
  } else if (shoulderCenterX > 0.67) {
    playerZone.value = 'right'
  } else {
    playerZone.value = 'center'
  }

  // 检测深蹲（躯干-臀部高度比）
  const torsoHeight = Math.abs(hipCenterY - shoulderCenterY)
  const isLow = torsoHeight < SQUAT_THRESHOLD * 0.3

  isSquatting.value = isLow
}

// 检测碰撞
function checkCollisions() {
  const playerX = playerPosition.value.x * props.canvasWidth
  const playerY = playerPosition.value.y * props.canvasHeight

  for (const obstacle of obstacles.value) {
    let hit = false

    // 火球和横木：检测左右区域匹配
    if (obstacle.shape === 'fireball' || obstacle.shape === 'barrier') {
      // 高处障碍需要躲避，低处障碍可以躲避
      if (obstacle.type === 'high') {
        // 高处障碍：深蹲躲避
        if (!isSquatting.value && Math.abs(playerX - obstacle.x) < obstacle.width / 2 + PLAYER_RADIUS) {
          hit = true
        }
      } else {
        // 低处障碍：左右躲避
        const obstacleZone = obstacle.x < props.canvasWidth / 2 ? 'left' : 'right'
        if (playerZone.value === obstacleZone && Math.abs(playerY - obstacle.y) < obstacle.height / 2 + PLAYER_RADIUS) {
          hit = true
        }
      }
    }
    // 激光束：必须深蹲
    else if (obstacle.shape === 'beam') {
      if (!isSquatting.value && Math.abs(playerX - obstacle.x) < obstacle.width / 2 + PLAYER_RADIUS) {
        hit = true
      }
    }

    if (hit) {
      handleCollision(obstacle)
    }
  }
}

// 处理碰撞
function handleCollision(obstacle) {
  const dead = gameStore.loseLife()
  lives.value = gameStore.lives
  playSound('wrong')
  obstacles.value = obstacles.value.filter(o => o.id !== obstacle.id)

  if (dead) {
    gameOver()
  } else {
    emit('collision', { type: 'hit', data: { lives: lives.value } })
  }
}

// 通关
function completeLevel() {
  isGameOver.value = true
  stopGame()
  if (!levelConfig.value) return
  const result = {
    score: gameStore.score,
    time: elapsedTime.value,
    completed: true
  }
  const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
  emit('level-complete', {
    stars,
    result,
    levelConfig: levelConfig.value
  })
  speakPrompt(`通关！存活 ${elapsedTime.value} 秒！`)
}

// 游戏结束
function gameOver() {
  isGameOver.value = true
  stopGame()
  emit('collision', {
    type: 'game-over',
    data: { score: gameStore.score }
  })
  speakPrompt('游戏结束！')
}

// 工具函数：圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}
</script>

<style scoped>
.obstacle-dodge-level {
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
</style>
