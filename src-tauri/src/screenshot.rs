use std::io::Cursor;
use image::{ImageFormat, DynamicImage, ImageBuffer, Rgba};
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use tauri::command;
use base64::{engine::general_purpose, Engine};

#[derive(Debug, Serialize, Deserialize)]
pub struct ScreenshotResult {
    pub data: String, // base64 encoded image
    pub width: u32,
    pub height: u32,
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
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    
    if screens.is_empty() {
        return Err("No screens found".to_string());
    }
    
    // 获取主屏幕
    let screen = &screens[0];
    let screenshot = screen.capture().map_err(|e| format!("Failed to capture screen: {}", e))?;
    
    // 转换screenshots::Image到image::DynamicImage
    let width = screenshot.width();
    let height = screenshot.height();
    let buffer = screenshot.rgba();
    
    // 创建ImageBuffer (RGBA格式)
    let image_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(
        width, 
        height, 
        buffer.to_vec()
    ).ok_or("Failed to create image buffer")?;
    
    let dynamic_image = DynamicImage::ImageRgba8(image_buffer);
    
    // 转换为base64
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    dynamic_image.write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image: {}", e))?;
    
    let base64_data = general_purpose::STANDARD.encode(&buffer);
    
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
