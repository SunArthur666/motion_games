/**
 * 姿势预设库
 * 用于关卡三：姿势临摹
 */

// MediaPipe 关键点索引
const POINTS = {
  nose: 0,
  left_eye: 1,
  right_eye: 2,
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_ankle: 27,
  right_ankle: 28
}

/**
 * 创建标准姿势关键点
 */
function createPose(landmarks) {
  return landmarks.map(lm => ({ ...lm }))
}

/**
 * 螃蟹姿势 - 手臂横向张开
 */
function crabPose() {
  return createPose([
    // 头部
    { x: 0.5, y: 0.15, z: 0, visibility: 1 },
    { x: 0.48, y: 0.14, z: 0, visibility: 1 },
    { x: 0.52, y: 0.14, z: 0, visibility: 1 },
    // 躯干点略
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    { x: 0, y: 0, z: 0, visibility: 0 },
    // 肩膀 - 降低
    { x: 0.4, y: 0.35, z: 0, visibility: 1 },  // left
    { x: 0.6, y: 0.35, z: 0, visibility: 1 },  // right
    // 手臂 - 横向张开
    { x: 0.25, y: 0.38, z: 0, visibility: 1 }, // left_elbow
    { x: 0.75, y: 0.38, z: 0, visibility: 1 }, // right_elbow
    { x: 0.1, y: 0.4, z: 0, visibility: 1 },   // left_wrist - 向外
    { x: 0.9, y: 0.4, z: 0, visibility: 1 },   // right_wrist - 向外
    // 臀部 - 略微弯曲
    { x: 0.42, y: 0.55, z: 0, visibility: 1 },  // left_hip
    { x: 0.58, y: 0.55, z: 0, visibility: 1 },  // right_hip
    // 膝盖 - 弯曲
    { x: 0.4, y: 0.7, z: 0, visibility: 1 },
    { x: 0.6, y: 0.7, z: 0, visibility: 1 },
    // 脚踝
    { x: 0.38, y: 0.85, z: 0, visibility: 1 },
    { x: 0.62, y: 0.85, z: 0, visibility: 1 },
    // 其余点填充
    ...Array(33 - 25).fill({ x: 0, y: 0, z: 0, visibility: 0 })
  ])
}

/**
 * 大象姿势 - 手臂在耳边扇动
 */
function elephantPose() {
  return createPose([
    // 头部
    { x: 0.5, y: 0.15, z: 0, visibility: 1 },
    { x: 0.48, y: 0.14, z: 0, visibility: 1 },
    { x: 0.52, y: 0.14, z: 0, visibility: 1 },
    // 填充
    ...Array(11).fill({ x: 0, y: 0, z: 0, visibility: 0 }),
    // 肩膀
    { x: 0.45, y: 0.32, z: 0, visibility: 1 },
    { x: 0.55, y: 0.32, z: 0, visibility: 1 },
    // 手臂 - 向上弯曲像大象鼻子
    { x: 0.42, y: 0.22, z: 0, visibility: 1 }, // left_elbow - 高
    { x: 0.58, y: 0.22, z: 0, visibility: 1 }, // right_elbow - 高
    { x: 0.35, y: 0.12, z: 0, visibility: 1 }, // left_wrist - 头旁
    { x: 0.65, y: 0.12, z: 0, visibility: 1 }, // right_wrist - 头旁
    // 臀部
    { x: 0.45, y: 0.52, z: 0, visibility: 1 },
    { x: 0.55, y: 0.52, z: 0, visibility: 1 },
    // 膝盖
    { x: 0.43, y: 0.68, z: 0, visibility: 1 },
    { x: 0.57, y: 0.68, z: 0, visibility: 1 },
    // 脚踝
    { x: 0.4, y: 0.85, z: 0, visibility: 1 },
    { x: 0.6, y: 0.85, z: 0, visibility: 1 },
    // 其余点
    ...Array(33 - 25).fill({ x: 0, y: 0, z: 0, visibility: 0 })
  ])
}

/**
 * 兔子姿势 - 手放在头上像耳朵
 */
