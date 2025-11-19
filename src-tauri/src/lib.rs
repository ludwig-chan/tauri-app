mod screenshot;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn set_window_opacity(
    app: tauri::AppHandle,
    label: String,
    opacity: f64,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::{HWND, COLORREF};
            use windows::Win32::UI::WindowsAndMessaging::{
                GetWindowLongPtrA, SetWindowLongPtrA, SetLayeredWindowAttributes, 
                GWL_EXSTYLE, LWA_ALPHA
            };
            
            const WS_EX_LAYERED: i32 = 0x00080000;
            
            let hwnd = window.hwnd().map_err(|e| e.to_string())?;
            let hwnd = HWND(hwnd.0 as isize);
            
            unsafe {
                // Get current extended style
                let current_style = GetWindowLongPtrA(hwnd, GWL_EXSTYLE);
                
                // Add WS_EX_LAYERED style
                let new_style = current_style | WS_EX_LAYERED as isize;
                SetWindowLongPtrA(hwnd, GWL_EXSTYLE, new_style);
                
                // Set alpha value
                let alpha = (opacity * 255.0) as u8;
                SetLayeredWindowAttributes(hwnd, COLORREF(0), alpha, LWA_ALPHA)
                    .map_err(|e| e.to_string())?;
            }
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // For other platforms, we'll need different implementations
            return Err("Opacity not supported on this platform yet".to_string());
        }
        
        Ok(())
    } else {
        Err(format!("Window '{}' not found", label))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(screenshot::ScreenshotStore {
            data: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            set_window_opacity,
            screenshot::capture_screenshot,
            screenshot::save_screenshot,
            screenshot::copy_to_clipboard,
            screenshot::open_screenshot_window,
            screenshot::get_screenshot_data,
            screenshot::capture_and_show
        ])
        .setup(|app| {
            // 注册全局快捷键 F8 用于截图
            let app_handle = app.handle().clone();

            // 简单防抖：避免按一次键同时触发按下/抬起两次事件导致打开两个窗口
            // 若在 400ms 内重复触发，则忽略第二次
            let last_trigger = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(1)));
            let last_trigger_cloned = last_trigger.clone();

            app.global_shortcut().on_shortcut("F8", move |_app, _shortcut, event| {
                // 仅在按下时触发，忽略抬起事件
                if event.state() != ShortcutState::Pressed {
                    return;
                }
                let mut last = last_trigger_cloned.lock().unwrap();
                let now = Instant::now();
                if now.duration_since(*last) < Duration::from_millis(400) {
                    // 忽略过于频繁的触发（如按下与抬起各触发一次，或键盘连发）
                    return;
                }
                *last = now;

                let app_handle = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    match screenshot::trigger_screenshot(app_handle).await {
                        Ok(_) => println!("Screenshot triggered successfully"),
                        Err(e) => eprintln!("Failed to trigger screenshot: {}", e),
                    }
                });
            })?;
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
