import { execSQL, initDB } from './db'

export async function initializeTodoTable() {
    await initDB()
    
    // 创建待办事项表
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    
    try {
        await execSQL(createTableSQL)
        console.log('Todo表初始化成功')
    } catch (error) {
        console.error('初始化Todo表失败:', error)
        throw error
    }
}
