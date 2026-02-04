/**
 * 简单的统计分析工具
 * 用于追踪游戏行为和统计
 */

// 是否启用分析（可配置）
const ANALYTICS_ENABLED = true

// 会话ID
const sessionId = generateSessionId()

// 事件存储
let events = []
let sessionStartTime = Date.now()

/**
 * 生成会话ID
 */
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * 追踪事件
 * @param {string} eventName - 事件名称
 * @param {object} properties - 事件属性
 */
export function trackEvent(eventName, properties = {}) {
  if (!ANALYTICS_ENABLED) return

  const event = {
    sessionId,
    eventName,
    properties,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height
    }
  }

  events.push(event)

  // 存储到 localStorage
  saveEvents()

  // 在开发模式下输出日志
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties)
  }
}

/**
 * 追踪关卡开始
 */
export function trackLevelStart(level, difficulty = 'medium') {
  trackEvent('level_start', {
    level,
    difficulty,
    timestamp: Date.now()
  })
}

/**
 * 追踪关卡完成
 */
export function trackLevelComplete(level, score, time, additionalData = {}) {
  trackEvent('level_complete', {
    level,
    score,
    time,
    ...additionalData
  })
}

/**
 * 追踪关卡失败
 */
export function trackLevelFail(level, reason, score, time) {
  trackEvent('level_fail', {
    level,
    reason,
    score,
    time
  })
}

/**
 * 追踪碰撞事件
 */
export function trackCollision(type, success) {
  trackEvent('collision', {
    type,
    success,
    timestamp: Date.now()
  })
}

/**
 * 追踪设置变更
 */
export function trackSettingChange(setting, oldValue, newValue) {
  trackEvent('setting_change', {
    setting,
    oldValue,
    newValue
  })
}

/**
 * 保存事件到 localStorage
 */
function saveEvents() {
  try {
    // 保留最近 1000 条事件
    const allEvents = getStoredEvents()
    const combinedEvents = [...allEvents, ...events].slice(-1000)
    localStorage.setItem('motion-games-analytics', JSON.stringify(combinedEvents))
    events = [] // 清空已保存的事件
  } catch (e) {
    console.warn('Failed to save analytics:', e)
  }
}

/**
 * 获取存储的事件
 */
function getStoredEvents() {
  try {
    const stored = localStorage.getItem('motion-games-analytics')
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

/**
 * 获取统计摘要
 */
export function getAnalyticsSummary() {
  const allEvents = getStoredEvents()

  // 按事件类型分组
  const summary = {
    totalEvents: allEvents.length,
    sessions: new Set(allEvents.map(e => e.sessionId)).size,
    eventsByType: {},
    recentEvents: allEvents.slice(-10)
  }

  allEvents.forEach(event => {
    if (!summary.eventsByType[event.eventName]) {
      summary.eventsByType[event.eventName] = 0
    }
    summary.eventsByType[event.eventName]++
  })

  return summary
}

/**
 * 清除分析数据
 */
export function clearAnalytics() {
  localStorage.removeItem('motion-games-analytics')
  events = []
}

/**
 * 获取会话统计
 */
export function getSessionStats() {
  const allEvents = getStoredEvents()
  const sessionEvents = allEvents.filter(e => e.sessionId === sessionId)

  const stats = {
    duration: Date.now() - sessionStartTime,
    eventCount: sessionEvents.length,
    levelsPlayed: {},
    totalScore: 0,
    totalTime: 0
  }

  sessionEvents.forEach(event => {
    if (event.eventName === 'level_start') {
      const level = event.properties.level
      stats.levelsPlayed[level] = (stats.levelsPlayed[level] || 0) + 1
    }
    if (event.properties.score) {
      stats.totalScore += event.properties.score
    }
    if (event.properties.time) {
      stats.totalTime += event.properties.time
    }
  })

  return stats
}

/**
 * 导出分析数据（用于家长查看）
 */
export function exportAnalytics() {
  const summary = getAnalyticsSummary()
  const sessionStats = getSessionStats()

  return {
    summary,
    currentSession: sessionStats,
    exportDate: new Date().toISOString()
  }
}

// 页面卸载时保存事件
window.addEventListener('beforeunload', () => {
  saveEvents()
})
