import { ref, onUnmounted } from 'vue'

/**
 * 语音和音效系统
 * 使用 Web Speech API 进行语音播报
 * 优化：添加音频上下文管理和音效池
 */
export function useSpeech() {
  const synthesis = window.speechSynthesis
  const isSpeaking = ref(false)
  const voices = ref([])

  // 音频上下文管理（单例模式）
  let audioContext = null
  let audioContextInitialized = false

  /**
   * 初始化音频上下文（延迟初始化，避免浏览器限制）
   */
  function initAudioContext() {
    if (audioContextInitialized) return audioContext

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextInitialized = true
      
      // 如果上下文被暂停（浏览器策略），尝试恢复
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.warn('Audio context resume failed')
        })
      }
    } catch (e) {
      console.warn('Audio context initialization failed:', e)
      return null
    }

    return audioContext
  }

  /**
   * 获取音频上下文（延迟初始化）
   */
  function getAudioContext() {
    if (!audioContext) {
      return initAudioContext()
    }
    
    // 如果上下文被关闭，重新创建
    if (audioContext.state === 'closed') {
      audioContext = null
      audioContextInitialized = false
      return initAudioContext()
    }
    
    return audioContext
  }

  // 加载可用的语音
  function loadVoices() {
    voices.value = synthesis.getVoices()
  }

  // 监听语音列表变化
  synthesis.onvoiceschanged = loadVoices
  loadVoices()

  /**
   * 语音播报
   */
  function speak(text, options = {}) {
    if (!synthesis) return

    // 取消当前播报
    synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // 设置语音参数
    utterance.lang = options.lang || 'zh-CN'
    utterance.rate = options.rate || 1.0 // 语速 0.1-10
    utterance.pitch = options.pitch || 1.0 // 音调 0-2
    utterance.volume = options.volume || 1.0 // 音量 0-1

    // 选择语音（优先选择中文语音）
    if (options.voice) {
      utterance.voice = options.voice
    } else {
      const zhVoice = voices.value.find(v => v.lang.includes('zh'))
      if (zhVoice) {
        utterance.voice = zhVoice
      }
    }

    utterance.onstart = () => {
      isSpeaking.value = true
    }

    utterance.onend = () => {
      isSpeaking.value = false
    }

    utterance.onerror = () => {
      isSpeaking.value = false
    }

    synthesis.speak(utterance)
  }

  /**
   * 播报颜色（关卡一专用）
   */
  function speakColor(colorName, customMapping = {}) {
    // 使用自定义映射（如把 'Red' 改成 'Apple'）
    const mappedName = customMapping[colorName.toLowerCase()] || colorName
    speak(mappedName, { rate: 0.9, pitch: 1.2 }) // 稍慢、稍高，适合儿童
  }

  /**
   * 播报提示语
   */
  function speakPrompt(prompt) {
    speak(prompt, { rate: 0.8, pitch: 1.1 })
  }

  /**
   * 播报鼓励语
   */
  function speakEncouragement() {
    const encouragements = [
      '太棒了！',
      '做得好！',
      '继续加油！',
      '你真厉害！',
      '满分！'
    ]
    const text = encouragements[Math.floor(Math.random() * encouragements.length)]
    speak(text, { rate: 1.0, pitch: 1.3 })
  }

  /**
   * 播报分数
   */
  function speakScore(score) {
    speak(`得分 ${score}`, { rate: 1.0, pitch: 1.1 })
  }

  /**
   * 停止播报
   */
  function stopSpeaking() {
    if (synthesis) {
      synthesis.cancel()
      isSpeaking.value = false
    }
  }

  /**
   * 播放音效（使用 Web Audio API 合成）
   * 优化：使用共享的音频上下文，避免重复创建
   */
  function playSound(type) {
    const ctx = getAudioContext()
    if (!ctx) {
      // 如果音频上下文不可用，静默失败
      return
    }

    // 确保上下文处于运行状态
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // 静默处理恢复失败
      })
    }

    switch (type) {
      case 'pop':
        playPopSound(ctx)
        break
      case 'collect':
        playCollectSound(ctx)
        break
      case 'correct':
        playCorrectSound(ctx)
        break
      case 'wrong':
        playWrongSound(ctx)
        break
      case 'levelup':
        playLevelUpSound(ctx)
        break
    }
  }

  /**
   * 气球破碎音效
   */
  function playPopSound(context) {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.frequency.setValueAtTime(800, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.1)
  }

  /**
   * 收集金币音效
   */
  function playCollectSound(context) {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(1000, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(2000, context.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.2, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.2)
  }

  /**
   * 正确答案音效
   */
  function playCorrectSound(context) {
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5

    notes.forEach((freq, i) => {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.type = 'sine'
      oscillator.frequency.value = freq

      gainNode.gain.setValueAtTime(0.2, context.currentTime + i * 0.1)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + i * 0.1 + 0.3
      )

      oscillator.start(context.currentTime + i * 0.1)
      oscillator.stop(context.currentTime + i * 0.1 + 0.3)
    })
  }

  /**
   * 错误答案音效（幼童友好：柔和、不刺耳、无惩罚感）
   */
  function playWrongSound(context) {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(320, context.currentTime)
    oscillator.frequency.linearRampToValueAtTime(280, context.currentTime + 0.25)

    gainNode.gain.setValueAtTime(0.06, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.25)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.25)
  }

  /**
   * 升级音效
   */
  function playLevelUpSound(context) {
    const notes = [523.25, 659.25, 783.99, 1046.50]

    notes.forEach((freq, i) => {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.type = 'triangle'
      oscillator.frequency.value = freq

      gainNode.gain.setValueAtTime(0.15, context.currentTime + i * 0.08)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + i * 0.08 + 0.4
      )

      oscillator.start(context.currentTime + i * 0.08)
      oscillator.stop(context.currentTime + i * 0.08 + 0.4)
    })
  }

  // 清理：关闭音频上下文
  onUnmounted(() => {
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {
        // 静默处理关闭失败
      })
    }
  })

  return {
    isSpeaking,
    voices,
    speak,
    speakColor,
    speakPrompt,
    speakEncouragement,
    speakScore,
    stopSpeaking,
    playSound
  }
}
