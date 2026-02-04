import { ref } from 'vue'

/**
 * 碰撞检测系统
 * 支持点与矩形、点与圆形的碰撞判定
 * 支持可调节的灵敏度
 */
export function useCollisionDetection(options = {}) {
  // 配置参数（可调节灵敏度）
  const config = {
    collisionThreshold: options.collisionThreshold || 50, // 碰撞阈值（像素）
    visibilityThreshold: options.visibilityThreshold || 0.3, // 可见度阈值
    poseMatchThreshold: options.poseMatchThreshold || 0.15, // 姿势匹配阈值
    poseMatchTolerance: options.poseMatchTolerance || 0.75 // 姿势匹配容差
  }

  // 悬停检测状态
  const hoverStates = ref(new Map())

  /**
   * 检测点是否在矩形内
   */
  function pointInRect(point, rect, tolerance = 0) {
    return (
      point.x >= rect.x - tolerance &&
      point.x <= rect.x + rect.width + tolerance &&
      point.y >= rect.y - tolerance &&
      point.y <= rect.y + rect.height + tolerance
    )
  }

  /**
   * 检测点是否在圆形内
   */
  function pointInCircle(point, circle, extraRadius = 0) {
    const dx = point.x - circle.x
    const dy = point.y - circle.y
    return dx * dx + dy * dy <= (circle.radius + extraRadius) ** 2
  }

  /**
   * 计算两点距离
   * 优化：使用平方距离比较，避免开方运算
   */
  function distance(p1, p2) {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 计算两点距离的平方（用于快速比较，避免开方）
   */
  function distanceSquared(p1, p2) {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return dx * dx + dy * dy
  }

  /**
   * 检测手掌/足部与游戏物体的碰撞
   * 优化：使用空间分区和早期退出策略
   * @param {Array} landmarks - MediaPipe 关键点
   * @param {Array} gameObjects - 游戏物体数组
   * @param {number} customThreshold - 自定义碰撞阈值
   */
  function checkCollisions(landmarks, gameObjects, customThreshold = null) {
    if (!landmarks || !gameObjects || gameObjects.length === 0) {
      return []
    }

    const threshold = customThreshold || config.collisionThreshold
    const collisions = []
    const collisionSet = new Set() // 用于去重，避免同一物体多次碰撞

    // 关键点：手和脚（添加手掌中心点）
    // 优化：按重要性排序，优先检测手腕（更稳定）
    const interactionPoints = [
      { index: 15, name: 'left_wrist', priority: 1 },   // 左手腕
      { index: 16, name: 'right_wrist', priority: 1 },  // 右手腕
      { index: 19, name: 'left_index', priority: 2 },   // 左食指（更精确）
      { index: 20, name: 'right_index', priority: 2 },  // 右食指
      { index: 27, name: 'left_ankle', priority: 3 },   // 左脚踝
      { index: 28, name: 'right_ankle', priority: 3 }   // 右脚踝
    ]

    // 预计算可见的关键点，避免重复检查
    const visiblePoints = interactionPoints
      .map(point => {
        const landmark = landmarks[point.index]
        if (!landmark || landmark.visibility < config.visibilityThreshold) {
          return null
        }
        return { ...point, landmark }
      })
      .filter(Boolean)

    if (visiblePoints.length === 0) {
      return []
    }

    // 优化：对物体进行空间分区（简单版本：按y坐标排序）
    // 这样可以优先检测距离玩家更近的物体
    const sortedObjects = [...gameObjects].sort((a, b) => {
      const aY = a.y || a.cy || 0
      const bY = b.y || b.cy || 0
      return aY - bY
    })

    // 检测碰撞
    for (const pointData of visiblePoints) {
      const { landmark, name: bodyPoint } = pointData

      for (const obj of sortedObjects) {
        // 早期退出：如果已经检测到该物体碰撞，跳过
        if (collisionSet.has(obj.id)) continue

        // 根据物体形状选择碰撞检测方法
        let isColliding = false
        let distanceValue = 0

        if (obj.shape === 'circle') {
          // 优化：使用平方距离比较，避免开方
          const radiusWithThreshold = obj.radius + threshold
          const distSquared = distanceSquared(landmark, obj)
          isColliding = distSquared < radiusWithThreshold * radiusWithThreshold
          distanceValue = isColliding ? Math.sqrt(distSquared) : 0
        } else {
          // 矩形碰撞使用额外的宽容度
          isColliding = pointInRect(landmark, obj, threshold * 0.5)
        }

        if (isColliding) {
          collisions.push({
            object: obj,
            bodyPoint,
            timestamp: Date.now(),
            distance: distanceValue
          })

          collisionSet.add(obj.id)

          // 追踪碰撞事件（仅在开发模式下）
          if (import.meta.env.DEV && typeof trackCollision === 'function') {
            trackCollision(obj.type || 'unknown', true)
          }

          // 优化：每个关键点只检测一次碰撞（避免重复）
          break
        }
      }
    }

    return collisions
  }

  /**
   * 悬停检测（用于"悬停2秒确认"交互）
   */
  function checkHover(objectId, isHovering, duration = 2000) {
    const now = Date.now()

    if (isHovering) {
      const state = hoverStates.value.get(objectId)

      if (!state) {
        // 开始悬停
        hoverStates.value.set(objectId, {
          startTime: now,
          isHovering: true
        })
        return { progress: 0, isConfirmed: false }
      }

      const elapsed = now - state.startTime
      const progress = Math.min(elapsed / duration, 1)

      if (progress >= 1 && !state.confirmed) {
        // 确认悬停
        state.confirmed = true
        return { progress: 1, isConfirmed: true }
      }

      return { progress, isConfirmed: false }
    } else {
      // 清除悬停状态
      hoverStates.value.delete(objectId)
      return { progress: 0, isConfirmed: false }
    }
  }

  /**
   * 检测姿势匹配度（用于关卡三：姿势临摹）
   * 使用更宽松的匹配标准
   */
  function checkPoseMatch(currentLandmarks, targetPose, customThreshold = null) {
    const threshold = customThreshold || config.poseMatchTolerance
    let matchedPoints = 0
    let totalPoints = 0
    const pointScores = [] // 用于调试，显示每个关键点的匹配情况

    // 关键身体部位（增加权重）
    const keyPoints = [
      { index: 0, weight: 1.0 },   // nose - 重要
      { index: 11, weight: 1.2 },  // left_shoulder - 重要
      { index: 12, weight: 1.2 },  // right_shoulder - 重要
      { index: 13, weight: 1.0 },  // left_elbow
      { index: 14, weight: 1.0 },  // right_elbow
      { index: 15, weight: 0.8 },  // left_wrist
      { index: 16, weight: 0.8 },  // right_wrist
      { index: 23, weight: 1.0 },  // left_hip - 重要
      { index: 24, weight: 1.0 },  // right_hip - 重要
      { index: 25, weight: 0.8 },  // left_knee
      { index: 26, weight: 0.8 },  // right_knee
      { index: 27, weight: 0.6 },  // left_ankle
      { index: 28, weight: 0.6 }   // right_ankle
    ]

    for (const { index, weight } of keyPoints) {
      const current = currentLandmarks[index]
      const target = targetPose[index]

      if (!current || !target || current.visibility < config.visibilityThreshold) continue

      // 计算位置差异
      const dx = current.x - target.x
      const dy = current.y - target.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // 使用可配置的阈值
      const isMatched = dist < config.poseMatchThreshold

      if (isMatched) {
        matchedPoints += weight
      }

      totalPoints += weight

      // 记录每个点的得分
      pointScores.push({
        index,
        matched: isMatched,
        distance: dist
      })
    }

    const matchRatio = totalPoints > 0 ? matchedPoints / totalPoints : 0
    const isMatched = matchRatio >= threshold

    // 追踪姿势匹配
    if (import.meta.env.DEV) {
      // 开发模式下输出详细信息
    }

    return {
      ratio: matchRatio,
      isMatched,
      matchedPoints: Math.floor(matchedPoints),
      totalPoints: Math.floor(totalPoints),
      pointScores,
      // 百分比显示
      percentage: Math.floor(matchRatio * 100)
    }
  }

  /**
   * 清除所有悬停状态
   */
  function clearHoverStates() {
    hoverStates.value.clear()
  }

  /**
   * 更新配置
   */
  function updateConfig(newConfig) {
    Object.assign(config, newConfig)
  }

  /**
   * 获取当前配置
   */
  function getConfig() {
    return { ...config }
  }

  return {
    hoverStates,
    config,
    pointInRect,
    pointInCircle,
    distance,
    distanceSquared,
    checkCollisions,
    checkHover,
    checkPoseMatch,
    clearHoverStates,
    updateConfig,
    getConfig
  }
}
