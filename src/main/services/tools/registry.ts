/**
 * Tool Registry
 * 工具注册中心，管理所有可用工具
 */

import type { ToolPermission, ToolResult, ToolDefinition } from '../../../shared/types';

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  permission: ToolPermission;
  execute(params: Record<string, unknown>): Promise<ToolResult>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" already registered, overwriting...`);
    }
    this.tools.set(tool.name, tool);
    console.log(`Tool registered: ${tool.name}`);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getDefinitions(): ToolDefinition[] {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return { success: false, error: `Tool "${name}" not found` };
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

// 全局单例
export const toolRegistry = new ToolRegistry();

