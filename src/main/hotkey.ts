/**
 * Hotkey Manager
 * 全局热键监听，识别触发模式（长按/单击/双击）
 * 
 * 状态机：
 * Idle -> Pressed (keydown) -> 
 *   - 长按 (>300ms): Dictation 模式
 *   - 快速松开 (<300ms): WaitDbl ->
 *     - 再次按下 (<300ms): Agent 模式
 *     - 超时: Command 模式
 */

import { globalShortcut } from 'electron';
import type { TriggerMode } from '../shared/types';

type HotkeyState = 'idle' | 'pressed' | 'waitDbl';

type HotkeyEventType = 'trigger' | 'release';

type HotkeyCallback<T extends HotkeyEventType> = T extends 'trigger'
  ? (mode: TriggerMode) => void
  : () => void;

interface HotkeyConfig {
  shortcut: string;
  longPressThreshold: number;
  doublePressThreshold: number;
}

const DEFAULT_CONFIG: HotkeyConfig = {
  shortcut: 'CommandOrControl+Shift+Space',
  longPressThreshold: 300,
  doublePressThreshold: 300,
};

export class HotkeyManager {
  private config: HotkeyConfig;
  private state: HotkeyState = 'idle';
  private pressTime: number = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private doublePressTimer: ReturnType<typeof setTimeout> | null = null;

  private triggerCallbacks: Array<(mode: TriggerMode) => void> = [];
  private releaseCallbacks: Array<() => void> = [];

  constructor(config: Partial<HotkeyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  register(): boolean {
    // 注册按下事件
    const downResult = globalShortcut.register(this.config.shortcut, () => {
      this.handleKeyDown();
    });

    if (!downResult) {
      console.error(`Failed to register hotkey: ${this.config.shortcut}`);
      return false;
    }

    // 监听松开需要通过其他方式（Electron 原生 globalShortcut 不支持 keyup）
    // 这里使用定时检测或 native 模块，简化版本使用长按定时器

    console.log(`Hotkey registered: ${this.config.shortcut}`);
    return true;
  }

  unregister(): void {
    globalShortcut.unregister(this.config.shortcut);
    this.clearTimers();
    this.state = 'idle';
    console.log(`Hotkey unregistered: ${this.config.shortcut}`);
  }

  on<T extends HotkeyEventType>(event: T, callback: HotkeyCallback<T>): void {
    if (event === 'trigger') {
      this.triggerCallbacks.push(callback as (mode: TriggerMode) => void);
    } else if (event === 'release') {
      this.releaseCallbacks.push(callback as () => void);
    }
  }

  off<T extends HotkeyEventType>(event: T, callback: HotkeyCallback<T>): void {
    if (event === 'trigger') {
      this.triggerCallbacks = this.triggerCallbacks.filter((cb) => cb !== callback);
    } else if (event === 'release') {
      this.releaseCallbacks = this.releaseCallbacks.filter((cb) => cb !== callback);
    }
  }

  // 模拟松开事件（用于测试或外部触发）
  simulateRelease(): void {
    this.handleKeyUp();
  }

  private handleKeyDown(): void {
    const now = Date.now();

    if (this.state === 'idle') {
      this.state = 'pressed';
      this.pressTime = now;

      // 设置长按定时器
      this.longPressTimer = setTimeout(() => {
        if (this.state === 'pressed') {
          // 长按触发 Dictation 模式
          this.emitTrigger('dictation');
        }
      }, this.config.longPressThreshold);
    } else if (this.state === 'waitDbl') {
      // 双击触发 Agent 模式
      this.clearTimers();
      this.state = 'idle';
      this.emitTrigger('agent');
    }
  }

  private handleKeyUp(): void {
    if (this.state === 'pressed') {
      const pressDuration = Date.now() - this.pressTime;

      this.clearTimers();

      if (pressDuration < this.config.longPressThreshold) {
        // 短按，进入等待双击状态
        this.state = 'waitDbl';
        this.doublePressTimer = setTimeout(() => {
          // 超时，触发 Command 模式
          if (this.state === 'waitDbl') {
            this.state = 'idle';
            this.emitTrigger('command');
          }
        }, this.config.doublePressThreshold);
      } else {
        // 长按已经触发了 dictation，这里只需要触发 release
        this.state = 'idle';
        this.emitRelease();
      }
    }
  }

  private emitTrigger(mode: TriggerMode): void {
    for (const callback of this.triggerCallbacks) {
      callback(mode);
    }
  }

  private emitRelease(): void {
    for (const callback of this.releaseCallbacks) {
      callback();
    }
  }

  private clearTimers(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.doublePressTimer) {
      clearTimeout(this.doublePressTimer);
      this.doublePressTimer = null;
    }
  }
}

