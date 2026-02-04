<template>
  <div class="position-guide">
    <!-- 隐藏的视频元素 -->
    <video
      ref="videoElement"
      class="hidden-video"
      autoplay
      playsinline
      muted
    ></video>

    <!-- 画布 -->
    <canvas ref="canvas" class="guide-canvas"></canvas>

    <!-- 引导提示 -->
    <div class="guide-overlay">
      <div class="guide-title">体感小游戏</div>

      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>正在加载摄像头...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>无法访问摄像头</p>
        <p class="error-detail">{{ error.message }}</p>
        <button @click="retry" class="retry-btn">重试</button>
      </div>

      <div v-else class="guide-content">
        <!-- 人体轮廓引导框 -->
        <svg class="body-guide" viewBox="0 0 400 600">
          <!-- 头部 -->
          <ellipse
            cx="200"
            cy="80"
            rx="50"
            ry="60"
            :class="['body-part', { active: bodyParts.head }]"
          />
          <!-- 躯干 -->
          <rect
            x="140"
            y="140"
            width="120"
            height="180"
            rx="20"
            :class="['body-part', { active: bodyParts.torso }]"
          />
          <!-- 左臂 -->
          <rect
            x="80"
            y="150"
            width="55"
            height="150"
            rx="15"
            :class="['body-part', { active: bodyParts.leftArm }]"
          />
          <!-- 右臂 -->
          <rect
            x="265"
            y="150"
            width="55"
            height="150"
            rx="15"
            :class="['body-part', { active: bodyParts.rightArm }]"
          />
          <!-- 左腿 -->
          <rect
            x="145"
            y="320"
            width="50"
            height="180"
            rx="15"
            :class="['body-part', { active: bodyParts.leftLeg }]"
          />
          <!-- 右腿 -->
          <rect
            x="205"
            y="320"
            width="50"
            height="180"
            rx="15"
            :class="['body-part', { active: bodyParts.rightLeg }]"
          />
        </svg>

        <div class="guide-instruction">
          <template v-if="!isBodyDetected">
            <p class="instruction-text">请站在屏幕中央</p>
            <p class="instruction-hint">确保全身都能看到</p>
          </template>
          <template v-else>
            <p class="instruction-text success">位置正确！</p>
            <p class="instruction-hint">准备开始游戏</p>
          </template>
        </div>

        <!-- 进度条 -->
        <div class="detection-progress">
          <div
            class="progress-bar"
            :style="{ width: detectionProgress + '%' }"
          ></div>
        </div>

        <!-- 开始按钮 -->
        <button
          v-if="isBodyDetected"
          @click="handleStart"
          class="start-btn"
          :disabled="!canStart"
        >
          <span v-if="canStart">开始游戏</span>
          <span v-else>{{ countdown }}s</span>
        </button>
      </div>

      <!-- 设置按钮 -->
      <div class="settings-btn" @click="showSettings = true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
        </svg>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-modal" @click.self="showSettings = false">
      <div class="settings-content">
        <h2>设置</h2>

        <div class="setting-item">
          <label>镜像模式</label>
          <button
            @click="toggleMirror"
            class="toggle-btn"
            :class="{ active: gameStore.isMirrored }"
          >
            {{ gameStore.isMirrored ? '开启' : '关闭' }}
          </button>
        </div>

        <div class="setting-item">
          <label>性能模式</label>
          <select v-model="performanceMode" class="select-input">
            <option value="high">高性能</option>
            <option value="low">低功耗</option>
          </select>
        </div>

        <button @click="showSettings = false" class="close-btn">关闭</button>
      </div>
    </div>

    <!-- 安全区警告 -->
    <transition name="fade">
      <div v-if="!safetyZone.isInFrame" class="safety-warning">
        <div class="warning-icon">⚠️</div>
        <p>请确保全身在画面内</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePoseDetection } from '@/composables/usePoseDetection'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['start'])

const gameStore = useGameStore()
const videoElement = ref(null)
const canvas = ref(null)
const isLoading = ref(true)
const error = ref(null)
const showSettings = ref(false)
const performanceMode = ref('high')

// 身体部位检测状态
const bodyParts = ref({
  head: false,
  torso: false,
  leftArm: false,
  rightArm: false,
  leftLeg: false,
  rightLeg: false
})

// 安全区状态
const safetyZone = ref({
  isInFrame: true,
  headVisible: true,
  feetVisible: true
})

// 检测持续帧数
const detectionFrames = ref(0)
const requiredFrames = 30 // 需要持续30帧（约1秒）
const countdown = ref(3)
const canStart = ref(false)

// 初始化姿态检测
const { initialize, stop, normalizedToScreen } = usePoseDetection(
  videoElement,
  handlePoseResults
)

// 计算检测进度
const detectionProgress = computed(() => {
  const activeCount = Object.values(bodyParts.value).filter(Boolean).length
  return (activeCount / 6) * 100
})

// 是否检测到完整身体
const isBodyDetected = computed(() => {
  return Object.values(bodyParts.value).every(Boolean)
})

// 处理姿态检测结果
function handlePoseResults({ landmarks, image }) {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  const { width, height } = canvas.value

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  // 绘制视频帧（镜像）
  ctx.save()
  if (gameStore.isMirrored) {
    ctx.scale(-1, 1)
    ctx.drawImage(image, -width, 0, width, height)
  } else {
    ctx.drawImage(image, 0, 0, width, height)
  }
  ctx.restore()

  // 绘制骨架
  drawSkeleton(ctx, landmarks, width, height)

  // 检测身体部位
  detectBodyParts(landmarks, width, height)
}

