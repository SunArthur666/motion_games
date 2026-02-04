/**
 * 关卡配置系统
 * 参考优秀益智游戏设计：渐进式难度、明确目标、奖励机制
 */

// 关卡难度配置
export const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    color: '#4ade80',
    multiplier: 1.0
  },
  medium: {
    name: '中等',
    color: '#ffd93d',
    multiplier: 1.5
  },
  hard: {
    name: '困难',
    color: '#ef4444',
    multiplier: 2.0
  },
  expert: {
    name: '专家',
    color: '#a855f7',
    multiplier: 3.0
  }
}

/**
 * 色彩大作战关卡配置
 * 难度递增：速度、数量、颜色种类、时间限制
 */
export const COLOR_BATTLE_LEVELS = [
  {
    id: 'color-1',
    gameType: 1,
    subLevel: 1,
    name: '初识颜色',
    description: '认识基础颜色，慢慢来',
    difficulty: 'easy',
    icon: '🎨',
    // 游戏参数
    config: {
      spawnInterval: 3000,        // 生成间隔（毫秒）
      balloonSpeed: 1.5,          // 气球速度
      balloonRadius: [50, 60],    // 气球大小范围
      colors: ['red', 'blue'],    // 可用颜色（仅2种）
      targetCount: 10,            // 目标数量
      timeLimit: null,             // 时间限制（null=无限制）
      frenzyThreshold: 5,          // 狂欢模式阈值
      lives: 5,                    // 生命值
      scoreMultiplier: 1.0         // 分数倍数
    },
    // 星级评价标准
    stars: {
      3: { score: 1000, time: null, accuracy: 0.9 },  // 3星：高分+高准确率
      2: { score: 600, time: null, accuracy: 0.7 },   // 2星：中等分数+中等准确率
      1: { score: 300, time: null, accuracy: 0.5 }    // 1星：基础分数
    },
    unlocked: true
  },
  {
    id: 'color-2',
    gameType: 1,
    subLevel: 2,
    name: '三色挑战',
    description: '增加绿色，提高速度',
    difficulty: 'easy',
    icon: '🎨',
    config: {
      spawnInterval: 2500,
      balloonSpeed: 2.0,
      balloonRadius: [45, 55],
      colors: ['red', 'blue', 'green'],
      targetCount: 15,
      timeLimit: null,
      frenzyThreshold: 5,
      lives: 4,
      scoreMultiplier: 1.2
    },
    stars: {
      3: { score: 1500, time: null, accuracy: 0.85 },
      2: { score: 900, time: null, accuracy: 0.7 },
      1: { score: 450, time: null, accuracy: 0.5 }
    },
    unlocked: false // 需要完成color-1解锁
  },
  {
    id: 'color-3',
    gameType: 1,
    subLevel: 3,
    name: '四色大师',
    description: '所有颜色，速度更快',
    difficulty: 'medium',
    icon: '🎨',
    config: {
      spawnInterval: 2000,
      balloonSpeed: 2.5,
      balloonRadius: [40, 50],
      colors: ['red', 'blue', 'green', 'yellow'],
      targetCount: 20,
      timeLimit: null,
      frenzyThreshold: 6,
      lives: 3,
      scoreMultiplier: 1.5
    },
    stars: {
      3: { score: 2500, time: null, accuracy: 0.8 },
      2: { score: 1500, time: null, accuracy: 0.65 },
      1: { score: 750, time: null, accuracy: 0.5 }
    },
    unlocked: false
  },
  {
    id: 'color-4',
    gameType: 1,
    subLevel: 4,
    name: '速度挑战',
    description: '快速反应，气球更快',
    difficulty: 'medium',
    icon: '⚡',
    config: {
      spawnInterval: 1500,
      balloonSpeed: 3.5,
      balloonRadius: [35, 45],
      colors: ['red', 'blue', 'green', 'yellow'],
      targetCount: 25,
      timeLimit: 120, // 2分钟
      frenzyThreshold: 7,
      lives: 3,
      scoreMultiplier: 2.0
    },
    stars: {
      3: { score: 4000, time: 90, accuracy: 0.75 },
      2: { score: 2500, time: 120, accuracy: 0.6 },
      1: { score: 1200, time: null, accuracy: 0.5 }
    },
    unlocked: false
  },
  {
    id: 'color-5',
    gameType: 1,
    subLevel: 5,
    name: '精准大师',
    description: '小气球，高准确率要求',
    difficulty: 'hard',
    icon: '🎯',
    config: {
      spawnInterval: 1200,
      balloonSpeed: 4.0,
      balloonRadius: [30, 40],
      colors: ['red', 'blue', 'green', 'yellow'],
      targetCount: 30,
      timeLimit: 100,
      frenzyThreshold: 8,
      lives: 2,
      scoreMultiplier: 2.5
    },
    stars: {
      3: { score: 6000, time: 80, accuracy: 0.85 },
      2: { score: 4000, time: 100, accuracy: 0.7 },
      1: { score: 2000, time: null, accuracy: 0.55 }
    },
    unlocked: false
  },
  {
    id: 'color-6',
    gameType: 1,
    subLevel: 6,
    name: '极限挑战',
    description: '最快速度，最高难度',
    difficulty: 'expert',
    icon: '🔥',
    config: {
      spawnInterval: 800,
      balloonSpeed: 5.0,
      balloonRadius: [25, 35],
      colors: ['red', 'blue', 'green', 'yellow'],
      targetCount: 40,
      timeLimit: 90,
      frenzyThreshold: 10,
      lives: 1,
      scoreMultiplier: 3.0
    },
    stars: {
      3: { score: 10000, time: 70, accuracy: 0.9 },
      2: { score: 7000, time: 90, accuracy: 0.75 },
      1: { score: 4000, time: null, accuracy: 0.6 }
    },
    unlocked: false
  }
]

