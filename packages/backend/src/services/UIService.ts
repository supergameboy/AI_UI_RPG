import { gameLog } from './GameLogService';
import { DatabaseService } from './DatabaseService';

// ==================== 类型定义 ====================

/**
 * UI 状态
 */
export interface UIState {
  id: string;
  characterId: string;
  panels: {
    [panelId: string]: {
      isOpen: boolean;
      isExpanded: boolean;
      activeTab?: string;
      scrollPosition?: number;
      customState?: Record<string, unknown>;
    };
  };
  dialogs: {
    [dialogId: string]: {
      isOpen: boolean;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      zIndex?: number;
    };
  };
  inputs: {
    [inputId: string]: {
      value: string;
      cursorPosition?: number;
      selection?: { start: number; end: number };
    };
  };
  notifications: NotificationItem[];
  quickBar: {
    slots: QuickBarSlot[];
    activeSlot?: number;
  };
  minimap: {
    zoom: number;
    center: { x: number; y: number };
    showMarkers: string[];
  };
  lastUpdated: number;
}

/**
 * UI 指令
 */
export interface UIInstruction {
  id: string;
  type: 'update' | 'show' | 'hide' | 'animate' | 'notify' | 'dialog' | 'navigate' | 'custom';
  target: string;
  action: string;
  data: Record<string, unknown>;
  options?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    duration?: number;
    easing?: string;
    delay?: number;
  };
  timestamp: number;
}

/**
 * 通知项
 */
export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  actions?: NotificationAction[];
  createdAt: number;
  isRead: boolean;
}

/**
 * 通知动作
 */
export interface NotificationAction {
  label: string;
  action: string;
  data?: Record<string, unknown>;
}

/**
 * 快捷栏槽位
 */
export interface QuickBarSlot {
  index: number;
  type: 'item' | 'skill' | 'action';
  id: string;
  icon?: string;
  label?: string;
  cooldown?: number;
}

/**
 * UI 组件缓存
 */
export interface UIComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  cachedAt: number;
  expiresAt?: number;
}

/**
 * 订阅回调类型
 */
type SubscriptionCallback = (event: UIEvent) => void;

/**
 * UI 事件
 */
export interface UIEvent {
  type: string;
  target?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

/**
 * 默认 UI 状态
 */
const DEFAULT_UI_STATE: Omit<UIState, 'id' | 'characterId'> = {
  panels: {},
  dialogs: {},
  inputs: {},
  notifications: [],
  quickBar: {
    slots: [],
    activeSlot: undefined,
  },
  minimap: {
    zoom: 1,
    center: { x: 0, y: 0 },
    showMarkers: [],
  },
  lastUpdated: Date.now(),
};

/**
 * 默认快捷栏槽位数
 */
const DEFAULT_QUICK_BAR_SIZE = 10;

/**
 * 组件缓存默认过期时间（毫秒）
 */
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000; // 5 分钟

/**
 * 最大通知数量
 */
const MAX_NOTIFICATIONS = 50;

/**
 * 最大指令队列长度
 */
const MAX_INSTRUCTION_QUEUE = 100;

// ==================== UIService ====================

/**
 * UI 服务
 * 负责 UI 状态管理、指令队列、通知系统、组件缓存等
 */
export class UIService {
  private static instance: UIService | null = null;

  // UI 状态缓存：key = `${saveId}:${characterId}`
  private stateCache: Map<string, UIState> = new Map();

  // 指令队列：key = `${saveId}:${characterId}`
  private instructionQueues: Map<string, UIInstruction[]> = new Map();

  // 组件缓存
  private componentCache: Map<string, UIComponent> = new Map();

  // 订阅者
  private subscribers: Map<string, Set<SubscriptionCallback>> = new Map();

  // 通知 ID 计数器
  private notificationIdCounter: number = 0;

  // 指令 ID 计数器
  private instructionIdCounter: number = 0;

