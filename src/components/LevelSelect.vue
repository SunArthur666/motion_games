<template>
  <div class="level-select">
    <div class="select-content">
      <!-- 游戏类型选择 -->
      <template v-if="!selectedGameType">
        <h1 class="title">选择游戏</h1>
        <div class="game-types-grid">
          <div
            v-for="gameType in gameTypes"
            :key="gameType.id"
            class="game-type-card"
            @click="selectGameType(gameType)"
          >
            <div class="game-icon" :style="{ color: gameType.color }">
              {{ gameType.icon }}
            </div>
            <div class="game-info">
              <h3 class="game-name">{{ gameType.name }}</h3>
              <p class="game-desc">{{ gameType.description }}</p>
              <div class="game-stats">
                <span class="total-stars">
                  ⭐ {{ getGameTotalStars(gameType.id) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 子关卡选择 -->
      <template v-else>
        <div class="sub-level-header">
          <button @click="backToGameTypes" class="back-to-games-btn">
            ← 返回游戏选择
          </button>
          <h1 class="title">{{ selectedGameType.name }}</h1>
          <p class="subtitle">共 {{ subLevels.length }} 个关卡</p>
        </div>

        <div class="sub-levels-grid">
          <div
            v-for="subLevel in subLevels"
            :key="subLevel.id"
            class="sub-level-card"
            :class="{ 
              locked: !subLevel.unlocked,
              completed: subLevel.stars > 0
            }"
            @click="handleSelectSubLevel(subLevel)"
          >
            <div class="sub-level-number">{{ subLevel.subLevel }}</div>
            <div class="sub-level-content">
              <h3 class="sub-level-name">{{ subLevel.name }}</h3>
              <p class="sub-level-desc">{{ subLevel.description }}</p>
              <div class="sub-level-meta">
                <span 
                  class="difficulty" 
                  :style="{ 
                    background: subLevel.difficultyConfig.color + '20',
                    color: subLevel.difficultyConfig.color 
                  }"
                >
                  {{ subLevel.difficultyConfig.name }}
                </span>
              </div>
              <!-- 星级显示 -->
              <div class="stars-display">
                <span
                  v-for="i in 3"
                  :key="i"
                  class="star"
                  :class="{ filled: i <= subLevel.stars }"
                >
                  ⭐
                </span>
              </div>
            </div>
            <div v-if="!subLevel.unlocked" class="lock-overlay">
              <span class="lock-icon">🔒</span>
            </div>
          </div>
        </div>
      </template>

      <button @click="goBack" class="back-btn">
        ← 返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { getLevelsByGameType, DIFFICULTY_CONFIG } from '@/config/levelConfig'

const emit = defineEmits(['select'])

const gameStore = useGameStore()

// 游戏类型列表
const gameTypes = [
  {
    id: 1,
    name: '色彩大作战',
    icon: '🎨',
    description: '听语音找颜色，拍碎气球！',
    color: '#ff6b6b'
  },
  {
    id: 2,
    name: '障碍躲避',
    icon: '🏃',
    description: '左右移动躲避障碍，深蹲躲开高处！',
    color: '#4d96ff'
  },
  {
    id: 3,
    name: '姿势临摹',
    icon: '🦸',
    description: '模仿卡通动物姿势，看谁像！',
    color: '#6bcb77'
  },
  {
    id: 4,
    name: '数字识别',
    icon: '🔢',
    description: '识别数字，拍碎正确的数字气球！',
    color: '#ffd93d'
  }
]

const selectedGameType = ref(null)
const subLevels = ref([])

// 选择游戏类型
function selectGameType(gameType) {
  selectedGameType.value = gameType
  // 加载该游戏的所有子关卡
  const levels = getLevelsByGameType(gameType.id)
  subLevels.value = levels.map(level => {
    const progress = gameStore.getLevelProgress(level.id)
    const unlocked = gameStore.isLevelUnlocked(gameType.id, level.subLevel)
    
    return {
      ...level,
      unlocked,
      stars: progress.stars || 0,
      difficultyConfig: DIFFICULTY_CONFIG[level.difficulty]
    }
  })
}

// 选择子关卡
function handleSelectSubLevel(subLevel) {
  if (!subLevel.unlocked) return
  gameStore.currentLevel = selectedGameType.value.id
  gameStore.setSubLevel(subLevel.subLevel)
  emit('select', selectedGameType.value.id)
}

// 返回游戏类型选择
function backToGameTypes() {
  selectedGameType.value = null
  subLevels.value = []
}

// 返回主菜单
function goBack() {
  if (selectedGameType.value) {
    backToGameTypes()
  } else {
    emit('select', 'back')
  }
}

