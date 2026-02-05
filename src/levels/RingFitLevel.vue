<template>
  <div class="ring-fit-level">
    <canvas ref="levelCanvas" class="level-canvas"></canvas>
    <div class="phase-prompt">{{ phasePrompt }}</div>
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
  gameType: { type: Number, default: 6 },
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

const phase = ref('run') // 'run' | 'battle'
const runSteps = ref(0)
const runStepsRequired = ref(0)
const lastKneeLift = ref(null)
const kneeLiftCooldown = ref(0)
const enemies = ref([])
const currentEnemySquats = ref(0)
const squatsPerEnemy = ref(3)
const squatHoldFrames = ref(12)
const squatFrames = ref(0)
const score = ref(0)
const startTime = ref(null)

const phasePrompt = computed(() => {
  if (phase.value === 'run') return `抬腿跑步 ${runSteps.value} / ${runStepsRequired.value}`
  if (enemies.value.length) return `深蹲挤压！${currentEnemySquats.value} / ${squatsPerEnemy.value}`
  return '继续！'
})

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
  runStepsRequired.value = gameConfig.value.runStepsRequired ?? 20
  squatsPerEnemy.value = gameConfig.value.squatsPerEnemy ?? 3
  squatHoldFrames.value = gameConfig.value.squatHoldFrames ?? 15
  runSteps.value = 0
  lastKneeLift.value = null
  kneeLiftCooldown.value = 0
  phase.value = 'run'
  enemies.value = []
  currentEnemySquats.value = 0
  squatFrames.value = 0
  score.value = 0
  startTime.value = Date.now()
  gameLoop = requestAnimationFrame(update)
}

function stopGame() {
  if (gameLoop) cancelAnimationFrame(gameLoop)
}

function update() {
  if (!levelCanvas.value) return
  const ctx = levelCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  if (phase.value === 'run') {
    if (props.landmarks) updateRun()
    drawRunPhase(ctx)
    if (runSteps.value >= runStepsRequired.value) {
      phase.value = 'battle'
      const count = gameConfig.value.enemyCount ?? 2
      enemies.value = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: props.canvasWidth * (0.3 + (i % 3) * 0.2),
        y: props.canvasHeight * 0.35,
        squatsDone: 0,
        squatsNeeded: squatsPerEnemy.value
      }))
      currentEnemySquats.value = 0
      speakPrompt('敌人出现！深蹲挤压健身环攻击！')
    }
  } else {
    if (props.landmarks) updateSquat()
    drawBattlePhase(ctx)
    if (enemies.value.length === 0) {
      completeLevel()
      return
    }
  }

  kneeLiftCooldown.value = Math.max(0, kneeLiftCooldown.value - 1)
  gameLoop = requestAnimationFrame(update)
}

function updateRun() {
  const leftKnee = props.landmarks[25]
  const rightKnee = props.landmarks[26]
  const leftHip = props.landmarks[23]
  const rightHip = props.landmarks[24]
  if (!leftKnee || !rightKnee || !leftHip || !rightHip) return
  if (kneeLiftCooldown.value > 0) return

  const leftUp = leftKnee.y < leftHip.y - 0.05
  const rightUp = rightKnee.y < rightHip.y - 0.05
  if (leftUp && lastKneeLift.value !== 'left') {
    lastKneeLift.value = 'left'
    runSteps.value++
    kneeLiftCooldown.value = 12
    score.value += 20
    gameStore.addScore(20)
  } else if (rightUp && lastKneeLift.value !== 'right') {
    lastKneeLift.value = 'right'
    runSteps.value++
    kneeLiftCooldown.value = 12
    score.value += 20
    gameStore.addScore(20)
  } else if (!leftUp && !rightUp) {
    lastKneeLift.value = null
  }
}

function updateSquat() {
  const leftShoulder = props.landmarks[11]
  const rightShoulder = props.landmarks[12]
  const leftHip = props.landmarks[23]
  const rightHip = props.landmarks[24]
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return

  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const hipY = (leftHip.y + rightHip.y) / 2
  const torsoHeight = Math.abs(hipY - shoulderY)
  const isSquatting = torsoHeight < 0.2

  if (isSquatting) {
    squatFrames.value++
    if (squatFrames.value === squatHoldFrames.value && enemies.value.length > 0) {
      squatFrames.value = 0
      const enemy = enemies.value[0]
      enemy.squatsDone++
      currentEnemySquats.value = enemy.squatsDone
      const pts = 50
      score.value += pts
      gameStore.addScore(pts)
      playSound('correct')
      if (enemy.squatsDone >= enemy.squatsNeeded) {
        enemies.value = enemies.value.filter(e => e.id !== enemy.id)
        currentEnemySquats.value = 0
      }
    }
  } else {
    squatFrames.value = 0
  }
}

function drawRunPhase(ctx) {
  ctx.fillStyle = '#2d5a27'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  for (let i = 0; i < 20; i++) {
    ctx.fillRect((i * props.canvasWidth / 20 + (Date.now() / 50) % (props.canvasWidth / 20)) % props.canvasWidth, 0, 30, props.canvasHeight)
  }
  ctx.font = 'bold 32px sans-serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText('原地跑步！抬腿～', props.canvasWidth / 2, 80)
  ctx.font = '48px sans-serif'
  ctx.fillText(`${runSteps.value} / ${runStepsRequired.value}`, props.canvasWidth / 2, props.canvasHeight / 2)
  ctx.font = '24px sans-serif'
  ctx.fillText('💪 健身环', props.canvasWidth / 2, props.canvasHeight - 60)
}

function drawBattlePhase(ctx) {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText('深蹲挤压攻击敌人！', props.canvasWidth / 2, 50)

  enemies.value.forEach((e, i) => {
    const x = e.x ?? props.canvasWidth * (0.25 + i * 0.25)
    const y = e.y ?? props.canvasHeight * 0.35
    ctx.fillStyle = '#e94560'
    ctx.beginPath()
    ctx.arc(x, y, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(`${e.squatsDone}/${e.squatsNeeded}`, x, y + 6)
  })

  ctx.fillStyle = 'rgba(100,200,255,0.4)'
  ctx.font = '18px sans-serif'
  ctx.fillText('蹲下保持一会 = 挤压一次', props.canvasWidth / 2, props.canvasHeight - 40)
}

function completeLevel() {
  stopGame()
  const result = { score: score.value, time: (Date.now() - startTime.value) / 1000, completed: true }
  const stars = gameStore.completeLevel(props.gameType, props.subLevel, result)
  emit('level-complete', { stars, result, levelConfig: levelConfig.value })
  speakPrompt('通关！做得棒！')
}
</script>

<style scoped>
.ring-fit-level { position: relative; width: 100%; height: 100%; }
.level-canvas { display: block; width: 100%; height: 100%; }
.phase-prompt {
  position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
  font-size: 20px; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,0.8);
}
</style>