  // 是否正在处理指令
  private isProcessing: Map<string, boolean> = new Map();

  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): UIService {
    if (!UIService.instance) {
      UIService.instance = new UIService();
    }
    return UIService.instance;
  }

  // ==================== 状态管理 ====================

  /**
   * 获取 UI 状态
   */
  public getState(saveId: string, characterId: string): UIState {
    const key = `${saveId}:${characterId}`;
    let state: UIState | undefined = this.stateCache.get(key);

    if (!state) {
      // 尝试从数据库加载
      const loadedState = this.loadStateFromDatabase(saveId, characterId);
      if (loadedState) {
        state = loadedState;
      } else {
        // 创建默认状态
        state = {
          ...DEFAULT_UI_STATE,
          id: this.generateStateId(saveId, characterId),
          characterId,
          quickBar: {
            slots: this.createDefaultQuickBarSlots(),
            activeSlot: undefined,
          },
          lastUpdated: Date.now(),
        };
      }
      this.stateCache.set(key, state);
    }

    gameLog.debug('backend', '获取 UI 状态', { saveId, characterId, stateId: state.id });
    return { ...state };
  }

  /**
   * 更新 UI 状态
   */
  public updateState(
    saveId: string,
    characterId: string,
    updates: Partial<UIState>
  ): UIState {
    const key = `${saveId}:${characterId}`;
    const currentState = this.getState(saveId, characterId);

    const newState: UIState = {
      ...currentState,
      ...updates,
      id: currentState.id,
      characterId: currentState.characterId,
      lastUpdated: Date.now(),
    };

    this.stateCache.set(key, newState);
    this.saveStateToDatabase(saveId, newState);

    gameLog.info('backend', '更新 UI 状态', {
      saveId,
      characterId,
      updatedFields: Object.keys(updates),
    });

    // 通知订阅者
    this.notifySubscribers(key, {
      type: 'stateUpdated',
      data: { updates },
      timestamp: Date.now(),
    });

    return { ...newState };
  }

  /**
   * 重置 UI 状态
   */
  public resetState(saveId: string, characterId: string): UIState {
    const key = `${saveId}:${characterId}`;

    const newState: UIState = {
      ...DEFAULT_UI_STATE,
      id: this.generateStateId(saveId, characterId),
      characterId,
      quickBar: {
        slots: this.createDefaultQuickBarSlots(),
        activeSlot: undefined,
      },
      lastUpdated: Date.now(),
    };

    this.stateCache.set(key, newState);
    this.saveStateToDatabase(saveId, newState);

    gameLog.info('backend', '重置 UI 状态', { saveId, characterId });

    // 通知订阅者
    this.notifySubscribers(key, {
      type: 'stateReset',
      timestamp: Date.now(),
    });

    return { ...newState };
  }

  // ==================== 面板管理 ====================

  /**
   * 打开面板
   */
  public openPanel(
    saveId: string,
    characterId: string,
    panelId: string,
    options?: { activeTab?: string; customState?: Record<string, unknown> }
  ): UIState {
    const state = this.getState(saveId, characterId);

    const panelState = {
      isOpen: true,
      isExpanded: state.panels[panelId]?.isExpanded ?? false,
      activeTab: options?.activeTab ?? state.panels[panelId]?.activeTab,
      scrollPosition: state.panels[panelId]?.scrollPosition,
      customState: options?.customState ?? state.panels[panelId]?.customState,
    };

    const newState = this.updateState(saveId, characterId, {
      panels: {
        ...state.panels,
        [panelId]: panelState,
      },
    });

    gameLog.info('backend', '打开面板', { saveId, characterId, panelId, options });

    return newState;
  }

