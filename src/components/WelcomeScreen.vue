<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <div class="logo-section">
        <div class="logo-icon">🎮</div>
        <h1 class="game-title">体感小游戏</h1>
        <p class="game-subtitle">全身互动，健康娱乐</p>
      </div>

      <!-- 账号 / 匿名：主页显眼入口 -->
      <section class="section account-section">
        <h2 class="section-title">账号</h2>
        <div class="account-actions">
          <button
            class="account-btn primary"
            @click="showUserProfile = true"
          >
            <span class="account-icon">👤</span>
            <span>{{ gameStore.currentUser ? `已登录：${gameStore.currentUser}` : '账号登录' }}</span>
          </button>
          <button
            v-if="gameStore.currentUser"
            class="account-btn secondary"
            @click="handleAnonymousPlay"
          >
            <span class="account-icon">🎮</span>
            <span>切换匿名游玩</span>
          </button>
          <p v-else class="account-hint">匿名游玩不保存进度，直接点「开始游戏」即可</p>
        </div>
      </section>

      <div class="features">
        <div class="feature-item">
          <span class="feature-icon">🎨</span>
          <span class="feature-text">色彩大作战</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🏃</span>
          <span class="feature-text">障碍躲避</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🦸</span>
          <span class="feature-text">姿势临摹</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔢</span>
          <span class="feature-text">数字识别</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🥊</span>
          <span class="feature-text">有氧拳击</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">💪</span>
          <span class="feature-text">健身环</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎾</span>
          <span class="feature-text">运动网球</span>
        </div>
      </div>

      <section class="section how-to-play">
        <h2 class="section-title">怎么玩</h2>
        <div class="steps">
          <div class="step">
            <span class="step-num">1</span>
            <span class="step-text">站到屏幕中央，全身入画</span>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <span class="step-text">用手触碰屏幕上的气球与道具</span>
          </div>
          <div class="step">
            <span class="step-num">3</span>
            <span class="step-text">配合身体动作完成关卡</span>
          </div>
        </div>
      </section>

      <div class="tips">
        <p>请确保已允许摄像头访问</p>
        <p>建议投屏到电视体验更佳</p>
        <p>每 15 分钟会提醒休息</p>
      </div>

      <div class="difficulty-selector">
        <span class="difficulty-label">难度</span>
        <div class="difficulty-options">
          <button
            v-for="mode in difficultyModes"
            :key="mode.id"
            class="difficulty-btn"
            :class="{ active: gameStore.userDifficulty === mode.id }"
            @click="selectDifficulty(mode.id)"
          >
            <span class="mode-icon">{{ mode.icon }}</span>
            <span class="mode-name">{{ mode.name }}</span>
          </button>
        </div>
        <p class="difficulty-desc">{{ currentDifficultyDesc }}</p>
      </div>

      <button @click="handleStart" class="start-btn">
        <span>开始游戏</span>
        <span class="arrow">→</span>
      </button>

      <div class="mouse-mode-entry">
        <button @click="handleMouseMode" class="link-btn">没有摄像头？使用鼠标体验</button>
      </div>

      <nav class="nav-links">
        <button @click="showUserProfile = true" class="nav-link">
          {{ gameStore.currentUser ? gameStore.currentUser : '用户' }}
        </button>
        <button @click="showStatistics = true" class="nav-link">统计</button>
        <button @click="showQuickSettings = true" class="nav-link">设置</button>
      </nav>
    </div>

    <UserProfile v-if="showUserProfile" @close="showUserProfile = false" @login="handleUserLogin" />
    <StatisticsPanel v-if="showStatistics" @close="showStatistics = false" />

    <transition name="fade">
      <div v-if="showQuickSettings" class="modal-overlay" @click.self="showQuickSettings = false">
        <div class="modal-card">
          <h2 class="modal-title">设置</h2>
          <div class="setting-item">
            <label>镜像模式</label>
            <button
              @click="toggleMirror"
              class="toggle-btn"
              :class="{ active: gameStore.isMirrored }"
            >
              {{ gameStore.isMirrored ? '开' : '关' }}
            </button>
          </div>
          <div class="setting-item">
            <label>性能</label>
            <select v-model="performanceMode" class="select-input">
              <option value="high">高</option>
              <option value="low">低</option>
            </select>
          </div>
          <button @click="showQuickSettings = false" class="modal-btn">完成</button>
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
import StatisticsPanel from '@/components/StatisticsPanel.vue'

const emit = defineEmits(['start', 'mouseMode'])
const gameStore = useGameStore()
const showQuickSettings = ref(false)
const showUserProfile = ref(false)
const showStatistics = ref(false)
const performanceMode = ref(gameStore.performanceMode)

onMounted(() => {
  const saved = localStorage.getItem('motion-games-current-user')
  if (saved) gameStore.setCurrentUser(saved)
})

function handleUserLogin(username) {
  gameStore.setCurrentUser(username)
}

function handleAnonymousPlay() {
  gameStore.setCurrentUser(null)
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
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--apple-bg);
  padding: var(--apple-space-xl) var(--apple-space-md);
  overflow-y: auto;
}

.welcome-content {
  max-width: 580px;
  width: 100%;
  text-align: center;
  padding-bottom: 48px;
}

.logo-section {
  margin-bottom: var(--apple-space-2xl);
}

.logo-icon {
  font-size: 72px;
  margin-bottom: var(--apple-space-lg);
  opacity: 0.95;
}

.game-title {
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-sm);
}

.game-subtitle {
  font-size: 21px;
  font-weight: 400;
  color: var(--apple-text-secondary);
}

.account-section {
  margin-bottom: var(--apple-space-xl);
}

.account-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--apple-space-md);
}

