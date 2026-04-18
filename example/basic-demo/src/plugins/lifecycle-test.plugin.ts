import { definePlugin } from "../../../../src";
import { EnvExecutor } from "../core/Executor";

export const lifecycleTestPlugin = definePlugin<EnvExecutor>('lifecycle-test-plugin', () => {
  let tickCount = 0;
  let intervalId: number;

  return {
    
    // 测试同步初始化
    initialize(env: EnvExecutor) {
      console.log(`[Plugin:lifecycle-test] 🟩 initialize() called. Env state:`, env.state);
      env.state['testPluginReady'] = true;
      
      // 测试 DOM 操作
      const hint = document.createElement('div');
      hint.id = 'lifecycle-hint';
      hint.style.cssText = 'position: fixed; top: 10px; right: 10px; background: black; color: lime; padding: 10px; z-index: 9999;';
      hint.textContent = 'Lifecycle Test Plugin Running';
      document.body.appendChild(hint);
    },

    // 测试事件监听与自动清理机制 (destroyList)
    initializeEventListener(_env: EnvExecutor) {
      console.log(`[Plugin:lifecycle-test] 🎧 initializeEventListener() called.`);
      
      const onResize = () => {
        console.log(`[Plugin:lifecycle-test] Window resized!`);
      };
      
      window.addEventListener('resize', onResize);
      
      // 模拟一个需要手动销毁的定时器
      intervalId = window.setInterval(() => {
        console.log(`[Plugin:lifecycle-test] Background tick...`);
      }, 5000);

      // 返回清理函数
      return () => {
        console.log(`[Plugin:lifecycle-test] 🧹 Cleanup function executed! (Removing listeners and intervals)`);
        window.removeEventListener('resize', onResize);
        clearInterval(intervalId);
        
        // 清理 DOM
        const hint = document.getElementById('lifecycle-hint');
        if (hint) hint.remove();
      };
    },

    // 测试渲染前钩子
    renderBefore(_env: EnvExecutor) {
      tickCount++;
      if (tickCount % 60 === 0) { // 大约每秒打印一次
        console.log(`[Plugin:lifecycle-test] ⏳ renderBefore() - Frame: ${tickCount}`);
      }
    },

    // 测试异步渲染钩子与异常捕获
    async render(_env: EnvExecutor) {
      if (tickCount % 60 === 0) {
        console.log(`[Plugin:lifecycle-test] 🔄 render() - Simulated async work...`);
        await new Promise(resolve => setTimeout(resolve, 5)); // 模拟微小的异步任务
        
        // 模拟一个偶尔发生的错误以测试 Error Boundary
        if (tickCount === 180) { 
          throw new Error('Simulated random render error! (Should be caught by PluginDriver)');
        }
      }
    },

    // 测试渲染后钩子
    renderAfter(env: EnvExecutor) {
      if (tickCount % 60 === 0) {
        console.log(`[Plugin:lifecycle-test] ⌛ renderAfter() - Frame finished.`);
      }
      
      // 模拟自动卸载机制测试 (运行200帧后销毁自己)
      if (tickCount === 200) {
        console.log(`[Plugin:lifecycle-test] 🛑 Self-destruct sequence initiated at frame 200.`);
        env.pluginDriver.unregister('lifecycle-test-plugin');
      }
    },

    // 测试销毁钩子
    destroy(env: EnvExecutor) {
      console.log(`[Plugin:lifecycle-test] 🟥 destroy() called. Final state cleanup.`);
      delete env.state['testPluginReady'];
    }
  };
});
