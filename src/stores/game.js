import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getLevelConfig, 
  calculateStars, 
  getAllLevels,
  USER_DIFFICULTY_MODES,
  applyDifficultyAdjustments,
  ENCOURAGEMENT_CONFIG,
  POWER_UPS
} from '@/config/levelConfig'
import { getAchievementProgress } from '@/config/achievements'

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const currentLevel = ref(1)      // 游戏类型（1=色彩, 2=障碍, 3=姿势）
  const currentSubLevel = ref(1)   // 子关卡编号
  const score = ref(0)
  const lives = ref(3)
  const isPlaying = ref(false)
  const isPaused = ref(false)
  
  // 用户难度选择
  const userDifficulty = ref('normal')  // 'easy' | 'normal' | 'hard'
  const userDifficultyConfig = computed(() => {
    return USER_DIFFICULTY_MODES[userDifficulty.value] || USER_DIFFICULTY_MODES.normal
  })

  // 连击计数
  const streak = ref(0)
  const maxStreak = ref(0)

  // 道具状态
  const activePowerUps = ref([])
  const collectedPowerUps = ref([])

  // 成就和统计
  const statistics = ref({
    totalGamesPlayed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestStreak: 0,
    totalPlayTime: 0  // 总游戏时长（毫秒），由 endGame 时累加
  })
  
  // 关卡进度和星级
  const levelProgress = ref({})    // { 'color-1': { stars: 2, unlocked: true }, ... }
  const totalStars = computed(() => {
    return Object.values(levelProgress.value).reduce((sum, progress) => {
      return sum + (progress.stars || 0)
    }, 0)
  })

  const achievementProgress = computed(() => {
    return getAchievementProgress(statistics.value, levelProgress.value)
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

  // 用户系统
  const currentUser = ref(null)  // 当前登录用户，null表示匿名
  const showSkeleton = ref(false)  // 是否显示骨骼

  // 计算属性
  const shouldTakeBreak = computed(() => {
    if (!lastBreakTime.value) return false
    const timeSinceBreak = Date.now() - lastBreakTime.value
    return timeSinceBreak > 15 * 60 * 1000 // 15分钟
  })

  // 初始化：从localStorage加载进度
  function loadProgress() {
    try {
      // 如果有用户，加载用户进度；否则加载匿名进度
      const key = currentUser.value 
        ? `motion-games-progress-${currentUser.value}`
        : 'motion-games-progress'
      const saved = localStorage.getItem(key)
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
    if (!currentUser.value) return // 匿名用户不保存
    
    try {
      const key = `motion-games-progress-${currentUser.value}`
      localStorage.setItem(key, JSON.stringify(levelProgress.value))
    } catch (e) {
      console.warn('Failed to save progress:', e)
    }
  }

  // 保存游戏历史
  function saveGameHistory(gameType, subLevel, stars, levelName) {
    if (!currentUser.value) return // 匿名用户不保存历史
    
    try {
      const key = `motion-games-history-${currentUser.value}`
      const saved = localStorage.getItem(key)
      const history = saved ? JSON.parse(saved) : []
      
      history.unshift({
        gameType,
        subLevel,
        stars,
        levelName,
        timestamp: Date.now()
      })
      
      // 只保留最近50条记录
      if (history.length > 50) {
        history.splice(50)
      }
      
      localStorage.setItem(key, JSON.stringify(history))
    } catch (e) {
      console.warn('Failed to save history:', e)
    }
  }

  // 设置当前用户
  function setCurrentUser(username) {
    // 保存当前匿名进度（如果有）
    if (!currentUser.value && Object.keys(levelProgress.value).length > 0) {
      const tempKey = 'motion-games-progress-temp'
      localStorage.setItem(tempKey, JSON.stringify(levelProgress.value))
    }
    
    currentUser.value = username
    if (username) {
      localStorage.setItem('motion-games-current-user', username)
    } else {
      localStorage.removeItem('motion-games-current-user')
    }
    
    // 加载新用户的进度
    loadProgress()
    loadStatistics()
  }

  // 切换骨骼显示
  function toggleSkeleton() {
    showSkeleton.value = !showSkeleton.value
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
    
    // 保存游戏历史（仅登录用户）
    if (currentUser.value) {
      saveGameHistory(gameType, subLevel, stars, levelConfig.name)
    }
    
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
    streak.value = 0
    activePowerUps.value = []
    
    const adjustedConfig = getAdjustedLevelConfig()
    if (adjustedConfig && adjustedConfig.config) {
      lives.value = adjustedConfig.config.lives || 3
    } else {
      lives.value = 3
    }

    statistics.value.totalGamesPlayed++
    saveStatistics()
  }

  function getAdjustedLevelConfig() {
    const levelConfig = getLevelConfig(currentLevel.value, currentSubLevel.value)
    if (!levelConfig) return null
    return applyDifficultyAdjustments(levelConfig, userDifficulty.value)
  }

  function setUserDifficulty(difficulty) {
    if (USER_DIFFICULTY_MODES[difficulty]) {
      userDifficulty.value = difficulty
      saveSettings()
    }
  }

  function addStreak() {
    streak.value++
    if (streak.value > maxStreak.value) maxStreak.value = streak.value
    if (streak.value > statistics.value.bestStreak) {
      statistics.value.bestStreak = streak.value
      saveStatistics()
    }
  }

  function resetStreak() {
    streak.value = 0
  }

  function getEncouragement(type, param = null) {
    const config = ENCOURAGEMENT_CONFIG[type]
    if (!config) return ''
    
    if (type === 'streak' && param) {
      const streakConfig = config[param] || config[Object.keys(config).find(k => parseInt(k) <= param)]
      if (streakConfig) return streakConfig[Math.floor(Math.random() * streakConfig.length)]
    } else if (type === 'complete' && param) {
      const completeConfig = config[param]
      if (completeConfig) return completeConfig[Math.floor(Math.random() * completeConfig.length)]
    } else if (Array.isArray(config)) {
      return config[Math.floor(Math.random() * config.length)]
    }
    return ''
  }

  function addPowerUp(powerUpId) {
    const powerUp = POWER_UPS[powerUpId]
    if (!powerUp) return
    if (powerUp.effect.addLife) {
      lives.value += powerUp.effect.addLife
    } else {
      activePowerUps.value.push({ ...powerUp, startTime: Date.now(), endTime: Date.now() + powerUp.duration })
    }
    collectedPowerUps.value.push(powerUpId)
  }

  function isPowerUpActive(powerUpId) {
    return activePowerUps.value.some(p => p.id === powerUpId && p.endTime > Date.now())
  }

  function updatePowerUps() {
    activePowerUps.value = activePowerUps.value.filter(p => p.endTime > Date.now())
  }

  function saveStatistics() {
    try { localStorage.setItem('motion-games-statistics', JSON.stringify(statistics.value)) } catch (e) {}
  }

  function loadStatistics() {
    try {
      const saved = localStorage.getItem('motion-games-statistics')
      if (saved) statistics.value = { ...statistics.value, ...JSON.parse(saved) }
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem('motion-games-settings', JSON.stringify({
        userDifficulty: userDifficulty.value,
        isMirrored: isMirrored.value,
        performanceMode: performanceMode.value
      }))
    } catch (e) {}
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('motion-games-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        if (settings.userDifficulty) userDifficulty.value = settings.userDifficulty
        if (settings.isMirrored !== undefined) isMirrored.value = settings.isMirrored
        if (settings.performanceMode) performanceMode.value = settings.performanceMode
      }
    } catch (e) {}
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
      const elapsed = Date.now() - sessionStartTime.value
      totalPlayTime.value += elapsed
      statistics.value.totalPlayTime = (statistics.value.totalPlayTime || 0) + elapsed
      saveStatistics()
    }
  }

  function addScore(points) {
    let multiplier = isPowerUpActive('doublePoints') ? 2 : 1
    score.value += Math.floor(points * multiplier)
    statistics.value.totalCorrect++
  }

  function loseLife() {
    if (isPowerUpActive('shield')) {
      activePowerUps.value = activePowerUps.value.filter(p => p.id !== 'shield')
      return false
    }
    if (userDifficultyConfig.value.adjustments.forgivingMode) {
      resetStreak()
      return false
    }
    lives.value--
    resetStreak()
    statistics.value.totalWrong++
    if (lives.value <= 0) {
      endGame()
      return true
    }
    return false
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

  // 初始化加载
  loadProgress()
  loadStatistics()
  loadSettings()

  return {
    // State
    currentLevel, currentSubLevel, score, lives, isPlaying, isPaused,
    sessionStartTime, totalPlayTime, lastBreakTime, isMirrored,
    performanceMode, targetFPS, renderFPS, customColors, safetyZone, levelProgress,
    userDifficulty, streak, maxStreak, activePowerUps, collectedPowerUps, statistics,
    currentUser, showSkeleton,
    // Computed
    shouldTakeBreak, totalStars, userDifficultyConfig, achievementProgress,
    // Actions
    startGame, pauseGame, resumeGame, endGame, addScore, loseLife,
    nextLevel, setSubLevel, takeBreak, updateSafetyZone, toggleMirror,
    setPerformanceMode, updateCustomColor,
    // Level progress
    loadProgress, saveProgress, isLevelUnlocked, completeLevel, getLevelProgress,
    // New features
    setUserDifficulty, getAdjustedLevelConfig, addStreak, resetStreak,
    getEncouragement, addPowerUp, isPowerUpActive, updatePowerUps, saveSettings, loadSettings,
    // User system
    setCurrentUser, saveGameHistory, toggleSkeleton
  }
})
