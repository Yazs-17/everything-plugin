import { describe, it, expect, vi } from 'vitest';
import { PluginDriver } from '../PluginDriver';
import { definePlugin } from '../PluginBase';

describe('PluginDriver', () => {
  it('should register and execute plugins successfully', () => {
    const driver = new PluginDriver<{ count: number }>({ count: 0 });
    const initSpy = vi.fn();

    const testPlugin = definePlugin<{ count: number }>('test-plugin', () => ({
      initialize(env) {
        env.count++;
        initSpy(env.count);
      }
    }));

    driver.register(testPlugin.name, testPlugin);
    driver.hookInitialize();

    expect(driver.env.count).toBe(1);
    expect(initSpy).toHaveBeenCalledWith(1);
  });

  it('should support Bail-out in synchronous hooks', () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] });

    const pluginA = definePlugin<{ log: string[] }>('plugin-a', () => ({
      initialize(env) {
        env.log.push('a');
        return false; // Bail-out
      }
    }));

    const pluginB = definePlugin<{ log: string[] }>('plugin-b', () => ({
      initialize(env) {
        env.log.push('b');
      }
    }));

    driver.register(pluginA.name, pluginA);
    driver.register(pluginB.name, pluginB);
    
    driver.hookInitialize();

    // plugin-b 应该被阻断，未执行
    expect(driver.env.log).toEqual(['a']);
  });

  it('should support Bail-out in sequential asynchronous hooks', async () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] }, { sequential: true });

    const pluginA = definePlugin<{ log: string[] }>('plugin-a', () => ({
      async render(env) {
        env.log.push('async-a');
        await new Promise(r => setTimeout(r, 10));
        return false; // Bail-out
      }
    }));

    const pluginB = definePlugin<{ log: string[] }>('plugin-b', () => ({
      async render(env) {
        env.log.push('async-b');
      }
    }));

    driver.register(pluginA.name, pluginA);
    driver.register(pluginB.name, pluginB);
    
    await driver.hookRender('render');

    // plugin-b 的 render 阶段应该被阻断，未执行
    expect(driver.env.log).toEqual(['async-a']);
  });
});
