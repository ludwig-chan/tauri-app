<template>
  <div class="app-icon" :title="appName">
    <div v-if="iconType && iconType !== 'app'" :class="`icon icon-${iconType}`">
      {{ getIconSymbol(iconType) }}
    </div>
    <div v-else class="icon icon-default">
      📱
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  appName: string
  iconType?: string
}

const props = defineProps<Props>()

function getIconSymbol(type: string): string {
  const iconMap: Record<string, string> = {
    chrome: '🌐',
    firefox: '🦊',
    edge: '🔷',
    vscode: '💻',
    folder: '📁',
    text: '📝',
    calculator: '🔢',
    word: '📄',
    excel: '📊',
    powerpoint: '📽️',
    email: '📧',
    teams: '👥',
    discord: '💬',
    music: '🎵',
    game: '🎮'
  }
  
  return iconMap[type] || '📱'
}
</script>

<style scoped>
.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.icon-chrome {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 75%, #ea4335 100%);
}

.icon-firefox {
  background: linear-gradient(135deg, #ff6611 0%, #ff9500 100%);
}

.icon-edge {
  background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
}

.icon-vscode {
  background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
}

.icon-folder {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
}

.icon-text {
  background: linear-gradient(135deg, #e6f2ff 0%, #cce7ff 100%);
}

.icon-calculator {
  background: linear-gradient(135deg, #333333 0%, #555555 100%);
}

.icon-word {
  background: linear-gradient(135deg, #2b579a 0%, #1e4a8c 100%);
}

.icon-excel {
  background: linear-gradient(135deg, #217346 0%, #185c37 100%);
}

.icon-powerpoint {
  background: linear-gradient(135deg, #d24726 0%, #b02e0c 100%);
}

.icon-email {
  background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
}

.icon-teams {
  background: linear-gradient(135deg, #6264a7 0%, #464775 100%);
}

.icon-discord {
  background: linear-gradient(135deg, #7289da 0%, #5b6eae 100%);
}

.icon-music {
  background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
}

.icon-game {
  background: linear-gradient(135deg, #171a21 0%, #2a475e 100%);
}
</style>