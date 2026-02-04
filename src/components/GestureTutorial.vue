<template>
  <div class="gesture-tutorial">
    <div class="tutorial-content">
      <!-- 标题栏 -->
      <div class="header">
        <h1>手势教程</h1>
        <div class="progress">
          <span>{{ currentIndex + 1 }} / {{ gestures.length }}</span>
        </div>
      </div>

      <!-- 当前手势展示 -->
      <div class="gesture-display">
        <!-- 示意图 -->
        <div class="gesture-icon">{{ currentGesture.icon }}</div>

        <!-- 手势名称和描述 -->
        <h2 class="gesture-name">{{ currentGesture.name }}</h2>
        <p class="gesture-desc">{{ currentGesture.description }}</p>

        <!-- 教程提示 -->
        <div class="tutorial-hint">
          <span class="hint-icon">💡</span>
          <span>{{ currentGesture.hint }}</span>
        </div>

        <!-- 检测状态 -->
        <div class="detection-status" :class="{ success: isDetected, detecting: isDetecting }">
          <div class="status-circle">
            <transition name="scale">
              <span v-if="isDetected" class="check">✓</span>
              <span v-else-if="isDetecting" class="loading">⏳</span>
              <span v-else class="waiting">👋</span>
            </transition>
          </div>
          <p class="status-text">
            <span v-if="isDetected">识别成功！</span>
            <span v-else-if="isDetecting">正在识别...</span>
            <span v-else>请做出该手势</span>
          </p>
        </div>

        <!-- 进度条 -->
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: progress + '%' }"
              :class="{ success: isDetected }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.floor(progress) }}%</span>
        </div>
      </div>

      <!-- 完成状态 -->
      <transition name="fade">
        <div v-if="currentIndex === gestures.length" class="completion-screen">
          <div class="completion-icon">🎉</div>
          <h2>教程完成！</h2>
          <p>你已经学会了所有基本手势</p>
          <button @click="handleComplete" class="complete-btn">
            开始游戏
          </button>
        </div>
      </transition>

      <!-- 控制按钮 -->
      <div v-if="currentIndex < gestures.length" class="controls">
        <button
          v-if="hasCompletedBefore"
          @click="handleSkip"
          class="skip-btn"
        >
          跳过教程
        </button>

        <button
          v-if="currentIndex > 0"
          @click="previousGesture"
          class="nav-btn"
        >
          ← 上一个
        </button>

        <button
          v-if="currentIndex < gestures.length - 1 && isDetected"
          @click="nextGesture"
          class="nav-btn primary"
        >
          下一个 →
        </button>

        <button
          v-if="currentIndex === gestures.length - 1 && isDetected"
          @click="handleComplete"
          class="complete-btn"
        >
          开始游戏
        </button>
      </div>

      <!-- 隐藏的视频 -->
      <video ref="videoElement" class="hidden-video" autoplay playsinline muted></video>
      <canvas ref="canvas" class="hidden-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePoseDetection } from '@/composables/usePoseDetection'

const emit = defineEmits(['complete', 'skip'])

const videoElement = ref(null)
const canvas = ref(null)
const currentIndex = ref(0)
const isDetected = ref(false)
const isDetecting = ref(false)
const progress = ref(0)
const hasCompletedBefore = ref(false)

// 检查是否已完成过教程
const COMPLETED_KEY = 'motion-games-tutorial-completed'

// 手势列表
const gestures = ref([
  {
    id: 'raise_hands',
    name: '举起双手',
    icon: '🙌',
    description: '将双手举过头顶',
    hint: '双手抬高，手腕要在肩膀上方',
    check: checkRaiseHands
  },
  {
    id: 'wave_left',
    name: '左手挥动',
    icon: '👈',
    description: '向左侧挥动左手',
    hint: '左手向左大幅度挥动',
    check: checkWaveLeft
  },
  {
    id: 'wave_right',
    name: '右手挥动',
    icon: '👉',
    description: '向右侧挥动右手',
    hint: '右手向右大幅度挥动',
    check: checkWaveRight
  },
  {
    id: 'touch_head',
    name: '摸头',
    icon: '🤚',
    description: '用左手或右手摸头顶',
    hint: '手靠近头部即可',
    check: checkTouchHead
  },
  {
    id: 'squat',
    name: '深蹲',
    icon: '🧎',
    description: '身体下蹲',
    hint: '膝盖弯曲，降低重心',
    check: checkSquat
  },
  {
    id: 'spread_arms',
    name: '张开双臂',
    icon: '🤸',
    description: '将双臂向两侧张开',
    hint: '手臂尽量向两边伸直',
    check: checkSpreadArms
  },
  {
    id: 'hands_together',
    name: '双手合十',
    icon: '🙏',
    description: '将双手在胸前合拢',
    hint: '双手在胸前靠近',
    check: checkHandsTogether
  }
])

