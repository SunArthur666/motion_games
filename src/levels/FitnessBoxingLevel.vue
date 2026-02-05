<template>
  <div class="fitness-boxing-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
    <div class="boxing-prompt">左拳打左边 👊 右拳打右边 👊</div>
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
  gameType: { type: Number, default: 5 },
  subLevel: { type: Number, default: 1 }
})

const emit = defineEmits(['collision', 'level-complete', 'level-started', 'encouragement'])

const gameStore = useGameStore()
const levelCanvas = ref(null)
const { playSound } = useSpeech()

const levelConfig = computed(() => {
  const base = getLevelConfig(props.gameType, props.subLevel)
  return base ? applyDifficultyAdjustments(base, gameStore.userDifficulty) : null
})
const gameConfig = computed(() => levelConfig.value?.config || {})

const targets = ref([])
const score = ref(0)
const hitCount = ref(0)
const missCount = ref(0)
const startTime = ref(null)
const elapsedTime = ref(0)
const targetCount = ref(0)

let gameLoop = null
let spawnTimeout = null
let nextTargetSide = 'left'

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
  targetCount.value = gameConfig.value.targetCount ?? 15
  hitCount.value = 0
  missCount.value = 0
  score.value = 0
  targets.value = []
  startTime.value = Date.now()
  nextTargetSide = 'left'
  scheduleSpawn()
  gameLoop = requestAnimationFrame(update)
}

function stopGame() {
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (spawnTimeout) clearTimeout(spawnTimeout)
}

function scheduleSpawn() {
  if (hitCount.value + missCount.value >= targetCount.value) return
  const interval = gameConfig.value.spawnInterval ?? 1500
  spawnTimeout = setTimeout(() => {
    spawnTarget()
    scheduleSpawn()
  }, interval)
}

function spawnTarget() {
  const side = nextTargetSide
  nextTargetSide = nextTargetSide === 'left' ? 'right' : 'left'
  const lifetime = gameConfig.value.targetLifetime ?? 2000
  const radius = gameConfig.value.hitRadius ?? 80
  const leftX = props.canvasWidth * 0.22
  const rightX = props.canvasWidth * 0.78
  const y = props.canvasHeight * 0.45
  targets.value.push({
    id: Date.now() + Math.random(),
    side,
    x: side === 'left' ? leftX : rightX,
    y,
    radius,
    spawnAt: Date.now(),
    lifetime,
    hit: false
  })
}

function update() {
  if (!levelCanvas.value) return
  const ctx = levelCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  const now = Date.now()
  for (let i = targets.value.length - 1; i >= 0; i--) {
    const t = targets.value[i]
    if (t.hit) {
      targets.value.splice(i, 1)
      continue
    }
    const age = now - t.spawnAt
    if (age > t.lifetime) {
      targets.value.splice(i, 1)
      missCount.value++
      const isDead = gameStore.loseLife()
      playSound('wrong')
      emit('collision', { type: 'miss', data: {} })
      if (isDead) {
        gameOver()
        return
      }
      continue
    }
    drawTarget(ctx, t, 1 - age / t.lifetime)
  }

  if (props.landmarks) checkPunch()
  elapsedTime.value = (Date.now() - startTime.value) / 1000
  drawUI(ctx)
  gameLoop = requestAnimationFrame(update)
}

function drawTarget(ctx, t, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.radius)
  gradient.addColorStop(0, t.side === 'left' ? '#ff6b6b' : '#4d96ff')
  gradient.addColorStop(0.7, t.side === 'left' ? '#c0392b' : '#2980b9')
  gradient.addColorStop(1, 'rgba(0,0,0,0.3)')
  ctx.beginPath()
  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.font = 'bold 36px sans-serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(t.side === 'left' ? '👈' : '👉', t.x, t.y + 12)
  ctx.restore()
}

function checkPunch() {
  const leftWrist = props.landmarks[15]
  const rightWrist = props.landmarks[16]
  const vis = (lm) => lm && lm.visibility > 0.4
  const left = vis(leftWrist) ? { x: leftWrist.x * props.canvasWidth, y: leftWrist.y * props.canvasHeight } : null
  const right = vis(rightWrist) ? { x: rightWrist.x * props.canvasWidth, y: rightWrist.y * props.canvasHeight } : null

  for (const t of targets.value) {
    if (t.hit) continue
    const hand = t.side === 'left' ? left : right
    if (!hand) continue
    const dx = hand.x - t.x
    const dy = hand.y - t.y
    if (dx * dx + dy * dy <= t.radius * t.radius) {
      t.hit = true
      hitCount.value++
      const pts = Math.floor(100 * (gameConfig.value.scoreMultiplier ?? 1))
      score.value += pts
      gameStore.addScore(pts)
      playSound('correct')
      emit('collision', { type: 'punch', data: { side: t.side, points: pts } })
      if (hitCount.value + missCount.value >= targetCount.value) {
        completeLevel()
      }
      break
    }
  }
}

function drawUI(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`命中 ${hitCount.value} / ${targetCount.value}  得分 ${score.value}`, 20, 40)
}

function gameOver() {
  stopGame()
  emit('collision', { type: 'game-over', data: { score: score.value } })
}

function completeLevel() {
  stopGame()
  const total = hitCount.value + missCount.value
  const accuracy = total > 0 ? hitCount.value / total : 0
  const result = {
    score: score.value,
    time: (Date.now() - startTime.value) / 1000,
    accuracy,
    completed: hitCount.value,
    total: targetCount.value
  }
  const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
  emit('level-complete', { stars, result, levelConfig: levelConfig.value })
}
</script>

<style scoped>
.fitness-boxing-level { position: relative; width: 100%; height: 100%; }
.level-canvas { display: block; width: 100%; height: 100%; }
.boxing-prompt {
  position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%);
  font-size: 18px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
</style>