/**
 * 障碍躲避关卡配置
 * 难度递增：障碍速度、密度、类型、移动模式
 */
export const OBSTACLE_DODGE_LEVELS = [
  {
    id: 'obstacle-1',
    gameType: 2,
    subLevel: 1,
    name: '基础躲避',
    description: '简单的障碍，慢慢来',
    difficulty: 'easy',
    icon: '🏃',
    config: {
      obstacleSpeed: 2.0,
      spawnInterval: 2000,
      obstacleTypes: ['low'],      // 仅低障碍
      obstacleCount: 1,            // 同时最多1个
      movePattern: 'straight',     // 直线移动
      lives: 5,
      targetTime: 30,              // 目标存活时间（秒）
      scoreMultiplier: 1.0
    },
    stars: {
      3: { time: 30, score: 500 },
      2: { time: 20, score: 300 },
      1: { time: 10, score: 150 }
    },
    unlocked: true
  },
  {
    id: 'obstacle-2',
    gameType: 2,
    subLevel: 2,
    name: '高低组合',
    description: '出现高障碍，需要深蹲',
    difficulty: 'easy',
    icon: '🏃',
    config: {
      obstacleSpeed: 2.5,
      spawnInterval: 1800,
      obstacleTypes: ['low', 'high'],
      obstacleCount: 2,
      movePattern: 'straight',
      lives: 4,
      targetTime: 45,
      scoreMultiplier: 1.3
    },
    stars: {
      3: { time: 45, score: 800 },
      2: { time: 30, score: 500 },
      1: { time: 20, score: 250 }
    },
    unlocked: false
  },
  {
    id: 'obstacle-3',
    gameType: 2,
    subLevel: 3,
    name: '速度提升',
    description: '障碍更快，需要快速反应',
    difficulty: 'medium',
    icon: '⚡',
    config: {
      obstacleSpeed: 3.5,
      spawnInterval: 1500,
      obstacleTypes: ['low', 'high'],
      obstacleCount: 3,
      movePattern: 'straight',
      lives: 3,
      targetTime: 60,
      scoreMultiplier: 1.8
    },
    stars: {
      3: { time: 60, score: 1500 },
      2: { time: 45, score: 1000 },
      1: { time: 30, score: 500 }
    },
    unlocked: false
  },
  {
    id: 'obstacle-4',
    gameType: 2,
    subLevel: 4,
    name: '移动障碍',
    description: '障碍会左右移动',
    difficulty: 'medium',
    icon: '🌀',
    config: {
      obstacleSpeed: 3.0,
      spawnInterval: 1200,
      obstacleTypes: ['low', 'high'],
      obstacleCount: 3,
      movePattern: 'zigzag',        // 之字形移动
      lives: 3,
      targetTime: 75,
      scoreMultiplier: 2.2
    },
    stars: {
      3: { time: 75, score: 2500 },
      2: { time: 60, score: 1500 },
      1: { time: 45, score: 800 }
    },
    unlocked: false
  },
  {
    id: 'obstacle-5',
    gameType: 2,
    subLevel: 5,
    name: '密集挑战',
    description: '更多障碍，更高速度',
    difficulty: 'hard',
    icon: '💥',
    config: {
      obstacleSpeed: 4.5,
      spawnInterval: 1000,
      obstacleTypes: ['low', 'high'],
      obstacleCount: 4,
      movePattern: 'zigzag',
      lives: 2,
      targetTime: 90,
      scoreMultiplier: 2.8
    },
    stars: {
      3: { time: 90, score: 4000 },
      2: { time: 75, score: 2500 },
      1: { time: 60, score: 1200 }
    },
    unlocked: false
  },
  {
    id: 'obstacle-6',
    gameType: 2,
    subLevel: 6,
    name: '终极考验',
    description: '最快速度，最多障碍',
    difficulty: 'expert',
    icon: '🔥',
    config: {
      obstacleSpeed: 6.0,
      spawnInterval: 800,
      obstacleTypes: ['low', 'high'],
      obstacleCount: 5,
      movePattern: 'zigzag',
      lives: 1,
      targetTime: 120,
      scoreMultiplier: 3.5
    },
    stars: {
      3: { time: 120, score: 8000 },
      2: { time: 100, score: 5000 },
      1: { time: 80, score: 2500 }
    },
    unlocked: false
  }
]

