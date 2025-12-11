import { execSQL, initDB } from './db'
import { AppUsageDB } from './appUsageDb'

export async function initializeTodoTable() {
    await initDB()
    
    // 创建分组表
    const createGroupsTableSQL = `
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#42b983',
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    
    // 创建待办事项表
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            due_date DATE,
            expected_completion_time DATETIME,
            reminder_time DATETIME,
            parent_id INTEGER,
            group_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES todos (id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL
        )
    `
    
    // 创建截图记录表
    const createScreenshotTableSQL = `
        CREATE TABLE IF NOT EXISTS screenshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    
    try {
        await execSQL(createGroupsTableSQL)
        await execSQL(createTableSQL)
        await execSQL(createScreenshotTableSQL)
        
        // 检查是否需要添加 due_date 列（用于现有数据库的升级）
        const addDueDateColumnSQL = `
            ALTER TABLE todos ADD COLUMN due_date DATE
        `
        
        try {
            await execSQL(addDueDateColumnSQL)
            console.log('成功添加due_date列')
        } catch (error: any) {
            // 忽略列已存在的错误
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加due_date列失败:', error)
            }
        }

        // 检查是否需要添加 parent_id 列（用于现有数据库的升级）
        const addParentIdColumnSQL = `
            ALTER TABLE todos ADD COLUMN parent_id INTEGER
        `
        
        try {
            await execSQL(addParentIdColumnSQL)
            console.log('成功添加parent_id列')
        } catch (error: any) {
            // 忽略列已存在的错误
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加parent_id列失败:', error)
            }
        }

        // 检查是否需要添加 expected_completion_time 列
        const addExpectedCompletionTimeColumnSQL = `
            ALTER TABLE todos ADD COLUMN expected_completion_time DATETIME
        `
        
        try {
            await execSQL(addExpectedCompletionTimeColumnSQL)
            console.log('成功添加expected_completion_time列')
        } catch (error: any) {
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加expected_completion_time列失败:', error)
            }
        }

        // 检查是否需要添加 reminder_time 列
        const addReminderTimeColumnSQL = `
            ALTER TABLE todos ADD COLUMN reminder_time DATETIME
        `
        
        try {
            await execSQL(addReminderTimeColumnSQL)
            console.log('成功添加reminder_time列')
        } catch (error: any) {
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加reminder_time列失败:', error)
            }
        }

        // 检查是否需要添加 group_id 列
        const addGroupIdColumnSQL = `
            ALTER TABLE todos ADD COLUMN group_id INTEGER
        `
        
        try {
            await execSQL(addGroupIdColumnSQL)
            console.log('成功添加group_id列')
        } catch (error: any) {
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加group_id列失败:', error)
            }
        }

        // 检查是否需要添加 sort_order 列到groups表
        const addSortOrderColumnSQL = `
            ALTER TABLE groups ADD COLUMN sort_order INTEGER DEFAULT 0
        `
        
        try {
            await execSQL(addSortOrderColumnSQL)
            console.log('成功添加sort_order列')
        } catch (error: any) {
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加sort_order列失败:', error)
            }
        }
        
        console.log('Todo表初始化成功')
        
        // 初始化应用使用记录表
        await AppUsageDB.initTable()
        console.log('应用使用记录表初始化成功')
    } catch (error) {
        console.error('初始化Todo表失败:', error)
        throw error
    }
}
