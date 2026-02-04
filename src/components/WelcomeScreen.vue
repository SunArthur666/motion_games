<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <!-- Logo 和标题 -->
      <div class="logo-section">
        <div class="logo-icon">🎮</div>
        <h1 class="game-title">体感小游戏</h1>
        <p class="game-subtitle">全身互动 · 健康娱乐</p>
      </div>

      <!-- 游戏特色 -->
      <div class="features">
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <span class="feature-text">捕捉色彩</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🏃</span>
          <span class="feature-text">躲避障碍</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🦸</span>
          <span class="feature-text">模仿姿势</span>
        </div>
      </div>

      <!-- 玩法说明 -->
      <div class="how-to-play">
        <h2>怎么玩？</h2>
        <div class="steps">
          <div class="step">
            <span class="step-number">1</span>
            <span class="step-text">站到屏幕中央，全身显示在画面内</span>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <span class="step-text">用手触碰屏幕上的气球和道具</span>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <span class="step-text">配合身体动作完成关卡挑战</span>
          </div>
        </div>
      </div>

      <!-- 温馨提示 -->
      <div class="tips">
        <p>💡 请确保摄像头已允许访问</p>
        <p>💡 建议投屏到电视获得更好体验</p>
        <p>💡 每15分钟会自动提醒休息</p>
      </div>

      <!-- 难度选择 -->
      <div class="difficulty-selector">
        <span class="difficulty-label">游戏难度：</span>
        <div class="difficulty-options">
          <button
            v-for="mode in difficultyModes"
            :key="mode.id"
            class="difficulty-btn"
            :class="{ active: gameStore.userDifficulty === mode.id }"
            :style="{ '--color': mode.color }"
            @click="selectDifficulty(mode.id)"
          >
            <span class="mode-icon">{{ mode.icon }}</span>
            <span class="mode-name">{{ mode.name }}</span>
          </button>
        </div>
        <p class="difficulty-desc">{{ currentDifficultyDesc }}</p>
      </div>

      <!-- 开始按钮 -->
      <button @click="handleStart" class="start-btn">
        <span>开始游戏</span>
        <span class="arrow">→</span>
      </button>

      <!-- 鼠标体验模式入口 -->
      <div class="mouse-mode-entry">
        <p class="mouse-hint">没有摄像头？</p>
        <button @click="handleMouseMode" class="mouse-btn">
          <span>🖱️ 鼠标体验模式</span>
        </button>
      </div>

      <!-- 用户入口 -->
      <div class="user-link" @click="showUserProfile = true">
        <span v-if="gameStore.currentUser">👤 {{ gameStore.currentUser }}</span>
        <span v-else>👤 用户设置</span>
      </div>

      <!-- 设置入口 -->
      <div class="settings-link" @click="showQuickSettings = true">
        <span>⚙️ 设置</span>
      </div>
    </div>

    <!-- 用户设置弹窗 -->
    <UserProfile
      v-if="showUserProfile"
      @close="showUserProfile = false"
      @login="handleUserLogin"
    />

    <!-- 快速设置弹窗 -->
    <transition name="fade">
      <div v-if="showQuickSettings" class="quick-settings" @click.self="showQuickSettings = false">
        <div class="settings-content">
          <h2>快速设置</h2>

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

          <button @click="showQuickSettings = false" class="close-btn">完成</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { USER_DIFFICULTY_MODES } from '@/config/levelConfig'
import UserProfile from '@/components/UserProfile.vue'

const emit = defineEmits(['start', 'mouseMode'])

const gameStore = useGameStore()
const showQuickSettings = ref(false)
const showUserProfile = ref(false)
const performanceMode = ref(gameStore.performanceMode)

// 加载用户信息
onMounted(() => {
  const saved = localStorage.getItem('motion-games-current-user')
  if (saved) {
    gameStore.setCurrentUser(saved)
  }
})

function handleUserLogin(username) {
  gameStore.setCurrentUser(username)
}

const difficultyModes = Object.values(USER_DIFFICULTY_MODES)
const currentDifficultyDesc = computed(() => {
  const mode = USER_DIFFICULTY_MODES[gameStore.userDifficulty]
  return mode ? mode.description : ''
})

function handleStart() {
  emit('start')
}

function handleMouseMode() {
  emit('mouseMode')
}

function toggleMirror() {
  gameStore.toggleMirror()
}

function selectDifficulty(id) {
  gameStore.setUserDifficulty(id)
}

watch(performanceMode, (mode) => {
  gameStore.setPerformanceMode(mode)
})
</script>

<style scoped>
.welcome-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);
  overflow-y: auto;
  padding: 20px;
}

.welcome-content {
  max-width: 600px;
  text-align: center;
}

.logo-section {
  margin-bottom: 50px;
}

.logo-icon {
  font-size: 100px;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.game-title {
  font-size: 56px;
  font-weight: bold;
  background: linear-gradient(135deg, #64c8ff 0%, #4ade80 50%, #ffd93d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.game-subtitle {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
}

.features {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 50px;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  min-width: 120px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 48px;
}

.feature-text {
  color: #fff;
  font-size: 18px;
}

.how-to-play {
  background: rgba(100, 200, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  text-align: left;
}

.how-to-play h2 {
  color: #64c8ff;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.step {
  display: flex;
  align-items: center;
  gap: 15px;
}

.step-number {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #64c8ff, #4ade80);
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-text {
  color: #fff;
  font-size: 16px;
}

.tips {
  margin-bottom: 40px;
}

.tips p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-bottom: 8px;
}

.start-btn {
  padding: 20px 80px;
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 0 40px rgba(74, 222, 128, 0.4);
  transition: all 0.3s;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 50px rgba(74, 222, 128, 0.6);
}

.start-btn .arrow {
  font-size: 24px;
  transition: transform 0.3s;
}

.start-btn:hover .arrow {
  transform: translateX(5px);
}

.mouse-mode-entry {
  margin-top: 25px;
  text-align: center;
}

.mouse-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin-bottom: 10px;
}

.mouse-btn {
  padding: 12px 25px;
  font-size: 16px;
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
  border: 2px solid rgba(255, 152, 0, 0.3);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.mouse-btn:hover {
  background: rgba(255, 152, 0, 0.3);
  border-color: #ff9800;
  transform: scale(1.02);
}

.user-link,
.settings-link {
  margin-top: 15px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;
}

.user-link:hover,
.settings-link:hover {
  color: #64c8ff;
}

.quick-settings {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 难度选择 */
.difficulty-selector {
  margin-bottom: 30px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.difficulty-label {
  color: #fff;
  font-size: 18px;
  display: block;
  margin-bottom: 15px;
}

.difficulty-options {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.difficulty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.05);
  border: 3px solid transparent;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
}

.difficulty-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-3px);
}

.difficulty-btn.active {
  border-color: var(--color);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 20px var(--color);
}

.mode-icon {
  font-size: 32px;
}

.mode-name {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.difficulty-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0;
}
</style>
