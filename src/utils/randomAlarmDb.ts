import { execSQL, initDB, selectSQL } from './db'

export interface RandomAlarm {
    id?: number
    name: string
    daily_count: number
    completed_today: number
    is_active: boolean
    created_at?: string
    last_reset_date?: string
}

export interface AlarmReminder {
    id?: number
    alarm_id: number
    scheduled_time: string
    is_completed: boolean
    is_snoozed: boolean
    created_at?: string
}

export async function initializeRandomAlarmTables() {
    await initDB()
    
    // 创建随机闹钟表
    const createAlarmTableSQL = `
        CREATE TABLE IF NOT EXISTS random_alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            daily_count INTEGER NOT NULL,
            completed_today INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_reset_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    
    // 创建提醒记录表
    const createReminderTableSQL = `
        CREATE TABLE IF NOT EXISTS alarm_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alarm_id INTEGER NOT NULL,
            scheduled_time TIMESTAMP NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT 0,
            is_snoozed BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alarm_id) REFERENCES random_alarms (id) ON DELETE CASCADE
        )
    `
    
    try {
        await execSQL(createAlarmTableSQL)
        await execSQL(createReminderTableSQL)
        console.log('随机闹钟表初始化成功')
    } catch (error) {
        console.error('初始化随机闹钟表失败:', error)
        throw error
    }
}

// 获取所有闹钟
export async function getAllAlarms(): Promise<RandomAlarm[]> {
    const sql = 'SELECT * FROM random_alarms ORDER BY created_at DESC'
    return await selectSQL<RandomAlarm>(sql)
}

// 添加新闹钟
export async function addAlarm(name: string, dailyCount: number): Promise<void> {
    const sql = `
        INSERT INTO random_alarms (name, daily_count, last_reset_date)
        VALUES (?, ?, date('now'))
    `
    await execSQL(sql, [name, dailyCount])
}

// 更新闹钟
export async function updateAlarm(id: number, name: string, dailyCount: number): Promise<void> {
    const sql = `
        UPDATE random_alarms
        SET name = ?, daily_count = ?
        WHERE id = ?
    `
    await execSQL(sql, [name, dailyCount, id])
}

// 切换闹钟激活状态
export async function toggleAlarmActive(id: number, isActive: boolean): Promise<void> {
    const sql = 'UPDATE random_alarms SET is_active = ? WHERE id = ?'
    await execSQL(sql, [isActive ? 1 : 0, id])
}

// 删除闹钟
export async function deleteAlarm(id: number): Promise<void> {
    const sql = 'DELETE FROM random_alarms WHERE id = ?'
    await execSQL(sql, [id])
}

// 完成一次提醒
export async function completeReminder(alarmId: number): Promise<void> {
    const sql = `
        UPDATE random_alarms
        SET completed_today = completed_today + 1
        WHERE id = ?
    `
    await execSQL(sql, [alarmId])
}

// 重置每日计数（每天自动调用）
export async function resetDailyCount(): Promise<void> {
    const sql = `
        UPDATE random_alarms
        SET completed_today = 0, last_reset_date = date('now')
        WHERE last_reset_date < date('now')
    `
    await execSQL(sql)
}

// 添加提醒记录
export async function addReminder(alarmId: number, scheduledTime: string): Promise<void> {
    const sql = `
        INSERT INTO alarm_reminders (alarm_id, scheduled_time)
        VALUES (?, ?)
    `
    await execSQL(sql, [alarmId, scheduledTime])
}

// 获取今天的提醒
export async function getTodayReminders(alarmId: number): Promise<AlarmReminder[]> {
    const sql = `
        SELECT * FROM alarm_reminders
        WHERE alarm_id = ?
        AND date(scheduled_time) = date('now')
        ORDER BY scheduled_time
    `
    return await selectSQL<AlarmReminder>(sql, [alarmId])
}
