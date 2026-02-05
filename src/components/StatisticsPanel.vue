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
  background: rgba(0, 0, 0, 0.9);
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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 24px;
  text-align: center;
}

.section-title {
  font-size: 18px;
  color: #64c8ff;
  margin-bottom: 16px;
}

.stats-section {
  margin-bottom: 28px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-item-wide {
  grid-column: 1 / -1;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.achievements-section {
  margin-bottom: 24px;
}

.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 2px solid transparent;
}

.achievement-card.unlocked {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.4);
}

.achievement-icon {
  font-size: 36px;
  opacity: 0.6;
}

.achievement-card.unlocked .achievement-icon {
  opacity: 1;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.achievement-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.achievement-badge {
  width: 28px;
  height: 28px;
  background: #4ade80;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.close-btn {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
