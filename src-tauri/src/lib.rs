mod screenshot;

use std::collections::HashMap;
use std::sync::Mutex;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .manage(screenshot::ScreenshotStore {
            data: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            screenshot::capture_screenshot,
            screenshot::save_screenshot,
            screenshot::copy_to_clipboard,
            screenshot::open_screenshot_window,
            screenshot::get_screenshot_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
