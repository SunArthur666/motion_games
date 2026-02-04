import { ref, onUnmounted } from 'vue'

/**
 * 粒子系统
 * 用于碰撞反馈、特效等
 */
export function useParticles(canvas) {
  const particles = ref([])
  const ghostTrails = ref([]) // 肢体轨迹延迟特效
  let animationId = null

  // 对象池：重用粒子对象，减少GC压力
  const particlePool = []
  const ghostPool = []
  const MAX_POOL_SIZE = 100

  /**
   * 粒子类
   */
  class Particle {
    constructor(x, y, options = {}) {
      this.x = x
      this.y = y
      this.vx = options.vx || (Math.random() - 0.5) * 10
      this.vy = options.vy || (Math.random() - 0.5) * 10 - 5
      this.gravity = options.gravity || 0.3
      this.life = options.life || 1.0
      this.decay = options.decay || 0.02
      this.size = options.size || Math.random() * 10 + 5
      this.color = options.color || `hsl(${Math.random() * 360}, 70%, 60%)`
      this.rotation = Math.random() * Math.PI * 2
      this.rotationSpeed = (Math.random() - 0.5) * 0.2
      this.shape = options.shape || 'circle' // 'circle' | 'square' | 'star'
    }

    update() {
      this.vy += this.gravity
      this.x += this.vx
      this.y += this.vy
      this.life -= this.decay
      this.rotation += this.rotationSpeed
    }

    draw(ctx) {
      ctx.save()
      ctx.globalAlpha = this.life
      ctx.translate(this.x, this.y)
      ctx.rotate(this.rotation)
      ctx.fillStyle = this.color

      if (this.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, this.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (this.shape === 'square') {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
      } else if (this.shape === 'star') {
        this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2)
      }

      ctx.restore()
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3
      let x = cx
      let y = cy
      const step = Math.PI / spikes

      ctx.beginPath()
      ctx.moveTo(cx, cy - outerRadius)

      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius
        y = cy + Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius
        y = cy + Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
      }

      ctx.lineTo(cx, cy - outerRadius)
      ctx.closePath()
      ctx.fill()
    }
  }

  /**
   * 肢体轨迹粒子（Ghost Effect）
   */
  class GhostParticle {
    constructor(landmarks, options = {}) {
      this.landmarks = landmarks.map(lm => ({ ...lm }))
      this.life = options.life || 1.0
      this.decay = options.decay || 0.05
      this.color = options.color || 'rgba(255, 100, 100, 0.3)'
      this.scale = options.scale || 1.0
    }

    update() {
      this.life -= this.decay
      this.scale *= 0.95
    }

    draw(ctx, canvasWidth, canvasHeight, isMirrored = true) {
      if (this.landmarks.length === 0) return

      ctx.save()
      ctx.globalAlpha = this.life * 0.5
      ctx.strokeStyle = this.color
      ctx.lineWidth = 8 * this.scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // 绘制身体骨架连接
      const connections = [
        [11, 12], // 肩膀
        [11, 13], [13, 15], // 左臂
        [12, 14], [14, 16], // 右臂
        [11, 23], [12, 24], // 躯干
        [23, 24], // 臀部
        [23, 25], [25, 27], // 左腿
        [24, 26], [26, 28]  // 右腿
      ]

      for (const [start, end] of connections) {
        const startLm = this.landmarks[start]
        const endLm = this.landmarks[end]

        if (!startLm || !endLm) continue

        let x1 = startLm.x * canvasWidth
        let y1 = startLm.y * canvasHeight
        let x2 = endLm.x * canvasWidth
        let y2 = endLm.y * canvasHeight

        if (isMirrored) {
          x1 = canvasWidth - x1
          x2 = canvasWidth - x2
        }

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  /**
   * 从对象池获取粒子，或创建新粒子
   */
  function getParticleFromPool(x, y, options) {
    let particle
    if (particlePool.length > 0) {
      particle = particlePool.pop()
      // 重置粒子属性
      particle.x = x
      particle.y = y
      particle.vx = options.vx || (Math.random() - 0.5) * 10
      particle.vy = options.vy || (Math.random() - 0.5) * 10 - 5
      particle.gravity = options.gravity || 0.3
      particle.life = options.life || 1.0
      particle.decay = options.decay || 0.02
      particle.size = options.size || Math.random() * 10 + 5
      particle.color = options.color || `hsl(${Math.random() * 360}, 70%, 60%)`
      particle.rotation = Math.random() * Math.PI * 2
      particle.rotationSpeed = (Math.random() - 0.5) * 0.2
      particle.shape = options.shape || 'circle'
    } else {
      particle = new Particle(x, y, options)
    }
    return particle
  }

  /**
   * 回收粒子到对象池
   */
  function recycleParticle(particle) {
    if (particlePool.length < MAX_POOL_SIZE) {
      particlePool.push(particle)
    }
  }

  /**
   * 创建爆炸特效
   * 优化：使用对象池减少内存分配
   */
  function createExplosion(x, y, options = {}) {
    const count = options.count || 30
    const colors = options.colors || ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']

    for (let i = 0; i < count; i++) {
      const particle = getParticleFromPool(x, y, {
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: options.shape || 'circle',
        life: options.life || 1.0,
        size: options.size || Math.random() * 15 + 5
      })
      particles.value.push(particle)
    }
  }

  /**
   * 创建气球破碎特效
   */
  function createBalloonPop(x, y, color) {
    createExplosion(x, y, {
      count: 20,
      colors: [color, '#ffffff', '#fffacd'],
      shape: 'circle',
      size: 8
    })
  }

  /**
   * 创建金币收集特效
   */
  function createCoinCollect(x, y) {
    createExplosion(x, y, {
      count: 15,
      colors: ['#ffd700', '#ffec8b', '#ffa500'],
      shape: 'star',
      size: 10,
      gravity: 0.1
    })
  }

  /**
   * 创建肢体轨迹（快速挥动时）
   */
  function createGhostTrail(landmarks, intensity = 1) {
    // 根据运动强度决定颜色
    const colors = [
      'rgba(255, 0, 0, 0.4)',
      'rgba(255, 165, 0, 0.4)',
      'rgba(255, 255, 0, 0.4)',
      'rgba(0, 255, 0, 0.4)',
      'rgba(0, 255, 255, 0.4)',
      'rgba(0, 0, 255, 0.4)'
    ]
    const color = colors[Math.floor(intensity * 5) % colors.length]

    ghostTrails.value.push(new GhostParticle(landmarks, {
      color,
      life: 0.6,
      decay: 0.08
    }))

    // 限制轨迹数量
    if (ghostTrails.value.length > 5) {
      ghostTrails.value.shift()
    }
  }

  /**
   * 更新和绘制粒子
   * 优化：使用对象池回收，减少数组操作
   */
  function update(ctx, canvasWidth, canvasHeight, isMirrored = true) {
    // 清除画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 更新和绘制普通粒子
    // 优化：使用filter代替splice，更高效
    const aliveParticles = []
    for (let i = 0; i < particles.value.length; i++) {
      const particle = particles.value[i]
      particle.update()
      
      if (particle.life > 0) {
        particle.draw(ctx)
        aliveParticles.push(particle)
      } else {
        // 回收粒子到对象池
        recycleParticle(particle)
      }
    }
    particles.value = aliveParticles

    // 更新和绘制肢体轨迹
    const aliveGhosts = []
    for (let i = 0; i < ghostTrails.value.length; i++) {
      const ghost = ghostTrails.value[i]
      ghost.update()
      
      if (ghost.life > 0) {
        ghost.draw(ctx, canvasWidth, canvasHeight, isMirrored)
        aliveGhosts.push(ghost)
      } else if (ghostPool.length < MAX_POOL_SIZE) {
        // 回收到对象池（如果需要）
        ghostPool.push(ghost)
      }
    }
    ghostTrails.value = aliveGhosts
  }

  /**
   * 开始动画循环
   */
  function startAnimation() {
    function animate() {
      if (!canvas.value) return
      const ctx = canvas.value.getContext('2d')
      update(ctx, canvas.value.width, canvas.value.height)
      animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  /**
   * 停止动画循环
   */
  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  /**
   * 清除所有粒子
   * 优化：回收所有粒子到对象池
   */
  function clear() {
    // 回收所有粒子
    particles.value.forEach(p => recycleParticle(p))
    particles.value = []
    
    // 回收所有轨迹
    ghostTrails.value.forEach(g => {
      if (ghostPool.length < MAX_POOL_SIZE) {
        ghostPool.push(g)
      }
    })
    ghostTrails.value = []
  }

  onUnmounted(() => {
    stopAnimation()
  })

  return {
    particles,
    ghostTrails,
    createExplosion,
    createBalloonPop,
    createCoinCollect,
    createGhostTrail,
    startAnimation,
    stopAnimation,
    clear
  }
}
