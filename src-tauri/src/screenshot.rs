use std::io::Cursor;
use std::sync::Mutex;
use std::collections::HashMap;
use image::{ImageFormat, DynamicImage, ImageBuffer, Rgba};
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager};
use tauri::webview::WebviewWindowBuilder;
use base64::{engine::general_purpose, Engine};

#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
#[cfg(windows)]
use windows::Win32::Foundation::POINT;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScreenshotResult {
    pub data: String, // base64 encoded image
    pub width: u32,
    pub height: u32,
}

// 全局状态存储截图数据
pub struct ScreenshotStore {
    pub data: Mutex<HashMap<String, ScreenshotResult>>,
}

// 获取鼠标所在的屏幕索引
#[cfg(windows)]
fn get_cursor_screen(screens: &[Screen]) -> Option<usize> {
    unsafe {
        let mut point = POINT { x: 0, y: 0 };
        if GetCursorPos(&mut point).is_ok() {
            for (index, screen) in screens.iter().enumerate() {
                let info = &screen.display_info;
                if point.x >= info.x 
                   && point.x < info.x + info.width as i32
                   && point.y >= info.y 
                   && point.y < info.y + info.height as i32 
                {
                    return Some(index);
                }
            }
        }
    }
    Some(0) // 默认返回主屏幕
}

// 非 Windows 平台默认返回主屏幕
#[cfg(not(windows))]
fn get_cursor_screen(_screens: &[Screen]) -> Option<usize> {
    Some(0)
}

#[derive(Debug, Deserialize)]
pub enum CaptureMode {
    #[serde(rename = "fullscreen")]
    FullScreen,
    #[serde(rename = "window")]
    Window,
    #[serde(rename = "region")]
    Region,
}

#[command]
pub async fn capture_screenshot(mode: CaptureMode) -> Result<ScreenshotResult, String> {
    match mode {
        CaptureMode::FullScreen => capture_full_screen().await,
        CaptureMode::Window => capture_window().await,
        CaptureMode::Region => capture_region().await,
    }
}

async fn capture_full_screen() -> Result<ScreenshotResult, String> {
    use std::time::Instant;
    
    let total_start = Instant::now();
    println!("=== 截图性能分析 ===");
    
    let start = Instant::now();
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    println!("1. 获取屏幕列表: {:?}", start.elapsed());
    
    if screens.is_empty() {
        return Err("No screens found".to_string());
    }
    
    // 获取鼠标所在的屏幕
    let start = Instant::now();
    let screen_index = get_cursor_screen(&screens).unwrap_or(0);
    println!("2. 获取鼠标位置: {:?}", start.elapsed());
    
    let start = Instant::now();
    let screen = &screens[screen_index];
    let screenshot = screen.capture().map_err(|e| format!("Failed to capture screen: {}", e))?;
    println!("3. 执行屏幕截图: {:?}", start.elapsed());
    
    // 转换screenshots::Image到image::DynamicImage
    let start = Instant::now();
    let width = screenshot.width();
    let height = screenshot.height();
    let buffer = screenshot.rgba();
    println!("4. 获取图像数据 ({}x{}): {:?}", width, height, start.elapsed());
    
    // 创建ImageBuffer (RGBA格式)
    let start = Instant::now();
    let image_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(
        width, 
        height, 
        buffer.to_vec()
    ).ok_or("Failed to create image buffer")?;
    
    let dynamic_image = DynamicImage::ImageRgba8(image_buffer);
    println!("5. 创建ImageBuffer: {:?}", start.elapsed());
    
    // 转换为base64
    let start = Instant::now();
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    // 使用JPEG格式，质量50（预览足够，速度更快）
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor, 50);
    encoder.encode(
        dynamic_image.as_bytes(),
        width,
        height,
        dynamic_image.color()
    ).map_err(|e| format!("Failed to encode image: {}", e))?;
    println!("6. JPEG编码 质量50 (数据大小: {} KB): {:?}", buffer.len() / 1024, start.elapsed());
    
    let start = Instant::now();
    let base64_data = general_purpose::STANDARD.encode(&buffer);
    println!("7. Base64编码 (编码后: {} KB): {:?}", base64_data.len() / 1024, start.elapsed());
    
    println!("=== 总耗时: {:?} ===\n", total_start.elapsed());
    
    Ok(ScreenshotResult {
        data: base64_data,
        width,
        height,
    })
}

