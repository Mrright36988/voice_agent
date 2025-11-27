/**
 * Basic Tools (Level 1)
 * 基础工具：文字输入、剪贴板操作
 */

import { clipboard } from 'electron';
import type { Tool } from './registry';

// type_text - 模拟键盘输入
export const typeTextTool: Tool = {
  name: 'type_text',
  description: '在当前光标位置输入文字',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: '要输入的文字' },
    },
    required: ['text'],
  },
  permission: 'basic',
  async execute({ text }) {
    if (typeof text !== 'string') {
      return { success: false, error: 'text must be a string' };
    }

    try {
      // 使用剪贴板 + 模拟粘贴的方式实现
      // 保存原剪贴板内容
      const originalClipboard = clipboard.readText();

      // 写入新内容
      clipboard.writeText(text);

      // 模拟 Cmd+V / Ctrl+V
      const { keyboard, Key } = await import('@nut-tree/nut-js');
      const isMac = process.platform === 'darwin';

      if (isMac) {
        await keyboard.pressKey(Key.LeftSuper, Key.V);
        await keyboard.releaseKey(Key.LeftSuper, Key.V);
      } else {
        await keyboard.pressKey(Key.LeftControl, Key.V);
        await keyboard.releaseKey(Key.LeftControl, Key.V);
      }

      // 恢复原剪贴板内容
      setTimeout(() => {
        clipboard.writeText(originalClipboard);
      }, 100);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to type text';
      return { success: false, error: message };
    }
  },
};

// paste_text - 直接粘贴
export const pasteTextTool: Tool = {
  name: 'paste_text',
  description: '将文字复制到剪贴板并粘贴',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: '要粘贴的文字' },
    },
    required: ['text'],
  },
  permission: 'basic',
  async execute({ text }) {
    if (typeof text !== 'string') {
      return { success: false, error: 'text must be a string' };
    }

    try {
      clipboard.writeText(text);

      const { keyboard, Key } = await import('@nut-tree/nut-js');
      const isMac = process.platform === 'darwin';

      if (isMac) {
        await keyboard.pressKey(Key.LeftSuper, Key.V);
        await keyboard.releaseKey(Key.LeftSuper, Key.V);
      } else {
        await keyboard.pressKey(Key.LeftControl, Key.V);
        await keyboard.releaseKey(Key.LeftControl, Key.V);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to paste text';
      return { success: false, error: message };
    }
  },
};

// read_clipboard - 读取剪贴板
export const readClipboardTool: Tool = {
  name: 'read_clipboard',
  description: '读取剪贴板内容',
  parameters: {
    type: 'object',
    properties: {},
  },
  permission: 'basic',
  async execute() {
    const text = clipboard.readText();
    return { success: true, data: text };
  },
};

// 导出所有基础工具
export const basicTools: Tool[] = [typeTextTool, pasteTextTool, readClipboardTool];

