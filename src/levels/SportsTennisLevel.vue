<template>
  <div class="sports-tennis-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
    <div class="tennis-prompt">用手当球拍，把球打回去 🎾</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSpeech } from '@/composables/useSpeech'
import { useGameStore } from '@/stores/game'
import { getLevelConfig, applyDifficultyAdjustments } from '@/config/levelConfig'

const props = defineProps({
  landmarks: { type: Array, default: null },
  canvasWidth: Number,
  canvasHeight: Number,
  gameType: { type: Number, default: 7 },
  subLevel: { type: Number, default: 1 }
})

const emit = defineEmits(['collision', 'level-complete', 'level-started'])

const gameStore = useGameStore()
const levelCanvas = ref(null)
const { playSound, speakPrompt } = useSpeech()

const levelConfig = computed(() => {
  const base = getLevelConfig(props.gameType, props.subLevel)
  return base ? applyDifficultyAdjustments(base, gameStore.userDifficulty) : null
})
const gameConfig = computed(() => levelConfig.value?.config || {})

const ball = ref({ x: 0, y: 0, vx: 0, vy: 0 })
const rallyCount = ref(0)
const rallyTarget = ref(8)
const score = ref(0)
const lives = ref(5)
const paddleWidth = ref(100)
const startTime = ref(null)
const gameOver = ref(false)

let gameLoop = null

onMounted(() => {
  if (levelCanvas.value) {
    levelCanvas.value.width = props.canvasWidth
    levelCanvas.value.height = props.canvasHeight
  }
  emit('level-started')
  startGame()
})

onUnmounted(() => stopGame())

function startGame() {
  rallyTarget.value = gameConfig.value.rallyTarget ?? 10
  paddleWidth.value = gameConfig.value.paddleWidth ?? 100
  lives.value = gameStore.lives
  rallyCount.value = 0
  score.value = 0
  startTime.value = Date.now()
  gameOver.value = false
  serveBall()
  gameLoop = requestAnimationFrame(update)
}

function stopGame() {
  if (gameLoop) cancelAnimationFrame(gameLoop)
}

function serveBall() {
  const speed = gameConfig.value.ballSpeed ?? 5
  ball.value = {
    x: props.canvasWidth / 2,
    y: props.canvasHeight * 0.35,
    vx: (Math.random() - 0.5) * speed * 0.8,
    vy: -speed
  }
}

function update() {
  if (!levelCanvas.value || gameOver.value) return
  const ctx = levelCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  const b = ball.value
  b.x += b.vx
  b.y += b.vy

  const netY = props.canvasHeight * 0.5
  const paddleY = props.canvasHeight * 0.88
  const halfPaddle = paddleWidth.value / 2

  let paddleX = props.canvasWidth / 2
  if (props.landmarks) {
    const rightWrist = props.landmarks[16]
    const leftWrist = props.landmarks[15]
    if (rightWrist && rightWrist.visibility > 0.3) {
      paddleX = rightWrist.x * props.canvasWidth
    } else if (leftWrist && leftWrist.visibility > 0.3) {
      paddleX = leftWrist.x * props.canvasWidth
    }
  }
  paddleX = Math.max(halfPaddle, Math.min(props.canvasWidth - halfPaddle, paddleX))

  if (b.vy > 0 && b.y >= paddleY - 20 && b.y <= paddleY + 30) {
    if (b.x >= paddleX - halfPaddle && b.x <= paddleX + halfPaddle) {
      b.vy = -Math.abs(b.vy) * 1.02
      b.vx += (Math.random() - 0.5) * 1.5
      rallyCount.value++
      const pts = 30 + rallyCount.value * 5
      score.value += pts
      gameStore.addScore(pts)
      playSound('correct')
      emit('collision', { type: 'hit', data: { rally: rallyCount.value } })
    }
  }

  if (b.y > props.canvasHeight + 30) {
    const dead = gameStore.loseLife()
    lives.value = gameStore.lives
    playSound('wrong')
    emit('collision', { type: 'miss', data: {} })
    if (dead) {
      gameOver.value = true
      stopGame()
      emit('collision', { type: 'game-over', data: { score: score.value } })
      return
    }
    serveBall()
  }

  if (b.y < 0) {
    b.vy = Math.abs(b.vy)
  }
  if (b.x < 15 || b.x > props.canvasWidth - 15) {
    b.vx = -b.vx
  }

  if (rallyCount.value >= rallyTarget.value) {
    completeLevel()
    return
  }

  drawCourt(ctx)
  drawBall(ctx, b)
  drawPaddle(ctx, paddleX, paddleY)
  drawUI(ctx)
  gameLoop = requestAnimationFrame(update)
}

function drawCourt(ctx) {
  ctx.fillStyle = '#2e7d32'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([15, 15])
  ctx.beginPath()
  ctx.moveTo(0, props.canvasHeight * 0.5)
  ctx.lineTo(props.canvasWidth, props.canvasHeight * 0.5)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawBall(ctx, b) {
  ctx.fillStyle = '#ffeb3b'
  ctx.beginPath()
  ctx.arc(b.x, b.y, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#f9a825'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawPaddle(ctx, x, y) {
  const w = paddleWidth.value
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillRect(x - w / 2, y - 8, w, 16)
  ctx.strokeStyle = '#1976d2'
  ctx.lineWidth = 2
  ctx.strokeRect(x - w / 2, y - 8, w, 16)
}

function drawUI(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.font = '18px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`对打 ${rallyCount.value} / ${rallyTarget.value}  得分 ${score.value}  生命 ${lives.value}`, 20, 36)
}

function completeLevel() {
  stopGame()
  const result = {
    score: score.value,
    time: (Date.now() - startTime.value) / 1000,
    completed: true
  }
  const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
  emit('level-complete', { stars, result, levelConfig: levelConfig.value })
  speakPrompt('过关！打得漂亮！')
}
</script>

<style scoped>
.sports-tennis-level { position: relative; width: 100%; height: 100%; }
.level-canvas { display: block; width: 100%; height: 100%; }
.tennis-prompt {
  position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
  font-size: 18px; color: rgba(255,255,255,0.95); text-shadow: 0 2px 4px rgba(0,0,0,0.6);
}
</style>
