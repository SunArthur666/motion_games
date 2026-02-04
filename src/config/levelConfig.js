/**
 * 关卡配置系统
 * 参考优秀益智游戏设计：渐进式难度、明确目标、奖励机制
 */

// 关卡难度配置（用于标记关卡本身的难度）
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
 * 用户难度选择配置
 * 用于调整整体游戏难度，防止小朋友产生挫败感
 */
export const USER_DIFFICULTY_MODES = {
  easy: {
    id: 'easy',
    name: '轻松模式',
    icon: '🌟',
    description: '适合初学者，更多生命，更慢速度',
    color: '#4ade80',
    adjustments: {
      speedMultiplier: 0.6,
      livesBonus: 3,
      spawnIntervalMultiplier: 1.5,
      targetReduction: 0.7,
      matchThresholdReduction: 0.1,
      scoreMultiplier: 0.8,
      hintEnabled: true,
      forgivingMode: true
    }
  },
  normal: {
    id: 'normal',
    name: '普通模式',
    icon: '⭐',
    description: '标准难度，平衡的游戏体验',
    color: '#ffd93d',
    adjustments: {
      speedMultiplier: 1.0,
      livesBonus: 0,
      spawnIntervalMultiplier: 1.0,
      targetReduction: 1.0,
      matchThresholdReduction: 0,
      scoreMultiplier: 1.0,
      hintEnabled: false,
      forgivingMode: false
    }
  },
  hard: {
    id: 'hard',
    name: '挑战模式',
    icon: '🔥',
    description: '高手专属，更快速度，更高要求',
    color: '#ef4444',
    adjustments: {
      speedMultiplier: 1.3,
      livesBonus: -1,
      spawnIntervalMultiplier: 0.8,
      targetReduction: 1.2,
      matchThresholdReduction: -0.05,
      scoreMultiplier: 1.5,
      hintEnabled: false,
      forgivingMode: false
    }
  }
}

/**
 * 根据用户选择的难度调整关卡配置
 */
export function applyDifficultyAdjustments(levelConfig, userDifficulty) {
  const mode = USER_DIFFICULTY_MODES[userDifficulty] || USER_DIFFICULTY_MODES.normal
  const adj = mode.adjustments
  const config = { ...levelConfig.config }

  if (config.balloonSpeed) config.balloonSpeed *= adj.speedMultiplier
  if (config.obstacleSpeed) config.obstacleSpeed *= adj.speedMultiplier
  if (config.lives) config.lives = Math.max(1, config.lives + adj.livesBonus)
  if (config.spawnInterval) config.spawnInterval *= adj.spawnIntervalMultiplier
  if (config.targetCount) config.targetCount = Math.max(3, Math.floor(config.targetCount * adj.targetReduction))
  if (config.matchThreshold) config.matchThreshold = Math.max(0.5, config.matchThreshold - adj.matchThresholdReduction)

  config.scoreMultiplier = (config.scoreMultiplier || 1) * adj.scoreMultiplier
  config.hintEnabled = adj.hintEnabled
  config.forgivingMode = adj.forgivingMode

  return { ...levelConfig, config, userDifficulty }
}

/**
 * 鼓励语配置
 */
export const ENCOURAGEMENT_CONFIG = {
  correct: ['太棒了！', '做得好！', '真厉害！', '继续加油！', '完美！', '你真聪明！', '好极了！', '真不错！'],
  streak: {
    3: ['连续3个！太棒了！', '三连击！', '厉害！'],
    5: ['连续5个！你是高手！', '五连击！超级！', '哇！'],
    10: ['10连击！无敌了！', '太强了！', '天才！']
  },
  wrong: ['没关系，再试一次！', '加油，你可以的！', '差一点点，继续！', '别灰心！', '慢慢来，不着急！'],
  loseLife: ['别担心，还有机会！', '加油，你能做到！', '慢慢来，别着急！'],
  gameOver: ['你已经很棒了！', '下次会更好的！', '每次都在进步！'],
  complete: {
    1: ['完成了！继续努力！', '通关了！'],
    2: ['太棒了！两颗星！', '优秀！'],
    3: ['完美！三颗星！', '你是最棒的！', '天才！']
  }
}

/**
 * 趣味道具配置
 */