.account-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--apple-space-sm);
  padding: 14px 28px;
  font-size: 17px;
  font-weight: 500;
  border-radius: var(--apple-radius-xl);
  border: 1px solid var(--apple-border);
  background: var(--apple-bg-tertiary);
  color: var(--apple-text);
  cursor: pointer;
  transition: background var(--apple-duration), border-color var(--apple-duration), transform var(--apple-duration);
}

.account-btn.primary {
  background: var(--apple-link, #0071e3);
  color: #fff;
  border-color: var(--apple-link);
}

.account-btn.primary:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.account-btn.secondary:hover {
  background: var(--apple-bg-secondary);
  border-color: var(--apple-link);
}

.account-icon {
  font-size: 22px;
}

.account-hint {
  font-size: 14px;
  color: var(--apple-text-secondary);
  margin-top: 4px;
}

.features {
  display: flex;
  justify-content: center;
  gap: var(--apple-space-lg);
  margin-bottom: var(--apple-space-2xl);
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--apple-space-sm);
  padding: var(--apple-space-lg) var(--apple-space-xl);
  background: var(--apple-bg-tertiary);
  border-radius: var(--apple-radius-lg);
  box-shadow: var(--apple-shadow-sm);
  min-width: 120px;
  transition: transform var(--apple-duration) var(--apple-ease), box-shadow var(--apple-duration) var(--apple-ease);
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--apple-shadow);
}

.feature-icon {
  font-size: 40px;
}

.feature-text {
  font-size: 17px;
  font-weight: 500;
  color: var(--apple-text);
}

.section {
  text-align: left;
  margin-bottom: var(--apple-space-xl);
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-lg);
  text-align: center;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-md);
}

.step {
  display: flex;
  align-items: center;
  gap: var(--apple-space-md);
}

.step-num {
  width: 28px;
  height: 28px;
  background: var(--apple-text);
  color: var(--apple-bg);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  font-size: 17px;
  color: var(--apple-text-secondary);
}

.tips {
  margin-bottom: var(--apple-space-xl);
}

.tips p {
  font-size: 15px;
  color: var(--apple-text-tertiary);
  margin-bottom: var(--apple-space-xs);
}

.difficulty-selector {
  margin-bottom: var(--apple-space-xl);
  padding: var(--apple-space-lg);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-lg);
}

.difficulty-label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--apple-text-secondary);
  margin-bottom: var(--apple-space-md);
}

.difficulty-options {
  display: flex;
  justify-content: center;
  gap: var(--apple-space-md);
  margin-bottom: var(--apple-space-sm);
}

.difficulty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--apple-space-xs);
  padding: var(--apple-space-md) var(--apple-space-lg);
  background: var(--apple-bg-tertiary);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius);
  cursor: pointer;
  transition: border-color var(--apple-duration), background var(--apple-duration);
  min-width: 90px;
}

.difficulty-btn:hover {
  background: var(--apple-bg-secondary);
}

.difficulty-btn.active {
  border-color: var(--apple-link);
  background: rgba(0, 113, 227, 0.06);
}

.mode-icon {
  font-size: 24px;
}

.mode-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--apple-text);
}

.difficulty-desc {
  font-size: 13px;
  color: var(--apple-text-tertiary);
  margin: 0;
}

.start-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--apple-space-sm);
  width: 100%;
  max-width: 320px;
  padding: 18px 32px;
  font-size: 17px;
  font-weight: 500;
  color: #fff;
  background: var(--apple-text);
  border: none;
  border-radius: var(--apple-radius-xl);
  cursor: pointer;
  transition: opacity var(--apple-duration), transform var(--apple-duration);
}

.start-btn:hover {
  opacity: 0.9;
  transform: scale(1.01);
}

.start-btn .arrow {
  font-size: 18px;
  opacity: 0.9;
}

.mouse-mode-entry {
  margin-top: var(--apple-space-lg);
}

.link-btn {
  background: none;
  border: none;
  font-size: 15px;
  color: var(--apple-link);
  cursor: pointer;
  padding: var(--apple-space-sm);
  text-decoration: none;
}

.link-btn:hover {
  text-decoration: underline;
}

.nav-links {
  margin-top: var(--apple-space-xl);
  display: flex;
  justify-content: center;
  gap: var(--apple-space-lg);
}

.nav-link {
  background: none;
  border: none;
  font-size: 15px;
  color: var(--apple-text-secondary);
  cursor: pointer;
  padding: var(--apple-space-sm);
}

.nav-link:hover {
  color: var(--apple-link);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: saturate(180%) blur(12px);
}

.modal-card {
  width: 90%;
  max-width: 400px;
  background: var(--apple-bg-tertiary);
  border-radius: var(--apple-radius-lg);
  padding: var(--apple-space-xl);
  box-shadow: var(--apple-shadow-lg);
}

.modal-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-lg);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--apple-space-md);
}

.setting-item label {
  font-size: 17px;
  color: var(--apple-text);
}

.toggle-btn,
.select-input {
  padding: 8px 16px;
  background: var(--apple-bg-secondary);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius-sm);
  font-size: 15px;
  color: var(--apple-text);
  cursor: pointer;
}

.toggle-btn.active {
  background: var(--apple-link);
  color: #fff;
  border-color: var(--apple-link);
}

.modal-btn {
  width: 100%;
  margin-top: var(--apple-space-lg);
  padding: 14px;
  font-size: 17px;
  font-weight: 500;
  color: #fff;
  background: var(--apple-text);
  border: none;
  border-radius: var(--apple-radius);
  cursor: pointer;
}

.modal-btn:hover {
  opacity: 0.9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--apple-duration) var(--apple-ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