async fn capture_window() -> Result<ScreenshotResult, String> {
    // 目前先实现为全屏截图，后续可以添加窗口选择功能
    capture_full_screen().await
}

async fn capture_region() -> Result<ScreenshotResult, String> {
    // 目前先实现为全屏截图，后续可以添加区域选择功能
    capture_full_screen().await
}

#[command]
pub async fn save_screenshot(_data: String) -> Result<(), String> {
    // 暂时实现为空，避免权限问题
    // TODO: 后续添加文件保存功能
    Ok(())
}

#[command]
pub async fn copy_to_clipboard(_data: String) -> Result<(), String> {
    // 暂时实现为空，避免依赖问题
    // TODO: 后续添加剪贴板复制功能
    Ok(())
}

// 打开新窗口显示截图
#[command]
pub async fn open_screenshot_window(
    app: AppHandle,
    image_data: String,
    width: u32,
    height: u32,
) -> Result<String, String> {
    // 生成唯一的窗口ID
    let window_id = format!("screenshot_{}", chrono::Utc::now().timestamp_millis());
    
    // 存储截图数据到全局状态
    let store = app.state::<ScreenshotStore>();
    let screenshot_result = ScreenshotResult {
        data: image_data,
        width,
        height,
    };
    
    store.data.lock().unwrap().insert(window_id.clone(), screenshot_result);
    
    // 计算窗口大小，保持图片比例
    let aspect_ratio = width as f64 / height as f64;
    let max_width = 1200.0;
    let max_height = 800.0;
    
    let (window_width, window_height) = if width as f64 > max_width || height as f64 > max_height {
        // 需要缩放，保持比例
        let scale = (max_width / width as f64).min(max_height / height as f64);
        (width as f64 * scale, height as f64 * scale)
    } else {
        // 不需要缩放，使用原始尺寸
        (width as f64, height as f64)
    };
    
    // 构建URL，只传递窗口ID
    let url = format!("/screenshot-window?id={}", window_id);
    
    // 创建新窗口，设置固定比例
    WebviewWindowBuilder::new(&app, &window_id, tauri::WebviewUrl::App(url.into()))
        .title("截图预览")
        .inner_size(window_width, window_height)
        .min_inner_size(200.0, 200.0 / aspect_ratio)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .center()
        .build()
        .map_err(|e| format!("Failed to create window: {}", e))?;
    
    Ok(window_id)
}

// 获取截图数据
#[command]
pub async fn get_screenshot_data(
    app: AppHandle,
    window_id: String,
) -> Result<ScreenshotResult, String> {
    let store = app.state::<ScreenshotStore>();
    let data = store.data.lock().unwrap();
    
    data.get(&window_id)
        .cloned()
        .ok_or_else(|| "Screenshot data not found".to_string())
}

// 触发截图（用于全局快捷键）
pub async fn trigger_screenshot(app: AppHandle) -> Result<(), String> {
    // 执行截图
    let result = capture_full_screen().await?;
    
    // 打开窗口显示截图
    open_screenshot_window(app, result.data, result.width, result.height).await?;
    
    Ok(())
}

// 优化的截图命令：直接截图并显示，避免数据在前后端之间传输两次
#[command]
pub async fn capture_and_show(app: AppHandle) -> Result<String, String> {
    use std::time::Instant;
    
    let total_start = Instant::now();
    println!("\n>>> 开始执行 capture_and_show");
    
    // 执行截图
    let start = Instant::now();
    let result = capture_full_screen().await?;
    println!(">>> 截图完成，耗时: {:?}", start.elapsed());
    
    // 直接打开窗口显示截图，返回窗口ID
    let start = Instant::now();
    let window_id = open_screenshot_window(app, result.data, result.width, result.height).await?;
    println!(">>> 窗口创建完成，耗时: {:?}", start.elapsed());
    
    println!(">>> capture_and_show 总耗时: {:?}\n", total_start.elapsed());
    
    Ok(window_id)
}
