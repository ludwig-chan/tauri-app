import { execSQL, initDB } from './db'

export async function initializeTodoTable() {
    await initDB()
    
    // 创建待办事项表
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    
    try {
        await execSQL(createTableSQL)
        
        // 检查是否需要添加 due_date 列（用于现有数据库的升级）
        const addColumnSQL = `
            ALTER TABLE todos ADD COLUMN due_date DATE
        `
        
        try {
            await execSQL(addColumnSQL)
            console.log('成功添加due_date列')
        } catch (error: any) {
            // 忽略列已存在的错误
            if (!error.toString().includes('duplicate column name')) {
                console.error('添加due_date列失败:', error)
            }
        }
        
        console.log('Todo表初始化成功')
    } catch (error) {
        console.error('初始化Todo表失败:', error)
        throw error
    }
}
