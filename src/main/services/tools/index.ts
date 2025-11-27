/**
 * Tools Module
 * 注册所有工具
 */

import { toolRegistry } from './registry';
import { basicTools } from './basic';
import { systemTools } from './system';

export function registerAllTools(): void {
  // 注册基础工具
  for (const tool of basicTools) {
    toolRegistry.register(tool);
  }

  // 注册系统工具
  for (const tool of systemTools) {
    toolRegistry.register(tool);
  }

  console.log(`Registered ${toolRegistry.getAll().length} tools`);
}

export { toolRegistry, ToolRegistry } from './registry';
export type { Tool } from './registry';