let detectionLoop = null
let landmarks = null
let detectionStartTime = null
const DETECTION_DURATION = 1000 // 需要保持1秒

const currentGesture = computed(() => gestures.value[currentIndex.value])

// 初始化
onMounted(async () => {
  // 检查是否已完成过
  const completed = localStorage.getItem(COMPLETED_KEY)
  if (completed) {
    hasCompletedBefore.value = true
  }

  if (canvas.value) {
    canvas.value.width = 1280
    canvas.value.height = 720
  }

  // 初始化姿态检测
  const { initialize, stop } = usePoseDetection(videoElement, handlePoseResults)
  await initialize()
})

onUnmounted(() => {
  if (detectionLoop) {
    cancelAnimationFrame(detectionLoop)
  }
})

// 处理姿态检测结果
function handlePoseResults({ landmarks: lm }) {
  landmarks = lm

  if (!isDetected.value && currentIndex.value < gestures.value.length) {
    isDetecting.value = true

    // 检测当前手势
    const gesture = gestures.value[currentIndex.value]
    const detected = gesture.check(landmarks)

    if (detected) {
      if (!detectionStartTime) {
        detectionStartTime = Date.now()
      }

      const elapsed = Date.now() - detectionStartTime
      progress.value = Math.min((elapsed / DETECTION_DURATION) * 100, 100)

      if (elapsed >= DETECTION_DURATION) {
        handleGestureDetected()
      }
    } else {
      detectionStartTime = null
      progress.value = Math.max(progress.value - 10, 0) // 慢慢减少
    }
  }
}

// 手势检测完成
function handleGestureDetected() {
  isDetected.value = true
  isDetecting.value = false
  progress.value = 100

  // 播放成功音效
  playSuccessSound()

  // 自动进入下一个（延迟后）
  setTimeout(() => {
    if (currentIndex.value < gestures.value.length - 1) {
      nextGesture()
    }
  }, 1500)
}

// 下一个手势
function nextGesture() {
  if (currentIndex.value < gestures.value.length - 1) {
    currentIndex.value++
    resetDetection()
  }
}

// 上一个手势
function previousGesture() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetDetection()
  }
}

// 重置检测状态
function resetDetection() {
  isDetected.value = false
  isDetecting.value = false
  progress.value = 0
  detectionStartTime = null
}

// 完成教程
function handleComplete() {
  localStorage.setItem(COMPLETED_KEY, 'true')
  emit('complete')
}

// 跳过教程
function handleSkip() {
  emit('skip')
}

// 播放成功音效
function playSuccessSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  const notes = [523.25, 659.25, 783.99] // C5, E5, G5

  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.value = freq

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + i * 0.1 + 0.3
    )

    oscillator.start(audioContext.currentTime + i * 0.1)
    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3)
  })
}

// ========== 手势检测函数 ==========

// 检查举起双手
function checkRaiseHands(lm) {
  const leftWrist = lm[15]
  const rightWrist = lm[16]
  const leftShoulder = lm[11]
  const rightShoulder = lm[12]

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return false

  // 手腕在肩膀上方
  return leftWrist.y < leftShoulder.y - 0.1 && rightWrist.y < rightShoulder.y - 0.1
}

// 检查左手挥动
function checkWaveLeft(lm) {
  const leftWrist = lm[15]
  const leftShoulder = lm[11]

  if (!leftWrist || !leftShoulder) return false

  // 左手向左伸出（镜像后向右）
  const isExtended = leftWrist.x > leftShoulder.x + 0.2
  return isExtended
}

// 检查右手挥动
function checkWaveRight(lm) {
  const rightWrist = lm[16]
  const rightShoulder = lm[12]

  if (!rightWrist || !rightShoulder) return false

  // 右手向右伸出（镜像后向左）
  const isExtended = rightWrist.x < rightShoulder.x - 0.2
  return isExtended
}

