/**
 * Keep-Alive utility — signals the Service Worker to prevent background suspension
 * during long-running AI API calls (especially on mobile / Capacitor).
 *
 * Usage:
 *   import { KeepAlive } from '../utils/keepAlive';
 *
 *   KeepAlive.start();   // before API call
 *   await fetch(...);
 *   KeepAlive.stop();    // after API call completes
 */

let registered = false;

async function ensureRegistered(): Promise<void> {
  if (registered || !('serviceWorker' in navigator)) return;
  try {
    const base = import.meta.env.BASE_URL || '/';
    const scriptUrl = base + 'sw-keep-alive.js';
    // updateViaCache: 'none' 防止手机长期复用旧 sw-keep-alive.js。
    // GitHub Pages 更新后，下次打开或点击“刷新版本”都会重新检查 worker 脚本。
    const reg = await navigator.serviceWorker.register(scriptUrl, { scope: base, updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
    registered = true;
    console.log('[KeepAlive] Service Worker registered', reg.scope);
  } catch (e) {
    console.warn('[KeepAlive] SW registration failed, keep-alive disabled:', e);
  }
}

function postToSW(msg: { type: string }) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage(msg);
}

export const KeepAlive = {
  /** Register the SW on app startup (idempotent, call early). */
  init: ensureRegistered,

  /** Signal that a long-running request is starting. */
  async start() {
    await ensureRegistered();
    postToSW({ type: 'keepalive-start' });
  },

  /** Signal that the request has finished. */
  stop() {
    postToSW({ type: 'keepalive-stop' });
  },

  /**
   * Force re-register the SW. 调用方 (深度重置订阅) 已经先 unregister 了旧 SW;
   * 这里只负责把内部 `registered` flag 清掉再走一遍 ensureRegistered, 否则
   * 老的 idempotent guard 会以为 "已注册" 直接 return.
   */
  async reregister() {
    registered = false;
    await ensureRegistered();
  },
};

/**
 * 设置页“刷新版本”调用：不清理用户数据，只请求浏览器重新检查当前站点的 Service Worker。
 */
export async function refreshServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const base = import.meta.env.BASE_URL || '/';
    const scriptUrl = base + 'sw-keep-alive.js';
    const registration = await navigator.serviceWorker.register(scriptUrl, {
      scope: base,
      updateViaCache: 'none',
    });
    await registration.update();
  } catch (error) {
    // 页面资源仍会用 URL 缓存参数刷新；SW 更新失败不阻止用户拿到新页面。
    console.warn('[KeepAlive] SW update check failed:', error);
  }
}
