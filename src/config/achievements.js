/**
 * 成就配置
 */

export const ACHIEVEMENTS = [
  {
    id: 'first_play',
    name: '初次体验',
    description: '完成第一局游戏',
    icon: '🎮',
    check: (stats, progress) => (stats.totalGamesPlayed || 0) >= 1
  },
  {
    id: 'color_master',
    name: '色彩达人',
    description: '色彩大作战任意关卡获得3星',
    icon: '🎨',
    check: (stats, progress) => Object.entries(progress || {}).some(([id, p]) => id.startsWith('color-') && (p.stars || 0) >= 3)
  },
  {
    id: 'dodge_master',
    name: '躲避高手',
    description: '障碍躲避任意关卡获得3星',
    icon: '🏃',
    check: (stats, progress) => Object.entries(progress || {}).some(([id, p]) => id.startsWith('obstacle-') && (p.stars || 0) >= 3)
  },
  {
    id: 'pose_master',
    name: '姿势达人',
    description: '姿势临摹任意关卡获得3星',
    icon: '🦸',
    check: (stats, progress) => Object.entries(progress || {}).some(([id, p]) => id.startsWith('pose-') && (p.stars || 0) >= 3)
  },
  {
    id: 'number_master',
    name: '数字小能手',
    description: '数字识别任意关卡获得3星',
    icon: '🔢',
    check: (stats, progress) => Object.entries(progress || {}).some(([id, p]) => id.startsWith('number-') && (p.stars || 0) >= 3)
  },
  {
    id: 'streak_5',
    name: '五连击',
    description: '单局内达成5连击',
    icon: '🔥',
    check: (stats) => (stats.bestStreak || 0) >= 5
  },
  {
    id: 'streak_10',
    name: '十连击',
    description: '单局内达成10连击',
    icon: '⭐',
    check: (stats) => (stats.bestStreak || 0) >= 10
  },
  {
    id: 'stars_10',
    name: '星星收集者',
    description: '累计获得10颗星',
    icon: '🌟',
    check: (stats, progress) => {
      const total = Object.values(progress || {}).reduce((s, p) => s + (p.stars || 0), 0)
      return total >= 10
    }
  },
  {
    id: 'stars_30',
    name: '星光闪耀',
    description: '累计获得30颗星',
    icon: '✨',
    check: (stats, progress) => {
      const total = Object.values(progress || {}).reduce((s, p) => s + (p.stars || 0), 0)
      return total >= 30
    }
  },
  {
    id: 'games_10',
    name: '小玩家',
    description: '累计游玩10局',
    icon: '🎯',
    check: (stats) => (stats.totalGamesPlayed || 0) >= 10
  },
  {
    id: 'correct_50',
    name: '精准王',
    description: '累计正确击中50次',
    icon: '💯',
    check: (stats) => (stats.totalCorrect || 0) >= 50
  }
]

export function getUnlockedAchievements(statistics, levelProgress) {
  return ACHIEVEMENTS.filter(a => a.check(statistics, levelProgress))
}

export function getAchievementProgress(statistics, levelProgress) {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: a.check(statistics, levelProgress)
  }))
}
