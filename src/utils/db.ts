import Database from '@tauri-apps/plugin-sql'

class DBManager {
    private static instance: DBManager
    private db: Database | null = null
    private dbPath: string = 'sqlite:todos.db'

    private constructor() {}

    public static getInstance(): DBManager {
        if (!DBManager.instance) {
            DBManager.instance = new DBManager()
        }
        return DBManager.instance
    }

    /**
     * 初始化数据库连接
     */
    public async init(): Promise<void> {
        try {
            if (!this.db) {
                this.db = await Database.load(this.dbPath)
            }
        } catch (error) {
            console.error('数据库初始化失败:', error)
            throw error
        }
    }

    /**
     * 执行SQL语句
     * @param sql SQL语句
     * @param values 参数值（可选）
     * @returns 
     */
    public async execute(sql: string, values: any[] = []): Promise<any> {
        if (!this.db) {
            throw new Error('数据库未初始化')
        }
        try {
            return await this.db.execute(sql, values)
        } catch (error) {
            console.error('SQL执行失败:', error)
            throw error
        }
    }

    /**
     * 查询数据
     * @param sql SQL语句
     * @param values 参数值（可选）
     * @returns 
     */
    public async select<T>(sql: string, values: any[] = []): Promise<T[]> {
        if (!this.db) {
            throw new Error('数据库未初始化')
        }
        try {
            const result = await this.db.select<T>(sql, values)
            return result
        } catch (error) {
            console.error('查询失败:', error)
            throw error
        }
    }

    /**
     * 批量执行SQL语句（事务）
     * @param statements SQL语句数组
     */
    public async batch(statements: string[]): Promise<void> {
        if (!this.db) {
            throw new Error('数据库未初始化')
        }
        try {
            await this.db.execute('BEGIN TRANSACTION')
            for (const sql of statements) {
                await this.db.execute(sql)
            }
            await this.db.execute('COMMIT')
        } catch (error) {
            await this.db.execute('ROLLBACK')
            console.error('批量执行失败:', error)
            throw error
        }
    }
}

// 导出单例实例
export const dbManager = DBManager.getInstance()

// 导出一些常用的工具函数
export const initDB = async () => {
    await dbManager.init()
}

export const execSQL = async (sql: string, values: any[] = []) => {
    return await dbManager.execute(sql, values)
}

export const selectSQL = async <T>(sql: string, values: any[] = []): Promise<T[]> => {
    return await dbManager.select<T>(sql, values)
}

export const batchSQL = async (statements: string[]) => {
    return await dbManager.batch(statements)
}
