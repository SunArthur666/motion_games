<template>
  <div class="user-profile">
    <div class="profile-content">
      <h2 class="title">用户设置</h2>
      
      <!-- 当前用户信息 -->
      <div v-if="currentUser" class="current-user">
        <div class="user-info">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ currentUser }}</span>
        </div>
        <button @click="logout" class="logout-btn">退出登录</button>
      </div>

      <!-- 登录/注册 -->
      <div v-else class="login-section">
        <div class="input-group">
          <label>用户名：</label>
          <input
            v-model="username"
            type="text"
            placeholder="输入用户名（可选）"
            maxlength="20"
            class="username-input"
            @keyup.enter="login"
          />
        </div>
        <div class="hint">
          <p>💡 输入用户名可以保存游戏进度</p>
          <p>💡 不输入则匿名游玩，不保存历史</p>
        </div>
        <div class="actions">
          <button @click="login" class="login-btn" :disabled="!username.trim()">
            开始游戏
          </button>
          <button @click="skipLogin" class="skip-btn">
            匿名游玩
          </button>
        </div>
      </div>

      <!-- 历史记录（仅登录用户） -->
      <div v-if="currentUser && gameHistory.length > 0" class="history-section">
        <h3 class="section-title">游戏历史</h3>
        <div class="history-list">
          <div
            v-for="(record, index) in gameHistory"
            :key="index"
            class="history-item"
          >
            <div class="history-info">
              <span class="history-game">{{ getGameName(record.gameType) }}</span>
              <span class="history-level">{{ record.levelName }}</span>
              <span class="history-stars">⭐ {{ record.stars }}</span>
            </div>
            <div class="history-time">{{ formatTime(record.timestamp) }}</div>
          </div>
        </div>
      </div>

      <button @click="close" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['close', 'login'])

const gameStore = useGameStore()
const username = ref('')
const currentUser = ref(null)
const gameHistory = ref([])

// 加载用户信息
onMounted(() => {
  loadUser()
  if (currentUser.value) {
    loadHistory()
  }
})

function loadUser() {
  try {
    const saved = localStorage.getItem('motion-games-current-user')
    if (saved) {
      currentUser.value = saved
    }
  } catch (e) {
    console.warn('Failed to load user:', e)
  }
}

function loadHistory() {
  try {
    const key = `motion-games-history-${currentUser.value}`
    const saved = localStorage.getItem(key)
    if (saved) {
      gameHistory.value = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load history:', e)
  }
}

function login() {
  if (!username.value.trim()) return
  
  currentUser.value = username.value.trim()
  localStorage.setItem('motion-games-current-user', currentUser.value)
  loadHistory()
  emit('login', currentUser.value)
  close()
}

function skipLogin() {
  currentUser.value = null
  localStorage.removeItem('motion-games-current-user')
  emit('login', null)
  close()
}

function logout() {
  currentUser.value = null
  localStorage.removeItem('motion-games-current-user')
  gameHistory.value = []
}

function close() {
  emit('close')
}

function getGameName(gameType) {
  const names = { 1: '色彩大作战', 2: '障碍躲避', 3: '姿势临摹' }
  return names[gameType] || '未知游戏'
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.user-profile {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: saturate(180%) blur(12px);
}

.profile-content {
  width: 90%;
  max-width: 500px;
  background: var(--apple-bg-tertiary, #fff);
  border-radius: var(--apple-radius-lg, 18px);
  padding: var(--apple-space-xl);
  box-shadow: var(--apple-shadow-lg);
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-lg);
  text-align: center;
}

.current-user {
  margin-bottom: var(--apple-space-lg);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--apple-space-md);
  padding: var(--apple-space-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius);
  margin-bottom: var(--apple-space-md);
}

.user-name {
  font-size: 17px;
  color: var(--apple-text);
  font-weight: 600;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: var(--apple-red, #ff3b30);
  border: 1px solid var(--apple-red, #ff3b30);
  border-radius: var(--apple-radius);
  cursor: pointer;
  font-size: 15px;
}

.logout-btn:hover {
  background: rgba(255, 59, 48, 0.08);
}

.login-section {
  margin-bottom: var(--apple-space-lg);
}

.input-group label {
  display: block;
  color: var(--apple-text);
  font-size: 15px;
  margin-bottom: 8px;
}

.username-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--apple-bg);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius);
  color: var(--apple-text);
  font-size: 17px;
}

.username-input:focus {
  outline: none;
  border-color: var(--apple-link);
}

.hint {
  padding: var(--apple-space-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius);
  margin-bottom: var(--apple-space-md);
}

.hint p {
  margin: 4px 0;
  color: var(--apple-text-secondary);
  font-size: 14px;
}

.actions {
  display: flex;
  gap: var(--apple-space-md);
}

.login-btn,
.skip-btn {
  flex: 1;
  padding: 14px;
  border-radius: var(--apple-radius);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.login-btn {
  background: var(--apple-text);
  color: #fff;
  border: none;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.92;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skip-btn {
  background: var(--apple-bg-secondary);
  color: var(--apple-text);
  border: 1px solid var(--apple-border);
}

.skip-btn:hover {
  background: var(--apple-bg);
}

.history-section {
  margin-bottom: var(--apple-space-lg);
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-md);
}

.history-list {
  max-height: 280px;
  overflow-y: auto;
}

.history-item {
  padding: var(--apple-space-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-sm);
  margin-bottom: var(--apple-space-sm);
}

.history-game {
  color: var(--apple-link);
  font-weight: 600;
}

.history-level {
  color: var(--apple-text-secondary);
}

.history-stars {
  color: var(--apple-text);
  font-weight: 500;
}

.history-time {
  color: var(--apple-text-tertiary);
  font-size: 12px;
}

.close-btn {
  width: 100%;
  padding: 14px;
  background: var(--apple-bg-secondary);
  color: var(--apple-text);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius);
  cursor: pointer;
  font-size: 15px;
}

.close-btn:hover {
  background: var(--apple-bg);
}
</style>
