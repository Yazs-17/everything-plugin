import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginDriver } from '../PluginDriver';
import { definePlugin } from '../PluginBase';
import { logger } from '../../utils/logger';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

describe('PluginDriver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if env is not initialized', () => {
    const driver = new PluginDriver<{ count: number }>();
    expect(() => driver.env).toThrowError("[PluginDriver] env has not been initialized.");
  });

  it('should allow setting env via setter', () => {
    const driver = new PluginDriver<{ count: number }>();
    driver.env = { count: 10 };
    expect(driver.env.count).toBe(10);
  });

  it('should register and execute plugins successfully', () => {
    const driver = new PluginDriver<{ count: number }>({ count: 0 }, { debugMode: true });
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

  it('should unregister plugins and trigger destroy', () => {
    const driver = new PluginDriver<{ count: number }>({ count: 0 }, { debugMode: true });
    const destroySpy = vi.fn();
    const eventCleanupSpy = vi.fn();

    const p = definePlugin<{ count: number }>('p1', () => ({
      initializeEventListener: () => eventCleanupSpy,
      destroy: destroySpy
    }));

    driver.batchRegister([p]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('plugins registered: p1'));

    driver.hookInitialize(); 
    
    driver.unregister(p.name);
    expect(destroySpy).toHaveBeenCalled();
    expect(eventCleanupSpy).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('plugin unregistered: p1'));
    
    expect(() => driver.unregister('not-exist')).not.toThrow();
  });

  it('should catch errors when destroying old instances on re-register', () => {
    const driver = new PluginDriver<{ count: number }>({ count: 0 }, { debugMode: true });
    const p1 = definePlugin('p', () => ({}));
    driver.register(p1.name, p1);
    
    // forcefully mock the base instance to throw an error 
    vi.spyOn(driver.plugins.get('p')!, 'destroy').mockImplementation(() => {
      throw new Error('Driver Error');
    });

    driver.register(p1.name, p1); 
    expect(logger.error).toHaveBeenCalledWith('p failed during re-register cleanup.', expect.any(Error));
  });

  it('should catch errors when unregister fails', () => {
    const driver = new PluginDriver<{ count: number }>({ count: 0 });
    const p1 = definePlugin('p', () => ({}));
    driver.register(p1.name, p1);

    vi.spyOn(driver.plugins.get('p')!, 'destroy').mockImplementation(() => {
      throw new Error('Driver Error');
    });

    driver.unregister(p1.name);
    expect(logger.error).toHaveBeenCalledWith('p failed during unregister cleanup.', expect.any(Error));
  });

  it('should sort plugins by priority and dependencies', () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] });
    // p1 depends on p2
    const p1 = definePlugin<{ log: string[] }>('p1', () => ({
      dependencies: ['p2'],
      initialize(env) { env.log.push('p1'); }
    }));
    // p3 high priority
    const p3 = definePlugin<{ log: string[] }>('p3', () => ({
      priority: 10,
      initialize(env) { env.log.push('p3'); }
    }));
    const p2 = definePlugin<{ log: string[] }>('p2', () => ({
      initialize(env) { env.log.push('p2'); }
    }));

    driver.register(p1.name, p1);
    driver.register(p3.name, p3);
    driver.register(p2.name, p2);

    driver.hookInitialize();
    expect(driver.env.log).toEqual(['p3', 'p2', 'p1']);
  });

  it('should warn on missing dependencies', () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] }, { debugMode: true });
    const p1 = definePlugin('p', () => ({
      dependencies: ['missing']
    }));
    driver.register(p1.name, p1);
    expect(logger.warn).toHaveBeenCalledWith('[PluginDriver] Missing dependency: missing (required by p)');
  });

  it('should detect circular dependencies', () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] }, { debugMode: true });
    const p1 = definePlugin('p1', () => ({ dependencies: ['p2'] }));
    const p2 = definePlugin('p2', () => ({ dependencies: ['p1'] }));
    driver.batchRegister([p1, p2]);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Circular dependency detected involving plugin: p1'));
  });

  it('should execute parallel hooks and catch errors', async () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] }, { sequential: false });
    const p1 = definePlugin<{ log: string[] }>('p1', () => ({
      async render(env) { env.log.push('p1'); }
    }));
    const p2 = definePlugin<{ log: string[] }>('p2', () => ({
      async render(_env) { throw new Error('render fail'); }
    }));
    driver.register(p1.name, p1);
    driver.register(p2.name, p2);
    
    await driver.hookRender('render');
    expect(driver.env.log).toContain('p1');
    expect(logger.error).toHaveBeenCalledWith('p2 failed at render.', expect.any(Error));
  });

  it('should execute sequential hooks, handle error, and support Bail-out', async () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] }, { sequential: true, debugMode: true });
    
    const p1 = definePlugin<{ log: string[] }>('p1', () => ({
      async render(env) { env.log.push('p1'); throw new Error('p1 err'); }
    }));
    const p2 = definePlugin<{ log: string[] }>('p2', () => ({
      async render(env) { env.log.push('p2'); return false; } 
    }));
    const p3 = definePlugin<{ log: string[] }>('p3', () => ({
      async render(env) { env.log.push('p3'); }
    }));

    driver.batchRegister([p1, p2, p3]);
    await driver.hookRender('render');
    
    expect(logger.error).toHaveBeenCalledWith('p1 failed at render.', expect.any(Error));
    expect(driver.env.log).toEqual(['p1', 'p2']);
    expect(logger.info).toHaveBeenCalledWith('[PluginDriver] Bail-out at render by p2');
  });

  it('should support waterfall hooks passing data correctly', async () => {
    const driver = new PluginDriver<{ count: number }>({ count: 0 }, { debugMode: true });
    
    const p1 = definePlugin('seq1', () => ({
      render(_env, data: number) { return data + 1; }
    }));
    const pError = definePlugin('err', () => ({
      render(_env, _data: number) { throw new Error('oops'); }
    }));
    const p2 = definePlugin('seq2', () => ({
      render(_env, _data: number) { return false; } 
    }));
    const p3 = definePlugin('seq3', () => ({
      render(_env, data: number) { return data + 10; } 
    }));

    driver.batchRegister([p1, pError, p2, p3]);
    const initData = 10;
    const res = await driver.hookWaterfall('render', initData);
    
    expect(logger.error).toHaveBeenCalledWith('err failed at render (Waterfall).', expect.any(Error));
    expect(logger.info).toHaveBeenCalledWith('[PluginDriver] Bail-out at render by seq2 in Waterfall');
    
    expect(res).toBe(11);
  });

  it('should support syncing lifecycle and cleanup inner errors', () => {
    const driver = new PluginDriver<{ log: string[] }>({ log: [] }, { debugMode: true });
    
    const p1 = definePlugin('p1', () => ({
      initialize() { throw new Error('Init err'); },
      destroy() { },
    }));
    
    driver.register(p1.name, p1);
    driver.hookInitialize();
    expect(logger.error).toHaveBeenCalledWith('p1 failed at initialize.', expect.any(Error));
    
    const p2 = definePlugin('p2', () => ({
      initialize() { return false; } 
    }));
    const p3 = definePlugin('p3', () => ({
      initialize() {} 
    }));
    driver.register(p2.name, p2);
    driver.register(p3.name, p3);
    
    driver.hookInitialize();
    expect(logger.info).toHaveBeenCalledWith('[PluginDriver] Bail-out at initialize by p2');

    driver.hookDestroy();
  });
  
  it('PluginBase: coverage for cleanup errors', () => {
    const p = definePlugin('base', () => ({
      initializeEventListener() {
        return () => { throw new Error('cleanup err'); };
      }
    }));
    p.initialize({} as any);
    p.destroy({} as any);
    expect(logger.error).toHaveBeenCalledWith('base failed during cleanup.', expect.any(Error));
  });

  it('PluginBase: test render hooks fallback', () => {
    const p = definePlugin('empty', () => ({}));
    expect(p.renderBefore({} as any)).toBeUndefined();
    expect(p.render({} as any)).toBeUndefined();
    expect(p.renderAfter({} as any)).toBeUndefined();
  });
});
