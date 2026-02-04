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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.profile-content {
  width: 90%;
  max-width: 500px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 30px;
  text-align: center;
}

.current-user {
  margin-bottom: 30px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  margin-bottom: 15px;
}

.user-icon {
  font-size: 32px;
}

.user-name {
  font-size: 20px;
  color: #fff;
  font-weight: bold;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 2px solid #ef4444;
  border-radius: 15px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.login-section {
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: #fff;
  font-size: 16px;
  margin-bottom: 10px;
}

.username-input {
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  color: #fff;
  font-size: 16px;
}

.username-input:focus {
  outline: none;
  border-color: #64c8ff;
}

.hint {
  padding: 15px;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 15px;
  margin-bottom: 20px;
}

.hint p {
  margin: 5px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 15px;
}

.login-btn,
.skip-btn {
  flex: 1;
  padding: 15px;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
}

.login-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skip-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.skip-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.history-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  color: #fff;
  margin-bottom: 15px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 10px;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 5px;
}

.history-game {
  color: #64c8ff;
  font-weight: bold;
}

.history-level {
  color: rgba(255, 255, 255, 0.7);
}

.history-stars {
  color: #ffd700;
  font-weight: bold;
}

.history-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.close-btn {
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
