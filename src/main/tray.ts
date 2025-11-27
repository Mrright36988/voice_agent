/**
 * System Tray Manager
 * 托盘图标和菜单管理
 */

import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';

export class TrayManager {
  private tray: Tray | null = null;

  create(): Tray {
    // 创建托盘图标（使用内置图标或自定义图标）
    const iconPath = this.getIconPath();
    const icon = nativeImage.createFromPath(iconPath);

    // 如果图标加载失败，创建一个空白图标
    const trayIcon = icon.isEmpty() ? this.createDefaultIcon() : icon;

    this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Voice Agent');

    this.updateMenu('idle');

    return this.tray;
  }

  updateMenu(status: 'idle' | 'recording' | 'processing'): void {
    if (!this.tray) return;

    const statusLabels = {
      idle: '就绪',
      recording: '录音中...',
      processing: '处理中...',
    };

    const contextMenu = Menu.buildFromTemplate([
      { label: `状态: ${statusLabels[status]}`, enabled: false },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          // 打开设置窗口
          this.openSettings();
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  setRecording(isRecording: boolean): void {
    this.updateMenu(isRecording ? 'recording' : 'idle');
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  private getIconPath(): string {
    const resourcesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources')
      : path.join(__dirname, '../../resources');

    return path.join(resourcesPath, 'tray-icon.png');
  }

  private createDefaultIcon(): Electron.NativeImage {
    // 创建一个简单的 16x16 绿色圆形图标
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - size / 2;
        const dy = y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < size / 2 - 1) {
          // 绿色填充
          canvas[idx] = 76; // R
          canvas[idx + 1] = 175; // G
          canvas[idx + 2] = 80; // B
          canvas[idx + 3] = 255; // A
        } else {
          // 透明
          canvas[idx] = 0;
          canvas[idx + 1] = 0;
          canvas[idx + 2] = 0;
          canvas[idx + 3] = 0;
        }
      }
    }

    return nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  private openSettings(): void {
    // TODO: 打开设置窗口
    console.log('Open settings');
  }
}

