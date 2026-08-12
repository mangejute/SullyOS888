const KEEP_ALIVE_KEY = 'sully_background_keep_alive_enabled';
const NOTIFICATIONS_KEY = 'sully_browser_notifications_enabled';

let keepAliveAudio: HTMLAudioElement | null = null;
let keepAliveUrl: string | null = null;
let keepAliveWatchdog: number | null = null;
let keepAliveRecoveryInstalled = false;
let keepAliveRestartTimer: number | null = null;

const readFlag = (key: string): boolean => {
    try { return localStorage.getItem(key) === 'true'; } catch { return false; }
};

export const isBackgroundKeepAliveEnabled = (): boolean => readFlag(KEEP_ALIVE_KEY);
export const isBrowserNotificationsEnabled = (): boolean => readFlag(NOTIFICATIONS_KEY);

const makeSilentWavUrl = (): string => {
    const sampleRate = 8000;
    const seconds = 10;
    const dataSize = sampleRate * seconds;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const write = (offset: number, value: string) => {
        for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };
    write(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); write(8, 'WAVE');
    write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true); view.setUint16(32, 1, true);
    view.setUint16(34, 8, true); write(36, 'data'); view.setUint32(40, dataSize, true);
    // 纯数字静音会被部分移动浏览器当作无效媒体而暂停。这里使用极低振幅的 19Hz
    // 音色，再配合 1% 音量，正常人耳几乎听不到，但浏览器会把它识别为真实播放。
    const samples = new Uint8Array(buffer, 44);
    for (let i = 0; i < samples.length; i++) {
        samples[i] = 128 + Math.round(Math.sin((2 * Math.PI * 19 * i) / sampleRate) * 6);
    }
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

const clearRestartTimer = () => {
    if (keepAliveRestartTimer !== null) window.clearTimeout(keepAliveRestartTimer);
    keepAliveRestartTimer = null;
};

const scheduleKeepAliveRestart = (delay = 1200) => {
    if (!isBackgroundKeepAliveEnabled() || keepAliveRestartTimer !== null || typeof window === 'undefined') return;
    keepAliveRestartTimer = window.setTimeout(() => {
        keepAliveRestartTimer = null;
        void startBackgroundKeepAlive();
    }, delay);
};

const startKeepAliveWatchdog = () => {
    if (keepAliveWatchdog !== null || typeof window === 'undefined') return;
    keepAliveWatchdog = window.setInterval(() => {
        if (!isBackgroundKeepAliveEnabled() || !keepAliveAudio || (!keepAliveAudio.paused && !keepAliveAudio.ended)) return;
        void startBackgroundKeepAlive();
    }, 15000);
};

const stopKeepAliveWatchdog = () => {
    if (keepAliveWatchdog !== null) window.clearInterval(keepAliveWatchdog);
    keepAliveWatchdog = null;
};

const installAudioRecoveryHandlers = (audio: HTMLAudioElement) => {
    const recover = () => scheduleKeepAliveRestart();
    audio.addEventListener('pause', recover);
    audio.addEventListener('ended', recover);
    audio.addEventListener('stalled', recover);
    audio.addEventListener('suspend', recover);
    audio.addEventListener('error', recover);
};

/** 页面重新打开或从后台回来时，恢复用户已经开启的后台保活。 */
export const installBackgroundKeepAliveRecovery = (): void => {
    if (keepAliveRecoveryInstalled || typeof window === 'undefined') return;
    keepAliveRecoveryInstalled = true;
    const recover = () => {
        if (isBackgroundKeepAliveEnabled()) void startBackgroundKeepAlive();
    };
    window.addEventListener('pageshow', recover);
    window.addEventListener('focus', recover);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') recover();
    });
    // 自动播放策略下，重新打开 PWA 后第一次用户操作是最可靠的恢复时机。
    document.addEventListener('pointerdown', recover, { passive: true });
};

/** 启动时读取已保存的开关状态；失败不会关闭开关，会等页面恢复或下一次触摸继续重试。 */
export const restoreBackgroundKeepAlive = (): void => {
    installBackgroundKeepAliveRecovery();
    if (isBackgroundKeepAliveEnabled()) void startBackgroundKeepAlive();
};

export const startBackgroundKeepAlive = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
    installBackgroundKeepAliveRecovery();
    if (!keepAliveAudio) {
        keepAliveUrl = makeSilentWavUrl();
        keepAliveAudio = new Audio(keepAliveUrl);
        keepAliveAudio.loop = true;
        keepAliveAudio.volume = 0.01;
        keepAliveAudio.preload = 'auto';
        keepAliveAudio.muted = false;
        keepAliveAudio.setAttribute('playsinline', '');
        installAudioRecoveryHandlers(keepAliveAudio);
    }
    try {
        await keepAliveAudio.play();
        clearRestartTimer();
        startKeepAliveWatchdog();
        return true;
    } catch {
        scheduleKeepAliveRestart(5000);
        return false;
    }
};

export const stopBackgroundKeepAlive = (): void => {
    clearRestartTimer();
    stopKeepAliveWatchdog();
    if (keepAliveAudio) {
        keepAliveAudio.pause();
        keepAliveAudio.removeAttribute('src');
        keepAliveAudio.load();
        keepAliveAudio = null;
    }
    if (keepAliveUrl) URL.revokeObjectURL(keepAliveUrl);
    keepAliveUrl = null;
};

export const setBackgroundKeepAlive = async (enabled: boolean): Promise<boolean> => {
    try { localStorage.setItem(KEEP_ALIVE_KEY, String(enabled)); } catch { /* ignore */ }
    if (enabled) return startBackgroundKeepAlive();
    stopBackgroundKeepAlive();
    return true;
};

export const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

export const requestBrowserNotifications = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const permission = await Notification.requestPermission();
    try { localStorage.setItem(NOTIFICATIONS_KEY, String(permission === 'granted')); } catch { /* ignore */ }
    return permission;
};

export const setBrowserNotificationsEnabled = (enabled: boolean): void => {
    try { localStorage.setItem(NOTIFICATIONS_KEY, String(enabled)); } catch { /* ignore */ }
};

export const showCharacterNotification = async (args: {
    charId: string;
    charName: string;
    body: string;
    avatar?: string;
    /** 每条角色消息的稳定身份；不传时自动生成，确保通知不会互相覆盖。 */
    notificationId?: string | number;
}): Promise<boolean> => {
    if (!isBrowserNotificationsEnabled() || getBrowserNotificationPermission() !== 'granted') return false;
    const icon = args.avatar || './icons/icon-192.png';
    // Notification 的 tag 相同会让浏览器用后一条替换前一条。角色一轮可能有多条气泡，
    // 因此必须按消息而非按角色区分 tag，才能做到「发一条，弹一条」。
    const tagSuffix = args.notificationId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(args.charName, {
                body: args.body,
                icon,
                badge: './icons/icon-192.png',
                tag: `character-${args.charId}-${tagSuffix}`,
                renotify: true,
                data: { charId: args.charId },
            });
            return true;
        }
        const notification = new Notification(args.charName, { body: args.body, icon });
        notification.onclick = () => window.focus();
        return true;
    } catch {
        return false;
    }
};
