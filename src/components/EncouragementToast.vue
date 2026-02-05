<template>
  <transition name="encouragement">
    <div v-if="visible" class="encouragement-toast" :class="type" :style="positionStyle">
      <div class="encouragement-content">
        <span class="encouragement-icon">{{ icon }}</span>
        <span class="encouragement-text">{{ message }}</span>
        <span v-if="streak > 0" class="streak-badge">{{ streak }}连击!</span>
      </div>
      <div v-if="showStars" class="stars-effect">
        <span v-for="i in 5" :key="i" class="star" :style="{ animationDelay: `${i * 0.1}s` }">⭐</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'correct' },
  streak: { type: Number, default: 0 },
  duration: { type: Number, default: 2000 },
  position: { type: String, default: 'center' }
})

const visible = ref(false)
let timeoutId = null

const icon = computed(() => {
  const icons = { correct: '🎉', wrong: '💪', streak: '🔥', complete: '🏆', powerup: '✨', welcome: '👋' }
  return icons[props.type] || '🎉'
})

const showStars = computed(() => props.type === 'streak' && props.streak >= 5)

const positionStyle = computed(() => {
  const positions = {
    top: { top: '100px', bottom: 'auto' },
    center: { top: '50%', transform: 'translate(-50%, -50%)' },
    bottom: { top: 'auto', bottom: '150px' }
  }
  return positions[props.position] || positions.center
})

function show() {
  if (timeoutId) clearTimeout(timeoutId)
  visible.value = true
  timeoutId = setTimeout(() => { visible.value = false }, props.duration)
}

function hide() {
  visible.value = false
  if (timeoutId) clearTimeout(timeoutId)
}

watch(() => props.message, (newVal) => { if (newVal) show() })

defineExpose({ show, hide })
</script>

<style scoped>
.encouragement-toast { position: fixed; left: 50%; transform: translateX(-50%); z-index: 3000; pointer-events: none; }
.encouragement-content { display: flex; align-items: center; gap: 15px; padding: 20px 40px; background: rgba(0, 0, 0, 0.85); border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); }
.encouragement-toast.correct .encouragement-content,
.encouragement-toast.welcome .encouragement-content { background: linear-gradient(135deg, rgba(74, 222, 128, 0.9), rgba(34, 197, 94, 0.9)); color: #fff; }
.encouragement-toast.wrong .encouragement-content { background: linear-gradient(135deg, rgba(100, 200, 255, 0.9), rgba(59, 130, 246, 0.9)); color: #fff; }
.encouragement-toast.streak .encouragement-content { background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9)); color: #000; }
.encouragement-toast.complete .encouragement-content { background: linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.9)); color: #fff; }
.encouragement-icon { font-size: 48px; animation: bounce 0.5s ease-in-out; }
@keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
.encouragement-text { font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); }
.streak-badge { padding: 5px 15px; background: rgba(255, 255, 255, 0.3); border-radius: 15px; font-size: 18px; font-weight: bold; animation: pulse 0.5s ease-in-out infinite alternate; }
@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.1); } }
.stars-effect { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
.stars-effect .star { position: absolute; font-size: 24px; animation: starBurst 0.8s ease-out forwards; }
.stars-effect .star:nth-child(1) { --angle: 0deg; }
.stars-effect .star:nth-child(2) { --angle: 72deg; }
.stars-effect .star:nth-child(3) { --angle: 144deg; }
.stars-effect .star:nth-child(4) { --angle: 216deg; }
.stars-effect .star:nth-child(5) { --angle: 288deg; }
@keyframes starBurst { 0% { transform: rotate(var(--angle)) translateY(0) scale(0); opacity: 1; } 100% { transform: rotate(var(--angle)) translateY(-80px) scale(1); opacity: 0; } }
.encouragement-enter-active { animation: encouragementIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.encouragement-leave-active { animation: encouragementOut 0.3s ease-in; }
@keyframes encouragementIn { 0% { transform: translateX(-50%) scale(0.5); opacity: 0; } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }
@keyframes encouragementOut { 0% { transform: translateX(-50%) scale(1); opacity: 1; } 100% { transform: translateX(-50%) scale(0.8) translateY(-30px); opacity: 0; } }
</style>
