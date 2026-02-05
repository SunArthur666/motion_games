<template>
  <div class="statistics-panel">
    <div class="panel-content">
      <h2 class="title">数据统计</h2>

      <section class="stats-section">
        <h3 class="section-title">📊 游戏数据</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ gameStore.statistics.totalGamesPlayed || 0 }}</span>
            <span class="stat-label">总对局数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ gameStore.statistics.totalCorrect || 0 }}</span>
            <span class="stat-label">正确次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ gameStore.statistics.totalWrong || 0 }}</span>
            <span class="stat-label">错误次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ accuracyText }}</span>
            <span class="stat-label">正确率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ gameStore.statistics.bestStreak || 0 }}</span>
            <span class="stat-label">最佳连击</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ gameStore.totalStars }}</span>
            <span class="stat-label">累计星星</span>
          </div>
          <div class="stat-item stat-item-wide">
            <span class="stat-value">{{ playTimeText }}</span>
            <span class="stat-label">总游戏时长</span>
          </div>
        </div>
      </section>

      <section class="achievements-section">
        <h3 class="section-title">🏆 成就</h3>
        <div class="achievements-grid">
          <div
            v-for="a in gameStore.achievementProgress"
            :key="a.id"
            class="achievement-card"
            :class="{ unlocked: a.unlocked }"
          >
            <div class="achievement-icon">{{ a.icon }}</div>
            <div class="achievement-info">
              <div class="achievement-name">{{ a.name }}</div>
              <div class="achievement-desc">{{ a.description }}</div>
            </div>
            <div v-if="a.unlocked" class="achievement-badge">✓</div>
          </div>
        </div>
      </section>

      <button @click="close" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['close'])

const gameStore = useGameStore()

const accuracyText = computed(() => {
  const c = gameStore.statistics.totalCorrect || 0
  const w = gameStore.statistics.totalWrong || 0
  const total = c + w
  if (total === 0) return '—'
  return `${Math.round((c / total) * 100)}%`
})

const playTimeText = computed(() => {
  const ms = gameStore.statistics?.totalPlayTime ?? gameStore.totalPlayTime ?? 0
  if (ms < 60000) return `${Math.round(ms / 1000)} 秒`
  const min = Math.floor(ms / 60000)
  const sec = Math.round((ms % 60000) / 1000)
  return sec ? `${min} 分 ${sec} 秒` : `${min} 分钟`
})

function close() {
  emit('close')
}
</script>

<style scoped>
.statistics-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: saturate(180%) blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.panel-content {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-md);
}

.stats-section {
  margin-bottom: var(--apple-space-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--apple-space-md);
}

.stat-item {
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius);
  padding: var(--apple-space-md);
  text-align: center;
}

.stat-item-wide {
  grid-column: 1 / -1;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--apple-text-tertiary);
}

.achievements-section {
  margin-bottom: var(--apple-space-lg);
}

.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-sm);
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: var(--apple-space-md);
  padding: var(--apple-space-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius);
  border: 1px solid var(--apple-border);
}

.achievement-card.unlocked {
  background: rgba(52, 199, 89, 0.08);
  border-color: rgba(52, 199, 89, 0.3);
}

.achievement-icon {
  font-size: 32px;
  opacity: 0.5;
}

.achievement-card.unlocked .achievement-icon {
  opacity: 1;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--apple-text);
}

.achievement-desc {
  font-size: 13px;
  color: var(--apple-text-secondary);
  margin-top: 4px;
}

.achievement-badge {
  width: 28px;
  height: 28px;
  background: var(--apple-green, #34c759);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
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
