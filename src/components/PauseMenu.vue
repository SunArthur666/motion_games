<template>
  <div class="pause-menu" @click.self="$emit('close')">
    <div class="pause-content">
      <h2>暂停</h2>

      <div class="menu-buttons">
        <button @click="resume" class="menu-btn primary">
          <span class="icon">▶️</span>
          <span>继续游戏</span>
        </button>

        <button @click="restart" class="menu-btn">
          <span class="icon">🔄</span>
          <span>重新开始</span>
        </button>

        <button @click="showSettings = true" class="menu-btn">
          <span class="icon">⚙️</span>
          <span>设置</span>
        </button>

        <button @click="exit" class="menu-btn danger">
          <span class="icon">🚪</span>
          <span>退出</span>
        </button>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-modal" @click.self="showSettings = false">
      <div class="settings-content">
        <h2>设置</h2>

        <div class="setting-item">
          <label>镜像模式</label>
          <button
            @click="toggleMirror"
            class="toggle-btn"
            :class="{ active: gameStore.isMirrored }"
          >
            {{ gameStore.isMirrored ? '开启' : '关闭' }}
          </button>
        </div>

        <div class="setting-item">
          <label>性能模式</label>
          <select v-model="performanceMode" class="select-input">
            <option value="high">高性能</option>
            <option value="low">低功耗</option>
          </select>
        </div>

        <div class="setting-item">
          <label>自定义颜色</label>
          <div class="color-inputs">
            <div v-for="(value, key) in customColors" :key="key" class="color-input">
              <label>{{ COLORS[key].name }}</label>
              <input
                v-model="customColors[key]"
                type="text"
                :placeholder="value"
                @change="updateColor(key, customColors[key])"
              />
            </div>
          </div>
        </div>

        <button @click="showSettings = false" class="close-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['close', 'restart', 'exit'])

const gameStore = useGameStore()
const showSettings = ref(false)
const performanceMode = ref('high')

const COLORS = {
  red: { name: '红色' },
  blue: { name: '蓝色' },
  green: { name: '绿色' },
  yellow: { name: '黄色' }
}

const customColors = ref({
  red: gameStore.customColors.red,
  blue: gameStore.customColors.blue,
  green: gameStore.customColors.green,
  yellow: gameStore.customColors.yellow
})

function resume() {
  gameStore.resumeGame()
  emit('close')
}

function restart() {
  emit('restart')
}

function exit() {
  gameStore.endGame()
  emit('exit')
}

function toggleMirror() {
  gameStore.toggleMirror()
}

function updateColor(key, value) {
  gameStore.updateCustomColor(key, value)
}
</script>

<style scoped>
.pause-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.pause-content {
  width: 500px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 30px;
  padding: 50px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(100, 200, 255, 0.2);
}

.pause-content h2 {
  color: #fff;
  font-size: 48px;
  text-align: center;
  margin-bottom: 40px;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px 30px;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.02);
}

.menu-btn.primary {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  font-weight: bold;
}

.menu-btn.danger {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.menu-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

.icon {
  font-size: 32px;
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.settings-content {
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  background: #1a1a2e;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.settings-content h2 {
  color: #fff;
  margin-bottom: 30px;
}

.setting-item {
  margin-bottom: 25px;
}

.setting-item > label {
  display: block;
  color: #fff;
  font-size: 18px;
  margin-bottom: 10px;
}

.toggle-btn,
.select-input {
  width: 100%;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
}

.toggle-btn.active {
  background: #64c8ff;
  color: #000;
}

.color-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.color-input {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.color-input label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.color-input input {
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 14px;
}

.close-btn {
  width: 100%;
  padding: 15px;
  background: #64c8ff;
  color: #000;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 20px;
}
</style>
