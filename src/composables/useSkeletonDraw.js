/**
 * 骨骼绘制工具
 * 使用 MediaPipe Pose 的33个关键点绘制人体骨骼
 */

// MediaPipe Pose 关键点连接关系（33个关键点）
const POSE_CONNECTIONS = [
  // 面部
  [0, 1], [1, 2], [2, 3], [3, 7],  // 左眼
  [0, 4], [4, 5], [5, 6], [6, 8],  // 右眼
  // 躯干
  [11, 12],  // 肩膀
  [11, 13], [13, 15],  // 左臂
  [12, 14], [14, 16],  // 右臂
  [11, 23], [12, 24],  // 肩膀到臀部
  [23, 24],  // 跨部
  // 左腿
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // 右腿
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
  // 手部细节（可选）
  [15, 17], [15, 19], [15, 21], [17, 19],  // 左手
  [16, 18], [16, 20], [16, 22], [18, 20]   // 右手
]

// 关键点名称（用于调试）
const LANDMARK_NAMES = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
  'right_eye_inner', 'right_eye', 'right_eye_outer',
  'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
  'left_index', 'right_index', 'left_thumb', 'right_thumb',
  'left_hip', 'right_hip', 'left_knee', 'right_knee',
  'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index'
]

/**
 * 绘制骨骼
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {Array} landmarks - 关键点数组（33个）
 * @param {Number} width - 画布宽度
 * @param {Number} height - 画布高度
 * @param {Boolean} isMirrored - 是否镜像
 */
export function drawSkeleton(ctx, landmarks, width, height, isMirrored = true) {
  if (!landmarks || landmarks.length < 33) return

  ctx.save()
  ctx.strokeStyle = '#00ff00'
  ctx.fillStyle = '#00ff00'
  ctx.lineWidth = 3

  // 绘制连接线
  POSE_CONNECTIONS.forEach(([start, end]) => {
    const startPoint = landmarks[start]
    const endPoint = landmarks[end]

    if (!startPoint || !endPoint) return
    if (startPoint.visibility < 0.3 || endPoint.visibility < 0.3) return

    let startX = startPoint.x * width
    let startY = startPoint.y * height
    let endX = endPoint.x * width
    let endY = endPoint.y * height

    if (isMirrored) {
      startX = width - startX
      endX = width - endX
    }

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  })

  // 绘制关键点
  landmarks.forEach((landmark, index) => {
    if (!landmark || landmark.visibility < 0.3) return

    let x = landmark.x * width
    let y = landmark.y * height

    if (isMirrored) {
      x = width - x
    }

    // 根据关键点类型设置不同大小
    let radius = 4
    if (index === 0) radius = 6 // 鼻子
    else if ([11, 12].includes(index)) radius = 8 // 肩膀
    else if ([13, 14, 15, 16].includes(index)) radius = 6 // 肘部和手腕
    else if ([23, 24].includes(index)) radius = 8 // 臀部
    else if ([25, 26, 27, 28].includes(index)) radius = 6 // 膝盖和脚踝

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}

/**
 * 绘制简化的骨骼（只显示主要连接）
 */
export function drawSimpleSkeleton(ctx, landmarks, width, height, isMirrored = true) {
  if (!landmarks || landmarks.length < 33) return

  ctx.save()
  ctx.strokeStyle = '#00ff00'
  ctx.fillStyle = '#00ff00'
  ctx.lineWidth = 2

  // 主要连接：躯干、手臂、腿部
  const mainConnections = [
    // 躯干
    [11, 12], [11, 23], [12, 24], [23, 24],
    // 左臂
    [11, 13], [13, 15],
    // 右臂
    [12, 14], [14, 16],
    // 左腿
    [23, 25], [25, 27],
    // 右腿
    [24, 26], [26, 28]
  ]

  mainConnections.forEach(([start, end]) => {
    const startPoint = landmarks[start]
    const endPoint = landmarks[end]

    if (!startPoint || !endPoint) return
    if (startPoint.visibility < 0.3 || endPoint.visibility < 0.3) return

    let startX = startPoint.x * width
    let startY = startPoint.y * height
    let endX = endPoint.x * width
    let endY = endPoint.y * height

    if (isMirrored) {
      startX = width - startX
      endX = width - endX
    }

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  })

  // 绘制主要关键点
  const mainPoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
  mainPoints.forEach(index => {
    const landmark = landmarks[index]
    if (!landmark || landmark.visibility < 0.3) return

    let x = landmark.x * width
    let y = landmark.y * height

    if (isMirrored) {
      x = width - x
    }

    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}