/**
 * 姿势临摹关卡配置
 * 难度递增：姿势复杂度、匹配精度、时间限制、姿势数量
 */
export const POSE_MIMICRY_LEVELS = [
  {
    id: 'pose-1',
    gameType: 3,
    subLevel: 1,
    name: '简单姿势',
    description: '基础姿势，宽松匹配',
    difficulty: 'easy',
    icon: '🦸',
    config: {
      poseComplexity: 'simple',    // 简单姿势
      matchThreshold: 0.7,         // 匹配阈值（70%）
      poseCount: 3,                // 需要模仿的姿势数
      timeLimit: null,             // 无时间限制
      scoreMultiplier: 1.0,
      lives: 5
    },
    stars: {
      3: { accuracy: 0.85, time: null },
      2: { accuracy: 0.75, time: null },
      1: { accuracy: 0.65, time: null }
    },
    unlocked: true
  },
  {
    id: 'pose-2',
    gameType: 3,
    subLevel: 2,
    name: '标准姿势',
    description: '中等难度姿势',
    difficulty: 'easy',
    icon: '🦸',
    config: {
      poseComplexity: 'medium',
      matchThreshold: 0.75,
      poseCount: 5,
      timeLimit: null,
      scoreMultiplier: 1.3,
      lives: 4
    },
    stars: {
      3: { accuracy: 0.9, time: null },
      2: { accuracy: 0.8, time: null },
      1: { accuracy: 0.7, time: null }
    },
    unlocked: false
  },
  {
    id: 'pose-3',
    gameType: 3,
    subLevel: 3,
    name: '复杂姿势',
    description: '高难度姿势，需要精确',
    difficulty: 'medium',
    icon: '🎯',
    config: {
      poseComplexity: 'complex',
      matchThreshold: 0.8,
      poseCount: 7,
      timeLimit: 180,              // 3分钟
      scoreMultiplier: 1.8,
      lives: 3
    },
    stars: {
      3: { accuracy: 0.9, time: 150 },
      2: { accuracy: 0.85, time: 180 },
      1: { accuracy: 0.75, time: null }
    },
    unlocked: false
  },
  {
    id: 'pose-4',
    gameType: 3,
    subLevel: 4,
    name: '快速模仿',
    description: '时间限制，快速反应',
    difficulty: 'medium',
    icon: '⚡',
    config: {
      poseComplexity: 'complex',
      matchThreshold: 0.82,
      poseCount: 8,
      timeLimit: 150,
      scoreMultiplier: 2.2,
      lives: 3
    },
    stars: {
      3: { accuracy: 0.92, time: 120 },
      2: { accuracy: 0.85, time: 150 },
      1: { accuracy: 0.75, time: null }
    },
    unlocked: false
  },
  {
    id: 'pose-5',
    gameType: 3,
    subLevel: 5,
    name: '精准大师',
    description: '极高精度要求',
    difficulty: 'hard',
    icon: '👑',
    config: {
      poseComplexity: 'expert',
      matchThreshold: 0.85,
      poseCount: 10,
      timeLimit: 120,
      scoreMultiplier: 2.8,
      lives: 2
    },
    stars: {
      3: { accuracy: 0.95, time: 100 },
      2: { accuracy: 0.9, time: 120 },
      1: { accuracy: 0.8, time: null }
    },
    unlocked: false
  },
  {
    id: 'pose-6',
    gameType: 3,
    subLevel: 6,
    name: '终极挑战',
    description: '最高难度，完美匹配',
    difficulty: 'expert',
    icon: '🔥',
    config: {
      poseComplexity: 'expert',
      matchThreshold: 0.9,
      poseCount: 12,
      timeLimit: 100,
      scoreMultiplier: 3.5,
      lives: 1
    },
    stars: {
      3: { accuracy: 0.98, time: 80 },
      2: { accuracy: 0.92, time: 100 },
      1: { accuracy: 0.85, time: null }
    },
    unlocked: false
  }
]

