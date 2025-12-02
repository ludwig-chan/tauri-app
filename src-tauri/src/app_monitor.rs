use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use std::thread;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub executable: String,
    pub window_title: String,
    pub timestamp: u64,
    pub icon: Option<String>, // base64编码的图标数据
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppUsageRecord {
    pub app_name: String,
    pub executable: String,
    pub window_title: String,
    pub start_time: u64,
    pub end_time: u64,
    pub duration: u64, // 秒
    pub icon: Option<String>, // base64编码的图标数据
}

pub struct AppMonitor {
    current_app: Arc<Mutex<Option<AppInfo>>>,
    is_monitoring: Arc<Mutex<bool>>,
}

impl AppMonitor {
    pub fn new() -> Self {
        Self {
            current_app: Arc::new(Mutex::new(None)),
            is_monitoring: Arc::new(Mutex::new(false)),
        }
    }

    pub fn start_monitoring(&self, app_handle: AppHandle) {
        let mut is_monitoring = self.is_monitoring.lock().unwrap();
        if *is_monitoring {
            return; // 已经在监控中
        }
        *is_monitoring = true;
        drop(is_monitoring);

        let current_app = self.current_app.clone();
        let is_monitoring = self.is_monitoring.clone();

        thread::spawn(move || {
            while *is_monitoring.lock().unwrap() {
                if let Some(app_info) = get_active_window() {
                    let mut current = current_app.lock().unwrap();
                    
                    // 检查是否切换了应用
                    let should_save = if let Some(ref prev_app) = *current {
                        prev_app.executable != app_info.executable
                    } else {
                        true
                    };

                    if should_save {
                        // 保存上一个应用的使用记录
                        if let Some(prev_app) = current.take() {
                            let now = SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_secs();
                            
                            let duration = now - prev_app.timestamp;
                            
                            // 只记录使用时间大于 2 秒的应用
                            if duration >= 2 {
                                let record = AppUsageRecord {
                                    app_name: prev_app.name,
                                    executable: prev_app.executable,
                                    window_title: prev_app.window_title,
                                    start_time: prev_app.timestamp,
                                    end_time: now,
                                    duration,
                                    icon: prev_app.icon,
                                };

                                // 发送到前端保存
                                let _ = app_handle.emit("app-usage-record", &record);
                            }
                        }

                        // 更新当前应用
                        *current = Some(app_info);
                    }
                }

                // 每 3 秒检测一次
                thread::sleep(Duration::from_secs(3));
            }
        });
    }

    pub fn stop_monitoring(&self) {
        let mut is_monitoring = self.is_monitoring.lock().unwrap();
        *is_monitoring = false;
    }

    pub fn get_current_app(&self) -> Option<AppInfo> {
        self.current_app.lock().unwrap().clone()
    }
}

#[cfg(target_os = "windows")]
fn get_active_window() -> Option<AppInfo> {
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId};
    use windows::Win32::System::Threading::{OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};
    use windows::core::PWSTR;

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 == 0 {
            return None;
        }

        // 获取窗口标题
        let mut window_title = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut window_title);
        let window_title = String::from_utf16_lossy(&window_title[..len as usize]);

        // 获取进程 ID
        let mut process_id = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));

        if process_id == 0 {
            return None;
        }

        // 打开进程获取可执行文件路径
        let h_process = OpenProcess(
            PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
            false,
            process_id,
        );

        if let Ok(h_process) = h_process {
            let mut exe_path = [0u16; 1024];
            let mut size = exe_path.len() as u32;

            if QueryFullProcessImageNameW(h_process, PROCESS_NAME_WIN32, PWSTR(exe_path.as_mut_ptr()), &mut size).is_ok() {
                let exe_path = String::from_utf16_lossy(&exe_path[..size as usize]);
                
                // 从路径提取应用名称
                let app_name = std::path::Path::new(&exe_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Unknown")
                    .to_string();

                let timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();

                // 获取应用图标
                let icon = get_app_icon(&exe_path);
                
                return Some(AppInfo {
                    name: app_name,
                    executable: exe_path,
                    window_title,
                    timestamp,
                    icon,
                });
            }
        }
    }

    None
}

// 获取应用程序图标的函数 - 简化版本
#[cfg(target_os = "windows")]
fn get_app_icon(exe_path: &str) -> Option<String> {
    // 暂时返回一个基于文件扩展名的默认图标标识
    // 这样可以在前端使用不同的图标来表示不同类型的应用
    let file_name = std::path::Path::new(exe_path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown");
    
    // 根据常见的应用程序返回不同的图标标识
    let icon_type = match file_name.to_lowercase().as_str() {
        name if name.contains("chrome") => "chrome",
        name if name.contains("firefox") => "firefox",
        name if name.contains("edge") => "edge",
        name if name.contains("code") || name.contains("vscode") => "vscode",
        name if name.contains("explorer") => "folder",
        name if name.contains("notepad") => "text",
        name if name.contains("calc") => "calculator",
        name if name.contains("winword") => "word",
        name if name.contains("excel") => "excel",
        name if name.contains("powerpnt") => "powerpoint",
        name if name.contains("outlook") => "email",
        name if name.contains("teams") => "teams",
        name if name.contains("discord") => "discord",
        name if name.contains("spotify") => "music",
        name if name.contains("steam") => "game",
        _ => "app"
    };

    // 返回图标类型标识，前端可以根据这个来显示相应的图标
    Some(icon_type.to_string())
}

#[cfg(not(target_os = "windows"))]
fn get_active_window() -> Option<AppInfo> {
    // 其他平台待实现
    None
}

#[cfg(not(target_os = "windows"))]
fn get_app_icon(_exe_path: &str) -> Option<String> {
    // 其他平台待实现
    None
}

// Tauri 命令
#[tauri::command]
pub fn start_app_monitoring(app_handle: AppHandle, monitor: tauri::State<AppMonitor>) -> Result<(), String> {
    monitor.start_monitoring(app_handle);
    Ok(())
}

#[tauri::command]
pub fn stop_app_monitoring(monitor: tauri::State<AppMonitor>) -> Result<(), String> {
    monitor.stop_monitoring();
    Ok(())
}

#[tauri::command]
pub fn get_current_app_info(monitor: tauri::State<AppMonitor>) -> Result<Option<AppInfo>, String> {
    Ok(monitor.get_current_app())
}

// 新增命令：单独获取指定应用的图标
#[tauri::command]
pub fn get_app_icon_by_path(exe_path: String) -> Result<Option<String>, String> {
    Ok(get_app_icon(&exe_path))
}
