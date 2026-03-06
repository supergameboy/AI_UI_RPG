import type { ToolCallContext, ToolResponse } from '@ai-rpg/shared';
import type { ToolBase } from '../tools/ToolBase';
import { gameLog } from '../services/GameLogService';

export type ToolMethodDecorator = (
  target: ToolBase,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<ToolResponse<unknown>>>
) => TypedPropertyDescriptor<(...args: unknown[]) => Promise<ToolResponse<unknown>>>;

export interface ToolPermissionOptions {
  requireWrite?: boolean;
  requireAgent?: string[];
  logAccess?: boolean;
}

export function checkPermission(
  context: ToolCallContext,
  isWrite: boolean
): { allowed: boolean; reason?: string } {
  if (isWrite && context.permission === 'read') {
    return {
      allowed: false,
      reason: `Write operation not allowed with permission '${context.permission}'`,
    };
  }

  return { allowed: true };
}

export function toolMethod(
  options: ToolPermissionOptions = {}
): ToolMethodDecorator {
  return (
    target: ToolBase,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<ToolResponse<unknown>>>
  ) => {
    const originalMethod = descriptor.value;

    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = async function (
      this: ToolBase,
      ...args: unknown[]
    ): Promise<ToolResponse<unknown>> {
      const context = args[1] as ToolCallContext | undefined;

      if (!context) {
        return {
          success: false,
          error: {
            code: 'MISSING_CONTEXT',
            message: 'Tool method called without context',
          },
        };
      }

      const isWrite = options.requireWrite ?? !target.isReadMethod(propertyKey);
      const permissionCheck = checkPermission(context, isWrite);

      if (!permissionCheck.allowed) {
        if (options.logAccess !== false) {
          gameLog.warn('backend', 'Tool permission denied', {
            tool: target.type,
            method: propertyKey,
            agentId: context.agentId,
            permission: context.permission,
            isWrite,
            reason: permissionCheck.reason,
          });
        }

        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: permissionCheck.reason ?? 'Permission denied',
            details: {
              tool: target.type,
              method: propertyKey,
              requiredPermission: isWrite ? 'write' : 'read',
              actualPermission: context.permission,
            },
          },
        };
      }

      if (options.requireAgent && options.requireAgent.length > 0) {
        if (!options.requireAgent.includes(context.agentId)) {
          if (options.logAccess !== false) {
            gameLog.warn('backend', 'Tool agent access denied', {
              tool: target.type,
              method: propertyKey,
              agentId: context.agentId,
              allowedAgents: options.requireAgent,
            });
          }

          return {
            success: false,
            error: {
              code: 'AGENT_ACCESS_DENIED',
              message: `Agent '${context.agentId}' is not allowed to call this method`,
              details: {
                tool: target.type,
                method: propertyKey,
                allowedAgents: options.requireAgent,
              },
            },
          };
        }
      }

      if (options.logAccess !== false) {
        gameLog.debug('backend', 'Tool method called', {
          tool: target.type,
          method: propertyKey,
          agentId: context.agentId,
          isWrite,
          requestId: context.requestId,
        });
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function readOnly(): ToolMethodDecorator {
  return toolMethod({ requireWrite: false });
}

export function writeOnly(): ToolMethodDecorator {
  return toolMethod({ requireWrite: true });
}

export function restrictedTo(...agents: string[]): ToolMethodDecorator {
  return toolMethod({ requireAgent: agents });
}

export class ToolPermissionManager {
  private static instance: ToolPermissionManager | null = null;

  private writePermissions: Map<string, Set<string>> = new Map();

  private constructor() {}

  static getInstance(): ToolPermissionManager {
    if (!ToolPermissionManager.instance) {
      ToolPermissionManager.instance = new ToolPermissionManager();
    }
    return ToolPermissionManager.instance;
  }

  grantWritePermission(toolType: string, agentId: string): void {
    if (!this.writePermissions.has(toolType)) {
      this.writePermissions.set(toolType, new Set());
    }
    this.writePermissions.get(toolType)!.add(agentId);

    gameLog.debug('backend', 'Write permission granted', { toolType, agentId });
  }

  revokeWritePermission(toolType: string, agentId: string): void {
    const permissions = this.writePermissions.get(toolType);
    if (permissions) {
      permissions.delete(agentId);
    }

    gameLog.debug('backend', 'Write permission revoked', { toolType, agentId });
  }

  hasWritePermission(toolType: string, agentId: string): boolean {
    const permissions = this.writePermissions.get(toolType);
    return permissions?.has(agentId) ?? false;
  }

  getAgentsWithWritePermission(toolType: string): string[] {
    const permissions = this.writePermissions.get(toolType);
    return permissions ? Array.from(permissions) : [];
  }

  clearPermissions(): void {
    this.writePermissions.clear();
    gameLog.debug('backend', 'All tool permissions cleared');
  }
}

export function getToolPermissionManager(): ToolPermissionManager {
  return ToolPermissionManager.getInstance();
}
