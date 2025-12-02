import { dbManager } from './db'

export interface AppUsageRecord {
    id?: number
    app_name: string
    executable: string
    window_title: string
    start_time: number
    end_time: number
    duration: number
    date: string // YYYY-MM-DD
    icon?: string // 应用图标标识或base64数据
    created_at?: string
}

export interface AppUsageStats {
    app_name: string
    executable: string
    total_duration: number
    usage_count: number
    percentage: number
    icon?: string // 应用图标标识或base64数据
}

export class AppUsageDB {
    /**
     * 初始化应用使用记录表
     */
    static async initTable(): Promise<void> {
        const sql = `
            CREATE TABLE IF NOT EXISTS app_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                app_name TEXT NOT NULL,
                executable TEXT NOT NULL,
                window_title TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                date TEXT NOT NULL,
                icon TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_app_usage_date ON app_usage(date);
            CREATE INDEX IF NOT EXISTS idx_app_usage_app_name ON app_usage(app_name);
        `
        
        await dbManager.execute(sql)
    }

    /**
     * 保存应用使用记录
     */
    static async saveRecord(record: AppUsageRecord): Promise<void> {
        const date = new Date(record.start_time * 1000).toISOString().split('T')[0]
        
        const sql = `
            INSERT INTO app_usage (app_name, executable, window_title, start_time, end_time, duration, date, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
        
        await dbManager.execute(sql, [
            record.app_name,
            record.executable,
            record.window_title,
            record.start_time,
            record.end_time,
            record.duration,
            date,
            record.icon || null
        ])
    }

    /**
     * 获取指定日期的应用使用统计
     */
    static async getStatsByDate(date: string): Promise<AppUsageStats[]> {
        const sql = `
            SELECT 
                app_name,
                executable,
                SUM(duration) as total_duration,
                COUNT(*) as usage_count,
                MAX(icon) as icon
            FROM app_usage
            WHERE date = ?
            GROUP BY app_name, executable
            ORDER BY total_duration DESC
        `
        
        const results = await dbManager.select<any>(sql, [date])
        
        // 计算总时长
        const totalDuration = results.reduce((sum, item) => sum + item.total_duration, 0)
        
        // 计算百分比
        return results.map(item => ({
            app_name: item.app_name,
            executable: item.executable,
            total_duration: item.total_duration,
            usage_count: item.usage_count,
            percentage: totalDuration > 0 ? (item.total_duration / totalDuration) * 100 : 0,
            icon: item.icon
        }))
    }

    /**
     * 获取日期范围内的应用使用统计
     */
    static async getStatsByDateRange(startDate: string, endDate: string): Promise<AppUsageStats[]> {
        const sql = `
            SELECT 
                app_name,
                executable,
                SUM(duration) as total_duration,
                COUNT(*) as usage_count,
                MAX(icon) as icon
            FROM app_usage
            WHERE date BETWEEN ? AND ?
            GROUP BY app_name, executable
            ORDER BY total_duration DESC
        `
        
        const results = await dbManager.select<any>(sql, [startDate, endDate])
        
        const totalDuration = results.reduce((sum, item) => sum + item.total_duration, 0)
        
        return results.map(item => ({
            app_name: item.app_name,
            executable: item.executable,
            total_duration: item.total_duration,
            usage_count: item.usage_count,
            percentage: totalDuration > 0 ? (item.total_duration / totalDuration) * 100 : 0,
            icon: item.icon
        }))
    }

    /**
     * 获取指定日期的详细记录
     */
    static async getRecordsByDate(date: string): Promise<AppUsageRecord[]> {
        const sql = `
            SELECT * FROM app_usage
            WHERE date = ?
            ORDER BY start_time DESC
        `
        
        return await dbManager.select<AppUsageRecord>(sql, [date])
    }

    /**
     * 获取应用的使用趋势（按天）
     */
    static async getAppTrend(appName: string, days: number = 7): Promise<Array<{ date: string, duration: number }>> {
        const sql = `
            SELECT 
                date,
                SUM(duration) as duration
            FROM app_usage
            WHERE app_name = ? AND date >= date('now', '-' || ? || ' days')
            GROUP BY date
            ORDER BY date ASC
        `
        
        return await dbManager.select<any>(sql, [appName, days])
    }

    /**
     * 删除指定日期之前的记录
     */
    static async deleteOldRecords(beforeDate: string): Promise<void> {
        const sql = `DELETE FROM app_usage WHERE date < ?`
        await dbManager.execute(sql, [beforeDate])
    }

    /**
     * 获取所有已记录的日期
     */
    static async getAvailableDates(): Promise<string[]> {
        const sql = `
            SELECT DISTINCT date 
            FROM app_usage 
            ORDER BY date DESC
        `
        
        const results = await dbManager.select<{ date: string }>(sql)
        return results.map(r => r.date)
    }

    /**
     * 获取日期范围内的每日使用时长（用于趋势图）
     */
    static async getDailyUsageTrend(startDate: string, endDate: string): Promise<Array<{ date: string, total_duration: number }>> {
        const sql = `
            SELECT 
                date,
                SUM(duration) as total_duration
            FROM app_usage
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date ASC
        `
        
        return await dbManager.select<any>(sql, [startDate, endDate])
    }

    /**
     * 获取日期范围内每个应用的每日使用时长（用于堆叠趋势图）
     */
    static async getDailyAppUsageTrend(startDate: string, endDate: string, topN: number = 5): Promise<{
        dates: string[],
        apps: Array<{ app_name: string, data: number[] }>
    }> {
        // 首先获取 Top N 应用
        const topApps = await this.getStatsByDateRange(startDate, endDate)
        const topAppNames = topApps.slice(0, topN).map(app => app.app_name)
        
        if (topAppNames.length === 0) {
            return { dates: [], apps: [] }
        }

        // 获取日期范围内所有日期
        const sql = `
            SELECT DISTINCT date 
            FROM app_usage 
            WHERE date BETWEEN ? AND ?
            ORDER BY date ASC
        `
        const datesResult = await dbManager.select<{ date: string }>(sql, [startDate, endDate])
        const dates = datesResult.map(d => d.date)

        // 获取每个应用每天的使用时长
        const placeholders = topAppNames.map(() => '?').join(',')
        const detailSql = `
            SELECT 
                date,
                app_name,
                SUM(duration) as duration
            FROM app_usage
            WHERE date BETWEEN ? AND ? AND app_name IN (${placeholders})
            GROUP BY date, app_name
            ORDER BY date ASC
        `
        const details = await dbManager.select<any>(detailSql, [startDate, endDate, ...topAppNames])

        // 构建结果
        const appDataMap = new Map<string, Map<string, number>>()
        topAppNames.forEach(name => appDataMap.set(name, new Map()))

        details.forEach(item => {
            appDataMap.get(item.app_name)?.set(item.date, item.duration)
        })

        const apps = topAppNames.map(appName => ({
            app_name: appName,
            data: dates.map(date => appDataMap.get(appName)?.get(date) || 0)
        }))

        return { dates, apps }
    }

    /**
     * 获取日期范围内的总使用时长
     */
    static async getTotalDurationByDateRange(startDate: string, endDate: string): Promise<number> {
        const sql = `
            SELECT COALESCE(SUM(duration), 0) as total
            FROM app_usage
            WHERE date BETWEEN ? AND ?
        `
        const result = await dbManager.select<{ total: number }>(sql, [startDate, endDate])
        return result[0]?.total || 0
    }

    /**
     * 获取日期范围内的使用天数
     */
    static async getActiveDaysCount(startDate: string, endDate: string): Promise<number> {
        const sql = `
            SELECT COUNT(DISTINCT date) as count
            FROM app_usage
            WHERE date BETWEEN ? AND ?
        `
        const result = await dbManager.select<{ count: number }>(sql, [startDate, endDate])
        return result[0]?.count || 0
    }

    /**
     * 获取周统计数据（按周分组）
     */
    static async getWeeklyStats(weeks: number = 4): Promise<Array<{
        week_start: string,
        week_end: string,
        total_duration: number,
        app_count: number
    }>> {
        const sql = `
            SELECT 
                date(date, 'weekday 0', '-6 days') as week_start,
                date(date, 'weekday 0') as week_end,
                SUM(duration) as total_duration,
                COUNT(DISTINCT app_name) as app_count
            FROM app_usage
            WHERE date >= date('now', '-' || ? || ' weeks')
            GROUP BY week_start
            ORDER BY week_start DESC
        `
        return await dbManager.select<any>(sql, [weeks])
    }

    /**
     * 获取月统计数据（按月分组）
     */
    static async getMonthlyStats(months: number = 12): Promise<Array<{
        month: string,
        total_duration: number,
        app_count: number,
        active_days: number
    }>> {
        const sql = `
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(duration) as total_duration,
                COUNT(DISTINCT app_name) as app_count,
                COUNT(DISTINCT date) as active_days
            FROM app_usage
            WHERE date >= date('now', '-' || ? || ' months')
            GROUP BY month
            ORDER BY month DESC
        `
        return await dbManager.select<any>(sql, [months])
    }
}
