/**
 * 日期工具函数
 */

export type TimeRangeType = 'today' | 'yesterday' | 'week' | 'last7days' | 'month' | 'last30days' | 'year' | 'custom'

export interface DateRange {
    startDate: string
    endDate: string
    label: string
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
}

/**
 * 获取今天的日期字符串
 */
export function getTodayDate(): string {
    return formatDate(new Date())
}

/**
 * 获取昨天的日期字符串
 */
export function getYesterdayDate(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return formatDate(yesterday)
}

/**
 * 获取本周一的日期
 */
export function getThisWeekStart(): string {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    return formatDate(monday)
}

/**
 * 获取本周日的日期
 */
export function getThisWeekEnd(): string {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek))
    return formatDate(sunday)
}

/**
 * 获取过去 N 天的起始日期
 */
export function getDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days + 1)
    return formatDate(date)
}

/**
 * 获取本月第一天
 */
export function getThisMonthStart(): string {
    const today = new Date()
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
}

/**
 * 获取本月最后一天
 */
export function getThisMonthEnd(): string {
    const today = new Date()
    return formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
}

/**
 * 获取本年第一天
 */
export function getThisYearStart(): string {
    const today = new Date()
    return formatDate(new Date(today.getFullYear(), 0, 1))
}

/**
 * 获取本年最后一天
 */
export function getThisYearEnd(): string {
    const today = new Date()
    return formatDate(new Date(today.getFullYear(), 11, 31))
}

/**
 * 根据时间范围类型获取日期范围
 */
export function getDateRange(type: TimeRangeType, customStart?: string, customEnd?: string): DateRange {
    const today = getTodayDate()
    
    switch (type) {
        case 'today':
            return { startDate: today, endDate: today, label: '今天' }
        
        case 'yesterday':
            const yesterday = getYesterdayDate()
            return { startDate: yesterday, endDate: yesterday, label: '昨天' }
        
        case 'week':
            return { 
                startDate: getThisWeekStart(), 
                endDate: getThisWeekEnd(), 
                label: '本周' 
            }
        
        case 'last7days':
            return { 
                startDate: getDaysAgo(7), 
                endDate: today, 
                label: '近7天' 
            }
        
        case 'month':
            return { 
                startDate: getThisMonthStart(), 
                endDate: getThisMonthEnd(), 
                label: '本月' 
            }
        
        case 'last30days':
            return { 
                startDate: getDaysAgo(30), 
                endDate: today, 
                label: '近30天' 
            }
        
        case 'year':
            return { 
                startDate: getThisYearStart(), 
                endDate: getThisYearEnd(), 
                label: '本年' 
            }
        
        case 'custom':
            return { 
                startDate: customStart || today, 
                endDate: customEnd || today, 
                label: '自定义' 
            }
        
        default:
            return { startDate: today, endDate: today, label: '今天' }
    }
}

/**
 * 格式化持续时间（秒转为可读格式）
 */
export function formatDuration(seconds: number): string {
    if (seconds < 0) seconds = 0
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`
    } else if (minutes > 0) {
        return `${minutes}分钟 ${secs}秒`
    } else {
        return `${secs}秒`
    }
}

/**
 * 格式化持续时间为简短格式
 */
export function formatDurationShort(seconds: number): string {
    if (seconds < 0) seconds = 0
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
        return `${minutes}m`
    } else {
        return `${Math.floor(seconds)}s`
    }
}

/**
 * 格式化日期为显示格式
 */
export function formatDateDisplay(dateStr: string): string {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === formatDate(today)) {
        return '今天'
    } else if (dateStr === formatDate(yesterday)) {
        return '昨天'
    } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`
    }
}

/**
 * 计算两个日期之间的天数
 */
export function getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

/**
 * 获取日期范围内的所有日期
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)

    while (currentDate <= end) {
        dates.push(formatDate(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
}