  /**
   * 关闭面板
   */
  public closePanel(saveId: string, characterId: string, panelId: string): UIState {
    const state = this.getState(saveId, characterId);

    if (!state.panels[panelId]) {
      return state;
    }

    const newState = this.updateState(saveId, characterId, {
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          isOpen: false,
        },
      },
    });

    gameLog.info('backend', '关闭面板', { saveId, characterId, panelId });

    return newState;
  }

  /**
   * 切换面板
   */
  public togglePanel(
    saveId: string,
    characterId: string,
    panelId: string,
    options?: { activeTab?: string }
  ): UIState {
    const state = this.getState(saveId, characterId);
    const isCurrentlyOpen = state.panels[panelId]?.isOpen ?? false;

    if (isCurrentlyOpen) {
      return this.closePanel(saveId, characterId, panelId);
    } else {
      return this.openPanel(saveId, characterId, panelId, options);
    }
  }

  /**
   * 设置面板标签页
   */
  public setPanelTab(
    saveId: string,
    characterId: string,
    panelId: string,
    tabId: string
  ): UIState {
    const state = this.getState(saveId, characterId);

    if (!state.panels[panelId]) {
      return this.openPanel(saveId, characterId, panelId, { activeTab: tabId });
    }

    const newState = this.updateState(saveId, characterId, {
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          activeTab: tabId,
        },
      },
    });

    gameLog.debug('backend', '设置面板标签页', { saveId, characterId, panelId, tabId });

    return newState;
  }

  /**
   * 设置面板滚动位置
   */
  public setPanelScrollPosition(
    saveId: string,
    characterId: string,
    panelId: string,
    scrollPosition: number
  ): UIState {
    const state = this.getState(saveId, characterId);

    if (!state.panels[panelId]) {
      return state;
    }

    return this.updateState(saveId, characterId, {
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          scrollPosition,
        },
      },
    });
  }

  // ==================== 指令队列 ====================

  /**
   * 添加指令到队列
   */
  public queueInstruction(
    saveId: string,
    characterId: string,
    instruction: Omit<UIInstruction, 'id' | 'timestamp'>
  ): UIInstruction {
    const key = `${saveId}:${characterId}`;
    let queue = this.instructionQueues.get(key) || [];

    // 检查队列长度
    if (queue.length >= MAX_INSTRUCTION_QUEUE) {
      gameLog.warn('backend', '指令队列已满，移除最旧指令', { saveId, characterId });
      queue = queue.slice(-MAX_INSTRUCTION_QUEUE + 1);
    }

    const fullInstruction: UIInstruction = {
      ...instruction,
      id: this.generateInstructionId(),
      timestamp: Date.now(),
    };

    // 按优先级插入
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const priority = instruction.options?.priority || 'normal';
    const insertIndex = queue.findIndex(
      (item) =>
        (priorityOrder[item.options?.priority || 'normal'] || 2) >
        (priorityOrder[priority] || 2)
    );

    if (insertIndex === -1) {
      queue.push(fullInstruction);
    } else {
      queue.splice(insertIndex, 0, fullInstruction);
    }

    this.instructionQueues.set(key, queue);

    gameLog.debug('backend', '添加 UI 指令到队列', {
      saveId,
      characterId,
      instructionId: fullInstruction.id,
      type: fullInstruction.type,
      priority,
      queueLength: queue.length,
    });

    // 触发处理
    this.processNextInstruction(saveId, characterId);

    return fullInstruction;
  }

  /**
   * 获取指令队列
   */
  public getQueue(saveId: string, characterId: string): UIInstruction[] {
    const key = `${saveId}:${characterId}`;
    return [...(this.instructionQueues.get(key) || [])];
  }

  /**
   * 清空指令队列
   */
  public clearQueue(saveId: string, characterId: string): void {
    const key = `${saveId}:${characterId}`;
    this.instructionQueues.set(key, []);

    gameLog.info('backend', '清空指令队列', { saveId, characterId });
  }

  /**
   * 处理下一条指令
   */
  public async processNextInstruction(
    saveId: string,
    characterId: string
  ): Promise<UIInstruction | null> {
    const key = `${saveId}:${characterId}`;

    // 检查是否正在处理
    if (this.isProcessing.get(key)) {
      return null;
    }

    const queue = this.instructionQueues.get(key) || [];
    if (queue.length === 0) {
      return null;
    }

    this.isProcessing.set(key, true);

    try {
      const instruction = queue.shift()!;
      this.instructionQueues.set(key, queue);

      // 执行指令
      await this.executeInstruction(saveId, characterId, instruction);

      gameLog.debug('backend', '处理 UI 指令', {
        saveId,
        characterId,
        instructionId: instruction.id,
        type: instruction.type,
        remainingQueue: queue.length,
      });

      // 通知订阅者
      this.notifySubscribers(key, {
        type: 'instructionProcessed',
        target: instruction.target,
        data: { instruction },
        timestamp: Date.now(),
      });

      return instruction;
    } finally {
      this.isProcessing.set(key, false);

      // 如果队列还有指令，继续处理
      const remainingQueue = this.instructionQueues.get(key) || [];
      if (remainingQueue.length > 0) {
        // 延迟处理下一条，避免阻塞
        setTimeout(() => {
          this.processNextInstruction(saveId, characterId);
        }, 0);
      }
    }
  }

  /**
   * 执行指令
   */
  private async executeInstruction(
    saveId: string,
    characterId: string,
    instruction: UIInstruction
  ): Promise<void> {
    const { type, target, action, data, options } = instruction;

    // 处理延迟
    if (options?.delay && options.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    switch (type) {
      case 'update':
        this.handleUpdateInstruction(saveId, characterId, target, action, data);
        break;
      case 'show':
        this.handleShowInstruction(saveId, characterId, target, action, data);
        break;
      case 'hide':
        this.handleHideInstruction(saveId, characterId, target, action, data);
        break;
      case 'animate':
        // 动画指令由前端处理，这里只通知
        this.notifySubscribers(`${saveId}:${characterId}`, {
          type: 'animate',
          target,
          data: { action, ...data, options },
          timestamp: Date.now(),
        });
        break;
      case 'notify':
        if (action === 'show' && data.notification) {
          this.showNotification(saveId, characterId, data.notification as Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>);
        }
        break;
      case 'dialog':
        this.handleDialogInstruction(saveId, characterId, target, action, data);
        break;
      case 'navigate':
        // 导航指令由前端处理
        this.notifySubscribers(`${saveId}:${characterId}`, {
          type: 'navigate',
          target,
          data: { action, ...data },
          timestamp: Date.now(),
        });
        break;
      case 'custom':
        // 自定义指令直接通知订阅者
        this.notifySubscribers(`${saveId}:${characterId}`, {
          type: 'custom',
          target,
          data: { action, ...data },
          timestamp: Date.now(),
        });
        break;
    }
  }

  /**
   * 处理更新指令
   */
  private handleUpdateInstruction(
    saveId: string,
    characterId: string,
    target: string,
    _action: string,
    data: Record<string, unknown>
  ): void {
    const state = this.getState(saveId, characterId);

    if (target.startsWith('panel:')) {
      const panelId = target.substring(6);
      const panelState = state.panels[panelId] || { isOpen: false, isExpanded: false };

      this.updateState(saveId, characterId, {
        panels: {
          ...state.panels,
          [panelId]: { ...panelState, ...data },
        },
      });
    } else if (target.startsWith('input:')) {
      const inputId = target.substring(6);
      const inputState = state.inputs[inputId] || { value: '' };

      this.updateState(saveId, characterId, {
        inputs: {
          ...state.inputs,
          [inputId]: { ...inputState, ...data },
        },
      });
    } else if (target === 'minimap') {
      this.updateState(saveId, characterId, {
        minimap: { ...state.minimap, ...data },
      });
    }
  }

  /**
   * 处理显示指令
   */
  private handleShowInstruction(
    saveId: string,
    characterId: string,
    target: string,
    _action: string,
    data: Record<string, unknown>
  ): void {
    if (target.startsWith('panel:')) {
      const panelId = target.substring(6);
      this.openPanel(saveId, characterId, panelId, data as { activeTab?: string });
    } else if (target.startsWith('dialog:')) {
      const dialogId = target.substring(7);
      this.showDialog(saveId, characterId, dialogId, data as { position?: { x: number; y: number }; size?: { width: number; height: number } });
    }
  }

  /**
   * 处理隐藏指令
   */
  private handleHideInstruction(
    saveId: string,
    characterId: string,
    target: string,
    _action: string,
    _data: Record<string, unknown>
  ): void {
    if (target.startsWith('panel:')) {
      const panelId = target.substring(6);
      this.closePanel(saveId, characterId, panelId);
    } else if (target.startsWith('dialog:')) {
      const dialogId = target.substring(7);
      this.hideDialog(saveId, characterId, dialogId);
    }
  }

  /**
   * 处理对话框指令
   */
  private handleDialogInstruction(
    saveId: string,
    characterId: string,
    target: string,
    action: string,
    data: Record<string, unknown>
  ): void {
    if (action === 'show') {
      this.showDialog(saveId, characterId, target, data as { position?: { x: number; y: number }; size?: { width: number; height: number } });
    } else if (action === 'hide') {
      this.hideDialog(saveId, characterId, target);
    } else if (action === 'bringToFront') {
      this.bringToFront(saveId, characterId, target);
    }
  }

  // ==================== 通知管理 ====================

  /**
   * 显示通知
   */
  public showNotification(
    saveId: string,
    characterId: string,
    notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>
  ): NotificationItem {
    const state = this.getState(saveId, characterId);

    // 创建完整通知
    const fullNotification: NotificationItem = {
      ...notification,
      id: this.generateNotificationId(),
      createdAt: Date.now(),
      isRead: false,
    };

    // 添加到列表
    let notifications = [...state.notifications, fullNotification];

    // 限制数量
    if (notifications.length > MAX_NOTIFICATIONS) {
      notifications = notifications.slice(-MAX_NOTIFICATIONS);
    }

    this.updateState(saveId, characterId, { notifications });

    gameLog.info('backend', '显示通知', {
      saveId,
      characterId,
      notificationId: fullNotification.id,
      type: fullNotification.type,
      title: fullNotification.title,
    });

    // 通知订阅者
    this.notifySubscribers(`${saveId}:${characterId}`, {
      type: 'notificationShown',
      data: { notification: fullNotification },
      timestamp: Date.now(),
    });

    return fullNotification;
  }

  /**
   * 关闭通知
   */
  public dismissNotification(
    saveId: string,
    characterId: string,
    notificationId: string
  ): boolean {
    const state = this.getState(saveId, characterId);
    const index = state.notifications.findIndex((n) => n.id === notificationId);

    if (index === -1) {
      return false;
    }

    const notifications = state.notifications.filter((n) => n.id !== notificationId);
    this.updateState(saveId, characterId, { notifications });

    gameLog.debug('backend', '关闭通知', { saveId, characterId, notificationId });

    return true;
  }

  /**
   * 清空所有通知
   */
  public clearNotifications(saveId: string, characterId: string): void {
    this.updateState(saveId, characterId, { notifications: [] });

    gameLog.info('backend', '清空所有通知', { saveId, characterId });
  }

  /**
   * 获取通知列表
   */
  public getNotifications(
    saveId: string,
    characterId: string,
    options?: { unreadOnly?: boolean; type?: NotificationItem['type']; limit?: number }
  ): NotificationItem[] {
    const state = this.getState(saveId, characterId);
    let notifications = [...state.notifications];

    if (options?.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }

    if (options?.type) {
      notifications = notifications.filter((n) => n.type === options.type);
    }

    // 按时间倒序
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * 标记通知为已读
   */
  public markAsRead(
    saveId: string,
    characterId: string,
    notificationId?: string
  ): void {
    const state = this.getState(saveId, characterId);

    if (notificationId) {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      this.updateState(saveId, characterId, { notifications });
    } else {
      // 标记所有为已读
      const notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      this.updateState(saveId, characterId, { notifications });
    }

    gameLog.debug('backend', '标记通知已读', { saveId, characterId, notificationId });
  }

  // ==================== 对话框管理 ====================

  /**
   * 显示对话框
   */
  public showDialog(
    saveId: string,
    characterId: string,
    dialogId: string,
    options?: { position?: { x: number; y: number }; size?: { width: number; height: number } }
  ): UIState {
    const state = this.getState(saveId, characterId);

    // 计算最高 zIndex
    const maxZIndex = Math.max(
      0,
      ...Object.values(state.dialogs).map((d) => d.zIndex || 0)
    );

    const dialogState = {
      isOpen: true,
      position: options?.position,
      size: options?.size,
      zIndex: maxZIndex + 1,
    };

    const newState = this.updateState(saveId, characterId, {
      dialogs: {
        ...state.dialogs,
        [dialogId]: dialogState,
      },
    });

    gameLog.info('backend', '显示对话框', { saveId, characterId, dialogId, options });

    return newState;
  }

  /**
   * 隐藏对话框
   */
  public hideDialog(saveId: string, characterId: string, dialogId: string): UIState {
    const state = this.getState(saveId, characterId);

    if (!state.dialogs[dialogId]) {
      return state;
    }

    const newState = this.updateState(saveId, characterId, {
      dialogs: {
        ...state.dialogs,
        [dialogId]: {
          ...state.dialogs[dialogId],
          isOpen: false,
        },
      },
    });

    gameLog.info('backend', '隐藏对话框', { saveId, characterId, dialogId });

    return newState;
  }

  /**
   * 将对话框置于最前
   */
  public bringToFront(saveId: string, characterId: string, dialogId: string): UIState {
    const state = this.getState(saveId, characterId);

    if (!state.dialogs[dialogId]) {
      return state;
    }

    // 计算最高 zIndex
    const maxZIndex = Math.max(
      ...Object.values(state.dialogs).map((d) => d.zIndex || 0)
    );

    const newState = this.updateState(saveId, characterId, {
      dialogs: {
        ...state.dialogs,
        [dialogId]: {
          ...state.dialogs[dialogId],
          zIndex: maxZIndex + 1,
        },
      },
    });

    return newState;
  }

  // ==================== 组件缓存 ====================

  /**
   * 获取缓存的组件
   */
  public getComponent(componentId: string): UIComponent | null {
    const component = this.componentCache.get(componentId);

    if (!component) {
      return null;
    }

    // 检查是否过期
    if (component.expiresAt && component.expiresAt < Date.now()) {
      this.componentCache.delete(componentId);
      return null;
    }

    return { ...component };
  }

  /**
   * 缓存组件
   */
  public cacheComponent(
    componentId: string,
    type: string,
    props: Record<string, unknown>,
    expiresIn?: number
  ): UIComponent {
    const now = Date.now();
    const component: UIComponent = {
      id: componentId,
      type,
      props,
      cachedAt: now,
      expiresAt: expiresIn ? now + expiresIn : now + DEFAULT_CACHE_EXPIRY,
    };

    this.componentCache.set(componentId, component);

    gameLog.debug('backend', '缓存组件', { componentId, type, expiresIn });

    return { ...component };
  }

  /**
   * 使组件缓存失效
   */
  public invalidateComponent(componentId: string): boolean {
    const existed = this.componentCache.has(componentId);
    this.componentCache.delete(componentId);

    if (existed) {
      gameLog.debug('backend', '组件缓存失效', { componentId });
    }

    return existed;
  }

  /**
   * 清空组件缓存
   */
  public clearCache(): void {
    const size = this.componentCache.size;
    this.componentCache.clear();

    gameLog.info('backend', '清空组件缓存', { clearedCount: size });
  }

  /**
   * 清理过期缓存
   */
  public cleanupExpiredCache(): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.componentCache.entries());
    for (const [id, component] of entries) {
      if (component.expiresAt && component.expiresAt < now) {
        this.componentCache.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      gameLog.info('backend', '清理过期缓存', { cleanedCount: cleaned });
    }

    return cleaned;
  }

  // ==================== 快捷栏管理 ====================

  /**
   * 设置快捷栏槽位
   */
  public setQuickBarSlot(
    saveId: string,
    characterId: string,
    slot: QuickBarSlot
  ): UIState {
    const state = this.getState(saveId, characterId);
    const slots = [...state.quickBar.slots];

    // 确保槽位索引有效
    const index = slot.index;
    if (index < 0 || index >= DEFAULT_QUICK_BAR_SIZE) {
      throw new Error(`Invalid slot index: ${index}`);
    }

    // 更新或添加槽位
    const existingIndex = slots.findIndex((s) => s.index === index);
    if (existingIndex >= 0) {
      slots[existingIndex] = slot;
    } else {
      slots.push(slot);
    }

    const newState = this.updateState(saveId, characterId, {
      quickBar: {
        ...state.quickBar,
        slots,
      },
    });

    gameLog.info('backend', '设置快捷栏槽位', {
      saveId,
      characterId,
      slotIndex: index,
      slotType: slot.type,
      slotId: slot.id,
    });

    return newState;
  }

  /**
   * 清空快捷栏槽位
   */
  public clearQuickBarSlot(
    saveId: string,
    characterId: string,
    index: number
  ): UIState {
    const state = this.getState(saveId, characterId);
    const slots = state.quickBar.slots.filter((s) => s.index !== index);

    const newState = this.updateState(saveId, characterId, {
      quickBar: {
        ...state.quickBar,
        slots,
        activeSlot: state.quickBar.activeSlot === index ? undefined : state.quickBar.activeSlot,
      },
    });

    gameLog.info('backend', '清空快捷栏槽位', { saveId, characterId, slotIndex: index });

    return newState;
  }

  /**
   * 使用快捷栏槽位
   */
  public useQuickBarSlot(
    saveId: string,
    characterId: string,
    index: number
  ): { slot: QuickBarSlot | null; success: boolean } {
    const state = this.getState(saveId, characterId);
    const slot = state.quickBar.slots.find((s) => s.index === index);

    if (!slot) {
      return { slot: null, success: false };
    }

    // 更新活动槽位
    this.updateState(saveId, characterId, {
      quickBar: {
        ...state.quickBar,
        activeSlot: index,
      },
    });

    gameLog.info('backend', '使用快捷栏槽位', {
      saveId,
      characterId,
      slotIndex: index,
      slotType: slot.type,
      slotId: slot.id,
    });

    // 通知订阅者
    this.notifySubscribers(`${saveId}:${characterId}`, {
      type: 'quickBarSlotUsed',
      data: { slot },
      timestamp: Date.now(),
    });

    return { slot, success: true };
  }

  // ==================== 存读档支持 ====================

  /**
   * 序列化状态
   */
  public serializeState(saveId: string, characterId: string): string {
    const state = this.getState(saveId, characterId);

    const serialized = JSON.stringify(state);

    gameLog.debug('backend', '序列化 UI 状态', {
      saveId,
      characterId,
      size: serialized.length,
    });

    return serialized;
  }

  /**
   * 反序列化状态
   */
  public deserializeState(
    saveId: string,
    characterId: string,
    serialized: string
  ): UIState {
    try {
      const state = JSON.parse(serialized) as UIState;

      // 验证必要字段
      if (!state.id || !state.characterId) {
        throw new Error('Invalid state: missing required fields');
      }

      // 确保状态完整
      const completeState: UIState = {
        ...DEFAULT_UI_STATE,
        ...state,
        lastUpdated: Date.now(),
      };

      const key = `${saveId}:${characterId}`;
      this.stateCache.set(key, completeState);
      this.saveStateToDatabase(saveId, completeState);

      gameLog.info('backend', '反序列化 UI 状态', { saveId, characterId, stateId: state.id });

      return { ...completeState };
    } catch (error) {
      gameLog.error('backend', '反序列化 UI 状态失败', {
        saveId,
        characterId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to deserialize UI state');
    }
  }

  // ==================== 订阅机制 ====================

  /**
   * 订阅事件
   */
  public subscribe(
    saveId: string,
    characterId: string,
    callback: SubscriptionCallback
  ): () => void {
    const key = `${saveId}:${characterId}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    gameLog.debug('backend', '订阅 UI 事件', { saveId, characterId });

    // 返回取消订阅函数
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
      gameLog.debug('backend', '取消订阅 UI 事件', { saveId, characterId });
    };
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(key: string, event: UIEvent): void {
    const subscribers = this.subscribers.get(key);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const callbacks = Array.from(subscribers);
    for (const callback of callbacks) {
      try {
        callback(event);
      } catch (error) {
        gameLog.error('backend', '订阅者回调执行失败', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成状态 ID
   */
  private generateStateId(saveId: string, characterId: string): string {
    return `ui_${saveId}_${characterId}`;
  }

  /**
   * 生成通知 ID
   */
  private generateNotificationId(): string {
    this.notificationIdCounter++;
    return `notif_${Date.now()}_${this.notificationIdCounter}`;
  }

  /**
   * 生成指令 ID
   */
  private generateInstructionId(): string {
    this.instructionIdCounter++;
    return `instr_${Date.now()}_${this.instructionIdCounter}`;
  }

  /**
   * 创建默认快捷栏槽位
   */
  private createDefaultQuickBarSlots(): QuickBarSlot[] {
    return [];
  }

  /**
   * 从数据库加载状态
   */
  private loadStateFromDatabase(saveId: string, characterId: string): UIState | null {
    try {
      const db = DatabaseService.getInstance();
      const stmt = db.prepare<{
        ui_state: string;
      }>('SELECT ui_state FROM character_ui_state WHERE save_id = ? AND character_id = ?');

      const result = stmt.get(saveId, characterId);

      if (result && result.ui_state) {
        const state = JSON.parse(result.ui_state) as UIState;
        gameLog.debug('backend', '从数据库加载 UI 状态', { saveId, characterId });
        return state;
      }

      return null;
    } catch (error) {
      gameLog.error('backend', '从数据库加载 UI 状态失败', {
        saveId,
        characterId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * 保存状态到数据库
   */
  private saveStateToDatabase(saveId: string, state: UIState): void {
    try {
      const db = DatabaseService.getInstance();

      // 先尝试更新
      const updateStmt = db.prepare(`
        UPDATE character_ui_state
        SET ui_state = ?, updated_at = ?
        WHERE save_id = ? AND character_id = ?
      `);

      const result = updateStmt.run(
        JSON.stringify(state),
        Date.now(),
        saveId,
        state.characterId
      );

      // 如果没有更新任何行，则插入
      if (result.changes === 0) {
        const insertStmt = db.prepare(`
          INSERT INTO character_ui_state (save_id, character_id, ui_state, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          saveId,
          state.characterId,
          JSON.stringify(state),
          Date.now(),
          Date.now()
        );
      }

      gameLog.debug('backend', '保存 UI 状态到数据库', { saveId, characterId: state.characterId });
    } catch (error) {
      gameLog.error('backend', '保存 UI 状态到数据库失败', {
        saveId,
        characterId: state.characterId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 清理缓存
   */
  public clearAllCache(): void {
    this.stateCache.clear();
    this.instructionQueues.clear();
    this.componentCache.clear();
    this.isProcessing.clear();

    gameLog.info('backend', '清理所有 UI 缓存');
  }
}

// ==================== 单例导出 ====================

let _uiService: UIService | null = null;

/**
 * 获取 UI 服务实例
 */
export function getUIService(): UIService {
  if (!_uiService) {
    _uiService = UIService.getInstance();
  }
  return _uiService;
}

/**
 * 初始化 UI 服务
 */
export function initializeUIService(): UIService {
  return getUIService();
}
