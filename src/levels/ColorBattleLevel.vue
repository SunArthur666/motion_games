<template>
  <div class="color-battle-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useCollisionDetection } from '@/composables/useCollisionDetection'
import { useSpeech } from '@/composables/useSpeech'
import { useGameStore } from '@/stores/game'
import { getLevelConfig } from '@/config/levelConfig'

const props = defineProps({
  landmarks: {
    type: Array,
    default: null
  },
  canvasWidth: Number,
  canvasHeight: Number,
  gameType: {
    type: Number,
    default: 1
  },
  subLevel: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['collision', 'prompt', 'level-complete'])

const gameStore = useGameStore()

// 获取关卡配置
const levelConfig = computed(() => {
  return getLevelConfig(props.gameType, props.subLevel)
})

// 游戏配置（从关卡配置中读取）
const gameConfig = computed(() => {
  return levelConfig.value?.config || {
    spawnInterval: 2000,
    balloonSpeed: 2,
    balloonRadius: [40, 50],
    colors: ['red', 'blue', 'green', 'yellow'],
    targetCount: 20,
    timeLimit: null,
    frenzyThreshold: 5,
    lives: 3,
    scoreMultiplier: 1.0
  }
})

const levelCanvas = ref(null)
const { checkCollisions } = useCollisionDetection()
const { speakColor, playSound } = useSpeech()

// 游戏状态
const balloons = ref([])
const coins = ref([])
const currentTargetColor = ref('red')
const score = ref(0)
const streak = ref(0)
const isFrenzyMode = ref(false)
const targetCount = ref(0)        // 目标完成数量
const correctCount = ref(0)       // 正确数量
const wrongCount = ref(0)         // 错误数量
const startTime = ref(null)       // 开始时间
const elapsedTime = ref(0)        // 已用时间

// 颜色配置
const COLORS = {
  red: { name: '红色', hex: '#ff6b6b', custom: 'Red' },
  blue: { name: '蓝色', hex: '#4d96ff', custom: 'Blue' },
  green: { name: '绿色', hex: '#6bcb77', custom: 'Green' },
  yellow: { name: '黄色', hex: '#ffd93d', custom: 'Yellow' }
}

let gameLoop = null
let spawnInterval = null
let lastHandsPosition = { left: null, right: null }
let movementIntensity = 0

// 初始化画布
onMounted(() => {
  if (levelCanvas.value) {
    levelCanvas.value.width = props.canvasWidth
    levelCanvas.value.height = props.canvasHeight
  }
  startGame()
})

// 清理
onUnmounted(() => {
  stopGame()
})

// 开始游戏
function startGame() {
  // 初始化游戏状态
  targetCount.value = gameConfig.value.targetCount || 20
  correctCount.value = 0
  wrongCount.value = 0
  startTime.value = Date.now()
  elapsedTime.value = 0
  
  // 根据配置选择初始颜色
  const availableColors = gameConfig.value.colors || ['red', 'blue', 'green', 'yellow']
  currentTargetColor.value = availableColors[0]
  
  // 开始生成气球
  spawnInterval = setInterval(() => {
    if (!isFrenzyMode.value) {
      spawnBalloon()
    }
  }, gameConfig.value.spawnInterval || 2000)

  // 开始游戏循环
  gameLoop = requestAnimationFrame(update)
  
  // 如果有时间限制，设置定时器
  if (gameConfig.value.timeLimit) {
    setTimeout(() => {
      if (correctCount.value >= targetCount.value) {
        completeLevel()
      } else {
        // 时间到，游戏结束
        emit('collision', {
          type: 'game-over',
          data: { reason: 'timeout', score: score.value }
        })
      }
    }, gameConfig.value.timeLimit * 1000)
  }
}

// 停止游戏
function stopGame() {
  if (spawnInterval) {
    clearInterval(spawnInterval)
  }
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
}

// 生成气球
function spawnBalloon() {
  if (!levelCanvas.value) return

  // 使用关卡配置中的可用颜色
  const availableColors = gameConfig.value.colors || ['red', 'blue', 'green', 'yellow']
  const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]

  // 使用关卡配置中的气球大小范围
  const radiusRange = gameConfig.value.balloonRadius || [40, 50]
  const radius = radiusRange[0] + Math.random() * (radiusRange[1] - radiusRange[0])

  const x = radius + Math.random() * (props.canvasWidth - radius * 2)
  const y = props.canvasHeight + radius

  // 使用关卡配置中的速度
  const baseSpeed = gameConfig.value.balloonSpeed || 2
  const speed = baseSpeed + Math.random() * (baseSpeed * 0.3)

  balloons.value.push({
    id: Date.now() + Math.random(),
    x,
    y,
    radius,
    color: randomColor,
    speed,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.02
  })
}

