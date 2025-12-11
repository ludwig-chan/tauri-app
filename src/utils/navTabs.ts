export interface NavTab {
  path: string;
  emoji: string;
  label: string;
}

export interface NavGroup {
  name: string;
  tabs: NavTab[];
}

// 分组导航配置
export const navGroups: NavGroup[] = [
  {
    name: '事务管理',
    tabs: [
      { path: '/week', emoji: '📅', label: '月历' },
      { path: '/journal', emoji: '📓', label: '记录' },
      { path: '/pomodoro', emoji: '🍅', label: '番茄时钟' },
      { path: '/todos', emoji: '✅', label: '待办清单' },
      { path: '/random-alarm', emoji: '⏰', label: '随机闹钟' },
    ],
  },
  {
    name: '屏幕工具',
    tabs: [
      { path: '/screenshot', emoji: '🖼️', label: '截图' },
      { path: '/screen-record', emoji: '🎬', label: '录屏' },
      { path: '/clipboard', emoji: '📋', label: '剪贴板' },
    ],
  },
  {
    name: '数据统计',
    tabs: [
      { path: '/app-usage', emoji: '⏲️', label: '应用时间监控' },
    ],
  },
];

// 保留扁平化的 navTabs 以保持兼容性
export const navTabs: NavTab[] = navGroups.flatMap(group => group.tabs);