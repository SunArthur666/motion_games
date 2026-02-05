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
 * 轻松模式针对 4-6 岁幼童做了专门优化
 */
export const USER_DIFFICULTY_MODES = {
  easy: {
    id: 'easy',
    name: '轻松模式',
    icon: '🌟',
    description: '适合 4-6 岁，节奏慢、目标大、不扣生命',
    color: '#4ade80',
    adjustments: {
      speedMultiplier: 0.55,
      livesBonus: 4,
      spawnIntervalMultiplier: 1.6,
      targetReduction: 0.65,
      matchThresholdReduction: 0.12,
      scoreMultiplier: 0.85,
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
  // 有氧拳击
  if (config.targetLifetime) config.targetLifetime = Math.floor(config.targetLifetime * (adj.spawnIntervalMultiplier > 1 ? 1.15 : 1))
  // 健身环
  if (config.runStepsRequired) config.runStepsRequired = Math.max(5, Math.floor(config.runStepsRequired * adj.targetReduction))
  if (config.enemyCount) config.enemyCount = Math.max(1, Math.floor(config.enemyCount * adj.targetReduction))
  if (config.squatsPerEnemy && adj.forgivingMode) config.squatsPerEnemy = Math.max(2, config.squatsPerEnemy - 1)
  // 运动网球
  if (config.rallyTarget) config.rallyTarget = Math.max(3, Math.floor(config.rallyTarget * adj.targetReduction))
  if (config.ballSpeed) config.ballSpeed *= adj.speedMultiplier
  if (config.paddleWidth) config.paddleWidth = Math.floor(config.paddleWidth * (adj.forgivingMode ? 1.2 : 1))

  config.scoreMultiplier = (config.scoreMultiplier || 1) * adj.scoreMultiplier
  config.hintEnabled = adj.hintEnabled
  config.forgivingMode = adj.forgivingMode

  return { ...levelConfig, config, userDifficulty }
}

/**
 * 鼓励语配置（面向 5 岁左右幼童：简短、正向、不批评）
 */
export const ENCOURAGEMENT_CONFIG = {
  correct: [
    '太棒了！', '好厉害！', '对啦！', '真棒！', '做得好！',
    '哇，好棒！', '继续！', '加油！', '你好棒！', '拍到了！'
  ],
  streak: {
    3: ['连中三个！好棒！', '好厉害！', '继续加油！'],
    5: ['五个啦！超级棒！', '哇！', '你太厉害了！'],
    10: ['十个！你是小能手！', '太厉害了！', '棒棒哒！']
  },
  wrong: [
    '没关系，再试一次！', '下次就对了！', '慢慢来，不着急～',
    '再拍拍看！', '加油，你可以的！', '差一点点哦，再试一下！',
    '没事没事，再来！', '我们再来一次吧！'
  ],
  loseLife: [
    '还有机会哦！', '没关系，再玩一次！', '加油，你可以的！',
    '休息一下再玩吧！', '已经很棒啦！'
  ],
  gameOver: [
    '你今天玩得很棒！', '下次我们再玩！', '休息一下再来吧！',
    '你已经很厉害了！', '明天再一起玩！'
  ],
  complete: {
    1: ['过关啦！好棒！', '完成啦！', '通关了，真厉害！'],
    2: ['两颗星！好厉害！', '太棒了！', '你真棒！'],
    3: ['三颗星！完美！', '你是最棒的！', '超级厉害！']
  },
  // 开场/首次成功（幼童正向引导）
  welcome: ['一起来玩吧！', '准备好啦！', '开始吧！'],
  firstSuccess: ['对啦！就是这样！', '拍到了！好棒！', '做得好！']
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
  // 幼童友好关卡（约 5 岁）：节奏慢、目标大、数量少、星级易拿
  {
    id: 'color-1',
    gameType: 1,
    subLevel: 1,
    name: '拍拍红和蓝',
    description: '只拍红色和蓝色的气球，慢慢来～',
    difficulty: 'easy',
    icon: '🎨',
    config: {
      spawnInterval: 3800,
      balloonSpeed: 1.0,
      balloonRadius: [55, 68],
      colors: ['red', 'blue'],
      targetCount: 6,
      timeLimit: null,
      frenzyThreshold: 4,
      lives: 6,
      scoreMultiplier: 1.0
    },
    stars: {
      3: { score: 400, time: null, accuracy: 0.75 },
      2: { score: 250, time: null, accuracy: 0.55 },
      1: { score: 120, time: null, accuracy: 0.35 }
    },
    unlocked: true
  },
  {
    id: 'color-2',
    gameType: 1,
    subLevel: 2,
    name: '红蓝绿一起玩',
    description: '多了一种绿色气球，试试看～',
    difficulty: 'easy',
    icon: '🎨',
    config: {
      spawnInterval: 3200,
      balloonSpeed: 1.3,
      balloonRadius: [50, 62],
      colors: ['red', 'blue', 'green'],
      targetCount: 8,
      timeLimit: null,
      frenzyThreshold: 4,
      lives: 5,
      scoreMultiplier: 1.1
    },
    stars: {
      3: { score: 550, time: null, accuracy: 0.7 },
      2: { score: 350, time: null, accuracy: 0.5 },
      1: { score: 180, time: null, accuracy: 0.35 }
    },
    unlocked: false
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
  // 幼童友好：慢速、少障碍、易拿星
  {
    id: 'obstacle-1',
    gameType: 2,
    subLevel: 1,
    name: '小障碍跳一跳',
    description: '看到障碍就跳起来，不着急～',
    difficulty: 'easy',
    icon: '🏃',
    config: {
      obstacleSpeed: 1.4,
      spawnInterval: 2800,
      obstacleTypes: ['low'],
      obstacleCount: 1,
      movePattern: 'straight',
      lives: 6,
      targetTime: 25,
      scoreMultiplier: 1.0
    },
    stars: {
      3: { time: 25, score: 350 },
      2: { time: 15, score: 200 },
      1: { time: 8, score: 100 }
    },
    unlocked: true
  },
  {
    id: 'obstacle-2',
    gameType: 2,
    subLevel: 2,
    name: '有时要蹲下来',
    description: '高的障碍蹲一下，矮的跳过去～',
    difficulty: 'easy',
    icon: '🏃',
    config: {
      obstacleSpeed: 1.8,
      spawnInterval: 2400,
      obstacleTypes: ['low', 'high'],
      obstacleCount: 2,
      movePattern: 'straight',
      lives: 5,
      targetTime: 35,
      scoreMultiplier: 1.2
    },
    stars: {
      3: { time: 35, score: 500 },
      2: { time: 22, score: 300 },
      1: { time: 12, score: 150 }
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
  // 幼童友好：宽松匹配、少量姿势、易拿星
  {
    id: 'pose-1',
    gameType: 3,
    subLevel: 1,
    name: '学做小动作',
    description: '跟着画面做动作，像就可以啦～',
    difficulty: 'easy',
    icon: '🦸',
    config: {
      poseComplexity: 'simple',
      matchThreshold: 0.62,
      poseCount: 3,
      timeLimit: null,
      scoreMultiplier: 1.0,
      lives: 6
    },
    stars: {
      3: { accuracy: 0.7, time: null },
      2: { accuracy: 0.55, time: null },
      1: { accuracy: 0.4, time: null }
    },
    unlocked: true
  },
  {
    id: 'pose-2',
    gameType: 3,
    subLevel: 2,
    name: '多学几个动作',
    description: '再多做几个姿势，慢慢来～',
    difficulty: 'easy',
    icon: '🦸',
    config: {
      poseComplexity: 'medium',
      matchThreshold: 0.68,
      poseCount: 4,
      timeLimit: null,
      scoreMultiplier: 1.2,
      lives: 5
    },
    stars: {
      3: { accuracy: 0.75, time: null },
      2: { accuracy: 0.6, time: null },
      1: { accuracy: 0.45, time: null }
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
  // 幼童友好：少量数字、大气球、慢速、易拿星
  {
    id: 'number-1',
    gameType: 4,
    subLevel: 1,
    name: '1、2、3 拍拍',
    description: '只拍写着 1、2、3 的气球，一起来～',
    difficulty: 'easy',
    icon: '🔢',
    config: {
      spawnInterval: 3800,
      balloonSpeed: 1.0,
      balloonRadius: [55, 68],
      numbers: [1, 2, 3],
      targetCount: 5,
      timeLimit: null,
      lives: 6,
      scoreMultiplier: 1.0
    },
    stars: {
      3: { score: 320, time: null, accuracy: 0.75 },
      2: { score: 200, time: null, accuracy: 0.55 },
      1: { score: 100, time: null, accuracy: 0.35 }
    },
    unlocked: true
  },
  {
    id: 'number-2',
    gameType: 4,
    subLevel: 2,
    name: '1 到 5 都来玩',
    description: '拍 1、2、3、4、5 的气球，加油～',
    difficulty: 'easy',
    icon: '🔢',
    config: {
      spawnInterval: 3200,
      balloonSpeed: 1.3,
      balloonRadius: [50, 62],
      numbers: [1, 2, 3, 4, 5],
      targetCount: 8,
      timeLimit: null,
      lives: 5,
      scoreMultiplier: 1.1
    },
    stars: {
      3: { score: 480, time: null, accuracy: 0.7 },
      2: { score: 300, time: null, accuracy: 0.5 },
      1: { score: 150, time: null, accuracy: 0.35 }
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
 * 有氧拳击关卡配置（灵感：Fitness Boxing）
 * 左右出拳击打目标，节奏与命中率
 */
export const FITNESS_BOXING_LEVELS = [
  {
    id: 'boxing-1',
    gameType: 5,
    subLevel: 1,
    name: '左右直拳',
    description: '左拳打左边、右拳打右边，跟着节奏来～',
    difficulty: 'easy',
    icon: '🥊',
    config: {
      targetCount: 12,
      spawnInterval: 1800,
      targetLifetime: 2500,
      hitRadius: 90,
      lives: 5,
      scoreMultiplier: 1.0
    },
    stars: { 3: { score: 800, time: null, accuracy: 0.8 }, 2: { score: 500, time: null, accuracy: 0.6 }, 1: { score: 250, time: null, accuracy: 0.4 } },
    unlocked: true
  },
  {
    id: 'boxing-2',
    gameType: 5,
    subLevel: 2,
    name: '组合拳',
    description: '左右交替更快，锻炼反应',
    difficulty: 'easy',
    icon: '🥊',
    config: {
      targetCount: 18,
      spawnInterval: 1400,
      targetLifetime: 2000,
      hitRadius: 80,
      lives: 4,
      scoreMultiplier: 1.2
    },
    stars: { 3: { score: 1200, time: null, accuracy: 0.75 }, 2: { score: 750, time: null, accuracy: 0.55 }, 1: { score: 400, time: null, accuracy: 0.4 } },
    unlocked: false
  },
  {
    id: 'boxing-3',
    gameType: 5,
    subLevel: 3,
    name: '拳击达人',
    description: '高节奏连续出拳',
    difficulty: 'medium',
    icon: '🥊',
    config: {
      targetCount: 25,
      spawnInterval: 1000,
      targetLifetime: 1600,
      hitRadius: 70,
      lives: 3,
      scoreMultiplier: 1.5
    },
    stars: { 3: { score: 2000, time: null, accuracy: 0.75 }, 2: { score: 1200, time: null, accuracy: 0.6 }, 1: { score: 600, time: null, accuracy: 0.45 } },
    unlocked: false
  }
]

/**
 * 健身环关卡配置（灵感：Ring Fit Adventure）
 * 原地跑步 + 深蹲攻击
 */
export const RING_FIT_LEVELS = [
  {
    id: 'ring-1',
    gameType: 6,
    subLevel: 1,
    name: '慢跑与深蹲',
    description: '原地抬腿跑步，遇到敌人就深蹲挤压！',
    difficulty: 'easy',
    icon: '💪',
    config: {
      runStepsRequired: 15,
      enemyCount: 2,
      squatsPerEnemy: 3,
      squatHoldFrames: 15,
      lives: 5,
      scoreMultiplier: 1.0
    },
    stars: { 3: { score: 600, time: null }, 2: { score: 400, time: null }, 1: { score: 200, time: null } },
    unlocked: true
  },
  {
    id: 'ring-2',
    gameType: 6,
    subLevel: 2,
    name: '加长跑道',
    description: '多跑几步，多打几个敌人',
    difficulty: 'easy',
    icon: '💪',
    config: {
      runStepsRequired: 25,
      enemyCount: 3,
      squatsPerEnemy: 3,
      squatHoldFrames: 12,
      lives: 4,
      scoreMultiplier: 1.2
    },
    stars: { 3: { score: 1000, time: null }, 2: { score: 650, time: null }, 1: { score: 350, time: null } },
    unlocked: false
  },
  {
    id: 'ring-3',
    gameType: 6,
    subLevel: 3,
    name: '环游冒险',
    description: '长跑 + 多轮深蹲攻击',
    difficulty: 'medium',
    icon: '💪',
    config: {
      runStepsRequired: 40,
      enemyCount: 4,
      squatsPerEnemy: 4,
      squatHoldFrames: 10,
      lives: 3,
      scoreMultiplier: 1.5
    },
    stars: { 3: { score: 1800, time: null }, 2: { score: 1100, time: null }, 1: { score: 550, time: null } },
    unlocked: false
  }
]

/**
 * 运动网球关卡配置（灵感：Nintendo Switch Sports）
 * 用手当球拍接球
 */
export const SPORTS_TENNIS_LEVELS = [
  {
    id: 'tennis-1',
    gameType: 7,
    subLevel: 1,
    name: '轻松对打',
    description: '用手当球拍，把球打回去～',
    difficulty: 'easy',
    icon: '🎾',
    config: {
      ballSpeed: 4,
      rallyTarget: 8,
      paddleWidth: 120,
      lives: 5,
      scoreMultiplier: 1.0
    },
    stars: { 3: { score: 500, time: null }, 2: { score: 300, time: null }, 1: { score: 150, time: null } },
    unlocked: true
  },
  {
    id: 'tennis-2',
    gameType: 7,
    subLevel: 2,
    name: '加速球',
    description: '球速变快，连续对打',
    difficulty: 'easy',
    icon: '🎾',
    config: {
      ballSpeed: 5.5,
      rallyTarget: 12,
      paddleWidth: 100,
      lives: 4,
      scoreMultiplier: 1.2
    },
    stars: { 3: { score: 800, time: null }, 2: { score: 500, time: null }, 1: { score: 250, time: null } },
    unlocked: false
  },
  {
    id: 'tennis-3',
    gameType: 7,
    subLevel: 3,
    name: '网球高手',
    description: '快速来回，考验反应',
    difficulty: 'medium',
    icon: '🎾',
    config: {
      ballSpeed: 7,
      rallyTarget: 18,
      paddleWidth: 85,
      lives: 3,
      scoreMultiplier: 1.5
    },
    stars: { 3: { score: 1200, time: null }, 2: { score: 750, time: null }, 1: { score: 400, time: null } },
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
    ...NUMBER_RECOGNITION_LEVELS,
    ...FITNESS_BOXING_LEVELS,
    ...RING_FIT_LEVELS,
    ...SPORTS_TENNIS_LEVELS
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
    case 5:
      return FITNESS_BOXING_LEVELS
    case 6:
      return RING_FIT_LEVELS
    case 7:
      return SPORTS_TENNIS_LEVELS
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
  const isObstacle = levelConfig.gameType === 2

  // 障碍躲避：time 为存活时间，需 time >= stars[n].time；其他关卡：time 为用时，需 time <= stars[n].time
  const timeOk = (starReq, t) => {
    if (!starReq || !starReq.time || t == null) return true
    return isObstacle ? t >= starReq.time : (t <= starReq.time)
  }

  if (stars[3]) {
    let ok = true
    if (stars[3].score && score < stars[3].score) ok = false
    if (!timeOk(stars[3], time)) ok = false
    if (stars[3].accuracy != null && (accuracy == null || accuracy < stars[3].accuracy)) ok = false
    if (ok) return 3
  }
  if (stars[2]) {
    let ok = true
    if (stars[2].score && score < stars[2].score) ok = false
    if (!timeOk(stars[2], time)) ok = false
    if (stars[2].accuracy != null && (accuracy == null || accuracy < stars[2].accuracy)) ok = false
    if (ok) return 2
  }
  return 1
}