// 获取游戏总星级
function getGameTotalStars(gameTypeId) {
  const levels = getLevelsByGameType(gameTypeId)
  return levels.reduce((sum, level) => {
    const progress = gameStore.getLevelProgress(level.id)
    return sum + (progress.stars || 0)
  }, 0)
}

// 初始化：默认显示游戏类型选择
onMounted(() => {
  gameStore.loadProgress()
})
</script>

<style scoped>
.level-select {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--apple-bg, #fbfbfd);
  padding: var(--apple-space-xl) var(--apple-space-md);
  overflow-y: auto;
}

.select-content {
  max-width: 900px;
  width: 100%;
}

.title {
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-align: center;
  color: var(--apple-text, #1d1d1f);
  margin-bottom: var(--apple-space-xl);
}

.game-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--apple-space-lg);
  margin-bottom: var(--apple-space-xl);
}

.sub-levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--apple-space-md);
  margin-bottom: var(--apple-space-xl);
}

.sub-level-header {
  text-align: center;
  margin-bottom: var(--apple-space-lg);
}

.back-to-games-btn {
  margin-bottom: var(--apple-space-md);
  padding: 10px 20px;
  background: transparent;
  color: var(--apple-link);
  border: none;
  border-radius: var(--apple-radius);
  cursor: pointer;
  font-size: 15px;
}

.back-to-games-btn:hover {
  text-decoration: underline;
}

.subtitle {
  color: var(--apple-text-secondary);
  font-size: 17px;
  margin-top: var(--apple-space-sm);
}

.game-type-card {
  position: relative;
  background: var(--apple-bg-tertiary, #fff);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius-lg);
  padding: var(--apple-space-xl);
  cursor: pointer;
  transition: box-shadow var(--apple-duration), transform var(--apple-duration);
  overflow: hidden;
  box-shadow: var(--apple-shadow-sm);
}

.game-type-card:hover {
  box-shadow: var(--apple-shadow);
  transform: translateY(-2px);
}

.game-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: var(--apple-space-md);
}

.game-info {
  text-align: center;
}

.game-name {
  font-size: 22px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-sm);
}

.game-desc {
  font-size: 15px;
  color: var(--apple-text-secondary);
  margin-bottom: var(--apple-space-md);
  line-height: 1.4;
}

.game-stats {
  display: flex;
  justify-content: center;
}

.total-stars {
  color: var(--apple-text-tertiary);
  font-size: 15px;
  font-weight: 500;
}

.sub-level-card {
  position: relative;
  background: var(--apple-bg-tertiary, #fff);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius);
  padding: var(--apple-space-lg);
  cursor: pointer;
  transition: box-shadow var(--apple-duration), border-color var(--apple-duration);
  overflow: hidden;
  text-align: center;
  box-shadow: var(--apple-shadow-sm);
}

.sub-level-card:hover:not(.locked) {
  box-shadow: var(--apple-shadow);
  border-color: var(--apple-link);
}

.sub-level-card.completed {
  border-color: rgba(52, 199, 89, 0.4);
  background: rgba(52, 199, 89, 0.04);
}

.sub-level-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.sub-level-number {
  font-size: 28px;
  font-weight: 600;
  color: var(--apple-link);
  margin-bottom: var(--apple-space-sm);
}

.sub-level-content {
  text-align: center;
}

.sub-level-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--apple-text);
  margin-bottom: var(--apple-space-xs);
}

.sub-level-desc {
  font-size: 13px;
  color: var(--apple-text-secondary);
  margin-bottom: var(--apple-space-sm);
  line-height: 1.3;
}

.sub-level-meta {
  margin-bottom: var(--apple-space-sm);
}

.difficulty {
  padding: 4px 10px;
  border-radius: var(--apple-radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.stars-display {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: var(--apple-space-sm);
}

.star {
  font-size: 14px;
  opacity: 0.25;
}

.star.filled {
  opacity: 1;
}

.level-card,
.level-icon,
.level-info,
.level-name,
.level-desc,
.level-meta,
.duration {
  display: none;
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
}

.lock-icon {
  font-size: 32px;
  opacity: 0.6;
}

.back-btn {
  display: block;
  margin: 0 auto;
  padding: 14px 32px;
  font-size: 17px;
  font-weight: 500;
  background: transparent;
  color: var(--apple-text-secondary);
  border: 1px solid var(--apple-border);
  border-radius: var(--apple-radius-xl);
  cursor: pointer;
  transition: background var(--apple-duration), color var(--apple-duration);
}

.back-btn:hover {
  background: var(--apple-bg-secondary);
  color: var(--apple-text);
}
</style>