// 生成金币（狂欢模式）
function spawnCoin() {
  if (!levelCanvas.value) return

  const size = 30
  const x = size + Math.random() * (props.canvasWidth - size * 2)
  const y = -size

  coins.value.push({
    id: Date.now() + Math.random(),
    x,
    y,
    size,
    speed: 3 + Math.random() * 2,
    rotation: 0
  })
}

// 更新游戏状态
// 优化：添加帧率控制和性能优化
let lastUpdateTime = performance.now()
const TARGET_FPS = 60
const FRAME_INTERVAL = 1000 / TARGET_FPS

function update(currentTime = performance.now()) {
  if (!levelCanvas.value) {
    gameLoop = requestAnimationFrame(update)
    return
  }

  // 帧率控制：只在达到目标帧率时才更新
  const deltaTime = currentTime - lastUpdateTime
  if (deltaTime < FRAME_INTERVAL) {
    gameLoop = requestAnimationFrame(update)
    return
  }
  lastUpdateTime = currentTime

  const ctx = levelCanvas.value.getContext('2d')

  // 清除画布
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  // 更新和绘制气球
  updateBalloons(ctx)

  // 更新和绘制金币
  if (isFrenzyMode.value) {
    updateCoins(ctx)
  }

  // 检测碰撞（优化：降低检测频率）
  if (props.landmarks && props.landmarks.length > 0) {
    // 每帧检测碰撞
    checkGameCollisions()
    
    // 运动检测降低频率（每2帧检测一次）
    if (frameCount % 2 === 0) {
      detectMovement()
    }
    frameCount++
  }

  // 更新已用时间
  if (startTime.value) {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }

  gameLoop = requestAnimationFrame(update)
}

let frameCount = 0

// 更新气球
// 优化：使用filter代替splice，减少数组操作
function updateBalloons(ctx) {
  const aliveBalloons = []
  
  for (let i = 0; i < balloons.value.length; i++) {
    const balloon = balloons.value[i]

    // 向上移动
    balloon.y -= balloon.speed

    // 左右摇摆
    balloon.wobble += balloon.wobbleSpeed
    const wobbleX = Math.sin(balloon.wobble) * 20

    // 检查是否飞出屏幕
    if (balloon.y + balloon.radius < 0) {
      // 错过气球，重置连击
      if (!isFrenzyMode.value) {
        streak.value = 0
      }
      continue // 跳过绘制和添加
    }

    // 绘制气球
    drawBalloon(ctx, balloon.x + wobbleX, balloon.y, balloon.radius, COLORS[balloon.color].hex)
    aliveBalloons.push(balloon)
  }
  
  balloons.value = aliveBalloons
}

// 绘制气球
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

  // 绳子
  ctx.beginPath()
  ctx.moveTo(x, y + radius + 10)
  ctx.quadraticCurveTo(
    x + Math.sin(Date.now() * 0.003) * 10,
    y + radius + 40,
    x,
    y + radius + 70
  )
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.stroke()
}

