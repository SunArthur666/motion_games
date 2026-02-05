<template>
  <div class="pose-mimicry-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCollisionDetection } from '@/composables/useCollisionDetection'
import { useSpeech } from '@/composables/useSpeech'
import { useGameStore } from '@/stores/game'
import { getLevelConfig, applyDifficultyAdjustments } from '@/config/levelConfig'
import { POSES, getRandomPose, getPoseSequence } from '@/utils/posePresets'

const props = defineProps({
  landmarks: { type: Array, default: null },
  canvasWidth: Number,
  canvasHeight: Number,
  gameType: { type: Number, default: 3 },
  subLevel: { type: Number, default: 1 }
})

const emit = defineEmits(['collision', 'level-complete'])

const gameStore = useGameStore()
const levelCanvas = ref(null)
const { checkPoseMatch } = useCollisionDetection()
const { speakPrompt, playSound } = useSpeech()

const levelConfig = computed(() => {
  const base = getLevelConfig(props.gameType, props.subLevel)
  return base ? applyDifficultyAdjustments(base, gameStore.userDifficulty) : null
})
const gameConfig = computed(() => levelConfig.value?.config || {})

// 游戏状态
const currentPoseData = ref(null)
const poseSequence = ref([])
const currentIndex = ref(0)
const matchProgress = ref(0) // 0-100
const timeLeft = ref(0)
const score = ref(0)
const completedPoses = ref([])
const isCompleted = ref(false)

const TIME_LIMIT = 30
const MATCH_THRESHOLD = computed(() => gameConfig.value.matchThreshold ?? 0.75)
const DISPLAY_SCALE = 0.6

let gameLoop = null
let timerInterval = null

// 初始化
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

function startGame() {
  const count = gameConfig.value.poseCount ?? 5
  const complexity = (gameConfig.value.poseComplexity === 'expert' && 3) ||
    (gameConfig.value.poseComplexity === 'complex' && 2) ||
    (gameConfig.value.poseComplexity === 'medium' && 2) || 1
  poseSequence.value = getPoseSequence(count, complexity)
  currentIndex.value = 0
  score.value = 0
  completedPoses.value = []
  isCompleted.value = false

  loadNextPose()
  gameLoop = requestAnimationFrame(update)
}

function stopGame() {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  if (timerInterval) {
    clearInterval(timerInterval)
  }
}

function loadNextPose() {
  if (currentIndex.value >= poseSequence.value.length) {
    gameComplete()
    return
  }

  currentPoseData.value = poseSequence.value[currentIndex.value]
  matchProgress.value = 0
  timeLeft.value = TIME_LIMIT

  // 语音播报
  speakPrompt(`做一个${currentPoseData.value.name}的姿势！`)
  speakPrompt(currentPoseData.value.description)

  // 开始倒计时
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  timerInterval = setInterval(() => {
    if (!isCompleted.value) {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        handleTimeout()
      }
    }
  }, 1000)
}

function update() {
  if (!levelCanvas.value) return

  const ctx = levelCanvas.value.getContext('2d')

  // 清除画布
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  // 绘制目标姿势
  if (currentPoseData.value) {
    drawTargetPose(ctx)
  }

  // 绘制当前骨架
  if (props.landmarks) {
    drawCurrentSkeleton(ctx)
    checkMatch()
  }

  // 绘制进度条和UI
  drawUI(ctx)

  // 绘制完成的姿势
  drawCompletedPoses(ctx)

  gameLoop = requestAnimationFrame(update)
}

// 绘制目标姿势
function drawTargetPose(ctx) {
  const pose = currentPoseData.value.pose()
  const centerX = props.canvasWidth * 0.25
  const centerY = props.canvasHeight * 0.5
  const scale = Math.min(props.canvasWidth, props.canvasHeight) * DISPLAY_SCALE

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.scale(scale, scale)

  // 绘制骨架
  drawSkeleton(ctx, pose, false)

  ctx.restore()

  // 绘制标签
  ctx.font = 'bold 28px Arial'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(currentPoseData.value.emoji, centerX, centerY - scale * 0.45)
  ctx.font = 'bold 24px Arial'
  ctx.fillText(currentPoseData.value.name, centerX, centerY + scale * 0.45)

  // 绘制目标框
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 5])
  ctx.strokeRect(centerX - scale * 0.35, centerY - scale * 0.5, scale * 0.7, scale)
  ctx.setLineDash([])
}