// 检查摸头
function checkTouchHead(lm) {
  const nose = lm[0]
  const leftWrist = lm[15]
  const rightWrist = lm[16]

  if (!nose || !leftWrist || !rightWrist) return false

  // 任意手腕靠近鼻子
  const leftDist = Math.sqrt((leftWrist.x - nose.x) ** 2 + (leftWrist.y - nose.y) ** 2)
  const rightDist = Math.sqrt((rightWrist.x - nose.x) ** 2 + (rightWrist.y - nose.y) ** 2)

  return leftDist < 0.15 || rightDist < 0.15
}

// 检查深蹲
function checkSquat(lm) {
  const leftShoulder = lm[11]
  const rightShoulder = lm[12]
  const leftHip = lm[23]
  const rightHip = lm[24]
  const leftKnee = lm[25]
  const rightKnee = lm[26]

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
    return false
  }

  // 计算肩膀到臀部的距离（缩短表示下蹲）
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
  const hipCenterY = (leftHip.y + rightHip.y) / 2
  const torsoHeight = hipCenterY - shoulderCenterY

  // 正常站立时躯干约占身体高度的 0.3-0.35，深蹲时会更短
  return torsoHeight < 0.2
}

// 检查张开双臂
function checkSpreadArms(lm) {
  const leftWrist = lm[15]
  const rightWrist = lm[16]
  const leftShoulder = lm[11]
  const rightShoulder = lm[12]

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return false

  // 手腕在肩膀外侧
  const leftExtended = leftWrist.x < leftShoulder.x - 0.15
  const rightExtended = rightWrist.x > rightShoulder.x + 0.15

  return leftExtended && rightExtended
}

// 检查双手合十
function checkHandsTogether(lm) {
  const leftWrist = lm[15]
  const rightWrist = lm[16]

  if (!leftWrist || !rightWrist) return false

  // 双手靠近
  const distance = Math.sqrt((leftWrist.x - rightWrist.x) ** 2 + (leftWrist.y - rightWrist.y) ** 2)
  return distance < 0.1
}
</script>

<style scoped>
.gesture-tutorial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  padding: 20px;
  overflow-y: auto;
}

.tutorial-content {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 42px;
  color: #fff;
  margin: 0;
}

.progress {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 20px;
}

.gesture-display {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 50px 40px;
  margin-bottom: 30px;
}

.gesture-icon {
  font-size: 120px;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.gesture-name {
  font-size: 36px;
  color: #fff;
  margin-bottom: 15px;
}

.gesture-desc {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
}

.tutorial-hint {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 217, 61, 0.1);
  padding: 12px 24px;
  border-radius: 20px;
  margin-bottom: 30px;
}

.hint-icon {
  font-size: 24px;
}

.tutorial-hint span:last-child {
  color: #ffd93d;
  font-size: 16px;
}

.detection-status {
  margin: 30px auto;
  padding: 20px;
  border-radius: 15px;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.05);
  max-width: 300px;
}

.detection-status.detecting {
  background: rgba(255, 217, 61, 0.1);
}

.detection-status.success {
  background: rgba(74, 222, 128, 0.2);
}

.status-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.detection-status.success .status-circle {
  background: rgba(74, 222, 128, 0.3);
}

.check {
  color: #4ade80;
}

.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  font-size: 18px;
  color: #fff;
  margin: 0;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 15px;
  max-width: 400px;
  margin: 30px auto 0;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #64c8ff, #4ade80);
  border-radius: 6px;
  transition: width 0.3s;
}

.progress-fill.success {
  background: linear-gradient(90deg, #4ade80, #22c55e);
}

.progress-text {
  font-size: 18px;
  color: #fff;
  min-width: 50px;
}

.completion-screen {
  padding: 40px;
}

.completion-icon {
  font-size: 100px;
  margin-bottom: 20px;
}

.completion-screen h2 {
  font-size: 36px;
  color: #fff;
  margin-bottom: 15px;
}

.completion-screen p {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
}

.complete-btn {
  padding: 15px 50px;
  font-size: 20px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.4);
  transition: all 0.3s;
}

.complete-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(74, 222, 128, 0.6);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.nav-btn,
.skip-btn {
  padding: 15px 30px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn:hover,
.skip-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #64c8ff;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #64c8ff, #3b82f6);
  border: none;
  color: #000;
}

.skip-btn {
  opacity: 0.7;
}

.hidden-video,
.hidden-canvas {
  display: none;
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.3s;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
