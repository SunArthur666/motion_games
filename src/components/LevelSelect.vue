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
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);
  padding: 20px;
  overflow-y: auto;
}

.select-content {
  max-width: 900px;
  width: 100%;
}

.title {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
}

.game-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.sub-levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.sub-level-header {
  text-align: center;
  margin-bottom: 30px;
}

.back-to-games-btn {
  margin-bottom: 20px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.back-to-games-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  margin-top: 10px;
}

.game-type-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.game-type-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #64c8ff;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(100, 200, 255, 0.2);
}

.game-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 20px;
}

.game-info {
  text-align: center;
}

.game-name {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10px;
}

.game-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.4;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.total-stars {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
}

.sub-level-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  text-align: center;
}

.sub-level-card:hover:not(.locked) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #64c8ff;
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(100, 200, 255, 0.2);
}

.sub-level-card.completed {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.sub-level-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.sub-level-number {
  font-size: 32px;
  font-weight: bold;
  color: #64c8ff;
  margin-bottom: 10px;
}

.sub-level-content {
  text-align: center;
}

.sub-level-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.sub-level-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
  line-height: 1.3;
}

.sub-level-meta {
  margin-bottom: 10px;
}

.stars-display {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
}

.star {
  font-size: 16px;
  opacity: 0.3;
  transition: all 0.3s;
}

.star.filled {
  opacity: 1;
  transform: scale(1.2);
}

.level-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.level-card:hover:not(.locked) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #64c8ff;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(100, 200, 255, 0.2);
}

.level-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.level-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 20px;
}

.level-info {
  text-align: center;
}

.level-name {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10px;
}

.level-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.4;
}

.level-meta {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.difficulty {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.difficulty.easy {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.difficulty.medium {
  background: rgba(255, 217, 61, 0.2);
  color: #ffd93d;
}

.difficulty.hard {
  background: rgba(239, 69, 69, 0.2);
  color: #ef4444;
}

.duration {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-icon {
  font-size: 48px;
}

.back-btn {
  display: block;
  margin: 0 auto;
  padding: 15px 40px;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #64c8ff;
}
</style>