// 绘制骨架
function drawSkeleton(ctx, landmarks, width, height) {
  const connections = [
    [11, 12], // 肩膀
    [11, 13], [13, 15], // 左臂
    [12, 14], [14, 16], // 右臂
    [11, 23], [12, 24], // 躯干
    [23, 24], // 臀部
    [23, 25], [25, 27], // 左腿
    [24, 26], [26, 28]  // 右腿
  ]

  ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
  ctx.lineWidth = 4

  for (const [start, end] of connections) {
    const startLm = normalizedToScreen(landmarks[start], width, height, gameStore.isMirrored)
    const endLm = normalizedToScreen(landmarks[end], width, height, gameStore.isMirrored)

    if (startLm.visibility > 0.5 && endLm.visibility > 0.5) {
      ctx.beginPath()
      ctx.moveTo(startLm.x, startLm.y)
      ctx.lineTo(endLm.x, endLm.y)
      ctx.stroke()
    }
  }

  // 绘制关节点
  for (const lm of landmarks) {
    const point = normalizedToScreen(lm, width, height, gameStore.isMirrored)
    if (point.visibility > 0.5) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'
      ctx.fill()
    }
  }
}

// 检测身体部位是否在引导框内
function detectBodyParts(landmarks, width, height) {
  const check = (index, targetX, targetY, tolerance = 0.15) => {
    const lm = landmarks[index]
    if (!lm || lm.visibility < 0.5) return false

    const dx = Math.abs(lm.x - targetX)
    const dy = Math.abs(lm.y - targetY)

    return dx < tolerance && dy < tolerance
  }

  // 归一化目标位置（基于400x600的SVG坐标）
  const targetX = 0.5 // 中央
  const targets = {
    head: { x: 0.5, y: 0.13 },      // 80/600
    torso: { x: 0.5, y: 0.38 },     // 230/600
    leftArm: { x: 0.23, y: 0.38 },  // 左臂中心
    rightArm: { x: 0.77, y: 0.38 }, // 右臂中心
    leftLeg: { x: 0.4, y: 0.72 },   // 左腿中心
    rightLeg: { x: 0.6, y: 0.72 }   // 右腿中心
  }

  bodyParts.value = {
    head: check(0, targets.head.x, targets.head.y),
    torso: check(11, targets.torso.x, targets.torso.y) && check(12, targets.torso.x, targets.torso.y),
    leftArm: check(15, targets.leftArm.x, targets.leftArm.y),
    rightArm: check(16, targets.rightArm.x, targets.rightArm.y),
    leftLeg: check(27, targets.leftLeg.x, targets.leftLeg.y),
    rightLeg: check(28, targets.rightLeg.x, targets.rightLeg.y)
  }

  // 更新检测帧数
  if (isBodyDetected.value) {
    detectionFrames.value++
  } else {
    detectionFrames.value = 0
    canStart.value = false
  }

  // 检测完成，开始倒计时
  if (detectionFrames.value >= requiredFrames && !canStart.value) {
    startCountdown()
  }
}

// 开始倒计时
function startCountdown() {
  countdown.value = 3
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      canStart.value = true
    }
  }, 1000)
}

// 开始游戏
function handleStart() {
  emit('start')
}

// 镜像切换
function toggleMirror() {
  gameStore.toggleMirror()
}

// 重试
function retry() {
  error.value = null
  initialize()
}

// 监听性能模式
watch(performanceMode, (mode) => {
  gameStore.setPerformanceMode(mode)
})

// 初始化
onMounted(async () => {
  try {
    // 设置画布尺寸
    if (canvas.value && videoElement.value) {
      canvas.value.width = 1280
      canvas.value.height = 720
    }

    await initialize()
  } catch (e) {
    error.value = e
    isLoading.value = false
  }
})

onUnmounted(() => {
  stop()
})
</script>

<style scoped>
.position-guide {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  overflow: hidden;
}

.hidden-video {
  display: none;
}

.guide-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.guide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.guide-title {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40px;
  text-shadow: 0 0 20px rgba(100, 200, 255, 0.5);
}

.loading,
.error {
  text-align: center;
  color: #fff;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #64c8ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 20px;
  padding: 12px 30px;
  font-size: 18px;
  background: #64c8ff;
  color: #000;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  pointer-events: auto;
}

.guide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

.body-guide {
  width: 300px;
  height: 450px;
}

.body-part {
  fill: rgba(255, 255, 255, 0.1);
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 2;
  transition: all 0.3s ease;
}

.body-part.active {
  fill: rgba(100, 200, 255, 0.4);
  stroke: #64c8ff;
  stroke-width: 3;
}

.guide-instruction {
  margin-top: 30px;
  text-align: center;
}

.instruction-text {
  font-size: 32px;
  color: #fff;
  margin-bottom: 10px;
}

.instruction-text.success {
  color: #4ade80;
}

.instruction-hint {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.detection-progress {
  width: 300px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-top: 30px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #64c8ff, #4ade80);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.start-btn {
  margin-top: 40px;
  padding: 20px 60px;
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.4);
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(74, 222, 128, 0.6);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.settings-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.3s;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-content {
  width: 400px;
  background: #1a1a2e;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.settings-content h2 {
  color: #fff;
  margin-bottom: 30px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.setting-item label {
  color: #fff;
  font-size: 18px;
}

.toggle-btn,
.select-input {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
}

.toggle-btn.active {
  background: #64c8ff;
  color: #000;
}

.close-btn {
  width: 100%;
  padding: 15px;
  background: #64c8ff;
  color: #000;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 20px;
}

.safety-warning {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(239, 68, 68, 0.9);
  padding: 30px 50px;
  border-radius: 20px;
  text-align: center;
  pointer-events: none;
}

.warning-icon {
  font-size: 60px;
  margin-bottom: 10px;
}

.safety-warning p {
  color: #fff;
  font-size: 24px;
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
