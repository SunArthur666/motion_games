<template>
  <div class="game-over">
    <div class="result-content">
      <!-- 结果图标 -->
      <div class="result-icon">
        {{ isSuccess ? '🎉' : '😢' }}
      </div>

      <!-- 结果标题 -->
      <h1 class="result-title">{{ resultTitle }}</h1>

      <!-- 星级评价 -->
      <div v-if="result.stars" class="stars-section">
        <h3 class="stars-title">关卡评价</h3>
        <div class="stars-display-large">
          <span
            v-for="i in 3"
            :key="i"
            class="star-large"
            :class="{ 
              filled: i <= result.stars,
              animate: i <= result.stars
            }"
            :style="{ animationDelay: `${i * 0.1}s` }"
          >
            ⭐
          </span>
        </div>
        <p class="stars-text">{{ getStarsText(result.stars) }}</p>
      </div>

      <!-- 分数展示 -->
      <div class="score-section">
        <div class="score-item">
          <span class="score-label">得分</span>
          <span class="score-value">{{ displayScore }}</span>
        </div>

        <div v-if="result.time" class="score-item">
          <span class="score-label">用时</span>
          <span class="score-value">{{ formatTime(result.time) }}</span>
        </div>

        <div v-if="result.completed !== undefined" class="score-item">
          <span class="score-label">完成</span>
          <span class="score-value">{{ result.completed }}/{{ result.total }}</span>
        </div>

        <div v-if="result.accuracy !== undefined" class="score-item">
          <span class="score-label">准确率</span>
          <span class="score-value">{{ Math.round(result.accuracy * 100) }}%</span>
        </div>
      </div>

      <!-- 成就展示 -->
      <div v-if="result.achievements && result.achievements.length > 0" class="achievements">
        <h3>解锁成就</h3>
        <div class="achievement-list">
          <div v-for="achievement in result.achievements" :key="achievement.id" class="achievement">
            <span class="achievement-icon">{{ achievement.icon }}</span>
            <span class="achievement-name">{{ achievement.name }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button @click="restart" class="action-btn primary">
          <span>🔄</span>
          <span>再玩一次</span>
        </button>

        <button v-if="canNextLevel" @click="nextLevel" class="action-btn secondary">
          <span>→</span>
          <span>下一关</span>
        </button>

        <button @click="levelSelect" class="action-btn">
          <span>📋</span>
          <span>选择关卡</span>
        </button>

        <button @click="goHome" class="action-btn">
          <span>🏠</span>
          <span>返回首页</span>
        </button>
      </div>

      <!-- 数据统计 -->
      <div class="stats">
        <p>本次运动消耗约 {{ calculateCalories() }} 千卡</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['action'])

const isSuccess = computed(() => {
  return props.result && (props.result.completed > 0 || props.result.score > 0)
})

const resultTitle = computed(() => {
  if (!props.result) return '游戏结束'
  if (props.result.completed !== undefined) {
    return props.result.completed >= 3 ? '太棒了！' : '继续努力！'
  }
  return props.result.score > 500 ? '表现不错！' : '游戏结束'
})

const displayScore = computed(() => {
  return props.result?.score?.toLocaleString() || '0'
})

const canNextLevel = computed(() => {
  return isSuccess.value && props.result.level < 3
})

function formatTime(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function calculateCalories() {
  const time = props.result?.time || 0
  // 粗略估算：每分钟消耗 5-8 千卡
  return Math.floor(time / 60 * 6.5)
}

function restart() {
  emit('action', 'restart')
}

function nextLevel() {
  emit('action', 'next-level')
}

function levelSelect() {
  emit('action', 'level-select')
}

function goHome() {
  emit('action', 'home')
}
</script>

<style scoped>
.game-over {
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
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-content {
  width: 90%;
  max-width: 500px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 30px;
  padding: 50px 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(100, 200, 255, 0.2);
}

.result-icon {
  font-size: 100px;
  margin-bottom: 20px;
  animation: pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.result-title {
  font-size: 42px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40px;
}

.score-section {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
  color: #4ade80;
}

.achievements {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
}

.achievements h3 {
  color: #ffd93d;
  font-size: 18px;
  margin-bottom: 15px;
}

.achievement-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.achievement {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: rgba(255, 217, 61, 0.1);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
}

.achievement-icon {
  font-size: 20px;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  border: none;
  color: #000;
  grid-column: span 2;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #64c8ff, #3b82f6);
  border: none;
  color: #000;
}

.action-btn span:first-child {
  font-size: 28px;
}

.stats {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.stats p {
  margin: 0;
}
</style>