/**
 * 获取所有关卡配置
 */
export function getAllLevels() {
  return [
    ...COLOR_BATTLE_LEVELS,
    ...OBSTACLE_DODGE_LEVELS,
    ...POSE_MIMICRY_LEVELS
  ]
}

/**
 * 根据游戏类型获取关卡
 */
export function getLevelsByGameType(gameType) {
  switch (gameType) {
    case 1:
      return COLOR_BATTLE_LEVELS
    case 2:
      return OBSTACLE_DODGE_LEVELS
    case 3:
      return POSE_MIMICRY_LEVELS
    default:
      return []
  }
}

/**
 * 获取关卡配置
 */
export function getLevelConfig(gameType, subLevel) {
  const levels = getLevelsByGameType(gameType)
  return levels.find(l => l.subLevel === subLevel) || null
}

/**
 * 计算星级评价
 */
export function calculateStars(levelConfig, result) {
  const { score, time, accuracy, completed } = result
  const stars = levelConfig.stars

  // 检查3星条件
  if (stars[3]) {
    let meets3Star = true
    if (stars[3].score && score < stars[3].score) meets3Star = false
    if (stars[3].time && time && time > stars[3].time) meets3Star = false
    if (stars[3].accuracy && accuracy < stars[3].accuracy) meets3Star = false
    if (meets3Star) return 3
  }

  // 检查2星条件
  if (stars[2]) {
    let meets2Star = true
    if (stars[2].score && score < stars[2].score) meets2Star = false
    if (stars[2].time && time && time > stars[2].time) meets2Star = false
    if (stars[2].accuracy && accuracy < stars[2].accuracy) meets2Star = false
    if (meets2Star) return 2
  }

  // 默认1星（完成关卡）
  return 1
}
