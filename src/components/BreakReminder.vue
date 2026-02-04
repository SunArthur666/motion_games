<template>
  <div class="break-reminder">
    <div class="reminder-content">
      <div class="eyes-icon">👀</div>
      <h2>该休息一下眼睛了！</h2>

      <div class="timer-display">
        <div class="time-value">{{ Math.ceil(countdown / 60) }}</div>
        <div class="time-label">分钟</div>
      </div>

      <p class="instruction">做以下动作放松眼睛：</p>

      <div class="eye-exercises">
        <div class="exercise" :class="{ active: currentExercise === 0 }">
          <span class="exercise-icon">👀</span>
          <span class="exercise-text">左右转动眼球</span>
        </div>
        <div class="exercise" :class="{ active: currentExercise === 1 }">
          <span class="exercise-icon">⬆️⬇️</span>
          <span class="exercise-text">上下转动眼球</span>
        </div>
        <div class="exercise" :class="{ active: currentExercise === 2 }">
          <span class="exercise-icon">⭕</span>
          <span class="exercise-text">转动眼球画圈</span>
        </div>
        <div class="exercise" :class="{ active: currentExercise === 3 }">
          <span class="exercise-icon">🌳</span>
          <span class="exercise-text">看远处放松</span>
        </div>
      </div>

      <button
        @click="handleContinue"
        :disabled="!canContinue"
        class="continue-btn"
      >
        <span v-if="canContinue">继续游戏</span>
        <span v-else>{{ skipCountdown }}秒后可跳过</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['continue'])

const gameStore = useGameStore()

const countdown = ref(60) // 60秒休息
const skipCountdown = ref(30) // 30秒后可以跳过
const canContinue = ref(false)
const currentExercise = ref(0)
const BREAKE_DURATION = 60
const SKIP_DELAY = 30

let timerInterval = null
let exerciseInterval = null

onMounted(() => {
  startTimer()
  startExerciseRotation()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (exerciseInterval) clearInterval(exerciseInterval)
})

function startTimer() {
  timerInterval = setInterval(() => {
    countdown.value--

    // 检查是否可以跳过
    if (countdown.value <= BREAKE_DURATION - SKIP_DELAY && !canContinue.value) {
      canContinue.value = true
    }

    // 倒计时结束
    if (countdown.value <= 0) {
      clearInterval(timerInterval)
      canContinue.value = true
      skipCountdown.value = 0
    } else if (canContinue.value) {
      skipCountdown.value = countdown.value
    }
  }, 1000)
}

function startExerciseRotation() {
  exerciseInterval = setInterval(() => {
    currentExercise.value = (currentExercise.value + 1) % 4
  }, 15000) // 每15秒切换一个动作
}

function handleContinue() {
  if (!canContinue.value) return

  gameStore.takeBreak()
  emit('continue')
}
</script>

<style scoped>
.break-reminder {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.reminder-content {
  text-align: center;
  padding: 50px;
}

.eyes-icon {
  font-size: 100px;
  margin-bottom: 20px;
  animation: blink 3s infinite;
}

@keyframes blink {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

.reminder-content h2 {
  color: #fff;
  font-size: 42px;
  margin-bottom: 40px;
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.time-value {
  font-size: 120px;
  font-weight: bold;
  color: #4ade80;
  line-height: 1;
  font-family: 'Courier New', monospace;
}

.time-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  margin-top: 10px;
}

.instruction {
  color: #fff;
  font-size: 24px;
  margin-bottom: 30px;
}

.eye-exercises {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 50px;
}

.exercise {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.exercise.active {
  background: rgba(74, 222, 128, 0.1);
  border-color: #4ade80;
  transform: scale(1.05);
}

.exercise-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.exercise-text {
  color: #fff;
  font-size: 18px;
}

.continue-btn {
  padding: 20px 60px;
  font-size: 24px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.continue-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.5);
}

.continue-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}
</style>
