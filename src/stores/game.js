import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLevelConfig, calculateStars, getAllLevels } from '@/config/levelConfig'

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const currentLevel = ref(1)      // 游戏类型（1=色彩, 2=障碍, 3=姿势）
  const currentSubLevel = ref(1)   // 子关卡编号
  const score = ref(0)
  const lives = ref(3)
  const isPlaying = ref(false)
  const isPaused = ref(false)
  
  // 关卡进度和星级
  const levelProgress = ref({})    // { 'color-1': { stars: 2, unlocked: true }, ... }
  const totalStars = computed(() => {
    return Object.values(levelProgress.value).reduce((sum, progress) => {
      return sum + (progress.stars || 0)
    }, 0)
  })

  // 时间追踪
  const sessionStartTime = ref(null)
  const totalPlayTime = ref(0)
  const lastBreakTime = ref(null)

  // 镜像模式
  const isMirrored = ref(true)

  // 性能设置
  const performanceMode = ref('high') // 'high' | 'low'
  const targetFPS = ref(30) // MediaPipe推理帧率
  const renderFPS = ref(60) // 渲染帧率

  // 自定义设置
  const customColors = ref({
    red: 'Red',
    blue: 'Blue',
    green: 'Green',
    yellow: 'Yellow'
  })

  // 安全区状态
  const safetyZone = ref({
    isInFrame: true,
    headVisible: true,
    feetVisible: true
  })

  // 计算属性
  const shouldTakeBreak = computed(() => {
    if (!lastBreakTime.value) return false
    const timeSinceBreak = Date.now() - lastBreakTime.value
    return timeSinceBreak > 15 * 60 * 1000 // 15分钟
  })

  // 初始化：从localStorage加载进度
  function loadProgress() {
    try {
      const saved = localStorage.getItem('motion-games-progress')
      if (saved) {
        levelProgress.value = JSON.parse(saved)
        // 确保第一关解锁
        const allLevels = getAllLevels()
        allLevels.forEach(level => {
          if (level.unlocked && !levelProgress.value[level.id]) {
            levelProgress.value[level.id] = { stars: 0, unlocked: true }
          }
        })
      } else {
        // 初始化：解锁所有第一关
        const allLevels = getAllLevels()
        allLevels.forEach(level => {
          if (level.unlocked) {
            levelProgress.value[level.id] = { stars: 0, unlocked: true }
          }
        })
      }
    } catch (e) {
      console.warn('Failed to load progress:', e)
    }
  }

  // 保存进度
  function saveProgress() {
    try {
      localStorage.setItem('motion-games-progress', JSON.stringify(levelProgress.value))
    } catch (e) {
      console.warn('Failed to save progress:', e)
    }
  }

  // 检查关卡是否解锁
  function isLevelUnlocked(gameType, subLevel) {
    const levelConfig = getLevelConfig(gameType, subLevel)
    if (!levelConfig) return false
    
    // 第一关总是解锁
    if (subLevel === 1) return true
    
    // 检查前一关是否完成
    const prevLevelConfig = getLevelConfig(gameType, subLevel - 1)
    if (!prevLevelConfig) return false
    
    const prevProgress = levelProgress.value[prevLevelConfig.id]
    return prevProgress && prevProgress.stars > 0
  }

  // 完成关卡
  function completeLevel(gameType, subLevel, result) {
    const levelConfig = getLevelConfig(gameType, subLevel)
    if (!levelConfig) return

    const stars = calculateStars(levelConfig, result)
    const levelId = levelConfig.id

    // 更新进度
    if (!levelProgress.value[levelId]) {
      levelProgress.value[levelId] = { stars: 0, unlocked: true }
    }

    // 更新星级（只保留最高星级）
    if (stars > (levelProgress.value[levelId].stars || 0)) {
      levelProgress.value[levelId].stars = stars
    }

    // 解锁下一关
    const nextLevelConfig = getLevelConfig(gameType, subLevel + 1)
    if (nextLevelConfig && stars > 0) {
      if (!levelProgress.value[nextLevelConfig.id]) {
        levelProgress.value[nextLevelConfig.id] = { stars: 0, unlocked: true }
      }
    }

    saveProgress()
    return stars
  }

  // 获取关卡进度
  function getLevelProgress(levelId) {
    return levelProgress.value[levelId] || { stars: 0, unlocked: false }
  }

  // 动作
  function startGame() {
    isPlaying.value = true
    isPaused.value = false
    sessionStartTime.value = Date.now()
    lastBreakTime.value = Date.now()
    score.value = 0
    
    // 根据关卡配置设置生命值
    const levelConfig = getLevelConfig(currentLevel.value, currentSubLevel.value)
    if (levelConfig && levelConfig.config) {
      lives.value = levelConfig.config.lives || 3
    } else {
      lives.value = 3
    }
  }

  function pauseGame() {
    isPaused.value = true
  }

  function resumeGame() {
    isPaused.value = false
  }

  function endGame() {
    isPlaying.value = false
    if (sessionStartTime.value) {
      totalPlayTime.value += Date.now() - sessionStartTime.value
    }
  }

  function addScore(points) {
    score.value += points
  }

  function loseLife() {
    lives.value--
    if (lives.value <= 0) {
      endGame()
    }
  }

  function nextLevel() {
    currentLevel.value++
  }

  function setSubLevel(subLevel) {
    currentSubLevel.value = subLevel
  }

  function takeBreak() {
    pauseGame()
    lastBreakTime.value = Date.now()
  }

  function updateSafetyZone(status) {
    safetyZone.value = status
  }

  function toggleMirror() {
    isMirrored.value = !isMirrored.value
  }

  function setPerformanceMode(mode) {
    performanceMode.value = mode
    targetFPS.value = mode === 'low' ? 20 : 30
  }

  function updateCustomColor(key, value) {
    customColors.value[key] = value
  }

  // 初始化加载进度
  loadProgress()

  return {
    // State
    currentLevel,
    currentSubLevel,
    score,
    lives,
    isPlaying,
    isPaused,
    sessionStartTime,
    totalPlayTime,
    lastBreakTime,
    isMirrored,
    performanceMode,
    targetFPS,
    renderFPS,
    customColors,
    safetyZone,
    levelProgress,
    // Computed
    shouldTakeBreak,
    totalStars,
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    addScore,
    loseLife,
    nextLevel,
    setSubLevel,
    takeBreak,
    updateSafetyZone,
    toggleMirror,
    setPerformanceMode,
    updateCustomColor,
    // Level progress
    loadProgress,
    saveProgress,
    isLevelUnlocked,
    completeLevel,
    getLevelProgress
  }
})
