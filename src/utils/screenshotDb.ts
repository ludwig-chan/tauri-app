import { execSQL, selectSQL } from './db'

export interface Screenshot {
    id: number
    file_path: string
    width: number
    height: number
    created_at: string
}

/**
 * 保存截图记录到数据库
 */
export async function saveScreenshot(
    filePath: string,
    width: number,
    height: number
): Promise<number> {
    const sql = `
        INSERT INTO screenshots (file_path, width, height)
        VALUES (?, ?, ?)
    `
    const result = await execSQL(sql, [filePath, width, height])
    return result.lastInsertId
}

/**
 * 获取所有截图记录
 */
export async function getAllScreenshots(): Promise<Screenshot[]> {
    const sql = `
        SELECT * FROM screenshots
        ORDER BY created_at DESC
    `
    return await selectSQL<Screenshot>(sql)
}

/**
 * 根据ID获取截图记录
 */
export async function getScreenshotById(id: number): Promise<Screenshot | null> {
    const sql = `
        SELECT * FROM screenshots
        WHERE id = ?
    `
    const results = await selectSQL<Screenshot>(sql, [id])
    return results.length > 0 ? results[0] : null
}

/**
 * 删除截图记录
 */
export async function deleteScreenshot(id: number): Promise<void> {
    const sql = `
        DELETE FROM screenshots
        WHERE id = ?
    `
    await execSQL(sql, [id])
}

/**
 * 清空所有截图记录
 */
export async function clearAllScreenshots(): Promise<void> {
    const sql = `
        DELETE FROM screenshots
    `
    await execSQL(sql)
}
