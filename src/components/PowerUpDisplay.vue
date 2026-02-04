<template>
  <div class="powerup-display">
    <transition-group name="powerup" tag="div" class="active-powerups">
      <div v-for="powerUp in activePowerUps" :key="powerUp.id" class="active-powerup">
        <span class="powerup-icon">{{ powerUp.icon }}</span>
        <div class="powerup-timer">
          <div class="timer-bar" :style="{ width: `${getProgress(powerUp) * 100}%` }"></div>
        </div>
      </div>
    </transition-group>
    <transition name="collect">
      <div v-if="showCollectMessage" class="collect-message">
        <span class="collect-icon">{{ collectIcon }}</span>
        <span class="collect-text">{{ collectMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { POWER_UPS } from '@/config/levelConfig'

const gameStore = useGameStore()
const showCollectMessage = ref(false)
const collectMessage = ref('')
const collectIcon = ref('')
const activePowerUps = computed(() => gameStore.activePowerUps)

function getProgress(powerUp) {
  const now = Date.now()
  const total = powerUp.endTime - powerUp.startTime
  const remaining = powerUp.endTime - now
  return Math.max(0, remaining / total)
}

watch(() => gameStore.collectedPowerUps.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    const lastId = gameStore.collectedPowerUps[newLen - 1]
    const powerUp = POWER_UPS[lastId]
    if (powerUp) {
      collectIcon.value = powerUp.icon
      collectMessage.value = `获得 ${powerUp.name}！`
      showCollectMessage.value = true
      setTimeout(() => { showCollectMessage.value = false }, 2000)
    }
  }
})

let updateInterval = null
onMounted(() => { updateInterval = setInterval(() => { gameStore.updatePowerUps() }, 100) })
onUnmounted(() => { if (updateInterval) clearInterval(updateInterval) })
</script>

<style scoped>
.powerup-display { position: fixed; top: 100px; right: 20px; z-index: 1500; }
.active-powerups { display: flex; flex-direction: column; gap: 10px; }
.active-powerup { display: flex; align-items: center; gap: 10px; padding: 10px 15px; background: rgba(0, 0, 0, 0.7); border-radius: 15px; backdrop-filter: blur(10px); }
.powerup-icon { font-size: 28px; }
.powerup-timer { width: 60px; height: 8px; background: rgba(255, 255, 255, 0.2); border-radius: 4px; overflow: hidden; }
.timer-bar { height: 100%; background: linear-gradient(90deg, #4ade80, #22c55e); border-radius: 4px; transition: width 0.1s linear; }
.collect-message { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 15px; padding: 20px 40px; background: linear-gradient(135deg, rgba(45, 212, 191, 0.95), rgba(20, 184, 166, 0.95)); border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); color: #fff; z-index: 3000; }
.collect-icon { font-size: 48px; animation: bounce 0.5s ease-in-out; }
@keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
.collect-text { font-size: 24px; font-weight: bold; }
.powerup-enter-active { animation: slideIn 0.3s ease-out; }
.powerup-leave-active { animation: slideOut 0.3s ease-in; }
@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100px); opacity: 0; } }
.collect-enter-active { animation: collectIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.collect-leave-active { animation: collectOut 0.3s ease-in; }
@keyframes collectIn { from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
@keyframes collectOut { from { transform: translate(-50%, -50%) scale(1); opacity: 1; } to { transform: translate(-50%, -50%) scale(0.8) translateY(-30px); opacity: 0; } }
</style>