function rabbitPose() {
  return createPose([
    // 头部
    { x: 0.5, y: 0.18, z: 0, visibility: 1 },
    { x: 0.48, y: 0.17, z: 0, visibility: 1 },
    { x: 0.52, y: 0.17, z: 0, visibility: 1 },
    // 填充
    ...Array(11).fill({ x: 0, y: 0, z: 0, visibility: 0 }),
    // 肩膀
    { x: 0.45, y: 0.35, z: 0, visibility: 1 },
    { x: 0.55, y: 0.35, z: 0, visibility: 1 },
    // 手臂 - 举到头顶上方
    { x: 0.4, y: 0.15, z: 0, visibility: 1 },  // left_elbow
    { x: 0.6, y: 0.15, z: 0, visibility: 1 },  // right_elbow
    { x: 0.35, y: 0.05, z: 0, visibility: 1 }, // left_wrist - 耳朵位置
    { x: 0.65, y: 0.05, z: 0, visibility: 1 }, // right_wrist - 耳朵位置
    // 臀部
    { x: 0.45, y: 0.52, z: 0, visibility: 1 },
    { x: 0.55, y: 0.52, z: 0, visibility: 1 },
    // 膝盖 - 微蹲
    { x: 0.43, y: 0.65, z: 0, visibility: 1 },
    { x: 0.57, y: 0.65, z: 0, visibility: 1 },
    // 脚踝
    { x: 0.4, y: 0.8, z: 0, visibility: 1 },
    { x: 0.6, y: 0.8, z: 0, visibility: 1 },
    // 其余点
    ...Array(33 - 25).fill({ x: 0, y: 0, z: 0, visibility: 0 })
  ])
}

/**
 * 超人姿势 - 双手向前伸展
 */
function supermanPose() {
  return createPose([
    // 头部
    { x: 0.5, y: 0.15, z: 0, visibility: 1 },
    { x: 0.48, y: 0.14, z: 0, visibility: 1 },
    { x: 0.52, y: 0.14, z: 0, visibility: 1 },
    // 填充
    ...Array(11).fill({ x: 0, y: 0, z: 0, visibility: 0 }),
    // 肩膀
    { x: 0.48, y: 0.35, z: 0, visibility: 1 },
    { x: 0.52, y: 0.35, z: 0, visibility: 1 },
    // 手臂 - 向前平伸
    { x: 0.45, y: 0.38, z: 0, visibility: 1 },  // left_elbow
    { x: 0.55, y: 0.38, z: 0, visibility: 1 },  // right_elbow
    { x: 0.35, y: 0.4, z: 0, visibility: 1 },   // left_wrist - 前伸
    { x: 0.65, y: 0.4, z: 0, visibility: 1 },   // right_wrist - 前伸
    // 臀部
    { x: 0.48, y: 0.52, z: 0, visibility: 1 },
    { x: 0.52, y: 0.52, z: 0, visibility: 1 },
    // 膝盖
    { x: 0.47, y: 0.68, z: 0, visibility: 1 },
    { x: 0.53, y: 0.68, z: 0, visibility: 1 },
    // 脚踝
    { x: 0.45, y: 0.85, z: 0, visibility: 1 },
    { x: 0.55, y: 0.85, z: 0, visibility: 1 },
    // 其余点
    ...Array(33 - 25).fill({ x: 0, y: 0, z: 0, visibility: 0 })
  ])
}

/**
 * 树木姿势 - 单腿站立，手臂向上
 */
function treePose() {
  return createPose([
    // 头部
    { x: 0.5, y: 0.12, z: 0, visibility: 1 },
    { x: 0.48, y: 0.11, z: 0, visibility: 1 },
    { x: 0.52, y: 0.11, z: 0, visibility: 1 },
    // 填充
    ...Array(11).fill({ x: 0, y: 0, z: 0, visibility: 0 }),
    // 肩膀
    { x: 0.48, y: 0.3, z: 0, visibility: 1 },
    { x: 0.52, y: 0.3, z: 0, visibility: 1 },
    // 手臂 - 向上伸展
    { x: 0.46, y: 0.2, z: 0, visibility: 1 },  // left_elbow
    { x: 0.54, y: 0.2, z: 0, visibility: 1 },  // right_elbow
    { x: 0.43, y: 0.08, z: 0, visibility: 1 }, // left_wrist - 高举
    { x: 0.57, y: 0.08, z: 0, visibility: 1 }, // right_wrist - 高举
    // 臀部
    { x: 0.48, y: 0.45, z: 0, visibility: 1 },
    { x: 0.52, y: 0.45, z: 0, visibility: 1 },
    // 膝盖 - 左腿支撑，右腿抬起
    { x: 0.48, y: 0.6, z: 0, visibility: 1 },  // left_knee - 直立
    { x: 0.55, y: 0.5, z: 0, visibility: 1 },  // right_knee - 抬起
    // 脚踝
    { x: 0.48, y: 0.75, z: 0, visibility: 1 }, // left_ankle
    { x: 0.6, y: 0.45, z: 0, visibility: 1 },  // right_ankle - 抬起
    // 其余点
    ...Array(33 - 25).fill({ x: 0, y: 0, z: 0, visibility: 0 })
  ])
}