// 更新金币
// 优化：使用filter代替splice
function updateCoins(ctx) {
  const aliveCoins = []
  
  for (let i = 0; i < coins.value.length; i++) {
    const coin = coins.value[i]

    coin.y += coin.speed
    coin.rotation += 0.1

    if (coin.y > props.canvasHeight + coin.size) {
      continue // 跳过绘制和添加
    }

    drawCoin(ctx, coin.x, coin.y, coin.size, coin.rotation)
    aliveCoins.push(coin)
  }
  
  coins.value = aliveCoins
}

// 绘制金币
function drawCoin(ctx, x, y, size, rotation) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  // 金币主体
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
  gradient.addColorStop(0, '#fffacd')
  gradient.addColorStop(0.5, '#ffd700')
  gradient.addColorStop(1, '#daa520')

  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // 金币边缘
  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 3
  ctx.stroke()

  // 中心的 $ 符号
  ctx.fillStyle = '#b8860b'
  ctx.font = `bold ${size}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', 0, 0)

  ctx.restore()
}

// 检测碰撞
// 优化：添加边界检查和错误处理
function checkGameCollisions() {
  if (!props.landmarks || !props.landmarks.length || balloons.value.length === 0) {
    return
  }

  try {
    // 将气球转换为碰撞对象
    const balloonObjects = balloons.value
      .filter(b => b && typeof b.x === 'number' && typeof b.y === 'number')
      .map(b => ({
        id: b.id,
        x: b.x,
        y: b.y,
        radius: b.radius || 40,
        color: b.color,
        shape: 'circle'
      }))

    if (balloonObjects.length === 0) {
      return
    }

    // 检测碰撞
    const collisions = checkCollisions(props.landmarks, balloonObjects)

    for (const collision of collisions) {
      if (!collision || !collision.object) continue
      
      const balloon = balloons.value.find(b => b && b.id === collision.object.id)
      if (!balloon) continue

      const isTarget = balloon.color === currentTargetColor.value

      try {
        if (isTarget || isFrenzyMode.value) {
          // 正确！
          balloons.value = balloons.value.filter(b => b.id !== balloon.id)

          if (isFrenzyMode.value) {
            emit('collision', { type: 'coin-collect', data: { x: balloon.x, y: balloon.y, points: 10 } })
            playSound('collect')
          } else {
            streak.value++
            correctCount.value++
            
            // 计算分数（应用关卡倍数）
            const basePoints = 100
            const points = Math.floor(basePoints * gameConfig.value.scoreMultiplier)
            
            emit('collision', {
              type: 'balloon-pop',
              data: {
                x: balloon.x,
                y: balloon.y,
                color: COLORS[balloon.color]?.hex || '#ff6b6b',
                points
              }
            })
            playSound('correct')

            // 检查是否完成关卡
            if (correctCount.value >= targetCount.value) {
              completeLevel()
              return
            }

            // 检查是否达到狂欢模式
            const frenzyThreshold = gameConfig.value.frenzyThreshold || 5
            if (streak.value >= frenzyThreshold) {
              startFrenzyMode()
            } else {
              // 选择新的目标颜色
              selectNewTargetColor()
            }
          }
        } else {
          // 错误！
          streak.value = 0
          wrongCount.value++
          emit('collision', {
            type: 'wrong-color',
            data: { color: balloon.color }
          })
          playSound('wrong')
        }
      } catch (e) {
        console.warn('Error processing collision:', e)
      }
    }
  } catch (e) {
    console.warn('Error in collision detection:', e)
  }

  // 狂欢模式下检测金币碰撞
  if (isFrenzyMode.value) {
    const coinObjects = coins.value.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      radius: c.size,
      shape: 'circle'
    }))

    const coinCollisions = checkCollisions(props.landmarks, coinObjects)
    for (const collision of coinCollisions) {
      const coin = coins.value.find(c => c.id === collision.object.id)
      if (coin) {
        coins.value = coins.value.filter(c => c.id !== coin.id)
        emit('collision', { type: 'coin-collect', data: { x: coin.x, y: coin.y, points: 50 } })
        playSound('collect')
      }
    }
  }
}

// 检测运动强度（用于肢体轨迹特效）
// 优化：使用平方距离，避免开方运算
function detectMovement() {
  if (!props.landmarks || props.landmarks.length < 17) return

  const leftWrist = props.landmarks[15]
  const rightWrist = props.landmarks[16]

  if (leftWrist && rightWrist && leftWrist.visibility > 0.3 && rightWrist.visibility > 0.3) {
    let intensitySquared = 0

    if (lastHandsPosition.left && lastHandsPosition.right) {
      const leftDx = leftWrist.x - lastHandsPosition.left.x
      const leftDy = leftWrist.y - lastHandsPosition.left.y
      const leftDistSquared = leftDx * leftDx + leftDy * leftDy
      
      const rightDx = rightWrist.x - lastHandsPosition.right.x
      const rightDy = rightWrist.y - lastHandsPosition.right.y
      const rightDistSquared = rightDx * rightDx + rightDy * rightDy
      
      intensitySquared = (leftDistSquared + rightDistSquared) / 2
    }

    // 直接更新对象属性，避免创建新对象
    if (!lastHandsPosition.left) {
      lastHandsPosition.left = { x: leftWrist.x, y: leftWrist.y }
    } else {
      lastHandsPosition.left.x = leftWrist.x
      lastHandsPosition.left.y = leftWrist.y
    }
    
    if (!lastHandsPosition.right) {
      lastHandsPosition.right = { x: rightWrist.x, y: rightWrist.y }
    } else {
      lastHandsPosition.right.x = rightWrist.x
      lastHandsPosition.right.y = rightWrist.y
    }

    movementIntensity = Math.sqrt(intensitySquared)
  }
}

// 选择新的目标颜色
function selectNewTargetColor() {
  // 使用关卡配置中的可用颜色
  const availableColors = gameConfig.value.colors || ['red', 'blue', 'green', 'yellow']
  const newColor = availableColors[Math.floor(Math.random() * availableColors.length)]
  currentTargetColor.value = newColor

  // 语音播报
  setTimeout(() => {
    speakColor(COLORS[newColor].custom)
  }, 300)

  // 发送提示更新事件
  emit('prompt', `找到 ${COLORS[newColor].name}！`)
}

// 完成关卡
function completeLevel() {
  stopGame()
  
  const accuracy = correctCount.value / (correctCount.value + wrongCount.value) || 0
  const finalScore = score.value
  
  // 计算星级
  const result = {
    score: finalScore,
    time: elapsedTime.value,
    accuracy,
    completed: correctCount.value,
    total: targetCount.value
  }
  
  const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
  
  emit('level-complete', {
    stars,
    result,
    levelConfig: levelConfig.value
  })
}

// 开始狂欢模式
function startFrenzyMode() {
  isFrenzyMode.value = true

  // 清除所有气球
  balloons.value = []

  // 大量生成金币（根据关卡难度调整数量）
  const coinCount = 20 + (props.subLevel * 5)
  for (let i = 0; i < coinCount; i++) {
    setTimeout(() => spawnCoin(), i * 100)
  }

  // 10秒后结束狂欢模式
  setTimeout(() => {
    endFrenzyMode()
  }, 10000)
}

// 结束狂欢模式
function endFrenzyMode() {
  isFrenzyMode.value = false
  streak.value = 0
  coins.value = []
  selectNewTargetColor()
}

// 颜色处理工具
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

// 监听目标颜色变化
watch(currentTargetColor, (newColor) => {
  // 更新UI提示
  const prompt = document.querySelector('.prompt-text')
  if (prompt) {
    prompt.textContent = `找到 ${COLORS[newColor].name}！`
    prompt.style.color = COLORS[newColor].hex
  }
})

// 初始化时播报第一个颜色
onMounted(() => {
  setTimeout(() => {
    speakColor(COLORS[currentTargetColor.value].custom)
  }, 1000)
})
</script>

<style scoped>
.color-battle-level {
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
