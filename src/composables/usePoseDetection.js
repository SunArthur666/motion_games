import { ref, onUnmounted } from 'vue'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { useGameStore } from '@/stores/game'

/**
 * MediaPipe 姿态检测核心
 * 支持镜像模式、坐标平滑、安全区检测
 */
export function usePoseDetection(videoElement, onResults) {
  const gameStore = useGameStore()

  const pose = ref(null)
  const camera = ref(null)
  const isLoading = ref(true)
  const error = ref(null)

  // 上一次的关键点位置（用于平滑处理）
  const previousLandmarks = ref(null)
  // 平滑后的关键点缓存（避免重复创建对象）
  const smoothedCache = ref(null)

  // EMA平滑系数 (0.1-0.9，越小越平滑)
  // 根据性能模式动态调整
  const getSmoothingAlpha = () => {
    return gameStore.performanceMode === 'low' ? 0.4 : 0.3
  }

  /**
   * 使用指数移动平均(EMA)平滑坐标
   * 优化：减少对象创建，直接修改缓存对象
   */
  function smoothLandmarks(newLandmarks) {
    if (!newLandmarks || newLandmarks.length === 0) return null

    const alpha = getSmoothingAlpha()
    
    if (!previousLandmarks.value || !smoothedCache.value) {
      // 初始化：深拷贝关键点
      previousLandmarks.value = newLandmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
        presence: lm.presence
      }))
      smoothedCache.value = newLandmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
        presence: lm.presence
      }))
      return smoothedCache.value
    }

    // 优化：直接修改缓存对象，避免创建新数组
    for (let i = 0; i < newLandmarks.length; i++) {
      const landmark = newLandmarks[i]
      const prev = previousLandmarks.value[i]
      const smoothed = smoothedCache.value[i]

      if (!landmark || !prev || !smoothed) continue

      // 计算平滑后的值
      smoothed.x = prev.x + alpha * (landmark.x - prev.x)
      smoothed.y = prev.y + alpha * (landmark.y - prev.y)
      smoothed.z = landmark.z
      smoothed.visibility = landmark.visibility
      smoothed.presence = landmark.presence

      // 更新previousLandmarks用于下次计算
      prev.x = smoothed.x
      prev.y = smoothed.y
      prev.z = smoothed.z
      prev.visibility = smoothed.visibility
      prev.presence = smoothed.presence
    }

    return smoothedCache.value
  }

  /**
   * 检查全身是否在画面内（安全区检测）
   * 优化：添加边界检查和错误处理
   */
  function checkSafetyZone(landmarks) {
    if (!landmarks || landmarks.length < 33) {
      // 关键点不足，无法判断
      const status = {
        isInFrame: false,
        headVisible: false,
        feetVisible: false
      }
      gameStore.updateSafetyZone(status)
      return status
    }

    try {
      // 关键点索引
      const HEAD = 0 // 鼻子
      const LEFT_FOOT = 31 // 左脚
      const RIGHT_FOOT = 32 // 右脚

      const head = landmarks[HEAD]
      const leftFoot = landmarks[LEFT_FOOT]
      const rightFoot = landmarks[RIGHT_FOOT]

      const headVisible = head && head.visibility > 0.5
      const feetVisible =
        (leftFoot && leftFoot.visibility > 0.3) ||
        (rightFoot && rightFoot.visibility > 0.3)

      const status = {
        isInFrame: headVisible && feetVisible,
        headVisible: !!headVisible,
        feetVisible: !!feetVisible
      }

      gameStore.updateSafetyZone(status)
      return status
    } catch (e) {
      console.warn('Safety zone check error:', e)
      const status = {
        isInFrame: false,
        headVisible: false,
        feetVisible: false
      }
      gameStore.updateSafetyZone(status)
      return status
    }
  }

  /**
   * 计算自适应坐标映射
   * 以双肩中点为原点，根据肩宽动态缩放
   * 优化：添加边界检查和错误处理
   */
  function getAdaptiveMapping(landmarks, canvasWidth, canvasHeight) {
    if (!landmarks || landmarks.length < 13) {
      // 关键点不足，返回默认映射
      return {
        origin: { x: 0.5, y: 0.5 },
        scale: 1,
        shoulderWidth: 0
      }
    }

    try {
      // 肩膀关键点
      const LEFT_SHOULDER = 11
      const RIGHT_SHOULDER = 12

      const leftShoulder = landmarks[LEFT_SHOULDER]
      const rightShoulder = landmarks[RIGHT_SHOULDER]

      if (!leftShoulder || !rightShoulder) {
        return {
          origin: { x: 0.5, y: 0.5 },
          scale: 1,
          shoulderWidth: 0
        }
      }

      // 验证关键点可见性
      if (leftShoulder.visibility < 0.3 || rightShoulder.visibility < 0.3) {
        return {
          origin: { x: 0.5, y: 0.5 },
          scale: 1,
          shoulderWidth: 0
        }
      }

      // 计算双肩中点（参考原点）
      const centerX = (leftShoulder.x + rightShoulder.x) / 2
      const centerY = (leftShoulder.y + rightShoulder.y) / 2

      // 计算肩宽作为缩放基准
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)

      // 标准肩宽比例（占屏幕宽度的比例，通常0.15-0.25）
      const standardShoulderRatio = 0.2

      // 缩放因子（避免除零）
      const scale = shoulderWidth > 0.01 ? shoulderWidth / standardShoulderRatio : 1

      return {
        origin: { x: centerX, y: centerY },
        scale: Math.max(0.1, Math.min(10, scale)), // 限制缩放范围
        shoulderWidth
      }
    } catch (e) {
      console.warn('Adaptive mapping calculation error:', e)
      return {
        origin: { x: 0.5, y: 0.5 },
        scale: 1,
        shoulderWidth: 0
      }
    }
  }

  /**
   * 将归一化坐标转换为屏幕坐标
   * 支持镜像模式
   */
  function normalizedToScreen(landmark, width, height, isMirrored = true) {
    let x = landmark.x
    if (isMirrored) {
      x = 1 - x
    }
    return {
      x: x * width,
      y: landmark.y * height,
      z: landmark.z,
      visibility: landmark.visibility
    }
  }

  /**
   * MediaPipe 结果回调
   * 优化：添加错误处理和边界检查
   */
  function handleResults(results) {
    try {
      if (!results || !results.poseLandmarks || results.poseLandmarks.length === 0) {
        return
      }

      // 验证关键点数据有效性
      const validLandmarks = results.poseLandmarks.filter(
        lm => lm && typeof lm.x === 'number' && typeof lm.y === 'number'
      )
      
      if (validLandmarks.length < 10) {
        // 关键点太少，可能检测失败
        return
      }

      // 平滑处理
      const smoothedLandmarks = smoothLandmarks(results.poseLandmarks)
      
      if (!smoothedLandmarks || smoothedLandmarks.length === 0) {
        return
      }

      // 安全区检测
      try {
        checkSafetyZone(smoothedLandmarks)
      } catch (e) {
        console.warn('Safety zone check failed:', e)
      }

      // 调用外部回调
      if (onResults && typeof onResults === 'function') {
        try {
          onResults({
            landmarks: smoothedLandmarks,
            image: results.image,
            adaptiveMapping: null // 将在渲染时计算
          })
        } catch (e) {
          console.error('Error in onResults callback:', e)
        }
      }
    } catch (e) {
      console.error('Error processing pose results:', e)
      // 不抛出错误，避免中断整个检测流程
    }
  }

  /**
   * 初始化 Pose 检测
   */
  async function initialize() {
    try {
      isLoading.value = true
      error.value = null

      // 检查摄像头支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头访问。请使用 Chrome、Safari 或 Edge 浏览器。')
      }

      // 先请求摄像头权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' }
        })
        // 停止测试流
        stream.getTracks().forEach(track => track.stop())
      } catch (permError) {
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          throw new Error('请允许摄像头权限以使用体感游戏。您可以在浏览器设置中修改权限。')
        } else if (permError.name === 'NotFoundError') {
          throw new Error('未检测到摄像头。请确保摄像头已连接。')
        } else {
          throw new Error('无法访问摄像头：' + permError.message)
        }
      }

      // 初始化 Pose
      pose.value = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      pose.value.setOptions({
        modelComplexity: gameStore.performanceMode === 'low' ? 0 : 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      pose.value.onResults(handleResults)

      // 设置摄像头
      // 优化：添加帧率控制，避免过度处理
      let lastFrameTime = 0
      const targetFrameInterval = 1000 / gameStore.targetFPS // 毫秒

      camera.value = new Camera(videoElement, {
        onFrame: async () => {
          if (pose.value && !gameStore.isPaused) {
            const now = performance.now()
            // 帧率控制：只在达到目标帧率时才处理
            if (now - lastFrameTime >= targetFrameInterval) {
              lastFrameTime = now
              try {
                await pose.value.send({ image: videoElement })
              } catch (e) {
                // 静默处理错误，避免频繁日志
                if (import.meta.env.DEV) {
                  console.warn('Pose detection error:', e)
                }
              }
            }
          }
        },
        width: 1280,
        height: 720
      })

      await camera.value.start()
      isLoading.value = false

      // 追踪初始化成功
      if (typeof trackEvent === 'function') {
        trackEvent('pose_init_success', {
          performanceMode: gameStore.performanceMode
        })
      }
    } catch (e) {
      error.value = e
      isLoading.value = false
      console.error('Pose detection initialization error:', e)

      // 显示错误提示
      if (window.showError) {
        window.showError(e.message || '摄像头初始化失败')
      }

      // 追踪初始化失败
      if (typeof trackEvent === 'function') {
        trackEvent('pose_init_error', {
          error: e.message,
          errorName: e.name
        })
      }
    }
  }

  /**
   * 停止检测
   */
  function stop() {
    if (camera.value) {
      camera.value.stop()
    }
    if (pose.value) {
      pose.value.close()
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    previousLandmarks.value = null
    smoothedCache.value = null
  }

  // 清理
  onUnmounted(() => {
    stop()
  })

  return {
    pose,
    camera,
    isLoading,
    error,
    initialize,
    stop,
    reset,
    normalizedToScreen,
    getAdaptiveMapping
  }
}
