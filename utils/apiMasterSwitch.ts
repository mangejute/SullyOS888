/**
 * API 总开关。
 *
 * 用途：测试导入数据时，避免后台主动消息 / 日程 / 家园 / 命运抉择等
 * 自动流程在没人看的情况下反复调用 LLM、白花钱。
 *
 * 关闭时所有走 utils/safeApi.ts: safeFetchJson 的请求一律 throw
 * （带 code: 'API_MASTER_DISABLED'），让上层 try/catch 接住正常报错。
 *
 * 一个出口 = 一处拦截。LLM / TTS / 生图 / 识图 / 嵌入 / 联网代理
 * 全部走 safeFetchJson，关闭这一把等于一键断网，但浏览器自身的
 * 静态资源、Service Worker、IndexedDB 不受影响。
 *
 * 默认开启：不主动改用户现有行为；只有用户进设置明确关掉才拦截。
 */

const STORAGE_KEY = 'os_api_master_enabled';
const CHANGE_EVENT = 'os_api_master_change';

/** Error 上挂的稳定 code，便于调用方区分「被开关拦截」和真实 API 失败。 */
export const API_MASTER_DISABLED_CODE = 'API_MASTER_DISABLED';

/** 拦截时 throw 的 Error 形如「API 总开关已关闭（系统设置 → API 总开关）」 */
export class ApiMasterDisabledError extends Error {
    code: string;
    constructor() {
        super('API 总开关已关闭（系统设置 → API 总开关）');
        this.name = 'ApiMasterDisabledError';
        this.code = API_MASTER_DISABLED_CODE;
    }
}

/** 读取开关状态。localStorage 不可用或没设过 → 默认开启。 */
export function isApiMasterEnabled(): boolean {
    if (typeof localStorage === 'undefined') return true;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        // 没设过 = 开启；只有显式存 '0' 才视为关闭
        return raw !== '0';
    } catch {
        return true;
    }
}

/** 写入开关状态并广播 change 事件（当前标签页 + 跨标签页同步）。 */
export function setApiMasterEnabled(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
        // 写不进去就算了：本会话内的开关状态由调用方的 React state 保证，
        // 下次启动回落到默认值。不为此打断用户。
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { enabled } }));
    }
}

/**
 * 订阅开关变化。返回退订函数。
 * 同时监听当前标签页的 change 事件和其他标签页的 storage 事件。
 */
export function onApiMasterChange(listener: (enabled: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const localHandler = (e: Event) => {
        const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
        if (detail && typeof detail.enabled === 'boolean') listener(detail.enabled);
    };
    const storageHandler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) listener(e.newValue !== '0');
    };
    window.addEventListener(CHANGE_EVENT, localHandler);
    window.addEventListener('storage', storageHandler);
    return () => {
        window.removeEventListener(CHANGE_EVENT, localHandler);
        window.removeEventListener('storage', storageHandler);
    };
}
