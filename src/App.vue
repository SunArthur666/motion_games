<template>
  <div class="app-container">
    <!-- 欢迎界面 -->
    <WelcomeScreen v-if="gameState === 'welcome'" @start="showPositionGuide" @mouseMode="showMouseExperience" />

    <!-- 站位引导界面 -->
    <PositionGuide v-else-if="gameState === 'position-guide'" @start="showGestureTutorial" />

    <!-- 手势教程界面 -->
    <GestureTutorial
      v-else-if="gameState === 'gesture-tutorial'"
      @complete="showLevelSelect"
      @skip="showLevelSelect"
    />

    <!-- 关卡选择界面 -->
    <LevelSelect v-else-if="gameState === 'level-select'" @select="handleLevelSelect" />

    <!-- 游戏主界面 -->
    <GameContainer v-else-if="gameState === 'playing'" @game-over="handleGameOver" />

    <!-- 暂停/设置界面 -->
    <PauseMenu v-if="showPauseMenu" @restart="handleRestart" @exit="handleExit" />

    <!-- 游戏结束界面 -->
    <GameOver v-if="gameState === 'game-over'" :result="gameResult" @action="handleGameOverAction" />

    <!-- 休息提醒 -->
    <BreakReminder v-if="showBreakReminder" @continue="handleContinue" />

    <!-- 鼠标体验模式 -->
    <MouseExperience v-if="gameState === 'mouse-mode'" @back="handleMouseModeExit" />

    <!-- 全局错误提示 -->
    <transition name="fade">
      <div v-if="error" class="error-toast">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
        <button @click="error = null" class="error-close">×</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import WelcomeScreen from '@/components/WelcomeScreen.vue'
import PositionGuide from '@/components/PositionGuide.vue'
import GestureTutorial from '@/components/GestureTutorial.vue'
import LevelSelect from '@/components/LevelSelect.vue'
import GameContainer from '@/components/GameContainer.vue'
import PauseMenu from '@/components/PauseMenu.vue'
import GameOver from '@/components/GameOver.vue'
import BreakReminder from '@/components/BreakReminder.vue'
import MouseExperience from '@/components/MouseExperience.vue'

const gameStore = useGameStore()
const gameState = ref('welcome')
const showPauseMenu = ref(false)
const showBreakReminder = ref(false)
const gameResult = ref(null)
const error = ref(null)

// 从 localStorage 恢复设置
onMounted(() => {
  loadSettings()
  checkTutorialCompleted()
  // 加载用户信息
  const savedUser = localStorage.getItem('motion-games-current-user')
  if (savedUser) {
    gameStore.setCurrentUser(savedUser)
  }
})

function loadSettings() {
  try {
    const saved = localStorage.getItem('motion-games-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      if (settings.isMirrored !== undefined) gameStore.isMirrored = settings.isMirrored
      if (settings.performanceMode) gameStore.setPerformanceMode(settings.performanceMode)
      if (settings.customColors) {
        Object.entries(settings.customColors).forEach(([key, value]) => {
          gameStore.updateCustomColor(key, value)
        })
      }
    }
  } catch (e) {
    console.warn('Failed to load settings:', e)
  }
}

function saveSettings() {
  try {
    localStorage.setItem('motion-games-settings', JSON.stringify({
      isMirrored: gameStore.isMirrored,
      performanceMode: gameStore.performanceMode,
      customColors: gameStore.customColors
    }))
  } catch (e) {
    console.warn('Failed to save settings:', e)
  }
}

function checkTutorialCompleted() {
  // 检查是否已完成过教程
  const completed = localStorage.getItem('motion-games-tutorial-completed')
  return completed === 'true'
}

function showPositionGuide() {
  gameState.value = 'position-guide'
}

function showGestureTutorial() {
  // 如果已完成过教程，直接跳过
  if (checkTutorialCompleted()) {
    showLevelSelect()
  } else {
    gameState.value = 'gesture-tutorial'
  }
}

function showLevelSelect() {
  gameState.value = 'level-select'
}

function handleLevelSelect(level) {
  if (level === 'back') {
    gameState.value = 'welcome'
    return
  }
  // level 现在是游戏类型ID
  gameStore.currentLevel = level
  // 如果没有设置子关卡，默认使用第一关
  if (!gameStore.currentSubLevel) {
    gameStore.setSubLevel(1)
  }
  gameState.value = 'playing'
  gameStore.startGame()
}

function handleGameOver(result) {
  gameResult.value = result
  gameState.value = 'game-over'
}

function handleGameOverAction(action) {
  if (action === 'restart') {
    handleRestart()
  } else if (action === 'next-level') {
    // 下一子关卡
    const nextSubLevel = gameStore.currentSubLevel + 1
    // 检查是否有下一关（最多6关）
    if (nextSubLevel <= 6) {
      gameStore.setSubLevel(nextSubLevel)
      gameState.value = 'playing'
      gameStore.startGame()
    } else {
      // 没有下一关，返回关卡选择
      gameState.value = 'level-select'
    }
  } else if (action === 'level-select') {
    gameState.value = 'level-select'
  } else if (action === 'home') {
    gameState.value = 'welcome'
  }
}

function handleRestart() {
  showPauseMenu.value = false
  gameState.value = 'playing'
  gameStore.startGame()
}

function handleExit() {
  showPauseMenu.value = false
  gameState.value = 'level-select'
}

function handleContinue() {
  showBreakReminder.value = false
}

function showMouseExperience() {
  gameState.value = 'mouse-mode'
}

function handleMouseModeExit() {
  gameState.value = 'welcome'
}

// 暴露给子组件调用
window.showError = (msg) => {
  error.value = msg
  setTimeout(() => error.value = null, 5000)
}

// 监听设置变化自动保存
watch([() => gameStore.isMirrored, () => gameStore.performanceMode, () => gameStore.customColors], () => {
  saveSettings()
}, { deep: true })
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  overflow: hidden;
}

.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
  padding: 15px 25px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 10000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 90%;
}

.error-icon {
  font-size: 24px;
}

.error-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
