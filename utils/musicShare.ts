/**
 * 音乐 App 和 Chat 是两个独立界面。分享完成后留下一个短暂的待回复标记，
 * Chat 打开对应角色时读取它并走现有 AI 回复流程。
 */
const PENDING_KEY = 'sully_music_share_reply_pending_v1';

type PendingMap = Record<string, number>;

const readPending = (): PendingMap => {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
    return value && typeof value === 'object' ? value as PendingMap : {};
  } catch {
    return {};
  }
};

const writePending = (pending: PendingMap) => {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
};

export const markPendingMusicShareReply = (charId: string, messageId: number) => {
  const pending = readPending();
  pending[charId] = messageId;
  writePending(pending);
};

export const peekPendingMusicShareReply = (charId: string): number | null => {
  const value = readPending()[charId];
  return Number.isFinite(value) ? value : null;
};

export const consumePendingMusicShareReply = (charId: string): number | null => {
  const pending = readPending();
  const value = Number.isFinite(pending[charId]) ? pending[charId] : null;
  if (value !== null) {
    delete pending[charId];
    writePending(pending);
  }
  return value;
};
