// Notes Canvas — Tauri 2 desktop shell.
//
// The shell intentionally does almost nothing: it loads the React UI,
// registers ⌘⇧Space as a global capture shortcut, and emits a single
// event the frontend listens for. All data, AI, and UI logic live in
// JS/TS so the same surface ships unchanged on web and mobile.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = app.emit("nc:capture", shortcut.to_string());
                    }
                })
                .build(),
        )
        .setup(|app| {
            let capture = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
            app.global_shortcut().register(capture)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Notes Canvas");
}
