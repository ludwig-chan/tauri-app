import { dbManager } from './db'

export interface Habit {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string | null
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'hourly'
  recurrence_interval: number // 间隔，如每2天、每3周
  time_periods: string | null // JSON字符串: ["morning", "afternoon", "evening"]
  reminder_times: string | null // JSON字符串: ["08:00", "14:00", "20:00"]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitCompletion {
  id: number
  habit_id: number
  completion_date: string
  time_period: string | null // "morning" | "afternoon" | "evening"
  completed_at: string
}

class HabitDB {
  /**
   * 初始化习惯表
   */
  async initTables(): Promise<void> {
    const createHabitsTable = `
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('daily', 'weekly', 'monthly', 'hourly')),
        recurrence_interval INTEGER NOT NULL DEFAULT 1,
        time_periods TEXT,
        reminder_times TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `

    const createCompletionsTable = `
      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        completion_date TEXT NOT NULL,
        time_period TEXT,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      )
    `

    await dbManager.execute(createHabitsTable)
    await dbManager.execute(createCompletionsTable)
  }

  /**
   * 创建新习惯
   */
  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const now = new Date().toISOString()
    const result = await dbManager.execute(
      `INSERT INTO habits (name, description, start_date, end_date, recurrence_type, 
        recurrence_interval, time_periods, reminder_times, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habit.name,
        habit.description,
        habit.start_date,
        habit.end_date,
        habit.recurrence_type,
        habit.recurrence_interval,
        habit.time_periods,
        habit.reminder_times,
        habit.is_active ? 1 : 0,
        now,
        now
      ]
    )
    return result.lastInsertId
  }

  /**
   * 获取所有习惯
   */
  async getAllHabits(): Promise<Habit[]> {
    const habits = await dbManager.select<any>(
      'SELECT * FROM habits ORDER BY created_at DESC'
    )
    return habits.map(h => ({
      ...h,
      is_active: Boolean(h.is_active)
    }))
  }

  /**
   * 获取活跃的习惯
   */
  async getActiveHabits(): Promise<Habit[]> {
    const habits = await dbManager.select<any>(
      'SELECT * FROM habits WHERE is_active = 1 ORDER BY created_at DESC'
    )
    return habits.map(h => ({
      ...h,
      is_active: Boolean(h.is_active)
    }))
  }

  /**
   * 更新习惯
   */
  async updateHabit(id: number, updates: Partial<Omit<Habit, 'id' | 'created_at'>>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'is_active') {
        fields.push(`${key} = ?`)
        values.push(value ? 1 : 0)
      } else {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    await dbManager.execute(
      `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
  }

  /**
   * 删除习惯
   */
  async deleteHabit(id: number): Promise<void> {
    await dbManager.execute('DELETE FROM habits WHERE id = ?', [id])
  }

  /**
   * 记录习惯完成
   */
  async markHabitComplete(
    habitId: number,
    completionDate: string,
    timePeriod: string | null = null
  ): Promise<number> {
    const now = new Date().toISOString()
    const result = await dbManager.execute(
      `INSERT INTO habit_completions (habit_id, completion_date, time_period, completed_at)
       VALUES (?, ?, ?, ?)`,
      [habitId, completionDate, timePeriod, now]
    )
    return result.lastInsertId
  }

  /**
   * 删除习惯完成记录
   */
  async unmarkHabitComplete(habitId: number, completionDate: string, timePeriod: string | null = null): Promise<void> {
    if (timePeriod) {
      await dbManager.execute(
        'DELETE FROM habit_completions WHERE habit_id = ? AND completion_date = ? AND time_period = ?',
        [habitId, completionDate, timePeriod]
      )
    } else {
      await dbManager.execute(
        'DELETE FROM habit_completions WHERE habit_id = ? AND completion_date = ? AND time_period IS NULL',
        [habitId, completionDate]
      )
    }
  }

  /**
   * 获取习惯的完成记录
   */
  async getHabitCompletions(habitId: number, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    let sql = 'SELECT * FROM habit_completions WHERE habit_id = ?'
    const params: any[] = [habitId]

    if (startDate) {
      sql += ' AND completion_date >= ?'
      params.push(startDate)
    }

    if (endDate) {
      sql += ' AND completion_date <= ?'
      params.push(endDate)
    }

    sql += ' ORDER BY completion_date DESC, completed_at DESC'

    return await dbManager.select<HabitCompletion>(sql, params)
  }

  /**
   * 检查某天某时段是否已完成
   */
  async isHabitCompleted(habitId: number, date: string, timePeriod: string | null = null): Promise<boolean> {
    let sql = 'SELECT COUNT(*) as count FROM habit_completions WHERE habit_id = ? AND completion_date = ?'
    const params: any[] = [habitId, date]

    if (timePeriod) {
      sql += ' AND time_period = ?'
      params.push(timePeriod)
    } else {
      sql += ' AND time_period IS NULL'
    }

    const result = await dbManager.select<{ count: number }>(sql, params)
    return result[0]?.count > 0
  }

  /**
   * 获取习惯的统计数据
   */
  async getHabitStats(habitId: number, days: number = 30): Promise<{
    totalDays: number
    completedDays: number
    completionRate: number
    currentStreak: number
    longestStreak: number
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const completions = await this.getHabitCompletions(
      habitId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )

    // 计算完成的天数（去重）
    const completedDates = new Set(completions.map(c => c.completion_date))
    const completedDays = completedDates.size
    const totalDays = days
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

    // 计算连续天数
    const sortedDates = Array.from(completedDates).sort()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toISOString().split('T')[0]
    let isCurrentStreakActive = false

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
        isCurrentStreakActive = sortedDates[i] === today
      } else {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          tempStreak++
          if (sortedDates[i] === today) {
            isCurrentStreakActive = true
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
          isCurrentStreakActive = sortedDates[i] === today
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)
    
    // 只有当最后一个日期是今天或昨天时，当前连续天数才有效
    if (sortedDates.length > 0) {
      const lastDate = new Date(sortedDates[sortedDates.length - 1])
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 1) {
        currentStreak = tempStreak
      }
    }

    return {
      totalDays,
      completedDays,
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak,
      longestStreak
    }
  }
}

export const habitDb = new HabitDB()
