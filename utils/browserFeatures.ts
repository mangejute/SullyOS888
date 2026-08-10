const KEEP_ALIVE_KEY = 'sully_background_keep_alive_enabled';
const NOTIFICATIONS_KEY = 'sully_browser_notifications_enabled';

let keepAliveAudio: HTMLAudioElement | null = null;
let keepAliveUrl: string | null = null;

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
    // 8-bit PCM silence is centered at 128.
    new Uint8Array(buffer, 44).fill(128);
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

export const startBackgroundKeepAlive = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
    if (!keepAliveAudio) {
        keepAliveUrl = makeSilentWavUrl();
        keepAliveAudio = new Audio(keepAliveUrl);
        keepAliveAudio.loop = true;
        keepAliveAudio.volume = 0.01;
        keepAliveAudio.preload = 'auto';
    }
    try {
        await keepAliveAudio.play();
        return true;
    } catch {
        return false;
    }
};

export const stopBackgroundKeepAlive = (): void => {
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