/**
 * 星星姿势 - 手脚张开
 */
function starPose() {
  return createPose([
    // 头部
    { x: 0.5, y: 0.15, z: 0, visibility: 1 },
    { x: 0.48, y: 0.14, z: 0, visibility: 1 },
    { x: 0.52, y: 0.14, z: 0, visibility: 1 },
    // 填充
    ...Array(11).fill({ x: 0, y: 0, z: 0, visibility: 0 }),
    // 肩膀
    { x: 0.42, y: 0.35, z: 0, visibility: 1 },
    { x: 0.58, y: 0.35, z: 0, visibility: 1 },
    // 手臂 - 完全张开
    { x: 0.3, y: 0.4, z: 0, visibility: 1 },   // left_elbow
    { x: 0.7, y: 0.4, z: 0, visibility: 1 },   // right_elbow
    { x: 0.15, y: 0.45, z: 0, visibility: 1 }, // left_wrist - 完全张开
    { x: 0.85, y: 0.45, z: 0, visibility: 1 }, // right_wrist - 完全张开
    // 臀部
    { x: 0.45, y: 0.52, z: 0, visibility: 1 },
    { x: 0.55, y: 0.52, z: 0, visibility: 1 },
    // 膝盖 - 腿张开
    { x: 0.35, y: 0.65, z: 0, visibility: 1 }, // left_knee - 张开
    { x: 0.65, y: 0.65, z: 0, visibility: 1 }, // right_knee - 张开
    // 脚踝
    { x: 0.25, y: 0.8, z: 0, visibility: 1 },  // left_ankle
    { x: 0.75, y: 0.8, z: 0, visibility: 1 },  // right_ankle
    // 其余点
    ...Array(33 - 25).fill({ x: 0, y: 0, z: 0, visibility: 0 })
  ])
}

// 姿势库
export const POSES = {
  crab: {
    name: '🦀 螃蟹',
    emoji: '🦀',
    description: '像螃蟹一样，手臂向两边张开！',
    difficulty: 1,
    pose: crabPose
  },
  elephant: {
    name: '🐘 大象',
    emoji: '🐘',
    description: '像大象一样，把手臂放在耳边扇动！',
    difficulty: 1,
    pose: elephantPose
  },
  rabbit: {
    name: '🐰 兔子',
    emoji: '🐰',
    description: '像兔子一样，把手放在头顶当耳朵！',
    difficulty: 1,
    pose: rabbitPose
  },
  superman: {
    name: '🦸 超人',
    emoji: '🦸',
    description: '像超人一样，双手向前伸直！',
    difficulty: 2,
    pose: supermanPose
  },
  tree: {
    name: '🌳 树木',
    emoji: '🌳',
    description: '单腿站立，手臂向上伸展！',
    difficulty: 3,
    pose: treePose
  },
  star: {
    name: '⭐ 星星',
    emoji: '⭐',
    description: '把手脚都张开，变成一颗星星！',
    difficulty: 2,
    pose: starPose
  }
}

// 姿势列表（按难度排序）
export const POSE_LIST = Object.entries(POSES)
  .map(([key, value]) => ({ key, ...value }))
  .sort((a, b) => a.difficulty - b.difficulty)

// 获取随机姿势
export function getRandomPose(difficulty = null) {
  const available = difficulty
    ? POSE_LIST.filter(p => p.difficulty === difficulty)
    : POSE_LIST
  return available[Math.floor(Math.random() * available.length)]
}

// 获取姿势序列
export function getPoseSequence(count = 5, maxDifficulty = 3) {
  const available = POSE_LIST.filter(p => p.difficulty <= maxDifficulty)
  const sequence = []

  for (let i = 0; i < count; i++) {
    const pose = available[Math.floor(Math.random() * available.length)]
    sequence.push(pose)
  }

  return sequence
}
