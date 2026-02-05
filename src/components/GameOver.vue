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
  // 如果有subLevel，检查是否有下一关
  if (props.result.subLevel !== undefined) {
    // 这里可以添加检查下一关是否解锁的逻辑
    return isSuccess.value && props.result.subLevel < 6
  }
  return isSuccess.value && props.result.level < 3
})

function getStarsText(stars) {
  const texts = {
    3: '完美通关！',
    2: '表现优秀！',
    1: '继续努力！'
  }
  return texts[stars] || '完成关卡！'
}

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
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: saturate(180%) blur(12px);
  animation: fadeIn 0.35s var(--apple-ease, ease);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-content {
  width: 90%;
  max-width: 480px;
  background: var(--apple-bg-tertiary, #fff);
  border-radius: var(--apple-radius-lg, 18px);
  padding: var(--apple-space-xl) var(--apple-space-lg);
  text-align: center;
  box-shadow: var(--apple-shadow-lg);
}

.result-icon {
  font-size: 64px;
  margin-bottom: var(--apple-space-md);
  animation: pop 0.4s var(--apple-ease, ease);
}

@keyframes pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-lg);
}

.stars-section {
  margin-bottom: var(--apple-space-lg);
}

.stars-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--apple-text-secondary);
  margin-bottom: var(--apple-space-sm);
}

.stars-display-large {
  display: flex;
  justify-content: center;
  gap: var(--apple-space-xs);
  margin-bottom: var(--apple-space-xs);
}

.star-large {
  font-size: 28px;
  opacity: 0.2;
}

.star-large.filled {
  opacity: 1;
}

.stars-text {
  font-size: 15px;
  color: var(--apple-text-secondary);
}

.score-section {
  display: flex;
  justify-content: center;
  gap: var(--apple-space-xl);
  margin-bottom: var(--apple-space-lg);
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 13px;
  color: var(--apple-text-tertiary);
  margin-bottom: 4px;
}

.score-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--apple-text);
}

.achievements {
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius);
  padding: var(--apple-space-md);
  margin-bottom: var(--apple-space-lg);
}

.achievements h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-sm);
}

.achievement-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apple-space-sm);
  justify-content: center;
}

.achievement {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--apple-bg-tertiary);
  border-radius: var(--apple-radius-full, 980px);
  color: var(--apple-text);
  font-size: 13px;
  border: 1px solid var(--apple-border);
}

.achievement-icon {
  font-size: 16px;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--apple-space-md);
  margin-bottom: var(--apple-space-lg);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  font-size: 15px;
  font-weight: 500;
  background: var(--apple-bg-secondary);
  color: var(--apple-text);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius);
  cursor: pointer;
  transition: background var(--apple-duration), border-color var(--apple-duration);
}

.action-btn:hover {
  background: var(--apple-bg);
  border-color: var(--apple-text-tertiary);
}

.action-btn.primary {
  background: var(--apple-text);
  border: none;
  color: #fff;
  grid-column: span 2;
}

.action-btn.primary:hover {
  opacity: 0.92;
  color: #fff;
}

.action-btn.secondary {
  background: var(--apple-link);
  border: none;
  color: #fff;
}

.action-btn.secondary:hover {
  opacity: 0.9;
  color: #fff;
}

.action-btn.danger {
  border-color: var(--apple-red, #ff3b30);
  color: var(--apple-red, #ff3b30);
}

.action-btn span:first-child {
  font-size: 20px;
}

.stats {
  color: var(--apple-text-tertiary);
  font-size: 13px;
}

.stats p {
  margin: 0;
}

.star-large.animate {
  animation: starPop 0.4s var(--apple-ease, ease) forwards;
}

@keyframes starPop {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
