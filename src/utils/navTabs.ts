export interface NavTab {
  path: string;
  emoji: string;
  label: string;
}

export const navTabs: NavTab[] = [
  { path: '/week', emoji: '📅', label: '月历' },
  { path: '/clipboard', emoji: '📋', label: '剪贴板' },
  { path: '/pomodoro', emoji: '🍅', label: '番茄时钟' },
  { path: '/todos', emoji: '✅', label: '待办清单' },
  { path: '/random-alarm', emoji: '⏰', label: '随机闹钟' },
  { path: '/screenshot', emoji: '🖼️', label: '截图' },
  { path: '/app-usage', emoji: '⏲️', label: '应用时间监控' },
];