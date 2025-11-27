/**
 * System Tools (Level 2)
 * 系统操作：打开应用、执行命令、文件操作
 */

import { shell } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { Tool } from './registry';

const execAsync = promisify(exec);

// open_app - 打开应用程序
export const openAppTool: Tool = {
    name: 'open_app',
    description: '打开应用程序',
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: '应用名称' },
        },
        required: ['name'],
    },
    permission: 'system',
    async execute({ name }) {
        if (typeof name !== 'string') {
            return { success: false, error: 'name must be a string' };
        }

        try {
            if (process.platform === 'darwin') {
                await execAsync(`open -a "${name}"`);
            } else if (process.platform === 'win32') {
                await execAsync(`start "" "${name}"`);
            } else {
                await execAsync(`xdg-open "${name}"`);
            }
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to open app';
            return { success: false, error: message };
        }
    },
};

// open_url - 打开 URL
export const openUrlTool: Tool = {
    name: 'open_url',
    description: '在默认浏览器中打开 URL',
    parameters: {
        type: 'object',
        properties: {
            url: { type: 'string', description: 'URL 地址' },
        },
        required: ['url'],
    },
    permission: 'system',
    async execute({ url }) {
        if (typeof url !== 'string') {
            return { success: false, error: 'url must be a string' };
        }

        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to open URL';
            return { success: false, error: message };
        }
    },
};

// run_shell - 执行命令行命令
export const runShellTool: Tool = {
    name: 'run_shell',
    description: '执行命令行命令（危险操作，需要确认）',
    parameters: {
        type: 'object',
        properties: {
            command: { type: 'string', description: '要执行的命令' },
            cwd: { type: 'string', description: '工作目录（可选）' },
        },
        required: ['command'],
    },
    permission: 'dangerous',
    async execute({ command, cwd }) {
        if (typeof command !== 'string') {
            return { success: false, error: 'command must be a string' };
        }

        try {
            const options = cwd && typeof cwd === 'string' ? { cwd } : {};
            const { stdout, stderr } = await execAsync(command, options);
            return { success: true, data: { stdout, stderr } };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Command execution failed';
            return { success: false, error: message };
        }
    },
};

// read_file - 读取文件
export const readFileTool: Tool = {
    name: 'read_file',
    description: '读取文件内容',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: '文件路径' },
        },
        required: ['path'],
    },
    permission: 'system',
    async execute({ path: filePath }) {
        if (typeof filePath !== 'string') {
            return { success: false, error: 'path must be a string' };
        }

        try {
            const resolvedPath = path.resolve(filePath);
            const content = await fs.readFile(resolvedPath, 'utf-8');
            return { success: true, data: content };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to read file';
            return { success: false, error: message };
        }
    },
};

// write_file - 写入文件
export const writeFileTool: Tool = {
    name: 'write_file',
    description: '写入文件内容',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: '文件路径' },
            content: { type: 'string', description: '文件内容' },
        },
        required: ['path', 'content'],
    },
    permission: 'system',
    async execute({ path: filePath, content }) {
        if (typeof filePath !== 'string' || typeof content !== 'string') {
            return { success: false, error: 'path and content must be strings' };
        }

        try {
            const resolvedPath = path.resolve(filePath);
            const dir = path.dirname(resolvedPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(resolvedPath, content, 'utf-8');
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to write file';
            return { success: false, error: message };
        }
    },
};

// list_dir - 列出目录内容
export const listDirTool: Tool = {
    name: 'list_dir',
    description: '列出目录内容',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: '目录路径' },
        },
        required: ['path'],
    },
    permission: 'system',
    async execute({ path: dirPath }) {
        if (typeof dirPath !== 'string') {
            return { success: false, error: 'path must be a string' };
        }

        try {
            const resolvedPath = path.resolve(dirPath);
            const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
            const items = entries.map((entry) => ({
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
            }));
            return { success: true, data: items };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to list directory';
            return { success: false, error: message };
        }
    },
};

// 导出所有系统工具
export const systemTools: Tool[] = [openAppTool, openUrlTool, runShellTool, readFileTool, writeFileTool, listDirTool];