// 绘制骨架
function drawSkeleton(ctx, landmarks, isCurrent = false) {
  const connections = [
    [11, 12], // 肩膀
    [11, 13], [13, 15], // 左臂
    [12, 14], [14, 16], // 右臂
    [11, 23], [12, 24], // 躯干
    [23, 24], // 臀部
    [23, 25], [25, 27], // 左腿
    [24, 26], [26, 28]  // 右腿
  ]

  const color = isCurrent
    ? `rgba(100, 200, 255, ${0.5 + matchProgress.value * 0.5})`
    : 'rgba(100, 200, 255, 0.5)'
  const lineWidth = isCurrent ? 6 : 4

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'

  for (const [start, end] of connections) {
    const startLm = landmarks[start]
    const endLm = landmarks[end]

    if (!startLm || !endLm || startLm.visibility < 0.5 || endLm.visibility < 0.5) continue

    ctx.beginPath()
    ctx.moveTo(startLm.x - 0.5, startLm.y - 0.5)
    ctx.lineTo(endLm.x - 0.5, endLm.y - 0.5)
    ctx.stroke()
  }

  // 绘制关节点
  for (const lm of landmarks) {
    if (!lm || lm.visibility < 0.5) continue

    ctx.beginPath()
    ctx.arc(lm.x - 0.5, lm.y - 0.5, isCurrent ? 0.02 : 0.015, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
}

// 绘制当前骨架
function drawCurrentSkeleton(ctx) {
  const pose = props.landmarks
  const centerX = props.canvasWidth * 0.7
  const centerY = props.canvasHeight * 0.5
  const scale = Math.min(props.canvasWidth, props.canvasHeight) * DISPLAY_SCALE

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.scale(scale, scale)

  drawSkeleton(ctx, pose, true)

  ctx.restore()

  // 绘制标签
  ctx.font = 'bold 24px Arial'
  ctx.fillStyle = matchProgress.value >= MATCH_THRESHOLD ? '#4ade80' : '#fff'
  ctx.textAlign = 'center'
  ctx.fillText('你的姿势', centerX, centerY + scale * 0.45)
}

// 检测匹配
function checkMatch() {
  if (!currentPoseData.value || !props.landmarks) return

  const targetPose = currentPoseData.value.pose()
  const threshold = typeof MATCH_THRESHOLD.value === 'number' ? MATCH_THRESHOLD.value : 0.75
  const result = checkPoseMatch(props.landmarks, targetPose, threshold)
  matchProgress.value = result.ratio
  if (result.isMatch && !isCompleted.value) {
    handleMatch()
  }
}

// 处理匹配成功
function handleMatch() {
  isCompleted.value = true
  completedPoses.value.push({
    ...currentPoseData.value,
    score: Math.floor((1 - (currentIndex.value / poseSequence.value.length)) * 100)
  })

  score.value += Math.floor(matchProgress.value * 100)

  playSound('correct')
  speakPrompt('太棒了！')

  // 清除定时器
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  // 延迟后加载下一个
  setTimeout(() => {
    currentIndex.value++
    isCompleted.value = false
    loadNextPose()
  }, 2000)
}

// 处理超时
function handleTimeout() {
  speakPrompt('时间到！试试下一个姿势')

  completedPoses.value.push({
    ...currentPoseData.value,
    score: 0,
    failed: true
  })

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  setTimeout(() => {
    currentIndex.value++
    isCompleted.value = false
    loadNextPose()
  }, 1500)
}

// 游戏完成
function gameComplete() {
  stopGame()

  const totalScore = completedPoses.value.reduce((sum, p) => sum + (p.score || 0), 0)
  const completedCount = completedPoses.value.filter(p => !p.failed).length
  const total = poseSequence.value.length
  const accuracy = total ? completedCount / total : 0

  if (levelConfig.value) {
    const result = {
      score: totalScore,
      time: null,
      accuracy,
      completed: completedCount,
      total
    }
    const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
    emit('level-complete', {
      stars,
      result,
      levelConfig: levelConfig.value
    })
  } else {
    emit('collision', {
      type: 'game-complete',
      data: { score: totalScore, completed: completedCount, total }
    })
  }

  speakPrompt(`游戏完成！完成了${completedCount}个姿势，得分${totalScore}！`)
}

// 绘制UI
function drawUI(ctx) {
  // 进度条背景
  const barWidth = props.canvasWidth * 0.4
  const barHeight = 20
  const barX = props.canvasWidth * 0.3
  const barY = props.canvasHeight * 0.85

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  roundRect(ctx, barX, barY, barWidth, barHeight, 10)
  ctx.fill()

  // 进度条填充
  const progress = matchProgress.value
  const fillWidth = barWidth * progress
  const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
  gradient.addColorStop(0, '#ff6b6b')
  gradient.addColorStop(0.5, '#ffd93d')
  gradient.addColorStop(1, '#4ade80')

  ctx.fillStyle = gradient
  roundRect(ctx, barX, barY, fillWidth, barHeight, 10)
  ctx.fill()

  // 进度文字
  ctx.font = 'bold 20px Arial'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.floor(progress * 100)}%`, props.canvasWidth * 0.5, barY + barHeight + 30)

  // 时间显示
  ctx.font = 'bold 24px Arial'
  ctx.fillStyle = timeLeft.value <= 10 ? '#ff6b6b' : '#fff'
  ctx.fillText(`${timeLeft.value}s`, props.canvasWidth * 0.5, barY + barHeight + 65)

  // 关卡进度
  ctx.font = '18px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText(
    `${currentIndex.value + 1} / ${poseSequence.value.length}`,
    props.canvasWidth * 0.5,
    props.canvasHeight * 0.12
  )
}

// 绘制完成的姿势
function drawCompletedPoses(ctx) {
  const startX = props.canvasWidth * 0.15
  const startY = props.canvasHeight * 0.15
  const spacing = 60

  completedPoses.value.forEach((pose, index) => {
    const x = startX + index * spacing

    // 背景
    ctx.beginPath()
    ctx.arc(x, startY, 25, 0, Math.PI * 2)
    ctx.fillStyle = pose.failed ? 'rgba(255, 107, 107, 0.3)' : 'rgba(74, 222, 128, 0.3)'
    ctx.fill()

    // 表情
    ctx.font = '28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(pose.failed ? '❌' : '✅', x, startY)
  })
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
.pose-mimicry-level {
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
