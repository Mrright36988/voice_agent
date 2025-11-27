/**
 * Voice Agent - Electron Main Process
 * 主进程入口
 */

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { HotkeyManager } from './hotkey';
import { TrayManager } from './tray';
import { setupIPC, sendHotkeyTrigger, sendHotkeyRelease } from './ipc';
import { registerAllTools } from './services/tools';

// 单例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let hotkeyManager: HotkeyManager | null = null;
let trayManager: TrayManager | null = null;

async function createWindow(): Promise<BrowserWindow> {
  const preloadPath = path.join(__dirname, '../preload/index.js');

  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false, // 初始隐藏，通过托盘控制
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 开发环境加载 dev server，生产环境加载打包文件
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' }); // 需要调试时取消注释
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 点击外部链接时使用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

async function initialize(): Promise<void> {
  // 注册所有工具
  registerAllTools();

  // 创建主窗口
  const window = await createWindow();

  // 设置 IPC
  setupIPC(window);

  // 创建托盘
  trayManager = new TrayManager();
  trayManager.create();

  // 初始化热键管理器
  hotkeyManager = new HotkeyManager();

  hotkeyManager.on('trigger', (mode) => {
    console.log(`Hotkey triggered: ${mode}`);
    sendHotkeyTrigger(mode);

    // 显示悬浮窗
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }

    // 更新托盘状态
    trayManager?.setRecording(true);
  });

  hotkeyManager.on('release', () => {
    console.log('Hotkey released');
    sendHotkeyRelease();
    trayManager?.setRecording(false);
  });

  hotkeyManager.register();

  console.log('Voice Agent initialized');
}

// 应用事件
app.on('ready', () => {
  initialize().catch(console.error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error);
  }
});

app.on('will-quit', () => {
  hotkeyManager?.unregister();
  trayManager?.destroy();
});

// 第二个实例尝试启动时，聚焦到主窗口
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

