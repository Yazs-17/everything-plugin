import { QuillCodeEnv, EventBusService, EventCallback } from "./types";
import { PluginDriver } from "@yazs/everything-plugin";

class EventBus implements EventBusService {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  emit(event: string, payload?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(payload);
      }
    }
  }
}

export function createEnv(rootElement: HTMLElement): QuillCodeEnv {
  return {
    services: {
      eventBus: new EventBus()
    },
    ui: {
      root: rootElement
    },
    state: {
      currentNoteId: null,
      notes: []
    }
  };
}

export class QuillCodeApp {
  driver: PluginDriver<QuillCodeEnv>;

  constructor(env: QuillCodeEnv) {
    this.driver = new PluginDriver<QuillCodeEnv>(env, { debugMode: true });
  }

  registerPlugins(plugins: any[]) {
    this.driver.batchRegister(plugins);
  }

  async start() {
    this.driver.hookInitialize();
    await this.driver.hookRender('renderBefore');
    await this.driver.hookRender('render');
    await this.driver.hookRender('renderAfter');
  }
  
  stop() {
    this.driver.hookDestroy();
  }
}
