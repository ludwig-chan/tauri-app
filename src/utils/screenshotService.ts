/**
 * 统一的截图服务
 * 所有截图入口都应该调用这个服务
 */

import { invoke } from '@tauri-apps/api/core'
import { saveScreenshot, getAllScreenshots } from './screenshotDb'

export interface ScreenshotResult {
  data: string
  width: number
  height: number
  file_path?: string
}

/**
 * 执行截图并保存到数据库
 * 这是统一的截图方法，所有入口都应该调用这个方法
 */
export async function captureAndSave(): Promise<ScreenshotResult> {
  try {
    // 调用后端的 capture_and_show 命令
    // 这个命令会：1. 截图 2. 保存文件 3. 打开预览窗口
    const result = await invoke<ScreenshotResult>('capture_and_show')
    
    // 保存到数据库
    if (result.file_path) {
      await saveScreenshot(result.file_path, result.width, result.height)
      console.log('截图已保存到数据库:', result.file_path)
      
      // 触发刷新事件
      refreshScreenshotList()
    }
    
    return result
  } catch (error) {
    console.error('截图失败:', error)
    throw error
  }
}

/**
 * 获取所有截图记录
 */
export async function getScreenshots() {
  return await getAllScreenshots()
}

/**
 * 刷新截图列表（用于在其他页面截图后刷新列表）
 */
export function refreshScreenshotList() {
  // 触发一个自定义事件，让 ScreenshotView 监听并刷新
  window.dispatchEvent(new CustomEvent('screenshot-saved'))
}