export const POWER_UPS = {
  slowTime: { id: 'slowTime', name: '时间减速', icon: '⏱️', description: '减慢所有物体速度5秒', duration: 5000, effect: { speedMultiplier: 0.5 } },
  shield: { id: 'shield', name: '保护罩', icon: '🛡️', description: '免疫一次错误', duration: 10000, effect: { invincible: true } },
  magnet: { id: 'magnet', name: '磁铁', icon: '🧲', description: '自动吸引正确的目标', duration: 5000, effect: { autoAttract: true } },
  doublePoints: { id: 'doublePoints', name: '双倍积分', icon: '✨', description: '得分翻倍10秒', duration: 10000, effect: { scoreMultiplier: 2 } },
  extraLife: { id: 'extraLife', name: '额外生命', icon: '❤️', description: '获得一条额外生命', duration: 0, effect: { addLife: 1 } }
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
 * 数字识别关卡配置
 * 难度递增：数字范围、速度、数量
 */
export const NUMBER_RECOGNITION_LEVELS = [
  {
    id: 'number-1',
    gameType: 4,
    subLevel: 1,
    name: '认识数字1-3',
    description: '学习基础数字',
    difficulty: 'easy',
    icon: '🔢',
    config: {
      spawnInterval: 3000,
      balloonSpeed: 1.5,
      balloonRadius: [50, 60],
      numbers: [1, 2, 3],
      targetCount: 8,
      timeLimit: null,
      lives: 5,
      scoreMultiplier: 1.0
    },
    stars: {
      3: { score: 800, time: null, accuracy: 0.9 },
      2: { score: 500, time: null, accuracy: 0.7 },
      1: { score: 250, time: null, accuracy: 0.5 }
    },
    unlocked: true
  },
  {
    id: 'number-2',
    gameType: 4,
    subLevel: 2,
    name: '数字1-5',
    description: '扩展数字范围',
    difficulty: 'easy',
    icon: '🔢',
    config: {
      spawnInterval: 2500,
      balloonSpeed: 2.0,
      balloonRadius: [45, 55],
      numbers: [1, 2, 3, 4, 5],
      targetCount: 12,
      timeLimit: null,
      lives: 4,
      scoreMultiplier: 1.2
    },
    stars: {
      3: { score: 1200, time: null, accuracy: 0.85 },
      2: { score: 750, time: null, accuracy: 0.7 },
      1: { score: 400, time: null, accuracy: 0.5 }
    },
    unlocked: false
  },
  {
    id: 'number-3',
    gameType: 4,
    subLevel: 3,
    name: '数字1-9',
    description: '所有个位数',
    difficulty: 'medium',
    icon: '🔢',
    config: {
      spawnInterval: 2000,
      balloonSpeed: 2.5,
      balloonRadius: [40, 50],
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      targetCount: 15,
      timeLimit: null,
      lives: 3,
      scoreMultiplier: 1.5
    },
    stars: {
      3: { score: 2000, time: null, accuracy: 0.8 },
      2: { score: 1200, time: null, accuracy: 0.65 },
      1: { score: 600, time: null, accuracy: 0.5 }
    },
    unlocked: false
  },
  {
    id: 'number-4',
    gameType: 4,
    subLevel: 4,
    name: '快速识别',
    description: '速度挑战',
    difficulty: 'medium',
    icon: '⚡',
    config: {
      spawnInterval: 1500,
      balloonSpeed: 3.5,
      balloonRadius: [35, 45],
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      targetCount: 20,
      timeLimit: 120,
      lives: 3,
      scoreMultiplier: 2.0
    },
    stars: {
      3: { score: 3500, time: 90, accuracy: 0.75 },
      2: { score: 2200, time: 120, accuracy: 0.6 },
      1: { score: 1100, time: null, accuracy: 0.5 }
    },
    unlocked: false
  },
  {
    id: 'number-5',
    gameType: 4,
    subLevel: 5,
    name: '包含0',
    description: '学习数字0',
    difficulty: 'hard',
    icon: '🎯',
    config: {
      spawnInterval: 1200,
      balloonSpeed: 4.0,
      balloonRadius: [30, 40],
      numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      targetCount: 25,
      timeLimit: 100,
      lives: 2,
      scoreMultiplier: 2.5
    },
    stars: {
      3: { score: 5000, time: 80, accuracy: 0.85 },
      2: { score: 3500, time: 100, accuracy: 0.7 },
      1: { score: 1800, time: null, accuracy: 0.55 }
    },
    unlocked: false
  },
  {
    id: 'number-6',
    gameType: 4,
    subLevel: 6,
    name: '数字大师',
    description: '最高难度',
    difficulty: 'expert',
    icon: '🔥',
    config: {
      spawnInterval: 800,
      balloonSpeed: 5.0,
      balloonRadius: [25, 35],
      numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      targetCount: 30,
      timeLimit: 90,
      lives: 1,
      scoreMultiplier: 3.0
    },
    stars: {
      3: { score: 8000, time: 70, accuracy: 0.9 },
      2: { score: 5500, time: 90, accuracy: 0.75 },
      1: { score: 3000, time: null, accuracy: 0.6 }
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
    ...POSE_MIMICRY_LEVELS,
    ...NUMBER_RECOGNITION_LEVELS
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
    case 4:
      return NUMBER_RECOGNITION_LEVELS
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
